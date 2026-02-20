import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { createGatewayApp } from "../app.js";

describe("gateway tenant scope integration", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.CORE_SERVICE_URL = "http://core.test";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects protected routes without token/header scope", async () => {
    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "GET",
      url: "/api/v1/clients"
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("derives scope from JWT and forwards normalized headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: []
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const token = jwt.sign(
      {
        sub: "user-1",
        role: "CLIENT",
        clientId: "client-1"
      },
      process.env.JWT_ACCESS_SECRET!,
      {
        issuer: "maphari-auth",
        audience: "maphari-api"
      }
    );

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "GET",
      url: "/api/v1/clients",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://core.test/clients",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-user-id": "user-1",
          "x-user-role": "CLIENT",
          "x-client-id": "client-1"
        })
      })
    );

    await app.close();
  });

  it("forwards lead status transitions through gateway with jwt scope", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { id: "lead-1", status: "QUALIFIED" }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const token = jwt.sign(
      {
        sub: "user-2",
        role: "CLIENT",
        clientId: "550e8400-e29b-41d4-a716-446655440000"
      },
      process.env.JWT_ACCESS_SECRET!,
      {
        issuer: "maphari-auth",
        audience: "maphari-api"
      }
    );

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "PATCH",
      url: "/api/v1/leads/550e8400-e29b-41d4-a716-446655440010/status",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        status: "QUALIFIED"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://core.test/leads/550e8400-e29b-41d4-a716-446655440010/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "QUALIFIED" }),
        headers: expect.objectContaining({
          "x-user-id": "user-2",
          "x-user-role": "CLIENT",
          "x-client-id": "550e8400-e29b-41d4-a716-446655440000"
        })
      })
    );

    await app.close();
  });

  it("rejects invalid lead status payload before proxying", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const token = jwt.sign(
      {
        sub: "user-3",
        role: "STAFF"
      },
      process.env.JWT_ACCESS_SECRET!,
      {
        issuer: "maphari-auth",
        audience: "maphari-api"
      }
    );

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "PATCH",
      url: "/api/v1/leads/550e8400-e29b-41d4-a716-446655440010/status",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        status: "UNKNOWN_STAGE"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();

    await app.close();
  });
});
