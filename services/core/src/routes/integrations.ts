// ════════════════════════════════════════════════════════════════════════════
// integrations.ts — Portal integrations catalog route
// Service : core  |  Scope: CLIENT read own; STAFF/ADMIN full access
// Note    : Returns static catalog until an Integration Prisma model is added.
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

export interface IntegrationOption {
  provider: string;
  label: string;
  category: string;
  status: "connected" | "not_connected";
  connectedAt: string | null;
}

const INTEGRATION_CATALOG: Omit<IntegrationOption, "status" | "connectedAt">[] = [
  { provider: "slack",       label: "Slack",         category: "communication" },
  { provider: "google_meet", label: "Google Meet",   category: "video" },
  { provider: "zoom",        label: "Zoom",          category: "video" },
  { provider: "github",      label: "GitHub",        category: "development" },
  { provider: "figma",       label: "Figma",         category: "design" },
  { provider: "notion",      label: "Notion",        category: "productivity" },
  { provider: "hubspot",     label: "HubSpot",       category: "crm" },
  { provider: "stripe",      label: "Stripe",        category: "billing" },
];

export async function registerIntegrationRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /portal/settings/integrations ────────────────────────────────────
  app.get("/portal/settings/integrations", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (!scopedClientId) {
      return reply.status(400).send({ success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse);
    }

    const data: IntegrationOption[] = INTEGRATION_CATALOG.map((item) => ({
      ...item,
      status: "not_connected",
      connectedAt: null,
    }));

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<IntegrationOption[]>;
  });
}
