# Database Restore Runbook

## Scope

PostgreSQL restore for `maphari` database and service schemas.

## Procedure

1. Put system in maintenance mode (disable writes at gateway).
2. Confirm backup timestamp and integrity.
3. Restore target backup to Postgres instance.
4. Recreate/verify service schemas:
   - `auth_schema`
   - `core_schema`
   - `chat_schema`
   - `files_schema`
   - `billing_schema`
   - `automation_schema`
   - `admin_schema`
5. Run migration status checks for auth/core.
6. Re-enable services and perform smoke checks.

## Verification

- Auth login + refresh works.
- Core clients/projects/leads reads/writes succeed.
- No migration drift reported.
