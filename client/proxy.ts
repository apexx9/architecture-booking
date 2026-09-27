import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth gate.
 *
 * Runs before rendering to bounce visitors away from signed-in routes before
 * the client-side session check has a chance to flash protected UI. It is a
 * pre-filter, NOT the security boundary: it only checks that a session cookie
 * is present and never contacts the database. The real verification happens in
 * `ProtectedRoute` (GET /auth/me) and, ultimately, in the API.
 *
 * Deployment note: the API currently sets host-only `access_token` /
 * `refresh_token` cookies with no `domain` attribute. That means this proxy can
 * only read them when the API shares the frontend's host (the case in local
 * development, where both are on `localhost`). Behind a separate API subdomain
 * in production the cookies are invisible here and this file degrades to a
 * no-op for authenticated users — the client-side gate still holds the line.
 * `refresh_token` is additionally scoped to `path: "/auth"`, so it is never
 * sent here at all; an expired access token therefore bounces to /login, where
 * GuestRoute re-checks /auth/me, the axios interceptor silently refreshes, and
 * the visitor is returned to `next`.
 */

/** Route prefixes that require a session. Route groups are not in the URL. */
const PROTECTED_PREFIXES = ["/dashboard"];

/**
 * Signed-in visitors skip the pitch and go straight to their workspace, the way
 * Instagram and Dribbble drop you into your own feed. Dispatching here rather
 * than with `cookies()` in the page keeps `/` statically prerendered — the
 * landing page is the acquisition surface and must stay cacheable.
 */
const HOME_PATHS = new Set(["/", "/index"]);

const AUTH_COOKIE = "access_token";

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPrefetch(request: NextRequest): boolean {
  return (
    request.headers.has("next-router-prefetch") ||
    request.headers.get("purpose") === "prefetch"
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPrefetch(request)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(AUTH_COOKIE);

  if (hasSession && HOME_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Run on page routes only — never on API calls, static assets or images,
     * or redirects will block CSS, JS and fonts from loading.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|woff2?|ttf)$).*)",
  ],
};
