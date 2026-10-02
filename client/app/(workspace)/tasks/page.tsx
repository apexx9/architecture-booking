"use client";

import { useEffect, useState } from "react";
import { ListChecks, Plus } from "lucide-react";

import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  tasksService,
  type CreateTaskInput,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskInput,
} from "@/services/tasks.service";
import { projectsService, type Project } from "@/services/projects.service";

/** Statuses where the task is finished and the row should read as resolved. */
const CLOSED_STATUSES: TaskStatus[] = ["DONE", "CANCELLED"];

const PRIORITY_TONE = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger",
} as const satisfies Record<TaskPriority, "neutral" | "info" | "warning" | "danger">;

const humanise = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDueDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const emptyForm = {
  projectId: "",
  title: "",
  description: "",
  status: "TODO" as TaskStatus,
  priority: "MEDIUM" as TaskPriority,
  dueDate: "",
};

type FormState = typeof emptyForm;

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Tasks require a projectId, so the project list has to be present
        // before the create form is usable. Fetch in parallel; only the
        // projects failure blocks creation.
        const [taskData, projectData] = await Promise.all([
          tasksService.list(),
          projectsService.list(),
        ]);

        if (!cancelled) {
          setTasks(taskData);
          setProjects(projectData);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    const payload: CreateTaskInput = {
      projectId: form.projectId,
      title: form.title,
      status: form.status,
      priority: form.priority,
    };

    if (form.description.trim()) {
      payload.description = form.description.trim();
    }

    // The API takes an ISO instant; `<input type="date">` gives a plain date.
    if (form.dueDate) {
      payload.dueDate = new Date(form.dueDate).toISOString();
    }

    try {
      setSubmitting(true);

      const created = await tasksService.create(payload);

      setTasks((prev) => [created, ...prev]);
      setOpen(false);
      setForm(emptyForm);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Status and priority are advanced in place. Archived tasks are left alone:
   * the API has no "unarchive" route, so offering the control would be a dead
   * end.
   */
  const advance = async (task: Task, patch: UpdateTaskInput) => {
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, ...patch } : item)),
    );

    try {
      const updated = await tasksService.update(task.id, patch);

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? updated : item)),
      );
    } catch (error) {
      // Put the row back the way it was; the optimistic edit was a guess.
      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? task : item)),
      );

      setLoadError(getApiErrorMessage(error));
    }
  };

  const canCreate = projects.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
      <header className="motion-enter flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-light text-ink">
            Tasks
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
            Track work across your projects.
          </p>
        </div>

        {canCreate && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New Task
          </Button>
        )}
      </header>

      <Card className="mt-6 motion-enter">
        <CardHeader title="All Tasks" description={`${tasks.length} tasks`} />
        <CardBody>
          {loading ? (
            <div className="py-8 text-center text-[14px] text-ink-subtle">
              Loading...
            </div>
          ) : loadError && tasks.length === 0 ? (
            <EmptyState
              title="Could not load tasks"
              description={loadError}
              tone="error"
              size="sm"
            />
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="size-4" aria-hidden="true" />}
              title="No tasks yet"
              description={
                canCreate
                  ? "Tasks you create against a project will appear here."
                  : "Create a project first — every task belongs to one."
              }
              size="sm"
            />
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => {
                const project = projects.find(
                  (item) => item.id === task.projectId,
                );

                const due = formatDueDate(task.dueDate);

                return (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-sm border border-line p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-ink">
                        {task.title}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-subtle">
                        {project && <span>{project.name}</span>}

                        {task.description && (
                          <span className="line-clamp-1">
                            {task.description}
                          </span>
                        )}

                        {due && <span>Due {due}</span>}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge tone={PRIORITY_TONE[task.priority]} dot>
                        {humanise(task.priority)}
                      </Badge>

                      {task.isArchived ? (
                        <Badge tone="neutral">Archived</Badge>
                      ) : (
                        <>
                          <label className="sr-only" htmlFor={`status-${task.id}`}>
                            Status for {task.title}
                          </label>
                          <select
                            id={`status-${task.id}`}
                            value={task.status}
                            onChange={(event) =>
                              advance(task, {
                                status: event.target.value as TaskStatus,
                              })
                            }
                            className="h-8 rounded-sm border border-line bg-surface px-2 text-[12px] text-ink"
                          >
                            {TASK_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {humanise(status)}
                              </option>
                            ))}
                          </select>

                          {CLOSED_STATUSES.includes(task.status) && (
                            <button
                              type="button"
                              onClick={() =>
                                advance(task, { status: "IN_PROGRESS" })
                              }
                              className="text-[12px] text-ink-subtle underline underline-offset-2 hover:text-ink"
                            >
                              Reopen
                            </button>
                          )}
                        </>
                      )}
                    </div>
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
        label="New Task"
        title="New Task"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-ink" htmlFor="task-project">
              Project
            </label>
            <select
              id="task-project"
              value={form.projectId}
              onChange={(event) =>
                setForm({ ...form, projectId: event.target.value })
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
            <label className="mb-1 block text-sm text-ink" htmlFor="task-title">
              Title
            </label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              required
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="task-description"
            >
              Description
            </label>
            <Input
              id="task-description"
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
                htmlFor="task-status"
              >
                Status
              </label>
              <select
                id="task-status"
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as TaskStatus,
                  })
                }
                className="h-10 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink"
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanise(status)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-ink"
                htmlFor="task-priority"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={form.priority}
                onChange={(event) =>
                  setForm({
                    ...form,
                    priority: event.target.value as TaskPriority,
                  })
                }
                className="h-10 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink"
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {humanise(priority)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink" htmlFor="task-due">
              Due date
            </label>
            <Input
              id="task-due"
              type="date"
              value={form.dueDate}
              onChange={(event) =>
                setForm({ ...form, dueDate: event.target.value })
              }
            />
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
              disabled={submitting || !form.projectId || !form.title.trim()}
            >
              Create Task
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default TasksPage;