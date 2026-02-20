# Rollback Runbook

## Trigger Conditions

- Elevated 5xx error rate
- Auth/token failures after release
- Data integrity concerns due to recent app change

## Procedure

1. Identify last known healthy release tag.
2. Roll back service images in reverse deployment order:
   1. `apps/web`
   2. `apps/gateway`
   3. `services/automation`
   4. `services/core`
   5. `services/auth`
3. If a migration caused failure:
   - Stop write traffic.
   - Restore database from latest validated backup.
   - Re-run app with previous image tags.
4. Validate:
   - `/health` and `/metrics` for each service
   - Login, refresh, and protected route behavior

## Incident Notes

- Capture exact failing release SHA/tag.
- Record impact window and root-cause hypotheses.
