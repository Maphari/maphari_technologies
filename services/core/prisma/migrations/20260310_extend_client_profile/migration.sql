-- Extend client_profiles with social links, company metadata, and cover image
ALTER TABLE core_schema.client_profiles
  ADD COLUMN IF NOT EXISTS social_links    JSONB,
  ADD COLUMN IF NOT EXISTS year_founded    INTEGER,
  ADD COLUMN IF NOT EXISTS team_size       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS hq_location     TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
