// ════════════════════════════════════════════════════════════════════════════
// expenses.ts — Staff API client: expense submission & history
// Endpoints : GET  /expenses
//             POST /expenses
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StaffExpenseRecord {
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

// ── API functions ─────────────────────────────────────────────────────────────

export async function loadMyExpensesWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffExpenseRecord[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffExpenseRecord[]>("/expenses", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "EXPENSES_FETCH_FAILED", response.payload.error?.message ?? "Unable to load expenses.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function submitExpenseWithRefresh(
  session: AuthSession,
  input: { category: string; description: string; amountCents: number; subcategory?: string; clientId?: string; isBillable?: boolean; hasReceipt?: boolean; expenseDate?: string }
): Promise<AuthorizedResult<StaffExpenseRecord>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffExpenseRecord>("/expenses", accessToken, { method: "POST", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "EXPENSE_SUBMIT_FAILED", response.payload.error?.message ?? "Unable to submit expense.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
