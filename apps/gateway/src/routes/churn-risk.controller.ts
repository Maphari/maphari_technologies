import { Controller, Get, Headers, Param } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class ChurnRiskController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  private headers(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
    return {
      "x-user-id":    userId     ?? "",
      "x-user-role":  role       ?? "ADMIN",
      "x-client-id":  clientId   ?? "",
      "x-request-id": requestId  ?? "",
      "x-trace-id":   traceId    ?? requestId ?? "",
    };
  }

  @Roles("ADMIN", "STAFF")
  @Get("clients/:id/churn-risk")
  async getChurnRisk(
    @Param("id") id: string,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${this.baseUrl}/clients/${id}/churn-risk`,
      "GET",
      undefined,
      this.headers(userId, role, clientId, requestId, traceId),
    );
  }
}
