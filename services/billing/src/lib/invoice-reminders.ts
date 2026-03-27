import { Prisma } from "../generated/prisma/index.js";
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma.js";

export type ReminderChannel = "email" | "sms" | "portal";

export interface InvoiceReminderPreferenceRecord {
  id: string;
  clientId: string;
  enabled: boolean;
  intervalDays: number;
  channels: ReminderChannel[];
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ReminderPreferenceRow {
  id: string;
  clientId: string;
  enabled: boolean;
  intervalDays: number;
  channels: string[];
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientContactRecord {
  name: string;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
}

interface ClientDetailRecord {
  id: string;
  name: string;
  ownerName: string | null;
  billingEmail: string | null;
  contacts: ClientContactRecord[];
}

interface NotificationJobRequest {
  clientId: string;
  channel: "EMAIL" | "SMS" | "PUSH";
  recipient: string;
  subject: string;
  message: string;
  metadata: Record<string, string | number | boolean>;
  tab: "invoices";
}

type LoggerLike = {
  info(payload: Record<string, unknown>, message: string): void;
  error(payload: Record<string, unknown>, message: string): void;
};

function mapPreferenceRow(row: ReminderPreferenceRow): InvoiceReminderPreferenceRecord {
  return {
    ...row,
    channels: row.channels.filter((value): value is ReminderChannel => value === "email" || value === "sms" || value === "portal")
  };
}

function notificationsServiceUrl(): string {
  return process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:4009";
}

function coreServiceUrl(): string {
  return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (trimmed.length < 7) return null;
  if (trimmed.startsWith("+")) return trimmed;
  return trimmed.replace(/\s+/g, "");
}

function pickPrimaryContact(client: ClientDetailRecord): ClientContactRecord | null {
  return client.contacts.find((contact) => contact.isPrimary) ?? client.contacts[0] ?? null;
}

function buildReminderSubject(invoiceNumber: string): string {
  return "Payment reminder for invoice " + invoiceNumber;
}

function buildReminderMessage(input: {
  clientName: string;
  invoiceNumber: string;
  amountCents: bigint;
  currency: string;
  dueAt: Date | null;
  note?: string | null;
  triggerLabel: string;
}): string {
  const amount = Number(input.amountCents) / 100;
  const due = input.dueAt ? input.dueAt.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "soon";
  const lines = [
    "Hello " + input.clientName + ",",
    "",
    "This is your " + input.triggerLabel + " reminder for invoice " + input.invoiceNumber + ".",
    "Amount due: " + input.currency + " " + amount.toFixed(2),
    "Due date: " + due,
  ];
  if (input.note && input.note.trim().length > 0) {
    lines.push("", "Note: " + input.note.trim());
  }
  lines.push("", "Please log in to the client portal if you need to review or pay this invoice.");
  return lines.join("\n");
}

async function fetchClientDetail(clientId: string): Promise<ClientDetailRecord | null> {
  const response = await fetch(coreServiceUrl() + "/clients/" + clientId, {
    headers: {
      "x-user-role": "ADMIN",
      "x-request-id": randomUUID()
    }
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { success?: boolean; data?: ClientDetailRecord };
  return payload.success ? payload.data ?? null : null;
}

async function enqueueNotificationJob(job: NotificationJobRequest, requestId?: string): Promise<void> {
  const response = await fetch(notificationsServiceUrl() + "/notifications/jobs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-role": "ADMIN",
      "x-request-id": requestId ?? randomUUID()
    },
    body: JSON.stringify(job)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error("Notification enqueue failed (" + response.status + "): " + text);
  }
}

async function claimDispatch(dispatchKey: string, clientId: string, invoiceId: string, channel: ReminderChannel, triggerType: string, triggeredForAt: Date): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "invoice_reminder_dispatches" (
      "id",
      "dispatchKey",
      "clientId",
      "invoiceId",
      "channel",
      "triggerType",
      "triggeredForAt"
    )
    VALUES (
      ${randomUUID()},
      ${dispatchKey},
      ${clientId},
      ${invoiceId},
      ${channel},
      ${triggerType},
      ${triggeredForAt}
    )
    ON CONFLICT ("dispatchKey") DO NOTHING
    RETURNING "id"
  `;
  return rows.length > 0;
}

export async function getInvoiceReminderPreference(clientId: string): Promise<InvoiceReminderPreferenceRecord | null> {
  const rows = await prisma.$queryRaw<ReminderPreferenceRow[]>`
    SELECT
      "id",
      "clientId",
      "enabled",
      "intervalDays",
      "channels",
      "note",
      "createdAt",
      "updatedAt"
    FROM "invoice_reminder_preferences"
    WHERE "clientId" = ${clientId}
    LIMIT 1
  `;
  return rows[0] ? mapPreferenceRow(rows[0]) : null;
}

export async function upsertInvoiceReminderPreference(input: {
  clientId: string;
  enabled: boolean;
  intervalDays: number;
  channels: ReminderChannel[];
  note?: string | null;
}): Promise<InvoiceReminderPreferenceRecord> {
  const rows = await prisma.$queryRaw<ReminderPreferenceRow[]>`
    INSERT INTO "invoice_reminder_preferences" (
      "id",
      "clientId",
      "enabled",
      "intervalDays",
      "channels",
      "note",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${randomUUID()},
      ${input.clientId},
      ${input.enabled},
      ${input.intervalDays},
      ARRAY[${Prisma.join(input.channels)}]::text[],
      ${input.note?.trim() ? input.note.trim() : null},
      NOW(),
      NOW()
    )
    ON CONFLICT ("clientId") DO UPDATE SET
      "enabled" = EXCLUDED."enabled",
      "intervalDays" = EXCLUDED."intervalDays",
      "channels" = EXCLUDED."channels",
      "note" = EXCLUDED."note",
      "updatedAt" = NOW()
    RETURNING
      "id",
      "clientId",
      "enabled",
      "intervalDays",
      "channels",
      "note",
      "createdAt",
      "updatedAt"
  `;
  return mapPreferenceRow(rows[0] as ReminderPreferenceRow);
}

async function sendReminderForInvoice(input: {
  client: ClientDetailRecord;
  clientId: string;
  invoiceId: string;
  invoiceNumber: string;
  amountCents: bigint;
  currency: string;
  dueAt: Date | null;
  channels: ReminderChannel[];
  note?: string | null;
  triggerType: string;
  dedupeKeyPrefix?: string | null;
  requestId?: string;
}): Promise<number> {
  const primaryContact = pickPrimaryContact(input.client);
  const recipients: Record<ReminderChannel, string | null> = {
    email: input.client.billingEmail ?? primaryContact?.email ?? null,
    sms: normalizePhone(primaryContact?.phone ?? null),
    portal: "portal:" + input.clientId
  };

  let created = 0;
  const subject = buildReminderSubject(input.invoiceNumber);
  const triggerLabel = input.triggerType === "manual" ? "manual" : "scheduled";
  const message = buildReminderMessage({
    clientName: input.client.ownerName ?? input.client.name,
    invoiceNumber: input.invoiceNumber,
    amountCents: input.amountCents,
    currency: input.currency,
    dueAt: input.dueAt,
    note: input.note,
    triggerLabel
  });

  for (const channel of input.channels) {
    const recipient = recipients[channel];
    if (!recipient) continue;

    if (input.dedupeKeyPrefix) {
      const claimed = await claimDispatch(
        input.dedupeKeyPrefix + ":" + channel,
        input.clientId,
        input.invoiceId,
        channel,
        input.triggerType,
        input.dueAt ?? new Date()
      );
      if (!claimed) continue;
    }

    await enqueueNotificationJob(
      {
        clientId: input.clientId,
        channel: channel === "email" ? "EMAIL" : channel === "sms" ? "SMS" : "PUSH",
        recipient,
        subject,
        message,
        metadata: {
          invoiceId: input.invoiceId,
          invoiceNumber: input.invoiceNumber,
          triggerType: input.triggerType
        },
        tab: "invoices"
      },
      input.requestId
    );
    created += 1;
  }

  return created;
}

export async function sendInvoiceReminderNow(input: {
  clientId: string;
  invoiceIds: string[];
  channels: ReminderChannel[];
  note?: string | null;
  requestId?: string;
}): Promise<{ notificationsQueued: number; invoicesMatched: number }> {
  const client = await fetchClientDetail(input.clientId);
  if (!client) {
    throw new Error("Client detail could not be loaded for reminders.");
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      clientId: input.clientId,
      id: { in: input.invoiceIds },
      status: { in: ["ISSUED", "OVERDUE"] }
    },
    orderBy: { dueAt: "asc" }
  });

  let notificationsQueued = 0;
  for (const invoice of invoices) {
    notificationsQueued += await sendReminderForInvoice({
      client,
      clientId: input.clientId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      dueAt: invoice.dueAt,
      channels: input.channels,
      note: input.note,
      triggerType: "manual",
      requestId: input.requestId
    });
  }

  return { notificationsQueued, invoicesMatched: invoices.length };
}

function shouldTriggerScheduledReminder(invoiceDueAt: Date, intervalDays: number, now: Date): boolean {
  const triggerAt = new Date(invoiceDueAt.getTime() - intervalDays * 24 * 60 * 60 * 1000);
  if (intervalDays === 0) {
    return now >= invoiceDueAt && now < new Date(invoiceDueAt.getTime() + 24 * 60 * 60 * 1000);
  }
  return now >= triggerAt && now < invoiceDueAt;
}

export async function dispatchScheduledInvoiceReminders(logger: LoggerLike): Promise<void> {
  const preferences = await prisma.$queryRaw<ReminderPreferenceRow[]>`
    SELECT
      "id",
      "clientId",
      "enabled",
      "intervalDays",
      "channels",
      "note",
      "createdAt",
      "updatedAt"
    FROM "invoice_reminder_preferences"
    WHERE "enabled" = true
  `;

  if (preferences.length === 0) return;

  const now = new Date();

  for (const preferenceRow of preferences) {
    const preference = mapPreferenceRow(preferenceRow);
    const client = await fetchClientDetail(preference.clientId);
    if (!client) {
      logger.error({ clientId: preference.clientId }, "invoice reminder skipped: client detail unavailable");
      continue;
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        clientId: preference.clientId,
        status: { in: ["ISSUED", "OVERDUE"] },
        dueAt: { not: null }
      },
      orderBy: { dueAt: "asc" }
    });

    for (const invoice of invoices) {
      if (!invoice.dueAt) continue;
      if (!shouldTriggerScheduledReminder(invoice.dueAt, preference.intervalDays, now)) continue;

      const dispatchPrefix =
        invoice.id +
        ":due-" +
        String(preference.intervalDays) +
        ":" +
        invoice.dueAt.toISOString().slice(0, 10);

      try {
        await sendReminderForInvoice({
          client,
          clientId: preference.clientId,
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          amountCents: invoice.amountCents,
          currency: invoice.currency,
          dueAt: invoice.dueAt,
          channels: preference.channels,
          note: preference.note,
          triggerType: "scheduled_due_" + String(preference.intervalDays),
          dedupeKeyPrefix: dispatchPrefix
        });
      } catch (error) {
        logger.error(
          {
            clientId: preference.clientId,
            invoiceId: invoice.id,
            error: error instanceof Error ? error.message : String(error)
          },
          "invoice reminder dispatch failed"
        );
      }
    }
  }
}
