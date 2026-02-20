import type { Role } from "@maphari/contracts";
import type { ServiceMetrics } from "@maphari/platform";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Server as HttpServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Redis } from "ioredis";
import { Server, type Socket } from "socket.io";

type RealtimeLogger = Pick<Console, "info" | "warn" | "error">;

export interface RealtimeMessagePayload {
  id: string;
  clientId: string;
  conversationId: string;
  authorId: string | null;
  authorRole: string | null;
  deliveryStatus: "SENT" | "DELIVERED" | "READ";
  deliveredAt: string | null;
  readAt: string | null;
  content: string;
  createdAt: string;
}

interface SocketAuthPayload {
  role?: Role;
  clientId?: string;
}

interface JoinConversationPayload {
  conversationId?: string;
}

interface JoinConversationAck {
  ok: boolean;
  error?: string;
}

interface SendMessagePayload {
  conversationId?: string;
  content?: string;
}

interface SendMessageAck {
  ok: boolean;
  error?: string;
  messageId?: string;
}

interface RealtimeGatewayOptions {
  server: HttpServer;
  metrics: ServiceMetrics;
  redisUrl: string;
  resolveConversationClientId: (conversationId: string) => Promise<string | null>;
  logger?: RealtimeLogger;
  enableRedisAdapter?: boolean;
}

export interface RealtimeGateway {
  emitMessageCreated: (payload: RealtimeMessagePayload) => Promise<void>;
  close: () => Promise<void>;
}

/**
 * Stable room naming across instances keeps fan-out deterministic and tenant-safe.
 */
export function roomForConversation(clientId: string, conversationId: string): string {
  return `tenant:${clientId}:conversation:${conversationId}`;
}

function parseSocketAuth(socket: Socket): SocketAuthPayload {
  const auth = (socket.handshake.auth ?? {}) as SocketAuthPayload;
  return {
    role: (auth.role ?? "CLIENT") as Role,
    clientId: auth.clientId
  };
}

export async function createRealtimeGateway(options: RealtimeGatewayOptions): Promise<RealtimeGateway> {
  const io = new Server(options.server, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const log = options.logger ?? console;
  options.metrics.registerCounter("chat_socket_connections_active", "Active websocket connections for chat service");
  options.metrics.registerGauge("chat_socket_connections_current", "Current websocket connection count for chat service");
  options.metrics.registerCounter("chat_messages_emitted_total", "Total websocket messages emitted by chat service");
  options.metrics.registerHistogram("chat_message_emit_latency_ms", "Message emit latency in milliseconds", [
    1, 5, 10, 25, 50, 100, 250
  ]);

  const redisPublisher = new Redis(options.redisUrl, { lazyConnect: true });
  const redisSubscriber = redisPublisher.duplicate();
  if (options.enableRedisAdapter !== false) {
    try {
      await Promise.all([redisPublisher.connect(), redisSubscriber.connect()]);
      io.adapter(createAdapter(redisPublisher, redisSubscriber));
      log.info?.(`Socket.IO Redis adapter enabled (${options.redisUrl})`);
    } catch (error) {
      log.warn?.(`Socket.IO Redis adapter unavailable (${options.redisUrl}): ${String(error)}`);
      await Promise.allSettled([redisPublisher.quit(), redisSubscriber.quit()]);
    }
  }

  let activeConnections = 0;

  io.on("connection", (socket) => {
    options.metrics.inc("chat_socket_connections_active", { service: "chat" }, 1);
    activeConnections += 1;
    options.metrics.set("chat_socket_connections_current", activeConnections, { service: "chat" });

    socket.on("conversation:join", async (payload: JoinConversationPayload, ack?: (response: JoinConversationAck) => void) => {
      const conversationId = payload.conversationId;
      if (!conversationId) {
        ack?.({ ok: false, error: "conversationId is required" });
        return;
      }

      const auth = parseSocketAuth(socket);
      const conversationClientId = await options.resolveConversationClientId(conversationId);
      if (!conversationClientId) {
        ack?.({ ok: false, error: "conversation not found" });
        return;
      }

      // CLIENT sockets are pinned to their tenant and cannot join foreign conversation rooms.
      if (auth.role === "CLIENT" && auth.clientId !== conversationClientId) {
        ack?.({ ok: false, error: "forbidden" });
        return;
      }

      await socket.join(roomForConversation(conversationClientId, conversationId));
      ack?.({ ok: true });
    });

    socket.on("message:send", async (payload: SendMessagePayload, ack?: (response: SendMessageAck) => void) => {
      const conversationId = payload.conversationId;
      const content = payload.content?.trim();
      if (!conversationId || !content) {
        ack?.({ ok: false, error: "conversationId and content are required" });
        return;
      }

      const auth = parseSocketAuth(socket);
      const conversationClientId = await options.resolveConversationClientId(conversationId);
      if (!conversationClientId) {
        ack?.({ ok: false, error: "conversation not found" });
        return;
      }

      if (auth.role === "CLIENT" && auth.clientId !== conversationClientId) {
        ack?.({ ok: false, error: "forbidden" });
        return;
      }

      const message = {
        id: randomUUID(),
        clientId: conversationClientId,
        conversationId,
        authorId: null,
        authorRole: auth.role ?? "CLIENT",
        deliveryStatus: "SENT" as const,
        deliveredAt: null,
        readAt: null,
        content,
        createdAt: new Date().toISOString()
      };
      io.to(roomForConversation(message.clientId, message.conversationId)).emit("message:created", message);
      options.metrics.inc("chat_messages_emitted_total", { service: "chat" }, 1);
      options.metrics.observe("chat_message_emit_latency_ms", 0, { service: "chat" });
      ack?.({ ok: true, messageId: message.id });
    });

    socket.on("disconnect", () => {
      options.metrics.inc("chat_socket_connections_active", { service: "chat" }, -1);
      activeConnections = Math.max(activeConnections - 1, 0);
      options.metrics.set("chat_socket_connections_current", activeConnections, { service: "chat" });
    });
  });

  return {
    emitMessageCreated: async (payload) => {
      const startedAt = Date.now();
      io.to(roomForConversation(payload.clientId, payload.conversationId)).emit("message:created", payload);
      options.metrics.inc("chat_messages_emitted_total", { service: "chat" }, 1);
      options.metrics.observe("chat_message_emit_latency_ms", Date.now() - startedAt, { service: "chat" });
    },
    close: async () => {
      io.close();
      await Promise.allSettled([redisPublisher.quit(), redisSubscriber.quit()]);
    }
  };
}
