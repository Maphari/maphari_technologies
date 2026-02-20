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
