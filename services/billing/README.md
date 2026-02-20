# Billing Service (`@maphari/billing`)

Billing domain service foundation for invoices and payments.

## Current Routes

- `GET /health`
- `GET /metrics`
- `GET /invoices`
- `POST /invoices`
- `GET /payments`
- `POST /payments`

## Behavior

- `CLIENT` role is tenant-scoped by `x-client-id`.
- Invoice list reads are cached in Redis for short-lived performance gains.
- Invoice and payment persistence is owned by `billing_schema`.
- Billing event topics emitted to NATS:
  - `billing.invoice.issued`
  - `billing.invoice.paid`
  - `billing.invoice.overdue`
- Metrics include:
  - `db_query_duration_ms`
- Security utility coverage includes webhook signature verification and secret-provider fallback tests.

## Run

```bash
cp services/billing/.env.example services/billing/.env
pnpm --filter @maphari/billing prisma:generate
pnpm --filter @maphari/billing prisma:deploy
pnpm --filter @maphari/billing dev
```

## Environment

- `SERVICE_RATE_LIMIT_PUBLIC_MAX` (default: `120`)
- `SERVICE_RATE_LIMIT_PROTECTED_MAX` (default: `240`)
- `SERVICE_RATE_LIMIT_WINDOW_MS` (default: `60000`)
