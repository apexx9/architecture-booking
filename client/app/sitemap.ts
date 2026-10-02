import type { MetadataRoute } from "next";

import { PUBLIC_NAV_LINKS } from "@/lib/navigation/public";
import { SITE_URL } from "@/lib/site";

/**
 * Public, indexable routes.
 *
 * Built from `PUBLIC_NAV_LINKS` so the header and the sitemap cannot drift,
 * plus the destinations the footer reaches that are not in the header. Both
 * lists are checked against the routes that actually exist.
 *
 * `lastModified` is intentionally omitted: these pages have no meaningful
 * modification date, and a fabricated one is worse than none.
 */
const FOOTER_ONLY_ROUTES = [
  "/contact",
  "/guides",
  "/help",
  "/developers",
  "/careers",
  "/changelog",
  "/legal/terms",
  "/legal/privacy",
  "/legal/cookies",
  "/legal/security",
  "/legal/data-processing",
];

const routes = [
  ...PUBLIC_NAV_LINKS.map((link) => link.href),
  ...FOOTER_ONLY_ROUTES,
];

const sitemap = (): MetadataRoute.Sitemap =>
  routes.map((route) => ({
    url: `${SITE_URL}${route === "/" ? "" : route}`,
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1 : 0.7,
  }));

export default sitemap;