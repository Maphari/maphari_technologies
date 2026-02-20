import type { FastifyInstance } from "fastify";
import { createFileSchema, type ApiResponse } from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import type { ServiceMetrics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys, eventBus } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { createUploadToken, verifyUploadToken } from "../lib/upload-token.js";
import { putObject, getObject } from "../lib/object-storage.js";

type FileRecordDto = {
  id: string;
  clientId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
};

function toFileRecordDto(fileRecord: Awaited<ReturnType<typeof prisma.fileRecord.create>>): FileRecordDto {
  return {
    ...fileRecord,
    sizeBytes: Number(fileRecord.sizeBytes)
  };
}

async function observeDb<T>(
  app: FastifyInstance,
  operation: string,
  query: () => Promise<T>
): Promise<T> {
  const metrics = (app as FastifyInstance & { serviceMetrics?: ServiceMetrics }).serviceMetrics;
  const startedAt = Date.now();
  const result = await query();
  metrics?.observe("db_query_duration_ms", Date.now() - startedAt, {
    service: "files",
    operation
  });
  return result;
}

export async function registerFileRoutes(app: FastifyInstance): Promise<void> {
  app.get("/files", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const whereClause = clientId ? { clientId } : {};
    const cacheKey = CacheKeys.files(clientId);

    try {
      const cached = await cache.getJson<FileRecordDto[]>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          meta: { requestId: scope.requestId, cache: "hit" }
        } as ApiResponse<typeof cached>;
      }

      const files = await observeDb(app, "fileRecord.findMany", () =>
        prisma.fileRecord.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" }
        })
      );
      const responseData = files.map(toFileRecordDto);

      // Cache file listings per tenant scope to reduce repeated metadata reads.
      await cache.setJson(cacheKey, responseData, 30);

      return {
        success: true,
        data: responseData,
        meta: { requestId: scope.requestId, cache: "miss" }
      } as ApiResponse<typeof responseData>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: {
          code: "FILES_FETCH_FAILED",
          message: "Unable to fetch files"
        }
      } as ApiResponse;
    }
  });

  app.post("/files", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createFileSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid file payload",
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

    try {
      const fileRecord = await observeDb(app, "fileRecord.create", () =>
        prisma.fileRecord.create({
          data: {
            clientId,
            fileName: parsedBody.data.fileName,
            storageKey: parsedBody.data.storageKey,
            mimeType: parsedBody.data.mimeType,
            sizeBytes: BigInt(parsedBody.data.sizeBytes)
          }
        })
      );

      await Promise.all([cache.delete(CacheKeys.files(clientId)), cache.delete(CacheKeys.files())]);

      const responseData = toFileRecordDto(fileRecord);

      // Emit upload event for async processing (indexing, notifications, compliance).
      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.fileUploaded,
        payload: {
          fileId: fileRecord.id,
          clientId: fileRecord.clientId,
          mimeType: fileRecord.mimeType,
          sizeBytes: Number(fileRecord.sizeBytes)
        }
      });

      return {
        success: true,
        data: responseData,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof responseData>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "FILE_CREATE_FAILED",
          message: "Unable to create file record"
        }
      } as ApiResponse;
    }
  });

  app.post("/files/inline", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = (request.body as {
      clientId?: string;
      fileName?: string;
      mimeType?: string;
      contentBase64?: string;
    } | undefined) ?? {};
    if (
      typeof body.fileName !== "string" ||
      typeof body.mimeType !== "string" ||
      typeof body.contentBase64 !== "string"
    ) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "fileName, mimeType, and contentBase64 are required"
        }
      } as ApiResponse;
    }
    const fileName = body.fileName;
    const mimeType = body.mimeType;
    const contentBase64 = body.contentBase64;
    const clientId = resolveClientFilter(scope.role, scope.clientId, body.clientId);
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

    const content = Buffer.from(contentBase64, "base64");
    const storageKey = `${clientId}-${Date.now()}-${fileName.toLowerCase().replace(/[^a-z0-9._-]/g, "-")}`;

    try {
      await putObject(storageKey, content);

      const fileRecord = await observeDb(app, "fileRecord.create", () =>
        prisma.fileRecord.create({
          data: {
            clientId,
            fileName,
            storageKey,
            mimeType,
            sizeBytes: BigInt(content.byteLength)
          }
        })
      );

      await Promise.all([cache.delete(CacheKeys.files(clientId)), cache.delete(CacheKeys.files())]);

      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.fileUploaded,
        payload: {
          fileId: fileRecord.id,
          clientId: fileRecord.clientId,
          mimeType: fileRecord.mimeType,
          sizeBytes: Number(fileRecord.sizeBytes)
        }
      });

      return {
        success: true,
        data: toFileRecordDto(fileRecord),
        meta: { requestId: scope.requestId }
      } as ApiResponse<FileRecordDto>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "FILE_INLINE_CREATE_FAILED",
          message: "Unable to create inline file"
        }
      } as ApiResponse;
    }
  });

  app.get<{ Params: { fileId: string } }>("/files/:fileId/download-url", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const fileRecord = await observeDb(app, "fileRecord.findFirst", () =>
        prisma.fileRecord.findFirst({
          where: {
            id: request.params.fileId,
            ...(clientId ? { clientId } : {})
          }
        })
      );
      if (!fileRecord) {
        reply.status(404);
        return {
          success: false,
          error: { code: "FILE_NOT_FOUND", message: "File not found in current scope" }
        } as ApiResponse;
      }

      const ttlSeconds = Number(process.env.DOWNLOAD_TOKEN_TTL_SECONDS ?? 900);
      const token = createUploadToken({
        clientId: fileRecord.clientId,
        storageKey: fileRecord.storageKey,
        ttlSeconds,
        secret: process.env.UPLOAD_TOKEN_SECRET ?? "maphari-upload-secret"
      });
      const baseUrl = process.env.DOWNLOAD_GET_BASE_URL ?? "http://localhost:4005/downloads";
      const downloadUrl = `${baseUrl}/${encodeURIComponent(fileRecord.storageKey)}?token=${encodeURIComponent(token)}`;

      return {
        success: true,
        data: {
          downloadUrl,
          fileName: fileRecord.fileName,
          mimeType: fileRecord.mimeType,
          expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString()
        },
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "FILE_DOWNLOAD_URL_FAILED", message: "Unable to issue file download URL" }
      } as ApiResponse;
    }
  });

  app.get<{ Params: { storageKey: string }; Querystring: { token?: string } }>("/downloads/:storageKey", async (request, reply) => {
    const token = request.query.token;
    if (!token) {
      reply.status(400);
      return {
        success: false,
        error: { code: "DOWNLOAD_TOKEN_REQUIRED", message: "Download token is required" }
      } as ApiResponse;
    }

    const storageKey = decodeURIComponent(request.params.storageKey);
    const tokenPayload = verifyUploadToken(token, process.env.UPLOAD_TOKEN_SECRET ?? "maphari-upload-secret");
    if (!tokenPayload || tokenPayload.storageKey !== storageKey) {
      reply.status(403);
      return {
        success: false,
        error: { code: "DOWNLOAD_TOKEN_INVALID", message: "Download token is invalid" }
      } as ApiResponse;
    }

    try {
      const [fileRecord, binary] = await Promise.all([
        prisma.fileRecord.findFirst({
          where: {
            clientId: tokenPayload.clientId,
            storageKey
          },
          orderBy: { createdAt: "desc" }
        }),
        getObject(storageKey)
      ]);
      if (!fileRecord || !binary) {
        reply.status(404);
        return {
          success: false,
          error: { code: "FILE_NOT_FOUND", message: "Stored file not found." }
        } as ApiResponse;
      }
      reply
        .header("content-type", fileRecord.mimeType || "application/octet-stream")
        .header("content-disposition", `attachment; filename="${fileRecord.fileName}"`);
      return reply.send(binary);
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "FILE_DOWNLOAD_FAILED", message: "Unable to download file." }
      } as ApiResponse;
    }
  });
}
