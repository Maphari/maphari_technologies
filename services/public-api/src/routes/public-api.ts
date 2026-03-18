import {
  publicApiKeyIssueSchema,
  publicApiProjectCreateSchema,
  type ApiResponse
} from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import { verifyPublicApiRequest } from "../lib/auth.js";
import {
  createApiKey,
  createPartnerProject,
  listApiKeys,
  listPartnerProjects
} from "../lib/store.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Upstream proxy helper ─────────────────────────────────────────────────────

/**
 * Forward a GET request to an upstream service and return the JSON response.
 * Used by partner-scoped read endpoints to fetch live data from core/billing.
 */
async function proxyUpstream<T = unknown>(url: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      headers: {
        "content-type": "application/json",
        "x-internal-source": "public-api",
        "x-user-role": "ADMIN"   // minimal scope header for internal service access
      }
    });
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: { code: "UPSTREAM_UNAVAILABLE", message: "Upstream service temporarily unavailable" }
    };
  }
}

type MetricsApp = FastifyInstance & {
  serviceMetrics?: {
    inc: (name: string, labels?: Record<string, string | number>) => void;
  };
};

export async function registerPublicApiRoutes(app: FastifyInstance): Promise<void> {
  const metrics = (app as MetricsApp).serviceMetrics;

  app.post("/public-api/keys", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = publicApiKeyIssueSchema.safeParse(request.body);

    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid API key payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
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

    const key = createApiKey(clientId, parsedBody.data.label);
    return {
      success: true,
      data: key,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof key>;
  });

  app.get("/public-api/keys", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const keys = listApiKeys(clientId);

    return {
      success: true,
      data: keys,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof keys>;
  });

  app.post("/public-api/projects", async (request, reply) => {
    const authResult = verifyPublicApiRequest(request);
    if (!authResult.ok || !authResult.clientId) {
      metrics?.inc("public_api_auth_failures_total", { service: "public-api" });
      reply.status(401);
      return {
        success: false,
        error: {
          code: authResult.errorCode ?? "UNAUTHORIZED",
          message: authResult.errorMessage ?? "Public API request is not authorized"
        }
      } as ApiResponse;
    }

    const parsedBody = publicApiProjectCreateSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    // Partner write operations are pinned to the clientId represented by the API key.
    const project = createPartnerProject(authResult.clientId, parsedBody.data.name, parsedBody.data.description);
    metrics?.inc("public_api_requests_total", { service: "public-api", operation: "project.create" });

    return {
      success: true,
      data: project
    } as ApiResponse<typeof project>;
  });

  app.get("/public-api/projects", async (request, reply) => {
    const authResult = verifyPublicApiRequest(request);
    if (!authResult.ok || !authResult.clientId) {
      metrics?.inc("public_api_auth_failures_total", { service: "public-api" });
      reply.status(401);
      return {
        success: false,
        error: {
          code: authResult.errorCode ?? "UNAUTHORIZED",
          message: authResult.errorMessage ?? "Public API request is not authorized"
        }
      } as ApiResponse;
    }

    const projects = listPartnerProjects(authResult.clientId);
    metrics?.inc("public_api_requests_total", { service: "public-api", operation: "project.list" });

    return {
      success: true,
      data: projects
    } as ApiResponse<typeof projects>;
  });

  // ── GET /public-api/client/status ──────────────────────────────────────────
  // Partner-facing: returns the current status and key details of the client
  // associated with the caller's API key. Proxies to the core service.
  app.get("/public-api/client/status", async (request, reply) => {
    const authResult = verifyPublicApiRequest(request);
    if (!authResult.ok || !authResult.clientId) {
      metrics?.inc("public_api_auth_failures_total", { service: "public-api" });
      reply.status(401);
      return {
        success: false,
        error: {
          code: authResult.errorCode ?? "UNAUTHORIZED",
          message: authResult.errorMessage ?? "Public API request is not authorized"
        }
      } as ApiResponse;
    }

    const coreUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    const upstream = await proxyUpstream(`${coreUrl}/clients/${authResult.clientId}`);
    metrics?.inc("public_api_requests_total", { service: "public-api", operation: "client.status" });

    if (!upstream.success) {
      reply.status(502);
      return upstream;
    }

    // Return a partner-safe subset: id, name, status, industry, createdAt
    const c = upstream.data as Record<string, unknown> | null;
    return {
      success: true,
      data: c
        ? {
            id:        c.id,
            name:      c.name,
            status:    c.status,
            industry:  c.industry,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          }
        : null,
    } as ApiResponse;
  });

  // ── GET /public-api/invoices ───────────────────────────────────────────────
  // Partner-facing: returns invoices scoped to the caller's client ID.
  // Proxies to the billing service.
  app.get("/public-api/invoices", async (request, reply) => {
    const authResult = verifyPublicApiRequest(request);
    if (!authResult.ok || !authResult.clientId) {
      metrics?.inc("public_api_auth_failures_total", { service: "public-api" });
      reply.status(401);
      return {
        success: false,
        error: {
          code: authResult.errorCode ?? "UNAUTHORIZED",
          message: authResult.errorMessage ?? "Public API request is not authorized"
        }
      } as ApiResponse;
    }

    const billingUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4003";
    const upstream = await proxyUpstream(`${billingUrl}/billing/invoices?clientId=${encodeURIComponent(authResult.clientId)}`);
    metrics?.inc("public_api_requests_total", { service: "public-api", operation: "invoice.list" });

    if (!upstream.success) {
      reply.status(502);
      return upstream;
    }

    // Return partner-safe invoice fields only
    const invoices = (upstream.data as Record<string, unknown>[] | null) ?? [];
    return {
      success: true,
      data: invoices.map((inv: Record<string, unknown>) => ({
        id:         inv.id,
        ref:        inv.ref,
        status:     inv.status,
        amount:     inv.amount,
        currency:   inv.currency,
        issuedAt:   inv.issuedAt,
        dueAt:      inv.dueAt,
        paidAt:     inv.paidAt,
      })),
    } as ApiResponse;
  });

  // ── GET /public-api/projects/live ─────────────────────────────────────────
  // Partner-facing: returns live projects from the core service for this client.
  // (distinct from the in-memory partner projects created via the partner API)
  app.get("/public-api/projects/live", async (request, reply) => {
    const authResult = verifyPublicApiRequest(request);
    if (!authResult.ok || !authResult.clientId) {
      metrics?.inc("public_api_auth_failures_total", { service: "public-api" });
      reply.status(401);
      return {
        success: false,
        error: {
          code: authResult.errorCode ?? "UNAUTHORIZED",
          message: authResult.errorMessage ?? "Public API request is not authorized"
        }
      } as ApiResponse;
    }

    const coreUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    const upstream = await proxyUpstream(
      `${coreUrl}/projects?clientId=${encodeURIComponent(authResult.clientId)}`
    );
    metrics?.inc("public_api_requests_total", { service: "public-api", operation: "project.list.live" });

    if (!upstream.success) {
      reply.status(502);
      return upstream;
    }

    const projects = (upstream.data as Record<string, unknown>[] | null) ?? [];
    return {
      success: true,
      data: projects.map((p: Record<string, unknown>) => ({
        id:          p.id,
        name:        p.name,
        status:      p.status,
        phase:       p.phase,
        startDate:   p.startDate,
        endDate:     p.endDate,
        progress:    p.progress,
        description: p.description,
      })),
    } as ApiResponse;
  });
}
