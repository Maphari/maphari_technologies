// ════════════════════════════════════════════════════════════════════════════
// content-submissions.ts — Content submission routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN full; STAFF own-submissions; CLIENT own-tenant
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { ContentSubmission } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { withCache, cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── DTO ───────────────────────────────────────────────────────────────────────
type ContentSubmissionDto = {
  id: string;
  clientId: string;
  title: string;
  type: string;
  submittedById: string | null;
  submittedByName: string | null;
  status: string;
  approvedById: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function toDto(c: ContentSubmission): ContentSubmissionDto {
  return {
    ...c,
    approvedAt: c.approvedAt?.toISOString() ?? null,
    rejectedAt: c.rejectedAt?.toISOString() ?? null,
    createdAt:  c.createdAt.toISOString(),
    updatedAt:  c.updatedAt.toISOString(),
  };
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerContentSubmissionRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /content-submissions ────────────────────────────────────────────────
  app.get("/content-submissions", async (request) => {
    const scope = readScopeHeaders(request);
    const query = request.query as { clientId?: string; status?: string };
    const clientFilter = resolveClientFilter(scope.role, scope.clientId, query.clientId);
    const cacheScope   = scope.role === "ADMIN" ? "admin" : clientFilter ?? "all";

    try {
      const data = await withCache(CacheKeys.contentSubmissions(cacheScope), 60, () =>
        prisma.contentSubmission.findMany({
          where: {
            ...(clientFilter   ? { clientId: clientFilter   } : {}),
            ...(query.status   ? { status:   query.status   } : {}),
          },
          orderBy: { createdAt: "desc" },
        }).then((rows) => rows.map(toDto))
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<ContentSubmissionDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CONTENT_FETCH_FAILED", message: "Unable to fetch content submissions" } } as ApiResponse;
    }
  });

  // ── POST /content-submissions ───────────────────────────────────────────────
  app.post("/content-submissions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = request.body as {
      clientId: string;
      title: string;
      type?: string;
      submittedByName?: string;
      notes?: string;
    };

    const clientId = scope.role === "CLIENT" ? scope.clientId ?? body.clientId : body.clientId;

    if (!clientId || !body.title) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId and title are required" } } as ApiResponse;
    }

    try {
      const submission = await prisma.contentSubmission.create({
        data: {
          clientId:        clientId,
          title:           body.title,
          type:            body.type            ?? "SOCIAL_POST",
          submittedById:   scope.userId         ?? null,
          submittedByName: body.submittedByName ?? null,
          notes:           body.notes           ?? null,
          status:          "AWAITING",
        },
      });

      await Promise.all([
        cache.delete(CacheKeys.contentSubmissions("admin")),
        cache.delete(CacheKeys.contentSubmissions(clientId)),
      ]);

      reply.status(201);
      return { success: true, data: toDto(submission) } as ApiResponse<ContentSubmissionDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CONTENT_CREATE_FAILED", message: "Unable to create content submission" } } as ApiResponse;
    }
  });

  // ── PATCH /content-submissions/:id ──────────────────────────────────────────
  // CLIENT: approve or request revisions on their own submissions
  app.patch("/content-submissions/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };
    const body = request.body as { status: string; notes?: string };

    const ALLOWED = ["APPROVED", "REVISIONS_REQUESTED"];
    if (!body.status || !ALLOWED.includes(body.status)) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "status must be APPROVED or REVISIONS_REQUESTED" },
      } as ApiResponse;
    }

    try {
      // For CLIENT role, verify the submission belongs to their tenant
      if (scope.role === "CLIENT" && scope.clientId) {
        const existing = await prisma.contentSubmission.findFirst({
          where: { id, clientId: scope.clientId },
          select: { id: true },
        });
        if (!existing) {
          reply.status(403);
          return {
            success: false,
            error: { code: "FORBIDDEN", message: "Submission not found or access denied" },
          } as ApiResponse;
        }
      }

      const submission = await prisma.contentSubmission.update({
        where: { id },
        data: {
          status:     body.status,
          notes:      body.notes ?? undefined,
          approvedAt: body.status === "APPROVED"             ? new Date() : null,
          rejectedAt: body.status === "REVISIONS_REQUESTED"  ? new Date() : null,
        },
      });

      await Promise.all([
        cache.delete(CacheKeys.contentSubmissions("admin")),
        cache.delete(CacheKeys.contentSubmissions(submission.clientId)),
      ]);

      return { success: true, data: toDto(submission) } as ApiResponse<ContentSubmissionDto>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "CONTENT_UPDATE_FAILED", message: "Unable to update content submission" },
      } as ApiResponse;
    }
  });

  // ── PATCH /content-submissions/:id/approve ──────────────────────────────────
  app.patch("/content-submissions/:id/approve", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as { approved: boolean; notes?: string };

    try {
      const submission = await prisma.contentSubmission.update({
        where: { id },
        data: {
          status:        body.approved ? "APPROVED" : "REJECTED",
          approvedById:  body.approved ? (scope.userId ?? null) : null,
          approvedAt:    body.approved ? new Date() : null,
          rejectedAt:    body.approved ? null : new Date(),
          ...(body.notes ? { notes: body.notes } : {}),
        },
      });

      await Promise.all([
        cache.delete(CacheKeys.contentSubmissions("admin")),
        cache.delete(CacheKeys.contentSubmissions(submission.clientId)),
      ]);

      return { success: true, data: toDto(submission) } as ApiResponse<ContentSubmissionDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CONTENT_APPROVE_FAILED", message: "Unable to update content submission" } } as ApiResponse;
    }
  });
}
