import { NextResponse, type NextRequest } from "next/server";

/**
 * The API owns authentication.
 *
 * The frontend and API are deployed on different origins, so the Next.js
 * proxy cannot reliably inspect the API's host-only authentication cookies.
 *
 * Authentication is therefore handled by:
 *
 *   AuthProvider
 *        ↓
 *   GET /auth/me
 *        ↓
 *   GuestRoute / ProtectedRoute
 *
 * The API remains the actual security boundary.
 */

export function proxy(request: NextRequest) {
  /*
   * Do not perform authentication here.
   *
   * The frontend proxy runs on the Vercel origin while authentication
   * cookies belong to the Render API origin.
   */
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on page routes only.
     *
     * API calls, static assets, images and fonts bypass the proxy.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|woff2?|ttf)$).*)",
  ],
};
