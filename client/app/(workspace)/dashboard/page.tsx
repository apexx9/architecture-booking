"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";

import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import SearchField from "@/components/ui/search-field";
import Skeleton from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/status-badge";
import ProjectFormDialog from "@/components/project/project-form-dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/format";
import DataView, { type DataColumn } from "@/components/workspace/data-view";
import { ErrorState } from "@/components/workspace/error-state";
import PageHeader from "@/components/workspace/page-header";
import { Section, SectionHeader } from "@/components/workspace/section";
import { Stat, StatStrip, type StatTone } from "@/components/workspace/stat";
import useDashboardData, {
  type ProjectRollup,
} from "@/hooks/use-dashboard-data";
import type { Project } from "@/services/projects.service";

/** Time-of-day greeting, so the header reads as a moment rather than a title. */
function greeting(now: Date) {
  const hour = now.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

/**
 * The dashboard is a command centre, not a set of boxes.
 *
 * The order is deliberate and answers, in sequence: what needs me, what is
 * running, what is due, and where the pipeline stands. It replaced a page that
 * led with an onboarding checklist and then showed status counts — which told a
 * returning user nothing they could act on.
 *
 * Two constraints shape everything here:
 *
 * 1. Nothing is invented. Every number comes from `useDashboardData`, which
 *    derives it from the API's own records. There is no revenue, margin,
 *    utilisation or "project health" score, because none of those can be
 *    computed from what the API returns without guessing at a schedule baseline
 *    the product has not defined.
 * 2. Empty is not zero. An attention item is shown only when it means
 *    something. A row of "0"s is noise that teaches the user to ignore the row.
 */
const DashboardPage = () => {
  const { data, loading, error, reload } = useDashboardData();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreated = (project: Project) => {
    setCreating(false);

    toast({
      tone: "success",
      title: "Project created",
      description: project.name,
    });

    reload();
  };

  if (loading) return <DashboardSkeleton />;

  if (error && !data) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <PageHeader title="Dashboard" />
        <ErrorState
          title="Couldn't load your practice"
          description="We couldn't retrieve your projects, tasks and leads."
          detail={error}
          onRetry={reload}
          className="mt-6 border-t border-line"
        />
      </div>
    );
  }

  if (!data) return null;

  const clientName = (clientId?: string | null) =>
    data.clients.find((client) => client.id === clientId)?.name ?? null;

  /*
   * Each entry is shown only when it counts something actionable. The tone marks
   * the urgency, not the sentiment: overdue is danger because it is late, and
   * due today is caution because it is imminent.
   */
  interface Attention {
    value: number;
    label: string;
    pluralLabel: string;
    hint?: string;
    href: string;
    tone: StatTone;
  }

  const allAttention: Attention[] = [
    {
      value: data.overdueTasks.length,
      label: "task overdue",
      pluralLabel: "tasks overdue",
      hint: "past its due date",
      href: "/tasks",
      tone: "danger",
    },
    {
      value: data.dueToday.length,
      label: "task due today",
      pluralLabel: "tasks due today",
      href: "/tasks",
      tone: "warning",
    },
    {
      value: data.awaitingClient.length,
      label: "awaiting client",
      pluralLabel: "awaiting client",
      href: "/deliverables",
      tone: "warning",
    },
    {
      value: data.newLeads.length,
      label: "new lead",
      pluralLabel: "new leads",
      hint: "not yet contacted",
      href: "/leads",
      tone: "neutral",
    },
  ];

  /*
   * A count of zero is not information. Showing a row of nils teaches the user
   * to stop reading the strip, which costs more than the empty space saves.
   */
  const attention = allAttention.filter((item) => item.value > 0);

  const needle = query.trim().toLowerCase();

  const projects = needle
    ? data.liveProjects.filter((rollup) =>
        [
          rollup.project.name,
          rollup.project.description,
          clientName(rollup.project.clientId),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : data.liveProjects;

  if (data.isEmpty) return <Onboarding />;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
      <PageHeader
        title={greeting(new Date())}
        description="Where your practice stands, and what is waiting on you."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New project
          </Button>
        }
      />

      {/* Kept out of PageHeader so it can sit directly under the title. */}
      {attention.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[12px] text-ink-subtle">Needs attention</h2>

          <StatStrip label="Items needing attention" className="mt-2">
            {attention.map((item) => (
              <Stat
                key={item.label}
                value={item.value}
                label={item.label}
                pluralLabel={item.pluralLabel}
                hint={item.hint}
                tone={item.tone}
                href={item.href}
              />
            ))}
          </StatStrip>
        </div>
      )}

      <Section className="mt-10" divided>
        <SectionHeader
          title="Live projects"
          description={
            data.liveProjects.length > 0
              ? `${data.liveProjects.length} running. Overdue work first, then whatever is due soonest.`
              : undefined
          }
          actions={
            <>
              {projects.length > 5 && (
                <SearchField
                  label="Search live projects"
                  placeholder="Filter"
                  value={query}
                  onChange={setQuery}
                  className="w-44"
                />
              )}

              <Link
                href="/projects"
                className="inline-flex items-center gap-1 rounded-sm text-[13px] text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                All projects
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </>
          }
        />

        <div className="mt-5">
          {projects.length === 0 ? (
            needle ? (
              <EmptyState
                title={`Nothing matches “${query.trim()}”`}
                description="Try a different name."
                size="sm"
                action={
                  <Button variant="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="No live projects"
                description="Projects appear here while they are running. Finished ones move to the projects list."
                size="sm"
                action={
                  <Link
                    href="/projects"
                    className="inline-flex items-center rounded-sm border border-line px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Go to projects
                  </Link>
                }
              />
            )
          ) : (
            <DataView<ProjectRollup>
              label="Live projects"
              rowKey={(rollup) => rollup.project.id}
              rowHref={(rollup) => `/projects/${rollup.project.id}`}
              primary={(rollup) => rollup.project.name}
              secondary={(rollup) =>
                clientName(rollup.project.clientId) ?? "No client"
              }
              meta={(rollup) => (
                <>
                  <StatusBadge status={rollup.project.status} />
                  {rollup.overdueCount > 0 && (
                    <span className="text-[12px] text-danger">
                      {rollup.overdueCount} overdue
                    </span>
                  )}
                </>
              )}
              columns={projectColumns(clientName)}
              rows={projects}
            />
          )}
        </div>
      </Section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12">
        <Section divided>
          <SectionHeader
            title="Due soon"
            description="Open tasks with a date, next seven days."
            actions={
              <Link
                href="/tasks"
                className="inline-flex items-center gap-1 rounded-sm text-[13px] text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                All tasks
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
          />

          <div className="mt-4">
            {data.dueThisWeek.length === 0 ? (
              <EmptyState
                title="Nothing due this week"
                description="Open tasks with a due date inside seven days will appear here."
                size="sm"
              />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {data.dueThisWeek.slice(0, 7).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-baseline justify-between gap-4 py-2.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                      {task.title}
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={task.priority} />
                      <span className="text-[13px] text-ink-subtle tabular-nums">
                        {formatDate(task.dueDate)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section divided>
          <SectionHeader
            title="Pipeline"
            description="Leads that have not reached an outcome."
            actions={
              <Link
                href="/leads"
                className="inline-flex items-center gap-1 rounded-sm text-[13px] text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                All leads
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
          />

          <div className="mt-4">
            {data.openLeads.length === 0 ? (
              <EmptyState
                title="No open leads"
                description="An enquiry stays here until it is won or lost."
                size="sm"
                action={
                  <Link
                    href="/leads"
                    className="inline-flex items-center rounded-sm border border-line px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Go to leads
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {data.openLeads.slice(0, 7).map((lead) => (
                  <li
                    key={lead.id}
                    className="flex items-baseline justify-between gap-4 py-2.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                      {lead.name}
                    </span>

                    <StatusBadge status={lead.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      </div>

      <ProjectFormDialog
        open={creating}
        clients={data.clients}
        onClose={() => setCreating(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};

/**
 * Columns for the live-projects table.
 *
 * Built per render because two of them resolve a client name against the loaded
 * clients.
 *
 * `Next due` and `Tasks` are computed rather than stored, so both are labelled
 * for what they actually are. There is deliberately no "health" or "% complete"
 * column: a percentage implies a schedule to compare against, and the API has no
 * baseline for one.
 */
const projectColumns = (
  clientName: (clientId?: string | null) => string | null,
): DataColumn<ProjectRollup>[] => [
  {
    key: "project",
    header: "Project",
    cell: (rollup) => rollup.project.name,
  },
  {
    key: "client",
    header: "Client",
    hideBelowLg: true,
    cell: (rollup) => clientName(rollup.project.clientId) ?? "—",
  },
  {
    key: "status",
    header: "Status",
    cell: (rollup) => <StatusBadge status={rollup.project.status} />,
  },
  {
    key: "tasks",
    header: "Tasks done",
    align: "right",
    numeric: true,
    hideBelowMd: true,
    cell: (rollup) => `${rollup.doneTasks}/${rollup.tasks.length}`,
  },
  {
    key: "deliverables",
    header: "Deliverables",
    align: "right",
    numeric: true,
    hideBelowLg: true,
    cell: (rollup) => rollup.deliverables.length,
  },
  {
    key: "nextDue",
    header: "Next due",
    align: "right",
    numeric: true,
    cell: (rollup) =>
      rollup.nextDue ? (
        <span className={rollup.overdueCount > 0 ? "text-danger" : undefined}>
          {formatDate(rollup.nextDue)}
        </span>
      ) : (
        <span className="text-ink-subtle">—</span>
      ),
  },
];

/**
 * A practice with no records anywhere.
 *
 * Deliberately not a grid of empty modules. It states that the practice is ready,
 * offers the two actions that actually unblock the product, and points at where
 * everything else lives. Every destination here is a route that exists.
 */
const Onboarding = () => (
  <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
    <PageHeader
      title="Your practice is ready to run"
      description="Add a client and a project to start tracking the work behind them."
    />

    <ol className="mt-8 max-w-2xl divide-y divide-line border-y border-line">
      {[
        {
          step: "First",
          title: "Add a client",
          body: "Someone you have an engagement with. Projects can exist without one, but linking them makes the relationship visible.",
          href: "/clients",
          cta: "Add a client",
        },
        {
          step: "Then",
          title: "Create a project",
          body: "One commission. It holds the tasks and deliverables that belong to it.",
          href: "/projects",
          cta: "Create a project",
        },
        {
          step: "Any time",
          title: "Capture leads",
          body: "Enquiries that have not become clients yet. Convert one when it does, to carry its details across.",
          href: "/leads",
          cta: "Go to leads",
        },
      ].map((item) => (
        <li
          key={item.title}
          className="flex flex-wrap items-start gap-x-6 gap-y-3 py-5"
        >
          <p className="w-20 shrink-0 text-[12px] text-ink-subtle">
            {item.step}
          </p>

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-ink">{item.title}</p>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-muted">
              {item.body}
            </p>
          </div>

          <Link
            href={item.href}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm text-[13px] text-ink underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {item.cta}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ol>
  </div>
);

/**
 * Mirrors the settled layout so the transition does not reflow.
 *
 * This deliberately does not skeleton a grid of cards — the page it loads no
 * longer looks like that.
 */
const DashboardSkeleton = () => (
  <div
    className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10"
    aria-busy="true"
  >
    <span className="sr-only">Loading your practice…</span>

    <Skeleton className="h-7 w-56" />
    <Skeleton className="mt-3 h-4 w-80" />

    <Skeleton className="mt-8 h-16 w-full" />

    <Skeleton className="mt-10 h-4 w-32" />
    <Skeleton className="mt-4 h-56 w-full" />

    <div className="mt-10 grid gap-10 lg:grid-cols-2">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>

      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    </div>
  </div>
);

export default DashboardPage;
