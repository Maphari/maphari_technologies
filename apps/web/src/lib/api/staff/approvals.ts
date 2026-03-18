// ════════════════════════════════════════════════════════════════════════════
// approvals.ts — Staff API client: approval queue endpoints
// Endpoints : GET  /staff/approvals
//             PATCH /staff/approvals/:type/:id  (approve / reject)
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

export type ApprovalItemType = "Milestone" | "Change Request" | "Design Review";
export type ApprovalStatus   = "Pending" | "Approved" | "Rejected";
export type ApprovalPriority = "Urgent" | "Normal" | "Low";
export type ApprovalAction   = "approve" | "reject";
export type ApprovalEntityType = "milestone" | "change-request" | "design-review";

export interface StaffApprovalItem {
  id:          string;
  type:        ApprovalItemType;
  title:       string;
  project:     string;
  client:      string;
  requestedBy: string;
  requestedAt: string;
  priority:    ApprovalPriority;
  status:      ApprovalStatus;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** Fetch the approval queue (milestones + change requests + design reviews) */
export async function getStaffApprovals(
  session: AuthSession
): Promise<AuthorizedResult<StaffApprovalItem[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffApprovalItem[]>(
      "/staff/approvals",
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_APPROVALS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load approval queue."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Resolve (approve or reject) an approval item */
export async function resolveStaffApproval(
  session:    AuthSession,
  entityType: ApprovalEntityType,
  id:         string,
  action:     ApprovalAction,
  comment?:   string
): Promise<AuthorizedResult<{ id: string; status: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ id: string; status: string }>(
      `/staff/approvals/${entityType}/${id}`,
      accessToken,
      { method: "PATCH", body: { action, comment } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_APPROVAL_RESOLVE_FAILED",
          response.payload.error?.message ?? "Unable to resolve approval."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
