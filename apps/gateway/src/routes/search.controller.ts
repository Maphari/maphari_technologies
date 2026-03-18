import { Controller, Get, Headers, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class SearchController {
  /**
   * GET /search?q=<query>
   *
   * Cross-entity search across clients, projects, leads, tasks and tickets.
   * Proxied to the core service's /search endpoint.
   * Scoped by role: CLIENT users only see their own tenant's data.
   */
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("search")
  async search(
    @Query("q") q: string | undefined,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    const params = new URLSearchParams();
    if (q) params.set("q", q);

    return proxyRequest(`${baseUrl}/search?${params.toString()}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
