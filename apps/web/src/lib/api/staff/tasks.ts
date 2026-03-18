// ════════════════════════════════════════════════════════════════════════════
// tasks.ts — Staff API client: task-related endpoints
// Endpoints : GET /staff/tasks
//             PATCH /staff/tasks/:id/status
//             POST  /staff/tasks
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
export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface StaffTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  estimateMinutes: number | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffTaskInput {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimateMinutes?: number;
  dueAt?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** List all tasks assigned to the authenticated staff member */
export async function getMyTasks(
  session: AuthSession
): Promise<AuthorizedResult<StaffTask[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffTask[]>("/staff/tasks", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_TASKS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load tasks."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Update the status of a task */
export async function updateTaskStatus(
  session: AuthSession,
  taskId: string,
  status: TaskStatus
): Promise<AuthorizedResult<StaffTask>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffTask>(
      `/staff/tasks/${taskId}/status`,
      accessToken,
      { method: "PATCH", body: { status } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_TASK_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update task status."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Create a new task in a project */
export async function createStaffTask(
  session: AuthSession,
  input: CreateStaffTaskInput
): Promise<AuthorizedResult<StaffTask>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffTask>("/staff/tasks", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "STAFF_TASK_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create task."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
