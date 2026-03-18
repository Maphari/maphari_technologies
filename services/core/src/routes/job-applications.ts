// ════════════════════════════════════════════════════════════════════════════
// job-applications.ts — Job Application routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN full access; STAFF/CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerJobApplicationRoutes(app: FastifyInstance): Promise<void> {

  // ── POST /job-postings/:postingId/applications — ADMIN only ───────────────
  app.post("/job-postings/:postingId/applications", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can add applications." } } as ApiResponse);
    }

    const { postingId } = request.params as { postingId: string };

    const posting = await prisma.jobPosting.findUnique({ where: { id: postingId } });
    if (!posting) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Job posting not found." } } as ApiResponse);
    }

    const body = request.body as {
      candidateName: string;
      stage?: string;
      score?: number;
      source?: string;
      flag?: string;
      appliedAt?: string;
    };

    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId:  postingId,
        candidateName: body.candidateName,
        stage:         body.stage     ?? "APPLIED",
        score:         body.score     ?? null,
        source:        body.source    ?? null,
        flag:          body.flag      ?? null,
        appliedAt:     body.appliedAt ? new Date(body.appliedAt) : new Date(),
      }
    });

    await cache.delete(CacheKeys.jobApplications(postingId));

    return reply.code(201).send({ success: true, data: application, meta: { requestId: scope.requestId } } as ApiResponse<typeof application>);
  });

  // ── PATCH /job-applications/:aid — ADMIN only ──────────────────────────────
  app.patch("/job-applications/:aid", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can update applications." } } as ApiResponse);
    }

    const { aid } = request.params as { aid: string };

    const existing = await prisma.jobApplication.findUnique({ where: { id: aid } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Application not found." } } as ApiResponse);
    }

    const body = request.body as {
      stage?: string;
      score?: number;
      flag?: string;
    };

    const updated = await prisma.jobApplication.update({
      where: { id: aid },
      data: {
        stage: body.stage ?? existing.stage,
        score: body.score !== undefined ? body.score : existing.score,
        flag:  body.flag  !== undefined ? body.flag  : existing.flag,
      }
    });

    await cache.delete(CacheKeys.jobApplications(existing.jobPostingId));

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
