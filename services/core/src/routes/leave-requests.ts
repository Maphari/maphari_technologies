// ════════════════════════════════════════════════════════════════════════════
// leave-requests.ts — Staff Leave Request routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN full access; STAFF read/create own; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerLeaveRequestRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /leave-requests ────────────────────────────────────────────────────
  app.get("/leave-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    if (scope.role === "STAFF") {
      // STAFF sees only their own requests
      const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
      if (!ownProfile) return { success: true, data: [], meta: { requestId: scope.requestId } } as ApiResponse<[]>;

      const data = await withCache(CacheKeys.leaveRequests(ownProfile.id), 60, () =>
        prisma.leaveRequest.findMany({
          where: { staffId: ownProfile.id },
          orderBy: { startDate: "desc" }
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    }

    // ADMIN sees all
    const data = await withCache(CacheKeys.leaveRequests("all"), 60, () =>
      prisma.leaveRequest.findMany({ orderBy: { startDate: "desc" } })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /leave-requests ───────────────────────────────────────────────────
  app.post("/leave-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot submit leave requests." } } as ApiResponse);
    }

    const body = request.body as {
      staffId?: string;
      type: string;
      startDate: string;
      endDate: string;
      days: number;
      notes?: string;
    };

    // Resolve staffId: STAFF uses their own profile; ADMIN can specify any
    let staffId = body.staffId;
    if (scope.role === "STAFF") {
      const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
      if (!ownProfile) {
        return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Staff profile not found." } } as ApiResponse);
      }
      staffId = ownProfile.id;
    }

    if (!staffId) {
      return reply.code(400).send({ success: false, error: { code: "BAD_REQUEST", message: "staffId is required." } } as ApiResponse);
    }

    const request_ = await prisma.leaveRequest.create({
      data: {
        staffId,
        type:      body.type,
        startDate: new Date(body.startDate),
        endDate:   new Date(body.endDate),
        days:      body.days,
        status:    "PENDING",
        notes:     body.notes ?? null,
      }
    });

    await Promise.all([
      cache.delete(CacheKeys.leaveRequests(staffId)),
      cache.delete(CacheKeys.leaveRequests("all")),
    ]);

    return reply.code(201).send({ success: true, data: request_, meta: { requestId: scope.requestId } } as ApiResponse<typeof request_>);
  });

  // ── PATCH /leave-requests/:id/approve — ADMIN only ────────────────────────
  app.patch("/leave-requests/:id/approve", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can approve leave requests." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Leave request not found." } } as ApiResponse);
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: "APPROVED", approverId: scope.userId ?? null, approvedAt: new Date() }
    });

    await Promise.all([
      cache.delete(CacheKeys.leaveRequests(existing.staffId)),
      cache.delete(CacheKeys.leaveRequests("all")),
    ]);

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });

  // ── PATCH /leave-requests/:id/decline — ADMIN only ────────────────────────
  app.patch("/leave-requests/:id/decline", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can decline leave requests." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Leave request not found." } } as ApiResponse);
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: "DECLINED", approverId: scope.userId ?? null, approvedAt: new Date() }
    });

    await Promise.all([
      cache.delete(CacheKeys.leaveRequests(existing.staffId)),
      cache.delete(CacheKeys.leaveRequests("all")),
    ]);

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
