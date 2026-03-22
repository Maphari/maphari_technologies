import type { FastifyInstance } from "fastify";
import type { ApiResponse, Role } from "@maphari/contracts";
import {
  approveStaffRequestSchema,
  loginSchema,
  provisionClientAccessSchema,
  refreshSchema,
  registerAdminSchema,
  resendAdminOtpSchema,
  registerStaffSchema,
  revokeStaffAccessSchema,
  verifyAdminOtpSchema,
  verifyStaffPinSchema
} from "@maphari/contracts";
import { EventTopics, type NatsEventBus } from "@maphari/platform";
import { createHash, randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import {
  buildTotpUri,
  generateBackupCodes,
  generateQrDataUrl,
  generateTotpSecret,
  verifyTotpCode,
} from "../lib/totp.js";
import { prisma } from "../lib/prisma.js";
import { buildRefreshToken, buildRefreshTokenWithHours, hashRefreshToken, signAccessToken, signTempToken, verifyTempToken } from "../lib/tokens.js";
import type { AuthConfig } from "../lib/config.js";
import { RedisCache } from "@maphari/platform";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginRateLimit,
  checkTotpRateLimit,
  recordTotpFailure,
  resetTotpRateLimit,
} from "../lib/rate-limit.js";

interface AuthRouteDependencies {
  eventBus: NatsEventBus;
}

function normalizeRequestedRole(value?: Role): Role | null {
  if (!value) return null;
  if (value === "ADMIN" || value === "STAFF" || value === "CLIENT") return value;
  return null;
}

function generatePin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const effectiveSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, effectiveSalt, 64).toString("hex");
  return { hash, salt: effectiveSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");
  if (computed.length !== stored.length) return false;
  return timingSafeEqual(computed, stored);
}

// ── OTP comparison using constant-time equality to prevent timing attacks ─────
function otpMatches(stored: string, input: string): boolean {
  const storedBuf = Buffer.from(stored);
  const inputBuf  = Buffer.from(input);
  // Lengths must match; timingSafeEqual requires equal-length buffers.
  if (storedBuf.length !== inputBuf.length) return false;
  return timingSafeEqual(storedBuf, inputBuf);
}

async function publishOtpNotification(
  deps: AuthRouteDependencies,
  requestHeaders: Record<string, unknown>,
  email: string,
  otp: string
): Promise<void> {
  await deps.eventBus.publish({
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    requestId: (requestHeaders["x-request-id"] as string | undefined) ?? undefined,
    traceId: (requestHeaders["x-trace-id"] as string | undefined) ?? undefined,
    topic: EventTopics.notificationRequested,
    payload: {
      channel: "EMAIL",
      recipientEmail: email,
      message: `Your Maphari admin verification OTP is ${otp}. It expires in 15 minutes.`
    }
  });
}

function hasExpired(value: Date): boolean {
  return value.getTime() <= Date.now();
}

function extractHeaderValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function currentActor(request: {
  headers: Record<string, unknown>;
}): { role: Role | null; userId: string | null } {
  const roleValue = extractHeaderValue(request.headers["x-user-role"]);
  const userId = extractHeaderValue(request.headers["x-user-id"]);
  const role = roleValue === "ADMIN" || roleValue === "STAFF" || roleValue === "CLIENT" ? roleValue : null;
  return { role, userId };
}

function ensureAdmin(request: { headers: Record<string, unknown> }, reply: { status: (code: number) => unknown }): boolean {
  const actor = currentActor(request);
  if (actor.role !== "ADMIN") {
    reply.status(403);
    return false;
  }
  return true;
}

function ensureStaff(request: { headers: Record<string, unknown> }, reply: { status: (code: number) => { send: (body: unknown) => void } }): boolean {
  const actor = currentActor(request);
  if (actor.role !== "STAFF") {
    reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Staff access required." } } as ApiResponse);
    return false;
  }
  return true;
}

// ── Phone OTP store ───────────────────────────────────────────────────────────
// In-memory map keyed by userId.  Expires after 10 minutes.
// Swap for Redis on multi-instance deployments.
const pendingPhoneOtps = new Map<string, { phone: string; code: string; expiresAt: number }>();

