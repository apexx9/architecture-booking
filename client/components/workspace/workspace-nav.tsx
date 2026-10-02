"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  ready: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface WorkspaceNavProps {
  groups: NavGroup[];
  onNavigate?: () => void;
  collapsed?: boolean;
}

const WorkspaceNav = ({ groups, onNavigate, collapsed = false }: WorkspaceNavProps) => {
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
          <ul className={["mt-2 flex flex-col gap-0.5", collapsed ? "items-center" : ""].join(" ")}>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              if (!item.ready) {
                return (
                  <li key={item.href} className={collapsed ? "w-full text-center" : ""}>
                    <span
                      aria-disabled="true"
                      title={collapsed ? item.label : undefined}
                      className={[
                        "block cursor-not-allowed rounded-sm px-2 py-1.5 text-[14px] text-ink-subtle",
                        collapsed ? "text-center px-1" : "",
                      ].join(" ")}
                    >
                      {collapsed ? item.label.charAt(0).toUpperCase() : item.label}
                    </span>
                  </li>
                );
              }
              return (
                <li key={item.href} className={collapsed ? "w-full" : ""}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={[
                      "block rounded-sm px-2 py-1.5 text-[14px] transition-colors duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                      collapsed ? "text-center px-1" : "",
                      active
                        ? "bg-surface-sunken font-medium text-ink"
                        : "text-ink-muted hover:bg-surface-subtle hover:text-ink",
                    ].join(" ")}
                  >
                    {collapsed ? item.label.charAt(0).toUpperCase() : item.label}
                  </Link>
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
