// ════════════════════════════════════════════════════════════════════════════
// project-layer.ts — Portal API client: project-layer domain endpoints
// Endpoints : GET  /projects/:id/deliverables
//             GET  /projects/:id/risks
//             GET  /projects/:id/sign-offs    PATCH /:id/sign
//             GET  /projects/:id/sprints      GET /:sid/tasks
//             GET  /projects/:id/phases
//             GET  /projects/:id/brief
// Scope     : CLIENT read-only (enforced server-side); sign-offs allow PATCH
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

export interface PortalDeliverable {
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

export interface PortalRisk {
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

export interface PortalSignOff {
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

export interface PortalSprint {
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

export interface PortalSprintTask {
  id: string;
  sprintId: string;
  projectId: string;
  name: string;
  status: string;
  priority: string;
  assigneeName: string | null;
  dueAt: string | null;
  completedAt: string | null;
  storyPoints: number | null;
  blockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalPhase {
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

export interface PortalBrief {
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

export async function loadPortalDeliverablesWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalDeliverable[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalDeliverable[]>(`/projects/${projectId}/deliverables`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "DELIVERABLES_FETCH_FAILED", response.payload.error?.message ?? "Unable to load deliverables.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Risks ─────────────────────────────────────────────────────────────────────

export async function loadPortalRisksWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalRisk[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalRisk[]>(`/projects/${projectId}/risks`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "RISKS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load risks.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Sign-offs ─────────────────────────────────────────────────────────────────

export async function loadPortalSignOffsWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalSignOff[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalSignOff[]>(`/projects/${projectId}/sign-offs`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "SIGN_OFFS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load sign-offs.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function signPortalSignOffWithRefresh(
  session: AuthSession,
  projectId: string,
  id: string,
  signedByName?: string
): Promise<AuthorizedResult<PortalSignOff>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalSignOff>(
      `/projects/${projectId}/sign-offs/${id}/sign`,
      accessToken,
      { method: "PATCH", body: { signedByName } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "SIGN_OFF_FAILED", response.payload.error?.message ?? "Unable to record sign-off.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Sprints ───────────────────────────────────────────────────────────────────

export async function loadPortalSprintsWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalSprint[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalSprint[]>(`/projects/${projectId}/sprints`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "SPRINTS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load sprints.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadPortalSprintTasksWithRefresh(
  session: AuthSession,
  projectId: string,
  sprintId: string
): Promise<AuthorizedResult<PortalSprintTask[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalSprintTask[]>(
      `/projects/${projectId}/sprints/${sprintId}/tasks`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "SPRINT_TASKS_FETCH_FAILED", response.payload.error?.message ?? "Unable to load sprint tasks.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Phases ────────────────────────────────────────────────────────────────────

export async function loadPortalPhasesWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalPhase[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalPhase[]>(`/projects/${projectId}/phases`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return { unauthorized: false, data: [], error: toGatewayError(response.payload.error?.code ?? "PHASES_FETCH_FAILED", response.payload.error?.message ?? "Unable to load phases.") };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Project Roadmap ───────────────────────────────────────────────────────────

export interface RoadmapMilestone {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
  paymentStage: string | null;
}

export interface RoadmapProject {
  id: string;
  name: string;
  status: string;
  startAt: string | null;
  endAt: string | null;
  milestones: RoadmapMilestone[];
}

export async function loadProjectRoadmapWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ projects: RoadmapProject[] }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ projects: RoadmapProject[] }>("/portal/project-roadmap", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: { projects: [] }, error: toGatewayError(response.payload.error?.code ?? "ROADMAP_FETCH_FAILED", response.payload.error?.message ?? "Unable to load project roadmap.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Deliverable Actions ────────────────────────────────────────────────────────

export async function approvePortalDeliverableWithRefresh(
  session: AuthSession,
  projectId: string,
  deliverableId: string,
): Promise<AuthorizedResult<PortalDeliverable>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalDeliverable>(
      `/projects/${projectId}/deliverables/${deliverableId}/approve`,
      accessToken,
      { method: "POST", body: {} }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "APPROVE_FAILED", response.payload.error?.message ?? "Unable to approve.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function requestChangesPortalDeliverableWithRefresh(
  session: AuthSession,
  projectId: string,
  deliverableId: string,
  reason?: string,
): Promise<AuthorizedResult<PortalDeliverable>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalDeliverable>(
      `/projects/${projectId}/deliverables/${deliverableId}/request-changes`,
      accessToken,
      { method: "POST", body: { reason } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "CHANGES_FAILED", response.payload.error?.message ?? "Unable to submit request.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Brief ─────────────────────────────────────────────────────────────────────

export async function loadPortalBriefWithRefresh(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<PortalBrief>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalBrief>(`/projects/${projectId}/brief`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return { unauthorized: false, data: null, error: toGatewayError(response.payload.error?.code ?? "BRIEF_FETCH_FAILED", response.payload.error?.message ?? "Unable to load project brief.") };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
