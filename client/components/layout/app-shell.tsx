"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "@/components/ui/logo";

/**
 * Workspace navigation, derived from the domain model in section 9 of
 * app-details.md. Routes that do not exist yet are marked `ready: false` and
 * render as plain text so the shell never links to a 404.
 *
 * TODO(aaron): all visual design. Replace this list's presentation freely —
 * the group names and the ordering are the part that carries meaning.
 */
interface NavItem {
  label: string;
  href: string;
  ready: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", ready: true }],
  },
  {
    label: "Pipeline",
    items: [
      { label: "Leads", href: "/leads", ready: false },
      { label: "Clients", href: "/clients", ready: false },
      { label: "Proposals", href: "/proposals", ready: false },
      { label: "Contracts", href: "/contracts", ready: false },
    ],
  },
  {
    label: "Delivery",
    items: [
      { label: "Projects", href: "/projects", ready: false },
      { label: "Phases", href: "/phases", ready: false },
      { label: "Tasks", href: "/tasks", ready: false },
      { label: "Deliverables", href: "/deliverables", ready: false },
      { label: "Approvals", href: "/approvals", ready: false },
      { label: "Files", href: "/files", ready: false },
    ],
  },
  {
    label: "Cost",
    items: [
      { label: "Procurement", href: "/procurement", ready: false },
      { label: "Vendors", href: "/vendors", ready: false },
      { label: "Products", href: "/products", ready: false },
      { label: "Site", href: "/site", ready: false },
    ],
  },
  {
    label: "Money",
    items: [
      { label: "Invoices", href: "/invoices", ready: false },
      { label: "Payments", href: "/payments", ready: false },
      { label: "Expenses", href: "/expenses", ready: false },
    ],
  },
  {
    label: "Practice",
    items: [
      { label: "Members", href: "/settings/members", ready: false },
      { label: "Notifications", href: "/notifications", ready: false },
      { label: "Audit log", href: "/audit", ready: false },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full">
      {/* TODO(aaron): sidebar design — width, collapse, mobile drawer */}
      <aside className="hidden w-64 shrink-0 border-r border-black/5 lg:block">
        <div className="px-6 py-6">
          <Link href="/" aria-label="Renove home">
            <Logo variant="dark" />
          </Link>
        </div>

        <nav className="flex flex-col gap-6 px-4 pb-8">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 text-[11px] font-bold tracking-[0.15em] text-black/40 uppercase">
                {group.label}
              </p>

              <ul className="mt-2 flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);

                  if (!item.ready) {
                    return (
                      <li key={item.href} title="Not built yet">
                        <span className="block rounded-lg px-2 py-1.5 text-[14px] text-black/30">
                          {item.label}
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-lg px-2 py-1.5 text-[14px] ${
                          active
                            ? "bg-black/5 text-black"
                            : "text-black/60 hover:bg-black/5 hover:text-black"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* TODO(aaron): topbar — practice switcher, search, notifications */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export default AppShell;
export { NAV_GROUPS };
