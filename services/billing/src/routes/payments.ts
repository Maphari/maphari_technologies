import { createPaymentSchema, type ApiResponse } from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import type { FastifyInstance } from "fastify";
import type { Payment } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { publishBillingEvent } from "../lib/events.js";

type PaymentDto = {
  id: string;
  clientId: string;
  invoiceId: string;
  amountCents: number;
  status: string;
  provider: string | null;
  transactionRef: string | null;
  paidAt: Date | null;
  receiptFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toPaymentDto(payment: Payment): PaymentDto {
  return {
    id: payment.id,
    clientId: payment.clientId,
    invoiceId: payment.invoiceId,
    amountCents: Number(payment.amountCents),
    status: payment.status,
    provider: payment.provider ?? null,
    transactionRef: payment.transactionRef ?? null,
    paidAt: payment.paidAt,
    receiptFileId: payment.receiptFileId ?? null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export async function registerPaymentRoutes(app: FastifyInstance): Promise<void> {
  app.get("/payments", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const whereClause = clientId ? { clientId } : {};

    try {
      const payments = await prisma.payment.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" }
      });
      const responseData = payments.map(toPaymentDto);

      return {
        success: true,
        data: responseData,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof responseData>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: {
          code: "PAYMENTS_FETCH_FAILED",
          message: "Unable to fetch payments"
        }
      } as ApiResponse;
    }
  });

  app.post("/payments", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createPaymentSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid payment payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: parsedBody.data.invoiceId },
        select: { id: true, clientId: true }
      });

      if (!invoice) {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "INVOICE_NOT_FOUND",
            message: "Invoice not found"
          }
        } as ApiResponse;
      }

      const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId ?? invoice.clientId);
      if (!clientId) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "client scope is required"
          }
        } as ApiResponse;
      }

      if (clientId !== invoice.clientId) {
        reply.status(403);
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Invoice does not belong to scoped client"
          }
        } as ApiResponse;
      }

      const payment = await prisma.payment.create({
        data: {
          clientId,
          invoiceId: parsedBody.data.invoiceId,
          amountCents: BigInt(parsedBody.data.amountCents),
          status: parsedBody.data.status ?? "PENDING",
          provider: parsedBody.data.provider ?? null,
          transactionRef: parsedBody.data.transactionRef ?? null,
          paidAt: parsedBody.data.paidAt ? new Date(parsedBody.data.paidAt) : null
        }
      });

      // Payment writes can alter invoice projections; clear invoice list cache for affected tenant and admin view.
      await Promise.all([cache.delete(CacheKeys.invoices(clientId)), cache.delete(CacheKeys.invoices())]);

      if (payment.status === "COMPLETED") {
        await publishBillingEvent({
          topic: EventTopics.invoicePaid,
          clientId: payment.clientId,
          requestId: scope.requestId,
          traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
          payload: {
            paymentId: payment.id,
            invoiceId: payment.invoiceId,
            amountCents: Number(payment.amountCents),
            status: payment.status,
            paidAt: payment.paidAt?.toISOString() ?? null
          }
        });
      }

      const responseData = toPaymentDto(payment);
      return {
        success: true,
        data: responseData,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof responseData>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "PAYMENT_CREATE_FAILED",
          message: "Unable to create payment"
        }
      } as ApiResponse;
    }
  });

  // ── GET /payments/:id/receipt ─────────────────────────────────────────────
  // Returns the receiptFileId for gateway to resolve a presigned download URL
  app.get("/payments/:id/receipt", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };

    try {
      const payment = await prisma.payment.findUnique({ where: { id } });
      if (!payment) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Payment not found" } } as ApiResponse;
      }
      if (scope.role === "CLIENT" && payment.clientId !== scope.clientId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
      }
      if (!payment.receiptFileId) {
        reply.status(404);
        return { success: false, error: { code: "NO_RECEIPT", message: "No receipt attached to this payment" } } as ApiResponse;
      }

      return { success: true, data: { fileId: payment.receiptFileId }, meta: { requestId: scope.requestId } } as ApiResponse<{ fileId: string }>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "RECEIPT_FETCH_FAILED", message: "Unable to fetch receipt" } } as ApiResponse;
    }
  });

  // ── PATCH /payments/:id ───────────────────────────────────────────────────
  app.patch("/payments/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };
    const body = request.body as { receiptFileId?: string; status?: string };

    try {
      const existing = await prisma.payment.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Payment not found" } } as ApiResponse;
      }
      if (scope.role === "CLIENT" && existing.clientId !== scope.clientId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
      }

      const updateData: Record<string, unknown> = {};
      if (body.receiptFileId !== undefined) updateData.receiptFileId = body.receiptFileId;
      if (body.status !== undefined) updateData.status = body.status;

      const updated = await prisma.payment.update({ where: { id }, data: updateData });
      await Promise.all([cache.delete(CacheKeys.invoices(existing.clientId)), cache.delete(CacheKeys.invoices())]);

      // Auto-confirm payment milestone in core service when a payment transitions to COMPLETED
      if (updated.status === "COMPLETED" && existing.status !== "COMPLETED" && updated.invoiceId) {
        try {
          const milestoneInvoice = await prisma.invoice.findUnique({
            where: { id: updated.invoiceId },
            select: { projectId: true, description: true, clientId: true }
          });

          if (milestoneInvoice?.projectId) {
            let stage: string | null = null;
            const desc = milestoneInvoice.description ?? "";
            if (desc.includes("FINAL_20") || desc.toLowerCase().includes("final")) stage = "FINAL_20";
            else if (desc.includes("MILESTONE_30") || desc.toLowerCase().includes("milestone")) stage = "MILESTONE_30";
            else if (desc.includes("DEPOSIT_50") || desc.toLowerCase().includes("deposit")) stage = "DEPOSIT_50";

            if (stage) {
              const coreUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4003";
              try {
                await fetch(`${coreUrl}/projects/${milestoneInvoice.projectId}/payment-milestones`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-user-role": "ADMIN",
                    "x-user-id": "system-payment-patch",
                    "x-client-id": milestoneInvoice.clientId,
                    "x-request-id": scope.requestId ?? "",
                    "x-trace-id": ((request.headers["x-trace-id"] as string | undefined) ?? scope.requestId) ?? "",
                  },
                  body: JSON.stringify({ stage, invoiceId: updated.invoiceId, paymentId: updated.id }),
                });
                request.log.info({ projectId: milestoneInvoice.projectId, stage }, "PATCH /payments: milestone auto-confirmed in core service");
              } catch (milestoneError) {
                request.log.warn({ error: milestoneError, projectId: milestoneInvoice.projectId, stage }, "PATCH /payments: milestone auto-confirm failed — non-fatal");
              }
            }
          }
        } catch (invoiceLookupError) {
          request.log.warn({ error: invoiceLookupError, paymentId: updated.id }, "PATCH /payments: invoice lookup for milestone auto-confirm failed — non-fatal");
        }
      }

      return { success: true, data: toPaymentDto(updated), meta: { requestId: scope.requestId } } as ApiResponse<PaymentDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "PAYMENT_UPDATE_FAILED", message: "Unable to update payment" } } as ApiResponse;
    }
  });
}
