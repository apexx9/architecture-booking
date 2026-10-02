/**
 * OAuth start URLs.
 *
 * The provider handshake is a full-page navigation: the backend redirects to
 * Google/Microsoft, the provider redirects back to `/auth/<provider>/callback`,
 * and the backend mints the session before bouncing to the dashboard. So these
 * are plain hrefs on the API origin, not Axios calls, and `next` rides along so
 * the visitor lands where they were originally headed.
 */

import { API_URL } from "@/lib/api/config";

export type OAuthProvider = "google" | "microsoft";

export function oauthStartUrl(
  provider: OAuthProvider,
  next?: string | null,
): string {
  const url = new URL(`/auth/${provider}`, API_URL);

  if (next) {
    url.searchParams.set("next", next);
  }

  return url.toString();
}