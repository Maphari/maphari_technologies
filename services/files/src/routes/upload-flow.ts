import { confirmUploadSchema, issueUploadUrlSchema, type ApiResponse } from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import type { FastifyInstance } from "fastify";
import type { ServiceMetrics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys, eventBus } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { createUploadToken, verifyUploadToken } from "../lib/upload-token.js";
import { putObject } from "../lib/object-storage.js";

interface UploadUrlResponse {
  uploadUrl: string;
  uploadToken: string;
  storageKey: string;
  expiresAt: string;
}

function resolveUploadCorsOrigin(origin: string | undefined): string | null {
  if (!origin) return null;

  const allowList = (process.env.UPLOAD_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const isLocal = (process.env.NODE_ENV ?? "development") !== "production";

  if (allowList.includes(origin)) return origin;
  if (isLocal && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return origin;
  return null;
}

function sanitizeFileName(fileName: string): string {
  return fileName.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
}

function markerKey(clientId: string, storageKey: string, nonce: string): string {
  return `files:upload:marker:${clientId}:${storageKey}:${nonce}`;
}

function updateBacklogMetric(app: FastifyInstance, delta: number): void {
  const metrics = (app as FastifyInstance & { serviceMetrics?: ServiceMetrics }).serviceMetrics;
  if (!metrics) return;
  metrics.inc("files_upload_confirm_backlog", { service: "files" }, delta);
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

export async function registerUploadFlowRoutes(app: FastifyInstance): Promise<void> {
  app.options("/uploads/:storageKey", async (request, reply) => {
    const origin = request.headers.origin as string | undefined;
    const allowedOrigin = resolveUploadCorsOrigin(origin);
    if (origin && !allowedOrigin) {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "CORS_ORIGIN_DENIED",
          message: "Upload origin is not allowed"
        }
      } as ApiResponse;
    }

    if (allowedOrigin) {
      reply.header("access-control-allow-origin", allowedOrigin);
    }
    reply
      .header("access-control-allow-methods", "PUT,OPTIONS")
      .header("access-control-allow-headers", "content-type,authorization");
    reply.status(204);
    return null;
  });

  app.post("/files/upload-url", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = issueUploadUrlSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid upload-url payload",
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

    const storageKey = `${clientId}-${Date.now()}-${sanitizeFileName(parsedBody.data.fileName)}`;
    const uploadToken = createUploadToken({
      clientId,
      storageKey,
      ttlSeconds: Number(process.env.UPLOAD_TOKEN_TTL_SECONDS ?? 900),
      secret: process.env.UPLOAD_TOKEN_SECRET!
    });
    const tokenPayload = verifyUploadToken(uploadToken, process.env.UPLOAD_TOKEN_SECRET!);
    if (!tokenPayload) {
      reply.status(500);
      return {
        success: false,
        error: {
          code: "UPLOAD_TOKEN_CREATE_FAILED",
          message: "Unable to create upload token"
        }
      } as ApiResponse;
    }

    const uploadBaseUrl = process.env.UPLOAD_PUT_BASE_URL ?? "http://localhost:4005/uploads";
    const responseData: UploadUrlResponse = {
      uploadUrl: `${uploadBaseUrl}/${encodeURIComponent(storageKey)}?token=${encodeURIComponent(uploadToken)}`,
      uploadToken,
      storageKey,
      expiresAt: new Date(tokenPayload.expiresAt).toISOString()
    };
    updateBacklogMetric(app, 1);

    return {
      success: true,
      data: responseData,
      meta: { requestId: scope.requestId }
    } as ApiResponse<UploadUrlResponse>;
  });

  app.put<{ Params: { storageKey: string }; Querystring: { token?: string } }>("/uploads/:storageKey", async (request, reply) => {
    const origin = request.headers.origin as string | undefined;
    const allowedOrigin = resolveUploadCorsOrigin(origin);
    if (origin && !allowedOrigin) {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "CORS_ORIGIN_DENIED",
          message: "Upload origin is not allowed"
        }
      } as ApiResponse;
    }

    if (allowedOrigin) {
      reply.header("access-control-allow-origin", allowedOrigin);
    }
    reply.header("access-control-allow-methods", "PUT,OPTIONS").header("access-control-allow-headers", "content-type,authorization");

    const storageKey = decodeURIComponent(request.params.storageKey);
    const token = request.query.token;
    if (!token) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "UPLOAD_TOKEN_REQUIRED",
          message: "Upload token is required"
        }
      } as ApiResponse;
    }

    const tokenPayload = verifyUploadToken(token, process.env.UPLOAD_TOKEN_SECRET!);
    if (!tokenPayload || tokenPayload.storageKey !== storageKey) {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "UPLOAD_TOKEN_INVALID",
          message: "Upload token is invalid"
        }
      } as ApiResponse;
    }

    const payloadBuffer = Buffer.isBuffer(request.body)
      ? request.body
      : Buffer.from(
          typeof request.body === "string"
            ? request.body
            : JSON.stringify(request.body ?? ""),
          "utf8"
        );

    await putObject(storageKey, payloadBuffer);

    await cache.setJson(
      markerKey(tokenPayload.clientId, tokenPayload.storageKey, tokenPayload.nonce),
      { uploaded: true },
      Number(process.env.UPLOAD_TOKEN_TTL_SECONDS ?? 900)
    );
    reply.status(204);
    return null;
  });

  app.post("/files/confirm-upload", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = confirmUploadSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid confirm-upload payload",
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

    const tokenPayload = verifyUploadToken(parsedBody.data.uploadToken, process.env.UPLOAD_TOKEN_SECRET!);
    if (!tokenPayload || tokenPayload.storageKey !== parsedBody.data.storageKey || tokenPayload.clientId !== clientId) {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "UPLOAD_TOKEN_INVALID",
          message: "Upload token is invalid for this tenant or storage key"
        }
      } as ApiResponse;
    }

    const uploadedMarker = await cache.getJson<{ uploaded: boolean }>(
      markerKey(tokenPayload.clientId, tokenPayload.storageKey, tokenPayload.nonce)
    );
    if (!uploadedMarker?.uploaded) {
      reply.status(409);
      return {
        success: false,
        error: {
          code: "UPLOAD_NOT_CONFIRMED",
          message: "Upload content not found. Complete upload before confirming."
        }
      } as ApiResponse;
    }

    // Optional versioning fields — typed directly from the schema
    const versionOf = parsedBody.data.versionOf && parsedBody.data.versionOf.length > 0
      ? parsedBody.data.versionOf
      : undefined;
    const versionNote = parsedBody.data.versionNote && parsedBody.data.versionNote.length > 0
      ? parsedBody.data.versionNote
      : undefined;

    try {
      const fileRecord = await observeDb(app, "fileRecord.create", () =>
        prisma.fileRecord.create({
          data: {
            clientId,
            fileName: parsedBody.data.fileName,
            storageKey: parsedBody.data.storageKey,
            mimeType: parsedBody.data.mimeType,
            sizeBytes: BigInt(parsedBody.data.sizeBytes),
            ...(versionOf ? { versionOf } : {}),
            ...(versionNote ? { versionNote } : {})
          }
        })
      );

      await Promise.all([
        cache.delete(markerKey(tokenPayload.clientId, tokenPayload.storageKey, tokenPayload.nonce)),
        cache.delete(CacheKeys.files(clientId)),
        cache.delete(CacheKeys.files())
      ]);
      updateBacklogMetric(app, -1);

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
        data: {
          ...fileRecord,
          sizeBytes: Number(fileRecord.sizeBytes),
          approvalStatus: fileRecord.approvalStatus,
          versionOf: fileRecord.versionOf ?? null,
          versionNote: fileRecord.versionNote ?? null
        },
        meta: { requestId: scope.requestId }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "FILE_CONFIRM_FAILED",
          message: "Unable to confirm uploaded file"
        }
      } as ApiResponse;
    }
  });
}
