# Renove — Backend (API)

Backend for **Renove**, the Ghana-first operating system for architecture and
interior-design practices.

See [`../app-details.md`](../app-details.md) for the full engineering contract.
This document covers local development only.

## Stack

| Concern            | Choice                        |
| ------------------ | ----------------------------- |
| Framework          | NestJS                        |
| Language           | TypeScript (strict)           |
| Database           | PostgreSQL                    |
| ORM                | Drizzle                       |
| Auth               | HttpOnly cookies + Argon2id + token rotation |
| Validation         | class-validator + DTOs        |

## Prerequisites

- Node.js >= 24
- pnpm >= 9
- A PostgreSQL instance (local or hosted)

## Setup

```bash
pnpm install
cp .env.example .env   # fill in the values
pnpm db:migrate        # apply migrations to the database
```

`.env` is gitignored and must never be committed. All secrets live in
environment variables only.

## Development

```bash
pnpm start:dev         # watch mode API server
```

The API listens on `PORT` (default `3000`).

## Scripts

| Script              | Description                            |
| ------------------- | -------------------------------------- |
| `pnpm start:dev`    | Run the API in watch mode              |
| `pnpm build`        | Compile to `dist/`                     |
| `pnpm start:prod`   | Run the compiled production build      |
| `pnpm lint`         | ESLint (autofix)                       |
| `pnpm typecheck`    | TypeScript `--noEmit` check            |
| `pnpm format:check` | Prettier check                         |
| `pnpm test`         | Unit tests (Jest)                      |
| `pnpm test:e2e`     | End-to-end tests (Jest + supertest)    |
| `pnpm check`        | lint + typecheck + unit tests          |
| `pnpm db:generate`  | Generate a Drizzle migration           |
| `pnpm db:migrate`   | Apply migrations to the database       |
| `pnpm db:studio`    | Open Drizzle Studio                    |

## Repository layout

```text
src/
├── main.ts                  # Bootstrap: middleware, CORS, validation, listen
├── app.module.ts            # Root module composition
├── auth/                    # Registration, sessions, CSRF, token flows
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.guard.ts
│   ├── dto/                 # class-validator request contracts
│   └── *.spec.ts            # Unit tests
├── tenancy/                 # Multi-tenant foundation (RBAC, isolation)
│   ├── tenancy.module.ts
│   ├── tenants.controller.ts
│   ├── tenants.service.ts
│   ├── tenant.guard.ts      # Resolves the active tenant from the access token
│   ├── permissions.guard.ts # Enforces @RequirePermission(...) on the role
│   ├── roles.ts             # Role -> permission mapping
│   ├── dto/                 # class-validator request contracts
│   └── *.spec.ts            # Unit tests
├── config/                  # Centralized, validated configuration
├── db/
│   ├── database.module.ts   # Global PostgreSQL provider
│   ├── database.service.ts  # Drizzle client + pool
│   └── schema/              # Drizzle table definitions
└── mail/                    # Email transport (nodemailer)
```

## Tenancy

- Every user gets a personal tenant (`OWNER`) at registration.
- The access token carries `tenantId`; `TenantGuard` verifies the membership on
  every request, so role changes apply immediately.
- Tenant-scoped routes operate on the **active** tenant only — never on a
  `tenantId` from the URL — and every query is filtered by it server-side.
- Ownership rules: the sole owner cannot be removed, and `OWNER`/`ADMIN` roles
  are only granted at creation time (never assignable via member management).

## Module conventions

Every domain module follows the same shape:

- `*.module.ts` — NestJS wiring
- `*.controller.ts` — HTTP layer only (no business logic)
- `*.service.ts` — business logic
- `*.guard.ts` / `*.decorator.ts` — cross-cutting concerns
- `dto/` — validated request contracts
- `*.spec.ts` — unit tests alongside the code

Rules:

- Business logic never lives in controllers.
- Controllers never touch the database directly.
- Every tenant-owned query is scoped server-side.
- Errors are explicit; the global error handler standardizes responses later.

## Testing

```bash
pnpm check       # lint + typecheck + unit tests
pnpm test:e2e    # HTTP-level tests against a booted AppModule fixture
```

Unit tests mock `DatabaseService`, `JwtService`, and `MailService`. E2E tests
exercise the real HTTP stack including cookie parsing and DTO validation.