"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import Logo from "@/components/ui/logo";
import LogoMark from "@/components/ui/logo-mark";
import WorkspaceNav, {
  type NavGroup,
} from "@/components/workspace/workspace-nav";
import WorkspaceMobileNav from "@/components/workspace/workspace-mobile-nav";
import WorkspaceTopbar from "@/components/workspace/workspace-topbar";

/*
 * Group meaning, order, hrefs and `ready` flags are the information architecture
 * and belong here. Iconography is presentation and lives with the navigation
 * that renders it — see `NAV_ICONS` in `components/workspace/workspace-nav.tsx`.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", ready: true }],
  },
  {
    label: "Work",
    items: [
      { label: "Projects", href: "/projects", ready: true },
      { label: "Deliverables", href: "/deliverables", ready: true },
      { label: "Clients & Pipeline", href: "/clients", ready: true },
      { label: "Leads", href: "/leads", ready: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Tasks", href: "/tasks", ready: true },
      { label: "Approvals", href: "/approvals", ready: false },
      { label: "Documents", href: "/documents", ready: false },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Invoices", href: "/invoices", ready: false },
      { label: "Payments", href: "/payments", ready: false },
      { label: "Expenses", href: "/expenses", ready: false },
    ],
  },
  {
    label: "Practice",
    items: [
      { label: "Procurement", href: "/procurement", ready: false },
      { label: "Team", href: "/team", ready: true },
      { label: "Settings", href: "/settings", ready: true },
    ],
  },
];

interface AppShellProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = "renove-sidebar-collapsed";

/**
 * Read the stored preference during the initial render rather than in an effect:
 * `useState`'s lazy initialiser runs once, on the server too, so the very first
 * paint already has the correct width and there is no flash of an expanded rail.
 */
const readStoredCollapsed = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
};

const AppShell = ({ children }: AppShellProps) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(readStoredCollapsed);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const closeNav = useCallback(() => setIsNavOpen(false), []);
  const toggleCollapse = useCallback(
    () => setIsCollapsed((prev) => !prev),
    [],
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside
        className={[
          "group hidden shrink-0 flex-col border-r border-line bg-surface lg:flex transition-[width] duration-200 ease-out relative z-10",
          isCollapsed ? "w-16" : "w-64",
          "overflow-visible",
        ].join(" ")}
      >
        <div
          className={[
            "px-5 py-5 flex items-center",
            isCollapsed ? "justify-center" : "justify-between",
          ].join(" ")}
        >
          <Link
            href="/"
            aria-label="Renove home"
            className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            {/* The wordmark does not fit in a 4rem rail — it was clipped to
                unreadable slivers. The arch mark is the same brand signal at a
                size that actually fits. */}
            {isCollapsed ? (
              <LogoMark size={24} className="text-ink" />
            ) : (
              <Logo variant="dark" />
            )}
          </Link>
        </div>

        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-6 flex size-6 items-center justify-center rounded-full border border-line bg-surface shadow-sm text-ink-subtle transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>

        <div
          className={[
            "pb-6 flex-1 overflow-y-auto custom-scrollbar",
            isCollapsed ? "px-2" : "px-4",
          ].join(" ")}
        >
          <WorkspaceNav groups={NAV_GROUPS} collapsed={isCollapsed} />
        </div>
      </aside>

      <WorkspaceMobileNav
        groups={NAV_GROUPS}
        isOpen={isNavOpen}
        onClose={closeNav}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopbar onOpenNav={() => setIsNavOpen(true)} isNavOpen={isNavOpen} />
        <main
          id="main"
          className="min-h-0 flex-1 overflow-y-auto"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
export { NAV_GROUPS };
