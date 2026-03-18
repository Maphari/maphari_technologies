// ════════════════════════════════════════════════════════════════════════════
// installments.ts — InvoiceInstallment routes
// Service : billing  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN full; CLIENT scoped to own invoices
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { InvoiceInstallment } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTOs ─────────────────────────────────────────────────────────────────────
type InstallmentDto = {
  id: string;
  invoiceId: string;
  clientId: string;
  projectId: string | null;
  number: number;
  name: string;
  amountCents: number;
  dueAt: string | null;
  paidAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function toInstallmentDto(i: InvoiceInstallment): InstallmentDto {
  return {
    ...i,
    amountCents: Number(i.amountCents),
    dueAt: i.dueAt?.toISOString() ?? null,
    paidAt: i.paidAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────
export async function registerInstallmentRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /invoices/:id/installments ─────────────────────────────────────────
  app.get("/invoices/:id/installments", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id: invoiceId } = request.params as { id: string };
    const cacheKey = CacheKeys.installments(invoiceId);

    try {
      const cached = await cache.getJson<InstallmentDto[]>(cacheKey);
      if (cached) {
        return { success: true, data: cached, meta: { requestId: scope.requestId, cache: "hit" } } as ApiResponse<InstallmentDto[]>;
      }

      // Verify the invoice exists and enforce CLIENT scope
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } } as ApiResponse;
      }
      if (scope.role === "CLIENT" && invoice.clientId !== scope.clientId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Cannot access another client's invoice" } } as ApiResponse;
      }

      const installments = await prisma.invoiceInstallment.findMany({
        where: { invoiceId },
        orderBy: { number: "asc" },
      });
      const data = installments.map(toInstallmentDto);

      await cache.setJson(cacheKey, data, 60);

      return { success: true, data, meta: { requestId: scope.requestId, cache: "miss" } } as ApiResponse<InstallmentDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "INSTALLMENTS_FETCH_FAILED", message: "Unable to fetch installments" } } as ApiResponse;
    }
  });

  // ── POST /invoices/:id/installments ────────────────────────────────────────
  app.post("/invoices/:id/installments", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { id: invoiceId } = request.params as { id: string };
    const body = request.body as {
      number: number;
      name: string;
      amountCents: number;
      dueAt?: string;
      projectId?: string;
    };

    if (!body.number || !body.name || !body.amountCents) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "number, name, and amountCents are required" } } as ApiResponse;
    }

    try {
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } } as ApiResponse;
      }

      const installment = await prisma.invoiceInstallment.create({
        data: {
          invoiceId,
          clientId: invoice.clientId,
          projectId: body.projectId ?? null,
          number: body.number,
          name: body.name,
          amountCents: BigInt(Math.round(body.amountCents)),
          dueAt: body.dueAt ? new Date(body.dueAt) : null,
          status: "PENDING",
        },
      });

      await cache.setJson(CacheKeys.installments(invoiceId), null as unknown as InstallmentDto[], 0);

      reply.status(201);
      return { success: true, data: toInstallmentDto(installment) } as ApiResponse<InstallmentDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "INSTALLMENT_CREATE_FAILED", message: "Unable to create installment" } } as ApiResponse;
    }
  });

  // ── PATCH /installments/:id/pay ────────────────────────────────────────────
  app.patch("/installments/:id/pay", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };

    try {
      const installment = await prisma.invoiceInstallment.update({
        where: { id },
        data: { status: "PAID", paidAt: new Date() },
      });

      await cache.setJson(CacheKeys.installments(installment.invoiceId), null as unknown as InstallmentDto[], 0);

      return { success: true, data: toInstallmentDto(installment) } as ApiResponse<InstallmentDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "INSTALLMENT_PAY_FAILED", message: "Unable to mark installment paid" } } as ApiResponse;
    }
  });
}
