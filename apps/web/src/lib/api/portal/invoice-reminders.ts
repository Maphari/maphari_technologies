import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
  type AuthorizedResult
} from "./internal";
import type {
  PortalInvoiceReminderPreference,
  PortalInvoiceReminderSendResult
} from "./types";

export async function loadPortalInvoiceReminderPreferenceWithRefresh(
  session: AuthSession
): Promise<AuthorizedResult<PortalInvoiceReminderPreference | null>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalInvoiceReminderPreference | null>("/invoice-reminders/preferences", accessToken);
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "INVOICE_REMINDER_PREFERENCE_FETCH_FAILED",
          response.payload.error?.message ?? "Unable to load invoice reminder preferences."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data ?? null, error: null };
  });
}

export async function savePortalInvoiceReminderPreferenceWithRefresh(
  session: AuthSession,
  body: {
    enabled?: boolean;
    intervalDays: 0 | 1 | 3;
    channels: Array<"email" | "sms" | "portal">;
    note?: string;
  }
): Promise<AuthorizedResult<PortalInvoiceReminderPreference>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalInvoiceReminderPreference>("/invoice-reminders/preferences", accessToken, {
      method: "POST",
      body
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "INVOICE_REMINDER_PREFERENCE_SAVE_FAILED",
          response.payload.error?.message ?? "Unable to save invoice reminder preferences."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}

export async function sendPortalInvoiceRemindersWithRefresh(
  session: AuthSession,
  body: {
    invoiceIds: string[];
    channels?: Array<"email" | "sms" | "portal">;
    note?: string;
  }
): Promise<AuthorizedResult<PortalInvoiceReminderSendResult>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PortalInvoiceReminderSendResult>("/invoice-reminders/send", accessToken, {
      method: "POST",
      body
    });
    if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "INVOICE_REMINDER_SEND_FAILED",
          response.payload.error?.message ?? "Unable to send invoice reminders."
        )
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });
}
