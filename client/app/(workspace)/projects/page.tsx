"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, FolderPlus, Pencil, Plus } from "lucide-react";

import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import SearchField from "@/components/ui/search-field";
import Select from "@/components/ui/select";
import StatusBadge from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
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
import { deliverablesService, type Deliverable } from "@/services/deliverables.service";
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

  const visible = needle
    ? projects.filter((project) => {
        const haystack = [
          project.name,
          project.description,
          clientName(project.clientId),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(needle);
      })
    : projects;

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
        <header className="motion-enter flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[28px] font-light text-ink">
              Projects
            </h1>
            <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
              Commissions currently in flight.
            </p>
          </div>

          <Button variant="primary" onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New project
          </Button>
        </header>

        {actionError && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger"
          >
            {actionError}
          </p>
        )}

        {!loading && projects.length > 0 && (
          <div className="mt-6 max-w-sm motion-enter">
            <SearchField
              label="Search projects"
              placeholder="Search by name, client or description"
              value={query}
              onChange={setQuery}
            />
          </div>
        )}

        <Card className="mt-6 motion-enter">
          <CardHeader
            title="All projects"
            description={
              loading
                ? "Loading…"
                : `${pluralise(visible.length, "project")}${
                    needle && visible.length !== projects.length
                      ? ` of ${projects.length}`
                      : ""
                  }`
            }
          />

          <CardBody>
            {loading ? (
              <div
                role="status"
                className="py-8 text-center text-[14px] text-ink-subtle"
              >
                Loading…
              </div>
            ) : loadError && projects.length === 0 ? (
              <EmptyState
                title="Could not load projects"
                description={loadError}
                tone="error"
                size="sm"
                action={
                  <Button variant="secondary" onClick={load}>
                    Try again
                  </Button>
                }
              />
            ) : projects.length === 0 ? (
              <EmptyState
                icon={<FolderPlus className="size-4" aria-hidden="true" />}
                title="No projects yet"
                description="Create your first project to start tracking tasks and deliverables."
                size="sm"
                action={
                  <Button variant="primary" onClick={openCreate} size="sm">
                    <Plus className="size-4" aria-hidden="true" />
                    New project
                  </Button>
                }
              />
            ) : needle && visible.length === 0 ? (
              <EmptyState
                title="No matching projects"
                description={`Nothing matches “${query.trim()}”.`}
                size="sm"
                action={
                  <Button variant="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-2">
                {visible.map((project) => {
                  const isPending = pending?.id === project.id;
                  const client = clientName(project.clientId);
                  const dates = formatDateRange(
                    project.startDate,
                    project.endDate,
                  );
                  const budget = formatAmount(project.budget);

                  return (
                    <li
                      key={project.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* The name is the route into everything attached to
                              this project. */}
                          <Link
                            href={`/projects/${project.id}`}
                            className="truncate rounded-sm text-[14px] font-medium text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                          >
                            {project.name}
                          </Link>

                          <StatusBadge status={project.status} />

                          {client && (
                            <span className="truncate text-[13px] text-ink-muted">
                              {client}
                            </span>
                          )}
                        </div>

                        {/* Budget and dates were collected on the form but never
                            shown anywhere, so they read as decorative. */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-subtle tabular-nums">
                          {dates && <span>{dates}</span>}
                          {budget && <span>GH₵{budget}</span>}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Select
                          aria-label={`Status for ${project.name}`}
                          options={PROJECT_STATUS_OPTIONS}
                          value={project.status}
                          size="sm"
                          fullWidth={false}
                          disabled={isPending}
                          onChange={(value) =>
                            updateStatus(project, value as ProjectStatus)
                          }
                          className="w-[148px]"
                        />

                        <Button
                          size="sm"
                          variant="tertiary"
                          disabled={isPending}
                          onClick={() => openEdit(project)}
                          aria-label={`Edit ${project.name}`}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>

                        <Button
                          size="sm"
                          variant="tertiary"
                          disabled={isPending}
                          onClick={() => setArchiveTarget(project)}
                          aria-label={`Archive ${project.name}`}
                        >
                          <Archive className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
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
              <span className="font-medium text-ink">
                {archiveTarget.name}
              </span>{" "}
              will be removed from this list. Archiving keeps the project and its
              history — it can be restored later.
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

export default ProjectsPage;