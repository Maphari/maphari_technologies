// ════════════════════════════════════════════════════════════════════════════
// governance.ts — Staff API client: Governance (handovers + knowledge base
//                 + meetings)
// Endpoints : GET /handovers
//             POST /handovers
//             PATCH /handovers/:id
//             GET /knowledge
//             GET /meetings
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
export interface StaffHandover {
  id: string;
  fromStaffName: string | null;
  toStaffName: string | null;
  projectId: string | null;
  clientId: string | null;
  status: string;
  notes: string | null;
  transferDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffKnowledgeArticle {
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

// ── Handovers ─────────────────────────────────────────────────────────────────

export async function loadStaffHandoversWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffHandover[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<StaffHandover[]>("/handovers", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "HANDOVERS_FETCH_FAILED", res.payload.error?.message ?? "Unable to load handovers.") };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function updateStaffHandoverWithRefresh(
  session: AuthSession,
  id: string,
  body: Partial<{ status: string; notes: string; toStaffName: string; transferDate: string }>
): Promise<AuthorizedResult<StaffHandover>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<StaffHandover>(`/handovers/${id}`, accessToken, { method: "PATCH", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success || !res.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "HANDOVER_UPDATE_FAILED", res.payload.error?.message ?? "Unable to update handover.") };
    }
    return { unauthorized: false, data: res.payload.data, error: null };
  });
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export interface StaffMeeting {
  id: string;
  title: string;
  clientId: string | null;
  scheduledAt: string;
  durationMinutes: number | null;
  agenda: string | null;
  notes: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  videoRoomUrl: string | null;
  videoProvider: string | null;
  videoCallStatus: string | null;
  createdAt: string;
}

export async function getStaffMeetingsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffMeeting[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<StaffMeeting[]>("/meetings", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          res.payload.error?.code ?? "MEETINGS_FETCH_FAILED",
          res.payload.error?.message ?? "Unable to load meetings."
        ),
      };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── Ad-hoc Video Rooms ────────────────────────────────────────────────────────

export interface AdHocRoom {
  roomUrl:          string;
  roomName:         string;
  topic:            string;
  createdBy:        string | null;
  expiresInMinutes: number;
}

export async function createAdHocVideoRoom(
  session: AuthSession,
  topic?: string
): Promise<AuthorizedResult<AdHocRoom>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdHocRoom>(
      "/video-rooms",
      accessToken,
      { method: "POST", body: { topic } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "VIDEO_ROOM_FAILED",
          response.payload.error?.message ?? "Unable to create video room."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Staff Decisions ───────────────────────────────────────────────────────────

export interface StaffDecision {
  id:            string;
  projectId:     string;
  clientId:      string;
  title:         string;
  context:       string | null;
  decidedByName: string | null;
  decidedByRole: string | null;
  decidedAt:     string | null;
  createdAt:     string;
  projectName:   string;
  clientName:    string;
}

export interface StaffDecisionCreated {
  id:            string;
  projectId:     string;
  clientId:      string;
  title:         string;
  context:       string | null;
  decidedByName: string | null;
  decidedByRole: string | null;
  decidedAt:     string | null;
  createdAt:     string;
}

export async function getStaffAllDecisions(
  session: AuthSession
): Promise<AuthorizedResult<StaffDecision[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<StaffDecision[]>("/staff/decisions", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "STAFF_DECISIONS_FETCH_FAILED", res.payload.error?.message ?? "Unable to load decisions.") };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function createStaffProjectDecision(
  session: AuthSession,
  projectId: string,
  input: { clientId: string; title: string; context?: string; decidedByName?: string; decidedByRole?: string; decidedAt?: string }
): Promise<AuthorizedResult<StaffDecisionCreated>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<StaffDecisionCreated>(`/projects/${projectId}/decisions`, accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success || !res.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "STAFF_DECISION_CREATE_FAILED", res.payload.error?.message ?? "Unable to create decision.") };
    }
    return { unauthorized: false, data: res.payload.data, error: null };
  });
}

// ── Knowledge Articles ────────────────────────────────────────────────────────

export async function loadStaffKnowledgeArticlesWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<StaffKnowledgeArticle[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<StaffKnowledgeArticle[]>("/knowledge", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) {
      return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "KNOWLEDGE_FETCH_FAILED", res.payload.error?.message ?? "Unable to load knowledge articles.") };
    }
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}
