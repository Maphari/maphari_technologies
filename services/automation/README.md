# Automation Service (`@maphari/automation`)

Event-consumer service for asynchronous workflow triggers.

## Responsibilities

- Subscribe to domain events from NATS.
- Validate event envelopes/payloads against a topic registry.
- Enforce idempotency on `eventId` to skip duplicate processing.
- Execute workflow handlers with retry/backoff and dead-letter fallback.
- Persist idempotency keys + job audit/dead-letter state in Redis.
- Persist scheduled notifications in Redis and dispatch due jobs from background worker cycles.
- Route workflow side effects through adapter interfaces:
  - Notifications adapter (email/WhatsApp/internal)
  - CRM adapter (lead upsert, stage update, tagging)
- Expose service health for runtime checks.

## Current Routes

- `GET /health`
- `GET /metrics`
- `GET /automation/jobs`
- `GET /automation/jobs/:jobId`
- `GET /automation/dead-letters`
- `GET /automation/runtime`

## Current Event Subscriptions

- `auth.user.logged-in`
- `auth.token.refreshed`
- `core.project.created`
- `core.booking.created`
- `core.proposal.signed`
- `core.onboarding.submitted`
- `core.project.status-updated`
- `core.project.completed`
- `ops.maintenance.check-completed`
- `security.incident.detected`
- `reporting.report.generated`
- `growth.testimonial.received`
- `growth.client.reengagement-due`
- `ai.lead.qualified`
- `ai.proposal.drafted`
- `ai.estimate.generated`
- `core.lead.created`
- `core.lead.status-updated`
- `chat.conversation.created`
- `chat.message.created`
- `files.file.uploaded`
- `billing.invoice.issued`
- `billing.invoice.paid`
- `billing.invoice.overdue`

## Phase 1 Automations Implemented

- Booking automation (`core.booking.created`)
  - Send confirmation email
  - Schedule reminder email 24 hours before start
  - Schedule reminder email 1 hour before start
  - Create CRM pipeline entry for booked consultation
  - Notify internal team
- Proposal conversion (`core.proposal.signed`)
  - Update CRM stage to won
  - Trigger invoice generation adapter action
  - Trigger project creation adapter action
  - Send onboarding welcome email
  - Notify internal team
- Onboarding submission (`core.onboarding.submitted`)
  - Assign onboarding tasks in CRM/PM adapter
  - Notify internal team
  - Schedule missing-assets reminder when no assets were provided
- Project lifecycle (`core.project.status-updated`, `core.project.completed`)
  - Notify internal systems for dashboard/state sync on status updates
  - Request testimonial via email on completion
  - Notify internal team on completion
- Lead capture (`core.lead.created`)
  - Upsert lead in CRM adapter
  - Tag lead as website/new-lead
  - Send auto-reply email
  - Send internal team alert
  - Send WhatsApp alert
  - Schedule follow-up emails (3-day and 7-day templates via `scheduleAt`)
- Pipeline update (`core.lead.status-updated`)
  - Sync stage change to CRM adapter
- Invoice issued (`billing.invoice.issued`)
  - Send invoice email
  - Schedule due reminder for 3 days before `dueAt` (when present)
- Invoice paid (`billing.invoice.paid`)
  - Send payment receipt email
  - Send internal admin notification
  - Mark invoice paid in CRM adapter
  - Trigger project creation from payment in CRM adapter
- Chat message created (`chat.message.created`)
  - Send internal notification
  - Schedule 24-hour internal SLA no-reply alert
- Invoice overdue (`billing.invoice.overdue`)
  - Send internal escalation notification
- File uploaded (`files.file.uploaded`)
  - Notify internal team
  - Notify relevant client contact
- Operations/security/reporting/growth
  - Maintenance checks: alert on warn/fail outcomes
  - Security incidents: internal alerts + critical email escalation
  - Reports: internal distribution + client delivery for client-facing report types
  - Testimonials: queue for publishing + send thank-you response
  - Reengagement: trigger client campaign + internal tracking alert
- AI workflows
  - Lead qualified: tag/update pipeline + internal review alert
  - Proposal drafted: notify internal team for approval and send flow
  - Estimate generated: notify internal team for scope/pricing review

## Metrics

- `events_received_total`
- `events_failed_total`
- `events_retry_total`
- `events_dead_lettered_total`
- `events_validation_failed_total`
- `events_duplicate_total`
- `event_backlog_depth`
- `scheduled_notifications_enqueued_total`
- `scheduled_notifications_sent_total`
- `scheduled_notifications_failed_total`
- `scheduled_notifications_pending`

## Environment

- `SERVICE_RATE_LIMIT_PUBLIC_MAX` (default: `120`)
- `SERVICE_RATE_LIMIT_PROTECTED_MAX` (default: `240`)
- `SERVICE_RATE_LIMIT_WINDOW_MS` (default: `60000`)
- `AUTOMATION_MAX_RETRIES` (default: `3`)
- `AUTOMATION_RETRY_INITIAL_DELAY_MS` (default: `250`)
- `AUTOMATION_SCHEDULER_INTERVAL_MS` (default: `5000`)
- `AUTOMATION_SCHEDULER_BATCH_SIZE` (default: `50`)
- `AUTOMATION_STRICT_SECRETS` (`true|false`, default: `false`)
- `AUTOMATION_WEBHOOK_SIGNING_SECRET` (used to sign outbound webhook payloads)
- `REDIS_URL` (default: `redis://localhost:6379`)
- `AUTOMATION_REDIS_ENABLED` (`true|false`, default: `true`)
- `AUTOMATION_PERSISTENCE_NAMESPACE` (default: `automation`)
- `AUTOMATION_IDEMPOTENCY_TTL_SECONDS` (default: `604800`)
- `AUTOMATION_JOB_TTL_SECONDS` (default: `2592000`)
- `AUTOMATION_MAX_JOB_HISTORY` (default: `1000`)
- `AUTOMATION_NOTIFICATIONS_PROVIDER` (`noop|webhook`, default: `noop`)
- `AUTOMATION_NOTIFICATIONS_WEBHOOK_URL` (required when notifications provider is `webhook`)
- `AUTOMATION_NOTIFICATIONS_API_KEY` (required when strict secrets mode is enabled + provider is `webhook`)
- `AUTOMATION_CRM_PROVIDER` (`noop|webhook`, default: `noop`)
- `AUTOMATION_CRM_WEBHOOK_URL` (required when CRM provider is `webhook`)
- `AUTOMATION_CRM_API_KEY` (required when strict secrets mode is enabled + provider is `webhook`)

## Run

```bash
cp services/automation/.env.example services/automation/.env
pnpm --filter @maphari/automation dev
```
