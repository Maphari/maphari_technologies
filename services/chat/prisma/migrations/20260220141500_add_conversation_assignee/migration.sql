ALTER TABLE "conversations"
ADD COLUMN "assigneeUserId" TEXT;

CREATE INDEX "conversations_assigneeUserId_updatedAt_idx"
ON "conversations"("assigneeUserId", "updatedAt");
