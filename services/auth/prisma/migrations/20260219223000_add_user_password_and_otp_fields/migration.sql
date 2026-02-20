ALTER TABLE "User"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "passwordSalt" TEXT,
  ADD COLUMN "otpCode" TEXT,
  ADD COLUMN "otpExpiresAt" TIMESTAMP(3),
  ADD COLUMN "otpVerifiedAt" TIMESTAMP(3);
