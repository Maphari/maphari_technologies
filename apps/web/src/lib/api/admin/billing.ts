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

// ── Invoice Chasing ────────────────────────────────────────────────────────────

export type ChaseStage = "CHASE_3D" | "CHASE_7D" | "CHASE_14D" | "PAUSED" | "NONE";

export interface OverdueInvoice {
  id: string;
  clientId: string;
  clientName?: string;
  amountCents: number;
  dueDate: string;
  daysOverdue: number;
  chaseStage: ChaseStage;
  lastChasedAt: string | null;
  nextChaseAt: string | null;
}

export interface OverdueChaseData {
  invoices: OverdueInvoice[];
}

export async function loadOverdueChaseStatusWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<OverdueChaseData>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<OverdueChaseData>(
      "/invoices/overdue-chase-status",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CHASE_STATUS_FAILED",
          response.payload.error?.message ?? "Unable to load overdue chase status."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function triggerInvoiceChaseWithRefresh(
  session: AuthSession,
  invoiceId: string,
  action: "send" | "pause" | "resume"
): Promise<AuthorizedResult<void>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ ok: boolean }>(
      `/invoices/${invoiceId}/chase`,
      accessToken,
      { method: "POST", body: { action } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CHASE_ACTION_FAILED",
          response.payload.error?.message ?? "Unable to process chase action."
        )
      };
    }
    return { unauthorized: false, data: undefined, error: null };
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

// ── Cash Flow Scenarios ────────────────────────────────────────────────────────

export interface CashFlowScenario {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  adjustments: unknown[];
  isBaseline: boolean;
  createdByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function loadCashFlowScenariosWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<CashFlowScenario[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<CashFlowScenario[]>(
      "/cash-flow/scenarios",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "SCENARIOS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load cash flow scenarios."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createCashFlowScenarioWithRefresh(
  session: AuthSession,
  input: { name: string; description?: string; adjustments?: unknown[]; isBaseline?: boolean }
): Promise<AuthorizedResult<CashFlowScenario>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<CashFlowScenario>(
      "/cash-flow/scenarios",
      accessToken,
      { method: "POST", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "SCENARIO_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create scenario."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function deleteCashFlowScenarioWithRefresh(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<void>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ id: string }>(
      `/cash-flow/scenarios/${id}`,
      accessToken,
      { method: "DELETE" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "SCENARIO_DELETE_FAILED",
          response.payload.error?.message ?? "Unable to delete scenario."
        )
      };
    }
    return { unauthorized: false, data: undefined, error: null };
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
