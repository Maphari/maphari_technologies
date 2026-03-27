import type { NotificationJob as PrismaNotificationJob, Prisma } from "@prisma/client";
import type { CreateNotificationJobInput } from "@maphari/contracts";
import { createHash, randomUUID } from "node:crypto";
import { prisma } from "./prisma.js";
import { sendEmail } from "./providers/email.js";
import { sendSms } from "./providers/sms.js";
import { sendPush } from "./providers/push.js";

export interface NotificationJob {
  id: string;
  clientId: string;
  channel: "EMAIL" | "SMS" | "PUSH";
  recipient: string;
  subject: string | null;
  message: string;
  tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
  metadata: Record<string, string | number | boolean>;
  status: "QUEUED" | "SENT" | "FAILED";
  failureReason: string | null;
  attempts: number;
  maxAttempts: number;
  readAt: string | null;
  readByUserId: string | null;
  readByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  snoozedUntil: string | null;
  archivedAt: string | null;
  archivedByUserId: string | null;
  archivedByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  createdAt: string;
  updatedAt: string;
}

type QueueActor = { userId?: string; role?: "ADMIN" | "STAFF" | "CLIENT" };

function toRecord(value: Prisma.JsonValue | null): Record<string, string | number | boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const candidate = value as Record<string, unknown>;
  const result: Record<string, string | number | boolean> = {};
  Object.entries(candidate).forEach(([key, inner]) => {
    if (typeof inner === "string" || typeof inner === "number" || typeof inner === "boolean") {
      result[key] = inner;
    }
  });
  return result;
}

function mapJob(job: PrismaNotificationJob): NotificationJob {
  return {
    id: job.id,
    clientId: job.clientId,
    channel: job.channel as NotificationJob["channel"],
    recipient: job.recipient,
    subject: job.subject,
    message: job.message,
    tab: job.tab as NotificationJob["tab"],
    metadata: toRecord(job.metadata),
    status: job.status as NotificationJob["status"],
    failureReason: job.failureReason,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    readAt: job.readAt ? job.readAt.toISOString() : null,
    readByUserId: job.readByUserId,
    readByRole: (job.readByRole as NotificationJob["readByRole"]) ?? null,
    snoozedUntil: job.snoozedUntil ? job.snoozedUntil.toISOString() : null,
    archivedAt: job.archivedAt ? job.archivedAt.toISOString() : null,
    archivedByUserId: job.archivedByUserId,
    archivedByRole: (job.archivedByRole as NotificationJob["archivedByRole"]) ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString()
  };
}

function makeIdempotencyKey(input: CreateNotificationJobInput & { clientId: string }, requestId?: string): string {
  const eventId = typeof input.metadata?.eventId === "string" ? input.metadata.eventId : "";
  const basis = [
    requestId ?? "",
    eventId,
    input.clientId,
    input.channel,
    input.recipient,
    input.subject ?? "",
    input.message,
    input.tab ?? "dashboard"
  ].join("|");
  return createHash("sha256").update(basis).digest("hex");
}

function asMetadata(input: Record<string, string | number | boolean> | undefined): Prisma.InputJsonValue {
  return input ?? {};
}

async function toDeadLetter(job: PrismaNotificationJob, reason: string): Promise<void> {
  await prisma.notificationDeadLetter.upsert({
    where: { jobId: job.id },
    create: {
      id: randomUUID(),
      jobId: job.id,
      reason,
      payload: {
        id: job.id,
        clientId: job.clientId,
        channel: job.channel,
        recipient: job.recipient,
        subject: job.subject,
        message: job.message,
        metadata: job.metadata,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts
      }
    },
    update: {
      reason,
      payload: {
        id: job.id,
        clientId: job.clientId,
        channel: job.channel,
        recipient: job.recipient,
        subject: job.subject,
        message: job.message,
        metadata: job.metadata,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts
      }
    }
  });
}

export async function enqueueJob(
  input: CreateNotificationJobInput & { clientId: string },
  options: { requestId?: string } = {}
): Promise<NotificationJob> {
  const now = new Date();
  const idempotencyKey = makeIdempotencyKey(input, options.requestId);
  const existing = await prisma.notificationJob.findUnique({ where: { idempotencyKey } });
  if (existing) return mapJob(existing);

  const created = await prisma.notificationJob.create({
    data: {
      id: randomUUID(),
      clientId: input.clientId,
      channel: input.channel,
      recipient: input.recipient,
      subject: input.subject ?? null,
      message: input.message,
      tab: input.tab ?? "dashboard",
      metadata: asMetadata(input.metadata),
      status: "QUEUED",
      failureReason: null,
      attempts: 0,
      maxAttempts: 3,
      readAt: null,
      readByUserId: null,
      readByRole: null,
      snoozedUntil: null,
      archivedAt: null,
      archivedByUserId: null,
      archivedByRole: null,
      nextAttemptAt: now,
      idempotencyKey
    }
  });

  return mapJob(created);
}

