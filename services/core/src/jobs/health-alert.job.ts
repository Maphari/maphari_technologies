// ════════════════════════════════════════════════════════════════════════════
// health-alert.job.ts — Automated project health alert trigger
// Called on project PATCH when riskLevel or other health signals change.
// Publishes EventTopics.healthAlert when critical thresholds are breached.
// ════════════════════════════════════════════════════════════════════════════

import { EventTopics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import type { NatsEventBus } from "@maphari/platform";
import { prisma } from "../lib/prisma.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type HealthAlertType =
  | "risk_escalated"
  | "invoice_overdue"
  | "sprint_at_risk";

export type HealthAlertSeverity = "HIGH" | "CRITICAL";

export interface HealthAlertPayload {
  projectId:   string;
  clientId:    string;
  projectName: string;
  alertType:   HealthAlertType;
  severity:    HealthAlertSeverity;
}

interface ProjectSnapshot {
  id:              string;
  clientId:        string;
  name:            string;
  riskLevel:       string;
  dueAt:           Date | null;
  progressPercent: number;
}

interface UpdateData {
  riskLevel?: string;
  [key: string]: unknown;
}

// ── Invoice overdues helper ────────────────────────────────────────────────────
// Calls billing service to check for overdue invoices > 14 days.
const BILLING_SERVICE_URL =
  process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";

interface BillingInvoice {
  id:        string;
  clientId:  string;
  status:    string;
  dueAt:     string | null;
}

async function fetchOverdueInvoicesForClient(
  clientId: string,
  requestId: string
): Promise<BillingInvoice[]> {
  try {
    const response = await fetch(
      `${BILLING_SERVICE_URL}/invoices?status=OVERDUE`,
      {
        method: "GET",
        headers: {
          "content-type":  "application/json",
          "x-user-id":     "",
          "x-user-role":   "ADMIN",
          "x-client-id":   clientId,
          "x-request-id":  requestId,
          "x-trace-id":    requestId
        }
      }
    );
    const json = (await response.json()) as { success: boolean; data?: BillingInvoice[] };
    if (!json.success || !json.data) return [];
    return json.data.filter((inv) => inv.clientId === clientId && inv.status === "OVERDUE");
  } catch {
    return [];
  }
}

// ── Condition checks ──────────────────────────────────────────────────────────

function isRiskEscalated(
  previousRiskLevel: string,
  newRiskLevel: string | undefined
): { triggered: boolean; severity: HealthAlertSeverity } {
  const next = newRiskLevel ?? previousRiskLevel;
  if (next === "CRITICAL") return { triggered: true, severity: "CRITICAL" };
  if (next === "HIGH" && previousRiskLevel !== "HIGH" && previousRiskLevel !== "CRITICAL") {
    return { triggered: true, severity: "HIGH" };
  }
  return { triggered: false, severity: "HIGH" };
}

function isSprintAtRisk(project: ProjectSnapshot): boolean {
  if (!project.dueAt) return false;
  const daysToDeadline = Math.ceil(
    (project.dueAt.getTime() - Date.now()) / 86_400_000
  );
  const completionRate = project.progressPercent / 100;
  return daysToDeadline <= 7 && completionRate < 0.5;
}

function isInvoiceOverdue14Days(invoice: BillingInvoice): boolean {
  if (!invoice.dueAt) return false;
  const daysPastDue = Math.floor(
    (Date.now() - new Date(invoice.dueAt).getTime()) / 86_400_000
  );
  return daysPastDue > 14;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Called after a project PATCH. Inspects health signals and publishes
 * EventTopics.healthAlert if any critical threshold is breached.
 *
 * Non-throwing — failures are logged, not propagated, so the PATCH
 * response is never blocked by an alert failure.
 */
export async function checkAndPublishHealthAlert(
  project: ProjectSnapshot,
  updatedData: UpdateData,
  eventBus: NatsEventBus,
  options: { requestId?: string; traceId?: string } = {}
): Promise<void> {
  const requestId = options.requestId ?? randomUUID();
  const alerts: Array<{ alertType: HealthAlertType; severity: HealthAlertSeverity }> = [];

  try {
    // ── Condition 1: riskLevel escalated to HIGH or CRITICAL ─────────────────
    const riskCheck = isRiskEscalated(project.riskLevel, updatedData.riskLevel as string | undefined);
    if (riskCheck.triggered) {
      alerts.push({ alertType: "risk_escalated", severity: riskCheck.severity });
    }

    // ── Condition 2: Sprint completion < 50% with ≤7 days to deadline ────────
    const projectForSprintCheck: ProjectSnapshot = {
      ...project,
      riskLevel: (updatedData.riskLevel as string | undefined) ?? project.riskLevel,
      progressPercent: (updatedData.progressPercent as number | undefined) ?? project.progressPercent,
      dueAt: updatedData.dueAt !== undefined
        ? (updatedData.dueAt ? new Date(updatedData.dueAt as string) : null)
        : project.dueAt
    };
    if (isSprintAtRisk(projectForSprintCheck)) {
      alerts.push({ alertType: "sprint_at_risk", severity: "HIGH" });
    }

    // ── Condition 3: Overdue invoice > 14 days ───────────────────────────────
    const overdueInvoices = await fetchOverdueInvoicesForClient(project.clientId, requestId);
    const hasLongOverdue = overdueInvoices.some(isInvoiceOverdue14Days);
    if (hasLongOverdue) {
      alerts.push({ alertType: "invoice_overdue", severity: "HIGH" });
    }

    // ── Publish all triggered alerts ─────────────────────────────────────────
    for (const alert of alerts) {
      await eventBus.publish({
        eventId:     randomUUID(),
        occurredAt:  new Date().toISOString(),
        requestId,
        traceId:     options.traceId,
        topic:       EventTopics.healthAlert,
        payload: {
          projectId:   project.id,
          clientId:    project.clientId,
          projectName: project.name,
          alertType:   alert.alertType,
          severity:    alert.severity
        } satisfies HealthAlertPayload
      });
    }
  } catch (err) {
    // Non-fatal — health alerts must never block core PATCH responses
    console.error("[health-alert.job] Failed to evaluate or publish health alert:", err);
  }
}

// ── Sprint active check (for cron-style external use) ─────────────────────────

/**
 * Scans all active projects and publishes health alerts for any at risk.
 * Intended for use in a scheduled daily job context (not tied to a PATCH).
 */
export async function scanAndPublishAllHealthAlerts(
  eventBus: NatsEventBus
): Promise<void> {
  const projects = await prisma.project.findMany({
    where: {
      status: { notIn: ["COMPLETED", "ARCHIVED"] }
    },
    select: {
      id:              true,
      clientId:        true,
      name:            true,
      riskLevel:       true,
      dueAt:           true,
      progressPercent: true
    }
  });

  for (const project of projects) {
    await checkAndPublishHealthAlert(project, {}, eventBus);
  }
}
