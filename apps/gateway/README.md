# Gateway Service (`@maphari/gateway`)

NestJS BFF that fronts all platform APIs under `/api/v1/*`.

## API Contract

- OpenAPI (chat/files slice): `docs/api/gateway-chat-files.openapi.yaml`

## Responsibilities

- Enforce route-level RBAC.
- Enforce public/protected route-level rate limits.
- Enforce CORS allow-list policy by environment.
- Validate create/auth payloads before forwarding.
- Guarantee `x-request-id` propagation and response metadata.
- Proxy requests to downstream microservices while preserving the API envelope.

## Current Routes

- `GET /api/v1/health` (public)
- `GET /api/v1/metrics` (public)
- `POST /api/v1/auth/login` (public, proxied to auth service)
- `POST /api/v1/auth/refresh` (public, proxied to auth service)
- `POST /api/v1/auth/logout` (public, clears auth cookies)
- `GET /api/v1/clients` (RBAC protected, proxied to core service)
- `GET /api/v1/projects` (RBAC protected, proxied to core service)
- `POST /api/v1/projects` (RBAC protected, proxied to core service)
- `GET /api/v1/leads` (RBAC protected, proxied to core service)
- `POST /api/v1/leads` (RBAC protected, proxied to core service)
- `PATCH /api/v1/leads/:leadId/status` (RBAC protected, proxied to core service)
- `GET /api/v1/conversations` (RBAC protected, proxied to chat service)
- `POST /api/v1/conversations` (RBAC protected, proxied to chat service)
- `GET /api/v1/conversations/:conversationId/messages` (RBAC protected, proxied to chat service)
- `POST /api/v1/messages` (RBAC protected, proxied to chat service)
- `GET /api/v1/files` (RBAC protected, proxied to files service)
- `POST /api/v1/files` (RBAC protected, proxied to files service)
- `POST /api/v1/files/upload-url` (RBAC protected, proxied to files service)
- `POST /api/v1/files/confirm-upload` (RBAC protected, proxied to files service)
- `GET /api/v1/invoices` (RBAC protected, proxied to billing service)
- `POST /api/v1/invoices` (RBAC protected, proxied to billing service)
- `GET /api/v1/payments` (RBAC protected, proxied to billing service)
- `POST /api/v1/payments` (RBAC protected, proxied to billing service)

## Security Contract

Protected routes require headers:

- `x-user-id`
- `x-user-role` (`ADMIN` | `STAFF` | `CLIENT`)
- `x-client-id` (required when role is `CLIENT`)

## Run

```bash
pnpm --filter @maphari/gateway start:dev
```

## Environment

- `PORT` (default: `4000`)
- `AUTH_SERVICE_URL` (default: `http://localhost:4001`)
- `CORE_SERVICE_URL` (default: `http://localhost:4002`)
- `CHAT_SERVICE_URL` (default: `http://localhost:4004`)
- `FILES_SERVICE_URL` (default: `http://localhost:4005`)
- `BILLING_SERVICE_URL` (default: `http://localhost:4006`)
- `JWT_ACCESS_SECRET` (must match auth service for bearer token validation)
- `REFRESH_TOKEN_TTL_DAYS` (used for gateway cookie max-age; default: `7`)
- `CORS_ALLOWED_ORIGINS` (comma-separated allow-list; required for non-local envs)
- `GATEWAY_RATE_LIMIT_PUBLIC_MAX` (default: `120`)
- `GATEWAY_RATE_LIMIT_PUBLIC_WINDOW_MS` (default: `60000`)
- `GATEWAY_RATE_LIMIT_PROTECTED_MAX` (default: `240`)
- `GATEWAY_RATE_LIMIT_PROTECTED_WINDOW_MS` (default: `60000`)
