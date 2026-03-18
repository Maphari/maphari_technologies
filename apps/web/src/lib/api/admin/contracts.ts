import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LegalContract {
  id: string;
  clientId: string;
  title: string;
  type: string;          // NDA | SOW | DPA | MSA | CONTRACT
  ref: string | null;
  status: string;        // PENDING | SIGNED | VOID
  signed: boolean;
  signedAt: string | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function fetchContracts(
  session: AuthSession,
  clientId?: string
): Promise<AuthorizedResult<LegalContract[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
    const response = await callGateway<LegalContract[]>(`/contracts${qs}`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CONTRACTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load contracts."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Load all contracts (admin — no clientId filter) ───────────────────────────

export async function loadAdminContractsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<LegalContract[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<LegalContract[]>("/contracts", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code    ?? "CONTRACTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load contracts."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
