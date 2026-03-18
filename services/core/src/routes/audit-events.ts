// ════════════════════════════════════════════════════════════════════════════
// audit-events.ts — Audit event routes (read-only, no cache, ADMIN only)
// Service : core  |  Cache TTL: none (always fresh)
// Scope   : ADMIN only; immutable — no POST/PATCH/DELETE
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { AuditEvent } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTO ───────────────────────────────────────────────────────────────────────
type AuditEventDto = {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  actorName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

function toDto(e: AuditEvent): AuditEventDto {
  return {
    ...e,
    createdAt: e.createdAt.toISOString(),
  };
}

// ── Action label map ──────────────────────────────────────────────────────────
const ACTION_LABEL: Record<string, string> = {
  // Invoice
  INVOICE_SENT:       "Invoice sent",
  INVOICE_CREATED:    "Invoice created",
  INVOICE_PAID:       "Invoice paid",
  INVOICE_OVERDUE:    "Invoice overdue",
  INVOICE_VOIDED:     "Invoice voided",
  // Payment
  PAYMENT_RECEIVED:   "Payment received",
  PAYMENT_FAILED:     "Payment failed",
  PAYMENT_REFUNDED:   "Payment refunded",
  // Milestone
  MILESTONE_CREATED:     "Milestone created",
  MILESTONE_COMPLETED:   "Milestone completed",
  MILESTONE_APPROVED:    "Milestone approved",
  MILESTONE_REJECTED:    "Milestone rejected",
  // Sprint
  SPRINT_STARTED:     "Sprint started",
  SPRINT_COMPLETED:   "Sprint completed",
  SPRINT_CREATED:     "Sprint created",
  // Task
  TASK_CREATED:       "Task created",
  TASK_COMPLETED:     "Task completed",
  TASK_ASSIGNED:      "Task assigned",
  // Project
  PROJECT_CREATED:    "Project created",
  PROJECT_UPDATED:    "Project updated",
  PROJECT_COMPLETED:  "Project completed",
  PROJECT_ARCHIVED:   "Project archived",
  // Message
  MESSAGE_SENT:       "Message sent",
  MESSAGE_RECEIVED:   "Message received",
  // File
  FILE_UPLOADED:      "File uploaded",
  FILE_DELETED:       "File deleted",
  // Change request
  CHANGE_REQUEST_SUBMITTED: "Change request submitted",
  CHANGE_REQUEST_APPROVED:  "Change request approved",
  CHANGE_REQUEST_REJECTED:  "Change request rejected",
  // Deliverable
  DELIVERABLE_UPLOADED:     "Deliverable uploaded",
  DELIVERABLE_APPROVED:     "Deliverable approved",
  // Contract
  CONTRACT_SIGNED:    "Contract signed",
  CONTRACT_CREATED:   "Contract created",
  // Support
  TICKET_OPENED:      "Support ticket opened",
  TICKET_RESOLVED:    "Support ticket resolved",
};

function toFriendlyLabel(action: string): string {
  return ACTION_LABEL[action] ?? action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function toEntityType(resourceType: string): string {
  const map: Record<string, string> = {
    Invoice:       "invoice",
    Payment:       "payment",
    Milestone:     "milestone",
    Project:       "project",
    Task:          "task",
    Sprint:        "sprint",
    Message:       "message",
    Conversation:  "message",
    File:          "file",
    ChangeRequest: "task",
    Deliverable:   "milestone",
    Contract:      "invoice",
    SupportTicket: "message",
  };
  return map[resourceType] ?? resourceType.toLowerCase();
}

// ── ActivityItem DTO ──────────────────────────────────────────────────────────
type ActivityItem = {
  id:          string;
  action:      string;
  entityType:  string;
  entityId:    string | null;
  actorName:   string | null;
  createdAt:   string;
};

// ── Route registration ────────────────────────────────────────────────────────
export async function registerAuditEventRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /portal/activity-feed ───────────────────────────────────────────────
  // CLIENT only. Returns last 50 audit events as human-readable activity items.
  app.get("/portal/activity-feed", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT" && scope.role !== "ADMIN" && scope.role !== "STAFF") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not allowed" } } as ApiResponse;
    }

    try {
      const events = await prisma.auditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const items: ActivityItem[] = events.map((e) => ({
        id:         e.id,
        action:     toFriendlyLabel(e.action),
        entityType: toEntityType(e.resourceType),
        entityId:   e.resourceId,
        actorName:  e.actorName,
        createdAt:  e.createdAt.toISOString(),
      }));

      return {
        success: true,
        data:    items,
        meta:    { requestId: scope.requestId, count: items.length },
      } as ApiResponse<ActivityItem[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "ACTIVITY_FEED_FAILED", message: "Unable to fetch activity feed" } } as ApiResponse;
    }
  });

  // ── GET /audit-events ───────────────────────────────────────────────────────
  // ADMIN only. Supports optional filters: actorId, resourceType, resourceId.
  // No caching — audit log must always be real-time.
  app.get("/audit-events", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const query = request.query as {
      actorId?:      string;
      resourceType?: string;
      resourceId?:   string;
      limit?:        string;
    };

    const take = Math.min(parseInt(query.limit ?? "100", 10), 500);

    try {
      const events = await prisma.auditEvent.findMany({
        where: {
          ...(query.actorId      ? { actorId:      query.actorId      } : {}),
          ...(query.resourceType ? { resourceType: query.resourceType } : {}),
          ...(query.resourceId   ? { resourceId:   query.resourceId   } : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
      });

      return {
        success: true,
        data:    events.map(toDto),
        meta:    { requestId: scope.requestId, count: events.length, limit: take },
      } as ApiResponse<AuditEventDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "AUDIT_FETCH_FAILED", message: "Unable to fetch audit events" } } as ApiResponse;
    }
  });
}
