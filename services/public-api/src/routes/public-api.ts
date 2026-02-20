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
}
