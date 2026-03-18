// ════════════════════════════════════════════════════════════════════════════
// billing-page.tsx — Client Portal Deposit & Payments
// Data : loadPortalInvoicesWithRefresh                    → GET /invoices
//        loadPortalProjectPaymentMilestonesWithRefresh    → GET /projects/:id/payment-milestones
//        loadPortalProjectsWithRefresh                    → GET /projects
// PayFast: POST /payfast/initiate → { url, fields }
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { usePageToast } from "../hooks/use-page-toast";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalInvoicesWithRefresh,
  loadPortalProjectPaymentMilestonesWithRefresh,
  loadPortalProjectsWithRefresh,
  getPortalPaymentReceiptFileIdWithRefresh,
  getPortalFileDownloadUrlWithRefresh,
  type PortalInvoice,
  type PortalProjectPaymentMilestone,
  type PortalProject,
} from "../../../../lib/api/portal";
import {
  callGateway,
  isUnauthorized,
  toGatewayError,
  withAuthorizedSession,
} from "../../../../lib/api/portal/internal";
import type { AuthSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentTab    = "Payment Schedule" | "Pay Now" | "Receipts";
type PaymentMethod = "eft" | "card" | "payfast";

interface PayFastInitiateResult {
  url: string;
  fields: Record<string, string>;
}

interface ProjectSchedule {
  project: PortalProject;
  milestones: PortalProjectPaymentMilestone[];
  loading: boolean;
}

interface Stage {
  label: string;
  pct: number;
  amountCents: number;
  status: "paid" | "due" | "locked";
  invoiceId?: string;
  dueDate?: string | null;
}

// ── Currency map ──────────────────────────────────────────────────────────────

const CURRENCY_MAP: Record<string, { symbol: string; locale: string }> = {
  ZAR: { symbol: "R",  locale: "en-ZA" },
  USD: { symbol: "$",  locale: "en-US" },
  EUR: { symbol: "€",  locale: "de-DE" },
  GBP: { symbol: "£",  locale: "en-GB" },
  NGN: { symbol: "₦", locale: "en-NG" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFmtCurrency(currency: string) {
  const { symbol, locale } = CURRENCY_MAP[currency] ?? CURRENCY_MAP["ZAR"]!;
  return function formatCurrency(cents: number): string {
    return `${symbol} ${(cents / 100).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function invoiceStatus(raw: string): "paid" | "overdue" | "pending" {
  const s = raw.toUpperCase();
  if (s === "PAID" || s === "COMPLETED") return "paid";
  if (s === "OVERDUE")                   return "overdue";
  return "pending";
}

function invoiceLabel(inv: PortalInvoice, idx: number): string {
  if (inv.number) return `Invoice ${inv.number}`;
  return `Payment ${String(idx + 1).padStart(2, "0")}`;
}

// ── PayFast redirect ──────────────────────────────────────────────────────────

function redirectToPayFast(url: string, fields: Record<string, string>): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  Object.entries(fields).forEach(([k, v]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

// ── PayFast initiate API helper ───────────────────────────────────────────────

async function initiatePayFastPayment(
  session: AuthSession,
  invoiceId: string,
): Promise<{ data: PayFastInitiateResult | null; error: string | null }> {
  const result = await withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<PayFastInitiateResult>("/payfast/initiate", accessToken, {
      method: "POST",
      body: {
        invoiceId,
        returnUrl: `${window.location.origin}/client/billing?payfast=success`,
        cancelUrl: `${window.location.origin}/client/billing?payfast=cancel`,
      },
    });
    if (isUnauthorized(response)) {
      return { unauthorized: true, data: null, error: null };
    }
    if (!response.payload.success || !response.payload.data) {
      return {
        unauthorized: false,
        data: null,
        error: toGatewayError(
          response.payload.error?.code ?? "PAYFAST_INITIATE_FAILED",
          response.payload.error?.message ?? "Unable to initiate PayFast payment.",
        ),
      };
    }
    return { unauthorized: false, data: response.payload.data, error: null };
  });

  if (result.nextSession) saveSession(result.nextSession);
  if (result.error) return { data: null, error: result.error.message };
  return { data: result.data, error: null };
}

// ── buildSchedule ─────────────────────────────────────────────────────────────
// Maps the 50/30/20 breakdown onto milestone + invoice records.
// Note: DEPOSIT_50 is not a milestone type in the API — it is tracked purely
// via invoices. The deposit is "paid" when there exists a PAID invoice before
// any MILESTONE_30 milestone exists.

function buildSchedule(
  budgetCents: number,
  milestones: PortalProjectPaymentMilestone[],
  invoices: PortalInvoice[],
): Stage[] {
  const milestone30 = milestones.find((m) => m.stage === "MILESTONE_30");
  const final20     = milestones.find((m) => m.stage === "FINAL_20");

  // Find invoices linked to known milestone invoiceIds
  const milestone30Inv = milestone30?.invoiceId
    ? invoices.find((inv) => inv.id === milestone30.invoiceId)
    : undefined;
  const final20Inv = final20?.invoiceId
    ? invoices.find((inv) => inv.id === final20.invoiceId)
    : undefined;

  // For the deposit: the first non-milestone invoice that is paid or pending.
  // We exclude invoices that are already accounted for by milestones.
  const milestoneInvoiceIds = new Set<string>(
    [milestone30?.invoiceId, final20?.invoiceId].filter((id): id is string => !!id),
  );
  const depositCandidates = invoices.filter((inv) => !milestoneInvoiceIds.has(inv.id));
  const depositInv = depositCandidates[0];

  const depositPaid = depositInv ? invoiceStatus(depositInv.status) === "paid" : false;

  return [
    {
      label: "50% Deposit",
      pct: 50,
      amountCents: Math.round(budgetCents * 0.50),
      status: depositPaid
        ? "paid"
        : depositInv
          ? "due"
          : "locked",
      invoiceId: depositInv?.id,
      dueDate: depositInv?.dueAt,
    },
    {
      label: "30% Milestone",
      pct: 30,
      amountCents: Math.round(budgetCents * 0.30),
      status: milestone30?.paid
        ? "paid"
        : milestone30Inv
          ? "due"
          : "locked",
      invoiceId: milestone30Inv?.id,
      dueDate: milestone30Inv?.dueAt,
    },
    {
      label: "20% Final",
      pct: 20,
      amountCents: Math.round(budgetCents * 0.20),
      status: final20?.paid
        ? "paid"
        : final20Inv
          ? "due"
          : "locked",
      invoiceId: final20Inv?.id,
      dueDate: final20Inv?.dueAt,
    },
  ];
}

// ── PaymentSchedule sub-component ─────────────────────────────────────────────

function PaymentSchedule({
  projectSchedules,
  invoices,
  formatCurrency,
  onPayFast,
  payingInvoiceId,
}: {
  projectSchedules: ProjectSchedule[];
  invoices: PortalInvoice[];
  formatCurrency: (cents: number) => string;
  onPayFast: (invoiceId: string) => void;
  payingInvoiceId: string | null;
}) {
  if (projectSchedules.length === 0) {
    return (
      <div className={cx("card")}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div className={cx("emptyStateTitle")}>No active projects</div>
          <div className={cx("emptyStateSub")}>Payment schedules will appear here once a project is set up.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {projectSchedules.map(({ project, milestones, loading: milestoneLoading }) => {
        const stages = buildSchedule(project.budgetCents, milestones, invoices);
        const paidCount = stages.filter((s) => s.status === "paid").length;

        return (
          <div key={project.id} className={cx("card", "mb16")}>
            {/* Project header */}
            <div className={styles.psProjectHead}>
              <div>
                <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb2")}>Project</div>
                <div className={cx("fw700", "text14")}>{project.name}</div>
              </div>
              <div className={styles.psProjectMeta}>
                <div>
                  <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb2")}>Budget</div>
                  <div className={cx("fw700", "colorAccent")}>{formatCurrency(project.budgetCents)}</div>
                </div>
                <div>
                  <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb2")}>Progress</div>
                  <div className={cx("fw600")}>
                    <span className={cx("badge", paidCount === 3 ? "badgeGreen" : paidCount > 0 ? "badgeAmber" : "badgeMuted")}>
                      {paidCount}/3 paid
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {milestoneLoading ? (
              <div className={styles.psTimelineShell}>
                <div className={cx("skeletonBlock", "skeleH68")} />
                <div className={cx("skeletonBlock", "skeleH68", "mt8")} />
                <div className={cx("skeletonBlock", "skeleH68", "mt8")} />
              </div>
            ) : (
              <div className={styles.psTimelineShell}>
                {stages.map((stage, idx) => {
                  const isLast = idx === stages.length - 1;
                  const isPaying = stage.invoiceId ? payingInvoiceId === stage.invoiceId : false;

                  return (
                    <div key={stage.label} className={styles.psTimelineRow}>
                      {/* Connector line */}
                      <div className={styles.psConnectorCol}>
                        <div
                          className={[
                            styles.psDot,
                            stage.status === "paid"
                              ? styles.psDotPaid
                              : stage.status === "due"
                                ? styles.psDotDue
                                : styles.psDotLocked,
                          ].join(" ")}
                        />
                        {!isLast && <div className={styles.psConnectorLine} />}
                      </div>

                      {/* Stage content */}
                      <div className={styles.psStageContent}>
                        <div className={styles.psStageRow}>
                          {/* Left: label + due date */}
                          <div className={styles.psStageLabelGroup}>
                            <span className={cx("fw600", "text13")}>{stage.label}</span>
                            {stage.status === "paid" && (
                              <span className={cx("text11", "colorMuted")}>&nbsp;· paid</span>
                            )}
                            {stage.status === "due" && stage.dueDate && (
                              <span className={cx("text11", "colorMuted")}>&nbsp;· due {fmtDate(stage.dueDate)}</span>
                            )}
                            {stage.status === "locked" && (
                              <span className={cx("text11", "colorMuted")}>&nbsp;· awaiting previous milestone</span>
                            )}
                          </div>

                          {/* Right: amount + badge + pay button */}
                          <div className={styles.psStageActions}>
                            <span className={cx("fw700", "text13")}>
                              {formatCurrency(stage.amountCents)}
                            </span>
                            {stage.status === "paid" && (
                              <span className={cx("badge", "badgeGreen")}>PAID</span>
                            )}
                            {stage.status === "due" && (
                              <>
                                <span className={cx("badge", "badgeAmber")}>DUE</span>
                                {stage.invoiceId && (
                                  <button
                                    type="button"
                                    className={cx("btnSm", "btnAccent")}
                                    disabled={isPaying}
                                    onClick={() => stage.invoiceId && onPayFast(stage.invoiceId)}
                                  >
                                    {isPaying ? (
                                      <span className={styles.psSpinner} aria-label="Loading" />
                                    ) : (
                                      "Pay Now"
                                    )}
                                  </button>
                                )}
                              </>
                            )}
                            {stage.status === "locked" && (
                              <span className={cx("badge", "badgeMuted")}>Locked</span>
                            )}
                          </div>
                        </div>

                        {/* Percentage fill bar */}
                        <div className={styles.psProgressTrack}>
                          <div
                            className={[
                              styles.psProgressFill,
                              stage.status === "paid"
                                ? styles.psProgressFillPaid
                                : stage.status === "due"
                                  ? styles.psProgressFillDue
                                  : styles.psProgressFillLocked,
                            ].join(" ")}
                            style={{ width: `${stage.pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BillingPage({ currency = "ZAR" }: { currency?: string }) {
  const { session, projectId } = useProjectLayer();
  const notify                 = usePageToast();
  const formatCurrency         = makeFmtCurrency(currency);

  const [invoices,          setInvoices]          = useState<PortalInvoice[]>([]);
  const [milestones,        setMilestones]        = useState<PortalProjectPaymentMilestone[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [tab,               setTab]               = useState<PaymentTab>("Payment Schedule");
  const [method,            setMethod]            = useState<PaymentMethod>("eft");
  const [payModal,          setPayModal]          = useState(false);
  const [downloadingId,     setDownloadingId]     = useState<string | null>(null);
  const [payingInvoiceId,   setPayingInvoiceId]   = useState<string | null>(null);

  // Project schedules state: list of { project, milestones, loading }
  const [projectSchedules,  setProjectSchedules]  = useState<ProjectSchedule[]>([]);

  // ── Load data ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);

    const loads: Promise<void>[] = [
      loadPortalInvoicesWithRefresh(session).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (!r.error && r.data) setInvoices(r.data);
      }),
    ];

    // Load all projects for multi-project payment schedule
    loads.push(
      loadPortalProjectsWithRefresh(session).then(async (r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.error || !r.data) return;

        const activeProjects = r.data.filter(
          (p) => p.status !== "CANCELLED" && p.status !== "COMPLETED",
        );

        // Initialize skeleton entries
        setProjectSchedules(
          activeProjects.map((project) => ({ project, milestones: [], loading: true })),
        );

        // Load milestones for each project in parallel
        await Promise.all(
          activeProjects.map(async (project) => {
            const mr = await loadPortalProjectPaymentMilestonesWithRefresh(session, project.id);
            if (mr.nextSession) saveSession(mr.nextSession);
            setProjectSchedules((prev) =>
              prev.map((ps) =>
                ps.project.id === project.id
                  ? { ...ps, milestones: mr.data ?? [], loading: false }
                  : ps,
              ),
            );
          }),
        );
      }),
    );

    // Also load milestones for the context projectId (for legacy derived values)
    if (projectId) {
      loads.push(
        loadPortalProjectPaymentMilestonesWithRefresh(session, projectId).then((r) => {
          if (r.nextSession) saveSession(r.nextSession);
          if (!r.error && r.data) setMilestones(r.data);
        }),
      );
    }

    void Promise.all(loads).finally(() => setLoading(false));
  }, [session, projectId]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const sorted = useMemo(
    () => [...invoices].sort((a, b) => {
      const da = a.dueAt ?? a.issuedAt ?? a.createdAt;
      const db = b.dueAt ?? b.issuedAt ?? b.createdAt;
      return da.localeCompare(db);
    }),
    [invoices],
  );

  const totalCents       = useMemo(() => sorted.reduce((s, inv) => s + inv.amountCents, 0), [sorted]);
  const paidCents        = useMemo(() => sorted.filter((inv) => invoiceStatus(inv.status) === "paid").reduce((s, inv) => s + inv.amountCents, 0), [sorted]);
  const outstandingCents = totalCents - paidCents;
  const nextInvoice      = useMemo(() => sorted.find((inv) => invoiceStatus(inv.status) !== "paid"), [sorted]);
  const receipts         = useMemo(() => sorted.filter((inv) => invoiceStatus(inv.status) === "paid"), [sorted]);

  // Paid milestones info (for sidebar enrichment if available)
  const paidMilestones = milestones.filter((m) => m.paid);

  // ── Schedule CSV download ────────────────────────────────────────────────

  function downloadScheduleCsv(): void {
    if (sorted.length === 0) {
      notify("info", "No data", "No invoices to export yet.");
      return;
    }
    const { symbol } = CURRENCY_MAP[currency] ?? CURRENCY_MAP["ZAR"]!;
    const rows: string[] = [
      ["Invoice", "Due Date", "Paid Date", "Amount", "Status"].join(","),
    ];
    for (const [idx, inv] of sorted.entries()) {
      const st    = invoiceStatus(inv.status);
      const label = invoiceLabel(inv, idx);
      const due   = fmtDate(inv.dueAt);
      const paid  = st === "paid" ? fmtDate(inv.paidAt) : "";
      const amt   = `${symbol} ${(inv.amountCents / 100).toFixed(2)}`;
      const status = st === "paid" ? "Paid" : st === "overdue" ? "Overdue" : "Upcoming";
      rows.push([label, due, paid, amt, status].map((v) => `"${v}"`).join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `payment-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── EFT Confirm handler ────────────────────────────────────────────────────

  function confirmPayment(): void {
    setPayModal(false);
    notify("success", "Payment noted", "We'll verify your EFT and send a receipt within 2 business hours");
    setTab("Receipts");
  }

  // ── PayFast handler ───────────────────────────────────────────────────────

  const handlePayFast = useCallback(async (invoiceId: string): Promise<void> => {
    if (!session) return;
    setPayingInvoiceId(invoiceId);
    try {
      const { data, error } = await initiatePayFastPayment(session, invoiceId);
      if (error || !data) {
        notify("error", "Payment failed", error ?? "Unable to initiate PayFast. Please try again.");
        return;
      }
      redirectToPayFast(data.url, data.fields);
    } finally {
      setPayingInvoiceId(null);
    }
  }, [session, notify]);

  // ── Receipt download ──────────────────────────────────────────────────────

  async function downloadReceipt(inv: PortalInvoice): Promise<void> {
    if (!session) return;
    const payment = inv.payments?.[0];
    if (!payment) {
      notify("error", "No receipt", "No payment record found for this invoice.");
      return;
    }
    if (!payment.receiptFileId) {
      notify("info", "Not available", "Receipt file not yet attached. Please contact support.");
      return;
    }
    setDownloadingId(inv.id);
    try {
      const r = await getPortalPaymentReceiptFileIdWithRefresh(session, payment.id);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        notify("error", "Download failed", r.error?.message ?? "Unable to fetch receipt.");
        return;
      }
      const dl = await getPortalFileDownloadUrlWithRefresh(session, r.data.fileId);
      if (dl.nextSession) saveSession(dl.nextSession);
      if (dl.error || !dl.data) {
        notify("error", "Download failed", dl.error?.message ?? "Unable to get download URL.");
        return;
      }
      window.open(dl.data.downloadUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingId(null);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Finance · Payments</div>
            <h1 className={cx("pageTitle")}>Deposit &amp; Payments</h1>
          </div>
        </div>
        <div className={cx("skeletonBlock", "skeleH68", "mb16")} />
        <div className={cx("skeletonBlock", "skeleH180")} />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Payments</div>
          <h1 className={cx("pageTitle")}>Deposit &amp; Payments</h1>
          <p className={cx("pageSub")}>Your payment schedule, instalments, and receipts in one place.</p>
        </div>
        <div className={cx("pageActions")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            disabled={sorted.length === 0}
            title={sorted.length > 0 ? "Download payment schedule as CSV" : "No invoices to export yet"}
            onClick={downloadScheduleCsv}
          >
            Schedule CSV
          </button>
        </div>
      </div>

      {/* Totals bar */}
      <div className={cx("card", "p16", "mb16")}>
        {invoices.length === 0 ? (
          <div className={cx("text12", "colorMuted")}>No invoice data available yet.</div>
        ) : (
          <div className={cx("flexRow", "gap24")}>
            <div>
              <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Paid</div>
              <div className={cx("fw700", "colorAccent")}>{formatCurrency(paidCents)}</div>
            </div>
            <div>
              <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Outstanding</div>
              <div className={cx("fw700", "colorAmber")}>{formatCurrency(outstandingCents)}</div>
            </div>
            <div>
              <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Total</div>
              <div className={cx("fw700")}>{formatCurrency(totalCents)}</div>
            </div>
            {paidMilestones.length > 0 && (
              <div>
                <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Milestones</div>
                <div className={cx("fw700")}>{paidMilestones.length} paid</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={cx("pillTabs", "mb16")}>
        {(["Payment Schedule", "Pay Now", "Receipts"] as PaymentTab[]).map((t) => (
          <button key={t} type="button" className={cx("pillTab", tab === t && "pillTabActive")} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Payment Schedule ── */}
      {tab === "Payment Schedule" && (
        <>
          <PaymentSchedule
            projectSchedules={projectSchedules}
            invoices={sorted}
            formatCurrency={formatCurrency}
            onPayFast={(invoiceId) => void handlePayFast(invoiceId)}
            payingInvoiceId={payingInvoiceId}
          />

          {sorted.length > 0 && (
            <div className={cx("card", "mt16")}>
              <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Summary</span></div>
              <div className={cx("listGroup")}>
                {([
                  ["Total Project Value",  formatCurrency(totalCents)],
                  ["Total Paid",           formatCurrency(paidCents)],
                  ["Balance Outstanding",  formatCurrency(outstandingCents)],
                  ["Next Payment",         nextInvoice ? `${formatCurrency(nextInvoice.amountCents)} — ${invoiceLabel(nextInvoice, sorted.indexOf(nextInvoice))}` : "None outstanding"],
                  ["Next Due Date",        nextInvoice ? fmtDate(nextInvoice.dueAt) : "—"],
                  ["Payment Method",       method === "eft" ? "EFT to Maphari Studio" : method === "card" ? "Card via secure gateway" : "PayFast"],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className={cx("listRow")}>
                    <span className={cx("text12", "colorMuted")}>{label}</span>
                    <span className={cx("fw600", "text12")}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Pay Now ── */}
      {tab === "Pay Now" && (
        <div className={cx("grid2")}>
          <div className={cx("card", "p20")}>
            <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb8")}>Next Payment Due</div>
            {nextInvoice ? (
              <>
                <div className={cx("fontDisplay", "fw800", "text24", "colorAccent", "mb4")}>{formatCurrency(nextInvoice.amountCents)}</div>
                <div className={cx("text12", "colorMuted", "mb16")}>
                  {invoiceLabel(nextInvoice, sorted.indexOf(nextInvoice))} · Due {fmtDate(nextInvoice.dueAt)}
                </div>
                {method === "payfast" ? (
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    disabled={payingInvoiceId === nextInvoice.id}
                    onClick={() => void handlePayFast(nextInvoice.id)}
                  >
                    {payingInvoiceId === nextInvoice.id ? (
                      <span className={styles.psSpinner} aria-label="Loading" />
                    ) : (
                      `Pay ${formatCurrency(nextInvoice.amountCents)} via PayFast`
                    )}
                  </button>
                ) : (
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setPayModal(true)}>
                    {method === "eft" ? "I've Made the Payment" : `Pay ${formatCurrency(nextInvoice.amountCents)} Now`}
                  </button>
                )}
              </>
            ) : (
              <>
                <div className={cx("fw700", "text13", "colorAccent", "mb8")}>All payments up to date</div>
                <div className={cx("text12", "colorMuted")}>No outstanding invoices at this time.</div>
              </>
            )}
          </div>

          <div className={cx("card", "p20")}>
            <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb12")}>Choose Payment Method</div>
            <div className={cx("flexCol", "gap8", "mb16")}>
              {([
                { key: "eft",     label: "EFT / Bank Transfer" },
                { key: "card",    label: "Credit / Debit Card" },
                { key: "payfast", label: "PayFast" },
              ] as { key: PaymentMethod; label: string }[]).map((item) => (
                <button key={item.key} type="button" className={cx("pillTab", method === item.key && "pillTabActive")} onClick={() => setMethod(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>
            {method === "eft" && (
              <div className={cx("listGroup")}>
                {([
                  ["Bank",           "FNB"],
                  ["Account Name",   "Maphari Studio (Pty) Ltd"],
                  ["Account Number", "62834719230"],
                  ["Branch Code",    "250655"],
                  ["Reference",      nextInvoice?.number ?? "See your invoice"],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className={cx("listRow")}>
                    <span className={cx("text12", "colorMuted")}>{label}</span>
                    <span className={cx("fw600", "fontMono", "text12")}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Receipts ── */}
      {tab === "Receipts" && (
        <div className={cx("card")}>
          <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Payment Receipts</span></div>
          {receipts.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
              <div className={cx("emptyStateTitle")}>No receipts yet</div>
              <div className={cx("emptyStateSub")}>Receipts will appear here once payments are confirmed.</div>
            </div>
          ) : (
            <div className={cx("listGroup")}>
              {receipts.map((inv, idx) => {
                const payment = inv.payments?.[0];
                const txnRef  = payment?.transactionRef ?? inv.number ?? `TXN-${idx + 1}`;
                const paidDate = payment?.paidAt ?? inv.paidAt;
                return (
                  <div key={inv.id} className={cx("listRow")}>
                    <span className={cx("text20")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span>
                    <div>
                      <div className={cx("fw600", "text12")}>{invoiceLabel(inv, idx)}</div>
                      <div className={cx("text11", "colorMuted")}>{fmtDate(paidDate)} · Ref: {txnRef}</div>
                    </div>
                    <div className={cx("flexRow", "gap12")}>
                      <span className={cx("fw700")}>{formatCurrency(inv.amountCents)}</span>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        disabled={downloadingId === inv.id}
                        onClick={() => void downloadReceipt(inv)}
                      >
                        {downloadingId === inv.id ? "…" : "Download"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Confirm payment modal ── */}
      {payModal && nextInvoice && (
        <div className={styles.depositPayModalBackdrop} onClick={() => setPayModal(false)}>
          <div className={styles.depositPayModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.depositPayModalHead}>
              <span className={styles.depositPayModalTitle}>Confirm Payment</span>
              <button type="button" className={styles.depositPayModalClose} onClick={() => setPayModal(false)} aria-label="Close">✕</button>
            </div>
            <div className={styles.depositPayModalBody}>
              <div className={styles.depositPayModalInfo}>
                Please confirm you transferred <strong>{formatCurrency(nextInvoice.amountCents)}</strong> using reference <strong>{nextInvoice.number ?? "your invoice number"}</strong>.
                We will verify and send your receipt within 2 business hours.
              </div>
            </div>
            <div className={styles.depositPayModalFoot}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setPayModal(false)}>Cancel</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={confirmPayment}>Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
