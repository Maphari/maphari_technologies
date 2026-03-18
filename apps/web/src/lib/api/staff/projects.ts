// ════════════════════════════════════════════════════════════════════════════
// projects.ts — Staff API client: project-related endpoints
// Endpoints : GET /staff/projects
//             GET /staff/projects/:id
//             GET /staff/projects/:id/deliverables
//             GET /staff/projects/:id/sprints
//             GET /staff/projects/:id/risks
//             GET /change-requests
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
export interface StaffProject {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  progressPercent: number;
  startAt: string | null;
  dueAt: string | null;
  slaDueAt: string | null;
  budgetCents: number | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffDeliverable {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  fileId: string | null;
  fileName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffSprint {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  status: string;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
}

export interface StaffRisk {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  mitigationPlan: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffChangeRequest {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string | null;
  reason: string | null;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "ESTIMATED"
    | "ADMIN_APPROVED"
    | "ADMIN_REJECTED"
    | "CLIENT_APPROVED"
    | "CLIENT_REJECTED";
  requestedByName: string | null;
  requestedAt: string;
  estimatedHours: number | null;
  estimatedCostCents: number | null;
  staffAssessment: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** List all projects assigned to or accessible by the authenticated staff member */
export async function getStaffProjects(
  session: AuthSession
): Promise<AuthorizedResult<StaffProject[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffProject[]>("/projects", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_PROJECTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load staff projects."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Get detailed info for a single project */
export async function getStaffProjectDetail(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<StaffProject>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffProject>(
      `/projects/${projectId}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_PROJECT_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load project details."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** List deliverables for a project */
export async function getStaffDeliverables(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<StaffDeliverable[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffDeliverable[]>(
      `/projects/${projectId}/deliverables`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_DELIVERABLES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load deliverables."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** List sprints for a project */
export async function getStaffSprints(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<StaffSprint[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffSprint[]>(
      `/projects/${projectId}/sprints`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_SPRINTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load sprints."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** List risks for a project */
export async function getStaffRisks(
  session: AuthSession,
  projectId: string
): Promise<AuthorizedResult<StaffRisk[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffRisk[]>(
      `/projects/${projectId}/risks`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_RISKS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load project risks."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** List change requests accessible to the authenticated staff member */
export async function getStaffChangeRequests(
  session: AuthSession,
  options: { projectId?: string; status?: string } = {}
): Promise<AuthorizedResult<StaffChangeRequest[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (options.projectId) params.set("projectId", options.projectId);
    if (options.status) params.set("status", options.status);
    const qs = params.size > 0 ? `?${params.toString()}` : "";
    const response = await callGateway<StaffChangeRequest[]>(
      `/change-requests${qs}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_CHANGE_REQUESTS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load change requests."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}
