# Phase 7 Backlog: Future Extension Services

## Objective

Define executable delivery tickets for the v12 future extension services so they can move from concept to implementation with clear acceptance criteria.

## P7-001 AI Service Foundation

- Status: Completed (2026-02-17)

- Scope:
  - Create `services/ai` with Fastify service scaffold.
  - Add `/health` and `/metrics`.
  - Add gateway proxy routes under `/api/v1/ai/*`.
- Acceptance criteria:
  - Service boots locally and passes `typecheck`, `test`, `build`.
  - Gateway routes are protected by RBAC and tenant context headers.
  - Initial OpenAPI contract exists for AI endpoints.

## P7-002 Analytics Service Foundation

- Status: Completed (2026-02-17)

- Scope:
  - Create `services/analytics` with event-ingest endpoints.
  - Add tenant-safe query endpoints for product metrics.
  - Persist analytics records in isolated schema.
- Acceptance criteria:
  - Event ingest accepts validated payloads only.
  - Query endpoints return tenant-scoped metrics data.
  - Alert threshold rules exist for ingest failure and lag.

## P7-003 Notification Service Foundation

- Status: Completed (2026-02-17)

- Scope:
  - Create `services/notifications` for email/SMS/push orchestration.
  - Add channel adapter abstraction and retry strategy.
  - Integrate with automation events for trigger-based notifications.
- Acceptance criteria:
  - Notification jobs can be enqueued and processed end-to-end.
  - Delivery status and failure reasons are queryable.
  - Rate limits and signature verification are implemented for provider callbacks.

## P7-004 Public API Service

- Status: Completed (2026-02-17)

- Scope:
  - Create `services/public-api` for external partner integrations.
  - Add API key management and request signature checks.
  - Publish versioned contract docs and onboarding flow.
- Acceptance criteria:
  - External API requests are authenticated and auditable.
  - Tenant isolation is enforced for all partner operations.
  - OpenAPI + usage examples are published under `docs/api`.

## P7-005 Cross-Service Platform Hardening

- Status: Completed (2026-02-17)

- Scope:
  - Add integration tests for gateway -> future services proxy behavior.
  - Add SLO metrics and alerting for each new service.
  - Add runbooks and local bootstrap updates.
- Acceptance criteria:
  - CI validates contracts, alerts, and integration tests.
  - Runbooks include deployment, rollback, and incident triage per service.
  - Local development bootstrap includes all new services.
