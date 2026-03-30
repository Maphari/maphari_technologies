-- CreateEnum
CREATE TYPE "PublicApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterTable
-- (relation fields publicApiProjects and publicApiKeys are virtual — no DDL change on clients table)

-- CreateTable
CREATE TABLE "PublicApiProject" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicApiProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicApiKey" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "keySecretEnc" TEXT NOT NULL,
    "status" "PublicApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicApiKey_keyId_key" ON "PublicApiKey"("keyId");

-- AddForeignKey
ALTER TABLE "PublicApiProject" ADD CONSTRAINT "PublicApiProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicApiKey" ADD CONSTRAINT "PublicApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PublicApiProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicApiKey" ADD CONSTRAINT "PublicApiKey_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
