import type { FastifyInstance } from "fastify";
import { createMessageSchema, type ApiResponse, updateMessageDeliverySchema } from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import type { ServiceMetrics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys, eventBus } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import type { RealtimeMessagePayload } from "../app.js";

interface MessageRouteDependencies {
  broadcastRealtimeMessage?: (payload: RealtimeMessagePayload) => Promise<void>;
}

function asDeliveryStatus(value: string): "SENT" | "DELIVERED" | "READ" {
  if (value === "DELIVERED" || value === "READ") return value;
  return "SENT";
}

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

export async function registerMessageRoutes(
  app: FastifyInstance,
  deps: MessageRouteDependencies = {}
): Promise<void> {
  app.get<{ Params: { conversationId: string } }>("/conversations/:conversationId/messages", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const conversationId = request.params.conversationId;

    try {
      const conversation = await observeDb(app, "conversation.findUnique", () =>
        prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { clientId: true }
        })
      );

      if (!conversation) {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "CONVERSATION_NOT_FOUND",
            message: "Conversation not found"
          }
        } as ApiResponse;
      }

      const expectedClientId = resolveClientFilter(scope.role, scope.clientId, conversation.clientId);
      // Enforce tenant ownership on nested resource reads for CLIENT role.
      if (scope.role === "CLIENT" && expectedClientId !== conversation.clientId) {
        reply.status(403);
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Conversation does not belong to scoped client"
          }
        } as ApiResponse;
      }

      const cacheKey = CacheKeys.messages(conversationId);
      const cached = await cache.getJson<Awaited<ReturnType<typeof prisma.message.findMany>>>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          meta: { requestId: scope.requestId, cache: "hit" }
        } as ApiResponse<typeof cached>;
      }

      const messages = await observeDb(app, "message.findMany", () =>
        prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: "asc" }
        })
      );

      // Cache per conversation to isolate invalidation to affected threads.
      await cache.setJson(cacheKey, messages, 30);

      return {
        success: true,
        data: messages,
        meta: { requestId: scope.requestId, cache: "miss" }
      } as ApiResponse<typeof messages>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "MESSAGES_FETCH_FAILED",
          message: "Unable to fetch messages"
        }
      } as ApiResponse;
    }
  });

  app.post("/messages", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createMessageSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid message payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    try {
      const conversation = await observeDb(app, "conversation.findUnique", () =>
        prisma.conversation.findUnique({
          where: { id: parsedBody.data.conversationId },
          select: { clientId: true, assigneeUserId: true }
        })
      );

      if (!conversation) {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "CONVERSATION_NOT_FOUND",
            message: "Conversation not found"
          }
        } as ApiResponse;
      }

      const expectedClientId = resolveClientFilter(scope.role, scope.clientId, conversation.clientId);
      // Enforce tenant ownership before writes to prevent cross-tenant message injection.
      if (scope.role === "CLIENT" && expectedClientId !== conversation.clientId) {
        reply.status(403);
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Conversation does not belong to scoped client"
          }
        } as ApiResponse;
      }

      const message = await observeDb(app, "message.create", () =>
        prisma.message.create({
          data: {
            clientId: conversation.clientId,
            conversationId: parsedBody.data.conversationId,
            authorId: scope.userId ?? null,
            authorRole: scope.role ?? null,
            deliveryStatus: "SENT",
            content: parsedBody.data.content
          }
        })
      );

      await cache.delete(CacheKeys.messages(parsedBody.data.conversationId));

      if (
        (scope.role === "ADMIN" || scope.role === "STAFF") &&
        scope.userId &&
        !conversation.assigneeUserId
      ) {
        await observeDb(app, "conversation.update", () =>
          prisma.conversation.update({
            where: { id: parsedBody.data.conversationId },
            data: { assigneeUserId: scope.userId }
          })
        );
        await Promise.all([
          cache.delete(CacheKeys.conversations(conversation.clientId)),
          cache.delete(CacheKeys.conversations())
        ]);
      }

      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.messageCreated,
        payload: {
          messageId: message.id,
          conversationId: message.conversationId,
          clientId: message.clientId
        }
      });

      await deps.broadcastRealtimeMessage?.({
        id: message.id,
        clientId: message.clientId,
        conversationId: message.conversationId,
        authorId: message.authorId,
        authorRole: message.authorRole,
        deliveryStatus: asDeliveryStatus(message.deliveryStatus),
        deliveredAt: message.deliveredAt?.toISOString() ?? null,
        readAt: message.readAt?.toISOString() ?? null,
        content: message.content,
        createdAt: message.createdAt.toISOString()
      });

      return {
        success: true,
        data: message,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof message>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "MESSAGE_CREATE_FAILED",
          message: "Unable to create message"
        }
      } as ApiResponse;
    }
  });

  app.patch<{ Params: { messageId: string } }>("/messages/:messageId/delivery", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const messageId = request.params.messageId;
    const parsedBody = updateMessageDeliverySchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid delivery payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    try {
      const existing = await observeDb(app, "message.findUnique", () =>
        prisma.message.findUnique({
          where: { id: messageId },
          select: {
            id: true,
            clientId: true,
            conversationId: true
          }
        })
      );
      if (!existing) {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "MESSAGE_NOT_FOUND",
            message: "Message not found"
          }
        } as ApiResponse;
      }

      const expectedClientId = resolveClientFilter(scope.role, scope.clientId, existing.clientId);
      if (scope.role === "CLIENT" && expectedClientId !== existing.clientId) {
        reply.status(403);
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Message does not belong to scoped client"
          }
        } as ApiResponse;
      }

      const deliveredAt =
        parsedBody.data.status === "DELIVERED" || parsedBody.data.status === "READ"
          ? parsedBody.data.deliveredAt
            ? new Date(parsedBody.data.deliveredAt)
            : new Date()
          : null;
      const readAt =
        parsedBody.data.status === "READ"
          ? parsedBody.data.readAt
            ? new Date(parsedBody.data.readAt)
            : new Date()
          : null;

      const updated = await observeDb(app, "message.update", () =>
        prisma.message.update({
          where: { id: messageId },
          data: {
            deliveryStatus: parsedBody.data.status,
            deliveredAt,
            readAt
          }
        })
      );

      await cache.delete(CacheKeys.messages(existing.conversationId));

      await deps.broadcastRealtimeMessage?.({
        id: updated.id,
        clientId: updated.clientId,
        conversationId: updated.conversationId,
        authorId: updated.authorId,
        authorRole: updated.authorRole,
        deliveryStatus: asDeliveryStatus(updated.deliveryStatus),
        deliveredAt: updated.deliveredAt?.toISOString() ?? null,
        readAt: updated.readAt?.toISOString() ?? null,
        content: updated.content,
        createdAt: updated.createdAt.toISOString()
      });

      return {
        success: true,
        data: updated,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "MESSAGE_DELIVERY_UPDATE_FAILED",
          message: "Unable to update message delivery state"
        }
      } as ApiResponse;
    }
  });
}
