import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";
import type { PortalConversation, PortalMessage } from "./types";

export async function loadConversationMessagesWithRefresh(
  session: AuthSession,
  conversationId: string
): Promise<AuthorizedResult<PortalMessage[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const messages = await callGateway<PortalMessage[]>(`/conversations/${conversationId}/messages`, accessToken);
    if (isUnauthorized(messages)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!messages.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          messages.payload.error?.code ?? "MESSAGES_LOAD_FAILED",
          messages.payload.error?.message ?? "Unable to load messages"
        )
      };
    }

    return {
      unauthorized: false,
      data: messages.payload.data ?? [],
      error: null
    };
  });
}

export async function createPortalConversationWithRefresh(
  session: AuthSession,
  input: {
    clientId?: string;
    subject: string;
    projectId?: string;
    assigneeUserId?: string;
  }
): Promise<AuthorizedResult<PortalConversation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalConversation>("/conversations", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CONVERSATION_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create conversation"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createPortalMessageWithRefresh(
  session: AuthSession,
  input: {
    conversationId: string;
    content: string;
  }
): Promise<AuthorizedResult<PortalMessage>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalMessage>("/messages", accessToken, {
      method: "POST",
      body: input
    });

    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "MESSAGE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to send message"
        )
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data,
      error: null
    };
  });
}

export async function updatePortalMessageDeliveryWithRefresh(
  session: AuthSession,
  messageId: string,
  input: { status: "SENT" | "DELIVERED" | "READ"; deliveredAt?: string; readAt?: string }
): Promise<AuthorizedResult<PortalMessage>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalMessage>(`/messages/${messageId}/delivery`, accessToken, {
      method: "PATCH",
      body: input
    });

    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }

    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "MESSAGE_DELIVERY_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update message delivery."
        )
      };
    }

    return {
      unauthorized: false,
      data: response.payload.data,
      error: null
    };
  });
}
