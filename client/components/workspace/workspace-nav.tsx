"use client";

import {
  Banknote,
  Circle,
  ClipboardCheck,
  FileCheck2,
  FileStack,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Receipt,
  Settings,
  ShoppingBag,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Tooltip from "@/components/ui/tooltip";

export interface NavItem {
  label: string;
  href: string;
  ready: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Iconography, keyed by href.
 *
 * Iconography is presentation, so it lives with the navigation that renders it
 * rather than in the app shell's `NAV_GROUPS`, which stays a statement of group
 * meaning, order, hrefs and readiness.
 *
 * It replaced a single-letter collapsed label, which was unreadable: Projects,
 * Payments and Procurement all collapsed to "P", and Deliverables and Documents
 * collide the same way. An icon is unambiguous and needs no extra legend.
 */
const NAV_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/projects": FolderKanban,
  "/deliverables": FileCheck2,
  "/clients": Users,
  "/leads": UserPlus,
  "/tasks": ListChecks,
  "/approvals": ClipboardCheck,
  "/documents": FileStack,
  "/invoices": Receipt,
  "/payments": Banknote,
  "/expenses": Banknote,
  "/procurement": ShoppingBag,
  "/team": Users,
  "/settings": Settings,
};

/** Last resort so an item without a mapping still renders something legible. */
const FallbackIcon = Circle;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface WorkspaceNavProps {
  groups: NavGroup[];
  onNavigate?: () => void;
  collapsed?: boolean;
}

const WorkspaceNav = ({
  groups,
  onNavigate,
  collapsed = false,
}: WorkspaceNavProps) => {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <h2 className="px-2 text-[11px] font-medium tracking-[0.14em] text-ink-subtle uppercase">
              {group.label}
            </h2>
          )}

          <ul
            className={[
              "mt-2 flex flex-col gap-0.5",
              collapsed ? "items-center" : "",
            ].join(" ")}
          >
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = NAV_ICONS[item.href] ?? FallbackIcon;

              /*
               * A `ready: false` item stays visible and non-interactive. Hiding
               * it would make the navigation look incomplete; linking it would
               * promise a route that does not exist. The tooltip is what
               * explains why it cannot be clicked — the native `title` this
               * replaced was invisible to keyboard and touch users.
               */
              if (!item.ready) {
                const content = (
                  <span
                    aria-disabled="true"
                    className={[
                      "flex cursor-not-allowed items-center rounded-sm px-2 py-1.5",
                      "text-[14px] text-ink-subtle",
                      collapsed ? "justify-center px-1" : "gap-2.5",
                    ].join(" ")}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {!collapsed && <span>{item.label}</span>}
                  </span>
                );

                return (
                  <li key={item.href} className={collapsed ? "w-full" : ""}>
                    <Tooltip
                      label={`${item.label} — coming soon`}
                      side="right"
                      className={collapsed ? "w-full justify-center" : ""}
                    >
                      {content}
                    </Tooltip>
                  </li>
                );
              }

              const link = (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={[
                    "flex items-center rounded-sm px-2 py-1.5 text-[14px] transition-colors duration-150",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                    collapsed ? "justify-center px-1" : "gap-2.5",
                    active
                      ? "bg-surface-sunken font-medium text-ink"
                      : "text-ink-muted hover:bg-surface-subtle hover:text-ink",
                  ].join(" ")}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              return (
                <li key={item.href} className={collapsed ? "w-full" : ""}>
                  {collapsed ? (
                    <Tooltip label={item.label} side="right" className="w-full justify-center">
                      {link}
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export default WorkspaceNav;