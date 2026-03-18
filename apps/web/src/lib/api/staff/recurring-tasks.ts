// ════════════════════════════════════════════════════════════════════════════
// recurring-tasks.ts — Staff API client for recurring tasks
// Endpoint : GET /recurring-tasks
//            POST /recurring-tasks
//            PATCH /recurring-tasks/:id
//            DELETE /recurring-tasks/:id
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
export interface RecurringTask {
  id: string;
  staffId: string;
  clientId: string | null;
  title: string;
  frequency: "Daily" | "Weekly" | "Bi-weekly" | "Monthly";
  dayOfWeek: string | null;
  estimateHours: number;
  category: string;
  isActive: boolean;
  lastDoneAt: string | null;
  nextDueAt: string | null;
  streak: number;
  totalDone: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringTaskInput {
  title: string;
  clientId?: string | null;
  frequency?: "Daily" | "Weekly" | "Bi-weekly" | "Monthly";
  dayOfWeek?: string | null;
  estimateHours?: number;
  category?: string;
  isActive?: boolean;
}

export interface UpdateRecurringTaskInput {
  title?: string;
  clientId?: string | null;
  frequency?: "Daily" | "Weekly" | "Bi-weekly" | "Monthly";
  dayOfWeek?: string | null;
  estimateHours?: number;
  category?: string;
  isActive?: boolean;
  lastDoneAt?: string | null;
  nextDueAt?: string | null;
  streak?: number;
  totalDone?: number;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** List recurring tasks for the authenticated staff member */
export async function getRecurringTasks(
  session: AuthSession
): Promise<AuthorizedResult<RecurringTask[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<RecurringTask[]>("/recurring-tasks", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "RECURRING_TASKS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load recurring tasks."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Create a new recurring task */
export async function createRecurringTask(
  session: AuthSession,
  input: CreateRecurringTaskInput
): Promise<AuthorizedResult<RecurringTask>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<RecurringTask>("/recurring-tasks", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "RECURRING_TASK_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create recurring task."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Update an existing recurring task */
export async function updateRecurringTask(
  session: AuthSession,
  id: string,
  input: UpdateRecurringTaskInput
): Promise<AuthorizedResult<RecurringTask>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<RecurringTask>(
      `/recurring-tasks/${id}`,
      accessToken,
      { method: "PATCH", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "RECURRING_TASK_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update recurring task."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Delete a recurring task by id */
export async function deleteRecurringTask(
  session: AuthSession,
  id: string
): Promise<AuthorizedResult<{ id: string }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ id: string }>(
      `/recurring-tasks/${id}`,
      accessToken,
      { method: "DELETE" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "RECURRING_TASK_DELETE_FAILED",
          response.payload.error?.message ?? "Unable to delete recurring task."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? { id }, error: null };
  });
}
