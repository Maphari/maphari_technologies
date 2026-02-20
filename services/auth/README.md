# Auth Service (`@maphari/auth`)

Fastify service responsible for authentication lifecycle primitives.

## Responsibilities

- User lookup/provisioning by email.
- Refresh token persistence.
- Login event audit trail.
- Login/refresh payload validation via shared contract schemas.
- Publish auth lifecycle events to NATS.

## Current Routes

- `GET /health`
- `GET /metrics`
- `POST /auth/login`
- `POST /auth/refresh`

`POST /auth/login` flow:

1. Normalize user email.
2. Upsert user record.
3. Persist refresh token hash with 7-day expiry.
4. Persist login event with request metadata.
5. Return API envelope with access/refresh token payload.

`POST /auth/refresh` flow:

1. Validate refresh token hash lookup.
2. Reject revoked/expired/inactive records.
3. Revoke current token and issue rotated replacement.
4. Return a fresh access token, rotated refresh token, and user claims payload.

## Prisma

- Schema: `services/auth/prisma/schema.prisma`
- Migration: `services/auth/prisma/migrations/20260217133000_init_auth/migration.sql`

## Run

```bash
cp services/auth/.env.example services/auth/.env
pnpm --filter @maphari/auth prisma:generate
pnpm --filter @maphari/auth prisma:deploy
pnpm --filter @maphari/auth dev
```

## Environment

- `PORT` (default: `4001`)
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `ACCESS_TOKEN_TTL_SECONDS` (default: `900`)
- `REFRESH_TOKEN_TTL_DAYS` (default: `7`)
- `NATS_URL` (default: `nats://localhost:4222`)
- `SERVICE_RATE_LIMIT_PUBLIC_MAX` (default: `120`)
- `SERVICE_RATE_LIMIT_PROTECTED_MAX` (default: `240`)
- `SERVICE_RATE_LIMIT_WINDOW_MS` (default: `60000`)

## Metrics

- `http_requests_total`
- `http_request_duration_ms`
- `db_query_duration_ms`
