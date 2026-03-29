// ════════════════════════════════════════════════════════════════════════════
// invoices-page.tsx — Admin Financial Control page
// Data sources: loadAdminSnapshotWithRefresh (invoices + client names + projects)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin";
import type { AdminInvoice, AdminClient, AdminProject } from "../../../../lib/api/admin";
import { createInvoiceWithRefresh, updateInvoiceWithRefresh, createPaymentWithRefresh, triggerInvoiceChaseWithRefresh, loadOverdueChaseStatusWithRefresh } from "../../../../lib/api/admin/billing";
import type { OverdueInvoice } from "../../../../lib/api/admin/billing";
import { queueAutomationJobWithRefresh } from "../../../../lib/api/admin/automation";
import { callGateway, isUnauthorized, withAuthorizedSession } from "../../../../lib/api/admin/_shared";
import { cx, styles } from "../style";
import { AutomationBanner } from "../../../shared/automation-banner";
import { colorClass, toneClass } from "./admin-page-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "invoices" | "tax config";
const tabs: Tab[] = ["invoices", "tax config"];

type MilestoneStage = "MILESTONE_30" | "FINAL_20";

// Runtime invoices may carry projectId + description from the gateway even
// though the shared type doesn't declare them yet.
type AdminInvoiceEx = AdminInvoice & {
  projectId?: string | null;
  description?: string | null;
};

const statusColors: Record<string, string> = {
  DRAFT: "var(--muted)",
  ISSUED: "var(--blue)",
  PAID: "var(--accent)",
  OVERDUE: "var(--red)",
  VOID: "var(--muted)",
  pending: "var(--amber)",
  overdue: "var(--red)",
  paid: "var(--accent)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function daysDiff(iso: string | null): number {
  if (!iso) return 0;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.round((d.getTime() - Date.now()) / 86_400_000);
}

function isoDatePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function computeEscalationLevel(daysOverdue: number): 0 | 1 | 2 | 3 {
  if (daysOverdue <= 0) return 0;
  if (daysOverdue < 14) return 1;
  if (daysOverdue < 30) return 2;
  return 3;
}

const ESCALATION_LABELS: Record<1 | 2 | 3, string> = {
  1: "Gentle",
  2: "Firm",
  3: "Director",
};

function detectStage(description: string | null | undefined): MilestoneStage | null {
  if (!description) return null;
  if (description.includes("MILESTONE_30")) return "MILESTONE_30";
  if (description.includes("FINAL_20")) return "FINAL_20";
  return null;
}

