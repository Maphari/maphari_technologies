# Local Infrastructure

This folder contains local runtime infrastructure for development.

## Services

- PostgreSQL 16 (`localhost:5433`)
- Redis 7 (`localhost:6379`)
- NATS 2 (`localhost:4222`, monitor `localhost:8222`)

## Start/Stop

From repository root:

```bash
pnpm infra:up
pnpm infra:down
```

## Notes

- Postgres initializes service schemas from `infrastructure/init/01-create-schemas.sql`.
- Data persists in Docker named volumes (`postgres_data`, `redis_data`) until `infra:down -v`.
- Runbooks are under `infrastructure/runbooks/`:
  - `deployment.md`
  - `rollback.md`
  - `database-restore.md`
  - `key-rotation.md`
  - `incident-response.md`
  - `alert-thresholds.md`

- Alert rules are under `infrastructure/monitoring/alerts/`:
  - `chat-files.rules.yml` (HTTP error/latency, DB latency, upload backlog, socket-connection health)
  - `integration-operations.rules.yml` (create-link failure spikes, sync-log endpoint errors)
