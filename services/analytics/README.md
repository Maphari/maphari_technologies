# Analytics Service (`@maphari/analytics`)

Tenant-safe analytics ingest and query service.

## Responsibilities

- Validate inbound analytics events.
- Persist records in a tenant-aware store boundary.
- Serve aggregate metrics by tenant and event type.

## Routes

- `GET /health`
- `GET /metrics`
- `POST /analytics/events`
- `GET /analytics/metrics`

## Metrics

- `http_requests_total`
- `http_request_duration_ms`
- `analytics_ingest_total`
- `analytics_ingest_failures_total`
- `analytics_ingest_lag_ms`

## Run

```bash
cp services/analytics/.env.example services/analytics/.env
pnpm --filter @maphari/analytics dev
```
