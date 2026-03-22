// ════════════════════════════════════════════════════════════════════════════
// feature-requests.ts — Portal API: client feature requests + voting
// Endpoints:
//   GET    /portal/feature-requests
//   POST   /portal/feature-requests
//   POST   /portal/feature-requests/:requestId/vote
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

export interface FeatureRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  anonAlias: string;
  status: string;
  voteCount: number;
  createdAt: string;
  votes: Array<{ voterId: string }>;
}

export interface FeatureRequestListMeta {
  page: number;
  limit: number;
  total: number;
  requestId?: string;
}

export interface FeatureRequestListResult {
  data: FeatureRequest[];
  meta: FeatureRequestListMeta;
}

export interface CreatedFeatureRequest {
  id: string;
  category: string;
  title: string;
  anonAlias: string;
  status: string;
  createdAt: string;
}

export interface FeatureVoteResult {
  voted: boolean;
  voteCount: number;
}

// ── API functions ──────────────────────────────────────────────────────────────

/** List approved feature requests. */
export async function loadPortalFeatureRequestsWithRefresh(
  session: AuthSession,
  params?: { category?: string; status?: string; sort?: "votes" | "newest"; page?: number; limit?: number }
): Promise<AuthorizedResult<FeatureRequestListResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.status) qs.set("status", params.status);
    if (params?.sort) qs.set("sort", params.sort === "newest" ? "newest" : "votes");
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const url = `/portal/feature-requests${qs.toString() ? `?${qs}` : ""}`;
    const response = await callGateway<FeatureRequestListResult>(url, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FEATURE_REQUESTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load feature requests."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

/** Submit a new feature request (pending admin approval). */
export async function submitPortalFeatureRequestWithRefresh(
  session: AuthSession,
  body: { category: string; title: string; description: string }
): Promise<AuthorizedResult<CreatedFeatureRequest>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<CreatedFeatureRequest>(
      "/portal/feature-requests",
      accessToken,
      { method: "POST", body }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FEATURE_REQUEST_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to submit feature request."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Toggle vote on a feature request (idempotent). */
export async function togglePortalFeatureVoteWithRefresh(
  session: AuthSession,
  requestId: string
): Promise<AuthorizedResult<FeatureVoteResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<FeatureVoteResult>(
      `/portal/feature-requests/${requestId}/vote`,
      accessToken,
      { method: "POST" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "FEATURE_VOTE_FAILED",
          response.payload.error?.message ?? "Unable to toggle feature vote."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
