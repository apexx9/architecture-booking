"use client";

import { useRouter, useSearchParams } from "next/navigation";

import PageHeader from "@/components/workspace/page-header";
import AccountCard from "@/components/tenant/account-card";
import PhasesCard from "@/components/tenant/phases-card";
import PracticeDetails from "@/components/tenant/practice-details";

/**
 * Settings, as three sections behind a rail rather than a horizontal tab strip.
 *
 * A tab strip was the wrong control here: these are not peer views of the same
 * data, they are three unrelated concerns, and tabs imply the user compares them
 * side by side. A vertical rail reads as a contents list, which is what it is,
 * and it survives longer section labels than a tab row does.
 *
 * The section is in the URL (`?section=`) so a section can be linked to and
 * survives a reload. `Practice` and `Workflow` map to what the API can do; there
 * is no section promising a setting with no endpoint behind it.
 */

type SectionId = "practice" | "workflow" | "account";

interface SettingsSection {
  id: SectionId;
  label: string;
}

const SECTIONS: SettingsSection[] = [
  { id: "practice", label: "Practice" },
  { id: "workflow", label: "Workflow" },
  { id: "account", label: "Account" },
];

const isSectionId = (value: string | null): value is SectionId =>
  SECTIONS.some((section) => section.id === value);

const SettingsPage = () => {
  const router = useRouter();
  const fromUrl = useSearchParams().get("section");

  /*
   * The URL is the state. Holding a parallel copy in `useState` would mean two
   * sources of truth that can disagree — and the Practice section links here with
   * `?section=account`, so the query can change from outside this component.
   */
  const active: SectionId = isSectionId(fromUrl) ? fromUrl : "practice";

  const select = (id: SectionId) => {
    router.replace(id === "practice" ? "/settings" : `/settings?section=${id}`, {
      scroll: false,
    });
  };

  const current = SECTIONS.find((section) => section.id === active) ?? SECTIONS[0];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-8 lg:px-10">
      <PageHeader
        title="Settings"
        description="Your practice, how work moves through it, and your own account."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-12">
        {/*
         * The rail. Horizontal and scrollable on phones, because a three-item
         * contents list stacked vertically above the content would push the
         * actual setting off-screen.
         */}
        <nav aria-label="Settings sections" className="lg:sticky lg:top-6 lg:self-start">
          <ul className="-mx-6 flex gap-1 overflow-x-auto px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {SECTIONS.map((section) => {
              const isActive = section.id === active;

              return (
                <li key={section.id} className="shrink-0 lg:w-full">
                  <button
                    type="button"
                    onClick={() => select(section.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "w-full rounded-sm px-3 py-2 text-left text-[13px] whitespace-nowrap",
                      "transition-colors duration-150 motion-reduce:transition-none",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                      isActive
                        ? "bg-surface-subtle font-medium text-ink"
                        : "text-ink-muted hover:bg-surface-subtle hover:text-ink",
                    ].join(" ")}
                  >
                    {section.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0">
          <h2 className="sr-only">{current.label}</h2>

          {active === "practice" && <PracticeDetails />}

          {/*
           * Only the selected panel mounts, so each section's data is fetched when
           * it is first opened rather than all at once on page load.
           */}
          {active === "workflow" && <PhasesCard />}

          {active === "account" && <AccountCard />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;