// ════════════════════════════════════════════════════════════════════════════
// apps/web/src/lib/api/admin/proposals.ts
// Admin API client for proposal CRUD operations
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminProposalItem {
  id?: string;
  description: string;
  icon: string;
  amountCents: number;
  sortOrder: number;
}

export interface AdminProposalSummary {
  id: string;
  clientId: string;
  title: string;
  summary: string | null;
  status: string;
  amountCents: number;
  currency: string;
  validUntil: string | null;
  createdAt: string;
  items: AdminProposalItem[];
}

export interface CreateAdminProposalPayload {
  clientId: string;
  title: string;
  summary?: string;
  status?: "DRAFT" | "PENDING";
  currency?: string;
  validUntil?: string;
  items: Array<{ description: string; icon: string; amountCents: number; sortOrder: number }>;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Load all proposals (admin view).
 * Gateway: GET /admin/proposals
 */
export async function loadAdminProposalsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminProposalSummary[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<AdminProposalSummary[]>("/admin/proposals", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "PROPOSALS_FETCH_FAILED",
          res.payload.error?.message ?? "Failed to load proposals."
        )
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

/**
 * Create a new proposal for a client.
 * Gateway: POST /admin/proposals
 */
export async function createAdminProposalWithRefresh(
  session: AuthSession,
  payload: CreateAdminProposalPayload
): Promise<AuthorizedResult<AdminProposalSummary>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<AdminProposalSummary>("/admin/proposals", accessToken, {
      method: "POST",
      body: payload
    });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "PROPOSAL_CREATE_FAILED",
          res.payload.error?.message ?? "Failed to create proposal."
        )
      };
    }
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

/**
 * Delete a draft proposal.
 * Gateway: DELETE /admin/proposals/:id
 */
export async function deleteAdminProposalWithRefresh(
  session: AuthSession,
  proposalId: string
): Promise<AuthorizedResult<{ success: boolean }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<{ deleted: boolean }>(`/admin/proposals/${proposalId}`, accessToken, {
      method: "DELETE"
    });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "PROPOSAL_DELETE_FAILED",
          res.payload.error?.message ?? "Failed to delete proposal."
        )
      };
    }
    return { unauthorized: false, data: { success: true }, error: null };
  });
}
