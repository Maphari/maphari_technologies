CREATE TABLE "milestone_approvals" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "milestoneId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "decidedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "milestone_approvals_milestoneId_key" ON "milestone_approvals"("milestoneId");
CREATE INDEX "milestone_approvals_clientId_createdAt_idx" ON "milestone_approvals"("clientId", "createdAt");
CREATE INDEX "milestone_approvals_projectId_createdAt_idx" ON "milestone_approvals"("projectId", "createdAt");
CREATE INDEX "milestone_approvals_status_idx" ON "milestone_approvals"("status");

ALTER TABLE "milestone_approvals" ADD CONSTRAINT "milestone_approvals_milestoneId_fkey"
FOREIGN KEY ("milestoneId") REFERENCES "project_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "milestone_approvals" ADD CONSTRAINT "milestone_approvals_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "milestone_approvals" ADD CONSTRAINT "milestone_approvals_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "conversation_notes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorRole" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "conversation_notes_conversationId_createdAt_idx" ON "conversation_notes"("conversationId", "createdAt");

CREATE TABLE "conversation_escalations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "ownerAdminId" TEXT,
    "resolvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "conversation_escalations_conversationId_createdAt_idx" ON "conversation_escalations"("conversationId", "createdAt");
CREATE INDEX "conversation_escalations_status_idx" ON "conversation_escalations"("status");
