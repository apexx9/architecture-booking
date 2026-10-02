"use client";

import { useEffect, useState } from "react";
import { FileCheck2, Plus, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getStatusPresentation, toStatusOptions } from "@/lib/domain/status";
import {
  DELIVERABLE_STATUS_ORDER,
  deliverablesService,
  type CreateDeliverableInput,
  type Deliverable,
  type DeliverableStatus,
} from "@/services/deliverables.service";
import { filesService, type FileRecord } from "@/services/files.service";
import { projectsService, type Project } from "@/services/projects.service";
import { tasksService, type Task } from "@/services/tasks.service";

const STATUS_OPTIONS = toStatusOptions(DELIVERABLE_STATUS_ORDER);

const emptyForm = {
  projectId: "",
  taskId: "",
  name: "",
  description: "",
  status: "IN_PROGRESS" as DeliverableStatus,
  dueDate: "",
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const DeliverablesPage = () => {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [uploadTarget, setUploadTarget] = useState<Deliverable | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [deliverableData, projectData, taskData, fileData] =
          await Promise.all([
            deliverablesService.list(),
            projectsService.list(),
            tasksService.list(),
            filesService.list(),
          ]);

        if (!cancelled) {
          setDeliverables(deliverableData);
          setProjects(projectData);
          setTasks(taskData);
          setFiles(fileData);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Tasks are scoped to the selected project, matching the API's own filter. */
  const projectTasks = form.projectId
    ? tasks.filter((task) => task.projectId === form.projectId)
    : [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    const payload: CreateDeliverableInput = {
      projectId: form.projectId,
      name: form.name,
      status: form.status,
    };

    if (form.description.trim()) {
      payload.description = form.description.trim();
    }

    if (form.taskId) {
      payload.taskId = form.taskId;
    }

    if (form.dueDate) {
      payload.dueDate = new Date(form.dueDate).toISOString();
    }

    try {
      setSubmitting(true);

      const created = await deliverablesService.create(payload);

      setDeliverables((prev) => [created, ...prev]);
      setOpen(false);
      setForm(emptyForm);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const advanceStatus = async (
    deliverable: Deliverable,
    status: DeliverableStatus,
  ) => {
    const previous = deliverable;

    setDeliverables((prev) =>
      prev.map((item) => (item.id === deliverable.id ? { ...item, status } : item)),
    );

    try {
      const updated = await deliverablesService.update(deliverable.id, { status });

      setDeliverables((prev) =>
        prev.map((item) => (item.id === deliverable.id ? updated : item)),
      );
    } catch (error) {
      setDeliverables((prev) =>
        prev.map((item) => (item.id === deliverable.id ? previous : item)),
      );

      setLoadError(getApiErrorMessage(error));
    }
  };

  const handleUpload = async (file: File) => {
    if (!uploadTarget) {
      return;
    }

    setUploadError(null);

    try {
      setUploading(true);

      const uploaded = await filesService.upload({
        file,
        deliverableId: uploadTarget.id,
        projectId: uploadTarget.projectId,
      });

      setFiles((prev) => [uploaded, ...prev]);
      setUploadTarget(null);
    } catch (error) {
      setUploadError(getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (file: FileRecord) => {
    const previous = files;

    setFiles((prev) => prev.filter((item) => item.id !== file.id));

    try {
      await filesService.remove(file.id);
    } catch (error) {
      setFiles(previous);
      setLoadError(getApiErrorMessage(error));
    }
  };

  const canCreate = projects.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
      <header className="motion-enter flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-light text-ink">
            Deliverables
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
            Drawings, reports and issued documents, and where each one stands
            with the client.
          </p>
        </div>

        {canCreate && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New Deliverable
          </Button>
        )}
      </header>

      <Card className="mt-6 motion-enter">
        <CardHeader
          title="All Deliverables"
          description={`${deliverables.length} deliverables`}
        />
        <CardBody>
          {loading ? (
            <div className="py-8 text-center text-[14px] text-ink-subtle">
              Loading...
            </div>
          ) : loadError && deliverables.length === 0 ? (
            <EmptyState
              title="Could not load deliverables"
              description={loadError}
              tone="error"
              size="sm"
            />
          ) : deliverables.length === 0 ? (
            <EmptyState
              icon={<FileCheck2 className="size-4" aria-hidden="true" />}
              title="No deliverables yet"
              description={
                canCreate
                  ? "Create a deliverable to start tracking issued documents."
                  : "Create a project first — every deliverable belongs to one."
              }
              size="sm"
            />
          ) : (
            <ul className="space-y-3">
              {deliverables.map((deliverable) => {
                const project = projects.find(
                  (item) => item.id === deliverable.projectId,
                );

                const attached = files.filter(
                  (file) => file.deliverableId === deliverable.id,
                );

                const presentation = getStatusPresentation(deliverable.status);
                const due = formatDate(deliverable.dueDate);

                return (
                  <li
                    key={deliverable.id}
                    className="rounded-sm border border-line p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-medium text-ink">
                            {deliverable.name}
                          </span>
                          <Badge tone={presentation.tone} dot>
                            {presentation.label}
                          </Badge>
                          <Badge tone="neutral">
                            v{deliverable.version}
                          </Badge>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-subtle">
                          {project && <span>{project.name}</span>}
                          {due && <span>Due {due}</span>}
                        </div>

                        {deliverable.description && (
                          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                            {deliverable.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Select
                          aria-label={`Status for ${deliverable.name}`}
                          options={STATUS_OPTIONS}
                          value={deliverable.status}
                          onChange={(value) =>
                            advanceStatus(
                              deliverable,
                              value as DeliverableStatus,
                            )
                          }
                          className="w-[190px]"
                        />

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setUploadError(null);
                            setUploadTarget(deliverable);
                          }}
                        >
                          <Upload className="size-4" aria-hidden="true" />
                          File
                        </Button>
                      </div>
                    </div>

                    {attached.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-line pt-3">
                        {attached.map((file) => (
                          <li
                            key={file.id}
                            className="flex items-center justify-between gap-3 text-[13px]"
                          >
                            <span className="min-w-0 truncate text-ink">
                              {file.originalName}
                            </span>

                            <span className="flex shrink-0 items-center gap-3">
                              <span className="text-ink-subtle">
                                {formatBytes(file.size)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFile(file)}
                                className="text-ink-subtle underline underline-offset-2 hover:text-danger"
                              >
                                Remove
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        label="New Deliverable"
        title="New Deliverable"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="deliverable-project"
            >
              Project
            </label>
            <select
              id="deliverable-project"
              value={form.projectId}
              onChange={(event) =>
                setForm({ ...form, projectId: event.target.value, taskId: "" })
              }
              required
              className="h-10 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink" htmlFor="deliverable-name">
              Name
            </label>
            <Input
              id="deliverable-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="deliverable-description"
            >
              Description
            </label>
            <Input
              id="deliverable-description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-sm text-ink"
                htmlFor="deliverable-status"
              >
                Status
              </label>
              <select
                id="deliverable-status"
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as DeliverableStatus,
                  })
                }
                className="h-10 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-ink"
                htmlFor="deliverable-due"
              >
                Due date
              </label>
              <Input
                id="deliverable-due"
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm({ ...form, dueDate: event.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="deliverable-task"
            >
              Linked task
            </label>
            <select
              id="deliverable-task"
              value={form.taskId}
              onChange={(event) =>
                setForm({ ...form, taskId: event.target.value })
              }
              disabled={!form.projectId}
              className="h-10 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink disabled:opacity-50"
            >
              <option value="">
                {form.projectId ? "None" : "Select a project first"}
              </option>
              {projectTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          {formError && (
            <p role="alert" className="text-[13px] text-danger">
              {formError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting || !form.projectId || !form.name.trim()}
            >
              Create Deliverable
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={uploadTarget !== null}
        onClose={() => setUploadTarget(null)}
        label="Attach a file"
        title={uploadTarget ? `Attach to ${uploadTarget.name}` : "Attach a file"}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();

            const input = event.currentTarget.elements.namedItem(
              "attachment",
            ) as HTMLInputElement | null;

            const file = input?.files?.[0];

            if (file) {
              handleUpload(file);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="deliverable-attachment"
            >
              File
            </label>
            <input
              id="deliverable-attachment"
              name="attachment"
              type="file"
              className="block w-full text-[13px] text-ink-muted file:mr-3 file:rounded-sm file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-[13px] file:text-ink"
            />
          </div>

          {uploadError && (
            <p role="alert" className="text-[13px] text-danger">
              {uploadError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUploadTarget(null)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={uploading} disabled={uploading}>
              Upload
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default DeliverablesPage;
