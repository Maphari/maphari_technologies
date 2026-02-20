# Key Rotation Runbook

## Keys Covered

- `JWT_ACCESS_SECRET` (auth + gateway)
- Any API keys used by automation integrations

## Rotation Procedure

1. Generate new secret values using secure random generation.
2. Store new secrets in secret manager.
3. Deploy auth and gateway with dual-read window if supported.
4. Force refresh-token re-authentication window if needed.
5. Remove old key references after validation window expires.

## Validation

- New login issues valid tokens.
- Gateway validates new tokens.
- Old tokens fail after cutoff (expected behavior).