export async function registerAuthRoutes(
  app: FastifyInstance,
  config: AuthConfig,
  deps: AuthRouteDependencies
): Promise<void> {

  // ── Redis client for rate limiting ────────────────────────────────────────
  const redis = new RedisCache(config.redisUrl, console);

  // ── POST /auth/logout ─────────────────────────────────────────────────────
  // Revokes the supplied refresh token in the database so it cannot be used
  // to obtain a new access token.  The gateway reads the token from the
  // HTTP-only cookie and forwards it here in the request body.
  app.post("/auth/logout", async (request, reply) => {
    const body = request.body as Record<string, unknown> | null;
    const refreshToken =
      typeof body?.refreshToken === "string" ? body.refreshToken.trim() : "";

    if (!refreshToken) {
      // Nothing to revoke — still return 200 (idempotent logout)
      return { success: true, data: { revoked: false } } as ApiResponse;
    }

    try {
      const tokenHash = hashRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash,
          revokedAt: null
        },
        data: { revokedAt: new Date() }
      });
      return { success: true, data: { revoked: true } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "LOGOUT_FAILED", message: "Unable to revoke session" }
      } as ApiResponse;
    }
  });
  app.post("/auth/admin/register", async (request, reply) => {
    const parsed = registerAdminSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid admin registration payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const email = parsed.data.email;
    const password = parsed.data.password;
    if (!config.adminEmails.includes(email)) {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "ADMIN_REGISTRATION_FORBIDDEN",
          message: "Admin registration is restricted."
        }
      } as ApiResponse;
    }

    const otp = generatePin();
    const otpExpiresAt = new Date(Date.now() + 1000 * 60 * 15);
    const passwordCredentials = hashPassword(password);

    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          role: "ADMIN",
          isActive: false,
          passwordHash: passwordCredentials.hash,
          passwordSalt: passwordCredentials.salt,
          otpCode: otp,
          otpExpiresAt,
          otpVerifiedAt: null
        },
        create: {
          email,
          role: "ADMIN",
          isActive: false,
          passwordHash: passwordCredentials.hash,
          passwordSalt: passwordCredentials.salt,
          otpCode: otp,
          otpExpiresAt
        }
      });

      await publishOtpNotification(deps, request.headers, email, otp);
      // DEV ONLY — remove before production
      console.log(`\n[DEV] Admin OTP for ${email}: ${otp}\n`);
      request.log.debug({ userId: user.id }, "Admin OTP issued (check email)");

      return {
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          otpRequired: true,
          otpExpiresAt: otpExpiresAt.toISOString()
        }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "ADMIN_REGISTRATION_FAILED",
          message: "Unable to register admin account"
        }
      } as ApiResponse;
    }
  });

  app.post("/auth/admin/verify", async (request, reply) => {
    const parsed = verifyAdminOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid admin verification payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    try {
      const existing = await prisma.user.findUnique({
        where: { email: parsed.data.email }
      });

      if (!existing || existing.role !== "ADMIN") {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "ADMIN_ACCOUNT_NOT_FOUND",
            message: "Admin account not found."
          }
        } as ApiResponse;
      }

      if (!existing.otpCode || !existing.otpExpiresAt) {
        reply.status(409);
        return {
          success: false,
          error: {
            code: "ADMIN_OTP_NOT_REQUESTED",
            message: "No pending OTP verification for this account."
          }
        } as ApiResponse;
      }

      if (hasExpired(existing.otpExpiresAt)) {
        reply.status(410);
        return {
          success: false,
          error: {
            code: "ADMIN_OTP_EXPIRED",
            message: "OTP has expired. Register again to get a new code."
          }
        } as ApiResponse;
      }

      if (!otpMatches(existing.otpCode, parsed.data.otp)) {
        reply.status(401);
        return {
          success: false,
          error: {
            code: "INVALID_ADMIN_OTP",
            message: "Invalid OTP."
          }
        } as ApiResponse;
      }

      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          otpCode: null,
          otpExpiresAt: null,
          otpVerifiedAt: new Date()
        }
      });

      return {
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          role: user.role
        }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "ADMIN_VERIFY_FAILED",
          message: "Unable to verify admin OTP"
        }
      } as ApiResponse;
    }
  });

  app.post("/auth/admin/resend-otp", async (request, reply) => {
    const parsed = resendAdminOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid resend OTP payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const email = parsed.data.email;
    if (!config.adminEmails.includes(email)) {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "ADMIN_REGISTRATION_FORBIDDEN",
          message: "Admin registration is restricted."
        }
      } as ApiResponse;
    }

    try {
      const existing = await prisma.user.findUnique({
        where: { email }
      });

      if (!existing || existing.role !== "ADMIN") {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "ADMIN_ACCOUNT_NOT_FOUND",
            message: "Admin account not found. Register first."
          }
        } as ApiResponse;
      }

      if (existing.isActive) {
        reply.status(409);
        return {
          success: false,
          error: {
            code: "ADMIN_ALREADY_VERIFIED",
            message: "Admin account is already verified."
          }
        } as ApiResponse;
      }

      const otp = generatePin();
      const otpExpiresAt = new Date(Date.now() + 1000 * 60 * 15);
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          otpCode: otp,
          otpExpiresAt
        }
      });

      await publishOtpNotification(deps, request.headers, email, otp);
      request.log.debug({ email }, "Admin OTP resent (check email)");

      return {
        success: true,
        data: {
          email,
          otpRequired: true,
          otpExpiresAt: otpExpiresAt.toISOString()
        }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "ADMIN_OTP_RESEND_FAILED",
          message: "Unable to resend admin OTP"
        }
      } as ApiResponse;
    }
  });

  app.post("/auth/staff/register", async (request, reply) => {
    const parsed = registerStaffSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid staff registration payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const email = parsed.data.email;
    const passwordCredentials = hashPassword(parsed.data.password);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const plainPin = generatePin();
    const pinCredentials = hashPassword(plainPin);
    const pin = `${pinCredentials.hash}:${pinCredentials.salt}`;

    // DEV ONLY — remove before going to production
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Staff register OTP/PIN for ${email}: ${plainPin}`);
    }

    try {
      const requestRecord = await prisma.staffAccessRequest.upsert({
        where: { email },
        update: {
          pin,
          passwordHash: passwordCredentials.hash,
          passwordSalt: passwordCredentials.salt,
          status: "PENDING_ADMIN",
          requestedAt: new Date(),
          approvedAt: null,
          approvedByUserId: null,
          verifiedAt: null,
          revokedAt: null,
          expiresAt,
          userId: null
        },
        create: {
          email,
          pin,
          passwordHash: passwordCredentials.hash,
          passwordSalt: passwordCredentials.salt,
          status: "PENDING_ADMIN",
          expiresAt
        }
      });

      await deps.eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.notificationRequested,
        payload: {
          channel: "IN_APP",
          recipientRole: "ADMIN",
          message: `New staff registration request from ${email} is pending your approval. Review it in the admin dashboard.`
        }
      });

      return {
        success: true,
        data: {
          requestId: requestRecord.id,
          status: requestRecord.status,
          expiresAt: requestRecord.expiresAt.toISOString()
        }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "STAFF_REGISTRATION_FAILED",
          message: "Unable to create staff registration request"
        }
      } as ApiResponse;
    }
  });

  app.post("/auth/staff/verify", async (request, reply) => {
    const parsed = verifyStaffPinSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid verification payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    try {
      const requestRecord = await prisma.staffAccessRequest.findUnique({
        where: { email: parsed.data.email }
      });

      if (!requestRecord) {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "STAFF_REQUEST_NOT_FOUND",
            message: "No staff request found for this email."
          }
        } as ApiResponse;
      }

      if (requestRecord.status !== "APPROVED") {
        reply.status(409);
        return {
          success: false,
          error: {
            code: "STAFF_REQUEST_NOT_APPROVED",
            message: "Request is not approved by admin yet."
          }
        } as ApiResponse;
      }

      if (hasExpired(requestRecord.expiresAt)) {
        await prisma.staffAccessRequest.update({
          where: { id: requestRecord.id },
          data: { status: "EXPIRED" }
        });
        reply.status(410);
        return {
          success: false,
          error: {
            code: "STAFF_REQUEST_EXPIRED",
            message: "Verification PIN has expired."
          }
        } as ApiResponse;
      }

      // Verify hashed PIN
      const [pinHash, pinSalt] = requestRecord.pin ? requestRecord.pin.split(":") : ["", ""];
      const pinValid = pinHash && pinSalt ? verifyPassword(parsed.data.pin, pinHash, pinSalt) : false;
      if (!pinValid) {
        reply.status(401);
        return {
          success: false,
          error: {
            code: "INVALID_VERIFICATION_PIN",
            message: "Invalid verification PIN."
          }
        } as ApiResponse;
      }

      const user = await prisma.user.upsert({
        where: { email: parsed.data.email },
        update: {
          role: "STAFF",
          isActive: true,
          clientId: null,
          passwordHash: requestRecord.passwordHash ?? undefined,
          passwordSalt: requestRecord.passwordSalt ?? undefined
        },
        create: {
          email: parsed.data.email,
          role: "STAFF",
          isActive: true,
          passwordHash: requestRecord.passwordHash ?? null,
          passwordSalt: requestRecord.passwordSalt ?? null
        }
      });

      await prisma.staffAccessRequest.update({
        where: { id: requestRecord.id },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          userId: user.id
        }
      });

      return {
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          role: user.role
        }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "STAFF_VERIFY_FAILED",
          message: "Unable to verify staff PIN"
        }
      } as ApiResponse;
    }
  });

  app.get("/auth/staff/requests", async (request, reply) => {
    if (!ensureAdmin(request, reply)) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin role required."
        }
      } as ApiResponse;
    }

    const rows = await prisma.staffAccessRequest.findMany({
      orderBy: { requestedAt: "desc" }
    });

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        email: row.email,
        pin: null,
        status: row.status,
        requestedAt: row.requestedAt.toISOString(),
        approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
        expiresAt: row.expiresAt.toISOString(),
        verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : null,
        revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
        userId: row.userId
      }))
    } as ApiResponse;
  });

  app.post("/auth/staff/requests/approve", async (request, reply) => {
    if (!ensureAdmin(request, reply)) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin role required."
        }
      } as ApiResponse;
    }

    const parsed = approveStaffRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid approve payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const actor = currentActor(request);
    const existing = await prisma.staffAccessRequest.findUnique({ where: { id: parsed.data.requestId } });
    if (!existing) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: "STAFF_REQUEST_NOT_FOUND",
          message: "Staff request not found."
        }
      } as ApiResponse;
    }

    const updated = await prisma.staffAccessRequest.update({
      where: { id: existing.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByUserId: actor.userId
      }
    });

    return {
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        status: updated.status,
        approvedAt: updated.approvedAt?.toISOString() ?? null
      }
    } as ApiResponse;
  });

  app.get("/auth/staff/users", async (request, reply) => {
    if (!ensureAdmin(request, reply)) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin role required."
        }
      } as ApiResponse;
    }

    const users = await prisma.user.findMany({
      where: { role: "STAFF" },
      orderBy: { createdAt: "desc" }
    });

    return {
      success: true,
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }))
    } as ApiResponse;
  });

  app.post("/auth/staff/users/revoke", async (request, reply) => {
    if (!ensureAdmin(request, reply)) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin role required."
        }
      } as ApiResponse;
    }

    const parsed = revokeStaffAccessSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid revoke payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const existingUser = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
    if (!existingUser || existingUser.role !== "STAFF") {
      reply.status(404);
      return {
        success: false,
        error: {
          code: "STAFF_USER_NOT_FOUND",
          message: "Staff user not found."
        }
      } as ApiResponse;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: existingUser.id },
        data: { isActive: false }
      }),
      prisma.refreshToken.updateMany({
        where: {
          userId: existingUser.id,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      }),
      prisma.staffAccessRequest.updateMany({
        where: {
          userId: existingUser.id,
          status: {
            in: ["APPROVED", "VERIFIED"]
          }
        },
        data: {
          status: "REVOKED",
          revokedAt: new Date()
        }
      })
    ]);

    return {
      success: true,
      data: {
        userId: existingUser.id,
        revoked: true
      }
    } as ApiResponse;
  });

  app.post("/auth/client/provision", async (request, reply) => {
    const actor = currentActor(request);
    if (actor.role !== "ADMIN") {
      reply.status(403);
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin role required."
        }
      } as ApiResponse;
    }

    const parsed = provisionClientAccessSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid client access provisioning payload",
          details: parsed.error.flatten()
        }
      } as ApiResponse;
    }

    const { email, clientId, clientName } = parsed.data;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.role !== "CLIENT") {
        reply.status(409);
        return {
          success: false,
          error: {
            code: "CLIENT_ACCESS_CONFLICT",
            message: "Email is already used by a non-client account."
          }
        } as ApiResponse;
      }

      const user = await prisma.user.upsert({
        where: { email },
        update: {
          role: "CLIENT",
          clientId,
          isActive: true,
          passwordHash: null,
          passwordSalt: null
        },
        create: {
          email,
          role: "CLIENT",
          clientId,
          isActive: true
        }
      });

      await deps.eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.notificationRequested,
        payload: {
          channel: "EMAIL",
          recipientEmail: email,
          message: `Your Maphari client portal is ready${clientName ? ` for ${clientName}` : ""}. Sign in with your email to access your dashboard.`
        }
      });

      return {
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          clientId: user.clientId,
          invited: true
        }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "CLIENT_ACCESS_PROVISION_FAILED",
          message: "Unable to provision client access"
        }
      } as ApiResponse;
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const parsedBody = loginSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid login payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    try {
      const email = parsedBody.data.email;
      const requestedRole = normalizeRequestedRole(parsedBody.data.role);
      const password = parsedBody.data.password ?? "";

      // S10 — Server-side login rate limiting keyed to email:ip.
      const loginEmail = email.toLowerCase();
      const loginIp = request.ip ?? "unknown";
      const loginRateCheck = await checkLoginRateLimit(redis, loginEmail, loginIp);
      if (!loginRateCheck.allowed) {
        const retryAfterSec = Math.ceil((loginRateCheck.resetAt - Date.now()) / 1000);
        reply.status(429).header("Retry-After", String(retryAfterSec));
        return {
          success: false,
          error: {
            code: "LOGIN_RATE_LIMITED",
            message: "Too many failed login attempts. Please try again later."
          }
        } as ApiResponse;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      // S11 — Email enumeration defence: always return the same error code and
      // message whether the email doesn't exist OR the password is wrong so
      // attackers cannot enumerate which emails are registered.
      let user;
      if (!existingUser) {
        request.log.warn({ ip: request.ip }, "Login attempt for unknown email (hidden from caller)");
        await recordLoginFailure(redis, loginEmail, loginIp);
        reply.status(401);
        return {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid credentials. Please check your email and password."
          }
        } as ApiResponse;
      } else {
        user = existingUser;
      }

      if (requestedRole && requestedRole !== user.role) {
        reply.status(403);
        return {
          success: false,
          error: {
            code: "ROLE_MISMATCH",
            message: `This account is registered as ${user.role}.`
          }
        } as ApiResponse;
      }

      if ((user.role === "ADMIN" || user.role === "STAFF") && !requestedRole) {
        reply.status(400);
        return {
          success: false,
          error: {
            code: "INTERNAL_LOGIN_ROLE_REQUIRED",
            message: "Select ADMIN or STAFF role when signing in."
          }
        } as ApiResponse;
      }

      if (user.role === "ADMIN") {
        if (user.passwordHash && user.passwordSalt) {
          if (!password || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
            request.log.warn({ email: parsedBody.data.email, ip: request.ip }, "Failed login attempt");
            await recordLoginFailure(redis, loginEmail, loginIp);
            reply.status(401);
            return {
              success: false,
              error: {
                code: "INVALID_CREDENTIALS",
                message: "Invalid email or password."
              }
            } as ApiResponse;
          }
        } else {
          if (!config.adminPassword) {
            reply.status(401);
            return {
              success: false,
              error: {
                code: "ADMIN_PASSWORD_SETUP_REQUIRED",
                message: "Admin password setup required. Complete admin registration and OTP verification."
              }
            } as ApiResponse;
          }
          if (config.adminPassword && config.adminPassword.length < 16) {
            return reply.code(500).send({
              success: false,
              error: { code: "INSECURE_CONFIG", message: "ADMIN_LOGIN_PASSWORD must be at least 16 characters." }
            });
          }
          if (!password || password !== config.adminPassword) {
            request.log.warn({ email: parsedBody.data.email, ip: request.ip }, "Failed login attempt");
            await recordLoginFailure(redis, loginEmail, loginIp);
            reply.status(401);
            return {
              success: false,
              error: {
                code: "INVALID_CREDENTIALS",
                message: "Invalid email or password."
              }
            } as ApiResponse;
          }
        }
      }

      if (user.role === "STAFF") {
        if (user.passwordHash && user.passwordSalt) {
          if (!password || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
            request.log.warn({ email: parsedBody.data.email, ip: request.ip }, "Failed login attempt");
            await recordLoginFailure(redis, loginEmail, loginIp);
            reply.status(401);
            return {
              success: false,
              error: {
                code: "INVALID_CREDENTIALS",
                message: "Invalid email or password."
              }
            } as ApiResponse;
          }
        } else {
          if (!config.staffPassword) {
            reply.status(401);
            return {
              success: false,
              error: {
                code: "STAFF_PASSWORD_SETUP_REQUIRED",
                message: "Staff password setup required. Complete staff registration and PIN verification."
              }
            } as ApiResponse;
          }
          if (config.staffPassword && config.staffPassword.length < 16) {
            return reply.code(500).send({
              success: false,
              error: { code: "INSECURE_CONFIG", message: "ADMIN_LOGIN_PASSWORD must be at least 16 characters." }
            });
          }
          if (!password || password !== config.staffPassword) {
            request.log.warn({ email: parsedBody.data.email, ip: request.ip }, "Failed login attempt");
            await recordLoginFailure(redis, loginEmail, loginIp);
            reply.status(401);
            return {
              success: false,
              error: {
                code: "INVALID_CREDENTIALS",
                message: "Invalid email or password."
              }
            } as ApiResponse;
          }
        }
      }

      if (!user.isActive) {
        reply.status(401);
        return {
          success: false,
          error: {
            code: "USER_INACTIVE",
            message: "User account is not active"
          }
        } as ApiResponse;
      }

      if (user.role === "CLIENT" && !user.clientId) {
        reply.status(409);
        return {
          success: false,
          error: {
            code: "CLIENT_NOT_PROVISIONED",
            message: "Client account is not linked yet. Ask your admin to provision access."
          }
        } as ApiResponse;
      }

      // ── 2FA gate ──────────────────────────────────────────────────────────────
      // If the user has TOTP enabled, do NOT issue a full session yet.
      // Instead return a short-lived temp token that the frontend exchanges for
      // a full session once the user proves their TOTP code.
      if (user.totpEnabledAt && user.totpSecret) {
        const tempToken = signTempToken(user.id, config);
        reply.status(200);
        return {
          success: true,
          data: { requiresTwoFactor: true, tempToken },
          meta: { requestId: request.headers["x-request-id"] ?? undefined }
        } as ApiResponse;
      }

      const rememberMe = parsedBody.data.rememberMe ?? true;
      const refreshTokenPayload = rememberMe
        ? buildRefreshToken(config.refreshTokenTtlDays)
        : buildRefreshTokenWithHours(config.refreshTokenSessionTtlHours);
      const { token: refreshToken, tokenHash: refreshTokenHash, expiresAt } = refreshTokenPayload;
      const accessToken = signAccessToken(user, config);

      await prisma.refreshToken.create({
        data: {
          tokenHash: refreshTokenHash,
          userId: user.id,
          expiresAt
        }
      });

      await prisma.loginEvent.create({
        data: {
          userId: user.id,
          requestId: (request.headers["x-request-id"] as string | undefined) ?? null,
          ipAddress: request.ip ?? null,
          userAgent: (request.headers["user-agent"] as string | undefined) ?? null
        }
      });

      await deps.eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.userLoggedIn,
        payload: {
          userId: user.id,
          email: user.email,
          role: user.role,
          clientId: user.clientId
        }
      });

      // Clear login failure counter on success.
      await resetLoginRateLimit(redis, loginEmail, loginIp);

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresInSeconds: config.accessTokenTtlSeconds,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            clientId: user.clientId
          }
        },
        meta: {
          requestId: request.headers["x-request-id"] ?? undefined
        }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "AUTH_LOGIN_FAILED",
          message: "Unable to process login request"
        }
      } as ApiResponse;
    }
  });

  // ── POST /auth/2fa/login ──────────────────────────────────────────────────────
  // Completes the 2FA login flow. Accepts the short-lived temp token issued by
  // POST /auth/login (when user.totpEnabledAt is set) together with the 6-digit
  // TOTP code from the user's authenticator app. On success, returns a full
  // session (accessToken + refreshToken) identical to a normal login response.
  app.post("/auth/2fa/login", async (request, reply) => {
    const body = request.body as { tempToken?: string; totpCode?: string };
    const { tempToken, totpCode } = body ?? {};

    if (!tempToken || !totpCode) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "tempToken and totpCode are required" }
      } as ApiResponse;
    }

    let userId: string;
    try {
      const decoded = verifyTempToken(tempToken, config);
      if (decoded.purpose !== "2fa_challenge") throw new Error("wrong purpose");
      userId = decoded.sub;
    } catch {
      reply.status(401);
      return {
        success: false,
        error: { code: "INVALID_TEMP_TOKEN", message: "Invalid or expired 2FA challenge token" }
      } as ApiResponse;
    }

    // ── Rate limit: 5 attempts per 5 minutes per userId ────────────────────
    const totpRateCheck = await checkTotpRateLimit(redis, userId);
    if (!totpRateCheck.allowed) {
      reply.status(429);
      reply.header("retry-after", String(Math.ceil((totpRateCheck.resetAt - Date.now()) / 1000)));
      return {
        success: false,
        error: {
          code: "TOTP_RATE_LIMITED",
          message: "Too many 2FA attempts. Please wait before trying again."
        }
      } as ApiResponse;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          clientId: true,
          totpSecret: true,
          totpEnabledAt: true,
          isActive: true
        }
      });

      if (!user || !user.isActive || !user.totpEnabledAt || !user.totpSecret) {
        reply.status(401);
        return {
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "Invalid 2FA challenge" }
        } as ApiResponse;
      }

      const isValid = verifyTotpCode(totpCode.trim(), user.totpSecret);
      if (!isValid) {
        await recordTotpFailure(redis, userId);
        reply.status(401);
        return {
          success: false,
          error: { code: "INVALID_TOTP_CODE", message: "Incorrect authenticator code. Please try again." }
        } as ApiResponse;
      }

      // Successful verification — clear the attempt counter
      await resetTotpRateLimit(redis, userId);

      // Issue full session
      const refreshTokenPayload = buildRefreshToken(config.refreshTokenTtlDays);
      const { token: refreshToken, tokenHash: refreshTokenHash, expiresAt } = refreshTokenPayload;
      const accessToken = signAccessToken(user, config);

      await prisma.refreshToken.create({
        data: { tokenHash: refreshTokenHash, userId: user.id, expiresAt }
      });

      await prisma.loginEvent.create({
        data: {
          userId: user.id,
          requestId: (request.headers["x-request-id"] as string | undefined) ?? null,
          ipAddress: request.ip ?? null,
          userAgent: (request.headers["user-agent"] as string | undefined) ?? null
        }
      });

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresInSeconds: config.accessTokenTtlSeconds,
          user: { id: user.id, email: user.email, role: user.role, clientId: user.clientId }
        },
        meta: { requestId: request.headers["x-request-id"] ?? undefined }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "AUTH_2FA_LOGIN_FAILED", message: "Unable to complete 2FA login" }
      } as ApiResponse;
    }
  });

  app.post("/auth/refresh", async (request, reply) => {
    const parsedBody = refreshSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid refresh payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const refreshTokenHash = hashRefreshToken(parsedBody.data.refreshToken);

    try {
      const existingToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: refreshTokenHash },
        include: { user: true }
      });

      if (!existingToken || existingToken.revokedAt || existingToken.expiresAt <= new Date()) {
        reply.status(401);
        return {
          success: false,
          error: {
            code: "INVALID_REFRESH_TOKEN",
            message: "Refresh token is invalid or expired"
          }
        } as ApiResponse;
      }

      if (!existingToken.user.isActive) {
        reply.status(401);
        return {
          success: false,
          error: {
            code: "USER_INACTIVE",
            message: "User account is not active"
          }
        } as ApiResponse;
      }

      const IDLE_TIMEOUT_MS = config.idleTimeoutHours * 60 * 60 * 1000;
      if (Date.now() - existingToken.lastUsedAt.getTime() > IDLE_TIMEOUT_MS) {
        await prisma.refreshToken.update({
          where: { id: existingToken.id },
          data: { revokedAt: new Date() },
        });
        reply.code(401);
        return {
          success: false,
          error: {
            code: "SESSION_IDLE_TIMEOUT",
            message: "Session expired due to inactivity. Please log in again."
          }
        } as ApiResponse;
      }

      const { token: nextRefreshToken, tokenHash: nextRefreshTokenHash, expiresAt } = buildRefreshToken(
        config.refreshTokenTtlDays
      );
      const accessToken = signAccessToken(existingToken.user, config);

      const [, newRefreshTokenRecord] = await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: existingToken.id },
          data: { revokedAt: new Date() }
        }),
        prisma.refreshToken.create({
          data: {
            tokenHash: nextRefreshTokenHash,
            userId: existingToken.userId,
            expiresAt,
            lastUsedAt: new Date()
          }
        })
      ]);

      await deps.eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.tokenRefreshed,
        payload: {
          userId: existingToken.user.id
        }
      });

      return {
        success: true,
        data: {
          accessToken,
          refreshToken: nextRefreshToken,
          expiresInSeconds: config.accessTokenTtlSeconds,
          user: {
            id: existingToken.user.id,
            email: existingToken.user.email,
            role: existingToken.user.role,
            clientId: existingToken.user.clientId
          }
        },
        meta: {
          requestId: request.headers["x-request-id"] ?? undefined
        }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "TOKEN_REFRESH_FAILED",
          message: "Unable to refresh access token"
        }
      } as ApiResponse;
    }
  });

  // ── GET /auth/admin/2fa/status ─────────────────────────────────────────────
  // Returns the current TOTP 2FA status for the authenticated admin.
  app.get("/auth/admin/2fa/status", async (request, reply) => {
    if (!ensureAdmin(request, reply)) return;
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "User ID missing" } } as ApiResponse;
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totpEnabledAt: true }
      });
      if (!user) {
        reply.status(404);
        return { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } } as ApiResponse;
      }
      return {
        success: true,
        data: {
          enabled: user.totpEnabledAt !== null,
          enabledAt: user.totpEnabledAt?.toISOString() ?? null
        }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TOTP_STATUS_FAILED", message: "Unable to fetch 2FA status" } } as ApiResponse;
    }
  });

  // ── POST /auth/admin/2fa/setup ─────────────────────────────────────────────
  // Generates a TOTP secret + QR code for the admin to scan with their
  // authenticator app. The setup is NOT activated until /2fa/verify is called.
  app.post("/auth/admin/2fa/setup", async (request, reply) => {
    if (!ensureAdmin(request, reply)) return;
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "User ID missing" } } as ApiResponse;
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, totpEnabledAt: true }
      });
      if (!user) {
        reply.status(404);
        return { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } } as ApiResponse;
      }

      const secret = generateTotpSecret();
      const backupCodes = generateBackupCodes();
      const totpUri = buildTotpUri(user.email, secret);
      const qrCodeDataUrl = await generateQrDataUrl(totpUri);

      // S13 — Hash backup codes before storage so plaintext never sits in DB.
      // We still return the raw codes once to the user for safe-keeping.
      const hashedBackupCodes = backupCodes.map((code) =>
        createHash("sha256").update(code).digest("hex")
      );

      // Store the pending secret (not yet active — verified in /2fa/verify)
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: secret,
          totpBackupCodes: JSON.stringify(hashedBackupCodes),
          totpEnabledAt: null  // remains null until verified
        }
      });

      return {
        success: true,
        data: { secret, qrCodeDataUrl, backupCodes }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TOTP_SETUP_FAILED", message: "Unable to initiate 2FA setup" } } as ApiResponse;
    }
  });

  // ── POST /auth/admin/2fa/verify ────────────────────────────────────────────
  // Verifies the 6-digit TOTP code from the authenticator app to confirm
  // the setup was successful, then activates 2FA for this account.
  app.post("/auth/admin/2fa/verify", async (request, reply) => {
    if (!ensureAdmin(request, reply)) return;
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "User ID missing" } } as ApiResponse;
    }

    // ── Rate limit: 5 attempts per 5 minutes per userId ────────────────────
    const rateCheck = await checkTotpRateLimit(redis, userId);
    if (!rateCheck.allowed) {
      reply.status(429);
      reply.header("retry-after", String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)));
      return {
        success: false,
        error: {
          code: "TOTP_RATE_LIMITED",
          message: "Too many 2FA attempts. Please wait before trying again."
        }
      } as ApiResponse;
    }

    const body = request.body as Record<string, unknown> | null;
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!code) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "code is required" } } as ApiResponse;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totpSecret: true, totpEnabledAt: true }
      });
      if (!user) {
        reply.status(404);
        return { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } } as ApiResponse;
      }
      if (!user.totpSecret) {
        reply.status(409);
        return { success: false, error: { code: "TOTP_NOT_INITIATED", message: "2FA setup has not been initiated. Call /2fa/setup first." } } as ApiResponse;
      }

      const isValid = verifyTotpCode(code, user.totpSecret);
      if (!isValid) {
        await recordTotpFailure(redis, userId);
        reply.status(401);
        return { success: false, error: { code: "INVALID_TOTP_CODE", message: "Invalid or expired 2FA code" } } as ApiResponse;
      }

      // Successful verification — clear the attempt counter
      await resetTotpRateLimit(redis, userId);

      // Activate 2FA
      await prisma.user.update({
        where: { id: userId },
        data: { totpEnabledAt: new Date() }
      });

      // S14 — Audit trail: notify ops when 2FA is enabled
      await deps.eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.notificationRequested,
        payload: {
          channel: "EMAIL",
          recipientEmail: process.env.INTERNAL_NOTIFICATION_RECIPIENT_EMAIL ?? "ops@maphari.com",
          subject: "Security: 2FA Enabled",
          message: `Admin user (ID: ${userId}) has successfully enabled Two-Factor Authentication. This was completed at ${new Date().toISOString()}.`
        }
      });

      return { success: true, data: { enabled: true } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TOTP_VERIFY_FAILED", message: "Unable to verify 2FA code" } } as ApiResponse;
    }
  });

  // ── POST /auth/admin/2fa/disable ───────────────────────────────────────────
  // Disables TOTP 2FA for this account. Requires the current password as
  // a second confirmation to prevent unauthorised disabling of 2FA.
  app.post("/auth/admin/2fa/disable", async (request, reply) => {
    if (!ensureAdmin(request, reply)) return;
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "User ID missing" } } as ApiResponse;
    }

    const body = request.body as Record<string, unknown> | null;
    const password = typeof body?.password === "string" ? body.password : "";
    if (!password) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "password is required to disable 2FA" } } as ApiResponse;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true, passwordSalt: true, totpEnabledAt: true }
      });
      if (!user) {
        reply.status(404);
        return { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } } as ApiResponse;
      }
      if (!user.totpEnabledAt) {
        reply.status(409);
        return { success: false, error: { code: "TOTP_NOT_ENABLED", message: "2FA is not currently enabled" } } as ApiResponse;
      }
      if (!user.passwordHash || !user.passwordSalt || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
        reply.status(401);
        return { success: false, error: { code: "INVALID_PASSWORD", message: "Incorrect password" } } as ApiResponse;
      }

      await prisma.user.update({
        where: { id: userId },
        data: { totpSecret: null, totpBackupCodes: null, totpEnabledAt: null }
      });

      // S14 — Audit trail: notify ops when 2FA is disabled
      await deps.eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.notificationRequested,
        payload: {
          channel: "EMAIL",
          recipientEmail: process.env.INTERNAL_NOTIFICATION_RECIPIENT_EMAIL ?? "ops@maphari.com",
          subject: "Security Alert: 2FA Disabled",
          message: `Admin user (ID: ${userId}) has disabled Two-Factor Authentication at ${new Date().toISOString()}. If this was not you, revoke all sessions immediately via the admin dashboard.`
        }
      });

      return { success: true, data: { disabled: true } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TOTP_DISABLE_FAILED", message: "Unable to disable 2FA" } } as ApiResponse;
    }
  });

  // ── GET /auth/me/sessions ──────────────────────────────────────────────────
  // Returns the 10 most recent login events for the authenticated user.
  app.get("/auth/me/sessions", async (request, reply) => {
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } } as ApiResponse;
    }

    try {
      const events = await prisma.loginEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, ipAddress: true, userAgent: true, createdAt: true }
      });

      return {
        success: true,
        data: events,
        meta: { requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "SESSIONS_FETCH_FAILED", message: "Unable to retrieve session history" } } as ApiResponse;
    }
  });

  // ── DELETE /auth/me/sessions ───────────────────────────────────────────────
  // Revokes all active refresh tokens for the current user (signs out all devices).
  app.delete("/auth/me/sessions", async (request, reply) => {
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } } as ApiResponse;
    }

    try {
      const result = await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });

      return {
        success: true,
        data: { revokedCount: result.count },
        meta: { requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "SESSIONS_REVOKE_FAILED", message: "Unable to revoke sessions" } } as ApiResponse;
    }
  });

  // ── POST /auth/password-change ────────────────────────────────────────────
  // Authenticated: verifies the current password then replaces it.
  // Revokes all refresh tokens so existing sessions are terminated.
  app.post("/auth/password-change", async (request, reply) => {
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } } as ApiResponse;
    }

    const body = request.body as Record<string, unknown> | null;
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!newPassword || newPassword.length < 8) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "New password must be at least 8 characters." }
      } as ApiResponse;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, passwordHash: true, passwordSalt: true, role: true }
      });

      if (!user) {
        reply.status(404);
        return { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } } as ApiResponse;
      }

      // If the user has a password hash, verify the current password.
      // OAuth-only users (no hash/salt) may set a password without providing current.
      if (user.passwordHash && user.passwordSalt) {
        if (!currentPassword) {
          reply.status(400);
          return {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Current password is required." }
          } as ApiResponse;
        }
        const valid = verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
        if (!valid) {
          reply.status(401);
          return {
            success: false,
            error: { code: "INVALID_CURRENT_PASSWORD", message: "Current password is incorrect." }
          } as ApiResponse;
        }
      }

      const { hash, salt } = hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hash, passwordSalt: salt }
      });

      // Revoke all existing refresh tokens so the user must log in again.
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() }
      });

      return {
        success: true,
        data: { message: "Password updated. Please log in again." },
        meta: { requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PASSWORD_CHANGE_FAILED", message: "Unable to update password" } } as ApiResponse;
    }
  });

  // ── POST /auth/phone/send-otp ──────────────────────────────────────────────
  // Authenticated: generates and stores a 6-digit OTP for phone verification.
  app.post("/auth/phone/send-otp", async (request, reply) => {
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } } as ApiResponse;
    }

    const body = request.body as Record<string, unknown> | null;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

    if (!phone || !/^\+?[0-9]{7,15}$/.test(phone)) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "A valid phone number is required (7-15 digits, optional leading +)." }
      } as ApiResponse;
    }

    const code = generatePin();
    pendingPhoneOtps.set(userId, { phone, code, expiresAt: Date.now() + 10 * 60 * 1000 });

    // In production, send the OTP via SMS here.
    return {
      success: true,
      data: {
        message: "OTP sent to your phone",
        ...(process.env.NODE_ENV !== "production" && { devCode: code })
      },
      meta: { requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined }
    } as ApiResponse;
  });

  // ── POST /auth/phone/verify-otp ────────────────────────────────────────────
  // Authenticated: validates the OTP and marks the phone number as verified.
  app.post("/auth/phone/verify-otp", async (request, reply) => {
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } } as ApiResponse;
    }

    const body = request.body as Record<string, unknown> | null;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    const entry = pendingPhoneOtps.get(userId);

    if (!entry || entry.expiresAt < Date.now()) {
      reply.status(400);
      return {
        success: false,
        error: { code: "INVALID_OTP", message: "OTP has expired or was not requested. Please send a new OTP." }
      } as ApiResponse;
    }

    if (entry.phone !== phone) {
      reply.status(400);
      return {
        success: false,
        error: { code: "PHONE_MISMATCH", message: "Phone number does not match the OTP request." }
      } as ApiResponse;
    }

    if (!otpMatches(entry.code, code)) {
      reply.status(400);
      return {
        success: false,
        error: { code: "INVALID_OTP", message: "Incorrect OTP code." }
      } as ApiResponse;
    }

    pendingPhoneOtps.delete(userId);

    return {
      success: true,
      data: { message: "Phone number verified successfully" },
      meta: { requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined }
    } as ApiResponse;
  });

  // ── POST /auth/password-reset/request ─────────────────────────────────────
  // Accepts an email, generates a secure short-lived token, stores a hash in the
  // DB, and publishes an email notification with the reset link.
  // Always returns success=true so callers cannot enumerate registered accounts.
  app.post("/auth/password-reset/request", async (request, reply) => {
    const body = request.body as Record<string, unknown> | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "A valid email address is required." }
      } as ApiResponse;
    }

    // Always respond success to prevent email enumeration
    const genericSuccess: ApiResponse = { success: true, data: { sent: true } };

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) {
        // Silently succeed — don't reveal if the account exists
        return genericSuccess;
      }

      // Generate a cryptographically secure token and store its hash
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt }
      });

      // Publish email notification with the reset link
      const resetUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${rawToken}`;
      await deps.eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        topic: EventTopics.notificationRequested,
        payload: {
          channel: "EMAIL",
          recipientEmail: email,
          message: `Reset your Maphari password: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request this, please ignore this email.`
        }
      });

      request.log.info({ userId: user.id }, "Password reset token issued");
      return genericSuccess;
    } catch (error) {
      request.log.error(error);
      // Still return generic success to prevent timing side-channels
      return genericSuccess;
    }
  });

  // ── POST /auth/admin/lockdown ──────────────────────────────────────────────
  // Emergency lockdown: revokes ALL active refresh tokens across the platform.
  // Instantly ends every active session. Admin must re-authenticate after this.
  app.post("/auth/admin/lockdown", async (request, reply) => {
    if (!ensureAdmin(request, reply)) return;

    try {
      const result = await prisma.refreshToken.updateMany({
        where: { revokedAt: null },
        data: { revokedAt: new Date() }
      });

      request.log.warn(
        { revokedCount: result.count, actor: currentActor(request).userId },
        "EMERGENCY LOCKDOWN — all active sessions terminated"
      );

      await deps.eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.notificationRequested,
        payload: {
          channel: "EMAIL",
          recipientEmail: "admin@maphari.co.za",
          message: `SECURITY ALERT: Emergency platform lockdown was triggered. ${result.count} sessions were terminated. If this was not you, investigate immediately.`
        }
      });

      return {
        success: true,
        data: { revokedSessions: result.count, lockedAt: new Date().toISOString() }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "LOCKDOWN_FAILED", message: "Unable to complete emergency lockdown." }
      } as ApiResponse;
    }
  });

  // ── POST /auth/password-reset/confirm ─────────────────────────────────────
  // Validates the reset token and updates the user's password.
  app.post("/auth/password-reset/confirm", async (request, reply) => {
    const body = request.body as Record<string, unknown> | null;
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token || !newPassword) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "token and newPassword are required." }
      } as ApiResponse;
    }

    if (newPassword.length < 8) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters." }
      } as ApiResponse;
    }

    try {
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const user = await prisma.user.findFirst({
        where: { passwordResetTokenHash: tokenHash }
      });

      if (!user || !user.passwordResetExpiresAt) {
        reply.status(400);
        return {
          success: false,
          error: { code: "INVALID_TOKEN", message: "Reset link is invalid or has already been used." }
        } as ApiResponse;
      }

      if (user.passwordResetExpiresAt.getTime() < Date.now()) {
        reply.status(410);
        return {
          success: false,
          error: { code: "TOKEN_EXPIRED", message: "Reset link has expired. Please request a new one." }
        } as ApiResponse;
      }

      const { hash, salt } = hashPassword(newPassword);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hash,
          passwordSalt: salt,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null
        }
      });

      request.log.info({ userId: user.id }, "Password reset completed successfully");
      return { success: true, data: { reset: true } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "PASSWORD_RESET_FAILED", message: "Unable to reset password. Please try again." }
      } as ApiResponse;
    }
  });

  // ── POST /auth/google/exchange ─────────────────────────────────────────────
  // Exchanges a Google OAuth authorization code for an internal session.
  // The frontend callback page sends the code here after Google redirects back.
  app.post("/auth/google/exchange", async (request, reply) => {
    const body = request.body as { code?: unknown; redirectUri?: unknown } | null;
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const redirectUri =
      typeof body?.redirectUri === "string"
        ? body.redirectUri.trim()
        : process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/auth/google/callback";

    if (!code) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Google authorization code is required." }
      } as ApiResponse;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

    if (!clientId || !clientSecret) {
      reply.status(503);
      return {
        success: false,
        error: { code: "OAUTH_NOT_CONFIGURED", message: "Google OAuth is not configured on this server." }
      } as ApiResponse;
    }

    try {
      // ── 1. Exchange code for Google tokens ──────────────────────────────────
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        }).toString()
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text().catch(() => "");
        request.log.warn({ status: tokenRes.status, body: errBody }, "Google token exchange failed");
        reply.status(401);
        return {
          success: false,
          error: { code: "GOOGLE_TOKEN_EXCHANGE_FAILED", message: "Failed to exchange Google authorization code." }
        } as ApiResponse;
      }

      const tokenData = (await tokenRes.json()) as { access_token?: string };
      const googleAccessToken = tokenData.access_token;
      if (!googleAccessToken) {
        reply.status(401);
        return {
          success: false,
          error: { code: "GOOGLE_TOKEN_MISSING", message: "Google did not return an access token." }
        } as ApiResponse;
      }

      // ── 2. Fetch Google userinfo ────────────────────────────────────────────
      const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { authorization: `Bearer ${googleAccessToken}` }
      });

      if (!userinfoRes.ok) {
        reply.status(401);
        return {
          success: false,
          error: { code: "GOOGLE_USERINFO_FAILED", message: "Failed to retrieve user information from Google." }
        } as ApiResponse;
      }

      const userinfo = (await userinfoRes.json()) as {
        sub?: string;
        email?: string;
        email_verified?: boolean;
        name?: string;
      };

      if (!userinfo.sub || !userinfo.email) {
        reply.status(401);
        return {
          success: false,
          error: { code: "GOOGLE_USERINFO_INCOMPLETE", message: "Google account did not provide an email address." }
        } as ApiResponse;
      }

      const googleId = userinfo.sub;
      const email = userinfo.email.toLowerCase().trim();

      // ── 3. Upsert user — find by googleId, fall back to email ──────────────
      let user = await prisma.user.findFirst({ where: { googleId } });

      if (!user) {
        // Try to link to an existing account with the same email
        const byEmail = await prisma.user.findUnique({ where: { email } });
        if (byEmail) {
          user = await prisma.user.update({
            where: { id: byEmail.id },
            data: { googleId, isActive: true }
          });
        } else {
          // No existing account — Google OAuth is only for staff/admin who already
          // have an account. Reject unknown emails.
          reply.status(403);
          return {
            success: false,
            error: {
              code: "GOOGLE_ACCOUNT_NOT_FOUND",
              message: "No Maphari account is linked to this Google account. Please register first."
            }
          } as ApiResponse;
        }
      }

      if (!user.isActive) {
        reply.status(401);
        return {
          success: false,
          error: { code: "USER_INACTIVE", message: "User account is not active." }
        } as ApiResponse;
      }

      // ── 4. Issue internal JWT + refresh token ───────────────────────────────
      const { token: refreshToken, tokenHash: refreshTokenHash, expiresAt } = buildRefreshToken(config.refreshTokenTtlDays);
      const accessToken = signAccessToken(user, config);

      await prisma.refreshToken.create({
        data: { tokenHash: refreshTokenHash, userId: user.id, expiresAt }
      });

      await prisma.loginEvent.create({
        data: {
          userId: user.id,
          requestId: (request.headers["x-request-id"] as string | undefined) ?? null,
          ipAddress: request.ip ?? null,
          userAgent: (request.headers["user-agent"] as string | undefined) ?? null
        }
      });

      await deps.eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.userLoggedIn,
        payload: { userId: user.id, email: user.email, role: user.role, clientId: user.clientId }
      });

      request.log.info({ userId: user.id, email: user.email }, "Google OAuth login successful");

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresInSeconds: config.accessTokenTtlSeconds,
          user: {
            id: user.id,
            email: user.email,
            role: user.role as import("@maphari/contracts").Role,
            clientId: user.clientId
          }
        }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "GOOGLE_OAUTH_FAILED", message: "Google sign-in failed. Please try again." }
      } as ApiResponse;
    }
  });

  // ── POST /auth/revoke-all-sessions ────────────────────────────────────────
  // Authenticated: revokes all active refresh tokens for the current user.
  // Used by the client portal "Sign out all devices" feature.
  app.post("/auth/revoke-all-sessions", async (request, reply) => {
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } } as ApiResponse;
    }

    try {
      const result = await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });

      return {
        success: true,
        data: { revokedCount: result.count }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "REVOKE_ALL_FAILED", message: "Unable to revoke all sessions" } } as ApiResponse;
    }
  });

  // ── GET /auth/staff/2fa/status ─────────────────────────────────────────────
  // Returns the current TOTP 2FA status for the authenticated staff member.
  app.get("/auth/staff/2fa/status", async (request, reply) => {
    if (!ensureStaff(request, reply)) return;
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "User ID missing" } } as ApiResponse;
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totpEnabledAt: true }
      });
      if (!user) {
        reply.status(404);
        return { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } } as ApiResponse;
      }
      return {
        success: true,
        data: {
          enabled: user.totpEnabledAt !== null,
          enabledAt: user.totpEnabledAt?.toISOString() ?? null
        }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TOTP_STATUS_FAILED", message: "Unable to fetch 2FA status" } } as ApiResponse;
    }
  });

  // ── POST /auth/staff/2fa/setup ─────────────────────────────────────────────
  // Generates a TOTP secret + QR code for the staff member to scan with their
  // authenticator app. The setup is NOT activated until /2fa/verify is called.
  app.post("/auth/staff/2fa/setup", async (request, reply) => {
    if (!ensureStaff(request, reply)) return;
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "User ID missing" } } as ApiResponse;
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, totpEnabledAt: true }
      });
      if (!user) {
        reply.status(404);
        return { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } } as ApiResponse;
      }

      const secret = generateTotpSecret();
      const backupCodes = generateBackupCodes();
      const totpUri = buildTotpUri(user.email, secret);
      const qrCodeDataUrl = await generateQrDataUrl(totpUri);

      const hashedBackupCodes = backupCodes.map((code) =>
        createHash("sha256").update(code).digest("hex")
      );

      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: secret,
          totpBackupCodes: JSON.stringify(hashedBackupCodes),
          totpEnabledAt: null
        }
      });

      return {
        success: true,
        data: { secret, qrCodeDataUrl, backupCodes }
      } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TOTP_SETUP_FAILED", message: "Unable to initiate 2FA setup" } } as ApiResponse;
    }
  });

  // ── POST /auth/staff/2fa/verify ────────────────────────────────────────────
  // Verifies the 6-digit TOTP code from the authenticator app to confirm
  // the setup was successful, then activates 2FA for this account.
  app.post("/auth/staff/2fa/verify", async (request, reply) => {
    if (!ensureStaff(request, reply)) return;
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "User ID missing" } } as ApiResponse;
    }

    const rateCheck = await checkTotpRateLimit(redis, userId);
    if (!rateCheck.allowed) {
      reply.status(429);
      reply.header("retry-after", String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)));
      return {
        success: false,
        error: {
          code: "TOTP_RATE_LIMITED",
          message: "Too many 2FA attempts. Please wait before trying again."
        }
      } as ApiResponse;
    }

    const body = request.body as Record<string, unknown> | null;
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!code) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "code is required" } } as ApiResponse;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totpSecret: true, totpEnabledAt: true }
      });
      if (!user) {
        reply.status(404);
        return { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } } as ApiResponse;
      }
      if (!user.totpSecret) {
        reply.status(409);
        return { success: false, error: { code: "TOTP_NOT_INITIATED", message: "2FA setup has not been initiated. Call /2fa/setup first." } } as ApiResponse;
      }

      const isValid = verifyTotpCode(code, user.totpSecret);
      if (!isValid) {
        await recordTotpFailure(redis, userId);
        reply.status(401);
        return { success: false, error: { code: "INVALID_TOTP_CODE", message: "Invalid or expired 2FA code" } } as ApiResponse;
      }

      await resetTotpRateLimit(redis, userId);

      await prisma.user.update({
        where: { id: userId },
        data: { totpEnabledAt: new Date() }
      });

      await deps.eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.notificationRequested,
        payload: {
          channel: "EMAIL",
          recipientEmail: process.env.INTERNAL_NOTIFICATION_RECIPIENT_EMAIL ?? "ops@maphari.com",
          subject: "Security: Staff 2FA Enabled",
          message: `Staff user (ID: ${userId}) has successfully enabled Two-Factor Authentication. This was completed at ${new Date().toISOString()}.`
        }
      });

      return { success: true, data: { enabled: true } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TOTP_VERIFY_FAILED", message: "Unable to verify 2FA code" } } as ApiResponse;
    }
  });

  // ── POST /auth/staff/2fa/disable ───────────────────────────────────────────
  // Disables TOTP 2FA for this account. Requires the current password as
  // a second confirmation to prevent unauthorised disabling of 2FA.
  app.post("/auth/staff/2fa/disable", async (request, reply) => {
    if (!ensureStaff(request, reply)) return;
    const { userId } = currentActor(request);
    if (!userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "User ID missing" } } as ApiResponse;
    }

    const disableRateCheck = await checkTotpRateLimit(redis, userId);
    if (!disableRateCheck.allowed) {
      reply.status(429);
      reply.header("retry-after", String(Math.ceil((disableRateCheck.resetAt - Date.now()) / 1000)));
      return {
        success: false,
        error: {
          code: "TOTP_RATE_LIMITED",
          message: "Too many 2FA attempts. Please wait before trying again."
        }
      } as ApiResponse;
    }

    const body = request.body as Record<string, unknown> | null;
    const password = typeof body?.password === "string" ? body.password : "";
    if (!password) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "password is required to disable 2FA" } } as ApiResponse;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true, passwordSalt: true, totpEnabledAt: true }
      });
      if (!user) {
        reply.status(404);
        return { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } } as ApiResponse;
      }
      if (!user.totpEnabledAt) {
        reply.status(409);
        return { success: false, error: { code: "TOTP_NOT_ENABLED", message: "2FA is not currently enabled" } } as ApiResponse;
      }
      if (!user.passwordHash || !user.passwordSalt || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
        await recordTotpFailure(redis, userId);
        reply.status(401);
        return { success: false, error: { code: "INVALID_PASSWORD", message: "Incorrect password" } } as ApiResponse;
      }

      await resetTotpRateLimit(redis, userId);

      await prisma.user.update({
        where: { id: userId },
        data: { totpSecret: null, totpBackupCodes: null, totpEnabledAt: null }
      });

      await deps.eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: (request.headers["x-request-id"] as string | undefined) ?? undefined,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        topic: EventTopics.notificationRequested,
        payload: {
          channel: "EMAIL",
          recipientEmail: process.env.INTERNAL_NOTIFICATION_RECIPIENT_EMAIL ?? "ops@maphari.com",
          subject: "Security: Staff 2FA Disabled",
          message: `Staff user (ID: ${userId}) has disabled Two-Factor Authentication at ${new Date().toISOString()}. If this was not you, revoke all sessions immediately via the admin dashboard.`
        }
      });

      return { success: true, data: { disabled: true } } as ApiResponse;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TOTP_DISABLE_FAILED", message: "Unable to disable 2FA" } } as ApiResponse;
    }
  });
}
