"use client";

import {
  CalendarClock,
  History,
} from "lucide-react";

import Card, { CardBody, CardHeader } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";

const DashboardPage = () => {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
      <header className="motion-enter">
        <h1 className="font-display text-[28px] font-light text-ink">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
          An overview of your practice.
        </p>
      </header>

      <div className="motion-enter-stagger mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card style={{ "--reveal-index": 0 } as React.CSSProperties}>
          <CardHeader
            title="Upcoming deadlines"
            description="Phases, deliverables and approvals coming up"
          />
          <CardBody>
            <EmptyState
              icon={<CalendarClock className="size-4" aria-hidden="true" />}
              title="No deadlines to show"
              description="Deadlines appear here once you have scheduled work."
              size="sm"
            />
          </CardBody>
        </Card>

        <Card style={{ "--reveal-index": 1 } as React.CSSProperties}>
          <CardHeader
            title="Recent activity"
            description="What changed across your projects"
          />
          <CardBody>
            <EmptyState
              icon={<History className="size-4" aria-hidden="true" />}
              title="No activity to show"
              description="Project updates and approvals appear here as they happen."
              size="sm"
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
