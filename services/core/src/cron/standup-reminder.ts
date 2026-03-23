// ════════════════════════════════════════════════════════════════════════════
// standup-reminder.ts — Daily standup reminder + digest crons
// Reminder : 09:00 Mon–Fri
// Digest   : 10:00 Mon–Fri (who submitted, who hasn't)
// ════════════════════════════════════════════════════════════════════════════
import cron from "node-cron";
import { prisma } from "../lib/prisma.js";

export function scheduleStandupReminder(): void {
  // 09:00 Mon–Fri: log reminder (future: push to notification queue)
  cron.schedule("0 9 * * 1-5", async () => {
    const today = new Date().toISOString().split("T")[0]!;
    const activeStaff = await prisma.staffProfile.findMany({
      where: { isActive: true },
      select: { id: true, name: true, userId: true },
    });
    console.log(
      `[standup-cron] 09:00 reminder — ${activeStaff.length} active staff members. ` +
      `Date: ${today}. Reminder logged (wire to notification queue for push delivery).`
    );
    // TODO Wave 3: emit to notification queue per staff member
  });
}

export function scheduleStandupDigest(): void {
  // 10:00 Mon–Fri: generate digest of who submitted, who missed
  cron.schedule("0 10 * * 1-5", async () => {
    try {
      const today = new Date().toISOString().split("T")[0]!;
      const startOfDay = new Date(today + "T00:00:00.000Z");
      const endOfDay   = new Date(today + "T23:59:59.999Z");

      const [submitted, activeStaff] = await Promise.all([
        prisma.standupEntry.findMany({
          where: { date: { gte: startOfDay, lte: endOfDay } },
          select: { staffId: true },
        }),
        prisma.staffProfile.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        }),
      ]);

      const submittedIds = new Set(submitted.map((s) => s.staffId));
      const missing = activeStaff.filter((s) => !submittedIds.has(s.id));

      console.log(
        `[standup-cron] 10:00 digest for ${today}: ` +
        `${submitted.length} submitted, ${missing.length} missing. ` +
        `Missing: ${missing.map((s) => s.name).join(", ") || "none"}`
      );
    } catch (err) {
      console.error("[standup-cron] Digest generation failed:", err);
    }
  });
}
