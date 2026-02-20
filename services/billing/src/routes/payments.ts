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
  createdAt: Date;
  updatedAt: Date;
};

function toPaymentDto(payment: Payment): PaymentDto {
  return {
    ...payment,
    amountCents: Number(payment.amountCents)
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
}
