// ════════════════════════════════════════════════════════════════════════════
// support.ts — Admin API client for support tickets
// Endpoints : GET   /support-tickets
//             POST  /support-tickets
//             PATCH /support-tickets/:id
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./_shared";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AdminSupportTicket {
  id: string;
  clientId: string | null;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  assignedTo: string | null;
  slaHours: number | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Load tickets ──────────────────────────────────────────────────────────────
export async function loadSupportTicketsWithRefresh(
  session: AuthSession,
  filters: { status?: string; clientId?: string } = {}
): Promise<AuthorizedResult<AdminSupportTicket[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.clientId) params.set("clientId", filters.clientId);
    const qs = params.size > 0 ? `?${params.toString()}` : "";
    const response = await callGateway<AdminSupportTicket[]>(
      `/support-tickets${qs}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "SUPPORT_TICKETS_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load support tickets."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

// ── Create ticket ─────────────────────────────────────────────────────────────
export async function createSupportTicketWithRefresh(
  session: AuthSession,
  input: {
    title: string;
    description?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    clientId?: string;
    assignedTo?: string;
    slaHours?: number;
  }
): Promise<AuthorizedResult<AdminSupportTicket>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminSupportTicket>("/support-tickets", accessToken, {
      method: "POST",
      body: input,
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "SUPPORT_TICKET_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create support ticket."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

// ── Update ticket ─────────────────────────────────────────────────────────────
export async function updateSupportTicketWithRefresh(
  session: AuthSession,
  ticketId: string,
  input: { status?: string; assignedTo?: string }
): Promise<AuthorizedResult<AdminSupportTicket>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminSupportTicket>(
      `/support-tickets/${ticketId}`,
      accessToken,
      { method: "PATCH", body: input }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "SUPPORT_TICKET_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update support ticket."
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
