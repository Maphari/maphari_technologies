// ── audit.ts — fire-and-forget audit event writer ────────────────────────────
// Never throws. Failures are logged but do not break the calling request.

import { prisma } from "./prisma.js";
import { dispatchWebhooks } from "./webhook-dispatcher.js";

interface AuditPayload {
  actorId?:      string | null;
  actorRole?:    string | null;
  actorName?:    string | null;
  action:        string;
  resourceType:  string;
  resourceId?:   string | null;
  details?:      string | null;
  ipAddress?:    string | null;
  userAgent?:    string | null;
}

export function writeAuditEvent(payload: AuditPayload): void {
  prisma.auditEvent.create({ data: payload }).catch((err) => {
    console.error("[audit] Failed to write audit event:", err);
  });
}

const WEBHOOK_EVENT_MAP: Record<string, string> = {
  PROJECT_CREATED:      "project.created",
  INVOICE_PAID:         "invoice.paid",
  MILESTONE_APPROVED:   "milestone.approved",
  CONTRACT_SIGNED:      "contract.signed",
  DELIVERABLE_APPROVED: "deliverable.approved",
};

export function writeAuditEventAndDispatch(payload: AuditPayload): void {
  writeAuditEvent(payload);  // original fire-and-forget semantics unchanged
  const webhookEvent = WEBHOOK_EVENT_MAP[payload.action];
  if (webhookEvent) {
    dispatchWebhooks({
      event:        webhookEvent,
      resourceType: payload.resourceType,
      resourceId:   payload.resourceId ?? null,
      data:         { actorId: payload.actorId, actorRole: payload.actorRole, details: payload.details },
      timestamp:    new Date().toISOString(),
    });
  }
}
