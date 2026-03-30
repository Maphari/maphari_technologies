// ════════════════════════════════════════════════════════════════════════════
// webhooks.ts — Admin webhook CRUD + delivery
// Service  : core  |  Scope: ADMIN only
// Endpoints:
//   GET    /admin/webhooks          — list all configured webhooks
//   POST   /admin/webhooks          — create a new webhook
//   PATCH  /admin/webhooks/:id      — update (toggle active, URL, events)
//   DELETE /admin/webhooks/:id      — delete
//   POST   /admin/webhooks/:id/test — send a test delivery and return result
//
// Storage: Prisma — prisma.webhookEndpoint (replaces file store)
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { readScopeHeaders } from "../lib/scope.js";
import { createHmac } from "crypto";
import { prisma } from "../lib/prisma.js";

// ── Types ──────────────────────────────────────────────────────────────────

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  createdAt: string;
  lastFiredAt: string | null;
  failCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function signPayload(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

/** Convert a Prisma WebhookEndpoint row to the response shape. */
function toConfig(ep: {
  id: string;
  name: string;
  url: string;
  events: string;
  secret: string | null;
  active: boolean;
  createdAt: Date;
  lastFiredAt: Date | null;
  failCount: number;
}): WebhookConfig {
  return {
    id: ep.id,
    name: ep.name,
    url: ep.url,
    events: ep.events.split(",").map((e) => e.trim()).filter(Boolean),
    secret: null, // never expose the raw secret value
    active: ep.active,
    createdAt: ep.createdAt.toISOString(),
    lastFiredAt: ep.lastFiredAt ? ep.lastFiredAt.toISOString() : null,
    failCount: ep.failCount,
  };
}

// ── Route registration ─────────────────────────────────────────────────────

export async function registerWebhookRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /admin/webhooks ────────────────────────────────────────────────────
  app.get("/admin/webhooks", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }

    const rows = await prisma.webhookEndpoint.findMany({ orderBy: { createdAt: "asc" } });
    const hooks = rows.map(toConfig);
    return { success: true, data: hooks, meta: { requestId: scope.requestId } } as ApiResponse<typeof hooks>;
  });

  // ── POST /admin/webhooks ───────────────────────────────────────────────────
  app.post("/admin/webhooks", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }

    const body = request.body as {
      name?: string;
      url?: string;
      events?: string[];
      secret?: string;
      active?: boolean;
    };

    if (!body.name || !body.url || !Array.isArray(body.events) || body.events.length === 0) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "name, url and events are required" } } as ApiResponse;
    }

    if (!isValidUrl(body.url)) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "url must start with http:// or https://" } } as ApiResponse;
    }

    const row = await prisma.webhookEndpoint.create({
      data: {
        name: body.name,
        url: body.url,
        events: body.events.join(","),
        secret: body.secret ?? null,
        active: body.active !== false,
      },
    });

    reply.status(201);
    return { success: true, data: toConfig(row), meta: { requestId: scope.requestId } } as ApiResponse<WebhookConfig>;
  });

  // ── PATCH /admin/webhooks/:id ──────────────────────────────────────────────
  app.patch("/admin/webhooks/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      url?: string;
      events?: string[];
      secret?: string | null;
      active?: boolean;
    };

    if (body.url !== undefined && !isValidUrl(body.url)) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "url must start with http:// or https://" } } as ApiResponse;
    }

    const existing = await prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!existing) {
      reply.status(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Webhook not found" } } as ApiResponse;
    }

    const row = await prisma.webhookEndpoint.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.url !== undefined ? { url: body.url } : {}),
        ...(body.events !== undefined ? { events: body.events.join(",") } : {}),
        ...(body.secret !== undefined ? { secret: body.secret } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    });

    return { success: true, data: toConfig(row), meta: { requestId: scope.requestId } } as ApiResponse<WebhookConfig>;
  });

  // ── DELETE /admin/webhooks/:id ─────────────────────────────────────────────
  app.delete("/admin/webhooks/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };

    const existing = await prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!existing) {
      reply.status(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Webhook not found" } } as ApiResponse;
    }

    await prisma.webhookEndpoint.delete({ where: { id } });
    return { success: true, data: { deleted: id }, meta: { requestId: scope.requestId } } as ApiResponse<{ deleted: string }>;
  });

  // ── POST /admin/webhooks/:id/test ──────────────────────────────────────────
  app.post("/admin/webhooks/:id/test", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };

    const row = await prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!row) {
      reply.status(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Webhook not found" } } as ApiResponse;
    }

    const bodyObj = {
      event: "test",
      timestamp: new Date().toISOString(),
      data: { message: "Test webhook from Maphari" },
    };
    const bodyStr = JSON.stringify(bodyObj);

    const headers: Record<string, string> = {
      "content-type": "application/json",
      "user-agent": "Maphari-Webhooks/1.0",
    };
    if (row.secret) {
      headers["x-maphari-signature"] = signPayload(row.secret, bodyStr);
    }

    const start = Date.now();
    let statusCode = 0;
    let ok = false;
    try {
      const res = await fetch(row.url, {
        method: "POST",
        headers,
        body: bodyStr,
        signal: AbortSignal.timeout(10_000),
      });
      statusCode = res.status;
      ok = res.ok;
    } catch {
      statusCode = 0;
      ok = false;
    }
    const latencyMs = Date.now() - start;

    const result = { statusCode, ok, latencyMs };
    return { success: true, data: result, meta: { requestId: scope.requestId } } as ApiResponse<typeof result>;
  });
}
