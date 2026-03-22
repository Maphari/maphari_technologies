import {
  createClientContactSchema,
  createClientSchema,
  getClientPreferencesQuerySchema,
  getClientQuerySchema,
  type ApiResponse,
  updateClientContactSchema,
  updateClientSchema,
  updateClientStatusSchema,
  upsertClientPreferencesSchema
} from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys, eventBus } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

type ClientStatus = "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED";

function canEdit(role: string): boolean {
  return role === "ADMIN" || role === "STAFF";
}

function canManageStatus(role: string): boolean {
  return role === "ADMIN" || role === "STAFF";
}

async function logClientActivity(input: {
  clientId: string;
  type: string;
  message: string;
  actorId?: string;
  actorRole?: string;
  metadata?: string;
}): Promise<void> {
  await prisma.clientActivity.create({
    data: {
      clientId: input.clientId,
      type: input.type,
      message: input.message,
      actorId: input.actorId,
      actorRole: input.actorRole,
      metadata: input.metadata
    }
  });
}

async function emitClientRenewalEvent(input: {
  clientId: string;
  name: string;
  contractRenewalAt: Date;
  requestId?: string;
}): Promise<void> {
  const now = Date.now();
  const renewalAt = input.contractRenewalAt.getTime();
  const daysUntilRenewal = Math.ceil((renewalAt - now) / (24 * 60 * 60 * 1000));
  if (daysUntilRenewal < 0 || daysUntilRenewal > 45) return;

  await eventBus.publish({
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    requestId: input.requestId,
    topic: EventTopics.clientRenewalDue,
    payload: {
      clientId: input.clientId,
      clientName: input.name,
      contractRenewalAt: input.contractRenewalAt.toISOString(),
      daysUntilRenewal
    }
  });
}

