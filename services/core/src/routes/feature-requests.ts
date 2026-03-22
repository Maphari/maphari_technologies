// ════════════════════════════════════════════════════════════════════════════
// feature-requests.ts — Feature Request + Vote routes
// Service : core
// Scope   : CLIENT (list approved, submit, vote) | ADMIN (all records, moderate, update status)
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";
import { generateAlias } from "../lib/alias.js";

const VALID_CATEGORIES = ["portal-ux", "reporting", "integrations", "delivery", "billing", "other"];
const VALID_STATUSES = ["under_review", "planned", "in_progress", "done", "declined"];

export async function registerFeatureRequestRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /portal/feature-requests ──────────────────────────────────────────
  app.get("/portal/feature-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const q = request.query as { category?: string; status?: string; sort?: string; page?: string; limit?: string };
    const page = Math.max(1, parseInt(q.page ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? "20", 10)));
    const skip = (page - 1) * limit;

    if (q.category && !VALID_CATEGORIES.includes(q.category)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: `category must be one of: ${VALID_CATEGORIES.join(", ")}` } } as ApiResponse);
    }
    if (q.status && !VALID_STATUSES.includes(q.status)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: `status must be one of: ${VALID_STATUSES.join(", ")}` } } as ApiResponse);
    }

    const where = {
      isApproved: true,
      isRejected: false,
      ...(q.category ? { category: q.category } : {}),
      ...(q.status ? { status: q.status } : {}),
    };

    const orderBy = q.sort === "newest"
      ? { createdAt: "desc" as const }
      : { voteCount: "desc" as const };

    const [requests, total] = await Promise.all([
      prisma.featureRequest.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          category: true,
          title: true,
          description: true,
          anonAlias: true,
          status: true,
          voteCount: true,
          createdAt: true,
          // Include voter IDs so frontend can highlight if current user voted
          votes: { select: { voterId: true } },
        },
      }),
      prisma.featureRequest.count({ where }),
    ]);

    // authorId is never exposed to clients — select block excludes it
    return { success: true, data: requests, meta: { requestId: scope.requestId, page, limit, total } } as ApiResponse<typeof requests>;
  });

  // ── POST /portal/feature-requests ─────────────────────────────────────────
  app.post("/portal/feature-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only clients may submit feature requests." } } as ApiResponse);
    }
    const body = request.body as { category?: string; title?: string; description?: string };
    if (!body.category || !body.title || !body.description) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "category, title, and description are required." } } as ApiResponse);
    }
    if (!VALID_CATEGORIES.includes(body.category)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: `category must be one of: ${VALID_CATEGORIES.join(", ")}` } } as ApiResponse);
    }

    const anonAlias = generateAlias(scope.userId ?? scope.clientId ?? "unknown");
    const fr = await prisma.featureRequest.create({
      data: {
        category: body.category,
        title: body.title.slice(0, 200),
        description: body.description,
        authorId: scope.userId ?? scope.clientId ?? "unknown",
        anonAlias,
        isApproved: false,
        isRejected: false,
      },
      select: { id: true, category: true, title: true, anonAlias: true, status: true, createdAt: true },
    });

    return reply.code(201).send({ success: true, data: fr, meta: { requestId: scope.requestId } } as ApiResponse<typeof fr>);
  });

  // ── POST /portal/feature-requests/:id/vote ────────────────────────────────
  app.post("/portal/feature-requests/:id/vote", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only clients may vote." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const voterId = scope.userId ?? scope.clientId ?? "unknown";

    const fr = await prisma.featureRequest.findFirst({ where: { id, isApproved: true, isRejected: false } });
    if (!fr) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Feature request not found." } } as ApiResponse);
    }
    // Clients cannot vote on their own submission
    if (fr.authorId === voterId) {
      return reply.code(409).send({ success: false, error: { code: "SELF_VOTE", message: "You cannot vote on your own submission." } } as ApiResponse);
    }

    let voted = false;
    let voteCount = 0;
    await prisma.$transaction(async (tx) => {
      const existing = await tx.featureVote.findUnique({
        where: { featureRequestId_voterId: { featureRequestId: id, voterId } },
      });
      if (existing) {
        await tx.featureVote.delete({ where: { id: existing.id } });
        const updated = await tx.featureRequest.update({
          where: { id },
          data: { voteCount: { decrement: 1 } },
          select: { voteCount: true },
        });
        voted = false;
        voteCount = updated.voteCount;
      } else {
        await tx.featureVote.create({ data: { featureRequestId: id, voterId } });
        const updated = await tx.featureRequest.update({
          where: { id },
          data: { voteCount: { increment: 1 } },
          select: { voteCount: true },
        });
        voted = true;
        voteCount = updated.voteCount;
      }
    });

    return { success: true, data: { voted, voteCount }, meta: { requestId: scope.requestId } } as ApiResponse;
  });

  // ── PATCH /admin/feature-requests/:id ─────────────────────────────────────
  app.patch("/admin/feature-requests/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { isApproved?: boolean; isRejected?: boolean; status?: string };

    if (body.isApproved === true && body.isRejected === true) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "isApproved and isRejected cannot both be true." } } as ApiResponse);
    }
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: `status must be one of: ${VALID_STATUSES.join(", ")}` } } as ApiResponse);
    }

    try {
      const fr = await prisma.featureRequest.update({
        where: { id },
        data: {
          ...(body.isApproved !== undefined ? { isApproved: body.isApproved } : {}),
          ...(body.isRejected !== undefined ? { isRejected: body.isRejected } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
        },
        select: { id: true, isApproved: true, isRejected: true, status: true, voteCount: true },
      });
      return { success: true, data: fr, meta: { requestId: scope.requestId } } as ApiResponse<typeof fr>;
    } catch (err) {
      const e = err as { code?: string };
      if (e.code === "P2025") {
        return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Feature request not found." } } as ApiResponse);
      }
      throw err;
    }
  });

  // ── GET /admin/feature-requests ───────────────────────────────────────────
  app.get("/admin/feature-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const q = request.query as { sort?: string };
    const orderBy = q.sort === "newest" ? { createdAt: "desc" as const } : { voteCount: "desc" as const };

    // authorId intentionally included for admin — they need to see real company identity
    const requests = await prisma.featureRequest.findMany({
      orderBy,
      select: {
        id: true,
        category: true,
        title: true,
        authorId: true,
        anonAlias: true,
        status: true,
        voteCount: true,
        isApproved: true,
        isRejected: true,
        createdAt: true,
      },
    });

    return { success: true, data: requests, meta: { requestId: scope.requestId } } as ApiResponse<typeof requests>;
  });
}
