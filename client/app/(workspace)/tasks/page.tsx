"use client";

import { useEffect, useState } from "react";
import { Archive, ListChecks, Pencil, Plus } from "lucide-react";

import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import DateInput from "@/components/ui/date-input";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import SearchField from "@/components/ui/search-field";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import StatusBadge from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDate, pluralise } from "@/lib/format";
import { toPriorityOptions, toStatusOptions } from "@/lib/domain/status";
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
import { phasesService, type ProjectPhase } from "@/services/phases.service";
import { tenancyApi, memberName, type TenantMember } from "@/actions/tenancy";

/** Statuses where the task is finished and "Reopen" applies. */
const CLOSED_STATUSES: TaskStatus[] = ["DONE", "CANCELLED"];

const TASK_STATUS_OPTIONS = toStatusOptions(TASK_STATUSES);
const TASK_PRIORITY_OPTIONS = toPriorityOptions(TASK_PRIORITIES);

const emptyForm = {
  projectId: "",
  title: "",
  description: "",
  status: "TODO" as TaskStatus,
  priority: "MEDIUM" as TaskPriority,
  dueDate: "",
  phaseId: "",
  assigneeId: "",
};

type FormState = typeof emptyForm;

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  /** Picker options only. Both are tenant-wide lookups whose failure should
   *  degrade the form's optional fields, not the page. */
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [members, setMembers] = useState<TenantMember[]>([]);

  /**
   * A single clock reading, taken when the list loads, so "overdue" cannot flip
   * between renders and `Date.now()` is never called during one.
   */
  const [now, setNow] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Task | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Failures from an action on a page that still has data. Kept apart from
   *  `loadError` so a failed status change does not masquerade as "the whole
   *  list failed to load". */
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    id: string;
    action: "status" | "archive";
  } | null>(null);

  const [archiveTarget, setArchiveTarget] = useState<Task | null>(null);

  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      // Tasks require a projectId, so the project list has to be present
      // before the create form is usable. Fetch in parallel; only the
      // projects failure blocks creation.
      const [taskData, projectData] = await Promise.all([
        tasksService.list(),
        projectsService.list(),
      ]);

      setTasks(taskData);
      setProjects(projectData);
      setNow(Date.now());
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }

    // Optional pickers. Phases are tenant-wide templates and members come from
    // the tenancy endpoint; neither is required to view or edit a task.
    void phasesService
      .list()
      .then(setPhases)
      .catch(() => undefined);
    void tenancyApi
      .listMembers()
      .then(setMembers)
      .catch(() => undefined);
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

  const projectName = (projectId: string) =>
    projects.find((project) => project.id === projectId)?.name ?? null;

  const phaseName = (phaseId?: string | null) =>
    phases.find((phase) => phase.id === phaseId)?.name ?? null;

  const assigneeName = (assigneeId?: string | null) => {
    const member = members.find((item) => item.userId === assigneeId);

    return member ? memberName(member) : null;
  };

  /** Purely a comparison against the clock; the row already states the date. */
  const isOverdue = (task: Task) =>
    now > 0 &&
    Boolean(task.dueDate) &&
    !CLOSED_STATUSES.includes(task.status) &&
    new Date(task.dueDate ?? now).getTime() < now;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setActionError(null);
    setOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setForm({
      projectId: task.projectId,
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.slice(0, 10) ?? "",
      phaseId: task.phaseId ?? "",
      assigneeId: task.assigneeId ?? "",
    });
    setFormError(null);
    setActionError(null);
    setOpen(true);
  };

  const createPayload = (state: FormState): CreateTaskInput => {
    const payload: CreateTaskInput = {
      projectId: state.projectId,
      title: state.title.trim(),
      status: state.status,
      priority: state.priority,
    };

    if (state.description.trim()) payload.description = state.description.trim();
    if (state.phaseId) payload.phaseId = state.phaseId;
    if (state.assigneeId) payload.assigneeId = state.assigneeId;
    if (state.dueDate) payload.dueDate = new Date(state.dueDate).toISOString();

    return payload;
  };

  /**
   * The project is fixed once a task exists — moving it is a different action
   * from editing it — so `projectId` is left out and every emptied optional
   * becomes an explicit `null`, since `PATCH /tasks/:id` writes only the keys it
   * receives and would otherwise keep the old value.
   */
  const editPayload = (state: FormState): UpdateTaskInput => ({
    title: state.title.trim(),
    status: state.status,
    priority: state.priority,
    description: state.description.trim() || null,
    phaseId: state.phaseId || null,
    assigneeId: state.assigneeId || null,
    dueDate: state.dueDate ? new Date(state.dueDate).toISOString() : null,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    /*
     * The native `<select required>` used to block submission in the browser.
     * A custom listbox cannot carry constraint validation, so the same check
     * happens here and reports through the form's existing error line.
     */
    if (!editing && !form.projectId) {
      setFormError("Select a project.");

      return;
    }

    if (!form.title.trim()) {
      setFormError("Enter a task title.");

      return;
    }

    try {
      setSubmitting(true);

      if (editing) {
        const updated = await tasksService.update(
          editing.id,
          editPayload(form),
        );

        setTasks((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setOpen(false);
        setEditing(null);
        setForm(emptyForm);
        toast({
          tone: "success",
          title: "Task updated",
          description: updated.title,
        });
      } else {
        const created = await tasksService.create(createPayload(form));

        setTasks((prev) => [created, ...prev]);
        setOpen(false);
        setEditing(null);
        setForm(emptyForm);
        toast({
          tone: "success",
          title: "Task created",
          description: created.title,
        });
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Status and priority are advanced in place. Only non-nullable fields are
   * changed here, so the optimistic merge cannot widen a `Task`'s type — clearing
   * a field goes through the edit dialog instead.
   */
  const advance = async (
    task: Task,
    patch: Partial<Pick<Task, "status" | "priority">>,
  ) => {
    setActionError(null);
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, ...patch } : item)),
    );

    try {
      setPending({ id: task.id, action: "status" });

      const updated = await tasksService.update(task.id, patch);

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? updated : item)),
      );
    } catch (error) {
      // Put the row back the way it was; the optimistic edit was a guess.
      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? task : item)),
      );

      const description = getApiErrorMessage(error);

      setActionError(description);
      toast({ tone: "error", title: "Could not update task", description });
    } finally {
      setPending(null);
    }
  };

  const archive = async (task: Task) => {
    setActionError(null);

    try {
      setPending({ id: task.id, action: "archive" });

      await tasksService.archive(task.id);

      setTasks((prev) => prev.filter((item) => item.id !== task.id));
      setArchiveTarget(null);
      toast({ tone: "success", title: "Task archived", description: task.title });
    } catch (error) {
      const description = getApiErrorMessage(error);

      setActionError(description);
      setArchiveTarget(null);
      toast({ tone: "error", title: "Could not archive task", description });
    } finally {
      setPending(null);
    }
  };

  /*
   * Filtering runs over the list the page has already loaded. There is no search
   * endpoint, so this narrows what is on screen rather than querying the server.
   */
  const needle = query.trim().toLowerCase();

  const visible = needle
    ? tasks.filter((task) =>
        [
          task.title,
          task.description,
          projectName(task.projectId),
          phaseName(task.phaseId),
          assigneeName(task.assigneeId),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : tasks;

  const canCreate = projects.length > 0;

  const phaseOptions = phases.map((phase) => ({
    value: phase.id,
    label: phase.name,
  }));

  const assigneeOptions = members.map((member) => ({
    value: member.userId,
    label: memberName(member),
  }));

  return (
    <>
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
            <Button variant="primary" onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              New task
            </Button>
          )}
        </header>

        {actionError && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger"
          >
            {actionError}
          </p>
        )}

        {!loading && tasks.length > 0 && (
          <div className="mt-6 max-w-sm motion-enter">
            <SearchField
              label="Search tasks"
              placeholder="Search by title, project or assignee"
              value={query}
              onChange={setQuery}
            />
          </div>
        )}

        <Card className="mt-6 motion-enter">
          <CardHeader
            title="All tasks"
            description={
              loading
                ? "Loading…"
                : `${pluralise(visible.length, "task")}${
                    needle && visible.length !== tasks.length
                      ? ` of ${tasks.length}`
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
            ) : loadError && tasks.length === 0 ? (
              <EmptyState
                title="Could not load tasks"
                description={loadError}
                tone="error"
                size="sm"
                action={
                  <Button variant="secondary" onClick={load}>
                    Try again
                  </Button>
                }
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
                action={
                  canCreate ? (
                    <Button variant="primary" onClick={openCreate} size="sm">
                      <Plus className="size-4" aria-hidden="true" />
                      New task
                    </Button>
                  ) : undefined
                }
              />
            ) : needle && visible.length === 0 ? (
              <EmptyState
                title="No matching tasks"
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
                {visible.map((task) => {
                  const isPending = pending?.id === task.id;
                  const project = projectName(task.projectId);
                  const phase = phaseName(task.phaseId);
                  const assignee = assigneeName(task.assigneeId);
                  const due = formatDate(task.dueDate);
                  const overdue = isOverdue(task);

                  return (
                    <li
                      key={task.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-sm border border-line p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-medium text-ink">
                            {task.title}
                          </span>

                          <StatusBadge status={task.status} />
                          <StatusBadge status={task.priority} />
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-subtle">
                          {project && <span>{project}</span>}
                          {phase && <span>{phase}</span>}
                          {assignee && <span>{assignee}</span>}

                          {due && (
                            <span className={overdue ? "text-danger" : undefined}>
                              {overdue ? "Overdue · " : "Due "}
                              {due}
                            </span>
                          )}

                          {task.description && (
                            <span className="line-clamp-1">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Select
                          aria-label={`Status for ${task.title}`}
                          options={TASK_STATUS_OPTIONS}
                          value={task.status}
                          size="sm"
                          fullWidth={false}
                          disabled={isPending}
                          onChange={(value) =>
                            advance(task, { status: value as TaskStatus })
                          }
                          className="w-[140px]"
                        />

                        {CLOSED_STATUSES.includes(task.status) && (
                          <Button
                            size="sm"
                            variant="tertiary"
                            disabled={isPending}
                            onClick={() => advance(task, { status: "IN_PROGRESS" })}
                          >
                            Reopen
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="tertiary"
                          disabled={isPending}
                          onClick={() => openEdit(task)}
                          aria-label={`Edit ${task.title}`}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>

                        <Button
                          size="sm"
                          variant="tertiary"
                          disabled={isPending}
                          onClick={() => setArchiveTarget(task)}
                          aria-label={`Archive ${task.title}`}
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

      <Dialog
        open={open}
        onClose={() => {
          if (submitting) return;

          setOpen(false);
        }}
        label={editing ? "Edit task" : "New task"}
        title={editing ? `Edit ${editing.title}` : "New task"}
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="task-form"
              variant="primary"
              loading={submitting}
              disabled={
                submitting || !form.title.trim() || (!editing && !form.projectId)
              }
            >
              {editing ? "Save changes" : "Create task"}
            </Button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/*
            A task cannot change project, so the picker is hidden while editing
            rather than disabled — a permanently greyed-out field reads as a
            fault. The project is named in the dialog title area instead.
          */}
          {editing ? (
            <p className="text-[13px] text-ink-muted">
              Project:{" "}
              <span className="text-ink">
                {projectName(editing.projectId) ?? "Unknown project"}
              </span>
            </p>
          ) : (
            <Select
              id="task-project"
              label="Project"
              placeholder="Select a project"
              required
              options={projects.map((project) => ({
                value: project.id,
                label: project.name,
              }))}
              value={form.projectId}
              onChange={(value) => setForm({ ...form, projectId: value })}
            />
          )}

          <Input
            id="task-title"
            name="title"
            label="Title"
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            data-autofocus={editing ? true : undefined}
            required
          />

          <Textarea
            id="task-description"
            name="description"
            label="Description"
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="task-status"
              label="Status"
              options={TASK_STATUS_OPTIONS}
              value={form.status}
              onChange={(value) =>
                setForm({ ...form, status: value as TaskStatus })
              }
            />

            <Select
              id="task-priority"
              label="Priority"
              options={TASK_PRIORITY_OPTIONS}
              value={form.priority}
              onChange={(value) =>
                setForm({ ...form, priority: value as TaskPriority })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="task-phase"
              label="Phase"
              placeholder="None"
              description={
                phases.length === 0 ? "No phases set up yet." : undefined
              }
              options={phaseOptions}
              value={form.phaseId}
              onChange={(value) => setForm({ ...form, phaseId: value })}
            />

            <Select
              id="task-assignee"
              label="Assignee"
              placeholder="Unassigned"
              options={assigneeOptions}
              value={form.assigneeId}
              onChange={(value) => setForm({ ...form, assigneeId: value })}
            />
          </div>

          <DateInput
            id="task-due"
            label="Due date"
            value={form.dueDate}
            onChange={(value) => setForm({ ...form, dueDate: value })}
          />

          {formError && (
            <p role="alert" className="text-[13px] text-danger">
              {formError}
            </p>
          )}
        </form>
      </Dialog>

      <Dialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        label="Archive task"
        title="Archive this task?"
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
              Archive task
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">{archiveTarget?.title}</span>{" "}
          will be removed from this list. Archiving keeps the task and its
          history, so it can be restored later.
        </p>
      </Dialog>
    </>
  );
};

export default TasksPage;