ALTER TABLE "client_profiles"
ADD COLUMN "accountType" TEXT NOT NULL DEFAULT 'COMPANY',
ADD COLUMN "projectName" TEXT,
ADD COLUMN "projectBrief" TEXT,
ADD COLUMN "primaryContactName" TEXT,
ADD COLUMN "primaryContactRole" TEXT,
ADD COLUMN "primaryContactEmail" TEXT,
ADD COLUMN "primaryContactPhone" TEXT,
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
