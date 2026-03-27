ALTER TABLE "client_contracts"
ADD COLUMN "projectId" TEXT;

ALTER TABLE "proposals"
ADD COLUMN "projectId" TEXT;

CREATE INDEX "client_contracts_projectId_idx" ON "client_contracts"("projectId");
CREATE INDEX "proposals_projectId_idx" ON "proposals"("projectId");

ALTER TABLE "client_contracts"
ADD CONSTRAINT "client_contracts_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "proposals"
ADD CONSTRAINT "proposals_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
