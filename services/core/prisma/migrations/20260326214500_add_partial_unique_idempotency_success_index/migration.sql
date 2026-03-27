CREATE UNIQUE INDEX "integration_sync_events_task_provider_idempotency_success_uniq"
ON "integration_sync_events" ("taskId", "providerKey", "idempotencyKey")
WHERE "idempotencyKey" IS NOT NULL AND "status" = 'SUCCESS';
