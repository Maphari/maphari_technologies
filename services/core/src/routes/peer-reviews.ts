// ════════════════════════════════════════════════════════════════════════════
// peer-reviews.ts — Peer Review routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : ADMIN full access; STAFF read + submit own reviews; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerPeerReviewRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /peer-reviews ──────────────────────────────────────────────────────
  app.get("/peer-reviews", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    if (scope.role === "STAFF") {
      const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
      if (!ownProfile) return { success: true, data: [], meta: { requestId: scope.requestId } } as ApiResponse<[]>;

      const data = await withCache(CacheKeys.peerReviews(ownProfile.id), 120, () =>
        prisma.peerReview.findMany({
          where: { OR: [{ reviewerId: ownProfile.id }, { revieweeId: ownProfile.id }] },
          orderBy: { dueAt: "asc" }
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    }

    // ADMIN sees all
    const data = await withCache(CacheKeys.peerReviews("all"), 120, () =>
      prisma.peerReview.findMany({ orderBy: { dueAt: "asc" } })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /peer-reviews — ADMIN only ───────────────────────────────────────
  app.post("/peer-reviews", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can assign peer reviews." } } as ApiResponse);
    }

    const body = request.body as {
      reviewerId: string;
      revieweeId: string;
      projectId?: string;
      dueAt?: string;
    };

    const review = await prisma.peerReview.create({
      data: {
        reviewerId: body.reviewerId,
        revieweeId: body.revieweeId,
        projectId:  body.projectId ?? null,
        status:     "PENDING",
        dueAt:      body.dueAt ? new Date(body.dueAt) : null,
      }
    });

    await Promise.all([
      cache.delete(CacheKeys.peerReviews(body.reviewerId)),
      cache.delete(CacheKeys.peerReviews(body.revieweeId)),
      cache.delete(CacheKeys.peerReviews("all")),
    ]);

    return reply.code(201).send({ success: true, data: review, meta: { requestId: scope.requestId } } as ApiResponse<typeof review>);
  });

  // ── PATCH /peer-reviews/:id/submit — STAFF submits their own review ────────
  app.patch("/peer-reviews/:id/submit", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const existing = await prisma.peerReview.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Peer review not found." } } as ApiResponse);
    }

    // STAFF can only submit reviews they are the reviewer for
    if (scope.role === "STAFF") {
      const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
      if (!ownProfile || ownProfile.id !== existing.reviewerId) {
        return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "You can only submit reviews you are assigned to." } } as ApiResponse);
      }
    }

    const body = request.body as { score?: number; feedback?: string };

    const updated = await prisma.peerReview.update({
      where: { id },
      data: {
        status:      "SUBMITTED",
        score:       body.score    !== undefined ? body.score    : existing.score,
        feedback:    body.feedback !== undefined ? body.feedback : existing.feedback,
        submittedAt: new Date(),
      }
    });

    await Promise.all([
      cache.delete(CacheKeys.peerReviews(existing.reviewerId)),
      cache.delete(CacheKeys.peerReviews(existing.revieweeId)),
      cache.delete(CacheKeys.peerReviews("all")),
    ]);

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
