// ════════════════════════════════════════════════════════════════════════════
// forum.ts — Community Forum routes
// Service : core
// Scope   : CLIENT (read approved, create own) | ADMIN (moderate, approve, reject)
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";
import { generateAlias } from "../lib/alias.js";

export async function registerForumRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /portal/forum/threads ─────────────────────────────────────────────
  app.get("/portal/forum/threads", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const q = request.query as { category?: string; page?: string; limit?: string };
    const page = Math.max(1, parseInt(q.page ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? "20", 10)));
    const skip = (page - 1) * limit;

    const validCategories = ["tips", "qa", "announcements", "general"];
    if (q.category && !validCategories.includes(q.category)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: `category must be one of: ${validCategories.join(", ")}` } } as ApiResponse);
    }

    const where = {
      isApproved: true,
      isRejected: false,
      ...(q.category ? { category: q.category } : {}),
    };

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          category: true,
          title: true,
          anonAlias: true,
          isPinned: true,
          isLocked: true,
          createdAt: true,
          _count: { select: { posts: { where: { isApproved: true, isRejected: false } } } },
        },
      }),
      prisma.forumThread.count({ where }),
    ]);

    // Never expose authorId to clients
    const data = threads.map(({ _count, ...t }) => ({ ...t, replyCount: _count.posts }));
    return { success: true, data, meta: { requestId: scope.requestId, page, limit, total } } as ApiResponse<typeof data>;
  });

  // ── POST /portal/forum/threads ────────────────────────────────────────────
  app.post("/portal/forum/threads", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only clients may post threads." } } as ApiResponse);
    }
    const body = request.body as { category?: string; title?: string; body?: string };
    if (!body.category || !body.title) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "category and title are required." } } as ApiResponse);
    }
    const validCategories = ["tips", "qa", "announcements", "general"];
    if (!validCategories.includes(body.category)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: `category must be one of: ${validCategories.join(", ")}` } } as ApiResponse);
    }

    const anonAlias = generateAlias(scope.userId ?? scope.clientId ?? "unknown");
    const thread = await prisma.forumThread.create({
      data: {
        category: body.category,
        title: body.title.slice(0, 200),
        authorId: scope.userId ?? scope.clientId ?? "unknown",
        anonAlias,
        isApproved: false,
        isRejected: false,
      },
      select: { id: true, category: true, title: true, anonAlias: true, createdAt: true },
    });

    return reply.code(201).send({ success: true, data: thread, meta: { requestId: scope.requestId } } as ApiResponse<typeof thread>);
  });

  // ── GET /portal/forum/threads/:id ─────────────────────────────────────────
  app.get("/portal/forum/threads/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };

    const thread = await prisma.forumThread.findFirst({
      where: { id, isApproved: true, isRejected: false },
      select: {
        id: true,
        category: true,
        title: true,
        anonAlias: true,
        isPinned: true,
        isLocked: true,
        createdAt: true,
        posts: {
          where: { isApproved: true, isRejected: false },
          orderBy: { createdAt: "asc" },
          select: { id: true, anonAlias: true, body: true, createdAt: true },
        },
      },
    });

    if (!thread) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Thread not found." } } as ApiResponse);
    }

    return { success: true, data: thread, meta: { requestId: scope.requestId } } as ApiResponse<typeof thread>;
  });

  // ── POST /portal/forum/threads/:id/posts ──────────────────────────────────
  app.post("/portal/forum/threads/:id/posts", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only clients may reply." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { body?: string };
    if (!body.body?.trim()) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "body is required." } } as ApiResponse);
    }
    if (body.body.length > 10000) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Post body must not exceed 10,000 characters." } } as ApiResponse);
    }

    const anonAlias = generateAlias(scope.userId ?? scope.clientId ?? "unknown");
    const authorId = scope.userId ?? scope.clientId ?? "unknown";

    let newPost: { id: string; anonAlias: string; body: string; createdAt: Date };
    try {
      newPost = await prisma.$transaction(async (tx) => {
        const thread = await tx.forumThread.findFirst({
          where: { id, isApproved: true, isRejected: false },
          select: { isLocked: true },
        });
        if (!thread) throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
        if (thread.isLocked) throw Object.assign(new Error("LOCKED"), { code: "LOCKED" });
        return tx.forumPost.create({
          data: {
            threadId: id,
            authorId,
            anonAlias,
            body: body.body,
            isApproved: false,
            isRejected: false,
          },
          select: { id: true, anonAlias: true, body: true, createdAt: true },
        });
      });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "NOT_FOUND") {
        return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Thread not found." } } as ApiResponse);
      }
      if (e.code === "LOCKED") {
        return reply.code(423).send({ success: false, error: { code: "LOCKED", message: "Thread is locked." } } as ApiResponse);
      }
      throw err;
    }

    return reply.code(201).send({ success: true, data: newPost, meta: { requestId: scope.requestId } } as ApiResponse<typeof newPost>);
  });

  // ── PATCH /admin/forum/threads/:id ────────────────────────────────────────
  app.patch("/admin/forum/threads/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { isApproved?: boolean; isRejected?: boolean; isPinned?: boolean; isLocked?: boolean };

    if (body.isApproved === true && body.isRejected === true) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "isApproved and isRejected cannot both be true." } } as ApiResponse);
    }

    try {
      const thread = await prisma.forumThread.update({
        where: { id },
        data: {
          ...(body.isApproved !== undefined ? { isApproved: body.isApproved } : {}),
          ...(body.isRejected !== undefined ? { isRejected: body.isRejected } : {}),
          ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
          ...(body.isLocked !== undefined ? { isLocked: body.isLocked } : {}),
        },
        select: { id: true, isApproved: true, isRejected: true, isPinned: true, isLocked: true },
      });
      return { success: true, data: thread, meta: { requestId: scope.requestId } } as ApiResponse<typeof thread>;
    } catch (err) {
      const e = err as { code?: string };
      if (e.code === "P2025") {
        return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Thread not found." } } as ApiResponse);
      }
      throw err;
    }
  });

  // ── PATCH /admin/forum/posts/:id ──────────────────────────────────────────
  app.patch("/admin/forum/posts/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { isApproved?: boolean; isRejected?: boolean };

    if (body.isApproved === true && body.isRejected === true) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "isApproved and isRejected cannot both be true." } } as ApiResponse);
    }

    try {
      const post = await prisma.forumPost.update({
        where: { id },
        data: {
          ...(body.isApproved !== undefined ? { isApproved: body.isApproved } : {}),
          ...(body.isRejected !== undefined ? { isRejected: body.isRejected } : {}),
        },
        select: { id: true, isApproved: true, isRejected: true },
      });
      return { success: true, data: post, meta: { requestId: scope.requestId } } as ApiResponse<typeof post>;
    } catch (err) {
      const e = err as { code?: string };
      if (e.code === "P2025") {
        return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Post not found." } } as ApiResponse);
      }
      throw err;
    }
  });

  // ── GET /admin/forum/moderation-queue ─────────────────────────────────────
  app.get("/admin/forum/moderation-queue", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }

    // authorId is intentionally included here — admins need to see real company identity for moderation decisions.
    // authorId is never returned from client-facing portal routes.
    const [threads, posts, featureRequests] = await Promise.all([
      prisma.forumThread.findMany({
        where: { isApproved: false, isRejected: false },
        orderBy: { createdAt: "asc" },
        select: { id: true, category: true, title: true, anonAlias: true, authorId: true, createdAt: true },
      }),
      prisma.forumPost.findMany({
        where: { isApproved: false, isRejected: false },
        orderBy: { createdAt: "asc" },
        select: { id: true, threadId: true, body: true, anonAlias: true, authorId: true, createdAt: true },
      }),
      prisma.featureRequest.findMany({
        where: { isApproved: false, isRejected: false },
        orderBy: { createdAt: "asc" },
        select: { id: true, category: true, title: true, description: true, anonAlias: true, authorId: true, createdAt: true },
      }),
    ]);

    const data = {
      threads: threads.map((t) => ({ ...t, type: "thread" as const })),
      posts: posts.map((p) => ({ ...p, type: "post" as const })),
      featureRequests: featureRequests.map((fr) => ({ ...fr, type: "feature_request" as const })),
      total: threads.length + posts.length + featureRequests.length,
    };

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });
}
