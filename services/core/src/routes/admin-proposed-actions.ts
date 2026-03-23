// ════════════════════════════════════════════════════════════════════════════
// admin-proposed-actions.ts — Two-admin approval workflow
// POST   /admin/proposed-actions             → propose a high-stakes action
// GET    /admin/proposed-actions             → list proposals (filterable by status)
// PATCH  /admin/proposed-actions/:id/approve → Admin B approves
// PATCH  /admin/proposed-actions/:id/reject  → Admin B rejects
// ════════════════════════════════════════════════════════════════════════════
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";
import { writeAuditEvent } from "../lib/audit.js";

export async function registerAdminProposedActionRoutes(app: FastifyInstance): Promise<void> {

  // GET /admin/proposed-actions
  app.get("/admin/proposed-actions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const query = request.query as { status?: string };
    const data = await prisma.adminProposedAction.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // POST /admin/proposed-actions
  app.post("/admin/proposed-actions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const body = request.body as {
      action:          string;
      resourceType:    string;
      resourceId?:     string;
      payload?:        Record<string, unknown>;
      reason?:         string;
      proposedByName?: string;
    };
    if (!body.action || !body.resourceType) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "action and resourceType are required." } } as ApiResponse);
    }
    const record = await prisma.adminProposedAction.create({
      data: {
        proposedBy:     scope.userId ?? "unknown",
        proposedByName: body.proposedByName ?? null,
        action:         body.action,
        resourceType:   body.resourceType,
        resourceId:     body.resourceId ?? null,
        payload:        body.payload ? JSON.stringify(body.payload) : null,
        reason:         body.reason ?? null,
        status:         "PENDING",
      },
    });
    writeAuditEvent({
      actorId:      scope.userId,
      actorRole:    "ADMIN",
      action:       "ADMIN_ACTION_PROPOSED",
      resourceType: body.resourceType,
      resourceId:   body.resourceId ?? null,
      details:      `Proposed: ${body.action}`,
    });
    return reply.code(201).send({ success: true, data: record, meta: { requestId: scope.requestId } } as ApiResponse<typeof record>);
  });

  // PATCH /admin/proposed-actions/:id/approve
  app.patch("/admin/proposed-actions/:id/approve", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { reviewNote?: string; reviewedByName?: string };

    const existing = await prisma.adminProposedAction.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Proposed action not found." } } as ApiResponse);
    if (existing.status !== "PENDING") return reply.code(409).send({ success: false, error: { code: "ALREADY_REVIEWED", message: "Action already reviewed." } } as ApiResponse);
    if (existing.proposedBy === scope.userId) {
      return reply.code(403).send({ success: false, error: { code: "SELF_APPROVE", message: "Cannot approve your own proposed action." } } as ApiResponse);
    }

    const updated = await prisma.adminProposedAction.update({
      where: { id },
      data: {
        status:         "APPROVED",
        reviewedBy:     scope.userId ?? null,
        reviewedByName: body.reviewedByName ?? null,
        reviewedAt:     new Date(),
        reviewNote:     body.reviewNote ?? null,
      },
    });
    writeAuditEvent({
      actorId:      scope.userId,
      actorRole:    "ADMIN",
      action:       "ADMIN_ACTION_APPROVED",
      resourceType: existing.resourceType,
      resourceId:   existing.resourceId,
      details:      `Approved proposed action: ${existing.action}`,
    });
    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });

  // PATCH /admin/proposed-actions/:id/reject
  app.patch("/admin/proposed-actions/:id/reject", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { reviewNote?: string; reviewedByName?: string };

    const existing = await prisma.adminProposedAction.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Proposed action not found." } } as ApiResponse);
    if (existing.status !== "PENDING") return reply.code(409).send({ success: false, error: { code: "ALREADY_REVIEWED", message: "Action already reviewed." } } as ApiResponse);

    const updated = await prisma.adminProposedAction.update({
      where: { id },
      data: {
        status:         "REJECTED",
        reviewedBy:     scope.userId ?? null,
        reviewedByName: body.reviewedByName ?? null,
        reviewedAt:     new Date(),
        reviewNote:     body.reviewNote ?? null,
      },
    });
    writeAuditEvent({
      actorId:      scope.userId,
      actorRole:    "ADMIN",
      action:       "ADMIN_ACTION_REJECTED",
      resourceType: existing.resourceType,
      resourceId:   existing.resourceId,
    });
    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
