ALTER TABLE "StaffAccessRequest"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "passwordSalt" TEXT;
