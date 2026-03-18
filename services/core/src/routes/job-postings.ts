// ════════════════════════════════════════════════════════════════════════════
// job-postings.ts — Job Posting routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : ADMIN full CRUD; STAFF read-only; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerJobPostingRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /job-postings ──────────────────────────────────────────────────────
  app.get("/job-postings", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const data = await withCache(CacheKeys.jobPostings(), 120, () =>
      prisma.jobPosting.findMany({ orderBy: { postedAt: "desc" } })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /job-postings — ADMIN only ───────────────────────────────────────
  app.post("/job-postings", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can create job postings." } } as ApiResponse);
    }

    const body = request.body as {
      title: string;
      department?: string;
      priority?: string;
      hiringManager?: string;
      salaryBand?: string;
      postedAt?: string;
      targetDate?: string;
    };

    const posting = await prisma.jobPosting.create({
      data: {
        title:          body.title,
        department:     body.department    ?? null,
        priority:       body.priority      ?? "MEDIUM",
        status:         "OPEN",
        hiringManager:  body.hiringManager ?? null,
        salaryBand:     body.salaryBand    ?? null,
        postedAt:       body.postedAt      ? new Date(body.postedAt)   : new Date(),
        targetDate:     body.targetDate    ? new Date(body.targetDate)  : null,
      }
    });

    await cache.delete(CacheKeys.jobPostings());

    return reply.code(201).send({ success: true, data: posting, meta: { requestId: scope.requestId } } as ApiResponse<typeof posting>);
  });

  // ── PATCH /job-postings/:id — ADMIN only ──────────────────────────────────
  app.patch("/job-postings/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can update job postings." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const existing = await prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Job posting not found." } } as ApiResponse);
    }

    const body = request.body as {
      title?: string;
      department?: string;
      priority?: string;
      status?: string;
      hiringManager?: string;
      salaryBand?: string;
      targetDate?: string;
    };

    const updated = await prisma.jobPosting.update({
      where: { id },
      data: {
        title:         body.title         ?? existing.title,
        department:    body.department    !== undefined ? body.department    : existing.department,
        priority:      body.priority      ?? existing.priority,
        status:        body.status        ?? existing.status,
        hiringManager: body.hiringManager !== undefined ? body.hiringManager : existing.hiringManager,
        salaryBand:    body.salaryBand    !== undefined ? body.salaryBand    : existing.salaryBand,
        targetDate:    body.targetDate    ? new Date(body.targetDate) : existing.targetDate,
      }
    });

    await cache.delete(CacheKeys.jobPostings());

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });

  // ── GET /job-postings/:id/applications — ADMIN only ───────────────────────
  app.get("/job-postings/:id/applications", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can view applications." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };

    const data = await withCache(CacheKeys.jobApplications(id), 60, () =>
      prisma.jobApplication.findMany({
        where: { jobPostingId: id },
        orderBy: { appliedAt: "desc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });
}
