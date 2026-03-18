// ════════════════════════════════════════════════════════════════════════════
// data-privacy.ts — Data privacy request routes (GDPR-style)
// Endpoints : POST /data-export-requests
//             POST /account-deletion-requests
// Scope     : CLIENT own data; ADMIN full
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

export async function registerDataPrivacyRoutes(app: FastifyInstance): Promise<void> {

  // ── POST /data-export-requests ────────────────────────────────────────────
  app.post("/data-export-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = (request.body ?? {}) as { reason?: string };

    const clientId = resolveClientFilter(scope.role, scope.clientId);
    if (!clientId && scope.role !== "ADMIN") {
      reply.status(400);
      return {
        success: false,
        error: { code: "CLIENT_SCOPE_REQUIRED", message: "Client scope required" }
      } as ApiResponse;
    }

    const event = await prisma.auditEvent.create({
      data: {
        id:           randomUUID(),
        actorId:      scope.userId ?? null,
        actorRole:    scope.role ?? null,
        actorName:    null,
        action:       "DATA_EXPORT_REQUEST",
        resourceType: "CLIENT",
        resourceId:   clientId ?? null,
        details:      body.reason ? JSON.stringify({ reason: body.reason }) : null,
      }
    });

    return reply.code(201).send({
      success: true,
      data: {
        id:          event.id,
        status:      "QUEUED",
        requestedAt: event.createdAt,
        clientId,
        message:     "Your data export request has been received. You will be notified when it is ready."
      },
      meta: { requestId: scope.requestId }
    } as ApiResponse);
  });

  // ── POST /account-deletion-requests ─────────────────────────────────────
  app.post("/account-deletion-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = (request.body ?? {}) as { confirmation?: string; reason?: string };

    const clientId = resolveClientFilter(scope.role, scope.clientId);
    if (!clientId && scope.role !== "ADMIN") {
      reply.status(400);
      return {
        success: false,
        error: { code: "CLIENT_SCOPE_REQUIRED", message: "Client scope required" }
      } as ApiResponse;
    }

    const event = await prisma.auditEvent.create({
      data: {
        id:           randomUUID(),
        actorId:      scope.userId ?? null,
        actorRole:    scope.role ?? null,
        actorName:    null,
        action:       "ACCOUNT_DELETION_REQUEST",
        resourceType: "CLIENT",
        resourceId:   clientId ?? null,
        details:      JSON.stringify({
          reason:       body.reason ?? null,
          confirmation: body.confirmation ?? null
        }),
      }
    });

    return reply.code(201).send({
      success: true,
      data: {
        id:          event.id,
        status:      "PENDING_REVIEW",
        requestedAt: event.createdAt,
        clientId,
        message:     "Your account deletion request has been submitted. Our team will contact you within 5 business days."
      },
      meta: { requestId: scope.requestId }
    } as ApiResponse);
  });
}
