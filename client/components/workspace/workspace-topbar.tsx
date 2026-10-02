"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import Logo from "@/components/ui/logo";
import UserMenu from "@/components/workspace/user-menu";
import { useAuth } from "@/hooks/use-auth";
import { useTenants } from "@/hooks/use-tenants";

interface WorkspaceTopbarProps {
  onOpenNav: () => void;
  isNavOpen: boolean;
}

/**
 * Workspace topbar.
 *
 * Infrastructure, not decoration: navigation for small screens on the left,
 * session controls on the right. It sits on every workspace route so signing
 * out is reachable from anywhere in the app.
 */
const WorkspaceTopbar = ({ onOpenNav, isNavOpen }: WorkspaceTopbarProps) => {
  const router = useRouter();
  const { logout, logoutAll } = useAuth();
  const {
    tenants,
    activeTenantId,
    isLoading,
    error,
    isSwitching,
    switchTenant,
  } = useTenants();

  const activeTenant =
    tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0];

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  async function handleSignOutAll() {
    await logoutAll();
    router.replace("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open menu"
        aria-controls="workspace-mobile-nav"
        aria-expanded={isNavOpen}
        className="-ml-1.5 flex size-9 cursor-pointer items-center justify-center rounded-sm text-ink-muted transition-colors duration-150 hover:bg-surface-subtle hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink lg:hidden"
      >
        <Menu className="size-4" aria-hidden="true" />
      </button>

      {/*
       * The sidebar carries the wordmark on large screens, so it is only shown
       * here when there is no sidebar to show it in.
       */}
      <Link
        href="/"
        aria-label="Renove home"
        className="lg:hidden"
      >
        <Logo variant="dark" />
      </Link>

      {/*
       * Current practice. On large screens the sidebar already carries the
       * wordmark, so this slot reads as workspace context rather than branding.
       */}
      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <span className="truncate text-[13px] text-ink-subtle">Practice</span>

        <span aria-hidden="true" className="text-line-strong">
          /
        </span>

        <span className="truncate text-[13px] font-medium text-ink">
          {isLoading
            ? "Loading…"
            : error
              ? "Unavailable"
              : (activeTenant?.name ?? "Not selected")}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <UserMenu
          tenantName={activeTenant?.name}
          tenantCount={tenants.length}
          isSwitching={isSwitching}
          onSwitchTenant={switchTenant}
          onSignOut={handleSignOut}
          onSignOutAll={handleSignOutAll}
        />
      </div>
    </header>
  );
};

export default WorkspaceTopbar;