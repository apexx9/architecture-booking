"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Archive, ListChecks, Pencil, Plus } from "lucide-react";

import Button from "@/components/ui/button";
import DateInput from "@/components/ui/date-input";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import SearchField from "@/components/ui/search-field";
import Skeleton from "@/components/ui/skeleton";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import StatusBadge from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api/errors";
import DataView from "@/components/workspace/data-view";
import { ErrorState, InlineError } from "@/components/workspace/error-state";
import { FilterChips } from "@/components/workspace/filter-chips";
import PageHeader from "@/components/workspace/page-header";
import PageToolbar from "@/components/workspace/page-toolbar";
import { compareBy, useTableSort } from "@/hooks/use-table-sort";
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
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

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

    if (state.description.trim())
      payload.description = state.description.trim();
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
      toast({
        tone: "success",
        title: "Task archived",
        description: task.title,
      });
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

  const visible = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (projectFilter !== "all" && task.projectId !== projectFilter)
      return false;
    if (!needle) return true;

    return [
      task.title,
      task.description,
      projectName(task.projectId),
      phaseName(task.phaseId),
      assigneeName(task.assigneeId),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  /*
   * Due date is the column a user actually sorts by, and it is the one where
   * "no date" has to stay out of the way: a task without a due date is not the
   * most urgent thing on the list, so nullish values sort last either way.
   *
   * The comparator receives the active sort key, and reads the lookup tables
   * directly rather than through `projectName`/`assigneeName`, so its
   * dependencies are the data it actually uses rather than two closures that are
   * rebuilt on every render.
   */
  const compareTasks = useCallback(
    (key: string | null, a: Task, b: Task) => {
      if (key === "title") return compareBy<Task>((task) => task.title)(a, b);

      if (key === "project") {
        return compareBy<Task>(
          (task) =>
            projects.find((project) => project.id === task.projectId)?.name,
        )(a, b);
      }

      if (key === "assignee") {
        return compareBy<Task>(
          (task) =>
            members.find((member) => member.userId === task.assigneeId)?.email,
        )(a, b);
      }

      return compareBy<Task>((task) => task.dueDate)(a, b);
    },
    [projects, members],
  );

  const { sort, onSortChange, sorted } = useTableSort(visible, compareTasks);

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
        <PageHeader
          title="Tasks"
          description="Track work across your projects. Every task belongs to exactly one project."
          actions={
            canCreate ? (
              <Button onClick={openCreate}>
                <Plus className="size-4" aria-hidden="true" />
                New task
              </Button>
            ) : undefined
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
          <TasksSkeleton />
        ) : loadError && tasks.length === 0 ? (
          <ErrorState
            title="Couldn't load tasks"
            description="We couldn't retrieve your tasks right now."
            detail={loadError}
            onRetry={load}
            className="border-t border-line"
          />
        ) : tasks.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<ListChecks className="size-4" aria-hidden="true" />}
              title="No tasks yet"
              description={
                canCreate
                  ? "Tasks you create against a project will appear here."
                  : "Create a project first — every task belongs to one."
              }
              action={
                canCreate ? (
                  <Button onClick={openCreate}>
                    <Plus className="size-4" aria-hidden="true" />
                    New task
                  </Button>
                ) : (
                  <Link
                    href="/projects"
                    className="inline-flex items-center rounded-sm border border-line px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Go to projects
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <>
            <PageToolbar
              className="mt-6"
              count={
                needle || statusFilter !== "all" || projectFilter !== "all"
                  ? `${sorted.length} of ${tasks.length}`
                  : pluralise(tasks.length, "task")
              }
              filters={
                <>
                  <FilterChips
                    label="Filter by status"
                    allLabel="All statuses"
                    options={TASK_STATUS_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                      count: tasks.filter(
                        (task) => task.status === option.value,
                      ).length,
                    }))}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  />

                  <FilterChips
                    label="Filter by project"
                    allLabel="All projects"
                    options={projects.map((project) => ({
                      value: project.id,
                      label: project.name,
                      count: tasks.filter(
                        (task) => task.projectId === project.id,
                      ).length,
                    }))}
                    value={projectFilter}
                    onChange={setProjectFilter}
                  />
                </>
              }
            >
              <SearchField
                label="Search tasks"
                placeholder="Title, project or assignee"
                value={query}
                onChange={setQuery}
              />
            </PageToolbar>

            <div className="mt-6">
              {sorted.length === 0 ? (
                <EmptyState
                  title="Nothing matches"
                  description="No task matches the current search and filters."
                  size="sm"
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setQuery("");
                        setStatusFilter("all");
                        setProjectFilter("all");
                      }}
                    >
                      Clear search and filters
                    </Button>
                  }
                />
              ) : (
                <DataView<Task>
                  label="Tasks"
                  rows={sorted}
                  rowKey={(task) => task.id}
                  sort={sort}
                  onSortChange={onSortChange}
                  primary={(task) => task.title}
                  secondary={(task) =>
                    [projectName(task.projectId), phaseName(task.phaseId)]
                      .filter(Boolean)
                      .join(" · ") || "No project or phase"
                  }
                  meta={(task) => (
                    <>
                      <StatusBadge status={task.status} />
                      <StatusBadge status={task.priority} />

                      {task.dueDate && (
                        <span
                          className={[
                            "text-[12px] tabular-nums",
                            isOverdue(task) ? "text-danger" : "text-ink-subtle",
                          ].join(" ")}
                        >
                          {isOverdue(task) ? "Overdue · " : "Due "}
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </>
                  )}
                  actions={(task) => {
                    const isPending = pending?.id === task.id;

                    return (
                      <>
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
                          className="w-[132px]"
                        />

                        {CLOSED_STATUSES.includes(task.status) && (
                          <Button
                            size="sm"
                            variant="tertiary"
                            disabled={isPending}
                            onClick={() =>
                              advance(task, { status: "IN_PROGRESS" })
                            }
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
                      </>
                    );
                  }}
                  columns={[
                    {
                      key: "title",
                      header: "Task",
                      sortable: true,
                      cell: (task) => task.title,
                    },
                    {
                      key: "project",
                      header: "Project",
                      sortable: true,
                      hideBelowLg: true,
                      cell: (task) => projectName(task.projectId) ?? "—",
                    },
                    {
                      key: "phase",
                      header: "Phase",
                      hideBelowLg: true,
                      cell: (task) => phaseName(task.phaseId) ?? "—",
                    },
                    {
                      key: "assignee",
                      header: "Assignee",
                      sortable: true,
                      hideBelowMd: true,
                      cell: (task) =>
                        assigneeName(task.assigneeId) ?? "Unassigned",
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
                      hideBelowMd: true,
                      cell: (task) => <StatusBadge status={task.priority} />,
                    },
                    {
                      key: "due",
                      header: "Due",
                      numeric: true,
                      sortable: true,
                      width: "w-36",
                      cell: (task) =>
                        task.dueDate ? (
                          <span
                            className={
                              isOverdue(task) ? "text-danger" : undefined
                            }
                          >
                            {formatDate(task.dueDate)}
                          </span>
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
                submitting ||
                !form.title.trim() ||
                (!editing && !form.projectId)
              }
            >
              {editing ? "Save changes" : "Create task"}
            </Button>
          </>
        }
      >
        <form
          id="task-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
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

/**
 * Mirrors the settled page — toolbar rule, then a table — so the transition
 * does not reflow.
 */
const TasksSkeleton = () => (
  <div className="mt-6" aria-busy="true">
    <span className="sr-only">Loading tasks…</span>

    <Skeleton className="h-14 w-full" />
    <Skeleton className="mt-6 h-72 w-full" />
  </div>
);

export default TasksPage;
