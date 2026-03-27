// ════════════════════════════════════════════════════════════════════════════
// proposals.ts — Portal API: client proposal list + accept/decline
// Endpoints:
//   GET    /portal/proposals             → list own proposals (auto-expires past validUntil)
//   PATCH  /portal/proposals/:id/accept  → client accepts
//   PATCH  /portal/proposals/:id/decline → client declines with optional reason
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProposalItem {
  id:          string;
  description: string;
  icon:        string;
  amountCents: number;
}

export interface PortalProposal {
  id:                 string;
  clientId:           string;
  projectId:          string | null;
  title:              string;
  summary:            string | null;
  status:             "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  amountCents:        number;
  currency:           string;
  preparedBy:         string | null;
  preparedByInitials: string | null;
  validUntil:         string | null;
  declinedAt:         string | null;
  declineReason:      string | null;
  acceptedAt:         string | null;
  createdAt:          string;
  updatedAt:          string;
  items:              ProposalItem[];
}

// ── List proposals for client ─────────────────────────────────────────────────

export async function loadPortalProposalsWithRefresh(
  session: AuthSession,
  projectId?: string
): Promise<AuthorizedResult<PortalProposal[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = projectId ? "?projectId=" + encodeURIComponent(projectId) : "";
    const response = await callGateway<PortalProposal[]>("/portal/proposals" + qs, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code    ?? "PROPOSALS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load proposals."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Accept a proposal ─────────────────────────────────────────────────────────

export async function acceptPortalProposalWithRefresh(
  session: AuthSession,
  proposalId: string
): Promise<AuthorizedResult<PortalProposal>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalProposal>(
      `/portal/proposals/${proposalId}/accept`,
      accessToken,
      { method: "PATCH" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code    ?? "PROPOSAL_ACCEPT_FAILED",
          response.payload.error?.message ?? "Unable to accept proposal."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Decline a proposal ────────────────────────────────────────────────────────

export async function declinePortalProposalWithRefresh(
  session: AuthSession,
  proposalId: string,
  reason?: string
): Promise<AuthorizedResult<PortalProposal>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalProposal>(
      `/portal/proposals/${proposalId}/decline`,
      accessToken,
      { method: "PATCH", body: reason ? { reason } : {} }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code    ?? "PROPOSAL_DECLINE_FAILED",
          response.payload.error?.message ?? "Unable to decline proposal."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
