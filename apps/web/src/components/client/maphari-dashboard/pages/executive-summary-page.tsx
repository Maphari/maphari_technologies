"use client";
// ════════════════════════════════════════════════════════
// executive-summary-page.tsx — Client Executive Summary
// Aggregates health, budget, delivery, and NPS data into
// a single executive-level overview.
// ════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import { Alert } from "@/components/shared/ui/alert";
import type { PageId } from "../config";
import {
  loadPortalSurveysWithRefresh,
  type PortalSurvey,
} from "../../../../lib/api/portal/client-cx";
import {
  loadPortalDeliverablesWithRefresh,
  loadPortalRisksWithRefresh,
  type PortalDeliverable,
  type PortalRisk,
} from "../../../../lib/api/portal/project-layer";
import {
  loadPortalChangeRequestsWithRefresh,
  loadPortalInvoicesWithRefresh,
} from "../../../../lib/api/portal";
import type { PortalProjectChangeRequest, PortalInvoice } from "../../../../lib/api/portal/types";

// ── Helpers ────────────────────────────────────────────────────────────────────

const CIRC = 283; // 2π × 45 for r=45

function scoreColor(s: number): string {
  return s > 80 ? "var(--lime)" : s > 60 ? "var(--amber)" : "var(--red)";
}

function scoreToneClass(s: number): "statCardGreen" | "statCardAmber" | "statCardRed" {
  return s > 80 ? "statCardGreen" : s > 60 ? "statCardAmber" : "statCardRed";
}

function scoreLabel(s: number): string {
  return s > 80 ? "Excellent" : s > 60 ? "Good" : s > 0 ? "Needs attention" : "—";
}

function riskSeverity(r: PortalRisk): number {
  const likeScore: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  const impScore: Record<string, number>  = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  return (likeScore[r.likelihood] ?? 1) + (impScore[r.impact] ?? 1);
}

function highestSeverityLabel(risks: PortalRisk[]): string {
  if (risks.length === 0) return "None";
  const sorted = [...risks].sort((a, b) => riskSeverity(b) - riskSeverity(a));
  const top = sorted[0];
  if ((top.impact === "CRITICAL" || top.likelihood === "CRITICAL")) return "Critical";
  if ((top.impact === "HIGH"     || top.likelihood === "HIGH"))     return "High";
  if ((top.impact === "MEDIUM"   || top.likelihood === "MEDIUM"))   return "Medium";
  return "Low";
}

function deriveBudgetHealth(invoices: PortalInvoice[]): {
  totalCents: number;
  paidCents: number;
  pct: number;
  score: number;
} {
  const totalCents = invoices.reduce((s, i) => s + (i.amountCents ?? 0), 0);
  const paidCents  = invoices
    .filter(i => i.status === "PAID")
    .reduce((s, i) => s + (i.amountCents ?? 0), 0);
  const pct        = totalCents > 0 ? Math.round((paidCents / totalCents) * 100) : 0;
  // Budget health = paid rate (more paid = healthier cashflow from our POV)
  const overdueCount = invoices.filter(i => i.status === "OVERDUE").length;
  const score        = Math.max(0, pct - overdueCount * 10);
  return { totalCents, paidCents, pct, score };
}

function deriveDeliveryHealth(deliverables: PortalDeliverable[]): {
  done: number;
  total: number;
  overdue: number;
  score: number;
} {
  const total   = deliverables.length;
  const done    = deliverables.filter(d => d.status === "DELIVERED" || d.status === "ACCEPTED").length;
  const now     = Date.now();
  const overdue = deliverables.filter(d => {
    if (d.status === "DELIVERED" || d.status === "ACCEPTED") return false;
    if (!d.dueAt) return false;
    return new Date(d.dueAt).getTime() < now;
  }).length;
  const score   = total > 0 ? Math.round(((done / total) * 100) - (overdue / total) * 20) : 0;
  return { done, total, overdue, score: Math.max(0, score) };
}

function deriveHealthScore(invoices: PortalInvoice[]): number {
  if (invoices.length === 0) return 0;
  const paid = invoices.filter(i => i.status === "PAID").length;
  return Math.round((paid / invoices.length) * 100);
}

