import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";
import type {
  AdminInvoice,
  AdminPayment
} from "./types";

export async function createInvoiceWithRefresh(
  session: AuthSession,
  input: {
    clientId?: string;
    number: string;
    amountCents: number;
    currency?: string;
    status?: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "VOID";
    issuedAt?: string;
    dueAt?: string;
  }
): Promise<AuthorizedResult<AdminInvoice>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminInvoice>("/invoices", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "INVOICE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create invoice."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createPaymentWithRefresh(
  session: AuthSession,
  input: {
    clientId?: string;
    invoiceId: string;
    amountCents: number;
    status?: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
    provider?: string;
    transactionRef?: string;
    paidAt?: string;
  }
): Promise<AuthorizedResult<AdminPayment>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminPayment>("/payments", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PAYMENT_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create payment."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
