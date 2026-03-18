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

export async function updateInvoiceWithRefresh(
  session: AuthSession,
  invoiceId: string,
  input: {
    status?: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "VOID";
    dueAt?: string | null;
    number?: string;
    amountCents?: number;
  }
): Promise<AuthorizedResult<AdminInvoice>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminInvoice>(`/invoices/${invoiceId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "INVOICE_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update invoice."
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

// ── Revenue Series ─────────────────────────────────────────────────────────────

export interface RevenueSeries {
  key: string;
  month: string;
  year: number;
  paidCents: number;
  issuedCents: number;
  overdueCount: number;
  invoiceCount: number;
}

export async function fetchRevenueSeries(
  session: AuthSession,
  months = 7
): Promise<AuthorizedResult<RevenueSeries[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<RevenueSeries[]>(
      `/admin/revenue-series?months=${months}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "REVENUE_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load revenue series."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Cash Flow Events ──────────────────────────────────────────────────────────

export interface CashFlowEvent {
  id: string;
  type: "inflow" | "outflow";
  category: string;
  clientId: string;
  amount: number;
  date: string;
  status: "received" | "expected" | "overdue" | "forecast" | "scheduled";
  description: string;
  overdueDays?: number;
}

export async function fetchCashFlowEvents(
  session: AuthSession
): Promise<AuthorizedResult<CashFlowEvent[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<CashFlowEvent[]>(
      "/admin/cash-flow-events",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CASH_FLOW_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load cash flow events."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
