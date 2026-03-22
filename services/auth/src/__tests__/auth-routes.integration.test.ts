import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { NatsEventBus } from "@maphari/platform";
import type { AuthConfig } from "../lib/config.js";

// ── Test fixtures ──────────────────────────────────────────────────────────────

const TEST_CONFIG: AuthConfig = {
  port: 4001,
  accessTokenSecret: "test-access-secret-that-is-long-enough",
  accessTokenTtlSeconds: 900,
  refreshTokenTtlDays: 7,
  refreshTokenSessionTtlHours: 24,
  natsUrl: "nats://localhost:4222",
  redisUrl: "redis://localhost:6379",
  adminEmails: ["admin@maphari.com"],
  staffEmails: [],
  adminPassword: "",
  staffPassword: "",
  authBootstrapLogs: false,
};

const mockEventBus = new NatsEventBus("nats://localhost:4222");

// Shared mock user shapes
function makeAdminUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-admin-001",
    email: "admin@maphari.com",
    role: "ADMIN",
    isActive: true,
    clientId: null,
    googleId: null,
    passwordHash: null,
    passwordSalt: null,
    otpCode: null,
    otpExpiresAt: null,
    otpVerifiedAt: null,
    totpSecret: null,
    totpEnabled: null,
    totpBackupCodes: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeClientUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-client-001",
    email: "client@example.com",
    role: "CLIENT",
    isActive: true,
    clientId: "client-id-001",
    googleId: null,
    passwordHash: null,
    passwordSalt: null,
    otpCode: null,
    otpExpiresAt: null,
    otpVerifiedAt: null,
    totpSecret: null,
    totpEnabled: null,
    totpBackupCodes: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe("auth routes integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(mockEventBus, "publish").mockResolvedValue();
  });

  // ── POST /auth/admin/register ────────────────────────────────────────────────

  describe("POST /auth/admin/register", () => {
    it("returns 400 for invalid payload (missing email)", async () => {
      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/admin/register",
        payload: { password: "somepassword123" },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json<{ success: boolean; error: { code: string } }>();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");

      await app.close();
    });

    it("returns 403 when email is not in adminEmails allowlist", async () => {
      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/admin/register",
        payload: { email: "notallowed@example.com", password: "SecurePass123!" },
      });

      expect(response.statusCode).toBe(403);
      const body = response.json<{ success: boolean; error: { code: string } }>();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("ADMIN_REGISTRATION_FORBIDDEN");

      await app.close();
    });

    it("returns 200 and publishes OTP notification for allowed email", async () => {
      const publishSpy = vi.spyOn(mockEventBus, "publish").mockResolvedValue();
      vi.spyOn(prisma.user, "upsert").mockResolvedValue(
        makeAdminUser({ isActive: false, otpCode: "123456" }) as never
      );

      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/admin/register",
        payload: { email: "admin@maphari.com", password: "SecurePass123!" },
        headers: {
          "x-request-id": "req-register-1",
          "x-trace-id": "trace-register-1",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ success: boolean; data: { email: string; otpRequired: boolean } }>();
      expect(body.success).toBe(true);
      expect(body.data.email).toBe("admin@maphari.com");
      expect(body.data.otpRequired).toBe(true);
      expect(publishSpy).toHaveBeenCalledOnce();
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: "req-register-1",
          traceId: "trace-register-1",
          payload: expect.objectContaining({
            channel: "EMAIL",
            recipientEmail: "admin@maphari.com",
          }),
        })
      );

      await app.close();
    });
  });

  // ── POST /auth/admin/verify ──────────────────────────────────────────────────

  describe("POST /auth/admin/verify", () => {
    it("returns 400 for invalid payload (missing otp)", async () => {
      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/admin/verify",
        payload: { email: "admin@maphari.com" },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("VALIDATION_ERROR");

      await app.close();
    });

    it("returns 404 when admin account not found", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/admin/verify",
        payload: { email: "admin@maphari.com", otp: "123456" },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("ADMIN_ACCOUNT_NOT_FOUND");

      await app.close();
    });

    it("returns 401 for wrong OTP", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(
        makeAdminUser({
          isActive: false,
          otpCode: "111111",
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }) as never
      );

      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/admin/verify",
        payload: { email: "admin@maphari.com", otp: "999999" },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("INVALID_ADMIN_OTP");

      await app.close();
    });

    it("returns 200 and activates account for correct OTP", async () => {
      const otp = "123456";
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(
        makeAdminUser({
          isActive: false,
          otpCode: otp,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }) as never
      );
      vi.spyOn(prisma.user, "update").mockResolvedValue(
        makeAdminUser({ isActive: true, otpCode: null, otpExpiresAt: null }) as never
      );

      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/admin/verify",
        payload: { email: "admin@maphari.com", otp },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ success: boolean; data: { email: string; role: string } }>();
      expect(body.success).toBe(true);
      expect(body.data.email).toBe("admin@maphari.com");
      expect(body.data.role).toBe("ADMIN");

      await app.close();
    });
  });

  // ── POST /auth/login ─────────────────────────────────────────────────────────

  describe("POST /auth/login", () => {
    it("returns 400 for invalid payload (missing email)", async () => {
      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { password: "somepassword" },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("VALIDATION_ERROR");

      await app.close();
    });

    it("returns 401 for unknown email (INVALID_CREDENTIALS — not UNKNOWN_USER)", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "ghost@example.com", password: "anything" },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json<{ error: { code: string } }>();
      // Email enumeration defence: must NOT expose whether the email exists
      expect(body.error.code).toBe("INVALID_CREDENTIALS");

      await app.close();
    });

    it("returns 403 for role mismatch (CLIENT trying to log in as ADMIN)", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(makeClientUser() as never);

      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "client@example.com", password: "anypasswd", role: "ADMIN" },
      });

      expect(response.statusCode).toBe(403);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("ROLE_MISMATCH");

      await app.close();
    });

    it("returns 200 with tokens for valid CLIENT login", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(makeClientUser() as never);
      vi.spyOn(prisma.refreshToken, "create").mockResolvedValue({
        id: "rt-001",
        tokenHash: "hashed",
        userId: "user-client-001",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        createdAt: new Date(),
      } as never);
      vi.spyOn(prisma.loginEvent, "create").mockResolvedValue({} as never);

      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "client@example.com", password: "clientpass" },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{
        success: boolean;
        data: { accessToken: string; refreshToken: string; user: { role: string } };
      }>();
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeTruthy();
      expect(body.data.refreshToken).toBeTruthy();
      expect(body.data.user.role).toBe("CLIENT");

      await app.close();
    });
  });

  // ── POST /auth/logout ────────────────────────────────────────────────────────

  describe("POST /auth/logout", () => {
    it("returns 200 with revoked:false when no refresh token supplied", async () => {
      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/logout",
        payload: {},
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ success: boolean; data: { revoked: boolean } }>();
      expect(body.success).toBe(true);
      expect(body.data.revoked).toBe(false);

      await app.close();
    });

    it("returns 200 with revoked:true when a valid refresh token is supplied", async () => {
      vi.spyOn(prisma.refreshToken, "updateMany").mockResolvedValue({ count: 1 });

      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/logout",
        payload: { refreshToken: "some-valid-looking-refresh-token-value" },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ success: boolean; data: { revoked: boolean } }>();
      expect(body.success).toBe(true);
      expect(body.data.revoked).toBe(true);

      await app.close();
    });
  });

  // ── POST /auth/admin/resend-otp ──────────────────────────────────────────────

  describe("POST /auth/admin/resend-otp", () => {
    it("returns 403 for non-allowlisted email", async () => {
      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/admin/resend-otp",
        payload: { email: "notallowed@example.com" },
      });

      expect(response.statusCode).toBe(403);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("ADMIN_REGISTRATION_FORBIDDEN");

      await app.close();
    });

    it("returns 409 when account is already active (already verified)", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(makeAdminUser({ isActive: true }) as never);

      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({
        method: "POST",
        url: "/auth/admin/resend-otp",
        payload: { email: "admin@maphari.com" },
      });

      expect(response.statusCode).toBe(409);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("ADMIN_ALREADY_VERIFIED");

      await app.close();
    });
  });

  // ── GET /health ──────────────────────────────────────────────────────────────

  describe("GET /health", () => {
    it("returns 200 with service status", async () => {
      const app = await createAuthApp(TEST_CONFIG, { eventBus: mockEventBus });

      const response = await app.inject({ method: "GET", url: "/health" });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ success: boolean; data: { service: string; status: string } }>();
      expect(body.success).toBe(true);
      expect(body.data.service).toBe("auth");
      expect(body.data.status).toBe("ok");

      await app.close();
    });
  });
});
