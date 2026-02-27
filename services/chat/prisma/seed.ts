import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

// ─── Shared constants (match across all service seeds) ────────────────────────
const CLIENT1_ID = "c1000000-0000-0000-0000-000000000001"; // TechStart Ltd
const CLIENT2_ID = "c1000000-0000-0000-0000-000000000002"; // GrowthCo Agency
const CLIENT3_ID = "c1000000-0000-0000-0000-000000000003"; // Enterprise Systems

const STAFF_SARAH_ID = "a0000000-0000-0000-0000-000000000002";
const STAFF_TOM_ID   = "a0000000-0000-0000-0000-000000000003";

const PROJECT1_ID = "d1000000-0000-0000-0000-000000000001";
const PROJECT2_ID = "d1000000-0000-0000-0000-000000000002";
const PROJECT3_ID = "d1000000-0000-0000-0000-000000000003";
const PROJECT5_ID = "d1000000-0000-0000-0000-000000000005";

const CONV1_ID = "a1000000-0000-0000-0000-000000000001";
const CONV2_ID = "a1000000-0000-0000-0000-000000000002";
const CONV3_ID = "a1000000-0000-0000-0000-000000000003";
const CONV4_ID = "a1000000-0000-0000-0000-000000000004";

const now = new Date();
const minsAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

