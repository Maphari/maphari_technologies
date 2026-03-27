import {
  sendInvoiceReminderSchema,
  upsertInvoiceReminderPreferenceSchema,
  type ApiResponse
} from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import {
  getInvoiceReminderPreference,
  sendInvoiceReminderNow,
  upsertInvoiceReminderPreference,
  type ReminderChannel
} from "../lib/invoice-reminders.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

export async function registerInvoiceReminderRoutes(app: FastifyInstance): Promise<void> {
  app.get("/invoice-reminders/preferences", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const query = request.query as { clientId?: string };
    const clientId = resolveClientFilter(scope.role, scope.clientId, query.clientId);

    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "client scope is required"
        }
      } as ApiResponse;
    }

    try {
      const preference = await getInvoiceReminderPreference(clientId);
      return {
        success: true,
        data: preference,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof preference>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "INVOICE_REMINDER_PREFERENCE_FETCH_FAILED",
          message: "Unable to load invoice reminder preferences"
        }
      } as ApiResponse;
    }
  });

  app.post("/invoice-reminders/preferences", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = upsertInvoiceReminderPreferenceSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid invoice reminder preference payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const bodyWithClientId = request.body as { clientId?: string };
    const clientId = resolveClientFilter(scope.role, scope.clientId, bodyWithClientId.clientId);
    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "client scope is required"
        }
      } as ApiResponse;
    }

    try {
      const preference = await upsertInvoiceReminderPreference({
        clientId,
        enabled: parsedBody.data.enabled ?? true,
        intervalDays: parsedBody.data.intervalDays,
        channels: parsedBody.data.channels as ReminderChannel[],
        note: parsedBody.data.note ?? null
      });

      return {
        success: true,
        data: preference,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof preference>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "INVOICE_REMINDER_PREFERENCE_SAVE_FAILED",
          message: "Unable to save invoice reminder preferences"
        }
      } as ApiResponse;
    }
  });

  app.post("/invoice-reminders/send", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = sendInvoiceReminderSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid invoice reminder payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const bodyWithClientId = request.body as { clientId?: string };
    const clientId = resolveClientFilter(scope.role, scope.clientId, bodyWithClientId.clientId);
    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "client scope is required"
        }
      } as ApiResponse;
    }

    try {
      const result = await sendInvoiceReminderNow({
        clientId,
        invoiceIds: parsedBody.data.invoiceIds,
        channels: (parsedBody.data.channels ?? ["email"]) as ReminderChannel[],
        note: parsedBody.data.note ?? null,
        requestId: scope.requestId
      });

      return {
        success: true,
        data: result,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof result>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "INVOICE_REMINDER_SEND_FAILED",
          message: error instanceof Error ? error.message : "Unable to send invoice reminders"
        }
      } as ApiResponse;
    }
  });
}
