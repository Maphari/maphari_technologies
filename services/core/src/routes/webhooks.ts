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
// Storage: JSON file persisted at process.env.WEBHOOK_STORE_PATH or
//   <cwd>/data/webhooks.json for MVP. Safe to swap for a DB later.
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { readScopeHeaders } from "../lib/scope.js";
import { createHmac, randomUUID } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

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

// ── Store helpers ──────────────────────────────────────────────────────────

const storePath = (() => {
  const dir = process.env.WEBHOOK_STORE_DIR ?? join(process.cwd(), "data");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return join(dir, "webhooks.json");
})();

function readStore(): WebhookConfig[] {
  try {
    if (!existsSync(storePath)) return [];
    return JSON.parse(readFileSync(storePath, "utf8")) as WebhookConfig[];
  } catch {
    return [];
  }
}

function writeStore(hooks: WebhookConfig[]): void {
  writeFileSync(storePath, JSON.stringify(hooks, null, 2), "utf8");
}

// ── HMAC signing ──────────────────────────────────────────────────────────

function signPayload(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

// ── Webhook delivery ──────────────────────────────────────────────────────

export async function fireWebhook(
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const hooks = readStore().filter((h) => h.active && h.events.includes(event));
  if (hooks.length === 0) return;

  const bodyObj = { event, timestamp: new Date().toISOString(), data: payload };
  const bodyStr = JSON.stringify(bodyObj);

  const updated = readStore();
  for (const hook of hooks) {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "user-agent": "Maphari-Webhooks/1.0",
    };
    if (hook.secret) {
      headers["x-maphari-signature"] = signPayload(hook.secret, bodyStr);
    }
    try {
      const res = await fetch(hook.url, {
        method: "POST",
        headers,
        body: bodyStr,
        signal: AbortSignal.timeout(10_000),
      });
      const idx = updated.findIndex((h) => h.id === hook.id);
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          lastFiredAt: new Date().toISOString(),
          failCount: res.ok ? 0 : updated[idx].failCount + 1,
        };
      }
    } catch {
      const idx = updated.findIndex((h) => h.id === hook.id);
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          failCount: updated[idx].failCount + 1,
        };
      }
    }
  }
  writeStore(updated);
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
    const hooks = readStore();
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
      return { success: false, error: { code: "VALIDATION_ERROR", message: "name, url, and events are required" } } as ApiResponse;
    }

    const hook: WebhookConfig = {
      id: randomUUID(),
      name: body.name,
      url: body.url,
      events: body.events,
      secret: body.secret ?? null,
      active: body.active !== false,
      createdAt: new Date().toISOString(),
      lastFiredAt: null,
      failCount: 0,
    };

    const hooks = readStore();
    hooks.push(hook);
    writeStore(hooks);

    reply.status(201);
    return { success: true, data: hook, meta: { requestId: scope.requestId } } as ApiResponse<WebhookConfig>;
  });

  // ── PATCH /admin/webhooks/:id ──────────────────────────────────────────────
  app.patch("/admin/webhooks/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as Partial<WebhookConfig>;

    const hooks = readStore();
    const idx = hooks.findIndex((h) => h.id === id);
    if (idx === -1) {
      reply.status(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Webhook not found" } } as ApiResponse;
    }

    const updated: WebhookConfig = {
      ...hooks[idx],
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.url !== undefined ? { url: body.url } : {}),
      ...(body.events !== undefined ? { events: body.events } : {}),
      ...(body.secret !== undefined ? { secret: body.secret } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
    };

    hooks[idx] = updated;
    writeStore(hooks);
    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<WebhookConfig>;
  });

  // ── DELETE /admin/webhooks/:id ─────────────────────────────────────────────
  app.delete("/admin/webhooks/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const hooks = readStore();
    const idx = hooks.findIndex((h) => h.id === id);
    if (idx === -1) {
      reply.status(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Webhook not found" } } as ApiResponse;
    }

    hooks.splice(idx, 1);
    writeStore(hooks);
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
    const hooks = readStore();
    const hook = hooks.find((h) => h.id === id);
    if (!hook) {
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
    if (hook.secret) {
      headers["x-maphari-signature"] = signPayload(hook.secret, bodyStr);
    }

    const start = Date.now();
    let statusCode = 0;
    let ok = false;
    try {
      const res = await fetch(hook.url, {
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
