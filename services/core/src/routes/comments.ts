// ════════════════════════════════════════════════════════════════════════════
// comments.ts — Generic entity comment routes
// Endpoints : GET  /comments?entityType=X&entityId=Y
//             POST /comments  body: { entityType, entityId, message, authorName }
// Scope     : ADMIN / STAFF / CLIENT (all roles can comment)
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { resolveMentions, notifyMentions } from "../lib/mentions.js";

const ALLOWED_ENTITY_TYPES = new Set(["deliverable", "task", "invoice", "milestone", "ticket"]);

export async function registerCommentRoutes(app: FastifyInstance): Promise<void> {

  /** GET /comments?entityType=X&entityId=Y */
  app.get("/comments", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { entityType, entityId } = request.query as { entityType?: string; entityId?: string };

    if (!entityType || !entityId || !ALLOWED_ENTITY_TYPES.has(entityType)) {
      reply.status(400);
      return { success: false, error: { code: "INVALID_PARAMS", message: "entityType and entityId are required." } } as ApiResponse;
    }

    try {
      const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
      const data = await prisma.entityComment.findMany({
        where: {
          entityType,
          entityId,
          ...(scopedClientId ? { clientId: scopedClientId } : {}),
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, authorName: true, authorRole: true, message: true, createdAt: true }
      });
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "COMMENTS_FETCH_FAILED", message: "Unable to fetch comments." } } as ApiResponse;
    }
  });

  /** POST /comments */
  app.post("/comments", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = request.body as { entityType?: string; entityId?: string; message?: string; authorName?: string };

    if (!body.entityType || !body.entityId || !body.message || !ALLOWED_ENTITY_TYPES.has(body.entityType)) {
      reply.status(400);
      return { success: false, error: { code: "INVALID_PARAMS", message: "entityType, entityId and message are required." } } as ApiResponse;
    }

    try {
      const comment = await prisma.entityComment.create({
        data: {
          clientId: scope.clientId ?? "system",
          entityType: body.entityType,
          entityId: body.entityId,
          message: body.message.trim(),
          authorName: (body.authorName ?? scope.userId ?? "User").slice(0, 128),
          authorRole: scope.role,
        },
        select: { id: true, authorName: true, authorRole: true, message: true, createdAt: true }
      });
      const mentions = await resolveMentions(body.message);
      if (mentions.length > 0) {
        notifyMentions(mentions, {
          commentId:  comment.id,
          entityType: body.entityType,
          entityId:   body.entityId,
          authorName: body.authorName ?? scope.userId ?? null,
          excerpt:    body.message.slice(0, 100),
          clientId:   scope.clientId ?? null,
        });
      }

      reply.status(201);
      return { success: true, data: comment } as ApiResponse<typeof comment>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "COMMENT_CREATE_FAILED", message: "Unable to post comment." } } as ApiResponse;
    }
  });
}
