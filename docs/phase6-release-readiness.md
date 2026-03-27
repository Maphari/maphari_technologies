# Phase 6 Release Readiness

## Scope
- Change request lifecycle automation:
  - Client approval creates downstream task + milestone artifacts.
  - Admin override path supports reopen/rollback with audit log.
- Auth hardening:
  - Client provisioning restricted to admin.
  - Internal role required for staff/admin sign-in context.
  - `rememberMe` controls refresh token session duration.
- Notifications durability:
  - Notification queue persisted in DB with retries and dead-letter.
- Integrations hardening:
  - External provider create-link flow uses retry/backoff + circuit breaker.
  - Secrets are resolved via `*Ref`/`env:*` indirection (no plaintext metadata secrets).
  - Idempotency key uniqueness is DB-enforced for `IntegrationSyncEvent`.

## Pre-Release Checks
1. Database migrations:
   - Run `pnpm db:migrate`.
   - Confirm services with Prisma completed deploy:
     - `@maphari/auth`
     - `@maphari/core`
     - `@maphari/notifications`
2. Type/build/lint:
   - Run `pnpm --filter @maphari/contracts build`
   - Run `pnpm --filter @maphari/core test`
   - Run `pnpm --filter @maphari/core build`
   - Run `pnpm --filter @maphari/gateway build`
   - Run `pnpm --filter @maphari/web lint`
   - Run `pnpm --filter @maphari/web build`
3. Environment:
   - `services/auth/.env` includes:
     - `REFRESH_TOKEN_SESSION_TTL_HOURS`
   - `services/notifications/.env` includes:
     - `DATABASE_URL`
   - `services/core/.env` optionally includes:
     - `INTERNAL_NOTIFICATION_RECIPIENT_EMAIL`
     - `INTEGRATION_ALERT_RECIPIENT_EMAIL`
     - `INTEGRATION_PROVIDER_CIRCUIT_THRESHOLD`
     - `INTEGRATION_PROVIDER_CIRCUIT_COOLDOWN_MS`
     - `INTEGRATION_PROVIDER_RETRY_MAX_ATTEMPTS`
     - `INTEGRATION_PROVIDER_RETRY_BASE_DELAY_MS`
4. Integration migrations and rollback:
   - Run core Prisma migrations in prod pipeline before web deploy.
   - Validate migration chain includes:
     - `20260326213000_add_idempotency_key_to_integration_sync_events`
     - `20260326222500_strengthen_integration_sync_event_idempotency`
   - Backfill policy:
     - Existing rows keep `idempotencyKey = NULL` (no rewrite required).
   - Rollback policy:
     - App rollback is safe with column left in place.
     - DB rollback requires dropping the unique index before reverting app behavior.

## Monitoring and Alerts
1. Notifications:
   - Monitor:
     - queued count (`status=QUEUED`)
     - failed count (`status=FAILED`)
     - dead-letter growth (`notification_dead_letters`)
   - Alert when:
     - failed jobs > 0 for 5m
     - dead-letter count increases rapidly
2. Workflow:
   - Track activity types:
     - `CHANGE_REQUEST_OVERRIDE`
     - `CHANGE_REQUEST_TASK_CREATED`
     - `CHANGE_REQUEST_MILESTONE_CREATED`
   - Alert on override spikes to detect process friction.
3. Auth:
   - Track login failures by code:
     - `INTERNAL_LOGIN_ROLE_REQUIRED`
     - `ROLE_MISMATCH`
     - `ACCOUNT_NOT_REGISTERED`
   - Alert on unusual increase in role mismatch/forbidden errors.
4. Integrations:
   - Monitor:
     - `CreateExternalLinkFailedSpike` alert (`/admin/integrations/tasks/:taskId/create-external-link` 5xx spike)
     - `IntegrationSyncLogEndpointErrors` alert (`/admin/tasks/:taskId/integration-sync-events` 5xx)
     - notification events tagged with `EXTERNAL_CREATE_FAILED`
   - Alert when:
     - create-link 5xx errors exceed threshold for 10m
     - sync-log endpoint 5xx errors persist for 10m
   - Provider metadata templates:
     - see `docs/integrations/admin-provider-metadata-templates.md`

## Manual Acceptance Scenarios
1. Standard lifecycle:
   - Client submits request.
   - Staff estimates.
   - Admin approves.
   - Client approves.
   - Verify task + milestone auto-created and visible in staff/client dashboards.
2. Admin override:
   - Move finalized request back to `SUBMITTED`.
   - Verify override activity entry is recorded.
3. Notification durability:
   - Queue notifications.
   - Restart notifications service.
   - Verify queued jobs persist and continue processing.
