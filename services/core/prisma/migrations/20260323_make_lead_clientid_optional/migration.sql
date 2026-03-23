-- AlterTable: make Lead.clientId nullable
ALTER TABLE "core_schema"."leads" ALTER COLUMN "clientId" DROP NOT NULL;
