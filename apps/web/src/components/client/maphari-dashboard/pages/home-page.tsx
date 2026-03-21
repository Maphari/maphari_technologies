"use client";

// ════════════════════════════════════════════════════════════════════════════
// home-page.tsx — Command Dashboard (revamped)
// Real data:  deliverables, invoices, appointments, announcements, risks,
//             milestoneApprovals, projects, budgetHealth, phases, session
// Static:     VELOCITY dots, MANAGER fallback
// Helpers:    ./home-page-helpers.ts
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, Fragment } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { ProjectCard, InvoiceSummaryRow, BudgetHealth } from "../types";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalPhasesWithRefresh,
  loadPortalDeliverablesWithRefresh,
  loadPortalRisksWithRefresh,
  type PortalPhase,
  type PortalDeliverable,
  type PortalRisk,
} from "../../../../lib/api/portal/project-layer";
import {
  loadPortalInvoicesWithRefresh,
  loadPortalMilestoneApprovalsWithRefresh,
} from "../../../../lib/api/portal/projects";
import { loadPortalAppointmentsWithRefresh } from "../../../../lib/api/portal/client-cx";
import { loadPortalAnnouncementsWithRefresh } from "../../../../lib/api/portal/governance";
import { loadPortalContractsWithRefresh, type PortalContract } from "../../../../lib/api/portal/contracts";
import type { PortalInvoice, PortalMilestoneApproval } from "../../../../lib/api/portal/types";
import type { PortalAppointment } from "../../../../lib/api/portal/client-cx";
import type { PortalAnnouncement } from "../../../../lib/api/portal/governance";
import { saveSession } from "../../../../lib/auth/session";
import { setPortalPreferenceWithRefresh } from "../../../../lib/api/portal/settings";
import type { PageId } from "../config";
import {
  extractFirstName, getGreeting, formatDate, fmtCents,
  buildDynamicActions, mapDeliverablesToDisplay, computeSprintBadge,
  computeDeliverableProgress, computeScopeTags,
  mapRisksToDisplay, buildRealFeed, buildTeamFromCollaborators,
  type DynamicAction,
} from "./home-page-helpers";

// ── Static visual constants ──────────────────────────────────────────────────

const VELOCITY = ["done", "done", "done", "done", "fail", "done", "done", "active"] as const;

const MANAGER = {
  initials: "MT", name: "Maphari Team",
  role: "Client Success", online: true,
};

const NPS_LABELS = ["Rough week", "Could be better", "Pretty good", "Really happy", "Absolutely stellar"];

// ── Phase mapper ──────────────────────────────────────────────────────────────

type PhaseDisplay = { label: string; state: "done" | "active" | "plan"; pct: number };

function mapApiPhasesToDisplay(phases: PortalPhase[], progressPct: number, hasProject: boolean): PhaseDisplay[] {
  if (!hasProject || phases.length === 0) return [];
  const sorted   = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
  const totalHrs = sorted.reduce((s, p) => s + Math.max(p.budgetedHours || 1, 1), 0);
  let cumulative = 0;
  return sorted.map(p => {
    const share = (Math.max(p.budgetedHours || 1, 1) / totalHrs) * 100;
    const start = cumulative;
    const end   = Math.min(Math.round(cumulative + share), 100);
    cumulative  = end;
    let state: "done" | "active" | "plan";
    if (end <= progressPct)       state = "done";
    else if (start < progressPct) state = "active";
    else                          state = "plan";
    const pct = state === "done" ? 100 : state === "active"
      ? Math.round(((progressPct - start) / Math.max(1, end - start)) * 100) : 0;
    return { label: p.name, state, pct };
  });
}

// ── Health Arc ────────────────────────────────────────────────────────────────
// 240° gauge arc — starts at 7:30 (SW), sweeps clockwise to 4:30 (SE)

