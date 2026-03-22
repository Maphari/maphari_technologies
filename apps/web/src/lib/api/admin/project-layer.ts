// ════════════════════════════════════════════════════════════════════════════
// project-layer.ts — Admin API client: project-layer domain endpoints
// Endpoints : GET  /projects/:id/deliverables  POST  PATCH  DELETE
//             GET  /projects/:id/risks          POST  PATCH
//             GET  /projects/:id/decisions      POST  PATCH
//             GET  /projects/:id/sprints        POST  PATCH
//             GET  /projects/:id/sprints/:sid/tasks
//             GET  /projects/:id/sign-offs      POST  PATCH /:id/sign
//             GET  /projects/:id/phases         POST  PATCH
//             GET  /projects/:id/brief          PUT
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
import { loadProjectDirectoryWithRefresh } from "./projects";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ProjectDeliverable {
  id: string;
  projectId: string;
  milestoneId: string | null;
  name: string;
  ownerName: string | null;
  status: string;
  dueAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRisk {
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
}

export interface ProjectDecision {
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

export interface ProjectSprint {
  id: string;
  projectId: string;
  clientId: string;
  name: string;
  ownerName: string | null;
  startAt: string | null;
  endAt: string | null;
  progressPercent: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSignOff {
  id: string;
  projectId: string;
  clientId: string;
  name: string;
  description: string | null;
  status: string;
  signedAt: string | null;
  signedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  clientId: string;
  name: string;
  budgetedHours: number;
  loggedHours: number;
  color: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBrief {
  id: string;
  projectId: string;
  clientId: string;
  objectives: string;
  inScope: string;
  outOfScope: string;
  contacts: string;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ── Deliverables ──────────────────────────────────────────────────────────────

export async function getDeliverables(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<ProjectDeliverable[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectDeliverable[]>(`/projects/${projectId}/deliverables`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "DELIVERABLES_FETCH_FAILED", response.payload.error?.message ?? "Unable to load deliverables.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createDeliverable(
  session: AuthSession,
  projectId: string,
  input: { name: string; milestoneId?: string; ownerName?: string; status?: string; dueAt?: string }
): Promise<AuthorizedResult<ProjectDeliverable>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectDeliverable>(`/projects/${projectId}/deliverables`, accessToken, { method: "POST", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "DELIVERABLE_CREATE_FAILED", response.payload.error?.message ?? "Unable to create deliverable.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateDeliverable(
  session: AuthSession,
  projectId: string,
  id: string,
  input: { name?: string; ownerName?: string; status?: string; dueAt?: string | null; deliveredAt?: string | null }
): Promise<AuthorizedResult<ProjectDeliverable>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectDeliverable>(`/projects/${projectId}/deliverables/${id}`, accessToken, { method: "PATCH", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "DELIVERABLE_UPDATE_FAILED", response.payload.error?.message ?? "Unable to update deliverable.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function approveDeliverableWithRefresh(
  session: AuthSession,
  projectId: string,
  deliverableId: string
): Promise<AuthorizedResult<ProjectDeliverable>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectDeliverable>(
      `/projects/${projectId}/deliverables/${deliverableId}/approve`,
      accessToken,
      { method: "POST", body: {} }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "DELIVERABLE_APPROVE_FAILED", response.payload.error?.message ?? "Unable to approve deliverable.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function requestDeliverableChangesWithRefresh(
  session: AuthSession,
  projectId: string,
  deliverableId: string,
  reason?: string
): Promise<AuthorizedResult<ProjectDeliverable>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectDeliverable>(
      `/projects/${projectId}/deliverables/${deliverableId}/request-changes`,
      accessToken,
      { method: "POST", body: { reason } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "DELIVERABLE_CHANGES_FAILED", response.payload.error?.message ?? "Unable to request changes.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export interface ProjectDeliverableWithContext extends ProjectDeliverable {
  projectName: string;
  clientId: string;
}

export async function loadAllProjectDeliverablesWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<ProjectDeliverableWithContext[]>> {
  // Step 1: load the project directory (up to 200 projects for admin QA view)
  const dirResult = await loadProjectDirectoryWithRefresh(session, { pageSize: 200 });
  if (dirResult.error && !dirResult.data) {
    return { data: [], nextSession: dirResult.nextSession, error: dirResult.error };
  }
  const projects = dirResult.data?.items ?? [];
  if (projects.length === 0) {
    return { data: [], nextSession: dirResult.nextSession, error: null };
  }

  // Step 2: fetch deliverables for all projects in parallel
  const results = await Promise.all(
    projects.map(async (project) => {
      const r = await getDeliverables(session, project.id);
      const items: ProjectDeliverableWithContext[] = (r.data ?? []).map((d) => ({
        ...d,
        projectName: project.name,
        clientId: project.clientId
      }));
      return { items, nextSession: r.nextSession };
    })
  );

  const allDeliverables = results.flatMap((r) => r.items);
  // Use the last non-null nextSession from any call (or from the directory call)
  const nextSession =
    results.map((r) => r.nextSession).reverse().find((s) => s != null) ??
    dirResult.nextSession;

  return { data: allDeliverables, nextSession, error: null };
}

// ── Risks ─────────────────────────────────────────────────────────────────────

export async function getRisks(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<ProjectRisk[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectRisk[]>(`/projects/${projectId}/risks`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "RISKS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load risks.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createRisk(
  session: AuthSession,
  projectId: string,
  input: { clientId: string; name: string; detail?: string; likelihood?: string; impact?: string; mitigation?: string; status?: string }
): Promise<AuthorizedResult<ProjectRisk>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectRisk>(`/projects/${projectId}/risks`, accessToken, { method: "POST", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "RISK_CREATE_FAILED", response.payload.error?.message ?? "Unable to create risk.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateRisk(
  session: AuthSession,
  projectId: string,
  id: string,
  input: { name?: string; detail?: string; likelihood?: string; impact?: string; mitigation?: string; status?: string }
): Promise<AuthorizedResult<ProjectRisk>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectRisk>(`/projects/${projectId}/risks/${id}`, accessToken, { method: "PATCH", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "RISK_UPDATE_FAILED", response.payload.error?.message ?? "Unable to update risk.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Decisions ─────────────────────────────────────────────────────────────────

export async function getDecisions(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<ProjectDecision[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectDecision[]>(`/projects/${projectId}/decisions`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "DECISIONS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load decisions.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createDecision(
  session: AuthSession,
  projectId: string,
  input: { clientId: string; title: string; context?: string; decidedByName?: string; decidedByRole?: string; decidedAt?: string }
): Promise<AuthorizedResult<ProjectDecision>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectDecision>(`/projects/${projectId}/decisions`, accessToken, { method: "POST", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "DECISION_CREATE_FAILED", response.payload.error?.message ?? "Unable to create decision.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Sprints ───────────────────────────────────────────────────────────────────

export async function getSprints(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<ProjectSprint[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectSprint[]>(`/projects/${projectId}/sprints`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "SPRINTS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load sprints.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function updateSprint(
  session: AuthSession,
  projectId: string,
  sprintId: string,
  input: { name?: string; ownerName?: string; startAt?: string | null; endAt?: string | null; status?: string; progressPercent?: number; totalTasks?: number; completedTasks?: number; overdueTasks?: number }
): Promise<AuthorizedResult<ProjectSprint>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectSprint>(`/projects/${projectId}/sprints/${sprintId}`, accessToken, { method: "PATCH", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "SPRINT_UPDATE_FAILED", response.payload.error?.message ?? "Unable to update sprint.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Sign-offs ─────────────────────────────────────────────────────────────────

export async function getSignOffs(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<ProjectSignOff[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectSignOff[]>(`/projects/${projectId}/sign-offs`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "SIGN_OFFS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load sign-offs.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function signOffItem(
  session: AuthSession,
  projectId: string,
  id: string,
  signedByName?: string
): Promise<AuthorizedResult<ProjectSignOff>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectSignOff>(`/projects/${projectId}/sign-offs/${id}/sign`, accessToken, { method: "PATCH", body: { signedByName } });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "SIGN_OFF_FAILED", response.payload.error?.message ?? "Unable to record sign-off.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Phases ────────────────────────────────────────────────────────────────────

export async function getPhases(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<ProjectPhase[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectPhase[]>(`/projects/${projectId}/phases`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "PHASES_FETCH_FAILED", response.payload.error?.message ?? "Unable to load phases.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Brief ─────────────────────────────────────────────────────────────────────

export async function getProjectBrief(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<ProjectBrief>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectBrief>(`/projects/${projectId}/brief`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "BRIEF_FETCH_FAILED", response.payload.error?.message ?? "Unable to load project brief.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function upsertProjectBrief(
  session: AuthSession,
  projectId: string,
  input: { clientId: string; objectives: string; inScope: string; outOfScope: string; contacts: string; status?: string }
): Promise<AuthorizedResult<ProjectBrief>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ProjectBrief>(`/projects/${projectId}/brief`, accessToken, { method: "POST", body: input });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "BRIEF_UPSERT_FAILED", response.payload.error?.message ?? "Unable to save project brief.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
