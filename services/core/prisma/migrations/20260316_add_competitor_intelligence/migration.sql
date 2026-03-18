-- CreateTable: competitors
CREATE TABLE "competitors" (
    "id"           TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "type"         TEXT NOT NULL DEFAULT 'Direct',
    "tier"         TEXT NOT NULL DEFAULT 'Same tier',
    "color"        TEXT NOT NULL DEFAULT 'var(--red)',
    "services"     TEXT NOT NULL DEFAULT '[]',
    "strengths"    TEXT NOT NULL DEFAULT '[]',
    "weaknesses"   TEXT NOT NULL DEFAULT '[]',
    "pricing"      TEXT,
    "positioning"  TEXT,
    "beatStrategy" TEXT,
    "avgRetainer"  INTEGER NOT NULL DEFAULT 0,
    "winsCount"    INTEGER NOT NULL DEFAULT 0,
    "lossesCount"  INTEGER NOT NULL DEFAULT 0,
    "lastUpdated"  TEXT,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable: win_loss_entries
CREATE TABLE "win_loss_entries" (
    "id"           TEXT NOT NULL,
    "date"         TEXT NOT NULL,
    "prospect"     TEXT NOT NULL,
    "outcome"      TEXT NOT NULL DEFAULT 'pending',
    "competitorId" TEXT,
    "reason"       TEXT,
    "notes"        TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "win_loss_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: market_rates
CREATE TABLE "market_rates" (
    "id"         TEXT NOT NULL,
    "service"    TEXT NOT NULL,
    "maphari"    INTEGER NOT NULL DEFAULT 0,
    "marketLow"  INTEGER NOT NULL DEFAULT 0,
    "marketMid"  INTEGER NOT NULL DEFAULT 0,
    "marketHigh" INTEGER NOT NULL DEFAULT 0,
    "isActive"   BOOLEAN NOT NULL DEFAULT true,
    "sortOrder"  INTEGER NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "market_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competitors_isActive_idx" ON "competitors"("isActive");
CREATE INDEX "win_loss_entries_outcome_idx" ON "win_loss_entries"("outcome");
CREATE INDEX "win_loss_entries_competitorId_idx" ON "win_loss_entries"("competitorId");
CREATE INDEX "market_rates_isActive_sortOrder_idx" ON "market_rates"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "win_loss_entries" ADD CONSTRAINT "win_loss_entries_competitorId_fkey"
    FOREIGN KEY ("competitorId") REFERENCES "competitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
