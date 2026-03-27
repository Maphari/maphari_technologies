-- Add mood, hours, and flagAdmin fields to standup_entries
ALTER TABLE core_schema.standup_entries
  ADD COLUMN IF NOT EXISTS "mood"       INTEGER,
  ADD COLUMN IF NOT EXISTS "hours"      DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "flag_admin" BOOLEAN NOT NULL DEFAULT false;
