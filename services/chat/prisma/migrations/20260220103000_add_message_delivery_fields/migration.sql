ALTER TABLE "messages"
  ADD COLUMN "deliveryStatus" TEXT NOT NULL DEFAULT 'SENT',
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "readAt" TIMESTAMP(3);

CREATE INDEX "messages_conversationId_deliveryStatus_createdAt_idx"
  ON "messages"("conversationId", "deliveryStatus", "createdAt");
