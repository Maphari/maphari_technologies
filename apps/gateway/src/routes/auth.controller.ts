import { BadRequestException, Body, Controller, Delete, Get, Headers, Post, Req, Res, Redirect } from "@nestjs/common";
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
import jwt from "jsonwebtoken";
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
import { blacklistJti } from "../auth/redis-blacklist.js";

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
    @Req() request: { headers: { cookie?: string } },
    @Res({ passthrough: true }) reply: { header: (name: string, value: unknown) => unknown },
    @Headers("authorization") authHeader?: string
  ): Promise<ApiResponse<{ loggedOut: boolean }>> {
    // ── 1. Blacklist the access token JTI in Redis ──────────────────────────
    // This immediately invalidates the short-lived access token even before
    // its natural expiry, so it cannot be used after the user logs out.
    if (authHeader) {
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (token) {
        try {
          const decoded = jwt.decode(token) as { jti?: string; exp?: number } | null;
          if (decoded?.jti && decoded?.exp) {
            await blacklistJti(decoded.jti, decoded.exp);
          }
        } catch {
          // Non-fatal — token may be malformed; cookie clearing still proceeds
        }
      }
    }

    // ── 2. Revoke the refresh token in the DB ───────────────────────────────
    // The refresh token is read from the HTTP-only cookie — client-side JS
    // never has direct access to it.
    const refreshToken = readCookie(request.headers.cookie, REFRESH_TOKEN_COOKIE) ?? "";

    if (refreshToken) {
      const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
      // Fire-and-forget: logout must always succeed for the user even if
      // the downstream revocation call has a transient failure.
      proxyRequest(`${baseUrl}/auth/logout`, "POST", { refreshToken }).catch(() => {
        // Swallow — cookies are still cleared, session is effectively ended
      });
    }

    // ── 3. Clear auth cookies ───────────────────────────────────────────────
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

  // ── GET /auth/admin/2fa/status ─────────────────────────────────────────────
  @Roles("ADMIN")
  @Get("admin/2fa/status")
  async get2faStatus(
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/admin/2fa/status`, "GET", undefined, {
      "x-user-role": role ?? "ADMIN",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /auth/admin/2fa/setup ─────────────────────────────────────────────
  @Roles("ADMIN")
  @Post("admin/2fa/setup")
  async setup2fa(
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/admin/2fa/setup`, "POST", undefined, {
      "x-user-role": role ?? "ADMIN",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /auth/admin/2fa/verify ────────────────────────────────────────────
  @Roles("ADMIN")
  @Post("admin/2fa/verify")
  async verify2fa(
    @Body() body: unknown,
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/admin/2fa/verify`, "POST", body, {
      "x-user-role": role ?? "ADMIN",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /auth/admin/2fa/disable ───────────────────────────────────────────
  @Roles("ADMIN")
  @Post("admin/2fa/disable")
  async disable2fa(
    @Body() body: unknown,
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/admin/2fa/disable`, "POST", body, {
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

  // ── POST /auth/2fa/login ───────────────────────────────────────────────────
  // Public — the user has no session yet; they are exchanging the short-lived
  // temp token (issued by POST /auth/login when TOTP is enabled) for a full
  // session by providing their authenticator code.
  @Public()
  @Post("2fa/login")
  async twoFactorLogin(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: { header: (name: string, value: unknown) => unknown },
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    const upstream = await proxyRequest<LoginResponseData>(`${baseUrl}/auth/2fa/login`, "POST", body as Record<string, unknown>, {
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });

    if (!upstream.success || !upstream.data) return upstream;

    setAuthCookies(
      reply,
      {
        refreshToken: upstream.data.refreshToken,
        role: upstream.data.user.role,
        rememberMe: true
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

  // ── POST /auth/admin/lockdown ──────────────────────────────────────────────
  // Emergency lockdown: terminates all active sessions platform-wide.
  // Admin-only; logs and alerts after execution.
  @Roles("ADMIN")
  @Post("admin/lockdown")
  async emergencyLockdown(
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/admin/lockdown`, "POST", undefined, {
      "x-user-role": role ?? "ADMIN",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /auth/password-reset/request ─────────────────────────────────────
  // Public — anyone can request a password reset link via their email address.
  @Public()
  @Post("password-reset/request")
  async requestPasswordReset(@Body() body: unknown): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/password-reset/request`, "POST", body as Record<string, unknown>);
  }

  // ── POST /auth/password-reset/confirm ─────────────────────────────────────
  // Public — validates the reset token and sets the new password.
  @Public()
  @Post("password-reset/confirm")
  async confirmPasswordReset(@Body() body: unknown): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/password-reset/confirm`, "POST", body as Record<string, unknown>);
  }

  // ── POST /auth/password-change ────────────────────────────────────────────
  // Authenticated: proxy to auth service to change the current user's password.
  @Post("password-change")
  async changePassword(
    @Body() body: unknown,
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/password-change`, "POST", body as Record<string, unknown>, {
      "x-user-role": role ?? "",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /auth/phone/send-otp ──────────────────────────────────────────────
  // Authenticated: requests a 6-digit OTP for phone verification.
  @Post("phone/send-otp")
  async sendPhoneOtp(
    @Body() body: unknown,
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/phone/send-otp`, "POST", body as Record<string, unknown>, {
      "x-user-role": role ?? "",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /auth/phone/verify-otp ────────────────────────────────────────────
  // Authenticated: verifies a phone OTP submitted by the current user.
  @Post("phone/verify-otp")
  async verifyPhoneOtp(
    @Body() body: unknown,
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/phone/verify-otp`, "POST", body as Record<string, unknown>, {
      "x-user-role": role ?? "",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /auth/google ───────────────────────────────────────────────────────
  // Initiates the Google OAuth 2.0 authorization code flow.
  // Redirects the browser to Google's consent screen.
  @Public()
  @Get("google")
  googleOAuthInitiate(
    @Res() reply: { redirect: (url: string) => void }
  ): void {
    const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/auth/google/callback";

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account"
    });

    reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  // ── POST /auth/google/exchange ─────────────────────────────────────────────
  // Accepts a Google authorization code from the frontend callback page,
  // proxies it to the auth service, sets HTTP-only cookies, returns session.
  @Public()
  @Post("google/exchange")
  async googleOAuthExchange(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: { header: (name: string, value: unknown) => unknown },
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/auth/google/callback";

    const code =
      typeof body === "object" &&
      body !== null &&
      "code" in body &&
      typeof (body as { code?: unknown }).code === "string"
        ? (body as { code: string }).code
        : "";

    if (!code) {
      throw new BadRequestException("Google authorization code is required");
    }

    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    const upstream = await proxyRequest<LoginResponseData>(`${baseUrl}/auth/google/exchange`, "POST", { code, redirectUri }, {
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });

    if (!upstream.success || !upstream.data) return upstream;

    setAuthCookies(
      reply,
      {
        refreshToken: upstream.data.refreshToken,
        role: upstream.data.user.role,
        rememberMe: true
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

  // ── GET /auth/me/sessions ──────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("me/sessions")
  async getMySessions(
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/me/sessions`, "GET", undefined, {
      "x-user-role": role ?? "",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── DELETE /auth/me/sessions ───────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Delete("me/sessions")
  async deleteAllSessions(
    @Headers("x-user-role") role?: Role,
    @Headers("x-user-id") userId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001";
    return proxyRequest(`${baseUrl}/auth/me/sessions`, "DELETE", undefined, {
      "x-user-role": role ?? "",
      "x-user-id": userId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
