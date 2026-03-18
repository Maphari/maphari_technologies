// ════════════════════════════════════════════════════════════════════════════
// client-notes.ts — Staff API client: private CRM notes on client records
// Endpoints:
//   GET    /staff/client-notes/:clientId — list notes (STAFF/ADMIN only)
//   POST   /staff/client-notes           — create a note
//   DELETE /staff/client-notes/:id       — delete a note
// Notes are stored as CommunicationLog with type "PRIVATE_NOTE" and are
// never visible to CLIENT-role requests.
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

export type ClientNoteCategory = "preference" | "risk" | "opportunity" | "general";

export interface ClientNote {
  id:         string;
  clientId:   string;
  note:       string;
  category:   ClientNoteCategory;
  authorName: string | null;
  createdAt:  string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** Load all private CRM notes for a specific client */
export async function loadClientNotesWithRefresh(
  session:  AuthSession,
  clientId: string
): Promise<AuthorizedResult<ClientNote[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientNote[]>(
      `/staff/client-notes/${encodeURIComponent(clientId)}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data:  [],
        error: toGatewayError(
          response.payload.error?.code    ?? "CLIENT_NOTES_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load client notes."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

/** Add a private CRM note for a client */
export async function addClientNoteWithRefresh(
  session:   AuthSession,
  clientId:  string,
  note:      string,
  category?: ClientNoteCategory
): Promise<AuthorizedResult<ClientNote>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ClientNote>(
      "/staff/client-notes",
      accessToken,
      { method: "POST", body: { clientId, note, category: category ?? "general" } }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data:  null,
        error: toGatewayError(
          response.payload.error?.code    ?? "CLIENT_NOTE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create note."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

/** Delete a private CRM note by ID */
export async function deleteClientNoteWithRefresh(
  session: AuthSession,
  noteId:  string
): Promise<AuthorizedResult<null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<null>(
      `/staff/client-notes/${encodeURIComponent(noteId)}`,
      accessToken,
      { method: "DELETE" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    return { unauthorized: false, data: null, error: null };
  });
}
