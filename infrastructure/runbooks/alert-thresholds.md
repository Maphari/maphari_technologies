# Alert Thresholds Runbook

## Scope

This runbook defines alert thresholds for metrics emitted by `services/chat` and `services/files`.
Phase 7 service thresholds are documented in `infrastructure/runbooks/phase7-services.md`.

## Alert Definitions

### ChatFilesHigh5xxRate

- Source rule: `infrastructure/monitoring/alerts/chat-files.rules.yml`
- Trigger: 5xx ratio above `5%` for `10m` across chat/files services.
- Severity: `critical`
- Primary checks:
  1. Confirm gateway upstream health for chat/files (`/api/v1/health`, `/api/v1/metrics`).
  2. Validate Postgres/Redis/NATS connectivity from both services.
  3. Check deploy history for recent config or schema changes.
- Immediate mitigation:
  1. Roll back recent release if correlated.
  2. Disable write paths (`POST /messages`, `POST /files`) if integrity is at risk.

### ChatFilesP95LatencyHigh

- Source rule: `infrastructure/monitoring/alerts/chat-files.rules.yml`
- Trigger: p95 request latency above `750ms` for `10m`.
- Severity: `warning`
- Primary checks:
  1. Compare cache hit/miss behavior in service logs.
  2. Review database query latency and lock contention.
  3. Inspect NATS publish latency and retries on write paths.
- Immediate mitigation:
  1. Temporarily scale replicas if saturation is confirmed.
  2. Reduce expensive list query volume (admin polling intervals, heavy dashboards).

### ChatFilesTrafficDrop

- Source rule: `infrastructure/monitoring/alerts/chat-files.rules.yml`
- Trigger: sustained request rate below `0.05 req/s` for `20m`.
- Severity: `warning`
- Primary checks:
  1. Verify gateway route registration for `/api/v1/conversations`, `/api/v1/messages`, `/api/v1/files`.
  2. Validate auth token acceptance and RBAC header normalization.
  3. Confirm DNS/service-discovery endpoints for chat/files upstreams.
- Immediate mitigation:
  1. Route traffic to last known healthy release.
  2. Restart gateway and affected services if routing stale state is suspected.

### ChatFilesDbP95LatencyHigh

- Source rule: `infrastructure/monitoring/alerts/chat-files.rules.yml`
- Trigger: p95 DB query latency above `200ms` for `10m` on chat/files.
- Severity: `warning`
- Primary checks:
  1. Confirm `db_query_duration_ms` trend by service and operation label.
  2. Review slow query patterns and index usage on `chat_schema` and `files_schema`.
  3. Verify connection pool saturation and lock waits.
- Immediate mitigation:
  1. Reduce expensive read bursts (list polling intervals, heavy admin refresh loops).
  2. Scale DB resources or apply targeted query/index hotfix.

### FilesUploadBacklogHigh

- Source rule: `infrastructure/monitoring/alerts/chat-files.rules.yml`
- Trigger: `files_upload_confirm_backlog` above `100` for `15m`.
- Severity: `warning`
- Primary checks:
  1. Confirm upload issue and confirm endpoint error rates.
  2. Inspect object storage availability and client-side upload completion logs.
  3. Review file metadata persistence errors in files service logs.
- Immediate mitigation:
  1. Temporarily throttle upload-url issuance.
  2. Restart files service workers if confirmation queue is stuck.

### ChatSocketConnectionsDrop

- Source rule: `infrastructure/monitoring/alerts/chat-files.rules.yml`
- Trigger: `chat_socket_connections_current` below `1` while chat HTTP traffic remains active.
- Severity: `warning`
- Primary checks:
  1. Verify Socket.IO endpoint reachability and reverse-proxy websocket upgrade support.
  2. Validate Redis adapter connectivity for realtime fan-out.
  3. Confirm auth/scope handshake payloads from clients.
- Immediate mitigation:
  1. Route traffic to prior healthy chat deployment.
  2. Disable realtime UI mode and fall back to polling for active incidents.

## Escalation Matrix

- `critical`: page on-call platform engineer immediately.
- `warning`: notify platform channel; page if unresolved after 30 minutes.
