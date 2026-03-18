-- Add feedback_reactions table
CREATE TABLE IF NOT EXISTS "feedback_reactions" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedback_reactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "feedback_reactions_ticketId_clientId_emoji_key"
  ON "feedback_reactions"("ticketId", "clientId", "emoji");

CREATE INDEX IF NOT EXISTS "feedback_reactions_ticketId_idx"
  ON "feedback_reactions"("ticketId");

-- Add feedback_replies table
CREATE TABLE IF NOT EXISTS "feedback_replies" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorRole" TEXT NOT NULL DEFAULT 'CLIENT',
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feedback_replies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "feedback_replies_ticketId_createdAt_idx"
  ON "feedback_replies"("ticketId", "createdAt");
