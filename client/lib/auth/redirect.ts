/**
 * Auth-aware redirect helpers.
 *
 * The `next` query parameter carries the path a visitor was trying to reach
 * before the auth wall intercepted them. It is attacker-controlled, so it must
 * never be trusted: only same-origin absolute paths are allowed through.
 */

const DEFAULT_AFTER_AUTH = "/dashboard";

/** Paths that must never be used as a post-auth destination. */
const BLOCKED_PREFIXES = ["/login", "/sign-up", "/logout"];

function isSafePath(value: string): boolean {
  if (!value.startsWith("/")) {
    return false;
  }

  // Reject protocol-relative URLs ("//evil.com") and backslash variants.
  if (value.startsWith("//") || value.startsWith("/\\")) {
    return false;
  }

  if (BLOCKED_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return false;
  }

  return true;
}

/**
 * Normalises an untrusted `next` value into a path that is safe to navigate to.
 * Anything unsafe falls back to the dashboard.
 */
export function sanitizeNextPath(value: string | null | undefined): string {
  if (!value) {
    return DEFAULT_AFTER_AUTH;
  }

  let decoded = value;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    return DEFAULT_AFTER_AUTH;
  }

  if (!isSafePath(decoded)) {
    return DEFAULT_AFTER_AUTH;
  }

  return decoded;
}

/** Builds the current path + search string, used as the `next` value. */
export function currentLocationPath(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

/** Builds an auth route href that returns the visitor to where they were going. */
export function buildAuthHref(
  route: "/login" | "/sign-up",
  next: string | null | undefined,
): string {
  const target = sanitizeNextPath(next);

  if (target === DEFAULT_AFTER_AUTH) {
    return route;
  }

  return `${route}?next=${encodeURIComponent(target)}`;
}

export { DEFAULT_AFTER_AUTH };
