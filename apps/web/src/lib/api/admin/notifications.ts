import type { AuthSession } from "../../auth/session";
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";
import type {
  AdminConversation,
  AdminMessage,
  ConversationNote,
  ConversationEscalation,
  NotificationJob,
  NotificationUnreadCount
} from "./types";

export async function loadConversationsWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<AdminConversation[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminConversation[]>("/conversations", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "CONVERSATIONS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load conversations."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createConversationWithRefresh(
  session: AuthSession,
  input: {
    clientId?: string;
    subject: string;
    projectId?: string;
    assigneeUserId?: string;
  }
): Promise<AuthorizedResult<AdminConversation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminConversation>("/conversations", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CONVERSATION_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create conversation."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateConversationAssigneeWithRefresh(
  session: AuthSession,
  conversationId: string,
  input: { assigneeUserId: string | null }
): Promise<AuthorizedResult<AdminConversation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminConversation>(`/conversations/${conversationId}/assignee`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "CONVERSATION_ASSIGNMENT_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update conversation assignment."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadMessagesWithRefresh(
  session: AuthSession,
  conversationId: string
): Promise<AuthorizedResult<AdminMessage[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminMessage[]>(`/conversations/${conversationId}/messages`, accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "MESSAGES_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load messages."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createMessageWithRefresh(
  session: AuthSession,
  input: {
    conversationId: string;
    content: string;
  }
): Promise<AuthorizedResult<AdminMessage>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminMessage>("/messages", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "MESSAGE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to send message."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateMessageDeliveryWithRefresh(
  session: AuthSession,
  messageId: string,
  input: { status: "SENT" | "DELIVERED" | "READ"; deliveredAt?: string; readAt?: string }
): Promise<AuthorizedResult<AdminMessage>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<AdminMessage>(`/messages/${messageId}/delivery`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
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
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadConversationNotesWithRefresh(
  session: AuthSession,
  conversationId: string
): Promise<AuthorizedResult<ConversationNote[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ConversationNote[]>(
      `/conversation-notes?${new URLSearchParams({ conversationId }).toString()}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "NOTES_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load notes."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createConversationNoteWithRefresh(
  session: AuthSession,
  input: { conversationId: string; content: string }
): Promise<AuthorizedResult<ConversationNote>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ConversationNote>("/conversation-notes", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTE_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create note."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadConversationEscalationsWithRefresh(
  session: AuthSession,
  options: { conversationId?: string; status?: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" } = {}
): Promise<AuthorizedResult<ConversationEscalation[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (options.conversationId) params.set("conversationId", options.conversationId);
    if (options.status) params.set("status", options.status);
    const response = await callGateway<ConversationEscalation[]>(
      `/conversation-escalations${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "ESCALATIONS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load escalations."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function createConversationEscalationWithRefresh(
  session: AuthSession,
  input: {
    conversationId: string;
    messageId?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reason: string;
  }
): Promise<AuthorizedResult<ConversationEscalation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ConversationEscalation>("/conversation-escalations", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "ESCALATION_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to create escalation."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function updateConversationEscalationWithRefresh(
  session: AuthSession,
  escalationId: string,
  input: {
    status?: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
    ownerAdminId?: string;
    resolvedAt?: string;
  }
): Promise<AuthorizedResult<ConversationEscalation>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<ConversationEscalation>(`/conversation-escalations/${escalationId}`, accessToken, {
      method: "PATCH",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "ESCALATION_UPDATE_FAILED",
          response.payload.error?.message ?? "Unable to update escalation."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function createNotificationJobWithRefresh(
  session: AuthSession,
  input: {
    clientId?: string;
    channel: "EMAIL" | "SMS" | "PUSH";
    recipient: string;
    subject?: string;
    message: string;
    metadata?: Record<string, string | number | boolean>;
  }
): Promise<AuthorizedResult<NotificationJob>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<NotificationJob>("/notifications/jobs", accessToken, {
      method: "POST",
      body: input
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATION_CREATE_FAILED",
          response.payload.error?.message ?? "Unable to queue notification."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function loadNotificationJobsWithRefresh(
  session: AuthSession,
  options: { unreadOnly?: boolean; tab?: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations" } = {}
): Promise<AuthorizedResult<NotificationJob[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const params = new URLSearchParams();
    if (typeof options.unreadOnly === "boolean") params.set("unreadOnly", String(options.unreadOnly));
    if (options.tab) params.set("tab", options.tab);
    const response = await callGateway<NotificationJob[]>(
      `/notifications/jobs${params.size > 0 ? `?${params.toString()}` : ""}`,
      accessToken
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: [],
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATIONS_LOAD_FAILED",
          response.payload.error?.message ?? "Unable to load notifications"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? [], error: null };
  });
}

export async function loadNotificationUnreadCountWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<NotificationUnreadCount>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<NotificationUnreadCount>("/notifications/unread-count", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATION_UNREAD_COUNT_FAILED",
          response.payload.error?.message ?? "Unable to load unread notification count."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function setNotificationReadStateWithRefresh(
  session: AuthSession,
  id: string,
  read: boolean
): Promise<AuthorizedResult<NotificationJob>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<NotificationJob>(`/notifications/jobs/${id}/read-state`, accessToken, {
      method: "PATCH",
      body: { read }
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATION_READ_STATE_FAILED",
          response.payload.error?.message ?? "Unable to update notification read state."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function markAllAdminNotificationsReadWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ count: number }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ count: number }>(
      "/notifications/mark-all-read",
      accessToken,
      { method: "PATCH" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "MARK_ALL_READ_FAILED",
          response.payload.error?.message ?? "Unable to mark all notifications as read."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? { count: 0 }, error: null };
  });
}

export async function processNotificationQueueWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<{ processed: boolean; job?: NotificationJob }>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<{ processed: boolean; job?: NotificationJob }>(
      "/notifications/process",
      accessToken,
      { method: "POST" }
    );
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "NOTIFICATIONS_PROCESS_FAILED",
          response.payload.error?.message ?? "Unable to process notification queue"
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
