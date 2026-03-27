DROP INDEX IF EXISTS integration_sync_events_task_provider_idempotency_success_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS integration_sync_events_task_provider_idempotency_uniq
ON integration_sync_events ("taskId", "providerKey", "idempotencyKey")
WHERE "idempotencyKey" IS NOT NULL;
