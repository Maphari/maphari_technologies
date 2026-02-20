import { createInvoiceSchema, type ApiResponse } from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import type { FastifyInstance } from "fastify";
import type { Invoice, Payment } from "../generated/prisma/index.js";
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

type InvoiceDto = {
  id: string;
  clientId: string;
  number: string;
  amountCents: number;
  currency: string;
  status: string;
  issuedAt: Date | null;
  dueAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  payments: PaymentDto[];
};

function toInvoiceDto(invoice: Invoice & { payments?: Payment[] }): InvoiceDto {
  return {
    ...invoice,
    amountCents: Number(invoice.amountCents),
    payments: (invoice.payments ?? []).map((payment) => ({
      ...payment,
      amountCents: Number(payment.amountCents)
    }))
  };
}

export async function registerInvoiceRoutes(app: FastifyInstance): Promise<void> {
  app.get("/invoices", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const whereClause = clientId ? { clientId } : {};
    const cacheKey = CacheKeys.invoices(clientId);

    try {
      const cached = await cache.getJson<InvoiceDto[]>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          meta: { requestId: scope.requestId, cache: "hit" }
        } as ApiResponse<typeof cached>;
      }

      const invoices = await prisma.invoice.findMany({
        where: whereClause,
        include: {
          payments: {
            orderBy: { createdAt: "desc" }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      const responseData = invoices.map(toInvoiceDto);

      // Keep tenant invoice lists cached; write paths in later phases should invalidate eagerly.
      await cache.setJson(cacheKey, responseData, 30);

      return {
        success: true,
        data: responseData,
        meta: { requestId: scope.requestId, cache: "miss" }
      } as ApiResponse<typeof responseData>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: {
          code: "INVOICES_FETCH_FAILED",
          message: "Unable to fetch invoices"
        }
      } as ApiResponse;
    }
  });

  app.post("/invoices", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createInvoiceSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid invoice payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
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

    try {
      const invoice = await prisma.invoice.create({
        data: {
          clientId,
          number: parsedBody.data.number,
          amountCents: BigInt(parsedBody.data.amountCents),
          currency: parsedBody.data.currency ?? "USD",
          status: parsedBody.data.status ?? "DRAFT",
          issuedAt: parsedBody.data.issuedAt ? new Date(parsedBody.data.issuedAt) : null,
          dueAt: parsedBody.data.dueAt ? new Date(parsedBody.data.dueAt) : null
        },
        include: {
          payments: {
            orderBy: { createdAt: "desc" }
          }
        }
      });

      await Promise.all([cache.delete(CacheKeys.invoices(clientId)), cache.delete(CacheKeys.invoices())]);

      const traceId = (request.headers["x-trace-id"] as string | undefined) ?? undefined;
      if (invoice.status === "ISSUED") {
        await publishBillingEvent({
          topic: EventTopics.invoiceIssued,
          clientId: invoice.clientId,
          requestId: scope.requestId,
          traceId,
          payload: {
            invoiceId: invoice.id,
            number: invoice.number,
            status: invoice.status,
            amountCents: Number(invoice.amountCents),
            dueAt: invoice.dueAt?.toISOString() ?? null
          }
        });
      }

      if (invoice.status === "OVERDUE") {
        await publishBillingEvent({
          topic: EventTopics.invoiceOverdue,
          clientId: invoice.clientId,
          requestId: scope.requestId,
          traceId,
          payload: {
            invoiceId: invoice.id,
            number: invoice.number,
            status: invoice.status,
            amountCents: Number(invoice.amountCents),
            dueAt: invoice.dueAt?.toISOString() ?? null
          }
        });
      }

      const responseData = toInvoiceDto(invoice);
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
          code: "INVOICE_CREATE_FAILED",
          message: "Unable to create invoice"
        }
      } as ApiResponse;
    }
  });
}
