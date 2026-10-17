/**
 * Workspace route prefixes that require a session.
 *
 * This mirrors the `ready: true` entries of `NAV_GROUPS` in
 * `components/layout/app-shell.tsx`, where group meaning, order and hrefs live.
 * A navigation item that becomes ready needs an entry here, and a workspace route
 * that is not yet in the navigation still needs one.
 *
 * Each prefix covers the detail routes beneath it, so `/projects` also covers
 * `/projects/[id]`.
 */

export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/projects",
  "/clients",
  "/deliverables",
  "/leads",
  "/tasks",
  "/team",
  "/settings",
] as const;

/** Whether `pathname` is a workspace route that needs a session to open. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}