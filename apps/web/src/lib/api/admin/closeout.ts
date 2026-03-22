import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";

// ── Types — FY Checklist ──────────────────────────────────────────────────────

export interface FyChecklistItem {
  id:         string;
  fiscalYear: string;
  label:      string;
  category:   string;
  done:       boolean;
  doneAt:     string | null;
  doneBy:     string | null;
  createdAt:  string;
  updatedAt:  string;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CloseoutReport {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  submittedBy: string;
  status: "PENDING_REVIEW" | "APPROVED" | "CHANGES_REQUESTED";
  budgetVarianceCents: number;
  /** Formatted string, e.g. "+R 5,000.00" or "-R 2,000.00" */
  budgetVariance: string;
  lessonsCount: number;
  lessonsLearned: string[];
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function fetchCloseoutReports(
  session: AuthSession
): Promise<AuthorizedResult<CloseoutReport[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<CloseoutReport[]>("/admin/closeout-reports", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLOSEOUT_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load close-out reports."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function approveCloseoutReport(
  session: AuthSession,
  id: string,
  status: "APPROVED" | "CHANGES_REQUESTED",
  notes?: string
): Promise<AuthorizedResult<CloseoutReport>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<CloseoutReport>(
      `/admin/closeout-reports/${id}`,
      accessToken,
      { method: "PATCH", body: { status, notes } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CLOSEOUT_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update close-out report."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── FY Checklist ──────────────────────────────────────────────────────────────

export async function loadFyChecklistWithRefresh(
  session: AuthSession,
  year: string
): Promise<AuthorizedResult<FyChecklistItem[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<FyChecklistItem[]>(`/admin/fy-checklist?year=${encodeURIComponent(year)}`, token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "FY_CHECKLIST_FETCH_FAILED", res.payload.error?.message ?? "Unable to load FY checklist.") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function toggleFyChecklistItemWithRefresh(
  session: AuthSession,
  id: string,
  done: boolean
): Promise<AuthorizedResult<FyChecklistItem>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<FyChecklistItem>(`/admin/fy-checklist/${id}`, token, { method: "PATCH", body: { done } });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "FY_CHECKLIST_UPDATE_FAILED", res.payload.error?.message ?? "Unable to toggle checklist item.") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}
