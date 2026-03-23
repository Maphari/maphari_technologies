/**
 * test-email.ts
 *
 * End-to-end smoke test for the notification email pipeline.
 *
 * What it does:
 *   1. Inserts a test NotificationJob (channel=EMAIL) directly into the DB
 *   2. Calls processNextJob() to attempt delivery
 *   3. Logs the resulting job status (SENT / FAILED / QUEUED for retry)
 *   4. Cleans up the test job from the DB
 *   5. Disconnects Prisma
 *
 * Usage:
 *   DATABASE_URL=postgresql://... RESEND_API_KEY=re_... npx tsx scripts/test-email.ts
 *
 * Notes:
 *   - If RESEND_API_KEY is unset or set to the placeholder "re_replace_me",
 *     the email provider skips delivery in non-production environments and
 *     the job is marked SENT with { skipped: true }. This is intentional —
 *     it lets you verify the queue pipeline without real credentials.
 *   - Set NODE_ENV=production to test hard failure when credentials are absent.
 *   - The script removes the test job after verification to keep the DB clean.
 *     If you want to inspect the row, comment out the cleanup block at the bottom.
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { processNextJob } from "../src/lib/queue.js";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("── Notification email pipeline smoke test ───────────────────");

  // ── 1. Insert a test job ─────────────────────────────────────────────────
  const testId = randomUUID();
  const testEmail = process.env.TEST_RECIPIENT_EMAIL ?? "smoke-test@example.com";
  const now = new Date();

  await prisma.notificationJob.create({
    data: {
      id: testId,
      clientId: "smoke-test-client",
      channel: "EMAIL",
      recipient: testEmail,
      subject: "[Smoke Test] Notification pipeline verification",
      message: [
        "This is an automated smoke-test email sent by the Maphari notification pipeline.",
        "",
        "If you received this in a production environment, the pipeline is working correctly.",
        "You can safely ignore this message.",
      ].join("\n"),
      tab: "dashboard",
      metadata: { smokeTest: true },
      status: "QUEUED",
      attempts: 0,
      maxAttempts: 3,
      nextAttemptAt: now,
      idempotencyKey: `smoke-test-${testId}`,
    },
  });

  console.log(`[1/3] Inserted test job  id=${testId}  to=${testEmail}`);

  // ── 2. Process the job ───────────────────────────────────────────────────
  const result = await processNextJob();

  if (!result) {
    console.error("[2/3] processNextJob() returned null — no ready job found.");
    console.error("      Check that nextAttemptAt <= NOW() and status = QUEUED.");
  } else {
    console.log(`[2/3] processNextJob() returned:`);
    console.log(`        status        : ${result.status}`);
    console.log(`        attempts      : ${result.attempts}`);
    console.log(`        failureReason : ${result.failureReason ?? "(none)"}`);

    if (result.status === "SENT") {
      console.log("\n✓ Pipeline OK — job delivered (or skipped in dev mode).");
    } else if (result.status === "QUEUED") {
      console.log("\n⚠ Job re-queued for retry (provider returned transient error).");
      console.log("  failureReason:", result.failureReason);
    } else {
      console.log("\n✗ Job FAILED — check failureReason above.");
      process.exitCode = 1;
    }
  }

  // ── 3. Cleanup ───────────────────────────────────────────────────────────
  await prisma.notificationDeadLetter.deleteMany({ where: { jobId: testId } });
  await prisma.notificationJob.deleteMany({ where: { id: testId } });
  console.log("[3/3] Test job cleaned up from DB.");
}

main()
  .catch((err) => {
    console.error("Unhandled error:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
