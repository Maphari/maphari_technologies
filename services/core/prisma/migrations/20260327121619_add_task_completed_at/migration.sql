-- Add completedAt field and index to ProjectTask
ALTER TABLE core_schema.project_tasks
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "project_tasks_completedAt_idx"
  ON core_schema.project_tasks ("completedAt");
