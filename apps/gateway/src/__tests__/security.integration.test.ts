import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { createGatewayApp } from "../app.js";
import { createCorsPolicy } from "../security/cors.js";

function createClientToken(clientId: string): string {
  return jwt.sign(
    {
      sub: "user-security",
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

describe("gateway security hardening", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.CORE_SERVICE_URL = "http://core.test";
    process.env.GATEWAY_RATE_LIMIT_PUBLIC_MAX = "2";
    process.env.GATEWAY_RATE_LIMIT_PUBLIC_WINDOW_MS = "60000";
    process.env.GATEWAY_RATE_LIMIT_PROTECTED_MAX = "2";
    process.env.GATEWAY_RATE_LIMIT_PROTECTED_WINDOW_MS = "60000";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GATEWAY_RATE_LIMIT_PUBLIC_MAX;
    delete process.env.GATEWAY_RATE_LIMIT_PUBLIC_WINDOW_MS;
    delete process.env.GATEWAY_RATE_LIMIT_PROTECTED_MAX;
    delete process.env.GATEWAY_RATE_LIMIT_PROTECTED_WINDOW_MS;
  });

  it("rate limits public endpoints after configured threshold", async () => {
    const app = await createGatewayApp();
    await app.init();
    const server = app.getHttpAdapter().getInstance();
    await server.ready();

    const first = await server.inject({ method: "GET", url: "/api/v1/health" });
    const second = await server.inject({ method: "GET", url: "/api/v1/health" });
    const third = await server.inject({ method: "GET", url: "/api/v1/health" });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(third.statusCode).toBe(429);

    await app.close();
  });

  it("rate limits protected endpoints independently from public routes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    const server = app.getHttpAdapter().getInstance();
    await server.ready();

    const headers = {
      authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440000")}`
    };
    const first = await server.inject({ method: "GET", url: "/api/v1/clients", headers });
    const second = await server.inject({ method: "GET", url: "/api/v1/clients", headers });
    const third = await server.inject({ method: "GET", url: "/api/v1/clients", headers });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(third.statusCode).toBe(429);

    await app.close();
  });

  it("denies unknown origins in non-local environments by default", () => {
    const policy = createCorsPolicy({
      NODE_ENV: "production"
    });

    const callback = vi.fn();
    policy.origin("https://unknown.example.com", callback);
    expect(callback).toHaveBeenCalledWith(null, false);
  });
});
