import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

// ─── Shared client constants (match across all service seeds) ─────────────────
const CLIENT1_ID = "c1000000-0000-0000-0000-000000000001"; // TechStart Ltd
const CLIENT2_ID = "c1000000-0000-0000-0000-000000000002"; // GrowthCo Agency
const CLIENT3_ID = "c1000000-0000-0000-0000-000000000003"; // Enterprise Systems

const CLIENT_ALICE_ID = "a0000000-0000-0000-0000-000000000004";
const CLIENT_BOB_ID   = "a0000000-0000-0000-0000-000000000005";
const CLIENT_CAROL_ID = "a0000000-0000-0000-0000-000000000006";

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
const minsAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);

async function main() {
  console.log("🌱 Seeding notifications database…");

  const jobs = [
    // SENT — milestone approved notification to TechStart
    {
      id: "nj000000-0000-0000-0000-000000000001",
      clientId: CLIENT1_ID,
      channel: "EMAIL",
      recipient: "alice@techstart.io",
      subject: "Milestone Approved: Discovery & Audit",
      message: "Great news — your Discovery & Audit milestone has been approved. The project is progressing to the Design phase.",
      tab: "deliverables",
      status: "SENT",
      attempts: 1,
      idempotencyKey: "milestone-approved-e1000000-m1p1",
      createdAt: daysAgo(30),
      nextAttemptAt: daysAgo(30),
      lastAttemptAt: daysAgo(30),
    },
    // SENT — invoice issued notification to GrowthCo
    {
      id: "nj000000-0000-0000-0000-000000000002",
      clientId: CLIENT2_ID,
      channel: "EMAIL",
      recipient: "accounts@growthco.io",
      subject: "Invoice Issued: INV-2026-003",
      message: "Invoice INV-2026-003 for $4,200 has been issued and is due within 30 days.",
      tab: "billing",
      status: "SENT",
      attempts: 1,
      idempotencyKey: "invoice-issued-inv-2026-003",
      createdAt: daysAgo(40),
      nextAttemptAt: daysAgo(40),
      lastAttemptAt: daysAgo(40),
    },
    // FAILED — email delivery failure for Enterprise (contributes to failedNotifications count)
    {
      id: "nj000000-0000-0000-0000-000000000003",
      clientId: CLIENT3_ID,
      channel: "EMAIL",
      recipient: "carol@enterprise-sys.io",
      subject: "Action Required: ERP Blocker Update",
      message: "A CRITICAL blocker has been raised on your ERP Integration project. Immediate attention is needed.",
      tab: "deliverables",
      status: "FAILED",
      failureReason: "SMTP delivery failed — recipient server returned 550 Mailbox unavailable.",
      attempts: 3,
      idempotencyKey: "blocker-critical-g1000000-001",
      createdAt: daysAgo(5),
      nextAttemptAt: daysAgo(5),
      lastAttemptAt: daysAgo(5),
    },
    // FAILED — second failure for Enterprise (admin inbox shows count > 1)
    {
      id: "nj000000-0000-0000-0000-000000000004",
      clientId: CLIENT3_ID,
      channel: "EMAIL",
      recipient: "derek@enterprise-sys.io",
      subject: "Contract Renewal Reminder",
      message: "Your contract with Maphari is due for renewal in 14 days. Please contact us to discuss terms.",
      tab: "dashboard",
      status: "FAILED",
      failureReason: "SMTP delivery failed — connection timeout after 3 attempts.",
      attempts: 3,
      idempotencyKey: "contract-renewal-client3-2026-02",
      createdAt: daysAgo(3),
      nextAttemptAt: daysAgo(3),
      lastAttemptAt: daysAgo(3),
    },
    // QUEUED — pending new message notification for TechStart
    {
      id: "nj000000-0000-0000-0000-000000000005",
      clientId: CLIENT1_ID,
      channel: "EMAIL",
      recipient: "alice@techstart.io",
      subject: "New message from your project team",
      message: "You have a new message on the Website Redesign thread. Log in to reply.",
      tab: "clients",
      status: "QUEUED",
      attempts: 0,
      idempotencyKey: "new-message-conv1-msg3",
      createdAt: minsAgo(15),
      nextAttemptAt: minsAgo(15),
    },
    // SENT + READ — GrowthCo thread notification that client has already read
    {
      id: "nj000000-0000-0000-0000-000000000006",
      clientId: CLIENT2_ID,
      channel: "IN_APP",
      recipient: CLIENT_BOB_ID,
      subject: "Brand Overhaul — thread resolved",
      message: "Your Brand Overhaul conversation has been resolved. All brand assets have been delivered.",
      tab: "clients",
      status: "SENT",
      attempts: 1,
      readAt: daysAgo(5),
      readByUserId: CLIENT_BOB_ID,
      readByRole: "CLIENT",
      idempotencyKey: "thread-resolved-conv3-bob",
      createdAt: daysAgo(6),
      nextAttemptAt: daysAgo(6),
      lastAttemptAt: daysAgo(6),
    },
  ];

  for (const job of jobs) {
    await prisma.notificationJob.upsert({
      where: { id: job.id },
      update: {},
      create: job,
    });
    console.log(`  ✓ NotificationJob ${job.id.slice(-4)} — ${job.status} (${job.channel})`);
  }

  console.log("\n✅ Notifications seed complete — 6 notification jobs");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
