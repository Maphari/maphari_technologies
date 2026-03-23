// ════════════════════════════════════════════════════════════════════════════
// eft-verification.ts — EFT deposit proof upload + admin verification
// Routes:
//   PATCH /projects/:id/eft-proof              CLIENT
//   GET   /clients/:clientId/projects/:id/eft-status  CLIENT/STAFF/ADMIN
//   GET   /admin/eft-pending                   STAFF/ADMIN (read-only for STAFF)
//   POST  /admin/eft-pending/:id/verify        ADMIN only
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

const ADMIN_EMAIL = process.env.INTERNAL_NOTIFICATION_RECIPIENT_EMAIL ?? "ops@maphari.com";
const FILES_SERVICE_URL = process.env.FILES_SERVICE_URL ?? "http://localhost:4003";
const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:4005";

// ── Helper: notify admin on proof upload ─────────────────────────────────────
// No User model in schema — falls back to ADMIN_EMAIL env var.
async function notifyAdminEftProofUploaded(opts: {
  clientName: string;
  depositCents: number;
  referenceCode: string | null;
}) {
  const ref = opts.referenceCode ?? "—";
  const amount = `R ${(opts.depositCents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
  try {
    await fetch(`${NOTIFICATIONS_SERVICE_URL}/notifications/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "ADMIN", "x-user-id": "system" },
      body: JSON.stringify({
        to: ADMIN_EMAIL,
        subject: `New EFT proof uploaded — ${ref}`,
        html: `<p>${opts.clientName} uploaded proof of EFT payment (${amount}).</p><p>Reference: <strong>${ref}</strong></p><p>Log in to the admin dashboard to verify.</p>`
      }),
      signal: AbortSignal.timeout(8_000)
    });
  } catch (err) {
    console.warn("[eft] Admin notification failed:", err);
  }
}

// ── Helper: notify client on verify/reject ────────────────────────────────────
async function notifyClientEftDecision(opts: {
  clientEmail: string;
  action: "VERIFY" | "REJECT";
  referenceCode: string | null;
  depositCents: number;
  rejectionReason?: string;
}) {
  const ref = opts.referenceCode ?? "—";
  const amount = `R ${(opts.depositCents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
  const subject = opts.action === "VERIFY"
    ? `Your deposit has been verified — ${ref}`
    : `Action required: re-upload proof of payment — ${ref}`;
  const html = opts.action === "VERIFY"
    ? `<p>Your EFT deposit of ${amount} for project <strong>${ref}</strong> has been verified. Your project lead will be in touch within 1 business day.</p>`
    : `<p>Your proof of payment for <strong>${ref}</strong> was not accepted.</p><p>Reason: ${opts.rejectionReason}</p><p>Please log in and re-upload your proof of payment from your project dashboard.</p>`;
  try {
    await fetch(`${NOTIFICATIONS_SERVICE_URL}/notifications/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-role": "ADMIN", "x-user-id": "system" },
      body: JSON.stringify({ to: opts.clientEmail, subject, html }),
      signal: AbortSignal.timeout(8_000)
    });
  } catch (err) {
    console.warn("[eft] Client notification failed:", err);
  }
}

