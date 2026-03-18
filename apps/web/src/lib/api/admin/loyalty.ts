// ════════════════════════════════════════════════════════════════════════════
// loyalty.ts — Admin API client: loyalty accounts & credit transactions
// Endpoints : GET  /loyalty
//             GET  /loyalty/:clientId
//             POST /loyalty/:clientId/transactions
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AdminCreditTransaction {
  id: string;
  loyaltyAccountId: string;
  type: string;
  points: number;
  description: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface AdminLoyaltyAccount {
  id: string;
  clientId: string;
  tier: string;
  balancePoints: number;
  totalEarned: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
  transactions: AdminCreditTransaction[];
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function loadLoyaltyAccountsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminLoyaltyAccount[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLoyaltyAccount[]>("/loyalty", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "LOYALTY_FETCH_FAILED", response.payload.error?.message ?? "Unable to load loyalty accounts.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadLoyaltyAccountWithRefresh(
  session: AuthSession,
  clientId: string
): Promise<AuthorizedResult<AdminLoyaltyAccount | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminLoyaltyAccount | null>(`/loyalty/${clientId}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "LOYALTY_FETCH_FAILED", response.payload.error?.message ?? "Unable to load loyalty account.") };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function issueLoyaltyCreditsWithRefresh(
  session: AuthSession,
  clientId: string,
  input: { type?: "EARNED" | "REDEEMED" | "ADJUSTED"; points: number; description?: string; referenceId?: string }
): Promise<AuthorizedResult<AdminCreditTransaction>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminCreditTransaction>(`/loyalty/${clientId}/transactions`, accessToken, { method: "POST", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "LOYALTY_TRANSACTION_FAILED", response.payload.error?.message ?? "Unable to issue credits.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
