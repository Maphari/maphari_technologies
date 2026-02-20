import type { FastifyInstance } from "fastify";
import { createConversationNoteSchema, getConversationNotesQuerySchema, type ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

export async function registerConversationNoteRoutes(app: FastifyInstance): Promise<void> {
  app.get("/conversation-notes", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can view internal notes" } } as ApiResponse;
    }
    const parsed = getConversationNotesQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid notes query", details: parsed.error.flatten() }
      } as ApiResponse;
    }
    try {
      const notes = await prisma.conversationNote.findMany({
        where: { conversationId: parsed.data.conversationId },
        orderBy: { createdAt: "asc" }
      });
      return { success: true, data: notes, meta: { requestId: scope.requestId } } as ApiResponse<typeof notes>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "NOTES_FETCH_FAILED", message: "Unable to load conversation notes" } } as ApiResponse;
    }
  });

  app.post("/conversation-notes", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can add internal notes" } } as ApiResponse;
    }
    const parsed = createConversationNoteSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid note payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    try {
      const note = await prisma.conversationNote.create({
        data: {
          conversationId: parsed.data.conversationId,
          content: parsed.data.content,
          authorId: scope.userId ?? null,
          authorRole: scope.role ?? null
        }
      });
      return { success: true, data: note, meta: { requestId: scope.requestId } } as ApiResponse<typeof note>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "NOTE_CREATE_FAILED", message: "Unable to create note" } } as ApiResponse;
    }
  });
}
