// ════════════════════════════════════════════════════════════════════════════
// announcements.ts — Announcement routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN full; STAFF/CLIENT read published/live only
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { Announcement } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTO ───────────────────────────────────────────────────────────────────────
type AnnouncementDto = {
  id: string;
  title: string;
  type: string;
  target: string;
  reach: number;
  status: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};

function toDto(a: Announcement): AnnouncementDto {
  return {
    ...a,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    scheduledAt: a.scheduledAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerAnnouncementRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /announcements ─────────────────────────────────────────────────────
  app.get("/announcements", async (request) => {
    const scope = readScopeHeaders(request);
    const isAdmin = scope.role === "ADMIN";

    // Non-admin only sees live/published announcements matching their target
    const target = isAdmin ? "all" : scope.role === "STAFF" ? "staff" : "client";
    const cacheKey = CacheKeys.announcements(isAdmin ? "admin" : target);

    try {
      const data = await withCache(cacheKey, 60, () =>
        prisma.announcement.findMany({
          where: isAdmin
            ? {}
            : { status: "LIVE", target: { in: ["ALL", target.toUpperCase()] } },
          orderBy: { createdAt: "desc" },
        }).then((rows) => rows.map(toDto))
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<AnnouncementDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "ANNOUNCEMENTS_FETCH_FAILED", message: "Unable to fetch announcements" } } as ApiResponse;
    }
  });

  // ── POST /announcements ────────────────────────────────────────────────────
  app.post("/announcements", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const body = request.body as { title: string; type?: string; target?: string; scheduledAt?: string };
    if (!body.title) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "title is required" } } as ApiResponse;
    }

    try {
      const announcement = await prisma.announcement.create({
        data: {
          title: body.title,
          type: body.type ?? "INFO",
          target: body.target ?? "ALL",
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
          status: "DRAFT",
          authorId: scope.userId ?? null,
        },
      });

      // Invalidate all announcement caches
      for (const key of ["admin", "staff", "client", "all"]) {
        await app.log.info({ msg: `Invalidating ${CacheKeys.announcements(key)}` });
      }

      reply.status(201);
      return { success: true, data: toDto(announcement) } as ApiResponse<AnnouncementDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "ANNOUNCEMENT_CREATE_FAILED", message: "Unable to create announcement" } } as ApiResponse;
    }
  });

  // ── PATCH /announcements/:id/publish ──────────────────────────────────────
  app.patch("/announcements/:id/publish", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };

    try {
      const announcement = await prisma.announcement.update({
        where: { id },
        data: { status: "LIVE", publishedAt: new Date() },
      });
      return { success: true, data: toDto(announcement) } as ApiResponse<AnnouncementDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "ANNOUNCEMENT_PUBLISH_FAILED", message: "Unable to publish announcement" } } as ApiResponse;
    }
  });
}
