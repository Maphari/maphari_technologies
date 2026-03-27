// ════════════════════════════════════════════════════════════════════════════
// governance.ts — Portal API client: Governance (announcements + knowledge)
// Endpoints : GET  /announcements                    (published, client-targeted)
//             GET  /knowledge                         (published articles only)
//             GET  /projects/:id/decisions            (read-only for CLIENT)
//             GET  /content-submissions               (client-scoped)
//             POST /content-submissions               (create for CLIENT)
//             GET  /projects/:id/design-reviews       (design review screens)
//             PATCH /design-reviews/:id/resolve       (approve / request changes)
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PortalAnnouncement {
  id: string;
  title: string;
  type: string;
  target: string;
  reach: number;
  status: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalKnowledgeArticle {
  id: string;
  title: string;
  category: string | null;
  content: string;
  authorId: string | null;
  authorName: string | null;
  status: string;
  publishedAt: string | null;
  tags: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function loadPortalAnnouncementsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalAnnouncement[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalAnnouncement[]>("/announcements", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "ANNOUNCEMENTS_FETCH_FAILED",
          res.payload.error?.message ?? "Unable to load announcements."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function loadPortalKnowledgeArticlesWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalKnowledgeArticle[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalKnowledgeArticle[]>("/knowledge", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "KNOWLEDGE_FETCH_FAILED",
          res.payload.error?.message ?? "Unable to load knowledge articles."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── Project Decisions (read-only for CLIENT) ──────────────────────────────────

export interface PortalDecision {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  context: string | null;
  decidedByName: string | null;
  decidedByRole: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function loadPortalDecisionsWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalDecision[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalDecision[]>(`/projects/${projectId}/decisions`, accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          res.payload.error?.code ?? "DECISIONS_FETCH_FAILED",
          res.payload.error?.message ?? "Unable to load decisions."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── Content Submissions ───────────────────────────────────────────────────────

export interface PortalContentSubmission {
  id: string;
  clientId: string;
  projectId: string | null;
  title: string;
  type: string | null;
  status: string;
  fileUrl: string | null;
  notes: string | null;
  submittedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function loadPortalContentSubmissionsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalContentSubmission[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalContentSubmission[]>("/content-submissions", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          res.payload.error?.code ?? "CONTENT_SUBMISSIONS_FETCH_FAILED",
          res.payload.error?.message ?? "Unable to load content submissions."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function createPortalContentSubmissionWithRefresh(
  session: AuthSession,
  body: { clientId: string; title: string; type?: string; projectId?: string; notes?: string; fileUrl?: string }
): Promise<AuthorizedResult<PortalContentSubmission>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalContentSubmission>("/content-submissions", accessToken, {
      method: "POST",
      body,
    });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success || !res.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "CONTENT_SUBMISSION_CREATE_FAILED",
          res.payload.error?.message ?? "Unable to submit content."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data, error: null };
  });
}

export async function updatePortalContentSubmissionWithRefresh(
  session: AuthSession,
  id: string,
  body: { status: "APPROVED" | "REVISIONS_REQUESTED"; notes?: string }
): Promise<AuthorizedResult<PortalContentSubmission>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalContentSubmission>(
      `/content-submissions/${id}`,
      accessToken,
      { method: "PATCH", body }
    );
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success || !res.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "CONTENT_UPDATE_FAILED",
          res.payload.error?.message ?? "Unable to update content submission."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data, error: null };
  });
}

// ── Design Reviews ─────────────────────────────────────────────────────────────

export interface PortalDesignReview {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
  figmaUrl: string | null;
  screensCount: number | null;
  designerNote: string | null;
  requestedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getPortalDesignReviewsWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalDesignReview[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalDesignReview[]>(
      `/projects/${projectId}/design-reviews`,
      accessToken
    );
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          res.payload.error?.code ?? "DESIGN_REVIEWS_FETCH_FAILED",
          res.payload.error?.message ?? "Unable to load design reviews."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── Generic Approval Decision ─────────────────────────────────────────────────

export interface PortalApprovalDecisionBody {
  status: "APPROVED" | "REVISION_REQUESTED" | "REJECTED";
  notes?: string;
}

export interface PortalApprovalDecisionResult {
  id: string;
  status: string;
  updatedAt: string;
}

/**
 * PATCH /sign-offs/:id
 * Submit a client approval decision on a sign-off / deliverable item.
 */
export async function submitApprovalDecisionWithRefresh(
  session: AuthSession,
  id: string,
  body: PortalApprovalDecisionBody
): Promise<AuthorizedResult<PortalApprovalDecisionResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalApprovalDecisionResult>(
      `/sign-offs/${id}`,
      accessToken,
      { method: "PATCH", body }
    );
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success || !res.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "APPROVAL_DECISION_FAILED",
          res.payload.error?.message ?? "Unable to submit approval decision."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data, error: null };
  });
}

export async function approvePortalDesignReviewWithRefresh(
  session: AuthSession,
  reviewId: string,
  note?: string
): Promise<AuthorizedResult<PortalDesignReview>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<PortalDesignReview>(
      `/design-reviews/${reviewId}/resolve`,
      accessToken,
      { method: "PATCH", body: { status: "APPROVED", note } }
    );
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success || !res.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "DESIGN_REVIEW_APPROVE_FAILED",
          res.payload.error?.message ?? "Unable to approve design review."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data, error: null };
  });
}
