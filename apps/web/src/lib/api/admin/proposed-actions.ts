// ════════════════════════════════════════════════════════════════════════════
// proposed-actions.ts — Admin API: list, approve, and reject proposed actions
//                        for the multi-admin accountability workflow
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession, type AuthorizedResult } from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProposedAction {
  id:             string;
  proposedBy:     string;
  proposedByName: string | null;
  action:         string;
  resourceType:   string;
  resourceId:     string | null;
  payload:        string | null;
  reason:         string | null;
  status:         "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED";
  reviewedBy:     string | null;
  reviewedByName: string | null;
  reviewedAt:     string | null;
  reviewNote:     string | null;
  createdAt:      string;
}

const UNAUTHORIZED = { unauthorized: true as const, data: null, error: null };

// ── List ──────────────────────────────────────────────────────────────────────

export async function listProposedActionsWithRefresh(
  session: AuthSession,
  status?: string
): Promise<AuthorizedResult<ProposedAction[]>> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";

  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<ProposedAction[]>(
      `/admin/proposed-actions${qs}`,
      accessToken
    );

    if (isUnauthorized(res)) return UNAUTHORIZED;
    if (!res.payload.success || !res.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "REQUEST_FAILED",
          res.payload.error?.message ?? "Failed to load proposed actions."
        )
      };
    }

    return { unauthorized: false, data: res.payload.data, error: null };
  });
}

// ── Approve ───────────────────────────────────────────────────────────────────

export async function approveProposedActionWithRefresh(
  session: AuthSession,
  id: string,
  reviewNote?: string
): Promise<AuthorizedResult<ProposedAction>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<ProposedAction>(
      `/admin/proposed-actions/${id}/approve`,
      accessToken,
      { method: "PATCH", body: { reviewNote } }
    );

    if (isUnauthorized(res)) return UNAUTHORIZED;
    if (!res.payload.success || !res.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "REQUEST_FAILED",
          res.payload.error?.message ?? "Failed to approve proposed action."
        )
      };
    }

    return { unauthorized: false, data: res.payload.data, error: null };
  });
}

// ── Reject ────────────────────────────────────────────────────────────────────

export async function rejectProposedActionWithRefresh(
  session: AuthSession,
  id: string,
  reviewNote?: string
): Promise<AuthorizedResult<ProposedAction>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<ProposedAction>(
      `/admin/proposed-actions/${id}/reject`,
      accessToken,
      { method: "PATCH", body: { reviewNote } }
    );

    if (isUnauthorized(res)) return UNAUTHORIZED;
    if (!res.payload.success || !res.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "REQUEST_FAILED",
          res.payload.error?.message ?? "Failed to reject proposed action."
        )
      };
    }

    return { unauthorized: false, data: res.payload.data, error: null };
  });
}
