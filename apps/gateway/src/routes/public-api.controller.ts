import { BadRequestException, Body, Controller, Get, Headers, Post } from "@nestjs/common";
import {
  publicApiKeyIssueSchema,
  publicApiProjectCreateSchema,
  type ApiResponse,
  type Role
} from "@maphari/contracts";
import { Public } from "../auth/public.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class PublicApiController {
  @Roles("ADMIN", "STAFF")
  @Post("public-api/keys")
  async issueKey(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = publicApiKeyIssueSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid public api key payload");
    }

    const baseUrl = process.env.PUBLIC_API_SERVICE_URL ?? "http://localhost:4010";
    return proxyRequest(`${baseUrl}/public-api/keys`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Get("public-api/keys")
  async listKeys(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.PUBLIC_API_SERVICE_URL ?? "http://localhost:4010";
    return proxyRequest(`${baseUrl}/public-api/keys`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Public()
  @Post("public-api/projects")
  async createPartnerProject(
    @Body() body: unknown,
    @Headers("x-api-key-id") apiKeyId?: string,
    @Headers("x-api-signature") apiSignature?: string
  ): Promise<ApiResponse> {
    const parsedBody = publicApiProjectCreateSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid public api project payload");
    }

    const baseUrl = process.env.PUBLIC_API_SERVICE_URL ?? "http://localhost:4010";
    return proxyRequest(`${baseUrl}/public-api/projects`, "POST", parsedBody.data, {
      "x-api-key-id": apiKeyId ?? "",
      "x-api-signature": apiSignature ?? ""
    });
  }

  @Public()
  @Get("public-api/projects")
  async listPartnerProjects(
    @Headers("x-api-key-id") apiKeyId?: string,
    @Headers("x-api-signature") apiSignature?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.PUBLIC_API_SERVICE_URL ?? "http://localhost:4010";
    return proxyRequest(`${baseUrl}/public-api/projects`, "GET", undefined, {
      "x-api-key-id": apiKeyId ?? "",
      "x-api-signature": apiSignature ?? ""
    });
  }
}
