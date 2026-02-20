# Architecture Overview

## Monorepo Layout

- `apps/web`: Next.js marketing, client portal, and admin dashboard.
- `apps/gateway`: NestJS API gateway/BFF under `/api/v1/*`.
- `services/auth|core|chat|files|billing`: domain services with isolated Prisma schemas.
- `services/automation`: event subscriber workflows and operational automations.
- `packages/contracts`: shared API envelope types and Zod request schemas.
- `packages/platform`: shared runtime primitives (cache, events, metrics, security, secret providers).
- `infrastructure`: local compose stack, alert rules, and production runbooks.
- `docs`: backlog, architecture, API contracts, and ADR decision records.

## Runtime Contract

- Frontend calls gateway only (`/api/v1/*`); no direct service calls from web.
- Gateway enforces:
  - JWT/RBAC and tenant scope normalization.
  - Public/protected rate limiting policies.
  - Strict CORS allow-list behavior outside local environments.
  - Request/trace ID propagation and metrics.
- Services enforce:
  - Tenant-safe resource filtering on `CLIENT` role paths.
  - Service-level rate limits (public vs protected).
  - Structured `ApiResponse` envelope contracts.

## Observability and Reliability

- Every service exposes `/health` and `/metrics`.
- Common metrics include:
  - `http_requests_total`
  - `http_request_duration_ms`
  - `db_query_duration_ms`
- Realtime/files/automation signals include:
  - `chat_socket_connections_current`
  - `files_upload_confirm_backlog`
  - `event_backlog_depth`
- Alert rules and runbooks:
  - `infrastructure/monitoring/alerts/chat-files.rules.yml`
  - `infrastructure/runbooks/alert-thresholds.md`

## Security and Secret Strategy

- Webhook signature utility:
  - `packages/platform/src/security/webhook-signature.ts`
- Secret provider abstraction (env + vault-compatible HTTP):
  - `packages/platform/src/config/secrets.ts`
- Gateway and services consume environment-driven policy values for CORS/rate limits.

## Decision Records

- ADR index: `docs/adr/README.md`
- Atomic ADR files: `docs/adr/ADR-001-*` through `docs/adr/ADR-015-*`
