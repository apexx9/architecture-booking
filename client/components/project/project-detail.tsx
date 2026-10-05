"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  FileCheck2,
  ListChecks,
  Paperclip,
  Pencil,
  X,
} from "lucide-react";

import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Select from "@/components/ui/select";
import Skeleton from "@/components/ui/skeleton";
import Tabs from "@/components/ui/tabs";
import StatusBadge from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import DataView from "@/components/workspace/data-view";
import { ErrorState, InlineError } from "@/components/workspace/error-state";
import PageHeader from "@/components/workspace/page-header";
import { Section, SectionHeader } from "@/components/workspace/section";
import ProjectFormDialog from "@/components/project/project-form-dialog";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  formatAmount,
  formatBytes,
  formatDate,
  formatDateRange,
  pluralise,
} from "@/lib/format";
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
import { filesService, type FileRecord } from "@/services/files.service";
import { tasksService, type Task } from "@/services/tasks.service";
import { phasesService, type ProjectPhase } from "@/services/phases.service";
import { useCrumbStore } from "@/store/use-crumb-store";

const PROJECT_STATUS_OPTIONS = toStatusOptions(PROJECT_STATUSES);

interface ProjectDetailProps {
  projectId: string;
}

/**
 * Everything attached to one project, in one place.
 *
 * The API already supports this without new endpoints:
 * - `GET /projects/:id` for the project itself
 * - `GET /tasks/project/:projectId` for its tasks
 * - deliverables and files are filtered client-side by `projectId`
 *
 * What it does not do is move a task or a deliverable between projects, so this
 * page is read-only for the attached records — status is shown, not changed,
 * and the rows link back to the pages that own editing. An inline status
 * control here would imply a move that is not happening.
 */
const ProjectDetailSkeleton = () => (
  <div
    className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10"
    aria-busy="true"
  >
    <span className="sr-only">Loading project…</span>

    <Skeleton className="h-4 w-40" />
    <Skeleton className="mt-4 h-9 w-72" />
    <Skeleton className="mt-4 h-4 w-96 max-w-full" />
    <Skeleton className="mt-8 h-64 w-full" />
  </div>
);

