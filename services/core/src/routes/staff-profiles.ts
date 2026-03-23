// ════════════════════════════════════════════════════════════════════════════
// staff-profiles.ts — Staff Profile routes
// Service : core  |  Cache TTL: 60 s (list), 120 s (single), invalidate on write
// Scope   : ADMIN full access; STAFF read-all + write-own; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerStaffProfileRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /staff-profiles/skills/matrix ─────────────────────────────────────
  // NOTE: Registered FIRST — static route must precede /staff-profiles/:id
  app.get("/staff-profiles/skills/matrix", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const staff = await prisma.staffProfile.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true, skills: true, avatarInitials: true, avatarColor: true },
    });

    const matrix = staff.map((s) => ({
      ...s,
      skills: (() => {
        try { return s.skills ? (JSON.parse(s.skills) as string[]) : []; }
        catch { return []; }
      })(),
    }));

    return { success: true, data: matrix, meta: { requestId: scope.requestId } } as ApiResponse<typeof matrix>;
  });

  // ── PATCH /staff-profiles/:id/skills ──────────────────────────────────────
  app.patch("/staff-profiles/:id/skills", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as { skills: string[] };

    if (!Array.isArray(body.skills)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "skills must be an array." } } as ApiResponse);
    }

    if (!body.skills.every((s) => typeof s === "string" && s.trim().length > 0)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "skills must be an array of non-empty strings." } } as ApiResponse);
    }

    const updated = await prisma.staffProfile.update({
      where: { id },
      data: { skills: JSON.stringify(body.skills) },
    });

    await Promise.all([
      cache.delete(CacheKeys.staffList()),
      cache.delete(CacheKeys.staffProfile(id)),
    ]);

    const updatedWithParsed = { ...updated, skills: body.skills };
    return { success: true, data: updatedWithParsed, meta: { requestId: scope.requestId } } as ApiResponse<typeof updatedWithParsed>;
  });

  // ── GET /staff ─────────────────────────────────────────────────────────────
  app.get("/staff", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot access staff records." } } as ApiResponse);
    }

    const data = await withCache(CacheKeys.staffList(), 60, () =>
      prisma.staffProfile.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /staff/:staffId ────────────────────────────────────────────────────
  app.get("/staff/:staffId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot access staff records." } } as ApiResponse);
    }

    const { staffId } = request.params as { staffId: string };

    // STAFF can only read their own profile
    if (scope.role === "STAFF") {
      const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
      if (!ownProfile || ownProfile.id !== staffId) {
        return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
      }
    }

    const data = await withCache(CacheKeys.staffProfile(staffId), 120, () =>
      prisma.staffProfile.findUnique({ where: { id: staffId } })
    );

    if (!data) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Staff profile not found." } } as ApiResponse);
    }

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /staff/me ──────────────────────────────────────────────────────────
  app.get("/staff/me", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot access staff records." } } as ApiResponse);
    }

    const data = await withCache(`staff:me:${scope.userId}`, 120, () =>
      prisma.staffProfile.findFirst({ where: { userId: scope.userId } })
    );

    if (!data) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Staff profile not found." } } as ApiResponse);
    }

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── PATCH /staff/me ────────────────────────────────────────────────────────
  app.patch("/staff/me", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot access staff records." } } as ApiResponse);
    }

    const existing = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Staff profile not found." } } as ApiResponse);
    }

    const body = request.body as {
      name?: string;
      role?: string;
      department?: string;
      avatarInitials?: string;
      avatarColor?: string;
    };

    const updated = await prisma.staffProfile.update({
      where: { id: existing.id },
      data: {
        name:           body.name           ?? existing.name,
        role:           body.role           ?? existing.role,
        department:     body.department     !== undefined ? body.department     : existing.department,
        avatarInitials: body.avatarInitials !== undefined ? body.avatarInitials : existing.avatarInitials,
        avatarColor:    body.avatarColor    !== undefined ? body.avatarColor    : existing.avatarColor,
      }
    });

    await Promise.all([
      cache.delete(CacheKeys.staffList()),
      cache.delete(CacheKeys.staffProfile(existing.id)),
      cache.delete(`staff:me:${scope.userId}`),
    ]);

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });

  // ── POST /staff ────────────────────────────────────────────────────────────
  app.post("/staff", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can create staff profiles." } } as ApiResponse);
    }

    const body = request.body as {
      userId: string;
      name: string;
      role: string;
      department?: string;
      avatarInitials?: string;
      avatarColor?: string;
      hireDate?: string;
      contractType?: string;
      grossSalaryCents?: number;
    };

    const profile = await prisma.staffProfile.create({
      data: {
        userId:           body.userId,
        name:             body.name,
        role:             body.role,
        department:       body.department       ?? null,
        avatarInitials:   body.avatarInitials   ?? null,
        avatarColor:      body.avatarColor      ?? null,
        hireDate:         body.hireDate         ? new Date(body.hireDate) : undefined,
        contractType:     body.contractType     ?? undefined,
        grossSalaryCents: body.grossSalaryCents ?? undefined,
      }
    });

    await cache.delete(CacheKeys.staffList());

    return reply.code(201).send({ success: true, data: profile, meta: { requestId: scope.requestId } } as ApiResponse<typeof profile>);
  });

  // ── PATCH /staff/:staffId ──────────────────────────────────────────────────
  app.patch("/staff/:staffId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot modify staff records." } } as ApiResponse);
    }

    const { staffId } = request.params as { staffId: string };

    // STAFF can only update their own profile
    if (scope.role === "STAFF") {
      const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
      if (!ownProfile || ownProfile.id !== staffId) {
        return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
      }
    }

    const existing = await prisma.staffProfile.findUnique({ where: { id: staffId } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Staff profile not found." } } as ApiResponse);
    }

    const body = request.body as {
      name?: string;
      role?: string;
      department?: string;
      avatarInitials?: string;
      avatarColor?: string;
      contractType?: string;
      grossSalaryCents?: number;
      isActive?: boolean;
    };

    const updated = await prisma.staffProfile.update({
      where: { id: staffId },
      data: {
        name:             body.name             ?? existing.name,
        role:             body.role             ?? existing.role,
        department:       body.department       !== undefined ? body.department       : existing.department,
        avatarInitials:   body.avatarInitials   !== undefined ? body.avatarInitials   : existing.avatarInitials,
        avatarColor:      body.avatarColor      !== undefined ? body.avatarColor      : existing.avatarColor,
        contractType:     body.contractType     !== undefined ? body.contractType     : existing.contractType,
        grossSalaryCents: body.grossSalaryCents !== undefined ? body.grossSalaryCents : existing.grossSalaryCents,
        isActive:         body.isActive         !== undefined ? body.isActive         : existing.isActive,
      }
    });

    await Promise.all([
      cache.delete(CacheKeys.staffList()),
      cache.delete(CacheKeys.staffProfile(staffId)),
    ]);

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
