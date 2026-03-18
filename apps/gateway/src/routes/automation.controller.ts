import { Body, Controller, Get, Post, Req, Query, Headers } from "@nestjs/common";
import { type ApiResponse, type Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

const AUTOMATION = () => process.env.AUTOMATION_SERVICE_URL ?? "http://localhost:4003";

@Controller()
export class AutomationController {
  @Roles("ADMIN", "STAFF")
  @Get("automation/jobs")
  async listJobs(
    @Query("limit") limit?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string
  ): Promise<ApiResponse> {
    const query = limit ? `?limit=${limit}` : "";
    return proxyRequest(`${AUTOMATION()}/automation/jobs${query}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-request-id": requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Get("automation/dead-letters")
  async listDeadLetters(
    @Query("limit") limit?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string
  ): Promise<ApiResponse> {
    const query = limit ? `?limit=${limit}` : "";
    return proxyRequest(`${AUTOMATION()}/automation/dead-letters${query}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-request-id": requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("automation/jobs/acknowledge")
  async acknowledgeFailures(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${AUTOMATION()}/automation/jobs/acknowledge`, "POST", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-request-id": requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("automation/jobs/retry-failed")
  async retryFailed(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${AUTOMATION()}/automation/jobs/retry-failed`, "POST", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-request-id": requestId ?? ""
    });
  }

  @Roles("ADMIN")
  @Post("automation/simulate")
  async simulate(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${AUTOMATION()}/automation/simulate`, "POST", body, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-request-id": requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("automation/jobs")
  async createAutomationJob(
    @Body() body: Record<string, unknown>,
    @Req() req: { url?: string; headers: Record<string, string | string[] | undefined> },
  ): Promise<unknown> {
    const query = req.url?.split("?")[1] ? `?${req.url.split("?")[1]}` : "";
    return proxyRequest(`${AUTOMATION()}/automation/jobs${query}`, "POST", body, {
      "x-user-role": req.headers["x-user-role"] as string ?? "",
      "x-user-id": req.headers["x-user-id"] as string ?? "",
      "x-request-id": req.headers["x-request-id"] as string ?? "",
    });
  }
}
