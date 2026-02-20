import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { createGatewayApp } from "../app.js";

function createClientToken(clientId: string): string {
  return jwt.sign(
    {
      sub: "user-billing",
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

describe("gateway billing proxy integration", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.BILLING_SERVICE_URL = "http://billing.test";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards jwt-scoped headers to invoices list route", async () => {
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
      url: "/api/v1/invoices",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440311")}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://billing.test/invoices",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "x-user-id": "user-billing",
          "x-user-role": "CLIENT",
          "x-client-id": "550e8400-e29b-41d4-a716-446655440311"
        })
      })
    );

    await app.close();
  });

  it("rejects invalid invoice payload before proxying", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/invoices",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440311")}`
      },
      payload: {
        number: "",
        amountCents: -1
      }
    });

    expect(response.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();

    await app.close();
  });

  it("forwards validated payment create payload to billing upstream", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "payment-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await createGatewayApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const payload = {
      invoiceId: "550e8400-e29b-41d4-a716-446655440100",
      amountCents: 19900,
      status: "COMPLETED"
    };

    const response = await app.getHttpAdapter().getInstance().inject({
      method: "POST",
      url: "/api/v1/payments",
      headers: {
        authorization: `Bearer ${createClientToken("550e8400-e29b-41d4-a716-446655440311")}`
      },
      payload
    });

    expect(response.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://billing.test/payments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload)
      })
    );

    await app.close();
  });
});
