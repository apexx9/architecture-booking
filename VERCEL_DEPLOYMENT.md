# Vercel deployment

This repository deploys the Next.js frontend and NestJS API together through
[Vercel Services](https://vercel.com/docs/services). Services is currently a
Beta feature; confirm it is enabled for the Vercel account/project before
connecting the repository.

## Service routing

The root `vercel.json` defines two services:

- `client` builds the Next.js app from `client/`.
- `server` builds the NestJS API from `server/Dockerfile.vercel` as a container.

Public requests to `/api/*` are routed to `server`. A service-scoped rewrite
removes the `/api` prefix before the request reaches NestJS, so existing
controller paths such as `/auth/csrf` remain unchanged. All other public paths
go to the Next.js frontend. No service bindings are required for this topology.

The container listens on port 80 by default. The Docker image sets `PORT=80`,
and the platform can override `PORT` through the service's environment.

## Required Vercel environment

Configure the variables in the Vercel project for both Preview and Production
as appropriate. Do not commit real credentials.

- `NODE_ENV=production`
- `DATABASE_URL` — reachable PostgreSQL connection string.
- `JWT_ACCESS_SECRET` — strong random secret; use a separate value from the refresh secret.
- `JWT_REFRESH_SECRET` — strong random secret if refresh-token signing is configured to use it.
- `FRONTEND_URL` — the public origin of the deployed site, without a trailing slash. For a single domain, use the same site origin used by the browser.
- `BREVO_API_KEY` or the SMTP settings required by your chosen email provider.
- OAuth credentials for providers you enable: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, and `MICROSOFT_CLIENT_SECRET`.

Set OAuth callback URLs to the exact public paths and register those same URLs in
each identity provider:

- `GOOGLE_CALLBACK_URL=https://<your-domain>/api/auth/google/callback`
- `MICROSOFT_CALLBACK_URL=https://<your-domain>/api/auth/microsoft/callback`

Replace `<your-domain>` with the real production domain. For preview deployments,
OAuth providers may require the preview callback URLs to be registered separately;
prefer a stable production domain for production OAuth configuration.

Check `server/.env.example` and the server configuration validation for other
feature-specific variables. Never copy development secrets into Production.

## Local verification

From the repository root, verify each service separately:

```bash
cd server
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm typecheck
corepack pnpm test -- --runInBand
```

Then:

```bash
cd ../client
corepack pnpm install --frozen-lockfile
corepack pnpm build
```

To test the multi-service routing locally, use a current Vercel CLI with Docker
installed and running, then run `vercel dev` from the repository root after
linking the project. Validate at least a frontend route, `GET /api/auth/csrf`,
a mutating request with its CSRF header, and each configured OAuth callback
before promoting the deployment.

## Deployment notes

- The database and any cache must be external managed services; container
  instances are stateless and local container files are not durable storage.
- Review database migrations and run them as a deliberate release step; do not
  run schema migrations automatically in every container startup.
- Keep Production secrets in Vercel environment settings, not in source files.
- Services deploy and roll back together. A service with a top-level rewrite is
  publicly reachable, so keep API authorization and rate limits enforced in NestJS.
