// ── audit.ts — fire-and-forget audit event writer ────────────────────────────
// Never throws. Failures are logged but do not break the calling request.

import { prisma } from "./prisma.js";

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
