// ════════════════════════════════════════════════════════════════════════════
// brand.ts — Brand Control: email templates + custom domains
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : ADMIN only (full CRUD)
//
// Endpoints:
//   GET    /email-templates             → list
//   POST   /email-templates             → create
//   PATCH  /email-templates/:id         → update
//   DELETE /email-templates/:id         → delete
//   GET    /custom-domains              → list
//   POST   /custom-domains              → create
//   PATCH  /custom-domains/:id          → update
//   DELETE /custom-domains/:id          → delete
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerBrandRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /email-templates ───────────────────────────────────────────────────
  app.get("/email-templates", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can view email templates." } } as ApiResponse);
    }

    const templates = await prisma.emailTemplate.findMany({
      where: { workspaceId: "default" },
      orderBy: { name: "asc" }
    });

    return { success: true, data: templates, meta: { requestId: scope.requestId } } as ApiResponse<typeof templates>;
  });

  // ── POST /email-templates ──────────────────────────────────────────────────
  app.post("/email-templates", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can create email templates." } } as ApiResponse);
    }

    const body = request.body as {
      templateKey: string;
      name: string;
      subject?: string;
      bodyHtml?: string;
      status?: string;
    };

    if (!body.templateKey || !body.name) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "templateKey and name are required." } } as ApiResponse);
    }

    const template = await prisma.emailTemplate.create({
      data: {
        workspaceId: "default",
        templateKey: body.templateKey,
        name: body.name,
        subject: body.subject ?? "",
        bodyHtml: body.bodyHtml ?? "",
        status: body.status ?? "active",
      }
    });

    return { success: true, data: template, meta: { requestId: scope.requestId } } as ApiResponse<typeof template>;
  });

  // ── PATCH /email-templates/:id ─────────────────────────────────────────────
  app.patch("/email-templates/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can update email templates." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      subject?: string;
      bodyHtml?: string;
      status?: string;
      sentCount?: number;
    };

    try {
      const template = await prisma.emailTemplate.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.subject !== undefined ? { subject: body.subject } : {}),
          ...(body.bodyHtml !== undefined ? { bodyHtml: body.bodyHtml } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.sentCount !== undefined ? { sentCount: body.sentCount } : {}),
          lastEditedAt: new Date(),
        }
      });

      return { success: true, data: template, meta: { requestId: scope.requestId } } as ApiResponse<typeof template>;
    } catch {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Email template not found." } } as ApiResponse);
    }
  });

  // ── DELETE /email-templates/:id ────────────────────────────────────────────
  app.delete("/email-templates/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can delete email templates." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };

    try {
      await prisma.emailTemplate.delete({ where: { id } });
      return { success: true, data: { id }, meta: { requestId: scope.requestId } } as ApiResponse<{ id: string }>;
    } catch {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Email template not found." } } as ApiResponse);
    }
  });

  // ── GET /custom-domains ────────────────────────────────────────────────────
  app.get("/custom-domains", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can view custom domains." } } as ApiResponse);
    }

    const domains = await prisma.customDomain.findMany({
      where: { workspaceId: "default" },
      orderBy: { domain: "asc" }
    });

    return { success: true, data: domains, meta: { requestId: scope.requestId } } as ApiResponse<typeof domains>;
  });

  // ── POST /custom-domains ───────────────────────────────────────────────────
  app.post("/custom-domains", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can add custom domains." } } as ApiResponse);
    }

    const body = request.body as {
      domain: string;
      domainType?: string;
      status?: string;
    };

    if (!body.domain) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "domain is required." } } as ApiResponse);
    }

    try {
      const domain = await prisma.customDomain.create({
        data: {
          workspaceId: "default",
          domain: body.domain,
          domainType: body.domainType ?? "Client Portal",
          status: body.status ?? "pending",
        }
      });

      return { success: true, data: domain, meta: { requestId: scope.requestId } } as ApiResponse<typeof domain>;
    } catch {
      return reply.code(409).send({ success: false, error: { code: "DUPLICATE", message: "Domain already exists." } } as ApiResponse);
    }
  });

  // ── PATCH /custom-domains/:id ──────────────────────────────────────────────
  app.patch("/custom-domains/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can update custom domains." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as {
      status?: string;
      sslActive?: boolean;
      verified?: boolean;
      verifiedAt?: string | null;
      domainType?: string;
    };

    try {
      const domain = await prisma.customDomain.update({
        where: { id },
        data: {
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.sslActive !== undefined ? { sslActive: body.sslActive } : {}),
          ...(body.verified !== undefined ? { verified: body.verified } : {}),
          ...(body.verifiedAt !== undefined ? { verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : null } : {}),
          ...(body.domainType !== undefined ? { domainType: body.domainType } : {}),
        }
      });

      return { success: true, data: domain, meta: { requestId: scope.requestId } } as ApiResponse<typeof domain>;
    } catch {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Custom domain not found." } } as ApiResponse);
    }
  });

  // ── DELETE /custom-domains/:id ─────────────────────────────────────────────
  app.delete("/custom-domains/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can delete custom domains." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };

    try {
      await prisma.customDomain.delete({ where: { id } });
      return { success: true, data: { id }, meta: { requestId: scope.requestId } } as ApiResponse<{ id: string }>;
    } catch {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Custom domain not found." } } as ApiResponse);
    }
  });
}
