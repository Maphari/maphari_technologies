// ════════════════════════════════════════════════════════════════════════════
// messaging.ts — Staff API client: direct staff-to-client messaging
// Endpoints : POST /conversations  (STAFF creates conversation for client)
//             POST /messages       (STAFF sends first message into conversation)
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

export interface StaffConversation {
  id:            string;
  clientId:      string;
  subject:       string | null;
  assigneeUserId: string | null;
  projectId:     string | null;
  createdAt:     string;
  updatedAt:     string;
}

export interface StaffMessage {
  id:             string;
  conversationId: string;
  content:        string;
  authorRole:     string | null;
  deliveryStatus: string;
  createdAt:      string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Create a new conversation for a client and immediately send an opening
 * message. Both steps use the STAFF role — the conversation automatically
 * appears in the client portal because it is scoped to `clientId`.
 */
export async function createStaffClientMessageWithRefresh(
  session:  AuthSession,
  clientId: string,
  subject:  string,
  body:     string
): Promise<AuthorizedResult<{ conversation: StaffConversation; message: StaffMessage }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    // Step 1 — create the conversation scoped to the client
    const convResponse = await callGateway<StaffConversation>("/conversations", accessToken, {
      method: "POST",
      body:   { clientId, subject, assigneeUserId: session.user?.id ?? null }
    });
    if (isUnauthorized(convResponse)) return { unauthorized: true, data: null, error: null };
    if (!convResponse.payload.success || !convResponse.payload.data) {
      return {
        unauthorized: false,
        data:         null,
        error:        toGatewayError(
          convResponse.payload.error?.code    ?? "CONVERSATION_CREATE_FAILED",
          convResponse.payload.error?.message ?? "Unable to create conversation."
        )
      };
    }

    const conversation = convResponse.payload.data;

    // Step 2 — post the opening message
    const msgResponse = await callGateway<StaffMessage>("/messages", accessToken, {
      method: "POST",
      body:   { conversationId: conversation.id, content: body }
    });
    if (isUnauthorized(msgResponse)) return { unauthorized: true, data: null, error: null };
    if (!msgResponse.payload.success || !msgResponse.payload.data) {
      // Attempt to clean up the orphaned conversation (fire-and-forget).
      try {
        await callGateway<void>(`/conversations/${conversation.id}`, accessToken, { method: "DELETE" });
      } catch {
        // Cleanup failure does not change the returned error.
      }
      return {
        unauthorized: false,
        data:         null,
        error:        toGatewayError(
          msgResponse.payload.error?.code    ?? "MESSAGE_CREATE_FAILED",
          msgResponse.payload.error?.message ?? "Conversation created but first message failed to send."
        )
      };
    }

    return {
      unauthorized: false,
      data:         { conversation, message: msgResponse.payload.data },
      error:        null
    };
  });
}
