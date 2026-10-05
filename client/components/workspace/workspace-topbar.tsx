"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import Logo from "@/components/ui/logo";
import PracticeSwitcher from "@/components/workspace/practice-switcher";
import UserMenu from "@/components/workspace/user-menu";
import { Breadcrumbs, type Crumb } from "@/components/workspace/breadcrumbs";
import { useAuth } from "@/hooks/use-auth";
import { useTenants } from "@/hooks/use-tenants";
import useCrumbStore from "@/store/use-crumb-store";

interface WorkspaceTopbarProps {
  onOpenNav: () => void;
  isNavOpen: boolean;
}

/**
 * The workspace context bar.
 *
 * It replaced a bar that printed "Practice / <name>" and nothing else, which told
 * you nothing about where in the product you were. It now carries three things
 * and no more: which practice you are in, which part of it, and your account.
 *
 * The trail has two sources. The section is derived from the navigation itself,
 * so it is correct on every route without each page declaring it. A detail route
 * publishes the record it is showing — a project name cannot be derived from
 * `/projects/abc` — and that is appended after the section.
 */
const WorkspaceTopbar = ({ onOpenNav, isNavOpen }: WorkspaceTopbarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, logoutAll } = useAuth();
  const { tenants, isLoading, error, isSwitching, switchTenant } = useTenants();

  const published = useCrumbStore((state) => state.trail);

  const section = sectionFor(pathname);

  const trail: Crumb[] = section ? [{ label: section }] : [];

  /*
   * A published crumb that repeats the section — because the detail page pushed
   * its own parent — would render "Projects / Projects". Drop the duplicate
   * rather than making every page remember to omit it.
   */
  const extra = published.filter(
    (crumb, index) => !(index === 0 && crumb.label === section),
  );

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  async function handleSignOutAll() {
    await logoutAll();
    router.replace("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open menu"
        aria-controls="workspace-mobile-nav"
        aria-expanded={isNavOpen}
        className="-ml-1.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink-muted transition-colors duration-150 hover:bg-surface-subtle hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink lg:hidden"
      >
        <Menu className="size-4" aria-hidden="true" />
      </button>

      {/*
       * The sidebar carries the wordmark from `lg` up, so the bar only shows it
       * when there is no sidebar to show it in.
       */}
      <Link
        href="/"
        aria-label="Renove home"
        className="mr-1 shrink-0 lg:hidden"
      >
        <Logo variant="dark" />
      </Link>

      <div className="flex min-w-0 flex-1 items-center gap-1 lg:gap-2">
        {isLoading ? (
          <span className="shrink-0 px-2 py-1.5 text-[13px] text-ink-subtle">
            Loading…
          </span>
        ) : error ? (
          <span className="shrink-0 px-2 py-1.5 text-[13px] text-danger">
            Practice unavailable
          </span>
        ) : tenants.length === 0 ? (
          <span className="shrink-0 px-2 py-1.5 text-[13px] text-ink-subtle">
            No practice
          </span>
        ) : (
          <PracticeSwitcher
            onSwitch={switchTenant}
            isSwitching={isSwitching}
            className="shrink-0"
          />
        )}

        {/*
         * The trail is hidden on phones: at 375px the bar has the wordmark, the
         * practice name and an avatar competing for one line, and the page title
         * immediately below already answers "where am I".
         */}
        {(trail.length > 0 || extra.length > 0) && (
          <div className="hidden min-w-0 flex-1 md:block">
            <Breadcrumbs items={[...trail, ...extra]} />
          </div>
        )}
      </div>

      <div className="ml-auto shrink-0">
        <UserMenu
          onSignOut={handleSignOut}
          onSignOutAll={handleSignOutAll}
        />
      </div>
    </header>
  );
}

/**
 * The navigation label for a path.
 *
 * Longest-prefix match, so `/projects/abc` resolves to Projects rather than
 * falling through to nothing. `/clients` and `/leads` are distinct nav items so
 * both match exactly; the shared "Clients & Pipeline" entry owns `/clients`, and
 * `/leads` matches its own item.
 */
function sectionFor(pathname: string): string | null {
  const labels: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/projects": "Projects",
    "/deliverables": "Deliverables",
    "/clients": "Clients & Pipeline",
    "/leads": "Leads",
    "/tasks": "Tasks",
    "/team": "Team",
    "/settings": "Settings",
  };

  if (labels[pathname]) return labels[pathname];

  const best = Object.keys(labels)
    .filter((prefix) => pathname.startsWith(`${prefix}/`))
    .sort((a, b) => b.length - a.length)[0];

  return best ? labels[best] : null;
}

export default WorkspaceTopbar;