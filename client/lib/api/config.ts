const envApiUrl = process.env.NEXT_PUBLIC_API_URL;

/*
 * In production, the frontend and API share one Vercel domain. Using a
 * relative /api base keeps browser requests on that origin and lets Vercel
 * route them to the NestJS service. NEXT_PUBLIC_API_URL is only used locally,
 * where the frontend and backend usually run on different ports.
 */
export const API_URL =
  process.env.NODE_ENV === "production"
    ? "/api"
    : (envApiUrl ?? "http://localhost:8000").replace(/\/+$/, "");
