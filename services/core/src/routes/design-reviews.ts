// ════════════════════════════════════════════════════════════════════════════
// design-reviews.ts — Design review routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN full; STAFF own-project; CLIENT own-tenant read-only
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { DesignReview } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { withCache, cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── DTO ───────────────────────────────────────────────────────────────────────
type DesignReviewDto = {
  id: string;
  projectId: string;
  clientId: string;
  round: number;
  reviewerName: string | null;
  status: string;
  submittedAt: string;
  resolvedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function toDto(d: DesignReview): DesignReviewDto {
  return {
    ...d,
    submittedAt: d.submittedAt.toISOString(),
    resolvedAt:  d.resolvedAt?.toISOString() ?? null,
    createdAt:   d.createdAt.toISOString(),
    updatedAt:   d.updatedAt.toISOString(),
  };
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerDesignReviewRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /design-reviews ─────────────────────────────────────────────────────
  app.get("/design-reviews", async (request) => {
    const scope = readScopeHeaders(request);
    const query = request.query as { projectId?: string; clientId?: string };
    const clientFilter = resolveClientFilter(scope.role, scope.clientId, query.clientId);
    const cacheScope   = scope.role === "ADMIN" ? "admin" : clientFilter ?? "all";

    try {
      const data = await withCache(CacheKeys.designReviews(cacheScope), 60, () =>
        prisma.designReview.findMany({
          where: {
            ...(clientFilter       ? { clientId:  clientFilter       } : {}),
            ...(query.projectId    ? { projectId: query.projectId    } : {}),
          },
          orderBy: { submittedAt: "desc" },
        }).then((rows) => rows.map(toDto))
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<DesignReviewDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DESIGN_REVIEWS_FETCH_FAILED", message: "Unable to fetch design reviews" } } as ApiResponse;
    }
  });

  // ── POST /design-reviews ────────────────────────────────────────────────────
  app.post("/design-reviews", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = request.body as {
      projectId: string;
      clientId: string;
      round?: number;
      reviewerName?: string;
      notes?: string;
      submittedAt?: string;
    };

    if (!body.projectId || !body.clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "projectId and clientId are required" } } as ApiResponse;
    }

    try {
      const review = await prisma.designReview.create({
        data: {
          projectId:    body.projectId,
          clientId:     body.clientId,
          round:        body.round        ?? 1,
          reviewerName: body.reviewerName ?? null,
          notes:        body.notes        ?? null,
          submittedAt:  body.submittedAt ? new Date(body.submittedAt) : new Date(),
          status:       "PENDING",
        },
      });

      await Promise.all([
        cache.delete(CacheKeys.designReviews("admin")),
        cache.delete(CacheKeys.designReviews(body.clientId)),
      ]);

      reply.status(201);
      return { success: true, data: toDto(review) } as ApiResponse<DesignReviewDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DESIGN_REVIEW_CREATE_FAILED", message: "Unable to create design review" } } as ApiResponse;
    }
  });

  // ── PATCH /design-reviews/:id/resolve ──────────────────────────────────────
  app.patch("/design-reviews/:id/resolve", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as { notes?: string };

    try {
      const review = await prisma.designReview.update({
        where: { id },
        data:  { status: "RESOLVED", resolvedAt: new Date(), ...(body.notes ? { notes: body.notes } : {}) },
      });

      await Promise.all([
        cache.delete(CacheKeys.designReviews("admin")),
        cache.delete(CacheKeys.designReviews(review.clientId)),
      ]);

      return { success: true, data: toDto(review) } as ApiResponse<DesignReviewDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DESIGN_REVIEW_RESOLVE_FAILED", message: "Unable to resolve design review" } } as ApiResponse;
    }
  });
}
