# Files Service (`@maphari/files`)

Files metadata service for uploaded assets.

## Current Routes

- `GET /health`
- `GET /metrics`
- `GET /files`
- `POST /files`
- `POST /files/upload-url`
- `POST /files/confirm-upload`
- `PUT /uploads/:storageKey` (direct upload target)

## Behavior

- `CLIENT` role is tenant-scoped by `x-client-id`.
- Read paths use Redis cache; writes invalidate cache.
- Emits `files.file.uploaded` domain events to NATS.
- Upload flow supports: issue URL -> direct PUT upload -> confirm metadata.
- Metrics include:
  - `db_query_duration_ms`
  - `files_upload_confirm_backlog`

## Security Controls

- Service-level rate limits are enabled via:
  - `SERVICE_RATE_LIMIT_PUBLIC_MAX`
  - `SERVICE_RATE_LIMIT_PROTECTED_MAX`
  - `SERVICE_RATE_LIMIT_WINDOW_MS`
- Upload CORS allow-list is controlled by `UPLOAD_ALLOWED_ORIGINS` (comma-separated) for non-local environments.

## Run

```bash
cp services/files/.env.example services/files/.env
pnpm --filter @maphari/files prisma:generate
pnpm --filter @maphari/files prisma:deploy
pnpm --filter @maphari/files dev
```