export async function listJobs(
  clientId?: string,
  options: { unreadOnly?: boolean; tab?: NotificationJob["tab"] } = {}
): Promise<NotificationJob[]> {
  const rows = await prisma.notificationJob.findMany({
    where: {
      clientId: clientId ?? undefined,
      readAt: options.unreadOnly ? null : undefined,
      tab: options.tab ?? undefined,
      archivedAt: null
    },
    orderBy: { createdAt: "desc" }
  });
  return rows.map(mapJob);
}

export async function processNextJob(): Promise<NotificationJob | null> {
  const now = new Date();
  const queuedJob = await prisma.notificationJob.findFirst({
    where: {
      status: "QUEUED",
      nextAttemptAt: { lte: now }
    },
    orderBy: { createdAt: "asc" }
  });
  if (!queuedJob) return null;

  const nextAttempts = queuedJob.attempts + 1;
  const updatedBase = await prisma.notificationJob.update({
    where: { id: queuedJob.id },
    data: {
      attempts: { increment: 1 },
      lastAttemptAt: now
    }
  });

  if (updatedBase.recipient.includes("fail") && !updatedBase.recipient.includes("hard-fail") && nextAttempts < updatedBase.maxAttempts) {
    const retryDelayMs = Math.min(60_000, 5_000 * nextAttempts);
    const queued = await prisma.notificationJob.update({
      where: { id: updatedBase.id },
      data: {
        failureReason: "Provider temporary failure",
        nextAttemptAt: new Date(now.getTime() + retryDelayMs)
      }
    });
    return mapJob(queued);
  }

  if (updatedBase.recipient.includes("hard-fail") || nextAttempts >= updatedBase.maxAttempts) {
    const failedReason = updatedBase.recipient.includes("hard-fail")
      ? "Provider rejected recipient"
      : "Exceeded max retry attempts";

    const failed = await prisma.notificationJob.update({
      where: { id: updatedBase.id },
      data: {
        status: "FAILED",
        failureReason: failedReason,
        deadLetteredAt: now
      }
    });
    await toDeadLetter(failed, failedReason);
    return mapJob(failed);
  }

  // ── Dispatch to real provider ──────────────────────────────────────────
  let deliveryResult: { success: boolean; error?: string; skipped?: boolean };

  if (updatedBase.channel === "EMAIL") {
    deliveryResult = await sendEmail({
      to: updatedBase.recipient,
      subject: updatedBase.subject ?? "Maphari notification",
      text: updatedBase.message
    });
  } else if (updatedBase.channel === "SMS") {
    // recipient may be a plain phone number "+27821234567"
    // or WhatsApp-prefixed "whatsapp:+27821234567"
    deliveryResult = await sendSms({
      to: updatedBase.recipient,
      body: updatedBase.message
    });
  } else {
    // Portal-only jobs should appear in-app without requiring a device token.
    if (updatedBase.recipient.startsWith("portal:")) {
      deliveryResult = { success: true, skipped: true };
    } else {
      // PUSH — FCM via push provider (skips gracefully if FCM_SERVER_KEY not set)
      const pushTitle = updatedBase.subject ?? "Maphari";
      const pushData: Record<string, string> = {
        tab: updatedBase.tab,
        jobId: updatedBase.id,
        clientId: updatedBase.clientId,
      };
      deliveryResult = await sendPush(updatedBase.recipient, pushTitle, updatedBase.message, pushData);
    }
  }

  if (!deliveryResult.success) {
    if (nextAttempts < updatedBase.maxAttempts) {
      const retryDelayMs = Math.min(60_000, 5_000 * nextAttempts);
      const queued = await prisma.notificationJob.update({
        where: { id: updatedBase.id },
        data: {
          failureReason: deliveryResult.error ?? "Provider error",
          nextAttemptAt: new Date(now.getTime() + retryDelayMs)
        }
      });
      return mapJob(queued);
    }

    const failedReason = deliveryResult.error ?? "Exceeded max retry attempts";
    const failed = await prisma.notificationJob.update({
      where: { id: updatedBase.id },
      data: {
        status: "FAILED",
        failureReason: failedReason,
        deadLetteredAt: now
      }
    });
    await toDeadLetter(failed, failedReason);
    return mapJob(failed);
  }

  const sent = await prisma.notificationJob.update({
    where: { id: updatedBase.id },
    data: {
      status: "SENT",
      failureReason: null,
      nextAttemptAt: now
    }
  });
  return mapJob(sent);
}