async function main() {
  console.log("🌱 Seeding chat database…");

  // ── Conversations ────────────────────────────────────────────────────────────
  const conversations = [
    {
      id: CONV1_ID,
      clientId: CLIENT1_ID,
      assigneeUserId: STAFF_SARAH_ID,
      subject: "Website launch scope and timeline",
      projectId: PROJECT1_ID,
      status: "OPEN",
    },
    {
      id: CONV2_ID,
      clientId: CLIENT1_ID,
      assigneeUserId: STAFF_TOM_ID,
      subject: "Mobile app API design discussion",
      projectId: PROJECT2_ID,
      status: "OPEN",
    },
    {
      id: CONV3_ID,
      clientId: CLIENT2_ID,
      assigneeUserId: STAFF_TOM_ID,
      subject: "Brand guidelines review",
      projectId: PROJECT3_ID,
      status: "RESOLVED",
    },
    {
      id: CONV4_ID,
      clientId: CLIENT3_ID,
      assigneeUserId: STAFF_SARAH_ID,
      subject: "ERP integration blocker escalation",
      projectId: PROJECT5_ID,
      status: "OPEN",
    },
  ];

  for (const conv of conversations) {
    await prisma.conversation.upsert({
      where: { id: conv.id },
      update: {},
      create: conv,
    });
    console.log(`  ✓ Conversation "${conv.subject}" — ${conv.status}`);
  }

  // ── Messages ──────────────────────────────────────────────────────────────────
  type Msg = {
    conversationId: string;
    clientId: string;
    authorId: string;
    authorRole: string;
    content: string;
    deliveryStatus: string;
    deliveredAt?: Date;
    readAt?: Date;
    createdAt: Date;
  };

  const messages: Msg[] = [
    // Conversation 1 — Website Redesign
    {
      conversationId: CONV1_ID, clientId: CLIENT1_ID,
      authorId: "alice@techstart.io", authorRole: "CLIENT",
      content: "Hi Sarah — can we confirm the go-live date is still on track for next month?",
      deliveryStatus: "READ", deliveredAt: daysAgo(3), readAt: daysAgo(3),
      createdAt: daysAgo(3),
    },
    {
      conversationId: CONV1_ID, clientId: CLIENT1_ID,
      authorId: STAFF_SARAH_ID, authorRole: "STAFF",
      content: "Hi Alice — yes, we're on track. Design handoff is scheduled for next Friday. I'll send the staging link once it's ready.",
      deliveryStatus: "READ", deliveredAt: daysAgo(3), readAt: daysAgo(2),
      createdAt: new Date(daysAgo(3).getTime() + 30 * 60 * 1000),
    },
    {
      conversationId: CONV1_ID, clientId: CLIENT1_ID,
      authorId: "alice@techstart.io", authorRole: "CLIENT",
      content: "Great — also, can we add a live chat widget to the homepage? Is that in scope?",
      deliveryStatus: "DELIVERED", deliveredAt: minsAgo(45),
      createdAt: minsAgo(45),
    },

    // Conversation 2 — Mobile App
    {
      conversationId: CONV2_ID, clientId: CLIENT1_ID,
      authorId: "james@techstart.io", authorRole: "CLIENT",
      content: "Tom, we need the authentication flow to support both email/password and Google SSO. Can you confirm this is included?",
      deliveryStatus: "READ", deliveredAt: daysAgo(5), readAt: daysAgo(5),
      createdAt: daysAgo(5),
    },
    {
      conversationId: CONV2_ID, clientId: CLIENT1_ID,
      authorId: STAFF_TOM_ID, authorRole: "STAFF",
      content: "Yes — both email/password and Google OAuth are in the MVP scope. I'll include the auth flow diagrams in the spec doc.",
      deliveryStatus: "READ", deliveredAt: daysAgo(5), readAt: daysAgo(4),
      createdAt: new Date(daysAgo(5).getTime() + 60 * 60 * 1000),
    },
    {
      conversationId: CONV2_ID, clientId: CLIENT1_ID,
      authorId: "james@techstart.io", authorRole: "CLIENT",
      content: "Perfect. One more thing — can we also support biometric login on mobile?",
      deliveryStatus: "SENT",
      createdAt: minsAgo(120),
    },

    // Conversation 3 — Brand Overhaul (RESOLVED)
    {
      conversationId: CONV3_ID, clientId: CLIENT2_ID,
      authorId: "bob@growthco.io", authorRole: "CLIENT",
      content: "Tom, we love the direction on the new logo! Ready to approve the primary variant.",
      deliveryStatus: "READ", deliveredAt: daysAgo(8), readAt: daysAgo(8),
      createdAt: daysAgo(8),
    },
    {
      conversationId: CONV3_ID, clientId: CLIENT2_ID,
      authorId: STAFF_TOM_ID, authorRole: "STAFF",
      content: "Brilliant — I'll prepare the final asset package in all required formats. You'll receive it by EOD Thursday.",
      deliveryStatus: "READ", deliveredAt: daysAgo(8), readAt: daysAgo(7),
      createdAt: new Date(daysAgo(8).getTime() + 2 * 60 * 60 * 1000),
    },
    {
      conversationId: CONV3_ID, clientId: CLIENT2_ID,
      authorId: STAFF_TOM_ID, authorRole: "STAFF",
      content: "Final brand assets delivered and uploaded to the shared folder. Thread resolved — please reopen if you need anything.",
      deliveryStatus: "READ", deliveredAt: daysAgo(6), readAt: daysAgo(6),
      createdAt: daysAgo(6),
    },

    // Conversation 4 — ERP Escalation
    {
      conversationId: CONV4_ID, clientId: CLIENT3_ID,
      authorId: "carol@enterprise-sys.io", authorRole: "CLIENT",
      content: "Sarah, this is the third week the vendor hasn't provided the API credentials. This is unacceptable — we're burning retainer time.",
      deliveryStatus: "READ", deliveredAt: daysAgo(2), readAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
    {
      conversationId: CONV4_ID, clientId: CLIENT3_ID,
      authorId: STAFF_SARAH_ID, authorRole: "STAFF",
      content: "Hi Carol — I completely understand your frustration. I've escalated this internally and we're working directly with the vendor's account manager. I'll have a concrete update by Wednesday.",
      deliveryStatus: "READ", deliveredAt: daysAgo(2), readAt: daysAgo(1),
      createdAt: new Date(daysAgo(2).getTime() + 90 * 60 * 1000),
    },
    {
      conversationId: CONV4_ID, clientId: CLIENT3_ID,
      authorId: "carol@enterprise-sys.io", authorRole: "CLIENT",
      content: "Wednesday is fine. But if this isn't resolved by end of week, I'll need to escalate this to our board.",
      deliveryStatus: "DELIVERED", deliveredAt: minsAgo(30),
      createdAt: minsAgo(30),
    },
  ];

  for (const msg of messages) {
    await prisma.message.create({ data: msg });
  }
  console.log(`  ✓ Messages (${messages.length} across 4 conversations)`);

  console.log("\n✅ Chat seed complete — 4 conversations, 12 messages");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