export async function registerEftVerificationRoutes(app: FastifyInstance): Promise<void> {

  // ── PATCH /projects/:id/eft-proof ─────────────────────────────────────────
  app.patch("/projects/:id/eft-proof", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients only." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as { proofFileId?: string; proofFileName?: string };

    if (!body.proofFileId || !body.proofFileName) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "proofFileId and proofFileName are required." } } as ApiResponse);
    }

    // Auth scope: project must belong to this client
    const project = await prisma.project.findUnique({ where: { id }, select: { id: true, clientId: true, referenceCode: true, budgetCents: true, client: { select: { name: true } } } });
    if (!project || project.clientId !== scope.clientId) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Project not found." } } as ApiResponse);
    }

    // Validate file via files service
    try {
      const fileMeta = await fetch(`${FILES_SERVICE_URL}/files/${body.proofFileId}/meta`, {
        headers: { "x-user-role": "CLIENT", "x-user-id": scope.userId ?? "", "x-client-id": scope.clientId ?? "" },
        signal: AbortSignal.timeout(8_000)
      });
      if (!fileMeta.ok) {
        return reply.code(400).send({ success: false, error: { code: "INVALID_PROOF_FILE", message: "Proof file not found or not accessible." } } as ApiResponse);
      }
      const meta = await fileMeta.json() as { mimeType?: string; sizeBytes?: number };
      if (!meta.mimeType || meta.mimeType !== "application/pdf") {
        return reply.code(400).send({ success: false, error: { code: "INVALID_PROOF_FILE", message: "Only PDF files are accepted." } } as ApiResponse);
      }
      if (!meta.sizeBytes || meta.sizeBytes > 10 * 1024 * 1024) {
        return reply.code(400).send({ success: false, error: { code: "INVALID_PROOF_FILE", message: "File must be 10 MB or smaller." } } as ApiResponse);
      }
    } catch {
      return reply.code(502).send({ success: false, error: { code: "FILES_SERVICE_UNAVAILABLE", message: "Unable to validate file. Please retry." } } as ApiResponse);
    }

    const existing = await prisma.eftVerification.findUnique({ where: { projectId: id } });

    const verification = existing
      ? await prisma.eftVerification.update({
          where: { projectId: id },
          data: {
            proofFileId: body.proofFileId,
            proofFileName: body.proofFileName,
            status: "PENDING",
            rejectedAt: null,
            rejectionReason: null,
            verifiedAt: null,
            verifiedBy: null
          }
        })
      : await prisma.eftVerification.create({
          data: {
            projectId: id,
            clientId: project.clientId,
            proofFileId: body.proofFileId,
            proofFileName: body.proofFileName,
            status: "PENDING"
          }
        });

    // Fire-and-forget admin email
    notifyAdminEftProofUploaded({
      clientName: project.client.name ?? project.clientId,
      depositCents: Number(project.budgetCents),
      referenceCode: project.referenceCode
    });

    const isNew = !existing;
    return reply.code(isNew ? 201 : 200).send({ success: true, data: { status: verification.status } } as ApiResponse);
  });

  // ── GET /clients/:clientId/projects/:id/eft-status ────────────────────────
  app.get("/clients/:clientId/projects/:id/eft-status", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { clientId, id } = request.params as { clientId: string; id: string };

    if (!scope.role) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } } as ApiResponse);
    }

    if (scope.role === "CLIENT" && scope.clientId !== clientId) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const verification = await prisma.eftVerification.findUnique({
      where: { projectId: id },
      select: { status: true, rejectionReason: true, verifiedAt: true, rejectedAt: true }
    });

    return {
      success: true,
      data: {
        status: verification?.status ?? null,
        rejectionReason: verification?.rejectionReason ?? null,
        verifiedAt: verification?.verifiedAt?.toISOString() ?? null,
        rejectedAt: verification?.rejectedAt?.toISOString() ?? null
      }
    } as ApiResponse;
  });

  // ── GET /admin/eft-pending ────────────────────────────────────────────────
  app.get("/admin/eft-pending", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Staff or Admin only." } } as ApiResponse);
    }

    const { status } = request.query as { status?: string };

    const VALID_STATUSES = ["PENDING", "VERIFIED", "REJECTED"];
    if (status && !VALID_STATUSES.includes(status)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "status must be PENDING, VERIFIED, or REJECTED." } } as ApiResponse);
    }

    const where = status ? { status: status as "PENDING" | "VERIFIED" | "REJECTED" } : {};

    const rows = await prisma.eftVerification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            referenceCode: true,
            budgetCents: true,
            name: true,
            client: { select: { name: true } }
          }
        }
      }
    });

    const data = rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      referenceCode: r.project.referenceCode ?? null,
      clientId: r.clientId,
      clientName: r.project.client.name,
      projectName: r.project.name,
      depositCents: Number(r.project.budgetCents),
      proofFileId: r.proofFileId,
      proofFileName: r.proofFileName,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      verifiedBy: r.verifiedBy ?? null,
      verifiedAt: r.verifiedAt?.toISOString() ?? null,
      rejectedAt: r.rejectedAt?.toISOString() ?? null,
      rejectionReason: r.rejectionReason ?? null
    }));

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /admin/eft-pending/:id/verify ────────────────────────────────────
  app.post("/admin/eft-pending/:id/verify", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as { action?: "VERIFY" | "REJECT"; rejectionReason?: string };

    if (!body.action || !["VERIFY", "REJECT"].includes(body.action)) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "action must be VERIFY or REJECT." } } as ApiResponse);
    }
    if (body.action === "REJECT" && !body.rejectionReason?.trim()) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "rejectionReason is required when rejecting." } } as ApiResponse);
    }

    const verification = await prisma.eftVerification.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            referenceCode: true,
            budgetCents: true,
            client: {
              select: {
                billingEmail: true,
                contacts: { where: { isPrimary: true }, select: { email: true }, take: 1 }
              }
            }
          }
        }
      }
    });
    if (!verification) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Verification not found." } } as ApiResponse);
    }

    const now = new Date();
    const updated = await prisma.eftVerification.update({
      where: { id },
      data: {
        status: body.action === "VERIFY" ? "VERIFIED" : "REJECTED",
        verifiedBy: body.action === "VERIFY" ? (scope.userId ?? null) : null,
        verifiedAt: body.action === "VERIFY" ? now : null,
        rejectedAt: body.action === "REJECT" ? now : null,
        rejectionReason: body.action === "REJECT" ? body.rejectionReason!.trim() : null
      }
    });

    // Fire-and-forget client email
    // Prefer primary contact email, fall back to billingEmail
    const clientEmail =
      verification.project.client.contacts[0]?.email ??
      verification.project.client.billingEmail ??
      null;
    if (clientEmail) {
      notifyClientEftDecision({
        clientEmail,
        action: body.action,
        referenceCode: verification.project.referenceCode,
        depositCents: Number(verification.project.budgetCents),
        rejectionReason: body.rejectionReason
      });
    }

    return { success: true, data: { status: updated.status } } as ApiResponse;
  });
}
