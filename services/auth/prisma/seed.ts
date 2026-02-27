import { PrismaClient } from "../src/generated/prisma/index.js";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

// ─── Shared identity constants (match across all service seeds) ───────────────
const ADMIN_USER_ID    = "a0000000-0000-0000-0000-000000000001";
const STAFF_SARAH_ID   = "a0000000-0000-0000-0000-000000000002";
const STAFF_TOM_ID     = "a0000000-0000-0000-0000-000000000003";
const CLIENT_ALICE_ID  = "a0000000-0000-0000-0000-000000000004";
const CLIENT_BOB_ID    = "a0000000-0000-0000-0000-000000000005";
const CLIENT_CAROL_ID  = "a0000000-0000-0000-0000-000000000006";

const CLIENT1_ID = "c1000000-0000-0000-0000-000000000001"; // TechStart Ltd
const CLIENT2_ID = "c1000000-0000-0000-0000-000000000002"; // GrowthCo Agency
const CLIENT3_ID = "c1000000-0000-0000-0000-000000000003"; // Enterprise Systems

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

const DEV_PASSWORD = "Maphari2026!";

async function main() {
  console.log("🌱 Seeding auth database…");

  const users = [
    {
      id: ADMIN_USER_ID,
      email: "admin@maphari.io",
      role: "ADMIN",
      clientId: null,
    },
    {
      id: STAFF_SARAH_ID,
      email: "sarah@maphari.io",
      role: "STAFF",
      clientId: null,
    },
    {
      id: STAFF_TOM_ID,
      email: "tom@maphari.io",
      role: "STAFF",
      clientId: null,
    },
    {
      id: CLIENT_ALICE_ID,
      email: "alice@techstart.io",
      role: "CLIENT",
      clientId: CLIENT1_ID,
    },
    {
      id: CLIENT_BOB_ID,
      email: "bob@growthco.io",
      role: "CLIENT",
      clientId: CLIENT2_ID,
    },
    {
      id: CLIENT_CAROL_ID,
      email: "carol@enterprise.io",
      role: "CLIENT",
      clientId: CLIENT3_ID,
    },
  ];

  for (const user of users) {
    const { hash, salt } = hashPassword(DEV_PASSWORD);
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
        isActive: true,
        passwordHash: hash,
        passwordSalt: salt,
      },
    });
    console.log(`  ✓ User ${user.email} (${user.role})`);
  }

  console.log("✅ Auth seed complete — 6 users created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
