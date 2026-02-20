# Public API Service (`@maphari/public-api`)

External integration surface for partner operations.

## Responsibilities

- Issue and manage partner API keys.
- Verify request signatures for partner requests.
- Enforce tenant boundaries for all external operations.

## Routes

- `GET /health`
- `GET /metrics`
- `POST /public-api/keys`
- `GET /public-api/keys`
- `POST /public-api/projects`
- `GET /public-api/projects`

## Metrics

- `http_requests_total`
- `http_request_duration_ms`
- `public_api_auth_failures_total`
- `public_api_requests_total`

## Run

```bash
cp services/public-api/.env.example services/public-api/.env
pnpm --filter @maphari/public-api dev
```
