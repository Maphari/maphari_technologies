// ════════════════════════════════════════════════════════════════════════════
// expenses.ts — Admin API client: expenses & budgets
// Endpoints : GET  /expenses
//             GET  /expense-budgets
//             POST /expenses
//             PATCH /expenses/:id/approve
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AdminExpense {
  id: string;
  clientId: string | null;
  category: string;
  subcategory: string | null;
  description: string;
  amountCents: number;
  submittedBy: string | null;
  status: string;
  hasReceipt: boolean;
  isBillable: boolean;
  expenseDate: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminExpenseBudget {
  id: string;
  category: string;
  budgetCents: number;
  spentCents: number;
  fiscalYear: number;
  createdAt: string;
  updatedAt: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function loadExpensesWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminExpense[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminExpense[]>("/expenses", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "EXPENSES_FETCH_FAILED", response.payload.error?.message ?? "Unable to load expenses.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadExpenseBudgetsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminExpenseBudget[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminExpenseBudget[]>("/expense-budgets", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "EXPENSE_BUDGETS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load expense budgets.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function approveExpenseWithRefresh(
  session: AuthSession,
  expenseId: string,
  action: "approve" | "reject" = "approve"
): Promise<AuthorizedResult<AdminExpense>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminExpense>(`/expenses/${expenseId}/approve`, accessToken, { method: "PATCH", body: { action } });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "EXPENSE_APPROVE_FAILED", response.payload.error?.message ?? "Unable to update expense.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createExpenseWithRefresh(
  session: AuthSession,
  input: { category: string; description: string; amountCents: number; subcategory?: string; clientId?: string; isBillable?: boolean; hasReceipt?: boolean; expenseDate?: string }
): Promise<AuthorizedResult<AdminExpense>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminExpense>("/expenses", accessToken, { method: "POST", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "EXPENSE_CREATE_FAILED", response.payload.error?.message ?? "Unable to create expense.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
