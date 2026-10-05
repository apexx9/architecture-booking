"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { clientsService, type Client } from "@/services/clients.service";
import {
  deliverablesService,
  type Deliverable,
} from "@/services/deliverables.service";
import { leadsService, type Lead } from "@/services/leads.service";
import { projectsService, type Project } from "@/services/projects.service";
import { tasksService, type Task } from "@/services/tasks.service";

/**
 * Everything the dashboard reads, fetched once.
 *
 * The dashboard is a synthesis page, so it needs the whole practice rather than
 * one slice of it. Six sequential requests would be needlessly slow, so they are
 * issued together.
 *
 * Every figure on the dashboard is derived from these arrays by the pure helpers
 * below. That separation is deliberate: "what is overdue" is a rule, and rules
 * that get re-implemented per screen drift apart. There is no revenue, margin or
 * utilisation figure anywhere here, because the API exposes none and a dashboard
 * that showed them would be inventing the practice's economics.
 */

/** Task statuses that mean the work is finished and should stop nagging. */
export const CLOSED_TASK_STATUSES: Task["status"][] = ["DONE", "CANCELLED"];

/** Deliverable statuses that mean the client is the one holding it up. */
export const AWAITING_CLIENT_STATUSES: Deliverable["status"][] = [
  "SENT_TO_CLIENT",
  "CLIENT_REVIEW",
];

export interface ProjectRollup {
  project: Project;
  /** Tasks attached to the project, open or closed. */
  tasks: Task[];
  deliverables: Deliverable[];
  doneTasks: number;
  /** Earliest due date among open tasks with a due date. */
  nextDue: string | null;
  /** Open tasks whose due date has passed. */
  overdueCount: number;
}

export interface DashboardData {
  projects: Project[];
  tasks: Task[];
  deliverables: Deliverable[];
  leads: Lead[];
  clients: Client[];

  overdueTasks: Task[];
  dueToday: Task[];
  dueThisWeek: Task[];
  awaitingClient: Deliverable[];
  newLeads: Lead[];

  /** Projects that are not finished, most urgent first. */
  liveProjects: ProjectRollup[];
  /** Leads that have not reached an outcome. */
  openLeads: Lead[];
  /** Nothing anywhere — the practice has not started yet. */
  isEmpty: boolean;
}

const startOfDay = (timestamp: number) => {
  const date = new Date(timestamp);

  date.setHours(0, 0, 0, 0);

  return date.getTime();
};

const sameDay = (a: number, b: number) =>
  startOfDay(a) === startOfDay(b);

const WEEK = 7 * 24 * 60 * 60 * 1000;

const byDateAscending = (a: { dueDate?: string | null }, b: { dueDate?: string | null }) =>
  new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime();

/**
 * Turns the raw lists into the dashboard's read model.
 *
 * `now` is a parameter rather than `Date.now()` read inline so that one render
 * cannot disagree with itself: a task cannot be overdue in the "attention" count
 * and not overdue in the "due soon" list.
 */
export function buildDashboard(input: {
  projects: Project[];
  tasks: Task[];
  deliverables: Deliverable[];
  leads: Lead[];
  clients: Client[];
  now: number;
}): DashboardData {
  const { projects, tasks, deliverables, leads, clients, now } = input;

  const openTasks = tasks.filter(
    (task) => !CLOSED_TASK_STATUSES.includes(task.status),
  );

  const dated = openTasks.filter((task) => Boolean(task.dueDate));

  const overdueTasks = dated
    .filter((task) => new Date(task.dueDate as string).getTime() < startOfDay(now))
    .sort(byDateAscending);

  const dueToday = dated
    .filter((task) => sameDay(new Date(task.dueDate as string).getTime(), now))
    .sort(byDateAscending);

  const dueThisWeek = dated
    .filter((task) => {
      const time = new Date(task.dueDate as string).getTime();

      return time > now && time <= now + WEEK;
    })
    .sort(byDateAscending);

  const awaitingClient = deliverables.filter((deliverable) =>
    AWAITING_CLIENT_STATUSES.includes(deliverable.status),
  );

  const newLeads = leads.filter((lead) => lead.status === "NEW");

  const rollups = new Map<string, ProjectRollup>();

  for (const project of projects) {
    rollups.set(project.id, {
      project,
      tasks: [],
      deliverables: [],
      doneTasks: 0,
      nextDue: null,
      overdueCount: 0,
    });
  }

  for (const task of tasks) {
    const rollup = rollups.get(task.projectId);

    if (!rollup) continue;

    rollup.tasks.push(task);

    if (CLOSED_TASK_STATUSES.includes(task.status)) {
      rollup.doneTasks += 1;

      continue;
    }

    if (task.dueDate) {
      const time = new Date(task.dueDate).getTime();

      if (!rollup.nextDue || time < new Date(rollup.nextDue).getTime()) {
        rollup.nextDue = task.dueDate;
      }

      if (time < startOfDay(now)) rollup.overdueCount += 1;
    }
  }

  for (const deliverable of deliverables) {
    rollups.get(deliverable.projectId)?.deliverables.push(deliverable);
  }

  /*
   * "Live" means not finished and not cancelled. Anything archived is already
   * excluded by the services, so this is the only filter needed.
   */
  const liveProjects = [...rollups.values()]
    .filter(
      (rollup) =>
        rollup.project.status !== "COMPLETED" &&
        rollup.project.status !== "CANCELLED",
    )
    .sort((a, b) => {
      /* Projects with something overdue float to the top. */
      if (a.overdueCount !== b.overdueCount) {
        return b.overdueCount - a.overdueCount;
      }

      /* Then whatever is due soonest. */
      const left = a.nextDue ? new Date(a.nextDue).getTime() : Infinity;
      const right = b.nextDue ? new Date(b.nextDue).getTime() : Infinity;

      if (left !== right) return left - right;

      return a.project.name.localeCompare(b.project.name);
    });

  const openLeads = leads
    .filter((lead) => lead.status !== "WON" && lead.status !== "LOST")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    projects,
    tasks,
    deliverables,
    leads,
    clients,
    overdueTasks,
    dueToday,
    dueThisWeek,
    awaitingClient,
    newLeads,
    liveProjects,
    openLeads,
    isEmpty:
      projects.length === 0 &&
      tasks.length === 0 &&
      deliverables.length === 0 &&
      leads.length === 0 &&
      clients.length === 0,
  };
}

/** The one fetch. Shared by the mount effect and the retry button. */
const fetchAll = async () => {
  const [projects, tasks, deliverables, leads, clients] = await Promise.all([
    projectsService.list(),
    tasksService.list(),
    deliverablesService.list(),
    leadsService.getAll(),
    clientsService.getAll(),
  ]);

  return buildDashboard({ projects, tasks, deliverables, leads, clients, now: Date.now() });
};

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await fetchAll());
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * The mount fetch deliberately does not call `setLoading` — the state is
   * already `true`, and setting it again here would be a render before anything
   * had been requested.
   */
  useEffect(() => {
    let cancelled = false;

    fetchAll()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => ({ data, loading, error, reload }),
    [data, loading, error, reload],
  );
}

export default useDashboardData;