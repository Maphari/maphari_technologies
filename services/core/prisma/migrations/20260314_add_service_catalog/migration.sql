-- CreateTable: service_packages
CREATE TABLE "service_packages" (
    "id"            TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "slug"          TEXT NOT NULL,
    "tagline"       TEXT,
    "priceMinCents" INTEGER NOT NULL DEFAULT 0,
    "priceMaxCents" INTEGER NOT NULL DEFAULT 0,
    "isCustomQuote" BOOLEAN NOT NULL DEFAULT false,
    "deliveryDays"  TEXT,
    "paymentTerms"  TEXT,
    "idealFor"      TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features"      JSONB NOT NULL DEFAULT '[]',
    "billingType"   TEXT NOT NULL DEFAULT 'ONCE_OFF',
    "sortOrder"     INTEGER NOT NULL DEFAULT 0,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: service_addons
CREATE TABLE "service_addons" (
    "id"            TEXT NOT NULL,
    "category"      TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "description"   TEXT,
    "priceMinCents" INTEGER NOT NULL DEFAULT 0,
    "priceMaxCents" INTEGER NOT NULL DEFAULT 0,
    "priceLabel"    TEXT,
    "billingType"   TEXT NOT NULL DEFAULT 'ONCE_OFF',
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "sortOrder"     INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable: retainer_plans
CREATE TABLE "retainer_plans" (
    "id"            TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "description"   TEXT,
    "priceMinCents" INTEGER NOT NULL DEFAULT 0,
    "priceMaxCents" INTEGER NOT NULL DEFAULT 0,
    "features"      JSONB NOT NULL DEFAULT '[]',
    "sortOrder"     INTEGER NOT NULL DEFAULT 0,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retainer_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable: service_bundles
CREATE TABLE "service_bundles" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: service_bundle_packages
CREATE TABLE "service_bundle_packages" (
    "bundleId"  TEXT NOT NULL,
    "packageId" TEXT NOT NULL,

    CONSTRAINT "service_bundle_packages_pkey" PRIMARY KEY ("bundleId","packageId")
);

-- Unique constraints
CREATE UNIQUE INDEX "service_packages_slug_key" ON "service_packages"("slug");

-- Indexes
CREATE INDEX "service_packages_isActive_sortOrder_idx" ON "service_packages"("isActive", "sortOrder");
CREATE INDEX "service_addons_category_isActive_idx"    ON "service_addons"("category", "isActive");
CREATE INDEX "service_addons_isActive_sortOrder_idx"   ON "service_addons"("isActive", "sortOrder");
CREATE INDEX "retainer_plans_isActive_sortOrder_idx"   ON "retainer_plans"("isActive", "sortOrder");
CREATE INDEX "service_bundles_isActive_sortOrder_idx"  ON "service_bundles"("isActive", "sortOrder");

-- Foreign keys
ALTER TABLE "service_bundle_packages" ADD CONSTRAINT "service_bundle_packages_bundleId_fkey"
    FOREIGN KEY ("bundleId")  REFERENCES "service_bundles"("id")  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "service_bundle_packages" ADD CONSTRAINT "service_bundle_packages_packageId_fkey"
    FOREIGN KEY ("packageId") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
