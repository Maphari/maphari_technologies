import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBillingApp } from "../app.js";
import { prisma } from "../lib/prisma.js";

describe("billing tenant scope integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("scopes CLIENT /invoices requests by x-client-id", async () => {
    const findManySpy = vi.spyOn(prisma.invoice, "findMany").mockResolvedValue([]);
    const app = await createBillingApp();

    const response = await app.inject({
      method: "GET",
      url: "/invoices",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440221"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: "550e8400-e29b-41d4-a716-446655440221" }
      })
    );

    await app.close();
  });

  it("keeps ADMIN /invoices requests unscoped", async () => {
    const findManySpy = vi.spyOn(prisma.invoice, "findMany").mockResolvedValue([]);
    const app = await createBillingApp();

    const response = await app.inject({
      method: "GET",
      url: "/invoices",
      headers: {
        "x-user-role": "ADMIN",
        "x-user-id": "admin-1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {}
      })
    );

    await app.close();
  });

  it("forces CLIENT /invoices create to scoped tenant", async () => {
    const createSpy = vi.spyOn(prisma.invoice, "create").mockResolvedValue({
      id: "inv-1",
      clientId: "550e8400-e29b-41d4-a716-446655440221",
      number: "INV-001",
      amountCents: BigInt(19900),
      currency: "USD",
      status: "ISSUED",
      issuedAt: new Date(),
      dueAt: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const app = await createBillingApp();

    const response = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440221"
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440999",
        number: "INV-001",
        amountCents: 19900,
        status: "ISSUED"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: "550e8400-e29b-41d4-a716-446655440221"
        })
      })
    );

    await app.close();
  });

  it("blocks CLIENT payment create when invoice belongs to another client", async () => {
    vi.spyOn(prisma.invoice, "findUnique").mockResolvedValue({
      id: "inv-2",
      clientId: "550e8400-e29b-41d4-a716-446655440333",
      number: "INV-002",
      amountCents: BigInt(9900),
      currency: "USD",
      status: "ISSUED",
      issuedAt: new Date(),
      dueAt: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const app = await createBillingApp();

    const response = await app.inject({
      method: "POST",
      url: "/payments",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440221"
      },
      payload: {
        invoiceId: "550e8400-e29b-41d4-a716-446655440101",
        amountCents: 19900
      }
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });
});
