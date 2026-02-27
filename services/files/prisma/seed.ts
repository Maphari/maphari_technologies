import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

// ─── Shared client constants (match across all service seeds) ─────────────────
const CLIENT1_ID = "c1000000-0000-0000-0000-000000000001"; // TechStart Ltd
const CLIENT2_ID = "c1000000-0000-0000-0000-000000000002"; // GrowthCo Agency
const CLIENT3_ID = "c1000000-0000-0000-0000-000000000003"; // Enterprise Systems

async function main() {
  console.log("🌱 Seeding files database…");

  const files = [
    {
      id: "fi000000-0000-0000-0000-000000000001",
      clientId: CLIENT1_ID,
      fileName: "techstart-design-brief.pdf",
      storageKey: `uploads/${CLIENT1_ID}/techstart-design-brief.pdf`,
      mimeType: "application/pdf",
      sizeBytes: BigInt(2457600), // 2.4 MB
    },
    {
      id: "fi000000-0000-0000-0000-000000000002",
      clientId: CLIENT1_ID,
      fileName: "website-project-specification.pdf",
      storageKey: `uploads/${CLIENT1_ID}/website-project-specification.pdf`,
      mimeType: "application/pdf",
      sizeBytes: BigInt(1153434), // 1.1 MB
    },
    {
      id: "fi000000-0000-0000-0000-000000000003",
      clientId: CLIENT2_ID,
      fileName: "growthco-brand-logo-final.png",
      storageKey: `uploads/${CLIENT2_ID}/growthco-brand-logo-final.png`,
      mimeType: "image/png",
      sizeBytes: BigInt(409600), // 0.4 MB
    },
    {
      id: "fi000000-0000-0000-0000-000000000004",
      clientId: CLIENT3_ID,
      fileName: "erp-data-mapping-v3.xlsx",
      storageKey: `uploads/${CLIENT3_ID}/erp-data-mapping-v3.xlsx`,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      sizeBytes: BigInt(819200), // 0.8 MB
    },
    {
      id: "fi000000-0000-0000-0000-000000000005",
      clientId: CLIENT1_ID,
      fileName: "invoice-2026-001.pdf",
      storageKey: `uploads/${CLIENT1_ID}/invoices/invoice-2026-001.pdf`,
      mimeType: "application/pdf",
      sizeBytes: BigInt(204800), // 0.2 MB
    },
  ];

  for (const file of files) {
    await prisma.fileRecord.upsert({
      where: { id: file.id },
      update: {},
      create: file,
    });
    console.log(`  ✓ File "${file.fileName}" — ${(Number(file.sizeBytes) / 1024 / 1024).toFixed(1)} MB`);
  }

  console.log("\n✅ Files seed complete — 5 file records");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
