import { EventTopics } from "@maphari/platform";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBillingApp } from "../app.js";
import { eventBus } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";

describe("billing events integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("publishes invoice.issued event with metadata envelope", async () => {
    const publishSpy = vi.spyOn(eventBus, "publish").mockResolvedValue();
    vi.spyOn(prisma.invoice, "create").mockResolvedValue({
      id: "f65fb43e-b228-4df4-9dd8-90bb4f05358c",
      clientId: "550e8400-e29b-41d4-a716-446655440221",
      number: "INV-1001",
      amountCents: BigInt(109900),
      currency: "USD",
      status: "ISSUED",
      issuedAt: new Date("2026-02-01T10:00:00.000Z"),
      dueAt: new Date("2026-02-10T10:00:00.000Z"),
      paidAt: null,
      createdAt: new Date("2026-02-01T10:00:00.000Z"),
      updatedAt: new Date("2026-02-01T10:00:00.000Z")
    });

    const app = await createBillingApp();
    const response = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440221",
        "x-request-id": "req-issued-1",
        "x-trace-id": "trace-issued-1"
      },
      payload: {
        number: "INV-1001",
        amountCents: 109900,
        status: "ISSUED",
        dueAt: "2026-02-10T10:00:00.000Z"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: EventTopics.invoiceIssued,
        requestId: "req-issued-1",
        traceId: "trace-issued-1",
        clientId: "550e8400-e29b-41d4-a716-446655440221",
        payload: expect.objectContaining({
          invoiceId: "f65fb43e-b228-4df4-9dd8-90bb4f05358c"
        })
      })
    );

    await app.close();
  });

  it("publishes invoice.overdue event when overdue invoice is created", async () => {
    const publishSpy = vi.spyOn(eventBus, "publish").mockResolvedValue();
    vi.spyOn(prisma.invoice, "create").mockResolvedValue({
      id: "cb35bc98-4240-44e6-a0d4-2f779f8aca22",
      clientId: "550e8400-e29b-41d4-a716-446655440221",
      number: "INV-1002",
      amountCents: BigInt(22000),
      currency: "USD",
      status: "OVERDUE",
      issuedAt: new Date("2026-01-01T10:00:00.000Z"),
      dueAt: new Date("2026-01-10T10:00:00.000Z"),
      paidAt: null,
      createdAt: new Date("2026-01-11T10:00:00.000Z"),
      updatedAt: new Date("2026-01-11T10:00:00.000Z")
    });

    const app = await createBillingApp();
    const response = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440221",
        "x-request-id": "req-overdue-1"
      },
      payload: {
        number: "INV-1002",
        amountCents: 22000,
        status: "OVERDUE"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: EventTopics.invoiceOverdue,
        requestId: "req-overdue-1",
        clientId: "550e8400-e29b-41d4-a716-446655440221"
      })
    );

    await app.close();
  });

  it("publishes invoice.paid event on completed payment", async () => {
    const publishSpy = vi.spyOn(eventBus, "publish").mockResolvedValue();
    vi.spyOn(prisma.invoice, "findUnique").mockResolvedValue({
      id: "d8305e7f-61b6-4ed7-ab35-d6f60f30dc6d",
      clientId: "550e8400-e29b-41d4-a716-446655440221",
      number: "INV-1003",
      amountCents: BigInt(50000),
      currency: "USD",
      status: "ISSUED",
      issuedAt: new Date("2026-02-01T12:00:00.000Z"),
      dueAt: new Date("2026-02-20T12:00:00.000Z"),
      paidAt: null,
      createdAt: new Date("2026-02-01T12:00:00.000Z"),
      updatedAt: new Date("2026-02-01T12:00:00.000Z")
    });
    vi.spyOn(prisma.payment, "create").mockResolvedValue({
      id: "7f32a7fa-24a1-4bca-8bd2-58d1a42a2f2b",
      clientId: "550e8400-e29b-41d4-a716-446655440221",
      invoiceId: "d8305e7f-61b6-4ed7-ab35-d6f60f30dc6d",
      amountCents: BigInt(50000),
      status: "COMPLETED",
      provider: "stripe",
      transactionRef: "tx-1003",
      paidAt: new Date("2026-02-03T12:00:00.000Z"),
      createdAt: new Date("2026-02-03T12:00:00.000Z"),
      updatedAt: new Date("2026-02-03T12:00:00.000Z")
    });

    const app = await createBillingApp();
    const response = await app.inject({
      method: "POST",
      url: "/payments",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440221",
        "x-request-id": "req-paid-1"
      },
      payload: {
        invoiceId: "d8305e7f-61b6-4ed7-ab35-d6f60f30dc6d",
        amountCents: 50000,
        status: "COMPLETED",
        provider: "stripe",
        transactionRef: "tx-1003",
        paidAt: "2026-02-03T12:00:00.000Z"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: EventTopics.invoicePaid,
        requestId: "req-paid-1",
        clientId: "550e8400-e29b-41d4-a716-446655440221",
        payload: expect.objectContaining({
          invoiceId: "d8305e7f-61b6-4ed7-ab35-d6f60f30dc6d",
          paymentId: "7f32a7fa-24a1-4bca-8bd2-58d1a42a2f2b"
        })
      })
    );

    await app.close();
  });
});
