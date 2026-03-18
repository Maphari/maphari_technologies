// ════════════════════════════════════════════════════════════════════════════
// loyalty.ts — Portal API client: client loyalty account
// Endpoint  : GET /loyalty/:clientId
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "./internal";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PortalCreditTransaction {
  id: string;
  loyaltyAccountId: string;
  type: string;
  points: number;
  description: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface PortalLoyaltyAccount {
  id: string;
  clientId: string;
  tier: string;
  balancePoints: number;
  totalEarned: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
  transactions: PortalCreditTransaction[];
}

// ── API functions ─────────────────────────────────────────────────────────────

export interface PortalRedeemResult {
  id: string;
  loyaltyAccountId: string;
  type: string;
  points: number;
  description: string | null;
  referenceId: string | null;
  createdAt: string;
}

export async function redeemLoyaltyCreditsWithRefresh(
  session: AuthSession,
  points: number,
  description?: string
): Promise<AuthorizedResult<PortalRedeemResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalRedeemResult>("/loyalty/redeem", accessToken, {
      method: "POST",
      body: { points, description }
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "REDEEM_FAILED",
          response.payload.error?.message ?? "Unable to redeem credits."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadMyLoyaltyWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalLoyaltyAccount | null>> {
  const clientId = session.user.clientId;
  if (!clientId) {
    return { data: null, nextSession: session, error: null };
  }

  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalLoyaltyAccount | null>(`/loyalty/${clientId}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "LOYALTY_FETCH_FAILED", response.payload.error?.message ?? "Unable to load loyalty account.") };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}
