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
  pdfFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
  payments: PaymentDto[];
};

function toInvoiceDto(invoice: Invoice & { payments?: Payment[] }): InvoiceDto {
  return {
    id: invoice.id,
    clientId: invoice.clientId,
    number: invoice.number,
    amountCents: Number(invoice.amountCents),
    currency: invoice.currency,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    paidAt: invoice.paidAt,
    pdfFileId: invoice.pdfFileId ?? null,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
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

  // ── GET /invoices/:id ─────────────────────────────────────────────────────
  app.get("/invoices/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };

    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { payments: { orderBy: { createdAt: "desc" } } }
      });

      if (!invoice) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } } as ApiResponse;
      }

      // CLIENT can only access their own invoices
      if (scope.role === "CLIENT" && invoice.clientId !== scope.clientId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
      }

      return { success: true, data: toInvoiceDto(invoice), meta: { requestId: scope.requestId } } as ApiResponse<InvoiceDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "INVOICE_FETCH_FAILED", message: "Unable to fetch invoice" } } as ApiResponse;
    }
  });

  // ── PATCH /invoices/:id ───────────────────────────────────────────────────
  app.patch("/invoices/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };
    const body = request.body as { pdfFileId?: string; status?: string };

    try {
      const existing = await prisma.invoice.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } } as ApiResponse;
      }
      if (scope.role === "CLIENT" && existing.clientId !== scope.clientId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
      }

      const updateData: Record<string, unknown> = {};
      if (body.pdfFileId !== undefined) updateData.pdfFileId = body.pdfFileId;
      if (body.status !== undefined) updateData.status = body.status;

      const updated = await prisma.invoice.update({
        where: { id },
        data: updateData,
        include: { payments: { orderBy: { createdAt: "desc" } } }
      });

      await Promise.all([cache.delete(CacheKeys.invoices(existing.clientId)), cache.delete(CacheKeys.invoices())]);

      return { success: true, data: toInvoiceDto(updated), meta: { requestId: scope.requestId } } as ApiResponse<InvoiceDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "INVOICE_UPDATE_FAILED", message: "Unable to update invoice" } } as ApiResponse;
    }
  });

  // ── GET /invoices/:id/pdf ─────────────────────────────────────────────────
  // Returns the stored pdfFileId so the gateway/frontend can fetch a download URL
  app.get("/invoices/:id/pdf", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };

    try {
      const invoice = await prisma.invoice.findUnique({ where: { id } });
      if (!invoice) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } } as ApiResponse;
      }
      if (scope.role === "CLIENT" && invoice.clientId !== scope.clientId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
      }
      if (!invoice.pdfFileId) {
        reply.status(404);
        return { success: false, error: { code: "NO_PDF", message: "No PDF attached to this invoice" } } as ApiResponse;
      }

      return { success: true, data: { fileId: invoice.pdfFileId }, meta: { requestId: scope.requestId } } as ApiResponse<{ fileId: string }>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "INVOICE_PDF_FAILED", message: "Unable to fetch invoice PDF" } } as ApiResponse;
    }
  });

  // ── GET /admin/revenue-series?months=N ───────────────────────────────────
  // Returns monthly invoice revenue summary for the MRR tracking chart.
  // ADMIN / STAFF only.
  app.get("/admin/revenue-series", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required." } } as ApiResponse;
    }

    const months = Number((request.query as Record<string, string>).months ?? "7");
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - Math.max(1, Math.min(24, months)));

    try {
      const invoices = await prisma.invoice.findMany({
        where: { createdAt: { gte: cutoff } },
        select: {
          id: true,
          amountCents: true,
          status: true,
          issuedAt: true,
          paidAt: true,
          createdAt: true
        },
        orderBy: { createdAt: "asc" }
      });

      // Group by YYYY-MM using paidAt for PAID invoices, issuedAt otherwise
      const buckets = new Map<string, { paidCents: number; issuedCents: number; overdueCount: number; invoiceCount: number }>();

      for (const inv of invoices) {
        const ref = inv.paidAt ?? inv.issuedAt ?? inv.createdAt;
        const key = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
        const existing = buckets.get(key) ?? { paidCents: 0, issuedCents: 0, overdueCount: 0, invoiceCount: 0 };
        existing.invoiceCount += 1;
        if (inv.status === "PAID") existing.paidCents += Number(inv.amountCents);
        else if (inv.status === "ISSUED") existing.issuedCents += Number(inv.amountCents);
        else if (inv.status === "OVERDUE") existing.overdueCount += 1;
        buckets.set(key, existing);
      }

      const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const series = Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, data]) => {
          const [yr, mo] = key.split("-");
          return {
            key,
            month: MONTH_NAMES[Number(mo) - 1] ?? mo,
            year: Number(yr),
            paidCents: data.paidCents,
            issuedCents: data.issuedCents,
            overdueCount: data.overdueCount,
            invoiceCount: data.invoiceCount
          };
        });

      return { success: true, data: series, meta: { requestId: scope.requestId } } as ApiResponse<typeof series>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "REVENUE_SERIES_FAILED", message: "Unable to compute revenue series." } } as ApiResponse;
    }
  });

  // ── GET /admin/cash-flow-events ───────────────────────────────────────────
  // Returns invoices as structured cash-flow events for the 90-day calendar.
  // ADMIN / STAFF only.
  app.get("/admin/cash-flow-events", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required." } } as ApiResponse;
    }

    // Default to 90-day window centred on today
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 90);

    try {
      const invoices = await prisma.invoice.findMany({
        where: {
          OR: [
            { dueAt: { gte: from, lte: to } },
            { paidAt: { gte: from, lte: to } },
            { status: "OVERDUE" }
          ]
        },
        select: {
          id: true,
          number: true,
          clientId: true,
          amountCents: true,
          status: true,
          dueAt: true,
          paidAt: true,
          createdAt: true
        },
        orderBy: { dueAt: "asc" }
      });

      const now = Date.now();
      const events = invoices.map((inv) => {
        let date: Date;
        let status: "received" | "expected" | "overdue" | "forecast" | "scheduled";

        if (inv.status === "PAID") {
          date = inv.paidAt ?? inv.dueAt ?? inv.createdAt;
          status = "received";
        } else if (inv.status === "OVERDUE") {
          date = inv.dueAt ?? inv.createdAt;
          status = "overdue";
        } else if (inv.status === "ISSUED") {
          date = inv.dueAt ?? inv.createdAt;
          status = "expected";
        } else {
          date = inv.dueAt ?? inv.createdAt;
          status = "forecast";
        }

        const overdueDays =
          status === "overdue" ? Math.max(0, Math.floor((now - date.getTime()) / 86400000)) : undefined;

        return {
          id: inv.id,
          type: "inflow" as const,
          category: "Invoice",
          clientId: inv.clientId,
          amount: Math.round(Number(inv.amountCents) / 100),
          date: date.toISOString().slice(0, 10),
          status,
          description: `Invoice ${inv.number}`,
          ...(overdueDays !== undefined ? { overdueDays } : {})
        };
      });

      return { success: true, data: events, meta: { requestId: scope.requestId } } as ApiResponse<typeof events>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CASH_FLOW_FAILED", message: "Unable to fetch cash flow events." } } as ApiResponse;
    }
  });
}
