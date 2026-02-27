import { PrismaClient, InvoiceStatus, PaymentStatus } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

// ─── Shared client constants (match across all service seeds) ─────────────────
const CLIENT1_ID = "c1000000-0000-0000-0000-000000000001"; // TechStart Ltd
const CLIENT2_ID = "c1000000-0000-0000-0000-000000000002"; // GrowthCo Agency
const CLIENT3_ID = "c1000000-0000-0000-0000-000000000003"; // Enterprise Systems

const now = new Date();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

async function main() {
  console.log("🌱 Seeding billing database…");

  // ── Invoices ────────────────────────────────────────────────────────────────
  const invoices = [
    {
      id: "inv-2026-001",
      clientId: CLIENT1_ID,
      number: "INV-2026-001",
      amountCents: BigInt(1250000), // $12,500
      currency: "USD",
      status: InvoiceStatus.PAID,
      issuedAt: daysAgo(60),
      dueAt: daysAgo(30),
      paidAt: daysAgo(28),
    },
    {
      id: "inv-2026-002",
      clientId: CLIENT1_ID,
      number: "INV-2026-002",
      amountCents: BigInt(800000), // $8,000
      currency: "USD",
      status: InvoiceStatus.ISSUED,
      issuedAt: daysAgo(7),
      dueAt: daysFromNow(7),
    },
    {
      id: "inv-2026-003",
      clientId: CLIENT2_ID,
      number: "INV-2026-003",
      amountCents: BigInt(420000), // $4,200
      currency: "USD",
      status: InvoiceStatus.OVERDUE,
      issuedAt: daysAgo(40),
      dueAt: daysAgo(10),
    },
    {
      id: "inv-2026-004",
      clientId: CLIENT3_ID,
      number: "INV-2026-004",
      amountCents: BigInt(3200000), // $32,000
      currency: "USD",
      status: InvoiceStatus.ISSUED,
      issuedAt: daysAgo(3),
      dueAt: daysFromNow(14),
    },
    {
      id: "inv-2026-005",
      clientId: CLIENT3_ID,
      number: "INV-2026-005",
      amountCents: BigInt(1500000), // $15,000
      currency: "USD",
      status: InvoiceStatus.DRAFT,
    },
  ];

  for (const inv of invoices) {
    await prisma.invoice.upsert({
      where: { clientId_number: { clientId: inv.clientId, number: inv.number } },
      update: {},
      create: inv,
    });
    console.log(`  ✓ Invoice ${inv.number} — ${inv.status}`);
  }

  // ── Payments ─────────────────────────────────────────────────────────────────
  const payments = [
    {
      id: "pay-2026-001",
      clientId: CLIENT1_ID,
      invoiceId: "inv-2026-001",
      amountCents: BigInt(1250000),
      status: PaymentStatus.COMPLETED,
      provider: "stripe",
      transactionRef: "ch_3Oy1234567890abcd",
      paidAt: daysAgo(28),
    },
    {
      id: "pay-2026-002",
      clientId: CLIENT2_ID,
      invoiceId: "inv-2026-003",
      amountCents: BigInt(420000),
      status: PaymentStatus.FAILED,
      provider: "stripe",
      transactionRef: "ch_3Oy0987654321efgh",
    },
    {
      id: "pay-2026-003",
      clientId: CLIENT3_ID,
      invoiceId: "inv-2026-004",
      amountCents: BigInt(1600000), // $16,000 partial
      status: PaymentStatus.COMPLETED,
      provider: "bank_transfer",
      transactionRef: "TRF-ENT-2026-04-001",
      paidAt: daysAgo(1),
    },
  ];

  for (const pay of payments) {
    await prisma.payment.upsert({
      where: { id: pay.id },
      update: {},
      create: pay,
    });
    console.log(`  ✓ Payment ${pay.id} — ${pay.status}`);
  }

  console.log("\n✅ Billing seed complete — 5 invoices, 3 payments");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
