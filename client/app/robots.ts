import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Crawl rules.
 *
 * The workspace, the auth screens and the signed client-approval links are all
 * private: they either require a session or are addressed by single-use token.
 * None of them should ever be indexed, and `/status` is deliberately excluded
 * too — it is a live availability endpoint, not search surface.
 */
const robots = (): MetadataRoute.Robots => ({
  rules: [
    {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/login",
        "/sign-up",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/status",
        "/api/",
      ],
    },
  ],
  sitemap: `${SITE_URL}/sitemap.xml`,
  host: SITE_URL,
});

export default robots;