function deriveNPS(surveys: PortalSurvey[]): {
  score: number | null;
  lastDate: string | null;
} {
  const completed = surveys.filter(s => s.status === "COMPLETED" && s.npsScore !== null);
  if (completed.length === 0) return { score: null, lastDate: null };
  const sorted = [...completed].sort(
    (a, b) => new Date(b.completedAt ?? b.updatedAt).getTime() - new Date(a.completedAt ?? a.updatedAt).getTime()
  );
  const latest    = sorted[0];
  const lastDate  = latest.completedAt
    ? new Date(latest.completedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
    : null;
  return { score: latest.npsScore, lastDate };
}

function fmtCents(cents: number): string {
  return (cents / 100).toLocaleString("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
}

function pendingCRCount(crs: PortalProjectChangeRequest[]): number {
  return crs.filter(c => c.status === "SUBMITTED" || c.status === "ESTIMATED").length;
}

function pendingSignOffCount(crs: PortalProjectChangeRequest[]): number {
  return crs.filter(c => c.status === "ADMIN_APPROVED").length;
}

// ── Component ──────────────────────────────────────────────────────────────────

interface ExecutiveSummaryPageProps {
  onNavigate?: (page: PageId) => void;
}

export function ExecutiveSummaryPage({ onNavigate }: ExecutiveSummaryPageProps) {
  const { session, projectId } = useProjectLayer();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [surveys,      setSurveys]      = useState<PortalSurvey[]>([]);
  const [deliverables, setDeliverables] = useState<PortalDeliverable[]>([]);
  const [risks,        setRisks]        = useState<PortalRisk[]>([]);
  const [changeReqs,   setChangeReqs]   = useState<PortalProjectChangeRequest[]>([]);
  const [invoices,     setInvoices]     = useState<PortalInvoice[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [mounted,      setMounted]      = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setError(null);

    const loads: Promise<void>[] = [];
    let hasError = false;

    function markError() {
      hasError = true;
    }

    // Surveys: requires clientId from session user
    const clientId = (session.user as { clientId?: string })?.clientId ?? session.user?.id ?? "";
    if (clientId) {
      loads.push(
        loadPortalSurveysWithRefresh(session, clientId).then(result => {
          if (result.nextSession) saveSession(result.nextSession);
          if (result.error) { markError(); return; }
          if (result.data) setSurveys(result.data);
        })
      );
    }

    // Invoices (session-scoped, no clientId param)
    loads.push(
      loadPortalInvoicesWithRefresh(session).then(result => {
        if (result.nextSession) saveSession(result.nextSession);
        if (result.error) { markError(); return; }
        if (result.data) setInvoices(result.data);
      })
    );

    // Change requests (session-scoped)
    loads.push(
      loadPortalChangeRequestsWithRefresh(session, projectId ? { projectId } : {}).then(result => {
        if (result.nextSession) saveSession(result.nextSession);
        if (result.error) { markError(); return; }
        if (result.data) setChangeReqs(result.data);
      })
    );

    // Project-layer data: deliverables + risks (only if projectId available)
    if (projectId) {
      loads.push(
        loadPortalDeliverablesWithRefresh(session, projectId).then(result => {
          if (result.nextSession) saveSession(result.nextSession);
          if (result.error) { markError(); return; }
          if (result.data) setDeliverables(result.data);
        })
      );
      loads.push(
        loadPortalRisksWithRefresh(session, projectId).then(result => {
          if (result.nextSession) saveSession(result.nextSession);
          if (result.error) { markError(); return; }
          if (result.data) setRisks(result.data);
        })
      );
    }

    Promise.all(loads).finally(() => {
      setLoading(false);
      setLastUpdated(new Date());
      if (hasError) {
        setError("Failed to load executive summary data. Please try again.");
      }
    });
  }, [session, projectId, refreshKey]);

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const healthScore    = useMemo(() => deriveHealthScore(invoices), [invoices]);
  const budgetHealth   = useMemo(() => deriveBudgetHealth(invoices), [invoices]);
  const deliveryHealth = useMemo(() => deriveDeliveryHealth(deliverables), [deliverables]);
  const nps            = useMemo(() => deriveNPS(surveys), [surveys]);

  const openRisks       = useMemo(() => risks.filter(r => r.status === "OPEN" || r.status === "ACTIVE"), [risks]);
  const pendingApprovals = useMemo(() => pendingSignOffCount(changeReqs), [changeReqs]);
  const pendingCRs      = useMemo(() => pendingCRCount(changeReqs), [changeReqs]);
  const topSeverity     = useMemo(() => highestSeverityLabel(openRisks), [openRisks]);

  const today = lastUpdated
    ? lastUpdated.toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  // ── Ring fill for health score ───────────────────────────────────────────────
  const ringColor  = scoreColor(healthScore);
  const dashOffset = mounted && healthScore > 0 ? CIRC * (1 - healthScore / 100) : CIRC;

  // ── Navigate helper ─────────────────────────────────────────────────────────
  function navTo(page: PageId) {
    onNavigate?.(page);
  }

  return (
    <div className={cx("pageBody")}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div className={cx("flex1")}>
          <div className={cx("pageEyebrow")}>Reporting · Overview</div>
          <h1 className={cx("pageTitle")}>Executive View</h1>
          <p className={cx("pageSub")}>Aggregated health, budget, delivery, and satisfaction snapshot for this engagement.</p>
        </div>
        <div className={cx("flexRow", "gap8", "noShrink")}>
          <span className={cx("text11", "colorMuted")}>
            {loading ? "Refreshing…" : `Updated ${today}`}
          </span>
          <button
            className={cx("btnSm", "btnGhost")}
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            aria-label="Refresh executive summary"
          >
            <Ic n="refreshCw" sz={13} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <Alert
          variant="error"
          message={error}
          onRetry={() => { setError(null); setRefreshKey(k => k + 1); }}
        />
      )}

      {/* ── KPI tiles ───────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb20")}>

        {/* Project Health */}
        <div className={cx("statCard", loading ? "statCardAccent" : scoreToneClass(healthScore))}>
          {loading ? (
            <div className={cx("skeletonBlock", "skeleH68")} />
          ) : (
            <>
              <div className={cx("statLabel")}>Project Health</div>
              <div className={cx("flexRow", "gap8", "mt8")}>
                {/* Mini ring */}
                <svg width={56} height={56} viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx={50} cy={50} r={45} fill="none" stroke="var(--b2)" strokeWidth={10} />
                  <circle
                    cx={50} cy={50} r={45}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={10}
                    strokeDasharray={`${CIRC} ${CIRC}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" }}
                  />
                  <text x={50} y={56} textAnchor="middle" fontSize={28} fontWeight={800} fill={ringColor}>
                    {healthScore > 0 ? healthScore : "—"}
                  </text>
                </svg>
                <div className={cx("flexCol", "gap6")}>
                  <div className={cx("statValue")}>{healthScore > 0 ? `${healthScore}/100` : "—"}</div>
                  <div className={cx("text11", "colorMuted")}>{scoreLabel(healthScore)}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Budget Health */}
        <div className={cx("statCard", loading ? "statCardAccent" : scoreToneClass(budgetHealth.score))}>
          {loading ? (
            <div className={cx("skeletonBlock", "skeleH68")} />
          ) : (
            <>
              <div className={cx("statLabel")}>Budget Health</div>
              <div className={cx("statValue", "mt8")}>
                {invoices.length === 0 ? "—" : `${budgetHealth.pct}%`}
              </div>
              {invoices.length > 0 && (
                <>
                  <div className={cx("trackH8", "mt8")}>
                    <div
                      className={cx("pctFillRInherit")}
                      style={{ width: `${budgetHealth.pct}%`, background: scoreColor(budgetHealth.score) }}
                    />
                  </div>
                  <div className={cx("text11", "colorMuted", "mt6")}>
                    {fmtCents(budgetHealth.paidCents)} paid of {fmtCents(budgetHealth.totalCents)}
                  </div>
                </>
              )}
              {invoices.length === 0 && (
                <div className={cx("text11", "colorMuted", "mt6")}>No invoices yet</div>
              )}
            </>
          )}
        </div>

        {/* Delivery Health */}
        <div className={cx("statCard", loading ? "statCardAccent" : scoreToneClass(deliveryHealth.score))}>
          {loading ? (
            <div className={cx("skeletonBlock", "skeleH68")} />
          ) : (
            <>
              <div className={cx("statLabel")}>Delivery Health</div>
              {deliverables.length === 0 ? (
                <div className={cx("statValue", "mt8")}>—</div>
              ) : (
                <>
                  <div className={cx("statValue", "mt8")}>
                    {deliveryHealth.done}/{deliveryHealth.total} done
                  </div>
                  <div className={cx("flexRow", "gap6", "mt6")}>
                    {deliveryHealth.overdue > 0 && (
                      <span className={cx("badge", "badgeRed")}>
                        {deliveryHealth.overdue} overdue
                      </span>
                    )}
                    {deliveryHealth.overdue === 0 && (
                      <span className={cx("badge", "badgeGreen")}>On track</span>
                    )}
                  </div>
                </>
              )}
              {deliverables.length === 0 && !projectId && (
                <div className={cx("text11", "colorMuted", "mt6")}>Select a project to view</div>
              )}
            </>
          )}
        </div>

        {/* Satisfaction / NPS */}
        <div className={cx("statCard", loading ? "statCardAccent" : nps.score !== null ? scoreToneClass(Math.min(100, ((nps.score + 100) / 2))) : "statCardAccent")}>
          {loading ? (
            <div className={cx("skeletonBlock", "skeleH68")} />
          ) : (
            <>
              <div className={cx("statLabel")}>Satisfaction (NPS)</div>
              <div className={cx("statValue", "mt8")}>
                {nps.score !== null ? nps.score : "—"}
              </div>
              <div className={cx("text11", "colorMuted", "mt6")}>
                {nps.lastDate ? `Last survey ${nps.lastDate}` : "No surveys completed"}
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── Open Actions ────────────────────────────────────────────────────── */}
      <div className={cx("card", "mb20")}>
        <div className={cx("cardHd")}>
          <Ic n="alertTriangle" sz={14} c="var(--amber)" />
          <span className={cx("cardHdTitle", "ml6")}>Open Actions</span>
          {!loading && (pendingApprovals + pendingCRs + openRisks.length) === 0 && (
            <span className={cx("badge", "badgeGreen", "mlAuto")}>All clear</span>
          )}
        </div>
        <div className={cx("cardBodyPad")}>
          {loading ? (
            <>
              <div className={cx("skeletonBlock", "skeleH80", "mb8")} />
              <div className={cx("skeletonBlock", "skeleH80", "mb8")} />
              <div className={cx("skeletonBlock", "skeleH80")} />
            </>
          ) : (
            <div className={cx("listGroup")}>

              {/* Pending approvals */}
              <div className={cx("listRow")}>
                <div className={cx("flexRow", "gap8", "flex1")}>
                  <Ic n="check" sz={14} c={pendingApprovals > 0 ? "var(--amber)" : "var(--lime)"} />
                  <div className={cx("flex1")}>
                    <div className={cx("fw600", "text13")}>Pending Approvals</div>
                    <div className={cx("text11", "colorMuted")}>Sign-offs awaiting your review</div>
                  </div>
                </div>
                <span className={cx("badge", pendingApprovals > 0 ? "badgeAmber" : "badgeMuted")}>
                  {pendingApprovals}
                </span>
              </div>

              {/* Open change requests */}
              <div className={cx("listRow")}>
                <div className={cx("flexRow", "gap8", "flex1")}>
                  <Ic n="gitBranch" sz={14} c={pendingCRs > 0 ? "var(--amber)" : "var(--lime)"} />
                  <div className={cx("flex1")}>
                    <div className={cx("fw600", "text13")}>Open Change Requests</div>
                    <div className={cx("text11", "colorMuted")}>Submitted or under estimate</div>
                  </div>
                </div>
                <span className={cx("badge", pendingCRs > 0 ? "badgeAmber" : "badgeMuted")}>
                  {pendingCRs}
                </span>
              </div>

              {/* Active risks */}
              <div className={cx("listRow")}>
                <div className={cx("flexRow", "gap8", "flex1")}>
                  <Ic n="shield" sz={14} c={openRisks.length > 0 ? "var(--red)" : "var(--lime)"} />
                  <div className={cx("flex1")}>
                    <div className={cx("fw600", "text13")}>Active Risks</div>
                    <div className={cx("text11", "colorMuted")}>
                      Highest severity: {topSeverity}
                    </div>
                  </div>
                </div>
                <span className={cx("badge", openRisks.length > 0 ? "badgeRed" : "badgeMuted")}>
                  {openRisks.length}
                </span>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ── Quick navigation ─────────────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Quick Navigation</span>
        </div>
        <div className={cx("cardBodyPad", "flexRow", "gap12")}>
          <button
            className={cx("btnSm", "btnGhost")}
            onClick={() => navTo("budgetTracker")}
            disabled={!onNavigate}
          >
            View Full Budget
            <Ic n="chevronRight" sz={12} />
          </button>
          <button
            className={cx("btnSm", "btnGhost")}
            onClick={() => navTo("milestones")}
            disabled={!onNavigate}
          >
            View Milestones
            <Ic n="chevronRight" sz={12} />
          </button>
          <button
            className={cx("btnSm", "btnGhost")}
            onClick={() => navTo("riskRegister")}
            disabled={!onNavigate}
          >
            View Risk Register
            <Ic n="chevronRight" sz={12} />
          </button>
        </div>
      </div>

    </div>
  );
}
