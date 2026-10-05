"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ChevronRight,
  FileCheck2,
  ListChecks,
  Paperclip,
  Pencil,
  X,
} from "lucide-react";

import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Select from "@/components/ui/select";
import Tabs from "@/components/ui/tabs";
import StatusBadge from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import ProjectFormDialog from "@/components/project/project-form-dialog";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatAmount, formatBytes, formatDate, formatDateRange, pluralise } from "@/lib/format";
import { toStatusOptions } from "@/lib/domain/status";
import {
  PROJECT_STATUSES,
  projectsService,
  type Project,
  type ProjectStatus,
} from "@/services/projects.service";
import { clientsService, type Client } from "@/services/clients.service";
import { deliverablesService, type Deliverable } from "@/services/deliverables.service";
import { filesService, type FileRecord } from "@/services/files.service";
import { tasksService, type Task } from "@/services/tasks.service";
import { phasesService, type ProjectPhase } from "@/services/phases.service";

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
    ? clients.find((item) => item.id === project.clientId) ?? null
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

  if (loading) {
    return (
      <div
        role="status"
        className="mx-auto w-full max-w-[1400px] px-6 py-8 text-[14px] text-ink-subtle lg:px-10"
      >
        Loading…
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <EmptyState
          title="Could not load this project"
          description={loadError ?? "The project was not found."}
          tone="error"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" onClick={load}>
                Try again
              </Button>
              <Link
                href="/projects"
                className="inline-flex items-center rounded-sm border border-line px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Back to projects
              </Link>
            </div>
          }
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
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-subtle">
            <li>
              <Link
                href="/projects"
                className="rounded-sm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Projects
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li className="truncate text-ink">{project.name}</li>
          </ol>
        </nav>

        <header className="motion-enter flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[28px] font-light text-ink">
                {project.name}
              </h1>

              <StatusBadge status={project.status} />
            </div>

            {/* Budget and dates were collected by the form and then never shown
                anywhere, so they read as decoration. */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-subtle tabular-nums">
              {client && (
                <span>
                  Client:{" "}
                  <Link
                    href="/clients"
                    className="rounded-sm text-ink-muted hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {client.name}
                  </Link>
                </span>
              )}

              {dates && <span>{dates}</span>}
              {budget && <span>GH₵{budget}</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <Button
              variant="secondary"
              onClick={() => setEditOpen(true)}
              aria-label={`Edit ${project.name}`}
            >
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
          </div>
        </header>

        {actionError && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger"
          >
            {actionError}
          </p>
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
          className="mt-6"
        >
          {(active) => {
            if (active === "tasks") {
              return (
                <Card>
                  <CardHeader title="Tasks" />
                  <CardBody>
                    {tasks.length === 0 ? (
                      <EmptyState
                        icon={<ListChecks className="size-4" aria-hidden="true" />}
                        title="No tasks on this project"
                        description="Tasks are created from the Tasks page and belong to one project."
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
                    ) : (
                      <ul className="divide-y divide-line">
                        {tasks.map((task) => {
                          const phase = phaseName(task.phaseId);

                          return (
                            <li
                              key={task.id}
                              className="py-3 first:pt-0 last:pb-0"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="truncate text-[14px] text-ink">
                                    {task.title}
                                  </span>

                                  <StatusBadge status={task.status} />
                                  <StatusBadge status={task.priority} />
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-subtle">
                                  {phase && <span>{phase}</span>}

                                  {task.dueDate && (
                                    <span className="tabular-nums">
                                      Due {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                </div>
                              </div>

                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              );
            }

            if (active === "deliverables") {
              return (
                <Card>
                  <CardHeader title="Deliverables" />
                  <CardBody>
                    {deliverables.length === 0 ? (
                      <EmptyState
                        icon={
                          <FileCheck2 className="size-4" aria-hidden="true" />
                        }
                        title="No deliverables on this project"
                        description="Deliverables are created from the Deliverables page and belong to one project."
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
                    ) : (
                      <ul className="divide-y divide-line">
                        {deliverables.map((deliverable) => {
                          const phase = phaseName(deliverable.phaseId);

                          return (
                            <li
                              key={deliverable.id}
                              className="py-3 first:pt-0 last:pb-0"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-[14px] text-ink">
                                  {deliverable.name}
                                </span>

                                <StatusBadge status={deliverable.status} />
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-subtle">
                                <span className="tabular-nums">
                                  v{deliverable.version}
                                </span>
                                {phase && <span>{phase}</span>}

                                {deliverable.dueDate && (
                                  <span className="tabular-nums">
                                    Due {formatDate(deliverable.dueDate)}
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              );
            }

            if (active === "files") {
              return (
                <Card>
                  <CardHeader
                    title="Files"
                    description={
                      files.length > 0
                        ? `${pluralise(files.length, "file")} on this project`
                        : undefined
                    }
                  />
                  <CardBody>
                    {files.length === 0 ? (
                      <EmptyState
                        icon={<Paperclip className="size-4" aria-hidden="true" />}
                        title="No files yet"
                        description="Files are attached from a deliverable, and are listed here as well as there."
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
                    ) : (
                      <ul className="divide-y divide-line">
                        {files.map((file) => (
                          <li
                            key={file.id}
                            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[14px] text-ink">
                                {file.originalName}
                              </p>
                              <p className="mt-0.5 text-[13px] text-ink-subtle tabular-nums">
                                {formatBytes(file.size)} ·{" "}
                                {formatDate(file.createdAt) ?? "—"}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              variant="tertiary"
                              onClick={() => removeFile(file)}
                              aria-label={`Remove ${file.originalName}`}
                            >
                              <X className="size-4" aria-hidden="true" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              );
            }

            return (
              <div className="space-y-6">
                <Card>
                  <CardHeader title="Details" />
                  <CardBody>
                    <dl className="divide-y divide-line">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0">
                        <dt className="text-[13px] text-ink-subtle">Status</dt>
                        <dd>
                          <StatusBadge status={project.status} />
                        </dd>
                      </div>

                      <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                        <dt className="text-[13px] text-ink-subtle">Client</dt>
                        <dd className="text-[14px] text-ink">
                          {client ? client.name : "None"}
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
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Description" />
                  <CardBody>
                    {project.description ? (
                      <p className="text-[14px] leading-relaxed whitespace-pre-line text-ink-muted">
                        {project.description}
                      </p>
                    ) : (
                      <p className="text-[13px] text-ink-subtle">
                        No description yet. Use Edit to add one.
                      </p>
                    )}
                  </CardBody>
                </Card>
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
            removed from the projects list. Archiving keeps the project, its tasks,
            deliverables and files.
          </p>

          <p>You will be taken back to the projects list afterwards.</p>
        </div>
      </Dialog>
    </>
  );
};

export default ProjectDetail;