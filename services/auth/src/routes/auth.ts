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
import { randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { buildRefreshToken, buildRefreshTokenWithHours, hashRefreshToken, signAccessToken } from "../lib/tokens.js";
import type { AuthConfig } from "../lib/config.js";

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

function shouldExposeDebugOtp(): boolean {
  if (process.env.AUTH_EXPOSE_DEBUG_OTP === "true") return true;
  return process.env.NODE_ENV !== "production";
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

export async function registerAuthRoutes(
  app: FastifyInstance,
  config: AuthConfig,
  deps: AuthRouteDependencies
): Promise<void> {
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

      return {
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          otpRequired: true,
          otpExpiresAt: otpExpiresAt.toISOString(),
          ...(shouldExposeDebugOtp() ? { debugOtp: otp } : {})
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

      if (existing.otpCode !== parsed.data.otp) {
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

      return {
        success: true,
        data: {
          email,
          otpRequired: true,
          otpExpiresAt: otpExpiresAt.toISOString(),
          ...(shouldExposeDebugOtp() ? { debugOtp: otp } : {})
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
    const pin = generatePin();

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
          message: `Staff registration request: ${email}. Verification PIN: ${pin}`
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

      if (requestRecord.pin !== parsed.data.pin) {
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
        pin: row.pin,
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
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      let user;
      if (!existingUser) {
        reply.status(404);
        return {
          success: false,
          error: {
            code: "ACCOUNT_NOT_REGISTERED",
            message: "Account is not registered yet. Ask your admin for an invite."
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
          if (!password || password !== config.adminPassword) {
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
          if (!password || password !== config.staffPassword) {
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

      const { token: nextRefreshToken, tokenHash: nextRefreshTokenHash, expiresAt } = buildRefreshToken(
        config.refreshTokenTtlDays
      );
      const accessToken = signAccessToken(existingToken.user, config);

      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: existingToken.id },
          data: { revokedAt: new Date() }
        }),
        prisma.refreshToken.create({
          data: {
            tokenHash: nextRefreshTokenHash,
            userId: existingToken.userId,
            expiresAt
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
}
