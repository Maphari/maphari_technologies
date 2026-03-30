// ════════════════════════════════════════════════════════════════════════════
// contracts.ts — Client contract routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : CLIENT read-own + sign; STAFF/ADMIN full CRUD
//
// Endpoints:
//   GET    /contracts                → list (scoped by clientId)
//   GET    /contract-templates       → list available templates
//   GET    /contract-templates/:id   → preview rendered HTML
//   POST   /contracts                → create (STAFF/ADMIN)
//   POST   /contracts/generate       → generate from template (STAFF/ADMIN)
//   PATCH  /contracts/:id            → update / sign / attach file
//   DELETE /contracts/:id            → soft-delete (ADMIN only)
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import type { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { writeAuditEvent, writeAuditEventAndDispatch } from "../lib/audit.js";

// ── Legal document templates (South African law) ──────────────────────────────

const CONTRACT_TEMPLATES: Array<{
  id: string;
  type: "NDA" | "SOW" | "MSA" | "CHANGE_ORDER" | "RETAINER";
  title: string;
  description: string;
  variables: string[]; // placeholders that get replaced when generating
  htmlContent: (vars: Record<string, string>) => string;
}> = [
  {
    id: "nda-standard-za",
    type: "NDA",
    title: "Non-Disclosure Agreement",
    description: "Standard mutual NDA governed by South African law.",
    variables: ["CLIENT_NAME", "CLIENT_REG_NUMBER", "PROJECT_NAME", "EFFECTIVE_DATE"],
    htmlContent: (v) => `
<div style="font-family: Georgia, serif; max-width: 720px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.7;">
  <h1 style="text-align:center; font-size:22px; font-weight:700; letter-spacing:1px; margin-bottom:4px;">NON-DISCLOSURE AGREEMENT</h1>
  <p style="text-align:center; color:#666; font-size:13px; margin-bottom:32px;">Effective Date: ${v.EFFECTIVE_DATE || "[DATE]"}</p>

  <p><strong>This Non-Disclosure Agreement ("Agreement")</strong> is entered into as of <strong>${v.EFFECTIVE_DATE || "[DATE]"}</strong> between:</p>

  <div style="background:#f9f9f9; border-left:3px solid #c8f135; padding:16px 20px; margin:20px 0; border-radius:4px;">
    <p style="margin:0;"><strong>Maphari Technologies (Pty) Ltd</strong><br>
    Registration No. [MAPHARI_REG]<br>
    Registered in the Republic of South Africa<br>
    ("Maphari Technologies")</p>
  </div>

  <div style="background:#f9f9f9; border-left:3px solid #8b6fff; padding:16px 20px; margin:20px 0; border-radius:4px;">
    <p style="margin:0;"><strong>${v.CLIENT_NAME || "[CLIENT NAME]"}</strong><br>
    ${v.CLIENT_REG_NUMBER ? `Registration No. ${v.CLIENT_REG_NUMBER}<br>` : ""}
    ("Client")</p>
  </div>

  <p>Collectively referred to as the "Parties" and each individually as a "Party".</p>

  <h2 style="font-size:16px; margin-top:28px;">1. PURPOSE</h2>
  <p>The Parties wish to explore a business relationship in connection with <strong>${v.PROJECT_NAME || "[PROJECT NAME]"}</strong> (the "Purpose"), and in connection with the Purpose, each Party may disclose to the other certain Confidential Information.</p>

  <h2 style="font-size:16px; margin-top:28px;">2. DEFINITION OF CONFIDENTIAL INFORMATION</h2>
  <p>"Confidential Information" means any information disclosed by one Party ("Disclosing Party") to the other Party ("Receiving Party"), either directly or indirectly, in writing, orally, or by inspection of tangible objects, which is designated as "Confidential," "Proprietary," or some similar designation, or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.</p>
  <p>Confidential Information includes, without limitation: technical data, trade secrets, know-how, research, product plans, products, services, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, marketing, finances, and other business information.</p>

  <h2 style="font-size:16px; margin-top:28px;">3. OBLIGATIONS</h2>
  <p>Each Receiving Party agrees to:</p>
  <ol style="padding-left:20px;">
    <li style="margin-bottom:8px;">Hold all Confidential Information in strict confidence;</li>
    <li style="margin-bottom:8px;">Not disclose Confidential Information to any third party without the prior written consent of the Disclosing Party;</li>
    <li style="margin-bottom:8px;">Use Confidential Information solely for the Purpose;</li>
    <li style="margin-bottom:8px;">Protect the Confidential Information with at least the same degree of care used to protect its own confidential information, but in no event less than reasonable care;</li>
    <li style="margin-bottom:8px;">Promptly notify the Disclosing Party upon discovery of any unauthorised use or disclosure of Confidential Information.</li>
  </ol>

  <h2 style="font-size:16px; margin-top:28px;">4. EXCLUSIONS</h2>
  <p>The obligations of confidentiality shall not apply to information that:</p>
  <ol type="a" style="padding-left:20px;">
    <li style="margin-bottom:6px;">Is or becomes publicly known through no wrongful act of the Receiving Party;</li>
    <li style="margin-bottom:6px;">Was rightfully known to the Receiving Party before disclosure;</li>
    <li style="margin-bottom:6px;">Is rightfully received by the Receiving Party from a third party without restriction;</li>
    <li style="margin-bottom:6px;">Is independently developed by the Receiving Party without use of or reference to the Confidential Information;</li>
    <li style="margin-bottom:6px;">Is required to be disclosed by law, provided that the Receiving Party gives reasonable prior notice to the Disclosing Party.</li>
  </ol>

  <h2 style="font-size:16px; margin-top:28px;">5. TERM</h2>
  <p>This Agreement shall remain in effect for a period of <strong>two (2) years</strong> from the Effective Date, unless earlier terminated by mutual written agreement of the Parties. The obligations under this Agreement survive termination with respect to Confidential Information disclosed prior to termination.</p>

  <h2 style="font-size:16px; margin-top:28px;">6. INTELLECTUAL PROPERTY</h2>
  <p>Nothing in this Agreement grants either Party any rights in or to the other Party's Confidential Information except as expressly set forth herein. All Confidential Information remains the sole property of the Disclosing Party.</p>

  <h2 style="font-size:16px; margin-top:28px;">7. RETURN OF INFORMATION</h2>
  <p>Upon the written request of the Disclosing Party, the Receiving Party shall promptly return or destroy all tangible materials containing or embodying the Confidential Information.</p>

  <h2 style="font-size:16px; margin-top:28px;">8. GOVERNING LAW AND JURISDICTION</h2>
  <p>This Agreement shall be governed by and construed in accordance with the laws of the <strong>Republic of South Africa</strong>. Each Party irrevocably submits to the exclusive jurisdiction of the <strong>Gauteng Division of the High Court of South Africa</strong> for any dispute arising out of or in connection with this Agreement.</p>

  <h2 style="font-size:16px; margin-top:28px;">9. ENTIRE AGREEMENT</h2>
  <p>This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous negotiations, representations, and agreements.</p>

  <div style="margin-top:48px; display:grid; grid-template-columns:1fr 1fr; gap:40px;">
    <div>
      <p style="font-weight:700; margin-bottom:4px;">MAPHARI TECHNOLOGIES (PTY) LTD</p>
      <div style="border-bottom:1px solid #333; height:40px; margin-bottom:6px;"></div>
      <p style="font-size:12px; color:#666;">Authorised Signatory &amp; Date</p>
    </div>
    <div>
      <p style="font-weight:700; margin-bottom:4px;">${v.CLIENT_NAME || "[CLIENT NAME]"}</p>
      <div style="border-bottom:1px solid #333; height:40px; margin-bottom:6px;"></div>
      <p style="font-size:12px; color:#666;">Authorised Signatory &amp; Date</p>
    </div>
  </div>
</div>`,
  },
  {
    id: "sow-standard",
    type: "SOW",
    title: "Statement of Work",
    description: "Project-specific Statement of Work including deliverables and payment schedule.",
    variables: ["CLIENT_NAME", "PROJECT_NAME", "PROJECT_DESCRIPTION", "BUDGET_TOTAL", "START_DATE", "DUE_DATE", "EFFECTIVE_DATE"],
    htmlContent: (v) => `
<div style="font-family: Georgia, serif; max-width: 720px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.7;">
  <h1 style="text-align:center; font-size:22px; font-weight:700; letter-spacing:1px; margin-bottom:4px;">STATEMENT OF WORK</h1>
  <p style="text-align:center; color:#666; font-size:13px; margin-bottom:32px;">Effective Date: ${v.EFFECTIVE_DATE || "[DATE]"}</p>

  <div style="background:#f9f9f9; border:1px solid #e0e0e0; padding:20px; border-radius:6px; margin-bottom:28px;">
    <table style="width:100%; font-size:14px; border-collapse:collapse;">
      <tr><td style="padding:4px 0; color:#666; width:180px;">Client:</td><td style="font-weight:600;">${v.CLIENT_NAME || "[CLIENT NAME]"}</td></tr>
      <tr><td style="padding:4px 0; color:#666;">Project Name:</td><td style="font-weight:600;">${v.PROJECT_NAME || "[PROJECT NAME]"}</td></tr>
      <tr><td style="padding:4px 0; color:#666;">Service Provider:</td><td style="font-weight:600;">Maphari Technologies (Pty) Ltd</td></tr>
      <tr><td style="padding:4px 0; color:#666;">Project Value:</td><td style="font-weight:600;">${v.BUDGET_TOTAL || "[AMOUNT]"}</td></tr>
      <tr><td style="padding:4px 0; color:#666;">Start Date:</td><td>${v.START_DATE || "[START DATE]"}</td></tr>
      <tr><td style="padding:4px 0; color:#666;">Target Completion:</td><td>${v.DUE_DATE || "[DUE DATE]"}</td></tr>
    </table>
  </div>

  <h2 style="font-size:16px; margin-top:28px;">1. PROJECT OVERVIEW</h2>
  <p>${v.PROJECT_DESCRIPTION || "[PROJECT DESCRIPTION]"}</p>

  <h2 style="font-size:16px; margin-top:28px;">2. SCOPE OF WORK</h2>
  <p>Maphari Technologies agrees to deliver the services described in this Statement of Work. The scope includes all development, design, testing, and deployment activities required to deliver the agreed deliverables. Any work outside this defined scope shall be subject to a formal Change Request.</p>

  <h2 style="font-size:16px; margin-top:28px;">3. PAYMENT SCHEDULE</h2>
  <div style="background:#f9f9f9; border:1px solid #e0e0e0; border-radius:6px; overflow:hidden; margin:16px 0;">
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <thead><tr style="background:#1a1a1a; color:#fff;">
        <th style="padding:10px 16px; text-align:left;">Milestone</th>
        <th style="padding:10px 16px; text-align:left;">When Due</th>
        <th style="padding:10px 16px; text-align:right;">Amount</th>
      </tr></thead>
      <tbody>
        <tr style="border-bottom:1px solid #e0e0e0;"><td style="padding:10px 16px;">50% Deposit</td><td style="padding:10px 16px;">Upon project commencement</td><td style="padding:10px 16px; text-align:right; font-weight:600;">50% of total</td></tr>
        <tr style="border-bottom:1px solid #e0e0e0;"><td style="padding:10px 16px;">30% Milestone</td><td style="padding:10px 16px;">Upon milestone delivery &amp; approval</td><td style="padding:10px 16px; text-align:right; font-weight:600;">30% of total</td></tr>
        <tr><td style="padding:10px 16px;">20% Final</td><td style="padding:10px 16px;">Upon final delivery &amp; handover</td><td style="padding:10px 16px; text-align:right; font-weight:600;">20% of total</td></tr>
      </tbody>
    </table>
  </div>
  <p>All payments are due within <strong>14 days</strong> of invoice date. Late payments attract interest at <strong>prime + 2%</strong> per annum.</p>

  <h2 style="font-size:16px; margin-top:28px;">4. CHANGE REQUESTS</h2>
  <p>Any changes to the agreed scope must be submitted via a formal Change Request through the client portal. Approved Change Requests may affect timeline and cost. No out-of-scope work will commence without a signed Change Order.</p>

  <h2 style="font-size:16px; margin-top:28px;">5. INTELLECTUAL PROPERTY</h2>
  <p>Upon receipt of all payments due under this agreement, all intellectual property rights in the deliverables shall vest in the Client. Until full payment is received, all work product remains the sole property of Maphari Technologies.</p>

  <h2 style="font-size:16px; margin-top:28px;">6. CONFIDENTIALITY</h2>
  <p>Both Parties agree to keep all project-related information confidential, consistent with the terms of any Non-Disclosure Agreement between the Parties. Where no separate NDA exists, this clause shall serve as the confidentiality undertaking.</p>

  <h2 style="font-size:16px; margin-top:28px;">7. WARRANTIES</h2>
  <p>Maphari Technologies warrants that: (a) the services will be performed in a professional and workmanlike manner; (b) the deliverables will substantially conform to the agreed specifications for a period of <strong>30 days</strong> post-delivery. Bug fixes falling within this warranty period will be addressed at no additional cost.</p>

  <h2 style="font-size:16px; margin-top:28px;">8. LIMITATION OF LIABILITY</h2>
  <p>To the maximum extent permitted by South African law, Maphari Technologies' total liability for any claims arising from this SOW shall not exceed the total fees paid by the Client under this SOW during the six (6) months preceding the claim.</p>

  <h2 style="font-size:16px; margin-top:28px;">9. TERMINATION</h2>
  <p>Either Party may terminate this SOW with <strong>30 days' written notice</strong>. Upon termination, the Client shall pay for all work completed to date on a pro-rata basis. Deposits are non-refundable unless termination is due to Maphari Technologies' material breach.</p>

  <h2 style="font-size:16px; margin-top:28px;">10. GOVERNING LAW</h2>
  <p>This Agreement is governed by the laws of the Republic of South Africa. Disputes shall be resolved by mediation in Johannesburg before referral to the Gauteng Division of the High Court.</p>

  <div style="margin-top:48px; display:grid; grid-template-columns:1fr 1fr; gap:40px;">
    <div>
      <p style="font-weight:700; margin-bottom:4px;">MAPHARI TECHNOLOGIES (PTY) LTD</p>
      <div style="border-bottom:1px solid #333; height:40px; margin-bottom:6px;"></div>
      <p style="font-size:12px; color:#666;">Authorised Signatory &amp; Date</p>
    </div>
    <div>
      <p style="font-weight:700; margin-bottom:4px;">${v.CLIENT_NAME || "[CLIENT NAME]"}</p>
      <div style="border-bottom:1px solid #333; height:40px; margin-bottom:6px;"></div>
      <p style="font-size:12px; color:#666;">Authorised Signatory &amp; Date</p>
    </div>
  </div>
</div>`,
  },
  {
    id: "msa-standard-za",
    type: "MSA",
    title: "Master Service Agreement",
    description: "Framework agreement for ongoing services.",
    variables: ["CLIENT_NAME", "EFFECTIVE_DATE"],
    htmlContent: (v) => `
<div style="font-family: Georgia, serif; max-width: 720px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.7;">
  <h1 style="text-align:center; font-size:22px; font-weight:700; letter-spacing:1px; margin-bottom:4px;">MASTER SERVICE AGREEMENT</h1>
  <p style="text-align:center; color:#666; font-size:13px; margin-bottom:32px;">Effective Date: ${v.EFFECTIVE_DATE || "[DATE]"}</p>
  <p>This Master Service Agreement ("MSA") is between <strong>Maphari Technologies (Pty) Ltd</strong> ("Service Provider") and <strong>${v.CLIENT_NAME || "[CLIENT NAME]"}</strong> ("Client").</p>
  <h2 style="font-size:16px; margin-top:28px;">1. SERVICES</h2>
  <p>Service Provider will provide technology and digital services as described in individual Statements of Work ("SOWs") issued under this MSA. Each SOW is incorporated herein by reference.</p>
  <h2 style="font-size:16px; margin-top:28px;">2. PAYMENT TERMS</h2>
  <p>Invoices are payable within 14 days of issuance. Late payments attract interest at prime rate + 2% per annum. Service Provider reserves the right to suspend services upon 5 business days' notice if invoices remain unpaid beyond 30 days.</p>
  <h2 style="font-size:16px; margin-top:28px;">3. INTELLECTUAL PROPERTY</h2>
  <p>All deliverables created specifically for Client under a SOW vest in Client upon full payment. Pre-existing IP and tools remain with Service Provider.</p>
  <h2 style="font-size:16px; margin-top:28px;">4. CONFIDENTIALITY</h2>
  <p>Both parties agree to maintain the confidentiality of the other's proprietary information for the duration of the agreement and two (2) years thereafter.</p>
  <h2 style="font-size:16px; margin-top:28px;">5. LIMITATION OF LIABILITY</h2>
  <p>Neither party shall be liable for indirect, incidental, or consequential damages. Service Provider's aggregate liability is limited to fees paid in the preceding 6 months.</p>
  <h2 style="font-size:16px; margin-top:28px;">6. TERM AND TERMINATION</h2>
  <p>This MSA remains in effect until terminated by either party with 30 days' written notice, or immediately upon material breach. Active SOWs continue to their stated end unless separately terminated.</p>
  <h2 style="font-size:16px; margin-top:28px;">7. GOVERNING LAW</h2>
  <p>Governed by the laws of the Republic of South Africa. Exclusive jurisdiction: Gauteng Division of the High Court.</p>
  <div style="margin-top:48px; display:grid; grid-template-columns:1fr 1fr; gap:40px;">
    <div><p style="font-weight:700; margin-bottom:4px;">MAPHARI TECHNOLOGIES (PTY) LTD</p><div style="border-bottom:1px solid #333; height:40px; margin-bottom:6px;"></div><p style="font-size:12px; color:#666;">Authorised Signatory &amp; Date</p></div>
    <div><p style="font-weight:700; margin-bottom:4px;">${v.CLIENT_NAME || "[CLIENT NAME]"}</p><div style="border-bottom:1px solid #333; height:40px; margin-bottom:6px;"></div><p style="font-size:12px; color:#666;">Authorised Signatory &amp; Date</p></div>
  </div>
</div>`,
  },
];

function resolveContractProjectId(contract: { notes?: string | null } & Record<string, unknown>): string | null {
  const directProjectId = typeof contract.projectId === "string" ? contract.projectId : null;
  if (directProjectId) return directProjectId;
  if (typeof contract.notes !== "string" || !contract.notes.trim()) return null;
  try {
    const parsed = JSON.parse(contract.notes) as Record<string, unknown>;
    return typeof parsed.projectId === "string" ? parsed.projectId : null;
  } catch {
    return null;
  }
}

// ── Route registration ────────────────────────────────────────────────────────

export async function registerContractRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /contracts ─────────────────────────────────────────────────────────
  app.get("/contracts", async (request) => {
    const scope          = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    const query = (request.query as Record<string, string>) ?? {};
    const projectId = typeof query.projectId === "string" ? query.projectId : null;
    const where = projectId
      ? {
          ...(scopedClientId ? { clientId: scopedClientId } : {}),
          OR: [
            { projectId },
            { notes: { contains: "\"projectId\":\"" + projectId + "\"" } },
          ],
        }
      : {
          ...(scopedClientId ? { clientId: scopedClientId } : {}),
        };
    const cacheKey = CacheKeys.contracts(scopedClientId ?? "all") + ":" + (projectId ?? "all");

    const data = await withCache(cacheKey, 120, () =>
      prisma.clientContract.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /contract-templates ───────────────────────────────────────────────
  app.get("/contract-templates", async (request) => {
    const scope = readScopeHeaders(request);
    return {
      success: true,
      data: CONTRACT_TEMPLATES.map(({ id, type, title, description, variables }) => ({
        id, type, title, description, variables,
      })),
      meta: { requestId: scope.requestId },
    };
  });

  // ── GET /contract-templates/:id ───────────────────────────────────────────
  app.get<{ Params: { id: string }; Querystring: Record<string, string> }>(
    "/contract-templates/:id",
    async (request, reply) => {
      const scope = readScopeHeaders(request);
      const template = CONTRACT_TEMPLATES.find((t) => t.id === request.params.id);
      if (!template) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Template not found" } };
      }
      // Merge query params as template variables
      const vars: Record<string, string> = { ...request.query };
      const html = template.htmlContent(vars);
      return {
        success: true,
        data: { id: template.id, type: template.type, title: template.title, description: template.description, variables: template.variables, renderedHtml: html },
        meta: { requestId: scope.requestId },
      };
    }
  );

  // ── POST /contracts ────────────────────────────────────────────────────────
  app.post("/contracts", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot create contracts." } } as ApiResponse;
    }

    const body = request.body as {
      clientId: string;
      projectId?: string;
      title: string;
      type?: string;
      ref?: string;
      fileId?: string;
      storageKey?: string;
      mimeType?: string;
      sizeBytes?: number;
      notes?: string;
      sortOrder?: number;
    };

    if (!body.clientId || !body.title) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId and title are required." } } as ApiResponse;
    }

    try {
      const contract = await prisma.clientContract.create({
        data: {
          clientId:   body.clientId,
          projectId:  body.projectId ?? null,
          title:      body.title,
          type:       body.type       ?? "CONTRACT",
          ref:        body.ref        ?? null,
          fileId:     body.fileId     ?? null,
          storageKey: body.storageKey ?? null,
          mimeType:   body.mimeType   ?? null,
          sizeBytes:  body.sizeBytes  ?? null,
          notes:      body.notes      ?? null,
          sortOrder:  body.sortOrder  ?? 0,
        } as Prisma.ClientContractUncheckedCreateInput
      });

      await cache.delete(CacheKeys.contracts(body.clientId));
      if (body.projectId) await cache.delete(CacheKeys.contracts(body.clientId) + ":" + body.projectId);
      await cache.delete(CacheKeys.contracts("all"));

      writeAuditEvent({
        actorId:      scope.userId,
        actorRole:    scope.role,
        action:       "CONTRACT_CREATED",
        resourceType: "Contract",
        resourceId:   contract.id,
      });

      reply.status(201);
      return { success: true, data: contract, meta: { requestId: scope.requestId } } as ApiResponse<typeof contract>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CONTRACT_CREATE_FAILED", message: "Unable to create contract." } } as ApiResponse;
    }
  });

  // ── POST /contracts/generate ──────────────────────────────────────────────
  // Generate a contract instance from a template + project data, save to DB
  app.post<{
    Body: {
      templateId: string;
      clientId: string;
      projectId?: string;
      variables?: Record<string, string>;
    };
  }>("/contracts/generate", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin or staff role required." } };
    }
    const { templateId, clientId, projectId, variables = {} } = request.body ?? ({} as {
      templateId: string;
      clientId: string;
      projectId?: string;
      variables?: Record<string, string>;
    });
    if (!templateId || !clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "templateId and clientId are required." } };
    }
    const template = CONTRACT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      reply.status(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Template not found." } };
    }
    try {
      const contract = await prisma.clientContract.create({
        data: {
          clientId,
          projectId: projectId ?? null,
          title: template.title,
          type: template.type,
          status: "PENDING",
          signed: false,
          notes: JSON.stringify({ templateId, projectId: projectId ?? null, variables }),
        } as Prisma.ClientContractUncheckedCreateInput,
      });
      await cache.delete(CacheKeys.contracts(clientId));
      if (projectId) await cache.delete(CacheKeys.contracts(clientId) + ":" + projectId);
      writeAuditEvent({
        actorId:      scope.userId,
        actorRole:    scope.role,
        action:       "CONTRACT_CREATED",
        resourceType: "Contract",
        resourceId:   contract.id,
      });
      return {
        success: true,
        data: contract,
        meta: { requestId: scope.requestId },
      };
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "GENERATE_FAILED", message: "Failed to generate contract." } };
    }
  });

  // ── PATCH /contracts/:id ───────────────────────────────────────────────────
  app.patch("/contracts/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };
    const body  = request.body as {
      title?:        string;
      type?:         string;
      ref?:          string;
      status?:       string;
      signed?:       boolean;
      signedAt?:     string;
      signedByName?: string;
      fileId?:       string;
      storageKey?:   string;
      mimeType?:     string;
      sizeBytes?:    number;
      notes?:        string;
    };

    try {
      const existing = await prisma.clientContract.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Contract not found." } } as ApiResponse;
      }

      // CLIENT can only sign their own contracts (set signed=true / signedAt / signedByName)
      if (scope.role === "CLIENT") {
        if (existing.clientId !== scope.clientId) {
          reply.status(403);
          return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
        }
        // Clients may only update signed + signedAt + signedByName
        const clientUpdate: { signed?: boolean; signedAt?: Date; signedByName?: string; status?: string } = {};
        if (body.signed !== undefined) {
          clientUpdate.signed    = body.signed;
          clientUpdate.signedAt  = body.signed ? new Date() : undefined;
          clientUpdate.status    = body.signed ? "SIGNED" : "PENDING";
          if (body.signed && body.signedByName) {
            clientUpdate.signedByName = body.signedByName;
          }
        }
        const updated = await prisma.clientContract.update({ where: { id }, data: clientUpdate });
        await cache.delete(CacheKeys.contracts(existing.clientId));
        {
          const existingProjectId = resolveContractProjectId(existing as Record<string, unknown> & { notes?: string | null });
          if (existingProjectId) await cache.delete(CacheKeys.contracts(existing.clientId) + ":" + existingProjectId);
        }
        if (body.signed) {
          writeAuditEventAndDispatch({
            actorId:      scope.userId,
            actorRole:    scope.role,
            action:       "CONTRACT_SIGNED",
            resourceType: "Contract",
            resourceId:   id,
            details:      `Signed by ${body.signedByName ?? scope.userId}`,
          });
        }
        return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
      }

      // Staff / Admin — full update
      const updateData: Record<string, unknown> = {};
      if (body.title      !== undefined) updateData.title      = body.title;
      if (body.type       !== undefined) updateData.type       = body.type;
      if (body.ref        !== undefined) updateData.ref        = body.ref;
      if (body.status     !== undefined) updateData.status     = body.status;
      if (body.signed     !== undefined) {
        updateData.signed   = body.signed;
        updateData.signedAt = body.signed ? (body.signedAt ? new Date(body.signedAt) : new Date()) : null;
        if (!body.status) updateData.status = body.signed ? "SIGNED" : "PENDING";
      }
      if (body.signedByName !== undefined) updateData.signedByName = body.signedByName ?? existing.signedByName;
      if (body.fileId     !== undefined) updateData.fileId     = body.fileId;
      if (body.storageKey !== undefined) updateData.storageKey = body.storageKey;
      if (body.mimeType   !== undefined) updateData.mimeType   = body.mimeType;
      if (body.sizeBytes  !== undefined) updateData.sizeBytes  = body.sizeBytes;
      if (body.notes      !== undefined) updateData.notes      = body.notes;

      const updated = await prisma.clientContract.update({ where: { id }, data: updateData });
      await cache.delete(CacheKeys.contracts(existing.clientId));
      {
        const existingProjectId = resolveContractProjectId(existing as Record<string, unknown> & { notes?: string | null });
        if (existingProjectId) await cache.delete(CacheKeys.contracts(existing.clientId) + ":" + existingProjectId);
      }
      await cache.delete(CacheKeys.contracts("all"));

      if (body.signed) {
        writeAuditEventAndDispatch({
          actorId:      scope.userId,
          actorRole:    scope.role,
          action:       "CONTRACT_SIGNED",
          resourceType: "Contract",
          resourceId:   id,
          details:      `Signed by ${body.signedByName ?? scope.userId}`,
        });
      }

      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CONTRACT_UPDATE_FAILED", message: "Unable to update contract." } } as ApiResponse;
    }
  });

  // ── POST /contracts/:id/sign ─────────────────────────────────────────────────
  // Canvas e-signature endpoint: stores signature PNG data URL + marks contract signed
  app.post<{
    Params: { id: string };
    Body: { signerName: string; signatureDataUrl: string };
  }>("/contracts/:id/sign", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params;
    const { signerName, signatureDataUrl } = request.body ?? {} as { signerName: string; signatureDataUrl: string };

    if (!signerName || !signatureDataUrl) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "signerName and signatureDataUrl are required." } } as ApiResponse;
    }

    try {
      const existing = await prisma.clientContract.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Contract not found." } } as ApiResponse;
      }

      // Clients may only sign their own contracts
      if (scope.role === "CLIENT" && existing.clientId !== scope.clientId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
      }

      // Merge signatureDataUrl into the notes JSON (preserve existing template metadata)
      let existingNotes: Record<string, unknown> = {};
      try {
        existingNotes = JSON.parse(existing.notes ?? "{}") as Record<string, unknown>;
      } catch {
        // ignore parse errors
      }
      const updatedNotes = JSON.stringify({ ...existingNotes, signatureDataUrl });

      const updated = await prisma.clientContract.update({
        where: { id },
        data: {
          signed:       true,
          signedAt:     new Date(),
          signedByName: signerName,
          status:       "SIGNED",
          notes:        updatedNotes,
        },
      });

      await cache.delete(CacheKeys.contracts(existing.clientId));
      {
        const existingProjectId = resolveContractProjectId(existing as Record<string, unknown> & { notes?: string | null });
        if (existingProjectId) await cache.delete(CacheKeys.contracts(existing.clientId) + ":" + existingProjectId);
      }
      await cache.delete(CacheKeys.contracts("all"));

      writeAuditEventAndDispatch({
        actorId:      scope.userId,
        actorRole:    scope.role,
        action:       "CONTRACT_SIGNED",
        resourceType: "Contract",
        resourceId:   id,
        details:      `Signed by ${signerName}`,
      });

      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "CONTRACT_SIGN_FAILED", message: "Unable to sign contract." } } as ApiResponse;
    }
  });

  // ── GET /contracts/:id/download ─────────────────────────────────────────────
  // Returns { fileId } so the gateway/frontend can fetch a presigned download URL
  app.get("/contracts/:id/download", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };

    try {
      const contract = await prisma.clientContract.findUnique({ where: { id } });
      if (!contract) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Contract not found." } } as ApiResponse;
      }
      if (scope.role === "CLIENT" && contract.clientId !== scope.clientId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
      }
      if (!contract.fileId) {
        reply.status(404);
        return { success: false, error: { code: "NO_FILE", message: "No file attached to this contract." } } as ApiResponse;
      }

      return { success: true, data: { fileId: contract.fileId }, meta: { requestId: scope.requestId } } as ApiResponse<{ fileId: string }>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CONTRACT_DOWNLOAD_FAILED", message: "Unable to get contract file." } } as ApiResponse;
    }
  });

  // ── POST /contracts/:id/renewal-proposals ─────────────────────────────────
  app.post("/contracts/:id/renewal-proposals", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can create renewal proposals." } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as { adminId?: string; proposedTerms?: unknown };

    try {
      const contract = await prisma.clientContract.findUnique({ where: { id } });
      if (!contract) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Contract not found." } } as ApiResponse;
      }

      const proposal = await prisma.contractRenewalProposal.create({
        data: {
          contractId: id,
          sentByAdminId: body.adminId ?? scope.userId ?? null,
          proposedTerms: body.proposedTerms ? (body.proposedTerms as object) : undefined,
        }
      });

      return { success: true, data: proposal, meta: { requestId: scope.requestId } } as ApiResponse<typeof proposal>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "RENEWAL_PROPOSAL_CREATE_FAILED", message: "Unable to create renewal proposal." } } as ApiResponse;
    }
  });

  // ── GET /contracts/:id/renewal-proposals ──────────────────────────────────
  app.get("/contracts/:id/renewal-proposals", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
    }

    const { id } = request.params as { id: string };

    try {
      const proposals = await prisma.contractRenewalProposal.findMany({
        where: { contractId: id },
        orderBy: { createdAt: "desc" }
      });

      return { success: true, data: proposals, meta: { requestId: scope.requestId } } as ApiResponse<typeof proposals>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "RENEWAL_PROPOSALS_FETCH_FAILED", message: "Unable to fetch renewal proposals." } } as ApiResponse;
    }
  });
}
