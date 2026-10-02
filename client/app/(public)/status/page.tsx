import Link from "next/link";
import type { Metadata } from "next";

import {
  fetchHealthSnapshot,
  type HealthSnapshot,
} from "@/lib/api/health";

export const metadata: Metadata = {
  title: "System status",
  description:
    "Live availability of the Renove API, including its database connection.",
};

/*
 * Always rendered per request: a status page that is baked at build time is a
 * status page that lies.
 */
export const dynamic = "force-dynamic";

const STATE_COPY: Record<HealthSnapshot["state"], string> = {
  ok: "All systems operational",
  degraded: "Partial outage in progress",
  unreachable: "Status unavailable",
};

/*
 * Status is never signalled by colour alone — each state carries its own label.
 */
const STATE_CLASS: Record<HealthSnapshot["state"], string> = {
  ok: "border-success/30 bg-success/10 text-success",
  degraded: "border-caution/30 bg-caution/10 text-caution",
  unreachable: "border-danger/30 bg-danger/10 text-danger",
};

function formatUptime(seconds: number | null): string | null {
  if (seconds === null) {
    return null;
  }

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  parts.push(`${minutes}m`);

  return parts.join(" ");
}

function formatTimestamp(timestamp: string | null): string | null {
  if (!timestamp) {
    return null;
  }

  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(parsed);
}

const Row = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex items-baseline justify-between gap-6 border-b border-line-muted py-3 last:border-b-0">
    <dt className="text-[13px] text-ink-subtle">{label}</dt>
    <dd className="text-[13px] font-medium text-ink">{value}</dd>
  </div>
);

const Page = async () => {
  const snapshot = await fetchHealthSnapshot();

  const checkedAt = formatTimestamp(snapshot.timestamp);
  const uptime = formatUptime(snapshot.uptimeSeconds);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-10 lg:py-28">
      {/*
        Only the page header is animated. The status badge and the table below it
        stay unanimated on purpose: this page exists to be read the instant it
        loads, so nothing about the state of the system is revealed on a timer.
      */}
      <div className="scroll-reveal">
        <p className="text-[11px] tracking-[0.15em] text-ink-subtle uppercase">
          Renove
        </p>

        <h1 className="mt-3 text-pretty text-[40px] leading-[1.05] font-medium text-ink sm:text-[56px]">
          <span className="scroll-line-mask">
            <span>System status</span>
          </span>
        </h1>
      </div>

      <p
        className={`mt-8 inline-flex items-center gap-2 border px-3 py-2 text-[13px] font-medium ${STATE_CLASS[snapshot.state]}`}
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
        {STATE_COPY[snapshot.state]}
      </p>

      {/*
        When the API cannot be reached there are no readings to show. Saying so
        is the honest state; showing empty rows would imply zero metrics.
      */}
      {snapshot.state === "unreachable" ? (
        <p className="mt-8 max-w-xl text-pretty text-[17px] leading-relaxed text-ink-muted">
          The status API did not respond, so current availability is unknown.
          This usually means an incident is in progress.
        </p>
      ) : (
        <dl className="mt-8 max-w-xl border-t border-line">
          <Row
            label="API"
            value={snapshot.state === "ok" ? "Operational" : "Degraded"}
          />

          {snapshot.database ? (
            <Row
              label="Database"
              value={
                snapshot.database.status === "up"
                  ? snapshot.database.latencyMs === null
                    ? "Operational"
                    : `Operational — ${snapshot.database.latencyMs} ms`
                  : "Unavailable"
              }
            />
          ) : null}

          {checkedAt ? <Row label="Checked at" value={`${checkedAt} UTC`} /> : null}

          {uptime ? <Row label="Uptime" value={uptime} /> : null}
        </dl>
      )}

      <p className="mt-10 max-w-xl text-[13px] leading-relaxed text-ink-subtle">
        Reload this page to re-check. If a problem persists and you have a
        support agreement, quote the checked-at time above when you report it.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex h-10 items-center justify-center rounded-sm border border-line px-5 text-[13px] font-medium text-ink transition-colors duration-150 hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
      >
        Back to Renove
      </Link>
    </section>
  );
};

export default Page;