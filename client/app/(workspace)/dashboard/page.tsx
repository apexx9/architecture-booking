"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  Sparkles,
  UserPlus,
} from "lucide-react";

import Card, { CardBody, CardHeader } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import StatusBadge from "@/components/ui/status-badge";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDate, pluralise } from "@/lib/format";
import { getStatusPresentation, type AnyStatus } from "@/lib/domain/status";
import { projectsService, type Project } from "@/services/projects.service";
import { tasksService, type Task } from "@/services/tasks.service";
import {
  deliverablesService,
  type Deliverable,
} from "@/services/deliverables.service";
import { leadsService, type Lead } from "@/services/leads.service";
import { clientsService, type Client } from "@/services/clients.service";

/** Statuses that mean the work is finished and it should stop nagging. */
const CLOSED_TASK_STATUSES: Task["status"][] = ["DONE", "CANCELLED"];

type Breakdown = {
  status: AnyStatus;
  count: number;
}[];

/**
 * Counts per status, ordered by the vocabulary's own progression rather than by
 * size — a list sorted by frequency makes "Urgent" disappear below the fold.
 */
const byStatus = <T extends { status: AnyStatus }>(items: T[]): Breakdown => {
  const counts = new Map<AnyStatus, number>();

  for (const item of items) {
    counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) =>
      getStatusPresentation(a.status).label.localeCompare(
        getStatusPresentation(b.status).label,
      ),
    );
};

const DashboardPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Taken once per load so "overdue" cannot flip between renders. */
  const [now, setNow] = useState(0);

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [projectData, taskData, deliverableData, leadData, clientData] =
        await Promise.all([
          projectsService.list(),
          tasksService.list(),
          deliverablesService.list(),
          leadsService.getAll(),
          clientsService.getAll(),
        ]);

      setProjects(projectData);
      setTasks(taskData);
      setDeliverables(deliverableData);
      setLeads(leadData);
      setClients(clientData);
      setNow(Date.now());
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

  const projectName = (projectId: string) =>
    projects.find((project) => project.id === projectId)?.name ?? null;

  /*
   * Everything below is a count or a date comparison over data the API already
   * returns. There is no revenue, margin or utilisation figure here, because
   * the API exposes none — a dashboard that showed them would be inventing the
   * practice's economics.
   */
  const overdue = tasks.filter(
    (task) =>
      now > 0 &&
      Boolean(task.dueDate) &&
      !CLOSED_TASK_STATUSES.includes(task.status) &&
      new Date(task.dueDate ?? now).getTime() < now,
  );

  const upcoming = tasks
    .filter((task) => {
      if (!task.dueDate) return false;
      if (CLOSED_TASK_STATUSES.includes(task.status)) return false;

      const time = new Date(task.dueDate as string).getTime();

      return time >= now && time < now + 7 * 24 * 60 * 60 * 1000;
    })
    .sort(
      (a, b) =>
        new Date(a.dueDate ?? now).getTime() -
        new Date(b.dueDate ?? now).getTime(),
    )
    .slice(0, 6);

  const hasAnyData =
    projects.length > 0 ||
    tasks.length > 0 ||
    deliverables.length > 0 ||
    leads.length > 0 ||
    clients.length > 0;

  /*
   * Each step is something the API genuinely supports, and each one is `done`
   * only once the practice has actually done it. The list is shown while any
   * step is outstanding, not only when everything is empty — a practice with a
   * client but no projects still needs to be told about projects.
   */
  const steps = [
    {
      done: clients.length > 0,
      href: "/clients",
      title: "Add a client",
      body: "Someone you have an engagement with. Projects can exist without one, but linking them makes the relationship visible.",
    },
    {
      done: projects.length > 0,
      href: "/projects",
      title: "Create a project",
      body: "One commission. It holds the tasks and deliverables that belong to it.",
    },
    {
      done: tasks.length > 0,
      href: "/tasks",
      title: "Add tasks",
      body: "The work itself, with a status, a priority and a due date.",
    },
    {
      done: deliverables.length > 0,
      href: "/deliverables",
      title: "Track deliverables",
      body: "Drawings, reports and issued documents, and where each one stands with the client.",
    },
    {
      done: leads.length > 0,
      href: "/leads",
      title: "Capture leads",
      body: "Enquiries that have not become clients yet. Convert one to carry its details across.",
    },
  ];

  const remainingSteps = steps.filter((step) => !step.done);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
      <header className="motion-enter">
        <h1 className="font-display text-[28px] font-light text-ink">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
          {hasAnyData
            ? "Where your work stands right now."
            : "Start here — set up your practice in the order that makes sense."}
        </p>
      </header>

      {loadError && (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger"
        >
          {loadError}{" "}
          <button
            type="button"
            onClick={load}
            className="underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      )}

      {/* Onboarding. Every step is a real API capability; nothing here is a
          placeholder for something the practice cannot actually do. */}
      {!loading && remainingSteps.length > 0 && (
        <Card className="mt-6 motion-enter">
          <CardHeader
            title="Get set up"
            description={
              remainingSteps.length === steps.length
                ? "Five steps, in the order they depend on each other."
                : `${pluralise(
                    remainingSteps.length,
                    "step",
                  )} left, in the order they depend on each other.`
            }
          />
          <CardBody>
            <ol className="space-y-3">
              {steps.map((step) => (
                <li
                  key={step.title}
                  className="flex flex-wrap items-start gap-3 rounded-sm border border-line p-3"
                >
                  <span className="mt-0.5 shrink-0">
                    {step.done ? (
                      <CheckCircle2
                        className="size-5 text-ink-subtle"
                        aria-hidden="true"
                      />
                    ) : (
                      <Sparkles
                        className="size-5 text-ink-subtle"
                        aria-hidden="true"
                      />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[14px] text-ink">
                      {step.title}
                      {step.done && (
                        <span className="text-[13px] text-ink-subtle">
                          done
                        </span>
                      )}
                    </p>

                    <p className="mt-1 text-[13px] leading-relaxed text-ink-subtle">
                      {step.body}
                    </p>
                  </div>

                  <Link
                    href={step.href}
                    className="shrink-0 rounded-sm text-[13px] text-ink underline underline-offset-2 hover:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {step.done ? "Add more" : "Start"}
                  </Link>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      {loading ? (
        <div
          role="status"
          className="mt-6 py-12 text-center text-[14px] text-ink-subtle"
        >
          Loading…
        </div>
      ) : hasAnyData ? (
        <div className="motion-enter-stagger mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card style={{ "--reveal-index": 0 } as React.CSSProperties}>
            <CardHeader
              title="Deadlines"
              description={
                overdue.length > 0
                  ? `${pluralise(overdue.length, "task")} overdue`
                  : "Nothing overdue"
              }
            />
            <CardBody>
              {upcoming.length === 0 && overdue.length === 0 ? (
                <EmptyState
                  icon={<CalendarClock className="size-4" aria-hidden="true" />}
                  title="No deadlines"
                  description="Give a task a due date and it will show up here."
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
                  {[...overdue, ...upcoming].slice(0, 8).map((task) => (
                    <li
                      key={task.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] text-ink">
                          {task.title}
                        </p>

                        <p className="mt-0.5 text-[13px] text-ink-subtle">
                          {projectName(task.projectId) ?? "Unknown project"}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={task.priority} />

                        <span
                          className={[
                            "text-[13px] tabular-nums",
                            overdue.includes(task)
                              ? "text-danger"
                              : "text-ink-subtle",
                          ].join(" ")}
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card style={{ "--reveal-index": 1 } as React.CSSProperties}>
            <CardHeader
              title="Where your work stands"
              description="Counts by status, from your own data"
            />
            <CardBody>
              <div className="space-y-5">
                <section>
                  <h2 className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <FolderKanban className="size-4" aria-hidden="true" />
                    Projects
                    <span className="text-ink-subtle tabular-nums">
                      {projects.length}
                    </span>
                  </h2>

                  <StatusBreakdown items={byStatus(projects)} />
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <ListChecks className="size-4" aria-hidden="true" />
                    Tasks
                    <span className="text-ink-subtle tabular-nums">
                      {tasks.length}
                    </span>
                  </h2>

                  <StatusBreakdown items={byStatus(tasks)} />
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <CalendarClock className="size-4" aria-hidden="true" />
                    Deliverables
                    <span className="text-ink-subtle tabular-nums">
                      {deliverables.length}
                    </span>
                  </h2>

                  <StatusBreakdown items={byStatus(deliverables)} />
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <UserPlus className="size-4" aria-hidden="true" />
                    Leads
                    <span className="text-ink-subtle tabular-nums">
                      {leads.length}
                    </span>
                  </h2>

                  <StatusBreakdown items={byStatus(leads)} />
                </section>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

/** Status pills with their counts. Empty states are stated, not padded out. */
const StatusBreakdown = ({ items }: { items: Breakdown }) => {
  if (items.length === 0) {
    return <p className="mt-2 text-[13px] text-ink-subtle">None yet.</p>;
  }

  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item.status}
          className="inline-flex items-center gap-1.5 rounded-sm border border-line px-2 py-1"
        >
          <StatusBadge status={item.status} />
          <span className="text-[13px] text-ink-subtle tabular-nums">
            {item.count}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default DashboardPage;
