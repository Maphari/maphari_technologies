import type { FastifyInstance } from "fastify";
import {
  createConversationSchema,
  updateConversationAssigneeSchema,
  type ApiResponse
} from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import type { ServiceMetrics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys, eventBus } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

async function observeDb<T>(
  app: FastifyInstance,
  operation: string,
  query: () => Promise<T>
): Promise<T> {
  const metrics = (app as FastifyInstance & { serviceMetrics?: ServiceMetrics }).serviceMetrics;
  const startedAt = Date.now();
  const result = await query();
  metrics?.observe("db_query_duration_ms", Date.now() - startedAt, {
    service: "chat",
    operation
  });
  return result;
}

export async function registerConversationRoutes(app: FastifyInstance): Promise<void> {
  app.get("/conversations", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const whereClause = clientId ? { clientId } : {};
    const cacheKey = CacheKeys.conversations(clientId);

    try {
      const cached = await cache.getJson<Awaited<ReturnType<typeof prisma.conversation.findMany>>>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          meta: { requestId: scope.requestId, cache: "hit" }
        } as ApiResponse<typeof cached>;
      }

      const conversations = await observeDb(app, "conversation.findMany", () =>
        prisma.conversation.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" }
        })
      );

      // Keep list endpoints low-latency; writes invalidate this key eagerly.
      await cache.setJson(cacheKey, conversations, 30);

      return {
        success: true,
        data: conversations,
        meta: { requestId: scope.requestId, cache: "miss" }
      } as ApiResponse<typeof conversations>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: {
          code: "CONVERSATIONS_FETCH_FAILED",
          message: "Unable to fetch conversations"
        }
      } as ApiResponse;
    }
  });

  app.post("/conversations", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createConversationSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid conversation payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "client scope is required"
        }
      } as ApiResponse;
    }
    if (scope.role === "CLIENT" && parsedBody.data.assigneeUserId) {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "CLIENT role cannot assign conversations"
        }
      } as ApiResponse;
    }

    try {
      const assigneeUserId =
        scope.role === "ADMIN" || scope.role === "STAFF"
          ? (parsedBody.data.assigneeUserId ?? scope.userId ?? null)
          : null;
      const conversation = await observeDb(app, "conversation.create", () =>
        prisma.conversation.create({
          data: {
            clientId,
            assigneeUserId,
            subject: parsedBody.data.subject,
            projectId: parsedBody.data.projectId ?? null
          }
        })
      );

      await Promise.all([cache.delete(CacheKeys.conversations(clientId)), cache.delete(CacheKeys.conversations())]);

      // Publish after commit so downstream automation only sees persisted entities.
      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.conversationCreated,
        payload: {
          conversationId: conversation.id,
          clientId: conversation.clientId
        }
      });

      return {
        success: true,
        data: conversation,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof conversation>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "CONVERSATION_CREATE_FAILED",
          message: "Unable to create conversation"
        }
      } as ApiResponse;
    }
  });

  app.patch<{ Params: { conversationId: string } }>("/conversations/:conversationId/assignee", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Role not allowed to assign conversations"
        }
      } as ApiResponse;
    }

    const parsedBody = updateConversationAssigneeSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid assignee payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const conversationId = request.params.conversationId;
    try {
      const existing = await observeDb(app, "conversation.findUnique", () =>
        prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { id: true, clientId: true }
        })
      );
      if (!existing) {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "CONVERSATION_NOT_FOUND",
            message: "Conversation not found"
          }
        } as ApiResponse;
      }

      const conversation = await observeDb(app, "conversation.update", () =>
        prisma.conversation.update({
          where: { id: conversationId },
          data: { assigneeUserId: parsedBody.data.assigneeUserId }
        })
      );

      await Promise.all([
        cache.delete(CacheKeys.conversations(existing.clientId)),
        cache.delete(CacheKeys.conversations())
      ]);

      return {
        success: true,
        data: conversation,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof conversation>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "CONVERSATION_ASSIGNMENT_UPDATE_FAILED",
          message: "Unable to update conversation assignment"
        }
      } as ApiResponse;
    }
  });
}
