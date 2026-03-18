// ════════════════════════════════════════════════════════════════════════════
// knowledge-articles.ts — Knowledge base article routes
// Service : core  |  Cache TTL: 120 s (list), 300 s (single), invalidate on write
// Scope   : ADMIN/STAFF full; CLIENT sees PUBLISHED only
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { KnowledgeArticle } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { withCache, cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTO ───────────────────────────────────────────────────────────────────────
type KnowledgeArticleDto = {
  id: string;
  title: string;
  category: string | null;
  content: string;
  authorId: string | null;
  authorName: string | null;
  status: string;
  publishedAt: string | null;
  tags: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

function toDto(a: KnowledgeArticle): KnowledgeArticleDto {
  return {
    ...a,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    createdAt:   a.createdAt.toISOString(),
    updatedAt:   a.updatedAt.toISOString(),
  };
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerKnowledgeArticleRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /knowledge ──────────────────────────────────────────────────────────
  app.get("/knowledge", async (request) => {
    const scope = readScopeHeaders(request);
    const isAdmin = scope.role === "ADMIN";
    const isStaff = scope.role === "STAFF";
    const cacheScope = isAdmin ? "admin" : isStaff ? "staff" : "client";

    try {
      const data = await withCache(CacheKeys.knowledge(cacheScope), 120, () =>
        prisma.knowledgeArticle.findMany({
          where: (isAdmin || isStaff) ? {} : { status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
        }).then((rows) => rows.map(toDto))
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<KnowledgeArticleDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "KNOWLEDGE_FETCH_FAILED", message: "Unable to fetch articles" } } as ApiResponse;
    }
  });

  // ── GET /knowledge/:id ──────────────────────────────────────────────────────
  app.get("/knowledge/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };

    try {
      const data = await withCache(CacheKeys.knowledgeArticle(id), 300, async () => {
        const article = await prisma.knowledgeArticle.findUnique({ where: { id } });
        return article ? toDto(article) : null;
      });

      if (!data) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Article not found" } } as ApiResponse;
      }

      // CLIENT can only see published articles
      if (scope.role === "CLIENT" && data.status !== "PUBLISHED") {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Article not published" } } as ApiResponse;
      }

      return { success: true, data } as ApiResponse<KnowledgeArticleDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "KNOWLEDGE_FETCH_FAILED", message: "Unable to fetch article" } } as ApiResponse;
    }
  });

  // ── POST /knowledge ─────────────────────────────────────────────────────────
  app.post("/knowledge", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const body = request.body as {
      title: string;
      content: string;
      category?: string;
      tags?: string;
      authorName?: string;
    };

    if (!body.title || !body.content) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "title and content are required" } } as ApiResponse;
    }

    try {
      const article = await prisma.knowledgeArticle.create({
        data: {
          title:      body.title,
          content:    body.content,
          category:   body.category ?? null,
          tags:       body.tags ?? null,
          authorId:   scope.userId ?? null,
          authorName: body.authorName ?? null,
          status:     "DRAFT",
        },
      });

      // Invalidate list caches
      await Promise.all([
        cache.delete(CacheKeys.knowledge("admin")),
        cache.delete(CacheKeys.knowledge("staff")),
      ]);

      reply.status(201);
      return { success: true, data: toDto(article) } as ApiResponse<KnowledgeArticleDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "KNOWLEDGE_CREATE_FAILED", message: "Unable to create article" } } as ApiResponse;
    }
  });

  // ── PATCH /knowledge/:id ────────────────────────────────────────────────────
  app.patch("/knowledge/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      title: string;
      content: string;
      category: string;
      tags: string;
      status: string;
    }>;

    try {
      const data: Record<string, unknown> = {};
      if (body.title)    data.title    = body.title;
      if (body.content)  data.content  = body.content;
      if (body.category) data.category = body.category;
      if (body.tags)     data.tags     = body.tags;
      if (body.status) {
        data.status = body.status;
        if (body.status === "PUBLISHED") data.publishedAt = new Date();
      }

      const article = await prisma.knowledgeArticle.update({ where: { id }, data });

      // Invalidate caches
      await Promise.all([
        cache.delete(CacheKeys.knowledge("admin")),
        cache.delete(CacheKeys.knowledge("staff")),
        cache.delete(CacheKeys.knowledge("client")),
        cache.delete(CacheKeys.knowledgeArticle(id)),
      ]);

      return { success: true, data: toDto(article) } as ApiResponse<KnowledgeArticleDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "KNOWLEDGE_UPDATE_FAILED", message: "Unable to update article" } } as ApiResponse;
    }
  });

  // ── POST /knowledge/:id/view ────────────────────────────────────────────────
  // Increments viewCount; fire-and-forget, always returns success
  app.post("/knowledge/:id/view", async (request) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.knowledgeArticle.update({
        where: { id },
        data:  { viewCount: { increment: 1 } },
      });
      // Invalidate single-article cache so viewCount is fresh
      await cache.delete(CacheKeys.knowledgeArticle(id));
    } catch (_) { /* best-effort */ }
    return { success: true, data: null } as ApiResponse<null>;
  });
}
