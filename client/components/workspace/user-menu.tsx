"use client";

import { useState } from "react";
import { Check, ChevronDown, LogOut, MonitorSmartphone } from "lucide-react";

import Popover from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import useAuthStore from "@/store/use-auth-store";
import { APP_NAME } from "@/utils/utils";

interface UserMenuProps {
  tenantName?: string;
  tenantCount: number;
  isSwitching: boolean;

  onSwitchTenant: (tenantId: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onSignOutAll: () => Promise<void>;
}

const menuItemClass =
  "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink-muted transition-colors duration-150 relative hover:bg-surface-subtle hover:text-ink focus-visible:bg-surface-subtle focus-visible:text-ink focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/**
 * Account menu: identity, practice switching, and the session controls.
 *
 * Renove has no sign-out anywhere else, so this is the single place a
 * practitioner can end a session or revoke every other device.
 */
const UserMenu = ({
  tenantName,
  tenantCount,
  isSwitching,
  onSwitchTenant,
  onSignOut,
  onSignOutAll,
}: UserMenuProps) => {
  const { user } = useAuth();
  const tenants = useAuthStore((state) => state.tenants);
  const activeTenantId = useAuthStore((state) => state.activeTenantId);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);

  const initials =
    user?.fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || null;

  const accountLabel = user?.fullName ?? user?.email ?? "Account";

  async function handleSwitch(tenantId: string) {
    await onSwitchTenant(tenantId);
  }

  return (
    <Popover
      label="Account menu"
      trigger={(triggerProps) => (
        <button
          {...triggerProps}
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 transition-colors duration-150 hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-surface-sunken text-[11px] font-medium text-ink-muted"
          >
            {initials ?? <MonitorSmartphone className="size-3.5" />}
          </span>

          <span className="hidden max-w-32 truncate text-[13px] text-ink sm:block">
            {accountLabel}
          </span>

          <ChevronDown className="size-3.5 shrink-0 text-ink-subtle" />
        </button>
      )}
    >
      {(close) => (
        <>
          <div           className="border-b border-line-muted px-3 pt-2 pb-3">
            <p className="truncate text-[13px] font-medium text-ink">
              {accountLabel}
            </p>
            {user?.email && user.fullName ? (
              <p className="mt-0.5 truncate text-[12px] text-ink-subtle">
                {user.email}
              </p>
            ) : null}
            <p className="mt-2 text-[11px] tracking-[0.08em] text-ink-subtle uppercase">
              Signed in to {APP_NAME}
            </p>
          </div>

          {tenantCount > 0 ? (
            <div className="border-b border-line-muted py-1">
              <p className="px-3 pt-2 pb-1.5 text-[11px] tracking-[0.08em] text-ink-subtle uppercase">
                Practice
              </p>

              {tenants.map((tenant) => {
                const isActive = tenant.id === activeTenantId;

                return (
                  <button
                    key={tenant.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    disabled={isSwitching}
                    onClick={async () => {
                      await handleSwitch(tenant.id);

                      close();
                    }}
                    className={`${menuItemClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {/*
                     * Active practice is marked by the check glyph and the
                     * text weight, not by colour alone.
                     */}
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-0.5 bg-ink"
                      />
                    ) : null}
                    <Check
                      aria-hidden="true"
                      className={`size-3.5 shrink-0 ${isActive ? "text-ink" : "text-transparent"}`}
                    />

                    <span
                      className={`min-w-0 flex-1 truncate ${isActive ? "font-medium text-ink" : ""}`}
                    >
                      {tenant.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : tenantName ? (
            <div className="border-b border-line-muted px-3 py-2.5">
              <p className="text-[11px] tracking-[0.08em] text-ink-subtle uppercase">
                Practice
              </p>
              <p className="mt-0.5 truncate text-[13px] text-ink">
                {tenantName}
              </p>
            </div>
          ) : null}

          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              disabled={isSigningOut || isSigningOutAll}
              onClick={async () => {
                setIsSigningOut(true);

                try {
                  await onSignOut();
                } finally {
                  setIsSigningOut(false);
                  close();
                }
              }}
              className={`${menuItemClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <LogOut className="size-3.5 shrink-0" aria-hidden="true" />
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={isSigningOut || isSigningOutAll}
              onClick={async () => {
                setIsSigningOutAll(true);

                try {
                  await onSignOutAll();
                } finally {
                  setIsSigningOutAll(false);
                  close();
                }
              }}
              className={`${menuItemClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <MonitorSmartphone
                className="size-3.5 shrink-0"
                aria-hidden="true"
              />
              {isSigningOutAll
                ? "Signing out everywhere…"
                : "Sign out of all devices"}
            </button>
          </div>
        </>
      )}
    </Popover>
  );
};

export default UserMenu;
