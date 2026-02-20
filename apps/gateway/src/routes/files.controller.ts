import { BadRequestException, Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import {
  confirmUploadSchema,
  createFileSchema,
  issueUploadUrlSchema,
  type ApiResponse,
  type Role
} from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class FilesController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("files")
  async listFiles(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.FILES_SERVICE_URL ?? "http://localhost:4005";
    return proxyRequest(`${baseUrl}/files`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("files")
  async createFile(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createFileSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid file payload");
    }

    const baseUrl = process.env.FILES_SERVICE_URL ?? "http://localhost:4005";
    return proxyRequest(`${baseUrl}/files`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("files/upload-url")
  async issueUploadUrl(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = issueUploadUrlSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid upload-url payload");
    }

    const baseUrl = process.env.FILES_SERVICE_URL ?? "http://localhost:4005";
    return proxyRequest(`${baseUrl}/files/upload-url`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("files/confirm-upload")
  async confirmUpload(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = confirmUploadSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid confirm-upload payload");
    }

    const baseUrl = process.env.FILES_SERVICE_URL ?? "http://localhost:4005";
    return proxyRequest(`${baseUrl}/files/confirm-upload`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("files/inline")
  async createInlineFile(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const payload = (body as { clientId?: string; fileName?: string; mimeType?: string; contentBase64?: string } | undefined) ?? {};
    if (!payload.fileName || !payload.mimeType || !payload.contentBase64) {
      throw new BadRequestException("Invalid inline file payload");
    }
    const baseUrl = process.env.FILES_SERVICE_URL ?? "http://localhost:4005";
    return proxyRequest(`${baseUrl}/files/inline`, "POST", payload, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("files/:fileId/download-url")
  async issueDownloadUrl(
    @Param("fileId") fileId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.FILES_SERVICE_URL ?? "http://localhost:4005";
    return proxyRequest(`${baseUrl}/files/${fileId}/download-url`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