export async function registerClientRoutes(app: FastifyInstance): Promise<void> {
  app.get("/clients", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const whereClause = clientId ? { id: clientId } : {};
    const cacheKey = CacheKeys.clients(clientId);

    try {
      const cached = await cache.getJson<Awaited<ReturnType<typeof prisma.client.findMany>>>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          meta: { requestId: scope.requestId, cache: "hit" }
        } as ApiResponse<typeof cached>;
      }

      const clients = await prisma.client.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" }
      });

      await cache.setJson(cacheKey, clients, 30);

      return {
        success: true,
        data: clients,
        meta: { requestId: scope.requestId, cache: "miss" }
      } as ApiResponse<typeof clients>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: {
          code: "CLIENTS_FETCH_FAILED",
          message: "Unable to fetch clients"
        }
      } as ApiResponse;
    }
  });

  app.get("/clients/directory", async (request) => {
    const scope = readScopeHeaders(request);
    const parsed = getClientQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid client query payload", details: parsed.error.flatten() }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    const page = parsed.data.page ?? 1;
    const pageSize = parsed.data.pageSize ?? 20;
    const sortBy = parsed.data.sortBy ?? "updatedAt";
    const sortDir = parsed.data.sortDir ?? "desc";

    const whereClause = {
      ...(effectiveClientId ? { id: effectiveClientId } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.tier ? { tier: parsed.data.tier } : {}),
      ...(parsed.data.q
        ? {
            OR: [
              { name: { contains: parsed.data.q, mode: "insensitive" as const } },
              { billingEmail: { contains: parsed.data.q, mode: "insensitive" as const } },
              { ownerName: { contains: parsed.data.q, mode: "insensitive" as const } }
            ]
          }
        : {})
    };

    try {
      const [items, total] = await Promise.all([
        prisma.client.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortDir },
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        prisma.client.count({ where: whereClause })
      ]);

      return {
        success: true,
        data: {
          items,
          total,
          page,
          pageSize
        },
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "CLIENTS_DIRECTORY_FETCH_FAILED", message: "Unable to fetch clients directory" }
      } as ApiResponse;
    }
  });

  app.get("/clients/:clientId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const params = request.params as { clientId?: string };
    const clientId = params.clientId;
    if (!clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId is required" } } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    if (effectiveClientId && effectiveClientId !== clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Forbidden client scope" } } as ApiResponse;
    }

    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
          activities: { orderBy: { createdAt: "desc" }, take: 50 },
          statusHistory: { orderBy: { changedAt: "desc" }, take: 50 },
          projects: {
            orderBy: { updatedAt: "desc" },
            take: 20
          },
          leads: {
            orderBy: { updatedAt: "desc" },
            take: 20
          }
        }
      });

      if (!client) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Client not found" } } as ApiResponse;
      }

      return {
        success: true,
        data: client,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof client>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "CLIENT_FETCH_FAILED", message: "Unable to fetch client detail" }
      } as ApiResponse;
    }
  });

  app.post("/clients", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!canEdit(scope.role)) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can create clients" } } as ApiResponse;
    }

    const parsed = createClientSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid client payload", details: parsed.error.flatten() }
      } as ApiResponse;
    }

    try {
      const client = await prisma.client.create({
        data: {
          name: parsed.data.name,
          status: (parsed.data.status ?? "ONBOARDING") as ClientStatus,
          priority: parsed.data.priority ?? "MEDIUM",
          tier: parsed.data.tier ?? "STARTER",
          timezone: parsed.data.timezone ?? null,
          billingEmail: parsed.data.billingEmail ?? null,
          ownerName: parsed.data.ownerName ?? null,
          contractStartAt: parsed.data.contractStartAt ? new Date(parsed.data.contractStartAt) : null,
          contractRenewalAt: parsed.data.contractRenewalAt ? new Date(parsed.data.contractRenewalAt) : null,
          slaTier: parsed.data.slaTier ?? "STANDARD",
          slaResponseHours: parsed.data.slaResponseHours ?? 24,
          notes: parsed.data.notes ?? null
        }
      });

      const provisionedTasks: Array<Promise<unknown>> = [];
      provisionedTasks.push(
        prisma.project.create({
          data: {
            clientId: client.id,
            name: `${client.name} Onboarding`,
            description: "Starter workspace created automatically for kickoff alignment.",
            status: "PLANNING",
            ownerName: client.ownerName ?? null,
            priority: "MEDIUM",
            riskLevel: "LOW"
          }
        })
      );

      if (client.billingEmail) {
        provisionedTasks.push(
          prisma.clientContact.create({
            data: {
              clientId: client.id,
              name: client.ownerName ?? client.name,
              email: client.billingEmail,
              role: "Billing",
              isPrimary: true
            }
          })
        );
      }

      await Promise.all([
        cache.delete(CacheKeys.clients()),
        logClientActivity({
          clientId: client.id,
          type: "CLIENT_CREATED",
          message: "Client profile created",
          actorId: scope.userId,
          actorRole: scope.role
        }),
        prisma.clientStatusHistory.create({
          data: {
            clientId: client.id,
            fromStatus: null,
            toStatus: client.status,
            reason: "Client record created",
            actorId: scope.userId,
            actorRole: scope.role
          }
        }),
        eventBus.publish({
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          requestId: scope.requestId,
          topic: EventTopics.clientCreated,
          payload: {
            clientId: client.id,
            name: client.name,
            status: client.status,
            ownerName: client.ownerName
          }
        }),
        ...provisionedTasks
      ]);

      if (client.contractRenewalAt) {
        await emitClientRenewalEvent({
          clientId: client.id,
          name: client.name,
          contractRenewalAt: client.contractRenewalAt,
          requestId: scope.requestId
        });
      }

      return { success: true, data: client, meta: { requestId: scope.requestId } } as ApiResponse<typeof client>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "CLIENT_CREATE_FAILED", message: "Unable to create client" } } as ApiResponse;
    }
  });

  app.patch("/clients/:clientId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const params = request.params as { clientId?: string };
    const parsed = updateClientSchema.safeParse({ clientId: params.clientId, ...(request.body as object) });
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid client update payload", details: parsed.error.flatten() }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    if (effectiveClientId && effectiveClientId !== parsed.data.clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Forbidden client scope" } } as ApiResponse;
    }

    if (!canEdit(scope.role)) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can edit clients" } } as ApiResponse;
    }

    try {
      const existing = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Client not found" } } as ApiResponse;
      }

      const updated = await prisma.client.update({
        where: { id: parsed.data.clientId },
        data: {
          name: parsed.data.name ?? existing.name,
          priority: parsed.data.priority ?? existing.priority,
          tier: parsed.data.tier ?? existing.tier,
          timezone: parsed.data.timezone ?? existing.timezone,
          billingEmail: parsed.data.billingEmail ?? existing.billingEmail,
          ownerName: parsed.data.ownerName ?? existing.ownerName,
          contractStartAt:
            parsed.data.contractStartAt !== undefined
              ? parsed.data.contractStartAt
                ? new Date(parsed.data.contractStartAt)
                : null
              : existing.contractStartAt,
          contractRenewalAt:
            parsed.data.contractRenewalAt !== undefined
              ? parsed.data.contractRenewalAt
                ? new Date(parsed.data.contractRenewalAt)
                : null
              : existing.contractRenewalAt,
          slaTier: parsed.data.slaTier ?? existing.slaTier,
          slaResponseHours: parsed.data.slaResponseHours ?? existing.slaResponseHours,
          notes: parsed.data.notes ?? existing.notes
        }
      });

      await Promise.all([
        cache.delete(CacheKeys.clients()),
        cache.delete(CacheKeys.clients(updated.id)),
        logClientActivity({
          clientId: updated.id,
          type: "CLIENT_UPDATED",
          message: "Client profile updated",
          actorId: scope.userId,
          actorRole: scope.role
        })
      ]);

      if (updated.contractRenewalAt) {
        await emitClientRenewalEvent({
          clientId: updated.id,
          name: updated.name,
          contractRenewalAt: updated.contractRenewalAt,
          requestId: scope.requestId
        });
      }

      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "CLIENT_UPDATE_FAILED", message: "Unable to update client" } } as ApiResponse;
    }
  });

  app.patch("/clients/:clientId/status", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const params = request.params as { clientId?: string };
    const parsed = updateClientStatusSchema.safeParse({ clientId: params.clientId, ...(request.body as object) });
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid status payload", details: parsed.error.flatten() }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    if (effectiveClientId && effectiveClientId !== parsed.data.clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Forbidden client scope" } } as ApiResponse;
    }

    if (!canManageStatus(scope.role)) {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Only staff or admins can change client status" }
      } as ApiResponse;
    }

    try {
      const existing = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Client not found" } } as ApiResponse;
      }

      const updated = await prisma.client.update({
        where: { id: parsed.data.clientId },
        data: { status: parsed.data.status }
      });

      await Promise.all([
        cache.delete(CacheKeys.clients()),
        cache.delete(CacheKeys.clients(updated.id)),
        prisma.clientStatusHistory.create({
          data: {
            clientId: updated.id,
            fromStatus: existing.status,
            toStatus: updated.status,
            reason: parsed.data.reason ?? null,
            actorId: scope.userId,
            actorRole: scope.role
          }
        }),
        logClientActivity({
          clientId: updated.id,
          type: "CLIENT_STATUS_UPDATED",
          message: `Client moved ${existing.status} -> ${updated.status}${parsed.data.reason ? ` (${parsed.data.reason})` : ""}`,
          actorId: scope.userId,
          actorRole: scope.role
        }),
        eventBus.publish({
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          requestId: scope.requestId,
          topic: EventTopics.clientStatusUpdated,
          payload: {
            clientId: updated.id,
            fromStatus: existing.status,
            toStatus: updated.status,
            reason: parsed.data.reason ?? null
          }
        })
      ]);

      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "CLIENT_STATUS_UPDATE_FAILED", message: "Unable to update client status" }
      } as ApiResponse;
    }
  });

  app.get("/clients/:clientId/contacts", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const params = request.params as { clientId?: string };
    if (!params.clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId is required" } } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    if (effectiveClientId && effectiveClientId !== params.clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Forbidden client scope" } } as ApiResponse;
    }

    try {
      const contacts = await prisma.clientContact.findMany({
        where: { clientId: params.clientId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
      });
      return { success: true, data: contacts, meta: { requestId: scope.requestId } } as ApiResponse<typeof contacts>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "CLIENT_CONTACTS_FETCH_FAILED", message: "Unable to fetch contacts" } } as ApiResponse;
    }
  });

  app.post("/clients/:clientId/contacts", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!canEdit(scope.role)) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can manage contacts" } } as ApiResponse;
    }

    const params = request.params as { clientId?: string };
    const parsed = createClientContactSchema.safeParse({ clientId: params.clientId, ...(request.body as object) });
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid contact payload", details: parsed.error.flatten() }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    if (effectiveClientId && effectiveClientId !== parsed.data.clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Forbidden client scope" } } as ApiResponse;
    }

    try {
      const [client, contact] = await prisma.$transaction(async (tx) => {
        const existingClient = await tx.client.findUnique({ where: { id: parsed.data.clientId } });
        if (!existingClient) {
          throw new Error("NOT_FOUND");
        }

        if (parsed.data.isPrimary) {
          await tx.clientContact.updateMany({
            where: { clientId: parsed.data.clientId },
            data: { isPrimary: false }
          });
        }

        const created = await tx.clientContact.create({
          data: {
            clientId: parsed.data.clientId,
            name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone ?? null,
            role: parsed.data.role ?? null,
            isPrimary: parsed.data.isPrimary ?? false
          }
        });

        return [existingClient, created] as const;
      });

      await logClientActivity({
        clientId: client.id,
        type: "CLIENT_CONTACT_CREATED",
        message: `Contact added: ${contact.name}`,
        actorId: scope.userId,
        actorRole: scope.role
      });

      return { success: true, data: contact, meta: { requestId: scope.requestId } } as ApiResponse<typeof contact>;
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Client not found" } } as ApiResponse;
      }
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "CLIENT_CONTACT_CREATE_FAILED", message: "Unable to create contact" } } as ApiResponse;
    }
  });

  app.patch("/clients/:clientId/contacts/:contactId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!canEdit(scope.role)) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can manage contacts" } } as ApiResponse;
    }

    const params = request.params as { clientId?: string; contactId?: string };
    const parsed = updateClientContactSchema.safeParse({
      clientId: params.clientId,
      contactId: params.contactId,
      ...(request.body as object)
    });
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid contact update payload", details: parsed.error.flatten() }
      } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    if (effectiveClientId && effectiveClientId !== parsed.data.clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Forbidden client scope" } } as ApiResponse;
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const contact = await tx.clientContact.findUnique({ where: { id: parsed.data.contactId } });
        if (!contact || contact.clientId !== parsed.data.clientId) throw new Error("NOT_FOUND");

        if (parsed.data.isPrimary) {
          await tx.clientContact.updateMany({
            where: { clientId: parsed.data.clientId },
            data: { isPrimary: false }
          });
        }

        return tx.clientContact.update({
          where: { id: parsed.data.contactId },
          data: {
            name: parsed.data.name ?? contact.name,
            email: parsed.data.email ?? contact.email,
            phone: parsed.data.phone ?? contact.phone,
            role: parsed.data.role ?? contact.role,
            isPrimary: parsed.data.isPrimary ?? contact.isPrimary
          }
        });
      });

      await logClientActivity({
        clientId: parsed.data.clientId,
        type: "CLIENT_CONTACT_UPDATED",
        message: `Contact updated: ${updated.name}`,
        actorId: scope.userId,
        actorRole: scope.role
      });

      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Contact not found" } } as ApiResponse;
      }
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "CLIENT_CONTACT_UPDATE_FAILED", message: "Unable to update contact" } } as ApiResponse;
    }
  });

  app.get("/clients/:clientId/activities", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const params = request.params as { clientId?: string };
    if (!params.clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId is required" } } as ApiResponse;
    }
    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    if (effectiveClientId && effectiveClientId !== params.clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Forbidden client scope" } } as ApiResponse;
    }
    try {
      const activities = await prisma.clientActivity.findMany({
        where: { clientId: params.clientId },
        orderBy: { createdAt: "desc" },
        take: 100
      });
      return { success: true, data: activities, meta: { requestId: scope.requestId } } as ApiResponse<typeof activities>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "CLIENT_ACTIVITIES_FETCH_FAILED", message: "Unable to fetch client activities" } } as ApiResponse;
    }
  });

  app.get("/clients/:clientId/status-history", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const params = request.params as { clientId?: string };
    if (!params.clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId is required" } } as ApiResponse;
    }
    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    if (effectiveClientId && effectiveClientId !== params.clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Forbidden client scope" } } as ApiResponse;
    }
    try {
      const history = await prisma.clientStatusHistory.findMany({
        where: { clientId: params.clientId },
        orderBy: { changedAt: "desc" },
        take: 100
      });
      return { success: true, data: history, meta: { requestId: scope.requestId } } as ApiResponse<typeof history>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "CLIENT_STATUS_HISTORY_FETCH_FAILED", message: "Unable to fetch status history" } } as ApiResponse;
    }
  });

  // ── Team Management ────────────────────────────────────────────────────────
  // GET /clients/:clientId/team
  // List all ClientContacts for this client, projected to PortalTeamMember shape.
  // CLIENT role is allowed (scoped to own clientId).
  app.get("/clients/:clientId/team", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const params = request.params as { clientId?: string };
    if (!params.clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId is required" } } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    if (effectiveClientId && effectiveClientId !== params.clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Forbidden client scope" } } as ApiResponse;
    }

    try {
      const contacts = await prisma.clientContact.findMany({
        where: { clientId: params.clientId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
      });

      const members = contacts.map(c => ({
        id: c.id,
        clientId: c.clientId,
        name: c.name,
        email: c.email,
        role: c.isPrimary ? "Owner" : (c.role ?? "Viewer"),
        status: "Active",
        lastActiveAt: null as string | null,
        createdAt: c.createdAt.toISOString()
      }));

      return { success: true, data: members, meta: { requestId: scope.requestId } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "CLIENT_TEAM_FETCH_FAILED", message: "Unable to fetch team members" } } as ApiResponse;
    }
  });

  // POST /clients/:clientId/team/invite
  // Create a ClientContact (pending invite) and return PortalTeamInvite shape.
  // CLIENT role is allowed (scoped to own clientId).
  app.post("/clients/:clientId/team/invite", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const params = request.params as { clientId?: string };
    if (!params.clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId is required" } } as ApiResponse;
    }

    const effectiveClientId = resolveClientFilter(scope.role, scope.clientId);
    if (effectiveClientId && effectiveClientId !== params.clientId) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Forbidden client scope" } } as ApiResponse;
    }

    const body = request.body as Record<string, unknown>;
    const email = typeof body?.email === "string" ? body.email.trim() : null;
    const role  = typeof body?.role  === "string" ? body.role.trim()  : "Viewer";

    if (!email || !email.includes("@")) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "A valid email address is required" } } as ApiResponse;
    }

    // Derive a readable placeholder name from the email prefix
    const prefix = email.split("@")[0];
    const nameParts = prefix.replace(/[._\-+]/g, " ").split(" ").filter(Boolean);
    const name = nameParts.length > 0
      ? nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
      : email;

    try {
      const client = await prisma.client.findUnique({ where: { id: params.clientId } });
      if (!client) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Client not found" } } as ApiResponse;
      }

      const contact = await prisma.clientContact.create({
        data: {
          clientId: params.clientId,
          name,
          email,
          // Prevent self-escalation: clients cannot invite an Owner via this route
          role: role === "Owner" ? "Collaborator" : role,
          isPrimary: false
        }
      });

      await logClientActivity({
        clientId: params.clientId,
        type: "TEAM_MEMBER_INVITED",
        message: `Team member invited: ${email} as ${contact.role}`,
        actorId: scope.userId,
        actorRole: scope.role
      });

      return {
        success: true,
        data: {
          id: contact.id,
          email: contact.email,
          role: contact.role ?? "Viewer",
          status: "Pending",
          createdAt: contact.createdAt.toISOString()
        },
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "CLIENT_TEAM_INVITE_FAILED", message: "Unable to invite team member" } } as ApiResponse;
    }
  });

  app.get("/client-preferences", async (request) => {
    const scope = readScopeHeaders(request);
    const parsed = getClientPreferencesQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid client preference query", details: parsed.error.flatten() }
      } as ApiResponse;
    }
    if (!scope.userId) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Missing user scope" } } as ApiResponse;
    }

    try {
      const pref = await prisma.userPreference.findUnique({
        where: {
          userId_key: {
            userId: scope.userId,
            key: `clients.${parsed.data.key}`
          }
        }
      });
      return { success: true, data: pref, meta: { requestId: scope.requestId } } as ApiResponse<typeof pref>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "CLIENT_PREF_FETCH_FAILED", message: "Unable to fetch client preference" }
      } as ApiResponse;
    }
  });

  app.post("/client-preferences", async (request) => {
    const scope = readScopeHeaders(request);
    const parsed = upsertClientPreferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid client preference payload", details: parsed.error.flatten() }
      } as ApiResponse;
    }
    if (!scope.userId) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Missing user scope" } } as ApiResponse;
    }

    try {
      const pref = await prisma.userPreference.upsert({
        where: {
          userId_key: {
            userId: scope.userId,
            key: `clients.${parsed.data.key}`
          }
        },
        update: { value: parsed.data.value },
        create: {
          userId: scope.userId,
          key: `clients.${parsed.data.key}`,
          value: parsed.data.value
        }
      });

      return { success: true, data: pref, meta: { requestId: scope.requestId } } as ApiResponse<typeof pref>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "CLIENT_PREF_SAVE_FAILED", message: "Unable to save client preference" }
      } as ApiResponse;
    }
  });

  // ── POST /admin/clients/broadcast ─────────────────────────────────────────
  app.post("/admin/clients/broadcast", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin access required." } } as ApiResponse);
    }

    const body = request.body as { clientIds?: unknown; subject?: unknown; body?: unknown } | null;
    const clientIds = Array.isArray(body?.clientIds) ? (body.clientIds as unknown[]).filter((id): id is string => typeof id === "string") : [];
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const messageBody = typeof body?.body === "string" ? body.body.trim() : "";

    if (clientIds.length === 0) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "clientIds must be a non-empty array of strings." } } as ApiResponse);
    }
    if (!subject) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "subject is required." } } as ApiResponse);
    }
    if (messageBody.length < 10) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "body must be at least 10 characters." } } as ApiResponse);
    }

    try {
      const clients = await prisma.client.findMany({
        where: { id: { in: clientIds } },
        select: { id: true, billingEmail: true, name: true },
      });

      const clientsWithEmail = clients.filter((c) => !!c.billingEmail);

      const results = await Promise.allSettled(
        clientsWithEmail.map((client) =>
          eventBus.publish({
            eventId: randomUUID(),
            occurredAt: new Date().toISOString(),
            requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined,
            topic: EventTopics.notificationRequested,
            payload: {
              channel: "EMAIL",
              recipientEmail: client.billingEmail!,
              subject,
              message: messageBody,
            },
          })
        )
      );

      const sent = results.filter((r) => r.status === "fulfilled").length;
      return { success: true, data: { sent, total: clientIds.length }, meta: { requestId: scope.requestId } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: "BROADCAST_FAILED", message: "Broadcast failed." } } as ApiResponse);
    }
  });
}
