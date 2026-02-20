import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { signWebhookPayload } from "@maphari/platform";
import { createGatewayApp } from "../app.js";

function createClientToken(clientId: string): string {
  return jwt.sign(
    {
      sub: "user-phase7",
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

function createAdminToken(): string {
  return jwt.sign(
    {
      sub: "admin-phase7",
      role: "ADMIN"
    },
    process.env.JWT_ACCESS_SECRET!,
    {
      issuer: "maphari-auth",
      audience: "maphari-api"
    }
  );
}

describe("gateway phase7 proxy integration", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.CORE_SERVICE_URL = "http://core.test";
    process.env.AI_SERVICE_URL = "http://ai.test";
    process.env.ANALYTICS_SERVICE_URL = "http://analytics.test";
    process.env.NOTIFICATIONS_SERVICE_URL = "http://notifications.test";
    process.env.PUBLIC_API_SERVICE_URL = "http://public-api.test";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards AI generate with jwt-scoped tenant headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "job-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/ai/generate",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440661")}`
      },
      payload: {
        prompt: "Generate roadmap"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://ai.test/ai/generate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-user-id": "user-phase7",
          "x-user-role": "CLIENT",
          "x-client-id": "550e8400-e29b-41d4-a716-446655440661"
        })
      })
    );

    await app.close();
  });

  it("rejects invalid analytics ingest payload before proxying", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/analytics/events",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440662")}`
      },
      payload: {
        eventName: ""
      }
    });

    expect(response.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    await app.close();
  });

  it("forwards notifications provider callback as public route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "job-1", status: "SENT" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const payload = {
      provider: "twilio",
      externalId: "job-1",
      status: "delivered"
    };

    const callbackSignature = signWebhookPayload(JSON.stringify(payload), "callback-secret");

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/notifications/provider-callback",
      headers: {
        "x-provider-name": "twilio",
        "x-provider-signature": callbackSignature
      },
      payload
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://notifications.test/notifications/provider-callback",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-provider-name": "twilio",
          "x-provider-signature": callbackSignature
        })
      })
    );
    await app.close();
  });

  it("forwards public-api partner request with signature headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "proj-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/public-api/projects",
      headers: {
        "x-api-key-id": "pk_123",
        "x-api-signature": "sig_123"
      },
      payload: {
        name: "Partner project"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://public-api.test/public-api/projects",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-key-id": "pk_123",
          "x-api-signature": "sig_123"
        })
      })
    );

    await app.close();
  });

  it("rejects invalid public-api project payload before proxying", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/public-api/projects",
      headers: {
        "x-api-key-id": "pk_123",
        "x-api-signature": "sig_123"
      },
      payload: {
        name: ""
      }
    });

    expect(response.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    await app.close();
  });

  it("requires ADMIN/STAFF role for issuing partner keys", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const clientResponse = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/public-api/keys",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440663")}`
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440663",
        label: "Partner"
      }
    });

    expect(clientResponse.statusCode).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();

    const adminFetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "key-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", adminFetchMock);

    const adminResponse = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/public-api/keys",
      headers: {
        authorization: `Bearer ${createAdminToken()}`
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440663",
        label: "Partner"
      }
    });

    expect(adminResponse.statusCode).toBe(201);
    expect(adminFetchMock).toHaveBeenCalled();

    await app.close();
  });

  it("forwards ai lead qualification endpoint with scoped headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "job-lead" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/ai/lead-qualify",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440661")}`
      },
      payload: {
        leadId: "550e8400-e29b-41d4-a716-446655440111",
        prompt: "Qualify this lead"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://ai.test/ai/lead-qualify",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-user-role": "CLIENT",
          "x-client-id": "550e8400-e29b-41d4-a716-446655440661"
        })
      })
    );
    await app.close();
  });

  it("forwards maintenance check to core for STAFF role", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { checkId: "chk-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const staffToken = jwt.sign(
      { sub: "staff-1", role: "STAFF" },
      process.env.JWT_ACCESS_SECRET!,
      { issuer: "maphari-auth", audience: "maphari-api" }
    );

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/ops/maintenance/checks",
      headers: {
        authorization: `Bearer ${staffToken}`
      },
      payload: {
        checkType: "SSL",
        status: "PASS"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://core.test/ops/maintenance/checks",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-user-role": "STAFF"
        })
      })
    );
    await app.close();
  });

  it("accepts public contact requests and forwards scoped lead creation", async () => {
    process.env.PUBLIC_CONTACT_CLIENT_ID = "550e8400-e29b-41d4-a716-446655440777";
    process.env.PUBLIC_CONTACT_ALLOWED_ORIGINS = "http://localhost:3000";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "lead-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/public/contact-requests",
      headers: {
        origin: "http://localhost:3000"
      },
      payload: {
        name: "Prospect One",
        email: "prospect@example.com",
        service: "Web Development",
        message: "Need a scoped build roadmap and maintenance plan.",
        company: "",
        startedAt: new Date(Date.now() - 5000).toISOString(),
        pagePath: "/contact"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://core.test/leads",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-user-id": "public-contact",
          "x-user-role": "STAFF",
          "x-client-id": "550e8400-e29b-41d4-a716-446655440777"
        })
      })
    );

    await app.close();
  });

  it("short-circuits contact spam requests when honeypot is filled", async () => {
    process.env.PUBLIC_CONTACT_CLIENT_ID = "550e8400-e29b-41d4-a716-446655440777";
    process.env.PUBLIC_CONTACT_ALLOWED_ORIGINS = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/public/contact-requests",
      payload: {
        name: "Spam Bot",
        email: "bot@example.com",
        service: "Automation",
        message: "spam spam spam spam spam",
        company: "hidden-field-filled"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).not.toHaveBeenCalled();

    await app.close();
  });
});
