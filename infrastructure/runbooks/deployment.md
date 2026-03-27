# Deployment Runbook

## Preconditions

- CI pipeline is green for target commit.
- Required environment secrets are present in deployment platform.
- Database migrations have been reviewed.

## Procedure

1. Tag release in git using semantic versioning (`vMAJOR.MINOR.PATCH`).
2. Build and publish container images for:
   - `apps/gateway`
   - `services/auth`
   - `services/core`
   - `services/automation`
   - `apps/web`
3. Apply DB migrations service-by-service:
   - `@maphari/auth`
   - `@maphari/core`
   - For integrations hardening, confirm core migration chain includes:
     - `20260326213000_add_idempotency_key_to_integration_sync_events`
     - `20260326222500_strengthen_integration_sync_event_idempotency`
4. Deploy services in this order:
   1. `services/auth`
   2. `services/core`
   3. `services/automation`
   4. `apps/gateway`
   5. `apps/web`
5. Verify health and metrics endpoints:
   - `/health`
   - `/metrics`

## Post-Deployment Verification

- Smoke login flow and token refresh through gateway.
- Smoke client/project/lead reads through gateway.
- Confirm alerting dashboard sees fresh metrics.
- Smoke integration operations:
  - create external task link once with a connected provider.
  - replay with same idempotency key and verify idempotent response.
  - verify sync-log endpoint returns events for the task.
