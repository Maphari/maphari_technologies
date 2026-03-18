ALTER TABLE "project_milestones" ADD COLUMN "fileId" UUID;

CREATE TABLE "project_time_entries" (
    "id" UUID DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "staffUserId" UUID,
    "staffName" TEXT,
    "taskLabel" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "startedAt" TIMESTAMPTZ,
    "endedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "project_time_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_time_entries_clientId_createdAt_idx" ON "project_time_entries"("clientId", "createdAt");
CREATE INDEX "project_time_entries_projectId_createdAt_idx" ON "project_time_entries"("projectId", "createdAt");

ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
