import type { ApiResponse } from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { publishBillingEvent } from "../lib/events.js";
import { cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";
import { PAYFAST_ENDPOINT, generateSignature, verifyItnSignature, centsToZar, normalizePayfastUrl, zarToCents } from "../lib/payfast.js";

/**
 * Registers PayFast payment routes:
 *
 *   POST /payfast/initiate — builds a signed redirect payload for the client to POST to PayFast
 *   POST /payfast/itn      — receives PayFast ITN webhook, verifies signature, records payment
 */
export async function registerPayFastRoutes(app: FastifyInstance): Promise<void> {
  // ── POST /payfast/initiate ────────────────────────────────────────────────
  // Returns the PayFast endpoint URL and signed form fields.
  // The frontend renders a form and auto-submits it to PayFast.
  app.post<{
    Body: {
      invoiceId?: string;
      returnUrl?: string;
      cancelUrl?: string;
      notifyUrl?: string;
      buyerEmail?: string;
      buyerName?: string;
    };
  }>("/payfast/initiate", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { invoiceId, returnUrl, cancelUrl, notifyUrl, buyerEmail, buyerName } = request.body ?? {};

    if (!invoiceId) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "invoiceId is required" }
      } as ApiResponse;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, clientId: true, amountCents: true, status: true, number: true }
    });

    if (!invoice) {
      reply.status(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } } as ApiResponse;
    }

    if (scope.role === "CLIENT" && invoice.clientId !== scope.clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
    }

    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;

    if (!merchantId || !merchantKey) {
      reply.status(500);
      return {
        success: false,
        error: { code: "PAYFAST_NOT_CONFIGURED", message: "PayFast credentials are not configured" }
      } as ApiResponse;
    }

    const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const serviceBaseUrl = process.env.BILLING_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4006}`;
    const servicePublicBaseUrl = process.env.BILLING_PUBLIC_BASE_URL?.trim() || serviceBaseUrl;

    const resolvedReturnUrl =
      returnUrl ?? `${appBaseUrl}/client/invoices/${invoice.id}?payment=success`;
    const resolvedCancelUrl =
      cancelUrl ?? `${appBaseUrl}/client/invoices/${invoice.id}?payment=cancelled`;
    const resolvedNotifyUrl = normalizePayfastUrl(
      notifyUrl ?? `${servicePublicBaseUrl}/payfast/itn`
    );

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: resolvedReturnUrl,
      cancel_url: resolvedCancelUrl,
      notify_url: resolvedNotifyUrl,
      m_payment_id: invoice.id,
      amount: centsToZar(Number(invoice.amountCents)),
      item_name: `Invoice ${invoice.number}`
    };

    if (buyerEmail) fields.email_address = buyerEmail;
    if (buyerName) {
      const spaceIdx = buyerName.indexOf(" ");
      if (spaceIdx === -1) {
        fields.name_first = buyerName;
      } else {
        fields.name_first = buyerName.slice(0, spaceIdx);
        fields.name_last = buyerName.slice(spaceIdx + 1);
      }
    }

    fields.signature = generateSignature(fields);

    return {
      success: true,
      data: { url: PAYFAST_ENDPOINT, fields },
      meta: { requestId: scope.requestId }
    } as ApiResponse<{ url: string; fields: Record<string, string> }>;
  });

  // ── POST /payfast/itn ─────────────────────────────────────────────────────
  // PayFast Instant Transaction Notification webhook.
  // PayFast sends application/x-www-form-urlencoded POST to this endpoint
  // after each payment attempt. We verify the signature then record the result.
  app.post("/payfast/itn", async (request, reply) => {
    const body = request.body as Record<string, string>;

    // Verify PayFast signature before doing anything
    if (!verifyItnSignature(body)) {
      app.log.warn({ itn: body }, "PayFast ITN: invalid signature — rejecting");
      reply.status(400);
      return { success: false, error: { code: "INVALID_SIGNATURE", message: "Signature verification failed" } };
    }

    const {
      m_payment_id: invoiceId,
      payment_status: paymentStatus,
      pf_payment_id: pfPaymentId,
      amount_gross: amountGross
    } = body;

    // Non-complete statuses (CANCELLED, FAILED) — acknowledge and exit
    if (paymentStatus !== "COMPLETE") {
      app.log.info({ invoiceId, paymentStatus }, "PayFast ITN: non-complete status, skipping");
      reply.status(200);
      return "";
    }

    if (!invoiceId) {
      app.log.warn({ itn: body }, "PayFast ITN: missing m_payment_id");
      reply.status(400);
      return { success: false, error: { code: "MISSING_INVOICE_ID", message: "m_payment_id missing" } };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, clientId: true, amountCents: true, status: true, projectId: true, description: true }
    });

    if (!invoice) {
      app.log.warn({ invoiceId }, "PayFast ITN: invoice not found");
      reply.status(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } };
    }

    const paidCents = amountGross ? zarToCents(amountGross) : Number(invoice.amountCents);
    const now = new Date();

    // Record the payment
    const payment = await prisma.payment.create({
      data: {
        clientId: invoice.clientId,
        invoiceId: invoice.id,
        amountCents: BigInt(paidCents),
        status: "COMPLETED",
        provider: "PAYFAST",
        transactionRef: pfPaymentId ?? null,
        paidAt: now
      }
    });

    // Mark the invoice as PAID
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt: now }
    });

    // Clear invoice caches
    await Promise.all([
      cache.delete(CacheKeys.invoices(invoice.clientId)),
      cache.delete(CacheKeys.invoices())
    ]);

    // Auto-confirm payment milestone in core service
    if (invoice.projectId) {
      let stage: string | null = null;
      const desc = invoice.description ?? "";
      if (desc.includes("FINAL_20") || desc.toLowerCase().includes("final")) stage = "FINAL_20";
      else if (desc.includes("MILESTONE_30") || desc.toLowerCase().includes("milestone")) stage = "MILESTONE_30";
      else if (desc.includes("DEPOSIT_50") || desc.toLowerCase().includes("deposit")) stage = "DEPOSIT_50";

      if (stage) {
        const coreUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4003";
        try {
          await fetch(`${coreUrl}/projects/${invoice.projectId}/payment-milestones`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-role": "ADMIN",
              "x-user-id": "system-payfast",
              "x-client-id": invoice.clientId,
              "x-request-id": pfPaymentId ?? payment.id,
              "x-trace-id": pfPaymentId ?? payment.id,
            },
            body: JSON.stringify({ stage, invoiceId: invoice.id, paymentId: payment.id }),
          });
          app.log.info({ projectId: invoice.projectId, stage }, "PayFast ITN: milestone auto-confirmed in core service");
        } catch (milestoneError) {
          app.log.warn({ error: milestoneError, projectId: invoice.projectId, stage }, "PayFast ITN: milestone auto-confirm failed — non-fatal");
        }
      }
    }

    // Publish billing event — automation + notifications pick this up
    await publishBillingEvent({
      topic: EventTopics.invoicePaid,
      clientId: invoice.clientId,
      requestId: pfPaymentId ?? payment.id,
      payload: {
        paymentId: payment.id,
        invoiceId: invoice.id,
        amountCents: paidCents,
        status: "COMPLETED",
        paidAt: now.toISOString(),
        provider: "PAYFAST",
        transactionRef: pfPaymentId ?? null
      }
    });

    app.log.info(
      { invoiceId, paymentId: payment.id, amountCents: paidCents, pfPaymentId },
      "PayFast ITN: payment recorded and invoice marked PAID"
    );

    // PayFast requires an HTTP 200 response to acknowledge the ITN
    reply.status(200);
    return "";
  });
}
