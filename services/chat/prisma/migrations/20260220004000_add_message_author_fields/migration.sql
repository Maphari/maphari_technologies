ALTER TABLE "messages"
  ADD COLUMN "authorId" TEXT,
  ADD COLUMN "authorRole" TEXT;

CREATE INDEX "messages_conversationId_authorRole_createdAt_idx"
  ON "messages"("conversationId", "authorRole", "createdAt");
