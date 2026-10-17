import { NextResponse, type NextRequest } from "next/server";

import { isProtectedPath } from "@/lib/auth/protected-routes";
import { sanitizeNextPath } from "@/lib/auth/redirect";

/**
 * Sends visitors with no session at all to sign in before a workspace page runs.
 *
 * This is an optimistic check, and deliberately a cheap one: it reads the cookies
 * and decides nothing about whether they are still valid. Validating the session
 * is the API's job and happens in `AuthProvider`, which is what makes the
 * redirects here trustworthy — a workspace route reached another way is still
 * gated by `ProtectedRoute`.
 *
 * What it buys is the part that was missing. A hard refresh on a workspace URL
 * used to render the app and then hold a full-screen "Checking your session"
 * card until the API answered, and a visitor with no cookies at all paid for
 * that wait before the sign-in page appeared. Cookie presence cannot lie the way
 * a slow request can: absent cookies mean there is nothing to refresh, so the
 * redirect is safe to make before anything is rendered.
 *
 * When either cookie is present the request passes straight through, including
 * the common case of an expired access token with a refresh token still good.
 * The client swaps the cookies in the background and the visitor sees their
 * page, not a loading screen.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession =
    Boolean(request.cookies.get("access_token")) ||
    Boolean(request.cookies.get("refresh_token"));

  if (hasSession) {
    return NextResponse.next();
  }

  // The untrusted target goes through the same sanitiser the client uses, so the
  // redirect it builds cannot point anywhere off-origin.
  const login = new URL("/login", request.url);

  login.searchParams.set("next", sanitizeNextPath(`${pathname}${search}`));

  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|woff2?|ttf)$).*)",
  ],
};