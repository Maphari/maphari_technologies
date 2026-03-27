1. Timezone correctness end-to-end (create, edit, reminders, ICS) with DST-safe storage in UTC.
2. Conflict detection and prevention (staff double-booking, client overlap, buffer windows).
3. Status lifecycle completeness (scheduled, confirmed, rescheduled, cancelled, no-show, completed) with audit trail.
4. Reminder automation reliability (retry/backoff, dedupe, per-channel delivery tracking).
5. Calendar sync integrity (Google/Outlook two-way sync, idempotency keys, webhook replay handling).
6. Permissions and privacy (who can view/edit/cancel, redaction of private notes).
7. Reschedule/cancel policy controls (cutoff windows, reason required, customer-facing messaging templates).
8. Strong empty/loading/error states and optimistic updates with rollback.
9. Search/filter/reporting (by date range, staff, client, status, missed/no-show rate, SLA response).
10. Operational observability (structured logs, metrics, alerts for failed sync/reminders/webhooks).
11. Test coverage: integration tests for scheduling flows + E2E UI tests for create/edit/reschedule/cancel.
12. Accessibility and mobile readiness (keyboard nav, focus states, screen reader labels, small-screen layout).