# Core Service (`@maphari/core`)

Fastify service for core domain resources (clients/projects/leads).

## Responsibilities

- Serve tenant-scoped core data.
- Enforce role-aware filtering for `CLIENT` requests.
- Validate create payloads via shared contract schemas.
- Cache read-heavy queries in Redis.
- Publish domain events (projects/leads) to NATS.

## Current Routes

- `GET /health`
- `GET /metrics`
- `GET /clients`
- `GET /projects`
- `POST /projects`
- `GET /leads`
- `POST /leads`
- `PATCH /leads/:leadId/status`

`GET /clients` behavior:

- `CLIENT` role: returns only `x-client-id` scoped record.
- `ADMIN` / `STAFF`: returns all clients.

`/projects` and `/leads` behavior:

- Read routes enforce tenant scoping from `x-client-id` for `CLIENT` users.
- Write routes require a resolved tenant (`clientId` from scope or body).
- `CLIENT` users cannot override tenant context via request body.
- Lead stage transitions are persisted via `PATCH /leads/:leadId/status`.

## Prisma

- Schema: `services/core/prisma/schema.prisma`
- Migration: `services/core/prisma/migrations/20260217133000_init_core/migration.sql`
- Migration: `services/core/prisma/migrations/20260217150000_add_projects_and_leads/migration.sql`

## Run

```bash
cp services/core/.env.example services/core/.env
pnpm --filter @maphari/core prisma:generate
pnpm --filter @maphari/core prisma:deploy
pnpm --filter @maphari/core dev
```

## Environment

- `PORT` (default: `4002`)
- `DATABASE_URL`
- `REDIS_URL` (default: `redis://localhost:6379`)
- `NATS_URL` (default: `nats://localhost:4222`)
- `SERVICE_RATE_LIMIT_PUBLIC_MAX` (default: `120`)
- `SERVICE_RATE_LIMIT_PROTECTED_MAX` (default: `240`)
- `SERVICE_RATE_LIMIT_WINDOW_MS` (default: `60000`)

## Metrics

- `http_requests_total`
- `http_request_duration_ms`
- `db_query_duration_ms`
