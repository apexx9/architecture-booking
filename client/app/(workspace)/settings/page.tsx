"use client";

import Tabs from "@/components/ui/tabs";
import AccountCard from "@/components/tenant/account-card";
import PhasesCard from "@/components/tenant/phases-card";
import PracticeCard from "@/components/tenant/practice-card";
import PracticesCard from "@/components/tenant/practices-card";

/**
 * Settings is grouped by what the setting is about rather than by which service
 * owns it, because the previous page was a single undifferentiated stack: the
 * practice name and the practice list ran straight into each other with nothing
 * to say which was the current practice and which was a switcher.
 *
 * The three groups map exactly to what the API can do — no group promises a
 * setting that has no endpoint behind it.
 */
const TABS = [
  { value: "practice", label: "Practice" },
  { value: "phases", label: "Phases" },
  { value: "account", label: "Account" },
];

const SettingsPage = () => {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 py-8 lg:px-10">
      <header className="motion-enter">
        <h1 className="font-display text-[28px] font-light text-ink">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
          Your practice, the phases your projects move through, and your own
          account.
        </p>
      </header>

      <Tabs items={TABS} label="Settings sections" defaultValue="practice" className="mt-6">
        {(active) => {
          /*
           * Only the selected panel is mounted — the `Tabs` primitive unmounts the
           * rest — so each tab's cards fetch when it is first opened rather than
           * all at once on page load.
           */
          if (active === "practice") {
            return (
              <div className="space-y-6">
                <PracticeCard />
                <PracticesCard />
              </div>
            );
          }

          if (active === "phases") {
            return <PhasesCard />;
          }

          return <AccountCard />;
        }}
      </Tabs>
    </div>
  );
};

export default SettingsPage;