export async function applyProviderCallback(
  externalId: string,
  status: "queued" | "sent" | "delivered" | "failed",
  reason?: string
): Promise<NotificationJob | null> {
  const existing = await prisma.notificationJob.findUnique({ where: { id: externalId } });
  if (!existing) return null;

  const now = new Date();
  const nextStatus = status === "failed" ? "FAILED" : status === "queued" ? "QUEUED" : "SENT";
  const updated = await prisma.notificationJob.update({
    where: { id: externalId },
    data: {
      status: nextStatus,
      failureReason: reason ?? null,
      deadLetteredAt: nextStatus === "FAILED" ? now : null,
      nextAttemptAt: nextStatus === "QUEUED" ? now : undefined
    }
  });

  if (nextStatus === "FAILED") {
    await toDeadLetter(updated, reason ?? "Provider callback failure");
  }

  return mapJob(updated);
}

export async function markAllJobsRead(
  clientId: string | undefined,
  actor?: QueueActor
): Promise<{ count: number }> {
  const now = new Date();
  const result = await prisma.notificationJob.updateMany({
    where: {
      clientId: clientId ?? undefined,
      readAt: null,
      archivedAt: null,
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }]
    },
    data: {
      readAt: now,
      readByUserId: actor?.userId ?? null,
      readByRole: actor?.role ?? null,
    },
  });
  return { count: result.count };
}

export async function setNotificationReadState(
  id: string,
  read: boolean,
  actor?: QueueActor
): Promise<NotificationJob | null> {
  const existing = await prisma.notificationJob.findUnique({ where: { id } });
  if (!existing) return null;
  const now = new Date();
  const updated = await prisma.notificationJob.update({
    where: { id },
    data: {
      readAt: read ? now : null,
      readByUserId: read ? actor?.userId ?? null : null,
      readByRole: read ? actor?.role ?? null : null
    }
  });
  return mapJob(updated);
}

export async function unreadCounts(clientId?: string): Promise<{ total: number; byTab: Record<NotificationJob["tab"], number> }> {
  const now = new Date();
  const rows = await prisma.notificationJob.findMany({
    where: {
      clientId: clientId ?? undefined,
      readAt: null,
      archivedAt: null,
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }]
    },
    select: { tab: true }
  });
  const byTab: Record<NotificationJob["tab"], number> = {
    dashboard: 0,
    projects: 0,
    invoices: 0,
    messages: 0,
    settings: 0,
    operations: 0
  };
  rows.forEach((row) => {
    const tab = row.tab as NotificationJob["tab"];
    if (tab in byTab) byTab[tab] += 1;
  });
  return { total: rows.length, byTab };
}

export async function setNotificationArchiveState(
  id: string,
  archived: boolean,
  actor?: QueueActor
): Promise<NotificationJob | null> {
  const existing = await prisma.notificationJob.findUnique({ where: { id } });
  if (!existing) return null;
  const now = new Date();
  const updated = await prisma.notificationJob.update({
    where: { id },
    data: archived
      ? {
          archivedAt: now,
          archivedByUserId: actor?.userId ?? null,
          archivedByRole: actor?.role ?? null
        }
      : {
          archivedAt: null,
          archivedByUserId: null,
          archivedByRole: null
        }
  });
  return mapJob(updated);
}

export async function archiveAllJobs(
  clientId: string | undefined,
  actor?: QueueActor
): Promise<{ count: number }> {
  const now = new Date();
  const result = await prisma.notificationJob.updateMany({
    where: {
      clientId: clientId ?? undefined,
      archivedAt: null
    },
    data: {
      archivedAt: now,
      archivedByUserId: actor?.userId ?? null,
      archivedByRole: actor?.role ?? null
    }
  });
  return { count: result.count };
}

export async function setNotificationSnoozeState(
  id: string,
  snoozedUntil: string | null
): Promise<NotificationJob | null> {
  const existing = await prisma.notificationJob.findUnique({ where: { id } });
  if (!existing) return null;
  const updated = await prisma.notificationJob.update({
    where: { id },
    data: {
      snoozedUntil: snoozedUntil ? new Date(snoozedUntil) : null
    }
  });
  return mapJob(updated);
}

export async function restoreSnoozedJobs(clientId?: string): Promise<{ count: number }> {
  const now = new Date();
  const result = await prisma.notificationJob.updateMany({
    where: {
      clientId: clientId ?? undefined,
      archivedAt: null,
      snoozedUntil: { gt: now }
    },
    data: {
      snoozedUntil: null
    }
  });
  return { count: result.count };
}

export async function clearNotificationQueue(): Promise<void> {
  await prisma.notificationDeadLetter.deleteMany({});
  await prisma.notificationJob.deleteMany({});
}
