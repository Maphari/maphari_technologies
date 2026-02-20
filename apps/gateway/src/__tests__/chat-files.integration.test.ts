import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { createGatewayApp } from "../app.js";

function createClientToken(clientId: string): string {
  return jwt.sign(
    {
      sub: "user-chat-files",
      role: "CLIENT",
      clientId
    },
    process.env.JWT_ACCESS_SECRET!,
    {
      issuer: "maphari-auth",
      audience: "maphari-api"
    }
  );
}

describe("gateway chat/files proxy integration", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.CHAT_SERVICE_URL = "http://chat.test";
    process.env.FILES_SERVICE_URL = "http://files.test";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards jwt-scoped headers to chat conversations list route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "GET",
      url: "/api/v1/conversations",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440111")}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://chat.test/conversations",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "x-user-id": "user-chat-files",
          "x-user-role": "CLIENT",
          "x-client-id": "550e8400-e29b-41d4-a716-446655440111"
        })
      })
    );

    await app.close();
  });

  it("forwards conversation message route params to chat upstream", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const conversationId = "550e8400-e29b-41d4-a716-446655440222";
    const response = await app.getHttpAdapter().getInstance().inject({
      method: "GET",
      url: `/api/v1/conversations/${conversationId}/messages`,
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440111")}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://chat.test/conversations/${conversationId}/messages`,
      expect.objectContaining({
        method: "GET"
      })
    );

    await app.close();
  });

  it("rejects invalid message payload before proxying", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/messages",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440111")}`
      },
      payload: {
        conversationId: "not-a-uuid",
        content: ""
      }
    });

    expect(response.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();

    await app.close();
  });

  it("forwards validated file create payload to files upstream", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "file-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const payload = {
      clientId: "550e8400-e29b-41d4-a716-446655440999",
      fileName: "brief.pdf",
      storageKey: "uploads/brief.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024
    };

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/files",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440111")}`
      },
      payload
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://files.test/files",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          "x-user-id": "user-chat-files",
          "x-user-role": "CLIENT"
        })
      })
    );

    await app.close();
  });

  it("rejects invalid upload-url payload before proxying", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/files/upload-url",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440111")}`
      },
      payload: {
        fileName: "",
        mimeType: "application/pdf",
        sizeBytes: 0
      }
    });

    expect(response.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    await app.close();
  });

  it("forwards validated confirm-upload payload to files upstream", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "file-2" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const payload = {
      fileName: "brief.pdf",
      storageKey: "uploads-brief-pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      uploadToken: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    };

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/files/confirm-upload",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440111")}`
      },
      payload
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://files.test/files/confirm-upload",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          "x-user-id": "user-chat-files",
          "x-user-role": "CLIENT"
        })
      })
    );
    await app.close();
  });
});
