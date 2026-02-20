import { ServiceMetrics } from "@maphari/platform";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { io as createClient, type Socket } from "socket.io-client";
import { createRealtimeGateway } from "../lib/realtime.js";

interface JoinAck {
  ok: boolean;
  error?: string;
}

interface SendAck {
  ok: boolean;
  error?: string;
  messageId?: string;
}

async function connectClient(url: string, clientId: string): Promise<Socket> {
  const socket = createClient(url, {
    transports: ["websocket"],
    auth: {
      role: "CLIENT",
      clientId
    }
  });

  await new Promise<void>((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("connect_error", (error) => reject(error));
  });

  return socket;
}

async function joinConversation(socket: Socket, conversationId: string): Promise<JoinAck> {
  return new Promise((resolve) => {
    socket.emit("conversation:join", { conversationId }, (ack: JoinAck) => resolve(ack));
  });
}

function waitForMessage(socket: Socket): Promise<{ id: string; conversationId: string; clientId: string; content: string }> {
  return new Promise((resolve) => {
    socket.once("message:created", (payload) => resolve(payload));
  });
}

async function sendMessage(socket: Socket, conversationId: string, content: string): Promise<SendAck> {
  return new Promise((resolve) => {
    socket.emit("message:send", { conversationId, content }, (ack: SendAck) => resolve(ack));
  });
}

describe("chat realtime integration", () => {
  const sockets: Socket[] = [];

  afterEach(() => {
    for (const socket of sockets) {
      socket.disconnect();
    }
    sockets.length = 0;
  });

  it("delivers conversation messages between active sessions in same tenant", async () => {
    const metrics = new ServiceMetrics();
    const server = createServer();
    const gateway = await createRealtimeGateway({
      server,
      metrics,
      redisUrl: "redis://localhost:6379",
      resolveConversationClientId: async (conversationId) => (conversationId === "conv-1" ? "client-1" : null),
      enableRedisAdapter: false
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const url = `http://127.0.0.1:${port}`;

    const sender = await connectClient(url, "client-1");
    const receiver = await connectClient(url, "client-1");
    sockets.push(sender, receiver);

    expect((await joinConversation(sender, "conv-1")).ok).toBe(true);
    expect((await joinConversation(receiver, "conv-1")).ok).toBe(true);

    const receivedPromise = waitForMessage(receiver);
    const sendResult = await sendMessage(sender, "conv-1", "hello room");
    expect(sendResult.ok).toBe(true);
    expect(sendResult.messageId).toBeTruthy();

    const received = await receivedPromise;
    expect(received.conversationId).toBe("conv-1");
    expect(received.clientId).toBe("client-1");
    expect(received.content).toBe("hello room");

    const renderedMetrics = metrics.renderPrometheus();
    expect(renderedMetrics).toContain("chat_socket_connections_active");
    expect(renderedMetrics).toContain("chat_message_emit_latency_ms_count");

    await gateway.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("blocks cross-tenant room joins and prevents message leakage", async () => {
    const metrics = new ServiceMetrics();
    const server = createServer();
    const gateway = await createRealtimeGateway({
      server,
      metrics,
      redisUrl: "redis://localhost:6379",
      resolveConversationClientId: async (conversationId) => (conversationId === "conv-1" ? "client-1" : null),
      enableRedisAdapter: false
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const url = `http://127.0.0.1:${port}`;

    const foreignClient = await connectClient(url, "client-2");
    sockets.push(foreignClient);

    const joinResult = await joinConversation(foreignClient, "conv-1");
    expect(joinResult.ok).toBe(false);
    expect(joinResult.error).toBe("forbidden");

    let leakedMessage = false;
    foreignClient.once("message:created", () => {
      leakedMessage = true;
    });

    await gateway.emitMessageCreated({
      id: "message-2",
      conversationId: "conv-1",
      clientId: "client-1",
      authorId: null,
      authorRole: "STAFF",
      deliveryStatus: "SENT",
      deliveredAt: null,
      readAt: null,
      content: "tenant isolated",
      createdAt: new Date().toISOString()
    });

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(leakedMessage).toBe(false);

    await gateway.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
