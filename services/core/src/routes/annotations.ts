// ════════════════════════════════════════════════════════════════════════════
// annotations.ts — Deliverable annotation routes
// Endpoints : GET  /deliverables/:id/annotations
//             POST /deliverables/:id/annotations
//             PATCH /annotations/:id/resolve
// Scope     : CLIENT (own deliverables only via clientId check)
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

export async function registerAnnotationRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /deliverables/:id/annotations ─────────────────────────────────────

  app.get("/deliverables/:id/annotations", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id: deliverableId } = request.params as { id: string };

    // CLIENT must supply a clientId — only their own annotations are returned.
    // ADMIN/STAFF see all annotations for the deliverable.
    try {
      const where =
        scope.role === "CLIENT" && scope.clientId
          ? { deliverableId, clientId: scope.clientId }
          : { deliverableId };

      const data = await prisma.deliverableAnnotation.findMany({
        where,
        orderBy: { createdAt: "asc" },
      });
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "ANNOTATIONS_FETCH_FAILED", message: "Unable to fetch annotations." },
      } as ApiResponse;
    }
  });

  // ── POST /deliverables/:id/annotations ────────────────────────────────────

  app.post("/deliverables/:id/annotations", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id: deliverableId } = request.params as { id: string };
    const body = request.body as { comment?: string; pageNumber?: number };

    if (!body.comment?.trim()) {
      reply.status(400);
      return {
        success: false,
        error: { code: "INVALID_PARAMS", message: "comment is required." },
      } as ApiResponse;
    }

    const clientId = scope.clientId ?? "";
    if (!clientId) {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Client identity required to annotate." },
      } as ApiResponse;
    }

    try {
      const annotation = await prisma.deliverableAnnotation.create({
        data: {
          deliverableId,
          clientId,
          comment: body.comment.trim(),
          pageNumber: body.pageNumber ?? null,
        },
      });
      reply.status(201);
      return { success: true, data: annotation } as ApiResponse<typeof annotation>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "ANNOTATION_CREATE_FAILED", message: "Unable to create annotation." },
      } as ApiResponse;
    }
  });

  // ── PATCH /annotations/:id/resolve ────────────────────────────────────────

  app.patch("/annotations/:id/resolve", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };

    try {
      // CLIENT can only resolve their own annotations
      const existing = await prisma.deliverableAnnotation.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Annotation not found." },
        } as ApiResponse;
      }

      if (scope.role === "CLIENT" && scope.clientId && existing.clientId !== scope.clientId) {
        reply.status(403);
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Cannot resolve another client's annotation." },
        } as ApiResponse;
      }

      const updated = await prisma.deliverableAnnotation.update({
        where: { id },
        data: { resolvedAt: new Date() },
      });
      return { success: true, data: updated } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "ANNOTATION_RESOLVE_FAILED", message: "Unable to resolve annotation." },
      } as ApiResponse;
    }
  });
}
