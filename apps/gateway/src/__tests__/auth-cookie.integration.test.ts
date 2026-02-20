import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGatewayApp } from "../app.js";

describe("gateway auth cookie flow", () => {
  beforeEach(() => {
    process.env.AUTH_SERVICE_URL = "http://auth.test";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sets refresh and role cookies on login and strips refresh token from response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            accessToken: "access-token",
            refreshToken: "refresh-token",
            expiresInSeconds: 900,
            user: {
              id: "user_1",
              email: "client@example.com",
              role: "CLIENT",
              clientId: null
            }
          }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "client@example.com" }
    });

    expect(response.statusCode).toBe(201);
    const payload = response.json();
    expect(payload.success).toBe(true);
    expect(payload.data.refreshToken).toBeUndefined();

    const setCookie = String(response.headers["set-cookie"] ?? "");
    expect(setCookie).toContain("maphari_refresh_token=refresh-token");
    expect(setCookie).toContain("maphari.auth.role=CLIENT");

    await app.close();
  });

  it("uses refresh cookie when body token is missing and rotates cookies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            accessToken: "next-access-token",
            refreshToken: "next-refresh-token",
            expiresInSeconds: 900,
            user: {
              id: "user_1",
              email: "client@example.com",
              role: "CLIENT",
              clientId: null
            }
          }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: {
        cookie: "maphari_refresh_token=refresh-from-cookie"
      },
      payload: {}
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://auth.test/auth/refresh",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "refresh-from-cookie" })
      })
    );

    const payload = response.json();
    expect(payload.data.refreshToken).toBeUndefined();

    const setCookie = String(response.headers["set-cookie"] ?? "");
    expect(setCookie).toContain("maphari_refresh_token=next-refresh-token");

    await app.close();
  });
});
