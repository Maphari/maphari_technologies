-- CreateEnum
CREATE TYPE "EftVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "referenceCode" TEXT;

-- CreateTable
CREATE TABLE "eft_verifications" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "proofFileId" TEXT NOT NULL,
    "proofFileName" TEXT NOT NULL,
    "status" "EftVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eft_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eft_verifications_projectId_key" ON "eft_verifications"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_referenceCode_key" ON "projects"("referenceCode");

-- AddForeignKey
ALTER TABLE "eft_verifications" ADD CONSTRAINT "eft_verifications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