const ProjectDetail = ({ projectId }: ProjectDetailProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Project | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const setTrail = useCrumbStore((state) => state.setTrail);
  const clearTrail = useCrumbStore((state) => state.clearTrail);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [projectData, taskData, deliverableData, fileData] =
        await Promise.all([
          projectsService.get(projectId),
          tasksService.byProject(projectId),
          deliverablesService.list(),
          filesService.list(),
        ]);

      setProject(projectData);
      setTasks(taskData);

      // Filtered here because there is no `?projectId` query on either endpoint.
      setDeliverables(
        deliverableData.filter((item) => item.projectId === projectId),
      );
      setFiles(fileData.filter((item) => item.projectId === projectId));
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await load();
    };

    run();

    // The client list and phases are picker options only.
    void clientsService
      .getAll()
      .then((data) => {
        if (!cancelled) setClients(data);
      })
      .catch(() => undefined);
    void phasesService
      .list()
      .then((data) => {
        if (!cancelled) setPhases(data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [load]);

  const client = project?.clientId
    ? (clients.find((item) => item.id === project.clientId) ?? null)
    : null;

  const phaseName = (phaseId?: string | null) =>
    phases.find((phase) => phase.id === phaseId)?.name ?? null;

  const updateStatus = async (status: ProjectStatus) => {
    if (!project) return;

    const previous = project;

    setActionError(null);
    setProject({ ...project, status });

    try {
      setStatusBusy(true);

      const updated = await projectsService.update(project.id, { status });

      setProject(updated);
    } catch (error) {
      setProject(previous);

      const description = getApiErrorMessage(error);

      setActionError(description);
      toast({ tone: "error", title: "Could not change status", description });
    } finally {
      setStatusBusy(false);
    }
  };

  const archive = async () => {
    if (!archiveTarget) return;

    setActionError(null);

    try {
      await projectsService.archive(archiveTarget.id);

      setArchiveTarget(null);
      toast({
        tone: "success",
        title: "Project archived",
        description: archiveTarget.name,
      });

      // The project is no longer returned by the list endpoint, so staying here
      // would show a project that no longer exists. The list is the only place
      // it can be seen.
      router.push("/projects");
    } catch (error) {
      const description = getApiErrorMessage(error);

      setActionError(description);
      setArchiveTarget(null);
      toast({ tone: "error", title: "Could not archive project", description });
    }
  };

  const removeFile = async (file: FileRecord) => {
    const previous = files;

    setFiles((prev) => prev.filter((item) => item.id !== file.id));

    try {
      await filesService.remove(file.id);

      toast({
        tone: "success",
        title: "File removed",
        description: file.originalName,
      });
    } catch (error) {
      setFiles(previous);

      const description = getApiErrorMessage(error);

      setActionError(description);
      toast({ tone: "error", title: "Could not remove file", description });
    }
  };

  /**
   * The context bar sits above every route and cannot know this project's name,
   * so the page publishes its own trail and clears it on the way out — which
   * also covers the case where loading fails and there is no name to show.
   */
  useEffect(() => {
    if (!project) return;

    setTrail([
      { label: "Projects", href: "/projects" },
      { label: project.name },
    ]);

    return clearTrail;
  }, [project, setTrail, clearTrail]);

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (loadError || !project) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <ErrorState
          title="Couldn't load this project"
          description="We couldn't retrieve the project and everything attached to it."
          detail={loadError ?? undefined}
          onRetry={load}
          backHref="/projects"
          backLabel="Back to projects"
          className="border-t border-line"
        />
      </div>
    );
  }

  const dates = formatDateRange(project.startDate, project.endDate);
  const budget = formatAmount(project.budget);
  const archiving = archiveTarget !== null;

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <PageHeader
          backHref="/projects"
          backLabel="Projects"
          title={project.name}
          description={`${pluralise(tasks.length, "task")}, ${pluralise(
            deliverables.length,
            "deliverable",
          )} and ${pluralise(files.length, "file")} attached to this project.`}
          meta={[
            { label: "Status", value: <StatusBadge status={project.status} /> },
            {
              label: "Client",
              value: client ? (
                <Link
                  href={`/clients/${client.id}`}
                  className="rounded-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {client.name}
                </Link>
              ) : (
                "None"
              ),
            },
            ...(dates ? [{ label: "Dates", value: dates }] : []),
            ...(budget ? [{ label: "Budget", value: `GH₵${budget}` }] : []),
          ]}
          actions={
            <>
              <Select
                aria-label={`Status for ${project.name}`}
                options={PROJECT_STATUS_OPTIONS}
                value={project.status}
                size="sm"
                fullWidth={false}
                disabled={statusBusy}
                onChange={(value) => updateStatus(value as ProjectStatus)}
                className="w-[148px]"
              />

              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </Button>

              <Button
                variant="tertiary"
                onClick={() => setArchiveTarget(project)}
                aria-label={`Archive ${project.name}`}
              >
                <Archive className="size-4" aria-hidden="true" />
              </Button>
            </>
          }
        />

        {actionError && (
          <InlineError
            title="Action failed"
            detail={actionError}
            className="mt-5"
          />
        )}

        <Tabs
          items={[
            { value: "overview", label: "Overview" },
            { value: "tasks", label: "Tasks", count: tasks.length },
            {
              value: "deliverables",
              label: "Deliverables",
              count: deliverables.length,
            },
            { value: "files", label: "Files", count: files.length },
          ]}
          label="Project sections"
          defaultValue="overview"
          className="mt-8"
        >
          {(active) => {
            if (active === "tasks") {
              return (
                <Section divided>
                  <SectionHeader
                    title="Tasks"
                    description="Read-only here. Status and phase are edited from the Tasks page, which owns them."
                  />

                  <div className="mt-5">
                    <DataView<Task>
                      label="Tasks on this project"
                      rows={tasks}
                      rowKey={(task) => task.id}
                      primary={(task) => task.title}
                      secondary={(task) =>
                        phaseName(task.phaseId) ?? "No phase"
                      }
                      meta={(task) => (
                        <>
                          <StatusBadge status={task.status} />
                          <StatusBadge status={task.priority} />
                          {task.dueDate && (
                            <span className="text-[12px] text-ink-subtle tabular-nums">
                              Due {formatDate(task.dueDate)}
                            </span>
                          )}
                        </>
                      )}
                      empty={
                        <EmptyState
                          icon={
                            <ListChecks className="size-4" aria-hidden="true" />
                          }
                          title="No tasks on this project"
                          description="Tasks are created from the Tasks page and belong to exactly one project."
                          size="sm"
                          action={
                            <Link
                              href="/tasks"
                              className="inline-flex items-center rounded-sm border border-line px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                            >
                              Go to tasks
                            </Link>
                          }
                        />
                      }
                      columns={[
                        {
                          key: "title",
                          header: "Task",
                          cell: (task) => task.title,
                        },
                        {
                          key: "status",
                          header: "Status",
                          width: "w-28",
                          cell: (task) => <StatusBadge status={task.status} />,
                        },
                        {
                          key: "priority",
                          header: "Priority",
                          width: "w-28",
                          hideBelowLg: true,
                          cell: (task) => (
                            <StatusBadge status={task.priority} />
                          ),
                        },
                        {
                          key: "phase",
                          header: "Phase",
                          hideBelowLg: true,
                          cell: (task) => phaseName(task.phaseId) ?? "—",
                        },
                        {
                          key: "due",
                          header: "Due",
                          numeric: true,
                          width: "w-32",
                          hideBelowMd: true,
                          cell: (task) => formatDate(task.dueDate) ?? "—",
                        },
                      ]}
                    />
                  </div>
                </Section>
              );
            }

            if (active === "deliverables") {
              return (
                <Section divided>
                  <SectionHeader
                    title="Deliverables"
                    description="Versions are managed by the server on upload, so they are shown rather than edited."
                  />

                  <div className="mt-5">
                    <DataView<Deliverable>
                      label="Deliverables on this project"
                      rows={deliverables}
                      rowKey={(deliverable) => deliverable.id}
                      primary={(deliverable) => deliverable.name}
                      secondary={(deliverable) =>
                        phaseName(deliverable.phaseId) ?? "No phase"
                      }
                      meta={(deliverable) => (
                        <>
                          <StatusBadge status={deliverable.status} />
                          <span className="text-[12px] text-ink-subtle tabular-nums">
                            v{deliverable.version}
                          </span>
                          {deliverable.dueDate && (
                            <span className="text-[12px] text-ink-subtle tabular-nums">
                              Due {formatDate(deliverable.dueDate)}
                            </span>
                          )}
                        </>
                      )}
                      empty={
                        <EmptyState
                          icon={
                            <FileCheck2 className="size-4" aria-hidden="true" />
                          }
                          title="No deliverables on this project"
                          description="Deliverables are created from the Deliverables page and belong to exactly one project."
                          size="sm"
                          action={
                            <Link
                              href="/deliverables"
                              className="inline-flex items-center rounded-sm border border-line px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                            >
                              Go to deliverables
                            </Link>
                          }
                        />
                      }
                      columns={[
                        {
                          key: "name",
                          header: "Deliverable",
                          cell: (deliverable) => deliverable.name,
                        },
                        {
                          key: "status",
                          header: "Status",
                          width: "w-28",
                          cell: (deliverable) => (
                            <StatusBadge status={deliverable.status} />
                          ),
                        },
                        {
                          key: "version",
                          header: "Version",
                          width: "w-20",
                          numeric: true,
                          cell: (deliverable) => `v${deliverable.version}`,
                        },
                        {
                          key: "phase",
                          header: "Phase",
                          hideBelowLg: true,
                          cell: (deliverable) =>
                            phaseName(deliverable.phaseId) ?? "—",
                        },
                        {
                          key: "due",
                          header: "Due",
                          numeric: true,
                          width: "w-32",
                          hideBelowMd: true,
                          cell: (deliverable) =>
                            formatDate(deliverable.dueDate) ?? "—",
                        },
                      ]}
                    />
                  </div>
                </Section>
              );
            }

            if (active === "files") {
              return (
                <Section divided>
                  <SectionHeader
                    title="Files"
                    description="Everything uploaded against this project's deliverables."
                  />

                  <div className="mt-5">
                    <DataView<FileRecord>
                      label="Files on this project"
                      rows={files}
                      rowKey={(file) => file.id}
                      primary={(file) => file.originalName}
                      secondary={(file) => formatBytes(file.size)}
                      meta={(file) => (
                        <span className="text-[12px] text-ink-subtle tabular-nums">
                          {formatDate(file.createdAt) ?? "—"}
                        </span>
                      )}
                      actions={(file) => (
                        <Button
                          size="sm"
                          variant="tertiary"
                          onClick={() => removeFile(file)}
                          aria-label={`Remove ${file.originalName}`}
                        >
                          <X className="size-4" aria-hidden="true" />
                        </Button>
                      )}
                      empty={
                        <EmptyState
                          icon={
                            <Paperclip className="size-4" aria-hidden="true" />
                          }
                          title="No files yet"
                          description="Files are uploaded from a deliverable, and are listed here as well as there."
                          size="sm"
                          action={
                            <Link
                              href="/deliverables"
                              className="inline-flex items-center rounded-sm border border-line px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                            >
                              Go to deliverables
                            </Link>
                          }
                        />
                      }
                      columns={[
                        {
                          key: "name",
                          header: "File",
                          cell: (file) => file.originalName,
                        },
                        {
                          key: "size",
                          header: "Size",
                          numeric: true,
                          width: "w-24",
                          cell: (file) => formatBytes(file.size),
                        },
                        {
                          key: "added",
                          header: "Added",
                          numeric: true,
                          hideBelowMd: true,
                          cell: (file) => formatDate(file.createdAt) ?? "—",
                        },
                      ]}
                    />
                  </div>
                </Section>
              );
            }

            return (
              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-12">
                <Section divided>
                  <SectionHeader title="Details" />

                  <dl className="mt-5 divide-y divide-line">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0">
                      <dt className="text-[13px] text-ink-subtle">Status</dt>
                      <dd>
                        <StatusBadge status={project.status} />
                      </dd>
                    </div>

                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                      <dt className="text-[13px] text-ink-subtle">Client</dt>
                      <dd className="text-[14px] text-ink">
                        {client ? (
                          <Link
                            href={`/clients/${client.id}`}
                            className="rounded-sm underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                          >
                            {client.name}
                          </Link>
                        ) : (
                          "None"
                        )}
                      </dd>
                    </div>

                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                      <dt className="text-[13px] text-ink-subtle">Start</dt>
                      <dd className="text-[14px] text-ink tabular-nums">
                        {formatDate(project.startDate) ?? "Not set"}
                      </dd>
                    </div>

                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                      <dt className="text-[13px] text-ink-subtle">End</dt>
                      <dd className="text-[14px] text-ink tabular-nums">
                        {formatDate(project.endDate) ?? "Not set"}
                      </dd>
                    </div>

                    <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 last:pb-0">
                      <dt className="text-[13px] text-ink-subtle">Budget</dt>
                      <dd className="text-[14px] text-ink tabular-nums">
                        {budget ? `GH₵${budget}` : "Not set"}
                      </dd>
                    </div>
                  </dl>
                </Section>

                <Section divided>
                  <SectionHeader title="Brief" />

                  {project.description ? (
                    <p className="mt-5 text-[14px] leading-relaxed whitespace-pre-line text-ink-muted">
                      {project.description}
                    </p>
                  ) : (
                    <p className="mt-5 text-[13px] text-ink-subtle">
                      No brief written yet. Use Edit to describe what this
                      project is for.
                    </p>
                  )}
                </Section>
              </div>
            );
          }}
        </Tabs>
      </div>

      <ProjectFormDialog
        open={editOpen}
        project={project}
        clients={clients}
        onClose={() => setEditOpen(false)}
        onUpdated={(updated) => {
          setProject(updated);
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
            <Button variant="destructive" loading={archiving} onClick={archive}>
              Archive project
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px] leading-relaxed text-ink-muted">
          <p>
            <span className="font-medium text-ink">{project.name}</span> will be
            removed from the projects list. Archiving keeps the project, its
            tasks, deliverables and files.
          </p>

          <p>You will be taken back to the projects list afterwards.</p>
        </div>
      </Dialog>
    </>
  );
};

export default ProjectDetail;
