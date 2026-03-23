import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class VideoRoomsController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  private headers(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
    return {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? "",
    };
  }

  @Roles("ADMIN", "STAFF")
  @Post("video-rooms")
  async createRoom(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/video-rooms`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("CLIENT", "ADMIN", "STAFF")
  @Post("portal/video-rooms/instant")
  async createInstant(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/portal/video-rooms/instant`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN", "STAFF")
  @Get("video-rooms/:roomName/recordings")
  async getRecordings(
    @Param("roomName") roomName: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/video-rooms/${roomName}/recordings`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN", "STAFF")
  @Post("meetings/:id/transcribe")
  async transcribeMeeting(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/meetings/${id}/transcribe`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }
}
