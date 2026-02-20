# Incident Response Runbook

## Severity Levels

- `SEV-1`: Full outage or data risk
- `SEV-2`: Major feature degradation
- `SEV-3`: Localized issue with workaround

## Initial Response

1. Declare incident channel and owner.
2. Capture timeline start and impacted services.
3. Check service `/health` + `/metrics` and gateway error rates.
4. Cross-check active alert definitions in `infrastructure/runbooks/alert-thresholds.md`.

## Containment

1. If release related, execute rollback runbook.
2. If infra related, isolate failing dependency (Postgres/Redis/NATS).
3. Disable high-risk write paths when data integrity is uncertain.

## Communication

- Update status every 15 minutes during active incident.
- Record customer impact and mitigation status.

## Recovery & Follow-up

1. Verify system stability for 30+ minutes.
2. Close incident and publish postmortem:
   - Root cause
   - Detection gap
   - Corrective actions