function HealthArc({ score, size = 110 }: { score: number; size?: number }) {
  const r    = size * 0.4;
  const cxPos = size / 2;
  const cy   = size / 2;
  const circ = 2 * Math.PI * r;
  const arc  = (240 / 360) * circ;
  const gap  = circ - arc;
  const fill = Math.max(0, Math.min(1, score / 100)) * arc;
  const color = score >= 80 ? "var(--lime)"
    : score >= 60 ? "var(--amber)"
    : score > 0   ? "var(--red)"
    : "var(--b2)";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cx("dBlock")}>
      {/* Track */}
      <circle cx={cxPos} cy={cy} r={r} fill="none"
        stroke="var(--b1)" strokeWidth={5.5}
        strokeDasharray={`${arc} ${gap}`} strokeLinecap="round"
        transform={`rotate(150 ${cxPos} ${cy})`}
      />
      {/* Fill */}
      <circle cx={cxPos} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={5.5}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        transform={`rotate(150 ${cxPos} ${cy})`}
        className={cx("svgRingCircleAnim")}
      />
      {/* Score number */}
      <text x={cxPos} y={cy + 4} textAnchor="middle"
        fontSize={size * 0.22} fontWeight="800" fill={color}
        fontFamily="var(--font-dm-mono), monospace">
        {score > 0 ? score : "—"}
      </text>
      {/* Label */}
      <text x={cxPos} y={cy + size * 0.168} textAnchor="middle"
        fontSize={size * 0.072} fill="var(--muted2)"
        fontFamily="var(--font-syne), sans-serif" letterSpacing="2">
        HEALTH
      </text>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HomePage({
  projects: apiProjects = [],
  outstandingInvoices: apiOutstanding = [],
  budgetHealth: apiBudgetHealth,
  onNavigate,
}: {
  projects?: ProjectCard[];
  outstandingInvoices?: InvoiceSummaryRow[];
  budgetHealth?: BudgetHealth;
  onNavigate?: (page: PageId) => void;
}) {
  const { session, projectId } = useProjectLayer();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [dismissed,         setDismissed]         = useState<Set<string>>(new Set());
  const [mounted,           setMounted]           = useState(false);
  const [npsRating,         setNpsRating]         = useState<number | null>(null);
  const [npsStep,           setNpsStep]           = useState<"rating" | "feedback" | "done">("rating");
  const [npsText,           setNpsText]           = useState("");
  const [rsvpd,             setRsvpd]             = useState<Set<string>>(new Set());
  const [announceDismissed, setAnnounceDismissed] = useState(false);
  const [celebDismissed,    setCelebDismissed]    = useState(false);
  const [contextDismissed,  setContextDismissed]  = useState(false);
  const [reviewDismissed,   setReviewDismissed]   = useState(false);

  // ── API data state ────────────────────────────────────────────────────────
  const [apiPhases,          setApiPhases]          = useState<PortalPhase[]>([]);
  const [deliverables,       setDeliverables]       = useState<PortalDeliverable[]>([]);
  const [invoices,           setInvoices]           = useState<PortalInvoice[]>([]);
  const [appointments,       setAppointments]       = useState<PortalAppointment[]>([]);
  const [announcements,      setAnnouncements]      = useState<PortalAnnouncement[]>([]);
  const [risks,              setRisks]              = useState<PortalRisk[]>([]);
  const [milestoneApprovals, setMilestoneApprovals] = useState<PortalMilestoneApproval[]>([]);
  const [unsignedContracts,  setUnsignedContracts]  = useState<PortalContract[]>([]);
  const [dataLoading,        setDataLoading]        = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  async function handleNpsSend(): Promise<void> {
    setNpsStep("done");
    if (!session || npsRating === null) return;
    const r = await setPortalPreferenceWithRefresh(session, {
      key: "weeklyPulse",
      value: JSON.stringify({ rating: npsRating, label: NPS_LABELS[npsRating], text: npsText, date: new Date().toISOString() }),
    });
    if (r.nextSession) saveSession(r.nextSession);
  }

  // ── Parallel data fetch ───────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !projectId) return;
    setDataLoading(true);
    Promise.allSettled([
      loadPortalPhasesWithRefresh(session, projectId),
      loadPortalDeliverablesWithRefresh(session, projectId),
      loadPortalInvoicesWithRefresh(session),
      loadPortalAppointmentsWithRefresh(session),
      loadPortalAnnouncementsWithRefresh(session),
      loadPortalRisksWithRefresh(session, projectId),
      loadPortalMilestoneApprovalsWithRefresh(session),
      loadPortalContractsWithRefresh(session),
    ]).then(([phaseRes, delRes, invRes, apptRes, announceRes, riskRes, maRes, contractsRes]) => {
      if (phaseRes.status === "fulfilled" && phaseRes.value.data?.length) {
        if (phaseRes.value.nextSession) saveSession(phaseRes.value.nextSession);
        setApiPhases(phaseRes.value.data);
      }
      if (delRes.status === "fulfilled" && delRes.value.data) {
        if (delRes.value.nextSession) saveSession(delRes.value.nextSession);
        setDeliverables(delRes.value.data);
      }
      if (invRes.status === "fulfilled"    && invRes.value.data)    setInvoices(invRes.value.data);
      if (apptRes.status === "fulfilled"   && apptRes.value.data)   setAppointments(apptRes.value.data);
      if (announceRes.status === "fulfilled" && announceRes.value.data) setAnnouncements(announceRes.value.data);
      if (riskRes.status === "fulfilled"   && riskRes.value.data)   setRisks(riskRes.value.data);
      if (maRes.status === "fulfilled"     && maRes.value.data)     setMilestoneApprovals(maRes.value.data);
      if (contractsRes.status === "fulfilled" && !contractsRes.value.error && contractsRes.value.data) {
        if (contractsRes.value.nextSession) saveSession(contractsRes.value.nextSession);
        setUnsignedContracts(contractsRes.value.data.filter(c => !c.signed && c.status !== "VOID"));
      }
    }).finally(() => setDataLoading(false));
  }, [session, projectId]);

  // ── Derived: project ──────────────────────────────────────────────────────
  const firstActiveProject = apiProjects.find(
    p => p.status === "Active" || p.status === "In Progress",
  ) ?? apiProjects[0];

  const pendingRequests = apiProjects.filter(
    p => p.status === "Pending Review" || p.status === "Request Pending" || p.status === "Awaiting Payment"
  );

  const healthScore = firstActiveProject
    ? Math.max(0, 100
        - (firstActiveProject.riskLevel === "CRITICAL" ? 40
          : firstActiveProject.riskLevel === "HIGH" ? 25
          : firstActiveProject.riskLevel === "MEDIUM" ? 10 : 0)
        + Math.round(firstActiveProject.progressPercent * 0.15))
    : 0;

  const progressPct  = firstActiveProject?.progressPercent ?? 0;
  const sprintPct    = progressPct / 100;
  const projectName  = firstActiveProject?.name ?? "Your Project";
  const nextDelivery = firstActiveProject?.dueAt
    ? new Date(firstActiveProject.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "—";
  const daysUntilDelivery = firstActiveProject?.dueAt
    ? Math.max(0, Math.ceil((new Date(firstActiveProject.dueAt).getTime() - Date.now()) / 86400000))
    : 0;
  const budgetLeft    = apiBudgetHealth ? fmtCents(apiBudgetHealth.totalBudgetCents - apiBudgetHealth.spentCents) : "—";
  const budgetTotal   = apiBudgetHealth ? fmtCents(apiBudgetHealth.totalBudgetCents) : "—";
  const budgetLeftPct = apiBudgetHealth
    ? Math.max(0, (apiBudgetHealth.totalBudgetCents - apiBudgetHealth.spentCents) / Math.max(1, apiBudgetHealth.totalBudgetCents))
    : 0;

  // ── Derived: deliverables ─────────────────────────────────────────────────
  const displayDeliverables = mapDeliverablesToDisplay(deliverables);
  const sprintBadge         = deliverables.length > 0 ? computeSprintBadge(deliverables) : (dataLoading ? "…" : "0 of 0 done");
  const deliverableProgress = computeDeliverableProgress(deliverables);
  const scopeTags           = computeScopeTags(deliverables);

  // ── Derived: invoices ─────────────────────────────────────────────────────
  const paidInvoices  = invoices.filter(i => i.status === "PAID");
  const paidTotal     = paidInvoices.reduce((s, i) => s + i.amountCents, 0);
  const totalInvoiced = invoices.reduce((s, i) => s + i.amountCents, 0);
  const paidPct       = totalInvoiced > 0 ? paidTotal / totalInvoiced : 0;
  const invoiceBadge  = invoices.filter(i => i.status === "OVERDUE" || i.status === "ISSUED").length;

  // ── Derived: finance display ──────────────────────────────────────────────
  const financeDisplay = [
    { label: "Budget Used",
      val: apiBudgetHealth ? `${fmtCents(apiBudgetHealth.spentCents)} / ${fmtCents(apiBudgetHealth.totalBudgetCents)}` : "—",
      pct: apiBudgetHealth ? apiBudgetHealth.burnRate / 100 : 0, color: "var(--lime)" },
    { label: "Sprint",
      val: firstActiveProject ? `${firstActiveProject.progressPercent}% complete` : "—",
      pct: sprintPct, color: "var(--purple)" },
    { label: "Paid",
      val: totalInvoiced > 0 ? `${fmtCents(paidTotal)} / ${fmtCents(totalInvoiced)}` : "—",
      pct: paidPct, color: "var(--amber)" },
    { label: "Budget Left",
      val: `${budgetLeft} of ${budgetTotal}`,
      pct: budgetLeftPct, color: "var(--green)" },
  ];

  // ── Derived: KPI pods ─────────────────────────────────────────────────────
  const pods = [
    {
      icon: "layers",   label: "Sprint",
      value: firstActiveProject ? `${firstActiveProject.completedTaskCount}/${firstActiveProject.taskCount}` : "—",
      sub: "deliverables done", pct: sprintPct, color: "var(--lime)",
    },
    {
      icon: "dollar",   label: "Budget Left",
      value: budgetLeft,
      sub: `of ${budgetTotal}`, pct: budgetLeftPct, color: "var(--green)",
    },
    {
      icon: "list",     label: "Your Approvals",
      value: String(apiOutstanding.length),
      sub: apiOutstanding.length > 0 ? "waiting on you" : "all clear",
      pct: Math.min(1, apiOutstanding.length * 0.25), color: "var(--amber)",
    },
    {
      icon: "calendar", label: "Next Delivery",
      value: nextDelivery,
      sub: daysUntilDelivery > 0 ? `${daysUntilDelivery} days away` : "—",
      pct: firstActiveProject ? (1 - sprintPct) * 0.5 : 0, color: "var(--purple)",
    },
  ];

  // ── Derived: events ───────────────────────────────────────────────────────
  const displayEvents = appointments
    .filter(a => a.scheduledAt && new Date(a.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 1);
  const nextEvent = displayEvents[0] ?? null;
  const nextEventTitle = nextEvent
    ? (nextEvent.ownerName ? `${nextEvent.ownerName} — ${nextEvent.type}` : nextEvent.type)
    : "";

  // ── Derived: announcement + celebration ───────────────────────────────────
  const latestAnnouncement = announcements
    .filter(a => a.publishedAt)
    .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())[0] ?? null;

  const recentlyCompleted = deliverables
    .filter(d => d.status === "APPROVED")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null;

  // ── Derived: risks ────────────────────────────────────────────────────────
  const displayRisks = mapRisksToDisplay(risks);

  // ── Derived: actions ──────────────────────────────────────────────────────
  const dynamicActions = buildDynamicActions(invoices, milestoneApprovals, deliverables, appointments);
  const activeActions  = dynamicActions.filter((a: DynamicAction) => !dismissed.has(a.id));
  const overdueCount   = activeActions.filter((a: DynamicAction) => a.dueCls === "hxCountOverdue").length;
  const pendingCount   = activeActions.length;

  // ── Derived: greetings ────────────────────────────────────────────────────
  const firstName     = extractFirstName(session?.user.email ?? "");
  const greeting      = getGreeting();
  const displayPhases = mapApiPhasesToDisplay(apiPhases, progressPct, !!firstActiveProject);

  // ── Derived: team + feed ──────────────────────────────────────────────────
  const displayTeam = buildTeamFromCollaborators(firstActiveProject?.collaborators ?? []);
  const liveCount   = displayTeam.filter(m => m.active).length;
  const displayFeed = buildRealFeed(deliverables, risks, appointments, announcements);

  // Silence unused-var lint for values kept for future use
  void dataLoading;

  // ── Status text helpers ───────────────────────────────────────────────────
  const riskLabel = !firstActiveProject ? "—"
    : firstActiveProject.riskLevel === "CRITICAL" ? "🔴 Critical"
    : firstActiveProject.riskLevel === "HIGH"     ? "🟠 At risk"
    : firstActiveProject.riskLevel === "MEDIUM"   ? "🟡 Watch list"
    : "🟢 On track";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={cx("pageBody", "rdStudioPage")}>

      {/* ══ HERO COMMAND CARD ═════════════════════════════════════════════ */}
      <div className={cx("cmdHero", "rdStudioCard")}>
        <div className={cx("cmdHeroBg")} aria-hidden="true" />
        <div className={cx("cmdHeroGlow")} aria-hidden="true" />

        {/* Left: greeting + project context + CTAs */}
        <div className={cx("cmdHeroLeft")}>
          <div className={cx("cmdProjectLabel")}>
            {firstActiveProject
              ? `${projectName} · ${displayPhases.filter(p => p.state === "done").length} of ${displayPhases.length} phases`
              : dataLoading ? "Loading…" : "No active project"}
            &nbsp;·&nbsp;{new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
          </div>

          <div className={cx("cmdGreeting")}>{greeting}, {firstName}.</div>

          {/* Status pills */}
          <div className={cx("cmdBriefRow")}>
            {overdueCount > 0 && (
              <span className={cx("hxBriefPill", "hxBriefPillRed")}>
                <Ic n="alert" sz={9} c="var(--red)" />{overdueCount} overdue
              </span>
            )}
            {pendingCount > 0 && (
              <span className={cx("hxBriefPill", "hxBriefPillAmber")}>
                <Ic n="list" sz={9} c="var(--amber)" />{pendingCount} need attention
              </span>
            )}
            {firstActiveProject ? (
              firstActiveProject.riskLevel === "CRITICAL" || firstActiveProject.riskLevel === "HIGH" ? (
                <span className={cx("hxBriefPill", "hxBriefPillRed")}>
                  <Ic n="alert" sz={9} c="var(--red)" />Project at risk
                </span>
              ) : firstActiveProject.riskLevel === "MEDIUM" ? (
                <span className={cx("hxBriefPill", "hxBriefPillAmber")}>
                  <Ic n="alert" sz={9} c="var(--amber)" />Needs attention
                </span>
              ) : (
                <span className={cx("hxBriefPill", "hxBriefPillGreen")}>
                  <Ic n="check" sz={9} c="var(--lime)" />On track
                </span>
              )
            ) : null}
          </div>

          {/* Quick-action CTAs */}
          <div className={cx("cmdCtaRow")}>
            <button type="button" className={cx("cmdCta")} onClick={() => onNavigate?.("bookCall")}>
              <Ic n="calendar" sz={12} c="var(--bg)" />Book a Call
            </button>
            <button type="button" className={cx("cmdCtaGhost")} onClick={() => onNavigate?.("messages")}>
              <Ic n="message" sz={12} c="var(--muted)" />Message Team
            </button>
            {invoiceBadge > 0 && (
              <button type="button" className={cx("cmdCtaGhost", "urgentBadgeBtn")}
                onClick={() => onNavigate?.("invoices")}>
                <Ic n="creditCard" sz={12} c="var(--red)" />Pay Invoice
              </button>
            )}
          </div>
        </div>

        {/* Right: arc health meter */}
        <div className={cx("cmdHeroRight")}>
          <HealthArc score={firstActiveProject ? healthScore : 0} size={108} />
          <div className={cx("cmdArcMeta")}>{riskLabel}</div>
          <div className={cx("fontMono", "fs057", "colorMuted2", "textCenter", "ls004")}>
            DELIVERY · {nextDelivery}
          </div>
        </div>
      </div>

      {/* ══ STATUS CONTEXT STRIP ══════════════════════════════════════════ */}
      {!contextDismissed && firstActiveProject && (
        firstActiveProject.riskLevel === "CRITICAL" ? (
          <div className={cx("cmdContextStrip", "cmdContextStripCritical")}>
            <div className={cx("cmdContextStripIcon")}>
              <Ic n="alert" sz={14} c="var(--red)" />
            </div>
            <div className={cx("cmdContextStripBody")}>
              <strong>Your project needs urgent attention.</strong>
              The team is managing critical risks that may affect your delivery date. Watch &lsquo;Today&rsquo;s Focus&rsquo; for any actions required from you.
            </div>
            <button type="button" className={cx("cmdContextStripDismiss")} aria-label="Dismiss" onClick={() => setContextDismissed(true)}>
              <Ic n="x" sz={12} c="var(--muted2)" />
            </button>
          </div>
        ) : firstActiveProject.riskLevel === "HIGH" ? (
          <div className={cx("cmdContextStrip", "cmdContextStripHigh")}>
            <div className={cx("cmdContextStripIcon")}>
              <Ic n="alert" sz={14} c="var(--amber)" />
            </div>
            <div className={cx("cmdContextStripBody")}>
              <strong>Your project is at risk.</strong>
              Some issues may affect timeline or scope. No action needed right now — the team is on it and will flag anything that needs your input.
            </div>
            <button type="button" className={cx("cmdContextStripDismiss")} aria-label="Dismiss" onClick={() => setContextDismissed(true)}>
              <Ic n="x" sz={12} c="var(--muted2)" />
            </button>
          </div>
        ) : firstActiveProject.riskLevel === "MEDIUM" ? (
          <div className={cx("cmdContextStrip", "cmdContextStripMedium")}>
            <div className={cx("cmdContextStripIcon")}>
              <Ic n="alert" sz={13} c="var(--amber)" />
            </div>
            <div className={cx("cmdContextStripBody")}>
              <strong>Some items need watching.</strong>
              The team is monitoring potential blockers. Nothing urgent from your end.
            </div>
            <button type="button" className={cx("cmdContextStripDismiss")} aria-label="Dismiss" onClick={() => setContextDismissed(true)}>
              <Ic n="x" sz={12} c="var(--muted2)" />
            </button>
          </div>
        ) : null
      )}

      {/* ══ BANNERS ═══════════════════════════════════════════════════════ */}
      {!announceDismissed && latestAnnouncement && (
        <div className={cx("cmdAnnounceCard")}>
          <div className={cx("purpleIconBox32")}>
            <Ic n="zap" sz={14} c="var(--purple)" />
          </div>
          <div className={cx("flex1", "minW0")}>
            <div className={cx("fs069", "fw700", "colorText", "mb2")}>{latestAnnouncement.title}</div>
            <div className={cx("fs0585", "colorMuted")}>
              {latestAnnouncement.publishedAt ? `Published ${formatDate(latestAnnouncement.publishedAt)}` : "New update from your project team"}
            </div>
          </div>
          <span className={cx("badge", "badgePurple")}>New</span>
          <button type="button" aria-label="Dismiss announcement" onClick={() => setAnnounceDismissed(true)} className={cx("cmdDismissBtn")}>
            <Ic n="x" sz={12} c="var(--muted2)" />
          </button>
        </div>
      )}

      {!celebDismissed && recentlyCompleted && (
        <div className={cx("cmdCelebStrip")}>
          <div className={cx("iconLimeBox32")}>
            <Ic n="flag" sz={14} c="var(--lime)" />
          </div>
          <div className={cx("flex1", "minW0")}>
            <div className={cx("fs069", "fw700", "colorText", "mb2")}>{recentlyCompleted.name} — Delivered & Approved</div>
            <div className={cx("fs0585", "colorMuted")}>Signed off by the team. Great progress!</div>
          </div>
          <span className={cx("badge", "badgeGreen")}>Done</span>
          <button type="button" aria-label="Dismiss celebration" onClick={() => setCelebDismissed(true)} className={cx("cmdDismissBtn")}>
            <Ic n="x" sz={12} c="var(--muted2)" />
          </button>
        </div>
      )}

      {/* ══ PENDING PROJECT REQUEST BANNER ═══════════════════════════════ */}
      {!reviewDismissed && pendingRequests.length > 0 && pendingRequests.map(pr => (
        <div key={pr.id} className={cx("card", "mb14")} style={{ borderLeft: "3px solid var(--amber)" }}>
          <div className={cx("cardHd")}>
            <div className={cx("flexRow", "gap8")}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: "var(--amber)",
                boxShadow: "0 0 6px var(--amber)", flexShrink: 0, marginTop: 5,
              }} />
              <div>
                <div className={cx("text10", "uppercase", "tracking", "fw700", "colorAmber")}>Project Under Review</div>
                <div className={cx("fw600", "text12", "mt2")}>{pr.name}</div>
              </div>
            </div>
            <button
              type="button"
              className={cx("btnSm", "btnGhost", "mlAuto")}
              onClick={() => setReviewDismissed(true)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
          <div className={cx("cardBodyPad")}>
            <div className={cx("text12", "colorMuted", "mb12")}>
              Your project request has been received and is being reviewed by our team. We&apos;ll be in touch within 24–48 hours.
            </div>
            <div className={cx("flexRow", "gap16", "flexWrap")}>
              <div>
                <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb4")}>Deposit Paid</div>
                <div className={cx("fontMono", "fw700", "colorAccent")}>
                  {pr.budgetCents > 0 ? `R ${Math.round(pr.budgetCents * 0.5 / 100).toLocaleString("en-ZA")}` : "Pending"}
                </div>
              </div>
              <div>
                <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb4")}>Status</div>
                <span className={cx("badge", "badgeAmber")}>{pr.status}</span>
              </div>
              <div>
                <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb4")}>Next Step</div>
                <div className={cx("text12", "colorMuted")}>Admin review → Proposal</div>
              </div>
            </div>
            <div className={cx("flexRow", "gap8", "mt14")}>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => onNavigate?.("myProjects")}
              >
                View Project
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => onNavigate?.("messages")}
              >
                Message Team
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* ══ NO PROJECTS EMPTY STATE ══════════════════════════════════════ */}
      {!dataLoading && apiProjects.length === 0 && pendingRequests.length === 0 && (
        <div className={cx("card", "mb20")} style={{ padding: "40px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* Gradient blob */}
          <div style={{
            position: "absolute", width: 300, height: 300, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200, 241, 53, 0.05) 0%, transparent 70%)",
            top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, border: "1px solid rgba(200, 241, 53, 0.2)",
              background: "rgba(200, 241, 53, 0.04)", display: "grid", placeItems: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <div className={cx("fw700", "text12")} style={{ marginBottom: 8 }}>No active projects yet</div>
            <div className={cx("colorMuted", "text11")} style={{ maxWidth: 280, margin: "0 auto 18px" }}>
              Submit a project request and our team will review it within 24–48 hours.
            </div>
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              onClick={() => onNavigate?.("projectRequest")}
            >
              Start a Project
            </button>
          </div>
        </div>
      )}

      {/* ══ UNSIGNED CONTRACT ALERT ═══════════════════════════════════════ */}
      {unsignedContracts.length > 0 && (
        <div className={cx("ctUnsignedBanner")} style={{ marginBottom: "16px" }}>
          <Ic n="fileText" sz={16} c="var(--amber)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--amber)" }}>
              {unsignedContracts.length} document{unsignedContracts.length > 1 ? "s" : ""} require your signature
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted2)", marginTop: "2px" }}>
              {unsignedContracts.map(c => c.title).join(" · ")}
            </div>
          </div>
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={() => onNavigate?.("contractsProposals")}
          >
            Review &amp; Sign →
          </button>
        </div>
      )}

      {/* ══ KPI PODS ══════════════════════════════════════════════════════ */}
      <div className={cx("cmdPods")}>
        {pods.map(p => (
          <div key={p.label} className={cx("cmdPod")}>
            <div className={cx("cmdPodEyebrow", "rdStudioLabel")}>
              <Ic n={p.icon} sz={10} c="var(--muted2)" />{p.label}
            </div>
            <div className={cx("cmdPodValue", "rdStudioMetric")}>{p.value}</div>
            <div className={cx("cmdPodSub")}>{p.sub}</div>
            <div className={cx("cmdPodBar")}>
              <div className={cx("cmdPodBarFill", "dynBgColor", mounted ? "hxBarMounted" : "")}
                style={{ "--bar-pct": String(p.pct), "--bg-color": p.color } as React.CSSProperties}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ══ MID ROW: Today's Focus + Phase Journey ════════════════════════ */}
      <div className={cx("cmdMidRow")}>

        {/* ── Today's Focus ── */}
        <div className={cx("cmdFocusCard")}>
          <div className={cx("cmdCardHd")}>
            <Ic n="alert" sz={13} c="var(--amber)" />
            <span className={cx("cmdCardHdTitle")}>Today&apos;s Focus</span>
            <span className={cx("badge", "badgeAmber", "mlAuto")}>
              {activeActions.length} items
            </span>
          </div>

          {activeActions.length === 0 ? (
            <div className={cx("p32x18", "flexCol", "flexCenter", "gap10")}>
              <div className={cx("iconLimeCircle40")}>
                <Ic n="check" sz={18} c="var(--lime)" />
              </div>
              <div className={cx("allClearTitle")}>All clear</div>
              <div className={cx("allClearSub")}>
                No actions need your attention right now.
              </div>
            </div>
          ) : (
            activeActions.slice(0, 5).map((a: DynamicAction, i: number) => {
              const isHigh = a.dueCls === "hxCountOverdue";
              const isMed  = a.badge === "badgeAmber";
              return (
                <div key={a.id} className={cx("cmdFocusItem")}>
                  <div className={cx("cmdFocusPrio",
                    isHigh ? "cmdFocusPrioHigh" : isMed ? "cmdFocusPrioMed" : "cmdFocusPrioLow",
                  )} />
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("cmdFocusTitle")}>{a.title}</div>
                    <div className={cx("cmdFocusSub")}>{a.sub} · {a.due}</div>
                  </div>
                  <button type="button"
                    className={cx("cmdFocusCta", isHigh ? "cmdFocusCtaRed" : "")}
                    onClick={() => setDismissed(p => new Set([...p, a.id]))}
                  >
                    {a.cta}
                  </button>
                </div>
              );
            })
          )}

          {activeActions.length > 5 && (
            <div className={cx("p10x18", "fs058", "colorMuted2", "borderT")}>
              +{activeActions.length - 5} more items waiting
            </div>
          )}
        </div>

        {/* ── Phase Journey ── */}
        <div className={cx("cmdPhaseCard")}>
          <div className={cx("cmdCardHd")}>
            <Ic n="layers" sz={13} c="var(--lime)" />
            <span className={cx("cmdCardHdTitle")}>Phase Journey</span>
            {firstActiveProject && (
              <span className={cx("badge", "badgeAccent", "mlAuto")}>
                {displayPhases.filter(p => p.state === "done").length}/{displayPhases.length} done
              </span>
            )}
          </div>

          {/* Visual node track */}
          <div className={cx("cmdPhaseTrack")}>
            {displayPhases.length === 0 ? (
              <div className={cx("wFull", "py18_0", "textCenter", "colorMuted2", "fs06")}>
                {dataLoading ? "Loading phases…" : "No phases configured yet"}
              </div>
            ) : displayPhases.map((ph, i) => (
              <Fragment key={ph.label}>
                {i > 0 && (
                  <div className={cx("cmdPhaseConn", ph.state === "done" ? "cmdPhaseConnDone" : "")} />
                )}
                <div className={cx("cmdPhaseNode")}>
                  <div className={cx("cmdPhaseNodeDot",
                    ph.state === "done"   ? "cmdPhaseNodeDotDone"   : "",
                    ph.state === "active" ? "cmdPhaseNodeDotActive" : "",
                  )} />
                  <span className={cx("cmdPhaseNodeLbl",
                    ph.state === "done"   ? "cmdPhaseNodeLblDone"   : "",
                    ph.state === "active" ? "cmdPhaseNodeLblActive" : "",
                  )}>
                    {ph.label}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>

          {/* Detailed phase list */}
          {displayPhases.length > 0 && (
            <div className={cx("cmdPhaseRows")}>
              {displayPhases.map(ph => (
                <div key={ph.label} className={cx("cmdPhaseRow", ph.state === "active" ? "cmdPhaseRowActive" : "")}>
                  <div className={cx("cmdPhaseRowDot", "dynBgColor", ph.state === "plan" && "opacity40")} style={{ "--bg-color": ph.state === "plan" ? "var(--b2)" : "var(--lime)" } as React.CSSProperties} />
                  <span className={cx("flex1")}>{ph.label}</span>
                  {ph.state === "done"   && <span className={cx("badge", "badgeGreen", "fs054")}>Done</span>}
                  {ph.state === "active" && <span className={cx("badge", "badgeAccent", "fs054")}>Active</span>}
                  {ph.state === "plan"   && <span className={cx("badge", "badgeMuted", "fs054")}>Planned</span>}
                  <span className={cx("cmdPhaseRowPct")}>{ph.pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ PIPELINE + ACTIVITY ═══════════════════════════════════════════ */}
      <div className={cx("cmdPipeActivityRow")}>

        {/* ── Deliverable Pipeline ── */}
        <div className={cx("card", "p0")}>
          <div className={cx("cmdCardHd")}>
            <Ic n="rocket" sz={13} c="var(--lime)" />
            <span className={cx("cmdCardHdTitle")}>Deliverable Pipeline</span>
            <div className={cx("hxVelRow", "mlAuto")} title="Sprint velocity — last 8 sprints">
              {VELOCITY.map((v, i) => (
                <div key={i} className={cx("hxVelDot",
                  v === "done"   ? "hxVelDotDone"   : "",
                  v === "active" ? "hxVelDotActive"  : "",
                  v === "fail"   ? "hxVelDotFail"    : "",
                )} />
              ))}
            </div>
            <span className={cx("badge", "badgeAccent")}>{sprintBadge}</span>
          </div>

          <div className={cx("hxTrackBody")}>
            <div className={cx("hxTrackWrap")}>
              <div className={cx("hxTrackBgLine")} />
              <div className={cx("hxTrackProgressLine", mounted ? "hxBarMounted" : "")}
                style={{ "--bar-pct": String(deliverableProgress) } as React.CSSProperties}
              />
              {displayDeliverables.length === 0 ? (
                <div className={cx("emptyPad28x0")}>
                  <span className={cx("emptyDeliverablesIcon")}>◫</span>
                  {dataLoading ? "Loading deliverables…" : "No deliverables yet"}
                </div>
              ) : displayDeliverables.map(d => (
                <div key={d.id} className={cx("hxTrackNode")}>
                  <div className={cx("hxTrackDot", `hxTrackDot${d.state}`)}>
                    <Ic n={d.icon} sz={13} c={d.iconColor} />
                  </div>
                  <div className={cx("hxTrackNodeTitle")}>{d.title}</div>
                  <span className={cx("badge", d.badge)}>{d.status}</span>
                  <div className={cx("hxTrackNodeId")}>{d.id.slice(0, 6).toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>

          {scopeTags.length > 0 && (
            <div className={cx("hxScopeStrip")}>
              <span className={cx("hxScopeTitle")}>In scope</span>
              <div className={cx("hxScopeTags")}>
                {scopeTags.map(t => <span key={t} className={cx("hxScopeTag")}>{t}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* ── Activity & Risks ── */}
        <div className={cx("card", "p0")}>
          <div className={cx("cmdCardHd")}>
            <Ic n="activity" sz={13} c="var(--lime)" />
            <span className={cx("cmdCardHdTitle")}>Activity &amp; Risks</span>
            <div className={cx("hxFreshness", "mlAuto")}>
              <span className={cx("hxFreshDot")} />Live
            </div>
          </div>

          {/* Risk rows — top 2 */}
          {displayRisks.slice(0, 2).map(r => (
            <div key={r.id} className={cx("hxRiskRow")}>
              <div className={cx("hxRiskIco")}><Ic n={r.icon} sz={13} c={r.color} /></div>
              <div className={cx("hxRiskBody")}>
                <div className={cx("hxRiskTitle")}>{r.title}</div>
                <div className={cx("hxRiskSub")}>{r.sub}</div>
              </div>
              <span className={cx("badge",
                r.level === "high" ? "badgeRed" : r.level === "medium" ? "badgeAmber" : "badgeBlue",
              )}>
                {r.level}
              </span>
            </div>
          ))}

          {/* Activity feed — top 5 items */}
          {displayFeed.slice(0, 5).map((f, i) => (
            <div key={`feed-${f.ts}-${i}`} className={cx("hxTimeItem")}>
              <div className={cx("hxTimeVert")}>
                <div className={cx("hxTimeDot")} style={{ "--ev-color": f.evColor } as React.CSSProperties} />
                {i < 4 && <div className={cx("hxTimeVLine")} />}
              </div>
              <div className={cx("hxTimeBody")}>
                <div className={cx("hxTimeAv")} style={{ "--av-color": f.avColor } as React.CSSProperties}>{f.av}</div>
                <div className={cx("hxTimeContent")}>
                  <div className={cx("hxTimeText")}>{f.text}</div>
                  <div className={cx("hxTimeStamp")}>{f.time}</div>
                </div>
              </div>
            </div>
          ))}
          {displayFeed.length === 0 && (
            <div className={cx("p16x20", "colorMuted2", "text11")}>
              {dataLoading ? "Loading activity…" : "No recent activity yet — updates will appear here."}
            </div>
          )}
        </div>
      </div>

      {/* ══ BOTTOM STACK: Finance · Team · Pulse (each full width) ══════ */}
      <div className={cx("cmdBottomRow")}>

        {/* ── Finance — full-width 2×2 bar grid ── */}
        <div className={cx("cmdFinCard")}>
          <div className={cx("cmdCardHd")}>
            <Ic n="dollar" sz={13} c="var(--lime)" />
            <span className={cx("cmdCardHdTitle")}>Financials</span>
            <div className={cx("mlAuto", "flexRow", "gap5", "fs058", "colorMuted2", "fontMono")}>
              <Ic n="activity" sz={9} c="var(--amber)" />
              {budgetLeft} of {budgetTotal} remaining
            </div>
          </div>
          {/* 2×2 grid of finance bars */}
          <div className={cx("cmdFinGrid")}>
            {financeDisplay.map(f => (
              <div key={f.label} className={cx("cmdFinRow")}>
                <span className={cx("cmdFinLabel")}>{f.label}</span>
                <div className={cx("cmdFinBarTrack")}>
                  <div className={cx("cmdFinBarFill", "dynBgColor", mounted ? "hxBarMounted" : "")}
                    style={{ "--bar-pct": String(f.pct), "--bg-color": f.color } as React.CSSProperties}
                  />
                </div>
                <span className={cx("cmdFinPct")}>{Math.round(f.pct * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Team — full-width: cluster left, member grid right ── */}
        <div className={cx("cmdTeamCard")}>
          <div className={cx("cmdCardHd")}>
            <Ic n="users" sz={13} c="var(--lime)" />
            <span className={cx("cmdCardHdTitle")}>Project Team</span>
            <span className={cx("badge", liveCount > 0 ? "badgeGreen" : "badgeMuted", "mlAuto")}>
              {dataLoading ? "…" : liveCount > 0 ? `${liveCount} live` : "away"}
            </span>
          </div>

          <div className={cx("cmdTeamBodyWide")}>
            {/* Left: stacked avatar cluster + live count */}
            <div className={cx("cmdTeamClusterWide")}>
              <div className={cx("cmdTeamAvatarRow")}>
                {displayTeam.length > 0 ? displayTeam.slice(0, 5).map((m, i) => (
                  <div key={`av-${m.av}-${i}`}
                    className={cx("cmdTeamAvWide", m.active ? "cmdTeamAvWideOnline" : "")}
                    style={{ "--av-color": m.color } as React.CSSProperties}
                    title={m.name}
                  >
                    {m.av}
                  </div>
                )) : (
                  <div className={cx("cmdTeamAvWide")} style={{ "--av-color": "var(--accent)" } as React.CSSProperties}>
                    {MANAGER.initials}
                  </div>
                )}
                {displayTeam.length > 5 && (
                  <div className={cx("cmdTeamAvWide", "cmdTeamAvWideOverflow")} style={{ "--av-color": "var(--s3)" } as React.CSSProperties}>
                    +{displayTeam.length - 5}
                  </div>
                )}
              </div>
              <div className={cx("fontSyne", "fs065", "fw700", "colorText", "textCenter")}>
                {dataLoading
                  ? "…"
                  : displayTeam.length > 0
                    ? `${displayTeam.length} member${displayTeam.length === 1 ? "" : "s"}`
                    : "account team"}
              </div>
              <div className={cx("fontSyne", "fs057", "colorMuted2", "textCenter")}>
                {liveCount > 0 ? `${liveCount} online now` : "All away"}
              </div>
            </div>

            {/* Right: member rows in 3-column grid */}
            <div className={cx("cmdTeamListWide")}>
              {displayTeam.length > 0 ? displayTeam.slice(0, 6).map((m, i) => (
                <div key={`row-${m.av}-${i}`} className={cx("cmdTeamRowWide")}>
                  <div className={cx("cmdTeamRowAv", "dynBgColor")} style={{ "--bg-color": m.color } as React.CSSProperties}>{m.av}</div>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("cmdTeamRowName")}>{m.name}</div>
                    <div className={cx("syneXs", "colorMuted2", "mt2")}>{m.task}</div>
                  </div>
                  {m.active
                    ? <span className={cx("hxLive")}>● LIVE</span>
                    : <span className={cx("fontSyne", "fs057", "colorMuted2")}>Away</span>}
                </div>
              )) : (
                <div className={cx("cmdTeamRowWide")}>
                  <div className={cx("cmdTeamRowAv", "dotBgAccent")}>{MANAGER.initials}</div>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("cmdTeamRowName")}>{MANAGER.name}</div>
                    <div className={cx("syneXs", "colorMuted2", "mt2")}>{MANAGER.role}</div>
                  </div>
                  <span className={cx("hxLive")}>● LIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Weekly Pulse — full-width horizontal layout ── */}
        {npsStep !== "done" ? (
          <div className={cx("cmdNpsCard")}>
            <div className={cx("cmdCardHd")}>
              <Ic n="activity" sz={13} c="var(--lime)" />
              <span className={cx("cmdCardHdTitle")}>Weekly Pulse</span>
              {npsStep === "feedback" && (
                <button type="button" aria-label="Dismiss pulse" onClick={() => setNpsStep("done")}
                  className={cx("mlAuto", "btnGhost", "opacity45")}>
                  <Ic n="x" sz={12} c="var(--muted2)" />
                </button>
              )}
            </div>

            {npsStep === "rating" && (
              <div className={cx("cmdNpsBodyWide")}>
                <div className={cx("cmdNpsTextWide")}>
                  <div className={cx("fontSerif", "fs125rem", "colorText", "mb6", "lineH12")}>
                    How was this week?
                  </div>
                  <div className={cx("fontSyne", "fs06", "colorMuted2")}>
                    Your feedback directly shapes how the team delivers for you.
                  </div>
                </div>
                <div className={cx("cmdNpsEmosWide")}>
                  {["😞", "😐", "🙂", "😊", "🤩"].map((emoji, idx) => (
                    <button key={emoji} type="button"
                      className={cx("cmdNpsEmoWide", npsRating === idx ? "cmdNpsEmoWideActive" : "")}
                      onClick={() => { setNpsRating(idx); setTimeout(() => setNpsStep("feedback"), 400); }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {npsStep === "feedback" && (
              <div className={cx("cmdNpsBodyWide")}>
                <div className={cx("cmdNpsTextWide")}>
                  <div className={cx("flexRow", "gap10", "mb12")}>
                    <span className={cx("fs2rem")}>{["😞", "😐", "🙂", "😊", "🤩"][npsRating ?? 4]}</span>
                    <div>
                      <div className={cx("fontSyne", "text11", "fw700", "colorText", "mb2")}>
                        {NPS_LABELS[npsRating ?? 4]}
                      </div>
                      <div className={cx("fontSyne", "fs058", "colorMuted2")}>
                        Want to add a thought? (optional)
                      </div>
                    </div>
                  </div>
                  <div className={cx("flexRow", "gap8")}>
                    <input type="text" value={npsText} onChange={e => setNpsText(e.target.value)}
                      placeholder="e.g. Really happy with the sprint pace…"
                      className={cx("chatInput")}
                      onKeyDown={e => { if (e.key === "Enter") { void handleNpsSend(); } }}
                    />
                    <button type="button" className={cx("cmdCta", "fs06", "p8x14")} onClick={() => { void handleNpsSend(); }}>Send</button>
                    <button type="button" className={cx("cmdCtaGhost", "fs06", "p8x14")} onClick={() => setNpsStep("done")}>Skip</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NPS done — show next appointment or schedule CTA */
          <div className={cx("card", "p0")}>
            <div className={cx("cmdCardHd")}>
              <Ic n="calendar" sz={13} c="var(--lime)" />
              <span className={cx("cmdCardHdTitle")}>{nextEvent ? "Next Appointment" : "Schedule"}</span>
            </div>
            {nextEvent ? (
              <div className={cx("flexRow", "flexCenter", "gap20", "p18x24")}>
                <div className={cx("iconLimeBox48")}>
                  <Ic n="calendar" sz={20} c="var(--lime)" />
                </div>
                <div className={cx("flex1", "minW0")}>
                  <div className={cx("fontSyne", "text11", "fw700", "colorText", "mb3")}>{nextEventTitle}</div>
                  <div className={cx("fontSyne", "fs059", "colorMuted")}>
                    {new Date(nextEvent.scheduledAt).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
                  </div>
                </div>
                <button type="button" className={cx("cmdCta")}
                  onClick={() => setRsvpd(p => { const s = new Set(p); s.has(nextEvent.id) ? s.delete(nextEvent.id) : s.add(nextEvent.id); return s; })}>
                  <Ic n="calendar" sz={12} c="var(--bg)" />
                  {rsvpd.has(nextEvent.id) ? "✓ RSVPd" : "RSVP"}
                </button>
              </div>
            ) : (
              <div className={cx("flexRow", "flexCenter", "gap20", "p18x24")}>
                <div className={cx("fontSerif", "fs11rem", "colorMuted", "flex1")}>
                  No upcoming appointments scheduled.
                </div>
                <button type="button" className={cx("cmdCta")} onClick={() => onNavigate?.("bookCall")}>
                  <Ic n="calendar" sz={12} c="var(--bg)" />Book a Call
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
