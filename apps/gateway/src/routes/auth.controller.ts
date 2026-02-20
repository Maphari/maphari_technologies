import { BadRequestException, Body, Controller, Get, Headers, Post, Req, Res } from "@nestjs/common";
import {
  approveStaffRequestSchema,
  loginSchema,
  provisionClientAccessSchema,
  registerAdminSchema,
  resendAdminOtpSchema,
  registerStaffSchema,
  revokeStaffAccessSchema,
  verifyAdminOtpSchema,
  verifyStaffPinSchema,
  type ApiResponse,
  type Role
} from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Public } from "../auth/public.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import {
  clearAuthCookies,
  readCookie,
  REMEMBER_ME_COOKIE,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from "../auth/auth-cookies.js";

interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: {
    id: string;
    email: string;
    role: Role;
    clientId: string | null;
  };
}

interface RefreshResponseData {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: {
    id: string;
    email: string;
    role: Role;
    clientId: string | null;
  };
}

interface StaffAccessRequestRow {
  id: string;
  email: string;
  pin: string;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  expiresAt: string;
  verifiedAt: string | null;
  revokedAt: string | null;
  userId: string | null;
}

interface StaffUserRow {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientAccessProvisionRow {
  userId: string;
  email: string;
  role: string;
  clientId: string | null;
  invited: boolean;
}

@Controller("auth")
export class AuthController {
  @Public()
  @Post("admin/register")
  async registerAdmin(
    @Body() body: unknown,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = registerAdminSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid admin registration payload");
    }

    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/admin/register`, "POST", parsedBody.data, {
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Public()
  @Post("staff/register")
  async registerStaff(
    @Body() body: unknown,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = registerStaffSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid staff registration payload");
    }

    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/staff/register`, "POST", parsedBody.data, {
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Public()
  @Post("staff/verify")
  async verifyStaffPin(
    @Body() body: unknown,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = verifyStaffPinSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid staff verification payload");
    }

    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/staff/verify`, "POST", parsedBody.data, {
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Public()
  @Post("admin/verify")
  async verifyAdminOtp(
    @Body() body: unknown,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = verifyAdminOtpSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid admin verification payload");
    }

    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/admin/verify`, "POST", parsedBody.data, {
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Public()
  @Post("admin/resend-otp")
  async resendAdminOtp(
    @Body() body: unknown,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = resendAdminOtpSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid resend admin OTP payload");
    }

    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/admin/resend-otp`, "POST", parsedBody.data, {
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Public()
  @Post("login")
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: { header: (name: string, value: unknown) => unknown },
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = loginSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid login payload");
    }

    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    const upstream = await proxyRequest<LoginResponseData>(`${baseUrl}/auth/login`, "POST", parsedBody.data, {
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });

    if (!upstream.success || !upstream.data) return upstream;

    setAuthCookies(
      reply,
      {
        refreshToken: upstream.data.refreshToken,
        role: upstream.data.user.role,
        rememberMe: parsedBody.data.rememberMe
      },
      process.env
    );

    return {
      ...upstream,
      data: {
        accessToken: upstream.data.accessToken,
        expiresInSeconds: upstream.data.expiresInSeconds,
        user: upstream.data.user
      }
    };
  }

  @Public()
  @Post("refresh")
  async refresh(
    @Body() body: unknown,
    @Req() request: { headers: { cookie?: string } },
    @Res({ passthrough: true }) reply: { header: (name: string, value: unknown) => unknown },
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const tokenFromBody =
      typeof body === "object" &&
      body !== null &&
      "refreshToken" in body &&
      typeof (body as { refreshToken?: unknown }).refreshToken === "string"
        ? (body as { refreshToken: string }).refreshToken.trim()
        : "";
    const tokenFromCookie = readCookie(request.headers.cookie, REFRESH_TOKEN_COOKIE) ?? "";
    const rememberFromCookie = readCookie(request.headers.cookie, REMEMBER_ME_COOKIE);
    const refreshToken = tokenFromBody || tokenFromCookie;
    const rememberMe = rememberFromCookie === "0" ? false : true;
    if (!refreshToken) throw new BadRequestException("Invalid refresh payload");

    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    const upstream = await proxyRequest<RefreshResponseData>(`${baseUrl}/auth/refresh`, "POST", { refreshToken }, {
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });

    if (!upstream.success || !upstream.data) {
      // Do not clear cookies here. Parallel refresh requests can race:
      // one request may rotate tokens successfully while another fails
      // with the now-stale refresh token. Clearing would log users out.
      return upstream;
    }

    setAuthCookies(
      reply,
      {
        refreshToken: upstream.data.refreshToken,
        role: upstream.data.user.role,
        rememberMe
      },
      process.env
    );

    return {
      ...upstream,
      data: {
        accessToken: upstream.data.accessToken,
        expiresInSeconds: upstream.data.expiresInSeconds,
        user: upstream.data.user
      }
    };
  }

  @Public()
  @Post("logout")
  async logout(
    @Res({ passthrough: true }) reply: { header: (name: string, value: unknown) => unknown }
  ): Promise<ApiResponse<{ loggedOut: boolean }>> {
    clearAuthCookies(reply, process.env);
    return {
      success: true,
      data: { loggedOut: true }
    };
  }

  @Roles("ADMIN")
  @Get("staff/requests")
  async listStaffRequests(
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse<StaffAccessRequestRow[]>> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest<StaffAccessRequestRow[]>(`${baseUrl}/auth/staff/requests`, "GET", undefined, {
      "x-user-role": role ?? "ADMIN",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN")
  @Post("staff/requests/approve")
  async approveStaffRequest(
    @Body() body: unknown,
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = approveStaffRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid approve payload");
    }

    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/staff/requests/approve`, "POST", parsedBody.data, {
      "x-user-role": role ?? "ADMIN",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN")
  @Get("staff/users")
  async listStaffUsers(
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse<StaffUserRow[]>> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest<StaffUserRow[]>(`${baseUrl}/auth/staff/users`, "GET", undefined, {
      "x-user-role": role ?? "ADMIN",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN")
  @Post("staff/users/revoke")
  async revokeStaffUser(
    @Body() body: unknown,
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = revokeStaffAccessSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid revoke payload");
    }

    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/staff/users/revoke`, "POST", parsedBody.data, {
      "x-user-role": role ?? "ADMIN",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("client/provision")
  async provisionClientAccess(
    @Body() body: unknown,
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse<ClientAccessProvisionRow>> {
    const parsedBody = provisionClientAccessSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid client access provisioning payload");
    }

    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest<ClientAccessProvisionRow>(`${baseUrl}/auth/client/provision`, "POST", parsedBody.data, {
      "x-user-role": role ?? "ADMIN",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