function buildInvoiceNumber(projectId: string, stage: MilestoneStage): string {
  const suffix = stage === "MILESTONE_30" ? "M30" : "F20";
  return `INV-${projectId.slice(0, 6).toUpperCase()}-${suffix}-${Date.now().toString().slice(-4)}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ").toLowerCase();
  const color = statusColors[status] ?? "var(--muted)";
  return (
    <span className={cx(styles.invcStatusBadge, toneClass(color))}>{label}</span>
  );
}

function StageBadge({ description }: { description: string | null | undefined }) {
  const stage = detectStage(description);
  if (!stage) return null;
  if (stage === "MILESTONE_30") {
    return <span className={cx(styles.badge, styles.badgePurple)}>30% Milestone</span>;
  }
  return <span className={cx(styles.badge, styles.badgeGreen)}>20% Final</span>;
}

// ── Tax config (static — no backend API yet) ──────────────────────────────────

const taxItems = [
  { label: "VAT Registration", value: "4680123456", status: "ACTIVE" },
  { label: "Income Tax Ref.", value: "9012/345/12/3", status: "ACTIVE" },
  { label: "PAYE Reference", value: "7123456789", status: "ACTIVE" },
  { label: "UIF Reference", value: "U312456", status: "ACTIVE" },
] as const;

// ── Main component ────────────────────────────────────────────────────────────

export function InvoicesPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "info" | "warning", message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("invoices");
  const [invoices, setInvoices] = useState<AdminInvoiceEx[]>([]);
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Create invoice modal ───────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [newClientId, setNewClientId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [newStatus, setNewStatus] = useState<"DRAFT" | "ISSUED">("ISSUED");
  const [creating, setCreating] = useState(false);

  // ── Generate milestone invoice modal ───────────────────────────────────────
  const [showMilestone, setShowMilestone] = useState(false);
  const [msClientId, setMsClientId] = useState("");
  const [msProjectId, setMsProjectId] = useState("");
  const [msStage, setMsStage] = useState<MilestoneStage>("MILESTONE_30");
  const [msDueAt, setMsDueAt] = useState(isoDatePlusDays(30));
  const [msCreating, setMsCreating] = useState(false);

  // ── Record payment (mark as paid) modal ────────────────────────────────────
  const [payInvoice, setPayInvoice] = useState<AdminInvoiceEx | null>(null);
  const [payMethod, setPayMethod] = useState("");
  const [payRef, setPayRef] = useState("");
  const [paying, setPaying] = useState(false);

  // ── Inline expansion ────────────────────────────────────────────────────────
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // ── Chase workflow ───────────────────────────────────────────────────────────
  const [chasingIds, setChasingIds] = useState<Set<string>>(new Set());
  const [chasingAll, setChasingAll] = useState(false);
  const [chaseHistory, setChaseHistory] = useState<Map<string, OverdueInvoice>>(new Map());

  // ── CSV export ──────────────────────────────────────────────────────────────
  function handleExportCsv() {
    const headers = ["Number", "Client ID", "Amount", "Currency", "Status", "Issued", "Due", "Paid"];
    const rows = invoices.map((inv) => [
      inv.number,
      inv.clientId,
      (inv.amountCents / 100).toFixed(2),
      inv.currency,
      inv.status,
      inv.issuedAt ?? "",
      inv.dueAt ?? "",
      inv.paidAt ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [r, chaseR] = await Promise.all([
        loadAdminSnapshotWithRefresh(session),
        loadOverdueChaseStatusWithRefresh(session),
      ]);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        const msg = r.error.message;
        setError(msg);
        onNotify("error", msg);
      } else if (r.data) {
        setInvoices(r.data.invoices as AdminInvoiceEx[]);
        setClients(r.data.clients);
        setProjects(r.data.projects);
      }
      if (chaseR.data?.invoices) {
        setChaseHistory(new Map(chaseR.data.invoices.map((inv) => [inv.id, inv])));
      }
    } finally {
      setLoading(false);
    }
  }, [session, onNotify]);

  async function handleChase(invoiceId: string) {
    if (!session || chasingIds.has(invoiceId)) return;
    setChasingIds((prev) => new Set([...prev, invoiceId]));
    try {
      const r = await triggerInvoiceChaseWithRefresh(session, invoiceId, "send");
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        onNotify("error", r.error.message ?? "Chase failed.");
      } else {
        onNotify("success", "Chase reminder sent.");
        // Reload chase history
        const chaseR = await loadOverdueChaseStatusWithRefresh(session);
        if (chaseR.data?.invoices) {
          setChaseHistory(new Map(chaseR.data.invoices.map((inv) => [inv.id, inv])));
        }
      }
    } finally {
      setChasingIds((prev) => { const next = new Set(prev); next.delete(invoiceId); return next; });
    }
  }

  async function handleChaseAll() {
    if (!session || chasingAll) return;
    const overdueInvoices = invoices.filter((i) => i.status === "OVERDUE");
    if (overdueInvoices.length === 0) return;
    setChasingAll(true);
    let succeeded = 0;
    let failed = 0;
    for (const inv of overdueInvoices) {
      const r = await triggerInvoiceChaseWithRefresh(session, inv.id, "send");
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { failed++; } else { succeeded++; }
    }
    setChasingAll(false);
    if (failed === 0) {
      onNotify("success", `Chase reminders sent for ${succeeded} overdue invoice${succeeded > 1 ? "s" : ""}.`);
    } else {
      onNotify("warning", `Chased ${succeeded} invoices; ${failed} failed.`);
    }
    // Reload chase history
    const chaseR = await loadOverdueChaseStatusWithRefresh(session);
    if (chaseR.data?.invoices) {
      setChaseHistory(new Map(chaseR.data.invoices.map((inv) => [inv.id, inv])));
    }
  }

  useEffect(() => { void load(); }, [load]);

  // Derived project map for O(1) lookups
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // Projects filtered for milestone modal (only IN_PROGRESS, filtered by client)
  const msEligibleProjects = projects.filter(
    (p) => p.status === "IN_PROGRESS" && (!msClientId || p.clientId === msClientId)
  );

  // Auto-calculate milestone amount from selected project budget
  const msProject = projectMap.get(msProjectId);
  const msAmountCents = msProject
    ? Math.round(msProject.budgetCents * (msStage === "MILESTONE_30" ? 0.3 : 0.2))
    : 0;

  // Reset project selection when client changes
  function handleMsClientChange(clientId: string) {
    setMsClientId(clientId);
    setMsProjectId("");
  }

  // Reset due date when stage changes
  function handleMsStageChange(stage: MilestoneStage) {
    setMsStage(stage);
    setMsDueAt(isoDatePlusDays(stage === "MILESTONE_30" ? 30 : 14));
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !newNumber.trim() || !newAmount) return;
    const amountCents = Math.round(parseFloat(newAmount) * 100);
    if (Number.isNaN(amountCents) || amountCents <= 0) return;
    setCreating(true);
    const r = await createInvoiceWithRefresh(session, {
      clientId: newClientId || undefined,
      number: newNumber.trim(),
      amountCents,
      status: newStatus,
      dueAt: newDueAt || undefined,
      issuedAt: new Date().toISOString(),
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
    } else {
      onNotify("success", `Invoice ${newNumber.trim()} created.`);
      setShowCreate(false);
      setNewClientId(""); setNewNumber(""); setNewAmount(""); setNewDueAt("");
      setNewStatus("ISSUED");
      await load();
    }
    setCreating(false);
  }

  async function handleCreateMilestoneInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !msClientId || !msProjectId || msAmountCents <= 0) return;
    setMsCreating(true);

    const stageLabel = msStage === "MILESTONE_30" ? "30%" : "20%";
    const stageTitle = msStage === "MILESTONE_30" ? "Milestone" : "Final";
    const description = `Project ${stageTitle} — ${stageLabel} — ${msStage}`;
    const number = buildInvoiceNumber(msProjectId, msStage);
    const dueAt = msDueAt ? new Date(msDueAt).toISOString() : undefined;

    // Use callGateway directly so we can pass projectId + description
    const r = await withAuthorizedSession(session, async (accessToken) => {
      const response = await callGateway<AdminInvoiceEx>("/invoices", accessToken, {
        method: "POST",
        body: {
          clientId: msClientId,
          projectId: msProjectId,
          number,
          amountCents: msAmountCents,
          description,
          status: "ISSUED",
          issuedAt: new Date().toISOString(),
          dueAt,
        },
      });
      if (isUnauthorized(response)) return { unauthorized: true, data: null, error: null };
      if (!response.payload.success || !response.payload.data) {
        return {
          unauthorized: false,
          data: null,
          error: { code: "INVOICE_CREATE_FAILED", message: response.payload.error?.message ?? "Unable to create milestone invoice." },
        };
      }
      return { unauthorized: false, data: response.payload.data, error: null };
    });

    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
    } else {
      onNotify("success", "Milestone invoice created and sent to client.");
      setShowMilestone(false);
      setMsClientId(""); setMsProjectId(""); setMsStage("MILESTONE_30"); setMsDueAt(isoDatePlusDays(30));
      await load();
    }
    setMsCreating(false);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !payInvoice) return;
    setPaying(true);

    // Create payment record
    const payResult = await createPaymentWithRefresh(session, {
      invoiceId: payInvoice.id,
      clientId: payInvoice.clientId,
      amountCents: payInvoice.amountCents,
      status: "COMPLETED",
      provider: payMethod || undefined,
      transactionRef: payRef || undefined,
      paidAt: new Date().toISOString(),
    });
    if (payResult.nextSession) saveSession(payResult.nextSession);
    if (payResult.error) {
      onNotify("error", payResult.error.message);
      setPaying(false);
      return;
    }

    // Mark invoice as PAID
    const updateResult = await updateInvoiceWithRefresh(session, payInvoice.id, { status: "PAID" });
    if (updateResult.nextSession) saveSession(updateResult.nextSession);
    if (updateResult.error) {
      onNotify("error", updateResult.error.message);
      setPaying(false);
      return;
    }

    // Confirm payment milestone on the project (non-fatal)
    const payProjectId = payInvoice.projectId;
    const payPaymentId = payResult.data?.id;
    if (payProjectId && payPaymentId) {
      const stage = detectStage(payInvoice.description);
      if (stage) {
        try {
          await withAuthorizedSession(session, async (accessToken) => {
            const res = await callGateway(`/projects/${payProjectId}/payment-milestones`, accessToken, {
              method: "POST",
              body: { stage, invoiceId: payInvoice.id, paymentId: payPaymentId },
            });
            if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
            return { unauthorized: false, data: res.payload.data ?? null, error: null };
          });
        } catch {
          // Non-fatal — payment is already recorded
        }
      }
    }

    onNotify("success", `Invoice ${payInvoice.number} marked as paid.`);
    setPayInvoice(null);
    setPayMethod(""); setPayRef("");
    await load();
    setPaying(false);
  }

  const clientName = (clientId: string): string =>
    clients.find((c) => c.id === clientId)?.name ?? clientId;

  const paid = invoices.filter((i) => i.status === "PAID");
  const overdue = invoices.filter((i) => i.status === "OVERDUE");
  const issued = invoices.filter((i) => i.status === "ISSUED");
  const totalInvoiced = invoices.reduce((s, i) => s + i.amountCents, 0);
  const totalCollected = paid.reduce((s, i) => s + i.amountCents, 0);
  const totalOutstanding = issued.reduce((s, i) => s + i.amountCents, 0) +
    overdue.reduce((s, i) => s + i.amountCents, 0);

  if (loading) {
    return (
      <section className={cx("page", "pageBody")} id="page-invoices">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH40")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody")} id="page-invoices">
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>FINANCE / BILLING</div>
          <h1 className={styles.pageTitle}>Invoices</h1>
          <div className={styles.pageSub}>Invoice register · Tax configuration</div>
        </div>
        <div className={cx("flexRow", "gap8")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={handleExportCsv}>Export CSV</button>
          {overdue.length > 0 && (
            <button
              type="button"
              className={styles.invcChaseBtn}
              onClick={() => void handleChaseAll()}
              disabled={chasingAll}
            >
              {chasingAll ? "Chasing…" : `Chase All Overdue (${overdue.length})`}
            </button>
          )}
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowMilestone(true)}>+ Generate Invoice</button>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowCreate(true)}>+ New Invoice</button>
        </div>
      </div>

      {/* ── Automation: overdue invoice reminder ─────────────────────── */}
      <AutomationBanner
        show={overdue.length > 0}
        variant="warning"
        icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2 L14 13 H2 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
            <path d="M8 7v3M8 12h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        }
        title={`${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""} — send payment reminders?`}
        description={`${overdue.reduce((s, i) => s + i.amountCents, 0) > 0 ? `${formatMoneyCents(overdue.reduce((s, i) => s + i.amountCents, 0), { currency: overdue[0]?.currency, maximumFractionDigits: 0 })} outstanding.` : ""} Automated reminders will be queued for each overdue client.`}
        actionLabel="Send reminders"
        onAction={async () => {
          if (!session) return;
          const result = await queueAutomationJobWithRefresh(session, {
            type: "PAYMENT_REMINDER",
            invoiceIds: overdue.map((i) => i.id),
          });
          if (result.nextSession) saveSession(result.nextSession);
          if (!result.error) {
            onNotify("success", `Payment reminders queued for ${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""}.`);
          } else {
            onNotify("error", result.error.message ?? "Failed to queue payment reminders.");
          }
        }}
        dismissKey={`admin:inv-reminder-banner:${overdue.map((i) => i.id).sort().join(",")}`}
        secondaryLabel="View overdue"
        onSecondary={() => {/* filter to overdue tab handled by parent */}}
      />

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "Total Invoiced", value: formatMoneyCents(totalInvoiced, { currency: invoices[0]?.currency, maximumFractionDigits: 0 }), color: "var(--accent)", sub: `${invoices.length} invoices` },
          { label: "Collected", value: formatMoneyCents(totalCollected, { currency: invoices[0]?.currency, maximumFractionDigits: 0 }), color: "var(--accent)", sub: `${paid.length} paid` },
          { label: "Outstanding", value: formatMoneyCents(totalOutstanding, { currency: invoices[0]?.currency, maximumFractionDigits: 0 }), color: totalOutstanding > 0 ? "var(--amber)" : "var(--accent)", sub: `${issued.length + overdue.length} open` },
          { label: "Overdue", value: overdue.length.toString(), color: overdue.length > 0 ? "var(--red)" : "var(--accent)", sub: overdue.length > 0 ? `${formatMoneyCents(overdue.reduce((s, i) => s + i.amountCents, 0), { currency: overdue[0]?.currency, maximumFractionDigits: 0 })} at risk` : "All current" },
        ].map((summary) => (
          <div key={summary.label} className={styles.statCard}>
            <div className={styles.statLabel}>{summary.label}</div>
            <div className={cx(styles.statValue, colorClass(summary.color))}>{summary.value}</div>
            <div className={cx("text11", "colorMuted")}>{summary.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select
          title="Select tab"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as Tab)}
          className={styles.filterSelect}
        >
          {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "invoices" && (
        invoices.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className={styles.emptyTitle}>No invoices yet</div>
            <div className={styles.emptySub}>Create your first invoice to start tracking payments and outstanding balances for your clients.</div>
            <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowCreate(true)}>+ New Invoice</button>
          </div>
        ) : (
          <div className={cx("card", "overflowAuto", "p0")}>
            <div className={styles.invcMinW900}>
              <div className={cx("invcInvGrid", "px20", "borderB", "text10", "colorMuted", "uppercase", "tracking")}>
                {["Inv #", "Client", "Project / Stage", "Amount", "Issued", "Due", "Status", ""].map((h, i) => <span key={`${h}-${i}`}>{h}</span>)}
              </div>
              {invoices.map((inv, i) => {
                const diff = daysDiff(inv.dueAt);
                const isOverdue = inv.status === "OVERDUE";
                const linkedProject = inv.projectId ? projectMap.get(inv.projectId) : undefined;
                return (
                  <div key={inv.id}>
                    <div
                      className={cx(
                        "invcInvGrid", "px20", "invcRowPad16", "invcRowAlign",
                        i < invoices.length - 1 && "borderB",
                        isOverdue && styles.invcOverdueRow
                      )}
                    >
                      <span className={cx("fontMono", "text11", "colorMuted")}>{inv.number}</span>
                      <span className={cx("fw600")}>{clientName(inv.clientId)}</span>
                      <div className={cx("flexCol", "gap4")}>
                        {linkedProject ? (
                          <span className={cx("text12", "fw600")}>{linkedProject.name}</span>
                        ) : (
                          <span className={cx("text11", "colorMuted")}>—</span>
                        )}
                        <StageBadge description={inv.description} />
                      </div>
                      <span className={cx("fontMono", "fw700", "colorAccent")}>{formatMoneyCents(inv.amountCents, { currency: inv.currency, maximumFractionDigits: 0 })}</span>
                      <span className={cx("text11", "fontMono", "colorMuted")}>{fmtDate(inv.issuedAt)}</span>
                      <div className={cx("flexCol", "gap4")}>
                        <span className={cx("text11", "fontMono", isOverdue ? "colorRed" : "colorMuted")}>
                          {fmtDate(inv.dueAt)}
                        </span>
                        {isOverdue && diff < 0 && (() => {
                          const daysOver = Math.abs(diff);
                          const level = computeEscalationLevel(daysOver);
                          const chaseInfo = chaseHistory.get(inv.id);
                          const lastChasedDaysAgo = chaseInfo?.lastChasedAt
                            ? Math.floor((Date.now() - new Date(chaseInfo.lastChasedAt).getTime()) / 86_400_000)
                            : null;
                          return (
                            <>
                              <span className={cx(styles.invcStatusBadge, toneClass("var(--red)"))}>{daysOver}d overdue</span>
                              {level > 0 && (
                                <span className={cx(styles.invcStatusBadge, toneClass(level === 3 ? "var(--red)" : level === 2 ? "var(--amber)" : "var(--muted)"))}>
                                  {ESCALATION_LABELS[level as 1 | 2 | 3]}
                                </span>
                              )}
                              {lastChasedDaysAgo !== null && (
                                <span className={cx("text10", "colorMuted")}>
                                  Last chased: {lastChasedDaysAgo === 0 ? "today" : `${lastChasedDaysAgo}d ago`}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <StatusBadge status={inv.status} />
                      <div className={cx("flexRow", "gap6")}>
                        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setExpandedInvoiceId(expandedInvoiceId === inv.id ? null : inv.id)}>{expandedInvoiceId === inv.id ? "Close" : "View"}</button>
                        {isOverdue && (
                          <button
                            type="button"
                            className={styles.invcChaseBtn}
                            onClick={() => void handleChase(inv.id)}
                            disabled={chasingIds.has(inv.id) || chasingAll}
                          >
                            {chasingIds.has(inv.id) ? "Chasing…" : "Chase"}
                          </button>
                        )}
                        {(isOverdue || inv.status === "ISSUED") && (
                          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setPayInvoice(inv)}>Record Payment</button>
                        )}
                      </div>
                    </div>
                    {expandedInvoiceId === inv.id && (
                      <div className={cx(styles.cardInner, styles.invcExpandedBody)}>
                        <div className={cx("flex", "gap20", "flexWrap")}>
                          <div><div className={cx("text11", "colorMuted", "mb2")}>INVOICE</div><div className={cx("text12")}>{inv.number}</div></div>
                          <div><div className={cx("text11", "colorMuted", "mb2")}>STATUS</div><div className={cx("text12")}>{inv.status}</div></div>
                          <div><div className={cx("text11", "colorMuted", "mb2")}>AMOUNT</div><div className={cx("text12")}>{formatMoneyCents(inv.amountCents, { currency: inv.currency })}</div></div>
                          <div><div className={cx("text11", "colorMuted", "mb2")}>ISSUED</div><div className={cx("text12")}>{inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : "—"}</div></div>
                          <div><div className={cx("text11", "colorMuted", "mb2")}>DUE</div><div className={cx("text12")}>{inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : "—"}</div></div>
                          <div><div className={cx("text11", "colorMuted", "mb2")}>PAID</div><div className={cx("text12")}>{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "—"}</div></div>
                          {linkedProject && <div><div className={cx("text11", "colorMuted", "mb2")}>PROJECT</div><div className={cx("text12")}>{linkedProject.name}</div></div>}
                          {inv.description && <div><div className={cx("text11", "colorMuted", "mb2")}>DESCRIPTION</div><div className={cx("text12")}>{inv.description}</div></div>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* ── Create Invoice Modal ──────────────────────────────────────────── */}
      {showCreate ? (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHd}>
              <span className={styles.modalTitle}>New Invoice</span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateInvoice} className={styles.modalBody}>
              <label className={styles.fieldLabel}>Invoice Number *</label>
              <input className={styles.fieldInput} value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="INV-2026-001" required autoFocus />
              <label className={styles.fieldLabel}>Client</label>
              <select className={styles.fieldInput} value={newClientId} onChange={(e) => setNewClientId(e.target.value)}>
                <option value="">No client linked</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label className={styles.fieldLabel}>Amount *</label>
              <input type="number" className={styles.fieldInput} value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="50000" min="1" step="0.01" required />
              <label className={styles.fieldLabel}>Due Date</label>
              <input type="date" className={styles.fieldInput} value={newDueAt} onChange={(e) => setNewDueAt(e.target.value)} />
              <label className={styles.fieldLabel}>Status</label>
              <select className={styles.fieldInput} value={newStatus} onChange={(e) => setNewStatus(e.target.value as typeof newStatus)}>
                <option value="ISSUED">Issued (send to client)</option>
                <option value="DRAFT">Draft</option>
              </select>
              <div className={cx("flexEnd", "gap8", "mt8")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className={cx("btnSm", "btnAccent")} disabled={creating}>{creating ? "Creating…" : "Create Invoice"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ── Generate Milestone Invoice Modal ─────────────────────────────── */}
      {showMilestone ? (
        <div className={styles.modalOverlay} onClick={() => setShowMilestone(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHd}>
              <span className={styles.modalTitle}>Generate Milestone Invoice</span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowMilestone(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateMilestoneInvoice} className={styles.modalBody}>
              <label className={styles.fieldLabel}>Client *</label>
              <select className={styles.fieldInput} value={msClientId} onChange={(e) => handleMsClientChange(e.target.value)} required>
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <label className={styles.fieldLabel}>Project *</label>
              <select className={styles.fieldInput} value={msProjectId} onChange={(e) => setMsProjectId(e.target.value)} required disabled={!msClientId}>
                <option value="">Select project…</option>
                {msEligibleProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {msClientId && msEligibleProjects.length === 0 && (
                <div className={cx("text11", "colorMuted")}>No in-progress projects for this client.</div>
              )}

              <label className={styles.fieldLabel}>Stage *</label>
              <div className={cx("flexRow", "gap16")}>
                <label className={cx("flexRow", "gap6")}>
                  <input
                    type="radio"
                    name="msStage"
                    value="MILESTONE_30"
                    checked={msStage === "MILESTONE_30"}
                    onChange={() => handleMsStageChange("MILESTONE_30")}
                  />
                  <span className={cx("text13")}>30% Milestone</span>
                </label>
                <label className={cx("flexRow", "gap6")}>
                  <input
                    type="radio"
                    name="msStage"
                    value="FINAL_20"
                    checked={msStage === "FINAL_20"}
                    onChange={() => handleMsStageChange("FINAL_20")}
                  />
                  <span className={cx("text13")}>20% Final</span>
                </label>
              </div>

              <label className={styles.fieldLabel}>Amount (auto-calculated)</label>
              <div className={cx("fieldInput", styles.fieldInput, styles.fieldInputReadonly)}>
                {msAmountCents > 0
                  ? formatMoneyCents(msAmountCents, { currency: "ZAR", maximumFractionDigits: 0 })
                  : msProjectId ? "Calculating…" : "Select project first"}
              </div>
              {msProject && (
                <div className={cx("text11", "colorMuted")}>
                  Budget: {formatMoneyCents(msProject.budgetCents, { currency: "ZAR", maximumFractionDigits: 0 })} · {msStage === "MILESTONE_30" ? "30%" : "20%"} = {formatMoneyCents(msAmountCents, { currency: "ZAR", maximumFractionDigits: 0 })}
                </div>
              )}

              <label className={styles.fieldLabel}>Due Date</label>
              <input type="date" className={styles.fieldInput} value={msDueAt} onChange={(e) => setMsDueAt(e.target.value)} />

              <label className={styles.fieldLabel}>Description (auto-filled)</label>
              <div className={cx(styles.fieldInput, styles.fieldInputReadonly, "text12")}>
                {msProjectId
                  ? `Project ${msStage === "MILESTONE_30" ? "Milestone" : "Final"} — ${msStage === "MILESTONE_30" ? "30%" : "20%"} — ${msStage}`
                  : "Select project to preview"}
              </div>

              <div className={cx("flexEnd", "gap8", "mt8")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowMilestone(false)}>Cancel</button>
                <button
                  type="submit"
                  className={cx("btnSm", "btnAccent")}
                  disabled={msCreating || !msClientId || !msProjectId || msAmountCents <= 0}
                >
                  {msCreating ? "Generating…" : "Generate & Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ── Record Payment Modal ──────────────────────────────────────────── */}
      {payInvoice ? (
        <div className={styles.modalOverlay} onClick={() => setPayInvoice(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHd}>
              <span className={styles.modalTitle}>Record Payment — {payInvoice.number}</span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setPayInvoice(null)}>✕</button>
            </div>
            <form onSubmit={handleRecordPayment} className={styles.modalBody}>
              <div className={cx("text13", "colorMuted", "mb12")}>
                Amount: <strong>{formatMoneyCents(payInvoice.amountCents, { currency: payInvoice.currency, maximumFractionDigits: 0 })}</strong> · Client: <strong>{clientName(payInvoice.clientId)}</strong>
                {payInvoice.projectId && projectMap.get(payInvoice.projectId) && (
                  <> · Project: <strong>{projectMap.get(payInvoice.projectId)!.name}</strong></>
                )}
              </div>
              {detectStage(payInvoice.description) && (
                <div className={cx("text12", "colorMuted", "mb12")}>
                  Stage: <StageBadge description={payInvoice.description} />
                </div>
              )}
              <label className={styles.fieldLabel}>Payment Method</label>
              <select className={styles.fieldInput} value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="">Select method…</option>
                <option value="EFT">EFT / Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="PAYFAST">PayFast</option>
                <option value="STRIPE">Stripe</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
              <label className={styles.fieldLabel}>Transaction Reference (optional)</label>
              <input className={styles.fieldInput} value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="TXN-12345…" />
              <div className={cx("flexEnd", "gap8", "mt8")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setPayInvoice(null)}>Cancel</button>
                <button type="submit" className={cx("btnSm", "btnAccent")} disabled={paying}>{paying ? "Saving…" : "Mark as Paid"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {activeTab === "tax config" && (
        <div className={styles.invcTaxSplit}>
          <div className={cx("card", "p24")}>
            <div className={styles.invcCardTitle}>Tax Identifiers</div>
            <div className={cx("flexCol", "gap16")}>
              {taxItems.map((t) => (
                <div key={t.label} className={styles.invcTaxRow}>
                  <div>
                    <div className={cx("text12", "colorMuted", "mb2")}>{t.label}</div>
                    <div className={cx("fontMono", "fw700")}>{t.value}</div>
                  </div>
                  <span className={cx(styles.invcStatusBadge, toneClass("var(--accent)"))}>{t.status.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={cx("flexCol", "gap16")}>
            <div className={cx("card", "p24")}>
              <div className={styles.invcCardTitle}>VAT Configuration</div>
              <div className={cx("grid2", "gap16")}>
                {[
                  { label: "VAT Rate", value: "15%" },
                  { label: "VAT Period", value: "Monthly" },
                  { label: "Submission Method", value: "e-Filing" },
                ].map((v) => (
                  <div key={v.label}>
                    <div className={cx("text11", "colorMuted", "mb4")}>{v.label}</div>
                    <div className={cx("fontMono", "fw700")}>{v.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
