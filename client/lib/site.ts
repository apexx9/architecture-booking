/**
 * Canonical origin for metadata that has to emit absolute URLs — the sitemap,
 * robots.txt, and anything else a crawler reads.
 *
 * Read from `NEXT_PUBLIC_SITE_URL`. It has no safe default in production: the
 * fallback below is local-only, so a misconfigured deploy produces a sitemap
 * full of `localhost` links rather than silently pointing somewhere wrong.
 *
 * TODO(aaron): set `NEXT_PUBLIC_SITE_URL` in the deployment environment.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");