"use client";

import { useEffect, useState } from "react";
import { Archive, FolderPlus, Pencil, Plus } from "lucide-react";

import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import SearchField from "@/components/ui/search-field";
import Select from "@/components/ui/select";
import Skeleton from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import DataView from "@/components/workspace/data-view";
import { ErrorState, InlineError } from "@/components/workspace/error-state";
import { FilterChips } from "@/components/workspace/filter-chips";
import PageHeader from "@/components/workspace/page-header";
import PageToolbar from "@/components/workspace/page-toolbar";
import ProjectFormDialog from "@/components/project/project-form-dialog";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatAmount, formatDateRange, pluralise } from "@/lib/format";
import { toStatusOptions } from "@/lib/domain/status";
import {
  PROJECT_STATUSES,
  projectsService,
  type Project,
  type ProjectStatus,
} from "@/services/projects.service";
import { clientsService, type Client } from "@/services/clients.service";
import {
  deliverablesService,
  type Deliverable,
} from "@/services/deliverables.service";
import { tasksService, type Task } from "@/services/tasks.service";

const PROJECT_STATUS_OPTIONS = toStatusOptions(PROJECT_STATUSES);

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  /** Only used for counts in the archive confirmation. Failing to load them
   *  degrades that confirmation rather than the page. */
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all",
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    id: string;
    action: "status" | "archive";
  } | null>(null);

  const [archiveTarget, setArchiveTarget] = useState<Project | null>(null);

  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      // A project can reference a client, so the picker needs the client list.
      // Its failure must not stop the project list from rendering.
      const [projectData, clientData] = await Promise.all([
        projectsService.list(),
        clientsService.getAll().catch(() => [] as Client[]),
      ]);

      setProjects(projectData);
      setClients(clientData);

      // Counts only. These are deliberately fire-and-forget: the page is already
      // usable, and a slow or failing counts request must not hold it back.
      void tasksService
        .list()
        .then(setTasks)
        .catch(() => undefined);
      void deliverablesService
        .list()
        .then(setDeliverables)
        .catch(() => undefined);
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await load();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const archiving = pending?.action === "archive";

  const clientName = (clientId?: string | null) =>
    clients.find((client) => client.id === clientId)?.name ?? null;

  /*
   * Filtering runs over the list the page has already loaded. There is no search
   * endpoint, so this narrows what is on screen rather than querying the server.
   */
  const needle = query.trim().toLowerCase();

  const visible = projects.filter((project) => {
    if (statusFilter !== "all" && project.status !== statusFilter) return false;

    if (!needle) return true;

    const haystack = [
      project.name,
      project.description,
      clientName(project.clientId),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });

  /** What archiving would leave behind on the other list pages. */
  const archiveImpact = (projectId: string) => ({
    tasks: tasks.filter((task) => task.projectId === projectId).length,
    deliverables: deliverables.filter(
      (deliverable) => deliverable.projectId === projectId,
    ).length,
  });

  const impact = archiveTarget ? archiveImpact(archiveTarget.id) : null;

  const openCreate = () => {
    setEditing(null);
    setActionError(null);
    setOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setActionError(null);
    setOpen(true);
  };

  const updateStatus = async (project: Project, status: ProjectStatus) => {
    const previous = project;

    setActionError(null);
    setProjects((prev) =>
      prev.map((item) => (item.id === project.id ? { ...item, status } : item)),
    );

    try {
      setPending({ id: project.id, action: "status" });

      const updated = await projectsService.update(project.id, { status });

      setProjects((prev) =>
        prev.map((item) => (item.id === project.id ? updated : item)),
      );
    } catch (error) {
      setProjects((prev) =>
        prev.map((item) => (item.id === project.id ? previous : item)),
      );

      const description = getApiErrorMessage(error);

      setActionError(description);
      toast({ tone: "error", title: "Could not change status", description });
    } finally {
      setPending(null);
    }
  };

  const archive = async (project: Project) => {
    setActionError(null);

    try {
      setPending({ id: project.id, action: "archive" });

      await projectsService.archive(project.id);

      setProjects((prev) => prev.filter((item) => item.id !== project.id));
      setArchiveTarget(null);
      toast({
        tone: "success",
        title: "Project archived",
        description: project.name,
      });
    } catch (error) {
      const description = getApiErrorMessage(error);

      setActionError(description);
      setArchiveTarget(null);
      toast({ tone: "error", title: "Could not archive project", description });
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <PageHeader
          title="Projects"
          description="Every commission in the practice, live and archived."
          actions={
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              New project
            </Button>
          }
        />

        {actionError && (
          <InlineError
            title="Action failed"
            detail={actionError}
            className="mt-5"
          />
        )}

        {loading ? (
          <ProjectSkeleton />
        ) : loadError && projects.length === 0 ? (
          <ErrorState
            title="Couldn't load projects"
            description="We couldn't retrieve your projects right now."
            detail={loadError}
            onRetry={load}
            className="border-t border-line"
          />
        ) : projects.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<FolderPlus className="size-4" aria-hidden="true" />}
              title="No projects yet"
              description="Projects are where your practice's work lives. Create your first one to start tracking tasks, deliverables and approvals against it."
              action={
                <Button onClick={openCreate}>
                  <Plus className="size-4" aria-hidden="true" />
                  New project
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <PageToolbar
              className="mt-6"
              count={
                needle || statusFilter !== "all"
                  ? `${visible.length} of ${projects.length}`
                  : pluralise(projects.length, "project")
              }
              filters={
                <FilterChips
                  label="Filter by status"
                  allLabel="All statuses"
                  options={PROJECT_STATUS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                    count: projects.filter(
                      (project) => project.status === option.value,
                    ).length,
                  }))}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              }
            >
              <SearchField
                label="Search projects"
                placeholder="Name, client or description"
                value={query}
                onChange={setQuery}
              />
            </PageToolbar>

            <div className="mt-6">
              {visible.length === 0 ? (
                <EmptyState
                  title="Nothing matches"
                  description="No project matches the current search and filter."
                  size="sm"
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      Clear search and filter
                    </Button>
                  }
                />
              ) : (
                <DataView<Project>
                  label="Projects"
                  rowKey={(project) => project.id}
                  rowHref={(project) => `/projects/${project.id}`}
                  primary={(project) => project.name}
                  secondary={(project) =>
                    clientName(project.clientId) ?? "No client"
                  }
                  meta={(project) => (
                    <>
                      <StatusBadge status={project.status} />

                      {formatDateRange(project.startDate, project.endDate) && (
                        <span className="text-[12px] text-ink-subtle tabular-nums">
                          {formatDateRange(project.startDate, project.endDate)}
                        </span>
                      )}

                      {formatAmount(project.budget) && (
                        <span className="text-[12px] text-ink-subtle tabular-nums">
                          GH₵{formatAmount(project.budget)}
                        </span>
                      )}
                    </>
                  )}
                  rows={visible}
                  actions={(project) => (
                    <>
                      <Select
                        aria-label={`Status for ${project.name}`}
                        options={PROJECT_STATUS_OPTIONS}
                        value={project.status}
                        size="sm"
                        fullWidth={false}
                        disabled={pending?.id === project.id}
                        onChange={(value) =>
                          updateStatus(project, value as ProjectStatus)
                        }
                        className="w-[136px]"
                      />

                      <Button
                        size="sm"
                        variant="tertiary"
                        disabled={pending?.id === project.id}
                        onClick={() => openEdit(project)}
                        aria-label={`Edit ${project.name}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>

                      <Button
                        size="sm"
                        variant="tertiary"
                        disabled={pending?.id === project.id}
                        onClick={() => setArchiveTarget(project)}
                        aria-label={`Archive ${project.name}`}
                      >
                        <Archive className="size-4" aria-hidden="true" />
                      </Button>
                    </>
                  )}
                  columns={[
                    {
                      key: "name",
                      header: "Project",
                      cell: (project) => project.name,
                    },
                    {
                      key: "client",
                      header: "Client",
                      hideBelowLg: true,
                      cell: (project) => clientName(project.clientId) ?? "—",
                    },
                    {
                      key: "status",
                      header: "Status",
                      cell: (project) => (
                        <StatusBadge status={project.status} />
                      ),
                    },
                    {
                      key: "dates",
                      header: "Dates",
                      numeric: true,
                      hideBelowLg: true,
                      cell: (project) =>
                        formatDateRange(project.startDate, project.endDate) ?? (
                          <span className="text-ink-subtle">—</span>
                        ),
                    },
                    {
                      key: "budget",
                      header: "Budget",
                      align: "right",
                      numeric: true,
                      hideBelowMd: true,
                      cell: (project) =>
                        formatAmount(project.budget) ? (
                          `GH₵${formatAmount(project.budget)}`
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        ),
                    },
                  ]}
                />
              )}
            </div>
          </>
        )}
      </div>

      <ProjectFormDialog
        open={open}
        project={editing}
        clients={clients}
        onClose={() => setOpen(false)}
        onCreated={(created) => {
          setProjects((prev) => [created, ...prev]);
          toast({
            tone: "success",
            title: "Project created",
            description: created.name,
          });
        }}
        onUpdated={(updated) => {
          setProjects((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item)),
          );
          toast({
            tone: "success",
            title: "Project updated",
            description: updated.name,
          });
        }}
      />

      <Dialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        label="Archive project"
        title="Archive this project?"
        hideClose
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setArchiveTarget(null)}
              disabled={archiving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={archiving}
              onClick={() => archiveTarget && archive(archiveTarget)}
            >
              Archive project
            </Button>
          </>
        }
      >
        {archiveTarget && (
          <div className="space-y-3 text-[13px] leading-relaxed text-ink-muted">
            <p>
              <span className="font-medium text-ink">{archiveTarget.name}</span>{" "}
              will be removed from this list. Archiving keeps the project and
              its history — it can be restored later.
            </p>

            {/* Archiving is not a cascade, and saying otherwise would be a lie
                the user only discovers on the Tasks or Deliverables page. */}
            {impact && (impact.tasks > 0 || impact.deliverables > 0) && (
              <p>
                {[
                  impact.tasks > 0 && pluralise(impact.tasks, "task"),
                  impact.deliverables > 0 &&
                    pluralise(impact.deliverables, "deliverable"),
                ]
                  .filter(Boolean)
                  .join(" and ")}{" "}
                attached to this project will stay on the Tasks and Deliverables
                pages.
              </p>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
};

/**
 * Mirrors the settled page — toolbar rule, then a table — so the transition
 * does not reflow.
 */
const ProjectSkeleton = () => (
  <div className="mt-6" aria-busy="true">
    <span className="sr-only">Loading projects…</span>

    <Skeleton className="h-14 w-full" />
    <Skeleton className="mt-6 h-72 w-full" />
  </div>
);

export default ProjectsPage;
