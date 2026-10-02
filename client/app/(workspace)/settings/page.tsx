"use client";

import PracticeCard from "@/components/tenant/practice-card";
import PracticesCard from "@/components/tenant/practices-card";

const SettingsPage = () => {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 py-8 lg:px-10">
      <header className="motion-enter">
        <h1 className="font-display text-[28px] font-light text-ink">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
          The practice your workspace is scoped to.
        </p>
      </header>

      <div className="mt-6 space-y-6">
        <PracticeCard />
        <PracticesCard />
      </div>
    </div>
  );
};

export default SettingsPage;