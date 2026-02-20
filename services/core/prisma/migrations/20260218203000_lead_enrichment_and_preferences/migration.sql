ALTER TABLE "leads"
  ADD COLUMN "contactName" TEXT,
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "contactPhone" TEXT,
  ADD COLUMN "company" TEXT;

CREATE INDEX "leads_contactEmail_idx" ON "leads"("contactEmail");
CREATE INDEX "leads_contactPhone_idx" ON "leads"("contactPhone");

CREATE TABLE "user_preferences" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "user_preferences_userId_key_key" UNIQUE ("userId", "key")
);

CREATE INDEX "user_preferences_userId_idx" ON "user_preferences"("userId");
