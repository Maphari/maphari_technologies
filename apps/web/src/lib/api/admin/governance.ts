// ════════════════════════════════════════════════════════════════════════════
// governance.ts — Admin API client: Governance & Ops domain
// Endpoints : GET  /announcements          POST         PATCH /:id/publish
//             GET  /knowledge              POST         PATCH /:id
//             POST /knowledge/:id/view
//             GET  /decision-records       POST         PATCH /:id
//             GET  /handovers              POST         PATCH /:id
//             GET  /design-reviews         POST         PATCH /:id/resolve
//             GET  /audit-events
//             GET  /market-intel           POST         PATCH /:id
//             GET  /content-submissions    POST         PATCH /:id/approve
//             GET  /risks                  (ADMIN portfolio view)
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./_shared";

// ── Types — Announcements ─────────────────────────────────────────────────────
export interface AdminAnnouncement {
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

// ── Types — Knowledge Articles ────────────────────────────────────────────────
export interface AdminKnowledgeArticle {
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

// ── Types — Decision Records ──────────────────────────────────────────────────
export interface AdminDecisionRecord {
  id: string;
  title: string;
  context: string | null;
  outcome: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  tags: string | null;
  projectId: string | null;
  clientId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ── Types — Handovers ─────────────────────────────────────────────────────────
export interface AdminHandover {
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

// ── Types — Design Reviews ────────────────────────────────────────────────────
export interface AdminDesignReview {
  id: string;
  projectId: string;
  clientId: string;
  round: number;
  reviewerName: string | null;
  status: string;
  submittedAt: string;
  resolvedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Types — Audit Events ──────────────────────────────────────────────────────
export interface AdminAuditEvent {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  actorName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// ── Types — Market Intel ──────────────────────────────────────────────────────
export interface AdminMarketIntel {
  id: string;
  type: string;
  title: string;
  source: string | null;
  summary: string | null;
  relevance: string;
  tags: string | null;
  enteredByName: string | null;
  enteredAt: string;
  createdAt: string;
  updatedAt: string;
}

// ── Types — Content Submissions ───────────────────────────────────────────────
export interface AdminContentSubmission {
  id: string;
  clientId: string;
  title: string;
  type: string;
  submittedById: string | null;
  submittedByName: string | null;
  status: string;
  approvedById: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Announcements ─────────────────────────────────────────────────────────────
export async function loadAnnouncementsWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminAnnouncement[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminAnnouncement[]>("/admin/announcements", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function publishAnnouncementWithRefresh(session: AuthSession, id: string): Promise<AuthorizedResult<AdminAnnouncement>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminAnnouncement>(`/admin/announcements/${id}/publish`, token, { method: "PATCH" });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

export async function createAnnouncementWithRefresh(
  session: AuthSession,
  body: { title: string; type?: string; target?: string; scheduledAt?: string }
): Promise<AuthorizedResult<AdminAnnouncement>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminAnnouncement>("/admin/announcements", token, { method: "POST", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

// ── Knowledge Articles ────────────────────────────────────────────────────────
export async function loadKnowledgeArticlesWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminKnowledgeArticle[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminKnowledgeArticle[]>("/admin/knowledge", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function updateKnowledgeArticleWithRefresh(
  session: AuthSession,
  id: string,
  body: Partial<{ title: string; content: string; category: string; tags: string; status: string }>
): Promise<AuthorizedResult<AdminKnowledgeArticle>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminKnowledgeArticle>(`/admin/knowledge/${id}`, token, { method: "PATCH", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

export async function createKnowledgeArticleWithRefresh(
  session: AuthSession,
  body: { title: string; content: string; category?: string; tags?: string; authorName?: string }
): Promise<AuthorizedResult<AdminKnowledgeArticle>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminKnowledgeArticle>("/admin/knowledge", token, { method: "POST", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

// ── Decision Records ──────────────────────────────────────────────────────────
export async function loadDecisionRecordsWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminDecisionRecord[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminDecisionRecord[]>("/admin/decision-records", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function createDecisionRecordWithRefresh(
  session: AuthSession,
  body: { title: string; context?: string; outcome?: string; decidedByName?: string; decidedAt?: string; tags?: string; projectId?: string; clientId?: string }
): Promise<AuthorizedResult<AdminDecisionRecord>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminDecisionRecord>("/admin/decision-records", token, { method: "POST", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

// ── Handovers ─────────────────────────────────────────────────────────────────
export async function loadHandoversWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminHandover[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminHandover[]>("/admin/handovers", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function createHandoverWithRefresh(
  session: AuthSession,
  body: { fromStaffName?: string; toStaffName?: string; projectId?: string; clientId?: string; notes?: string; transferDate?: string }
): Promise<AuthorizedResult<AdminHandover>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminHandover>("/admin/handovers", token, { method: "POST", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

export async function updateHandoverWithRefresh(
  session: AuthSession,
  id: string,
  body: Partial<{ status: string; notes: string; toStaffName: string; transferDate: string }>
): Promise<AuthorizedResult<AdminHandover>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminHandover>(`/admin/handovers/${id}`, token, { method: "PATCH", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

// ── Design Reviews ────────────────────────────────────────────────────────────
export async function loadDesignReviewsWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminDesignReview[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminDesignReview[]>("/admin/design-reviews", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function resolveDesignReviewWithRefresh(
  session: AuthSession,
  id: string,
  body?: { notes?: string }
): Promise<AuthorizedResult<AdminDesignReview>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminDesignReview>(`/admin/design-reviews/${id}/resolve`, token, { method: "PATCH", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

// ── Audit Events ──────────────────────────────────────────────────────────────
export async function loadAuditEventsWithRefresh(
  session: AuthSession,
  params?: { actorId?: string; resourceType?: string; limit?: number }
): Promise<AuthorizedResult<AdminAuditEvent[]>> {
  return withAuthorizedSession(session, async (token) => {
    const qs = new URLSearchParams();
    if (params?.actorId)      qs.set("actorId",      params.actorId);
    if (params?.resourceType) qs.set("resourceType", params.resourceType);
    if (params?.limit)        qs.set("limit",        String(params.limit));
    const path = `/admin/audit-events${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await callGateway<AdminAuditEvent[]>(path, token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── Market Intelligence ───────────────────────────────────────────────────────
export async function loadMarketIntelWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminMarketIntel[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminMarketIntel[]>("/admin/market-intel", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function createMarketIntelWithRefresh(
  session: AuthSession,
  body: { title: string; type?: string; source?: string; summary?: string; relevance?: string; tags?: string; enteredByName?: string }
): Promise<AuthorizedResult<AdminMarketIntel>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminMarketIntel>("/admin/market-intel", token, { method: "POST", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

// ── Content Submissions ───────────────────────────────────────────────────────
export async function loadContentSubmissionsWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminContentSubmission[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminContentSubmission[]>("/admin/content-submissions", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function approveContentSubmissionWithRefresh(
  session: AuthSession,
  id: string,
  body: { approved: boolean; notes?: string }
): Promise<AuthorizedResult<AdminContentSubmission>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminContentSubmission>(`/admin/content-submissions/${id}/approve`, token, { method: "PATCH", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

// ── Competitor Intelligence ───────────────────────────────────────────────────

export interface AdminCompetitor {
  id: string;
  name: string;
  type: string;
  tier: string;
  color: string;
  services: string[];
  strengths: string[];
  weaknesses: string[];
  pricing: string | null;
  positioning: string | null;
  beatStrategy: string | null;
  avgRetainer: number;
  winsCount: number;
  lossesCount: number;
  lastUpdated: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWinLossEntry {
  id: string;
  date: string;
  prospect: string;
  outcome: string;
  competitorId: string | null;
  competitorName: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AdminMarketRate {
  id: string;
  service: string;
  maphari: number;
  marketLow: number;
  marketMid: number;
  marketHigh: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export async function loadCompetitorsWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminCompetitor[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminCompetitor[]>("/admin/competitors", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function createCompetitorWithRefresh(
  session: AuthSession,
  body: { name: string; type?: string; tier?: string; color?: string; services?: string[]; strengths?: string[]; weaknesses?: string[]; pricing?: string; positioning?: string; beatStrategy?: string; avgRetainer?: number; lastUpdated?: string }
): Promise<AuthorizedResult<AdminCompetitor>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminCompetitor>("/admin/competitors", token, { method: "POST", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

export async function updateCompetitorWithRefresh(
  session: AuthSession,
  id: string,
  body: Partial<AdminCompetitor>
): Promise<AuthorizedResult<AdminCompetitor>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminCompetitor>(`/admin/competitors/${id}`, token, { method: "PATCH", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

export async function loadWinLossWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminWinLossEntry[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminWinLossEntry[]>("/admin/win-loss", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function createWinLossEntryWithRefresh(
  session: AuthSession,
  body: { date: string; prospect: string; outcome?: string; competitorId?: string; reason?: string; notes?: string }
): Promise<AuthorizedResult<AdminWinLossEntry>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminWinLossEntry>("/admin/win-loss", token, { method: "POST", body });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

export async function loadMarketRatesWithRefresh(session: AuthSession): Promise<AuthorizedResult<AdminMarketRate[]>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminMarketRate[]>("/admin/market-rates", token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: [], error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

// ── Portfolio Risk Register ───────────────────────────────────────────────────

export interface AdminPortfolioRisk {
  id: string;
  projectId: string;
  clientId: string;
  name: string;
  detail: string | null;
  likelihood: string;
  impact: string;
  mitigation: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  project?: { name: string };
}

// ── Crisis Command ────────────────────────────────────────────────────────────

export interface AdminCrisis {
  id:          string;
  title:       string;
  severity:    string;
  status:      string;
  description: string | null;
  ownerId:     string | null;
  clientId:    string | null;
  resolvedAt:  string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateCrisisInput {
  title:        string;
  severity?:    string;
  status?:      string;
  description?: string;
  ownerId?:     string;
  clientId?:    string;
}

export interface UpdateCrisisInput {
  title?:       string;
  severity?:    string;
  status?:      string;
  description?: string;
  ownerId?:     string;
  clientId?:    string;
  resolvedAt?:  string;
}

export async function loadAdminCrisesWithRefresh(
  session: AuthSession,
  params?: { status?: string }
): Promise<AuthorizedResult<AdminCrisis[]>> {
  return withAuthorizedSession(session, async (token) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    const path = `/admin/crises${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await callGateway<AdminCrisis[]>(path, token);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? [], error: null };
  });
}

export async function createCrisisWithRefresh(
  session: AuthSession,
  data: CreateCrisisInput
): Promise<AuthorizedResult<AdminCrisis>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminCrisis>("/admin/crises", token, { method: "POST", body: data });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

export async function updateCrisisWithRefresh(
  session: AuthSession,
  id: string,
  data: UpdateCrisisInput
): Promise<AuthorizedResult<AdminCrisis>> {
  return withAuthorizedSession(session, async (token) => {
    const res = await callGateway<AdminCrisis>(`/admin/crises/${id}`, token, { method: "PATCH", body: data });
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error?.code ?? "ERR", res.payload.error?.message ?? "Failed") };
    return { unauthorized: false, data: res.payload.data ?? null, error: null };
  });
}

// ── Portfolio Risk Register ───────────────────────────────────────────────────

export async function loadAllPortfolioRisksWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminPortfolioRisk[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminPortfolioRisk[]>("/risks", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "PORTFOLIO_RISKS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load portfolio risks.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
