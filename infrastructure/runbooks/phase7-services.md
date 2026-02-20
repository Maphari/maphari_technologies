# Phase 7 Services Runbook

## Scope

Operational guidance for `services/ai`, `services/analytics`, `services/notifications`, and `services/public-api`.

## Deployment

1. Run contract and alert validation:
   - `pnpm validate:contracts`
2. Build and test new services:
   - `pnpm --filter @maphari/ai test && pnpm --filter @maphari/ai build`
   - `pnpm --filter @maphari/analytics test && pnpm --filter @maphari/analytics build`
   - `pnpm --filter @maphari/notifications test && pnpm --filter @maphari/notifications build`
   - `pnpm --filter @maphari/public-api test && pnpm --filter @maphari/public-api build`
3. Deploy gateway after service rollouts so proxy routes point to healthy upstreams.

## Rollback

1. Roll back the affected service deployment first.
2. If the issue is route-level, roll back gateway next.
3. Disable partner callbacks or public API routes temporarily when security integrity is uncertain.

## Incident Triage

### Phase7High5xxRate

- Check `/health` and `/metrics` for all phase7 services.
- Verify gateway upstream URLs and recent deploy/config changes.
- Roll back the most recent correlated service release.

### AnalyticsIngestFailureRateHigh

- Validate analytics payload schemas from clients.
- Check route validation errors and tenant header propagation.
- Apply producer-side fix or temporary event throttling.

### AnalyticsIngestLagHigh

- Inspect event producer timestamps for clock skew.
- Review ingestion throughput and service saturation.
- Scale ingestion workers or reduce event fan-out volume.

### NotificationRetryBacklogHigh

- Confirm provider status pages and delivery error trends.
- Inspect retry queue growth and channel-specific failure reasons.
- Fail over to secondary provider adapter if available.

### NotificationInvalidCallbacksHigh

- Confirm callback signature secrets are synchronized.
- Review callback IP/source integrity and rate-limiting behavior.
- Rotate callback secret if compromise is suspected.

### PublicApiAuthFailuresHigh

- Review key issuance and rotation records.
- Confirm partner signature generation procedure.
- Revoke impacted keys and issue replacements when abuse is detected.
