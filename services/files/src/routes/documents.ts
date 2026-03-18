/**
 * /admin/documents — Document Vault CRUD routes.
 *
 * Accessible by ADMIN and STAFF only (enforced via x-user-role header
 * forwarded from the gateway's RbacGuard).
 *
 * Routes:
 *   GET    /admin/documents              list vault documents (filter: category, clientId, status)
 *   POST   /admin/documents              create a new document record
 *   PATCH  /admin/documents/:id          update metadata (title, category, description, status, tags)
 *   DELETE /admin/documents/:id          archive a document (soft-delete via status = ARCHIVED)
 *   GET    /admin/documents/export-index export document index as CSV text
 */

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { type Prisma } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DocCategory = "CONTRACT" | "BRIEF" | "DELIVERABLE" | "INVOICE" | "ASSET" | "TEMPLATE" | "MISC";
export type DocStatus   = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface VaultDocumentDto {
  id:          string;
  title:       string;
  category:    string;
  description: string | null;
  status:      string;
  clientId:    string | null;
  fileName:    string;
  mimeType:    string;
  sizeBytes:   number;
  storageKey:  string;
  uploadedBy:  string;
  version:     number;
  tags:        string[];
  createdAt:   string;
  updatedAt:   string;
}

export interface DocumentsListResponse {
  documents: VaultDocumentDto[];
  total:     number;
  stats: {
    byCategory: Record<string, number>;
    byStatus:   Record<string, number>;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDto(doc: {
  id: string;
  title: string;
  category: string;
  description: string | null;
  status: string;
  clientId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: bigint;
  storageKey: string;
  uploadedBy: string;
  version: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}): VaultDocumentDto {
  return {
    ...doc,
    sizeBytes: Number(doc.sizeBytes),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

const VALID_CATEGORIES: DocCategory[] = ["CONTRACT", "BRIEF", "DELIVERABLE", "INVOICE", "ASSET", "TEMPLATE", "MISC"];
const VALID_STATUSES:   DocStatus[]   = ["DRAFT", "PUBLISHED", "ARCHIVED"];

// ── Routes ────────────────────────────────────────────────────────────────────

export async function registerDocumentRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /admin/documents ──────────────────────────────────────────────────
  app.get("/admin/documents", async (request, reply) => {
    const scope    = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "ADMIN or STAFF role required" } } as ApiResponse;
    }

    const qs        = request.query as Record<string, string | undefined>;
    const category  = qs.category;
    const clientId  = qs.clientId;
    const status    = qs.status ?? "PUBLISHED";

    try {
      const where: Prisma.VaultDocumentWhereInput = {};
      if (category && category !== "ALL") where.category = category.toUpperCase();
      if (clientId) where.clientId = clientId;
      if (status   && status !== "ALL") where.status = status.toUpperCase();

      const documents = await prisma.vaultDocument.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      const all = await prisma.vaultDocument.findMany({
        select: { category: true, status: true },
      });

      const byCategory: Record<string, number> = {};
      const byStatus:   Record<string, number> = {};
      for (const d of all) {
        byCategory[d.category] = (byCategory[d.category] ?? 0) + 1;
        byStatus[d.status]     = (byStatus[d.status]     ?? 0) + 1;
      }

      const responseData: DocumentsListResponse = {
        documents: documents.map(toDto),
        total: all.length,
        stats: { byCategory, byStatus },
      };

      return {
        success: true,
        data: responseData,
        meta: { requestId: scope.requestId },
      } as ApiResponse<DocumentsListResponse>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "DOCUMENTS_FETCH_FAILED", message: "Unable to fetch documents" } } as ApiResponse;
    }
  });

  // ── POST /admin/documents ────────────────────────────────────────────────
  app.post("/admin/documents", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "ADMIN or STAFF role required" } } as ApiResponse;
    }

    const body = (request.body ?? {}) as {
      title?:       string;
      category?:    string;
      description?: string;
      status?:      string;
      clientId?:    string | null;
      fileName?:    string;
      mimeType?:    string;
      sizeBytes?:   number;
      storageKey?:  string;
      uploadedBy?:  string;
      tags?:        string[];
    };

    if (!body.title || !body.fileName || !body.storageKey || !body.mimeType) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "title, fileName, storageKey, and mimeType are required" } } as ApiResponse;
    }

    const category = (body.category?.toUpperCase() ?? "MISC") as DocCategory;
    const status   = (body.status?.toUpperCase()   ?? "PUBLISHED") as DocStatus;

    if (!VALID_CATEGORIES.includes(category)) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` } } as ApiResponse;
    }
    if (!VALID_STATUSES.includes(status)) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` } } as ApiResponse;
    }

    try {
      const doc = await prisma.vaultDocument.create({
        data: {
          title:       body.title,
          category,
          description: body.description ?? null,
          status,
          clientId:    body.clientId ?? null,
          fileName:    body.fileName,
          mimeType:    body.mimeType,
          sizeBytes:   BigInt(body.sizeBytes ?? 0),
          storageKey:  body.storageKey,
          uploadedBy:  body.uploadedBy ?? scope.userId ?? "admin",
          tags:        body.tags ?? [],
        },
      });

      reply.status(201);
      return {
        success: true,
        data: toDto(doc),
        meta: { requestId: scope.requestId },
      } as ApiResponse<VaultDocumentDto>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "DOCUMENT_CREATE_FAILED", message: "Unable to create document" } } as ApiResponse;
    }
  });

  // ── GET /admin/documents/export-index ─────────────────────────────────────
  // Must be registered BEFORE /:id to avoid route conflicts
  app.get("/admin/documents/export-index", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "ADMIN or STAFF role required" } } as ApiResponse;
    }

    try {
      const documents = await prisma.vaultDocument.findMany({
        where: { status: { not: "ARCHIVED" } },
        orderBy: { createdAt: "desc" },
      });

      const header = "ID,Title,Category,Status,Client ID,File Name,MIME Type,Size (bytes),Uploaded By,Tags,Created At";
      const rows = documents.map((d) =>
        [
          d.id,
          `"${d.title.replace(/"/g, '""')}"`,
          d.category,
          d.status,
          d.clientId ?? "",
          `"${d.fileName.replace(/"/g, '""')}"`,
          d.mimeType,
          Number(d.sizeBytes),
          d.uploadedBy,
          `"${d.tags.join("; ")}"`,
          d.createdAt.toISOString(),
        ].join(",")
      );

      const csv = [header, ...rows].join("\n");

      reply
        .header("content-type", "text/csv; charset=utf-8")
        .header("content-disposition", `attachment; filename="maphari-document-vault-index-${new Date().toISOString().slice(0, 10)}.csv"`);

      return reply.send(csv);
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "EXPORT_FAILED", message: "Unable to export document index" } } as ApiResponse;
    }
  });

  // ── PATCH /admin/documents/:id ───────────────────────────────────────────
  app.patch<{ Params: { id: string } }>("/admin/documents/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "ADMIN or STAFF role required" } } as ApiResponse;
    }

    const { id } = request.params;
    const body = (request.body ?? {}) as {
      title?:       string;
      category?:    string;
      description?: string;
      status?:      string;
      tags?:        string[];
    };

    try {
      const existing = await prisma.vaultDocument.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Document not found" } } as ApiResponse;
      }

      const updated = await prisma.vaultDocument.update({
        where: { id },
        data: {
          ...(body.title       !== undefined && { title:       body.title }),
          ...(body.category    !== undefined && { category:    body.category.toUpperCase() }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.status      !== undefined && { status:      body.status.toUpperCase() }),
          ...(body.tags        !== undefined && { tags:        body.tags }),
        },
      });

      return {
        success: true,
        data: toDto(updated),
        meta: { requestId: scope.requestId },
      } as ApiResponse<VaultDocumentDto>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "DOCUMENT_UPDATE_FAILED", message: "Unable to update document" } } as ApiResponse;
    }
  });

  // ── DELETE /admin/documents/:id ──────────────────────────────────────────
  // Soft-delete: sets status to ARCHIVED (ADMIN only)
  app.delete<{ Params: { id: string } }>("/admin/documents/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "ADMIN role required to archive documents" } } as ApiResponse;
    }

    const { id } = request.params;

    try {
      const existing = await prisma.vaultDocument.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Document not found" } } as ApiResponse;
      }

      await prisma.vaultDocument.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });

      return {
        success: true,
        data: { id, archived: true },
        meta: { requestId: scope.requestId },
      } as ApiResponse<{ id: string; archived: boolean }>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "DOCUMENT_ARCHIVE_FAILED", message: "Unable to archive document" } } as ApiResponse;
    }
  });
}
