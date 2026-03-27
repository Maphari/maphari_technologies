"use client";

// ════════════════════════════════════════════════════════════════════════════
// dashboard-page.tsx — Mission Control: fully wired to real API data
// Real data : phases · milestones · deliverables · risks · sprints · approvals
//             appointments · project card · budget health · outstanding invoices
// Static    : none
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ───────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import type { ProjectCard, InvoiceSummaryRow, BudgetHealth } from "../types";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalPhasesWithRefresh,
  loadPortalDeliverablesWithRefresh,
  loadPortalRisksWithRefresh,
  loadPortalSprintsWithRefresh,
  type PortalPhase,
  type PortalDeliverable,
  type PortalRisk,
  type PortalSprint,
} from "../../../../lib/api/portal/project-layer";
import {
  loadPortalProjectDetailWithRefresh,
  loadPortalMilestoneApprovalsWithRefresh,
} from "../../../../lib/api/portal/projects";
import type {
  PortalProjectMilestone,
  PortalMilestoneApproval,
} from "../../../../lib/api/portal/types";
import {
  loadPortalAppointmentsWithRefresh,
  type PortalAppointment,
} from "../../../../lib/api/portal/client-cx";
import { saveSession } from "../../../../lib/auth/session";
import { buildTeamFromCollaborators, buildRealFeed } from "./home-page-helpers";
import type { PageId } from "../config";

// ── Local types ───────────────────────────────────────────────────────────────

interface DashAction {
  id: string;
  icon: string;
  tone: string;   // "Lime" | "Red" | "Amber" | "Purple" — maps to commandIconTone* CSS class
  color: string;
  badge: string;
  urgency: string;
  due: string;
  dueCls: string;
  title: string;
  sub: string;
  cta: string;
  pageTarget: PageId;
}

// ── Local helpers ─────────────────────────────────────────────────────────────

function fmtInvCents(cents: number): string {
  return `R ${Math.round(cents / 100).toLocaleString("en-ZA")}`;
}

function fmtDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function downloadMissionSummaryCsv(
  project: ProjectCard | undefined,
  budget: BudgetHealth | undefined,
  approvals: PortalMilestoneApproval[],
  milestones: PortalProjectMilestone[],
  risks: PortalRisk[],
  deliverables: PortalDeliverable[],
  appointments: PortalAppointment[],
): void {
  const rows = [
    ["Metric", "Value"],
    ["Project", project?.name ?? "No active project"],
    ["Status", project?.status ?? "Not assigned"],
    ["Progress", project ? String(project.progressPercent) + "%" : "—"],
    ["Risk level", project?.riskLevel ?? "LOW"],
    ["Due date", project?.dueAt ? fmtDateShort(project.dueAt) : "—"],
    ["Budget total", budget ? fmtInvCents(budget.totalBudgetCents) : "—"],
    ["Budget spent", budget ? fmtInvCents(budget.spentCents) : "—"],
    ["Budget remaining", budget ? fmtInvCents(budget.totalBudgetCents - budget.spentCents) : "—"],
    ["Budget burn", budget ? String(budget.burnRate) + "%" : "—"],
    ["Milestones approved", String(milestones.filter((m) => m.status === "APPROVED" || m.status === "COMPLETED").length)],
    ["Milestones total", String(milestones.length)],
    ["Pending approvals", String(approvals.filter((a) => a.status === "PENDING").length)],
    ["Active risks", String(risks.filter((r) => r.status !== "RESOLVED" && r.status !== "CLOSED").length)],
    ["Deliverables in review", String(deliverables.filter((d) => d.status === "IN_REVIEW").length)],
    ["Upcoming appointments", String(appointments.filter((a) => a.status !== "CANCELLED" && new Date(a.scheduledAt) > new Date()).length)],
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mission-control-summary.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// Build "What Needs You" action cards from real data sources
function buildDashboardActions(
  invoices:     InvoiceSummaryRow[],
  approvals:    PortalMilestoneApproval[],
  deliverables: PortalDeliverable[],
  appointments: PortalAppointment[],
): DashAction[] {
  const actions: DashAction[] = [];

  // 1. Overdue invoices → highest urgency (red)
  const overdueInvs = invoices.filter(inv => inv.statusTone === "red").slice(0, 1);
  for (const inv of overdueInvs) {
    actions.push({
      id: `inv-${inv.id}`, icon: "creditCard", tone: "Red", color: "var(--red)",
      badge: "badgeRed", urgency: "Overdue", due: "Overdue now", dueCls: "hxCountOverdue",
      title: `Pay Invoice ${inv.number}`,
      sub:   `${fmtInvCents(inv.amountCents)} · Due ${fmtDateShort(inv.dueAt)}`,
      cta:   "Pay Now",
      pageTarget: "invoices" as PageId,
    });
  }

  // 2. Pending milestone approvals (lime/green)
  const pendingMAs = approvals.filter(a => a.status === "PENDING");
  if (pendingMAs.length > 0) {
    actions.push({
      id: `ma-${pendingMAs[0].id}`, icon: "check", tone: "Lime", color: "var(--lime)",
      badge: "badgeGreen", urgency: "Pending",
      due: `${pendingMAs.length} awaiting`, dueCls: "hxCountOk",
      title: `Approve Milestone${pendingMAs.length > 1 ? "s" : ""}`,
      sub:   `${pendingMAs.length} milestone approval${pendingMAs.length > 1 ? "s" : ""} required`,
      cta:   "Review & Approve",
      pageTarget: "milestones" as PageId,
    });
  }

  // 3. Deliverables in review (purple)
  const inReview = deliverables.filter(d => d.status === "IN_REVIEW").slice(0, 1);
  for (const d of inReview) {
    actions.push({
      id: `del-${d.id}`, icon: "eye", tone: "Purple", color: "var(--purple)",
      badge: "badgePurple", urgency: "Ready", due: "Ready for review", dueCls: "hxCountOk",
      title: `Review: ${d.name.slice(0, 30)}`,
      sub:   d.dueAt ? `Due ${fmtDateShort(d.dueAt)}` : "Awaiting your feedback",
      cta:   "View & Review",
      pageTarget: "deliverables" as PageId,
    });
  }

  // 4. No upcoming call → suggest booking (amber)
  const upcoming = appointments.filter(
    a => a.status !== "CANCELLED" && new Date(a.scheduledAt) > new Date(),
  );
  if (upcoming.length === 0) {
    actions.push({
      id: "book-call", icon: "calendar", tone: "Amber", color: "var(--amber)",
      badge: "badgeAmber", urgency: "Recommended", due: "Recommended", dueCls: "hxCountOk",
      title: "Book a Strategy Call",
      sub:   "Schedule your next check-in with the team",
      cta:   "Pick a Time",
      pageTarget: "bookCall" as PageId,
    });
  }

  return actions;
}

// Map sprints → velocity bars (last 5 sprints, current = most recent)
function buildVelocityFromSprints(
  sprints: PortalSprint[],
): Array<{ week: string; pts: number; current: boolean }> {
  if (sprints.length === 0) return [];
  const sorted = [...sprints]
    .sort((a, b) =>
      new Date(a.startAt ?? a.createdAt).getTime() -
      new Date(b.startAt ?? b.createdAt).getTime(),
    )
    .slice(-5);
  const lastIdx = sorted.length - 1;
  return sorted.map((s, i) => ({
    week:    s.name.slice(0, 4) || `S${i + 1}`,
    pts:     s.completedTasks,
    current: i === lastIdx,
  }));
}

// Derive Project DNA radar axes from real project + milestone + budget data
function buildDnaAxes(
  project:    ProjectCard | undefined,
  milestones: PortalProjectMilestone[],
  budget:     BudgetHealth | undefined,
  risks:      PortalRisk[],
  deliverables: PortalDeliverable[],
  approvals:  PortalMilestoneApproval[],
  appointments: PortalAppointment[],
): Array<{ label: string; value: number }> {
  if (!project) {
    return [
      { label: "Delivery",      value: 0 },
      { label: "Budget",        value: 0 },
      { label: "Velocity",      value: 0 },
      { label: "Quality",       value: 0 },
      { label: "Approvals",     value: 0 },
      { label: "Collab",        value: 0 },
    ];
  }
  const approved  = milestones.filter(m => m.status === "APPROVED" || m.status === "COMPLETED").length;
  const velocity  = milestones.length > 0 ? Math.round((approved / milestones.length) * 100) : project.progressPercent;
  const approvedDeliverables = deliverables.filter((d) => d.status === "APPROVED").length;
  const reviewDeliverables = deliverables.filter((d) => d.status === "IN_REVIEW").length;
  const qualityBase = deliverables.length > 0
    ? Math.round(((approvedDeliverables + reviewDeliverables * 0.5) / deliverables.length) * 100)
    : project.progressPercent;
  const qualityPenalty =
    project.riskLevel === "CRITICAL" ? 35 :
    project.riskLevel === "HIGH" ? 20 :
    project.riskLevel === "MEDIUM" ? 8 : 0;
  const quality = Math.max(0, Math.min(100, qualityBase - qualityPenalty));
  const pendingApprovals = approvals.filter((a) => a.status === "PENDING").length;
  const approvalScore = milestones.length > 0
    ? Math.max(0, 100 - Math.round((pendingApprovals / Math.max(milestones.length, 1)) * 100))
    : 100;
  const activeRisks = risks.filter((r) => r.status !== "RESOLVED" && r.status !== "CLOSED").length;
  const collaborationSignals = appointments.filter((a) => a.status !== "CANCELLED").length + Math.min(deliverables.length, 4);
  const collaboration = Math.max(20, Math.min(100, collaborationSignals * 12 - activeRisks * 8));
  const budgetVal = budget ? Math.max(0, 100 - budget.burnRate) : project.progressPercent;

  return [
    { label: "Delivery",      value: project.progressPercent },
    { label: "Budget",        value: budgetVal },
    { label: "Velocity",      value: velocity },
    { label: "Quality",       value: quality },
    { label: "Approvals",     value: approvalScore },
    { label: "Collab",        value: collaboration },
  ];
}

// Generate AI situation-report insights from real data
function buildAiInsights(
  project:      ProjectCard | undefined,
  milestones:   PortalProjectMilestone[],
  budget:       BudgetHealth | undefined,
  risks:        PortalRisk[],
  deliverables: PortalDeliverable[],
  approvals:    PortalMilestoneApproval[],
): Array<{ confidence: number; tone: string; icon: string; text: string }> {
  if (!project) {
    return [{ confidence: 100, tone: "green", icon: "check",
      text: "No active projects — your portal is ready. Request a new project to get started." }];
  }
  const items: Array<{ confidence: number; tone: string; icon: string; text: string }> = [];
  const prog    = project.progressPercent;
  const daysDue = project.dueAt
    ? Math.max(0, Math.ceil((new Date(project.dueAt).getTime() - Date.now()) / 86_400_000))
    : null;

  // 1. Progress / timeline
  items.push({
    confidence: 91,
    tone: prog >= 70 ? "green" : prog >= 40 ? "amber" : "red",
    icon: prog >= 70 ? "check" : "activity",
    text: `"${project.name}" is ${prog}% complete${daysDue !== null ? ` — ${daysDue} day${daysDue !== 1 ? "s" : ""} to deadline` : ""}.`,
  });

  // 2. Budget burn
  if (budget) {
    const br = budget.burnRate;
    items.push({
      confidence: 88,
      tone: br <= 70 ? "green" : br <= 85 ? "amber" : "red",
      icon: "dollar",
      text: `Budget at ${br}% burn — ${br <= 70 ? "comfortably within budget" : br <= 85 ? "slightly above plan — monitor spend" : "approaching limit — review immediately"}.`,
    });
  }

  // 3. Risks
  const activeRisks = risks.filter(r => r.status !== "RESOLVED" && r.status !== "CLOSED");
  if (activeRisks.length > 0) {
    items.push({
      confidence: 82, tone: "amber", icon: "alert",
      text: `${activeRisks.length} active risk${activeRisks.length > 1 ? "s" : ""} — "${activeRisks[0].name}". ${activeRisks[0].mitigation ?? "Team is investigating mitigation."}`,
    });
  }

  // 4. Pending approvals
  const pending = approvals.filter(a => a.status === "PENDING");
  if (pending.length > 0) {
    items.push({
      confidence: 85, tone: "purple", icon: "calendar",
      text: `${pending.length} milestone approval${pending.length > 1 ? "s" : ""} awaiting — review and approve to keep the project moving.`,
    });
  }

  // 5. Deliverables in review
  const inReview = deliverables.filter(d => d.status === "IN_REVIEW");
  if (inReview.length > 0) {
    items.push({
      confidence: 86, tone: "green", icon: "check",
      text: `${inReview.length} deliverable${inReview.length > 1 ? "s" : ""} ready for review — "${inReview[0].name}" awaits your feedback.`,
    });
  }

  return items.slice(0, 5);
}

// AI question→answer using real project context
function buildAiResponse(
  query:   string,
  project: ProjectCard | undefined,
  budget:  BudgetHealth | undefined,
  risks:   PortalRisk[],
  sprints: PortalSprint[],
): string {
  const q = query.toLowerCase();
  if (q.includes("budget") || q.includes("spend") || q.includes("money")) {
    if (!budget) return "No budget data loaded yet — visit the Budget Tracker page for details.";
    const used  = Math.round(budget.spentCents / 100).toLocaleString("en-ZA");
    const total = Math.round(budget.totalBudgetCents / 100).toLocaleString("en-ZA");
    return `Budget: R ${used} used of R ${total} total (${budget.burnRate}%). Status: ${budget.status}.`;
  }
  if (q.includes("risk") || q.includes("blocker") || q.includes("problem")) {
    const active = risks.filter(r => r.status !== "RESOLVED" && r.status !== "CLOSED");
    if (active.length === 0) return "No active risks detected — the project risk register is clear.";
    return `${active.length} active risk${active.length > 1 ? "s" : ""}: "${active[0].name}". ${active[0].mitigation ?? "Team is investigating."}`;
  }
  if (q.includes("sprint") || q.includes("velocity")) {
    if (sprints.length === 0) return "No sprint data loaded — visit the Sprint Board for details.";
    const last = sprints[sprints.length - 1]!;
    return `Latest sprint "${last.name}": ${last.completedTasks} of ${last.totalTasks} tasks done (${last.progressPercent}%). Status: ${last.status}.`;
  }
  if (!project) return "No active project found. Start by requesting a new project from the sidebar.";
  return `Project "${project.name}" is ${project.progressPercent}% complete. Risk: ${project.riskLevel ?? "LOW"}.${budget ? ` Budget burn: ${budget.burnRate}%.` : ""}`;
}

// ── Phase color pool ───────────────────────────────────────────────────────────

const PHASE_COLORS = [
  "var(--purple)", "var(--blue)", "var(--lime)", "var(--amber)", "var(--green)",
  "var(--cyan)", "var(--red)", "var(--accent)",
];

// ── API → display mappers ──────────────────────────────────────────────────────

function mapApiPhasesToDisplay(
  phases:      PortalPhase[],
  progressPct: number,
  hasProject:  boolean,
): { label: string; pct: [number, number]; color: string; done: boolean }[] {
  if (!hasProject || phases.length === 0) return [];
  const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
  const total  = sorted.reduce((s, p) => s + Math.max(p.budgetedHours || 1, 1), 0);
  let cursor   = 0;
  return sorted.map((p, i) => {
    const share = (Math.max(p.budgetedHours || 1, 1) / total) * 100;
    const start = cursor;
    const end   = Math.min(Math.round(cursor + share), 100);
    cursor      = end;
    return {
      label: p.name,
      pct:   [start, end] as [number, number],
      color: p.color ?? PHASE_COLORS[i % PHASE_COLORS.length]!,
      done:  end <= progressPct,
    };
  });
}

function mapApiMilestonesToDisplay(
  milestones:  PortalProjectMilestone[],
  progressPct: number,
): { label: string; pct: number; done: boolean; now: boolean }[] {
  if (milestones.length === 0) return [];
  const sorted = [...milestones].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const step   = 100 / Math.max(sorted.length + 1, 2);
  const mapped = sorted.map((m, i) => {
    const pct  = Math.round((i + 1) * step);
    const done = pct <= progressPct || m.status === "APPROVED" || m.status === "COMPLETED";
    return { label: m.title.slice(0, 9), pct, done, now: false };
  });
  const nowIdx = mapped.reduce((best, m, i) => (m.pct <= progressPct ? i : best), -1);
  if (nowIdx >= 0) {
    mapped.splice(nowIdx + 1, 0, { label: "NOW", pct: Math.min(progressPct, 99), done: true, now: true });
  }
  return [
    { label: "Kickoff", pct: 0,   done: true,  now: false },
    ...mapped,
    { label: "Launch",  pct: 100, done: false, now: false },
  ];
}

// ── DNA radar geometry ─────────────────────────────────────────────────────────

const N    = 6;
const CX_R = 100, CY_R = 100, R_MAX = 76;

function polar(i: number, val: number): [number, number] {
  const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
  const r     = (val / 100) * R_MAX;
  return [CX_R + r * Math.cos(angle), CY_R + r * Math.sin(angle)];
}
function axisEnd(i: number): [number, number] {
  const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
  return [CX_R + R_MAX * Math.cos(angle), CY_R + R_MAX * Math.sin(angle)];
}
function labelPos(i: number): [number, number] {
  const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
  return [CX_R + (R_MAX + 16) * Math.cos(angle), CY_R + (R_MAX + 16) * Math.sin(angle)];
}
function ringPts(pct: number): string {
  return Array.from({ length: N }, (_, i) => {
    const [x, y] = polar(i, pct);
    return `${x},${y}`;
  }).join(" ");
}

const TONE_COLOR: Record<string, string> = {
  green: "var(--lime)", amber: "var(--amber)", red: "var(--red)", purple: "var(--purple)",
};
const TONE_BADGE: Record<string, string> = {
  green: "badgeGreen", amber: "badgeAmber", red: "badgeRed", purple: "badgePurple",
};

// ── Component ──────────────────────────────────────────────────────────────────

export function DashboardPage({
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
  // ── Project layer (session + active projectId) ────────────────────────────
  const { session, projectId } = useProjectLayer();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [mounted,     setMounted]     = useState(false);
  const [dismissed,   setDismissed]   = useState<Set<string>>(new Set());
  const [aiQuery,     setAiQuery]     = useState("");
  const [aiAnswer,    setAiAnswer]    = useState<string | null>(null);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [expandedIns, setExpandedIns] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [todayMs]     = useState(() => Date.now());

  // ── API data state ────────────────────────────────────────────────────────
  const [apiPhases,             setApiPhases]             = useState<PortalPhase[]>([]);
  const [apiMilestones,         setApiMilestones]         = useState<PortalProjectMilestone[]>([]);
  const [apiDeliverables,       setApiDeliverables]       = useState<PortalDeliverable[]>([]);
  const [apiRisks,              setApiRisks]              = useState<PortalRisk[]>([]);
  const [apiSprints,            setApiSprints]            = useState<PortalSprint[]>([]);
  const [apiMilestoneApprovals, setApiMilestoneApprovals] = useState<PortalMilestoneApproval[]>([]);
  const [apiAppointments,       setApiAppointments]       = useState<PortalAppointment[]>([]);
  const [dataLoading,           setDataLoading]           = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Fetch all project-layer data in parallel
  useEffect(() => {
    if (!session || !projectId) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setDataLoading(true);
    });
    Promise.all([
      loadPortalPhasesWithRefresh(session, projectId),
      loadPortalProjectDetailWithRefresh(session, projectId),
      loadPortalDeliverablesWithRefresh(session, projectId),
      loadPortalRisksWithRefresh(session, projectId),
      loadPortalSprintsWithRefresh(session, projectId),
      loadPortalMilestoneApprovalsWithRefresh(session, { projectId }),
      loadPortalAppointmentsWithRefresh(session),
    ]).then(([phases, detail, delivs, risks, sprints, approvals, appts]) => {
      if (phases.nextSession)    saveSession(phases.nextSession);
      if (detail.nextSession)    saveSession(detail.nextSession);
      if (delivs.nextSession)    saveSession(delivs.nextSession);
      if (risks.nextSession)     saveSession(risks.nextSession);
      if (sprints.nextSession)   saveSession(sprints.nextSession);
      if (approvals.nextSession) saveSession(approvals.nextSession);
      if (appts.nextSession)     saveSession(appts.nextSession);
      if (phases.data?.length)               setApiPhases(phases.data);
      if (detail.data?.milestones?.length)   setApiMilestones(detail.data.milestones);
      if (delivs.data)                       setApiDeliverables(delivs.data);
      if (risks.data)                        setApiRisks(risks.data);
      if (sprints.data)                      setApiSprints(sprints.data);
      if (approvals.data)                    setApiMilestoneApprovals(approvals.data);
      if (appts.data)                        setApiAppointments(appts.data);
    }).finally(() => setDataLoading(false));
    return () => {
      cancelled = true;
    };
  }, [session, projectId, refreshTick]);

  // ── Derived project values ─────────────────────────────────────────────────
  const firstProject = apiProjects.find(
    p => p.status === "Active" || p.status === "In Progress",
  ) ?? apiProjects[0];

  const hasProject    = !!firstProject;
  const progressPct   = firstProject?.progressPercent ?? 0;
  const healthScore   = firstProject
    ? Math.max(0, Math.min(100, 100
        - (firstProject.riskLevel === "CRITICAL" ? 40
          : firstProject.riskLevel === "HIGH"     ? 25
          : firstProject.riskLevel === "MEDIUM"   ? 10 : 0)
        + Math.round(firstProject.progressPercent * 0.15)))
    : 0;
  const daysRemaining = firstProject?.dueAt
    ? Math.max(0, Math.ceil((new Date(firstProject.dueAt).getTime() - todayMs) / (1000 * 60 * 60 * 24)))
    : null;
  const riskLevel     = firstProject?.riskLevel ?? "LOW";

  const fmtMoney = (cents: number) => `R ${Math.round(cents / 100).toLocaleString("en-ZA")}`;

  const budgetRemainingStr = apiBudgetHealth
    ? fmtMoney(apiBudgetHealth.totalBudgetCents - apiBudgetHealth.spentCents)
    : "—";
  const budgetPctComputed = apiBudgetHealth ? apiBudgetHealth.burnRate / 100 : 0;
  const budgetCirc        = 2 * Math.PI * 38;

  const approvedMilestones = apiMilestones.filter(
    m => m.status === "APPROVED" || m.status === "COMPLETED",
  ).length;

  // Project start label (approximate from dueAt - 6 months, or today)
  const projectStartLabel = firstProject?.dueAt
    ? (() => {
        const d = new Date(firstProject.dueAt);
        d.setMonth(d.getMonth() - 6);
        return d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
      })()
    : new Date().toLocaleDateString("en-ZA", { month: "short", year: "numeric" });

  // ── Mission banner status derived from real risk level ─────────────────────
  const missionStatusText =
    !hasProject                                       ? "No Active Project"  :
    riskLevel === "CRITICAL" || riskLevel === "HIGH"  ? "Project At Risk"    :
    riskLevel === "MEDIUM"                            ? "Needs Attention"    : "Project On Track";
  const missionPulseCls   =
    !hasProject                                       ? "missionPulseDotAmb" :
    riskLevel === "CRITICAL" || riskLevel === "HIGH"  ? "missionPulseDotRed" :
    riskLevel === "MEDIUM"                            ? "missionPulseDotAmb" : "missionPulseDot";
  const missionActiveBadge     = hasProject ? "badgeGreen" : "badgeMuted";
  const missionActiveBadgeText = hasProject ? "Active" : "No Project";

  // ── Real-data computed values ──────────────────────────────────────────────
  const displayTeam    = buildTeamFromCollaborators(firstProject?.collaborators ?? []);
  const assignedCount  = displayTeam.length;
  const displayFeed    = buildRealFeed(apiDeliverables, apiRisks, apiAppointments, []);
  const displayActions = buildDashboardActions(
    apiOutstanding, apiMilestoneApprovals, apiDeliverables, apiAppointments,
  );
  const activeActions    = displayActions.filter(a => !dismissed.has(a.id));
  const displayVelocity  = buildVelocityFromSprints(apiSprints);
  const displayDna       = buildDnaAxes(
    firstProject,
    apiMilestones,
    apiBudgetHealth,
    apiRisks,
    apiDeliverables,
    apiMilestoneApprovals,
    apiAppointments,
  );
  const dnaDataPoints    = displayDna.map((ax, i) => polar(i, ax.value));
  const dnaPolygonStr    = dnaDataPoints.map(([x, y]) => `${x},${y}`).join(" ");
  const avgDna           = displayDna.length > 0
    ? Math.round(displayDna.reduce((a, ax) => a + ax.value, 0) / N)
    : 0;
  const displayInsights  = buildAiInsights(
    firstProject, apiMilestones, apiBudgetHealth, apiRisks, apiDeliverables, apiMilestoneApprovals,
  );

  // ── Display phases + milestones ────────────────────────────────────────────
  const displayPhases     = mapApiPhasesToDisplay(apiPhases, progressPct, hasProject);
  const displayMilestones = mapApiMilestonesToDisplay(apiMilestones, progressPct);

  const handleAsk = () => {
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    setAiAnswer(null);
    setTimeout(() => {
      setAiAnswer(buildAiResponse(aiQuery, firstProject, apiBudgetHealth, apiRisks, apiSprints));
      setAiLoading(false);
    }, 700);
  };

  return (
    <div className={cx("pageBody")}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb16")}>
        <div>
          <div className={cx("pageEyebrow")}>Client Portal</div>
          <h1 className={cx("pageTitle")}>Mission Control</h1>
          <p className={cx("pageSub")}>
            Your project, live — actions, status, and what&apos;s being built right now.
          </p>
        </div>
        <div className={cx("pageActions")}>
          <button className={cx("btnSm", "btnGhost")} type="button"
            onClick={() => setRefreshTick((value) => value + 1)}>
            <Ic n="refresh" sz={12} c="var(--muted2)" /> {dataLoading ? "Refreshing…" : "Refresh"}
          </button>
          <button className={cx("btnSm", "btnGhost", "dynColor")} type="button"
            onClick={() => downloadMissionSummaryCsv(firstProject, apiBudgetHealth, apiMilestoneApprovals, apiMilestones, apiRisks, apiDeliverables, apiAppointments)}
            style={{ "--color": "inherit" } as React.CSSProperties}>
            <Ic n="download" sz={12} c="var(--muted2)" /> Export Summary
          </button>
          <button className={cx("btnSm", "btnAccent")} type="button"
            onClick={() => onNavigate?.("myProjects")}>
            View All Projects
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Project Health",   value: hasProject ? `${healthScore}/100` : "—",  color: "statCardGreen"  },
          { label: "Days Remaining",   value: daysRemaining !== null ? String(daysRemaining) : "—", color: "statCardAccent" },
          { label: "Budget Remaining", value: budgetRemainingStr,                                   color: "statCardBlue"   },
          { label: "Actions Pending",  value: String(activeActions.length), color: activeActions.length > 0 ? "statCardAmber" : "statCardAccent" },
        ].map(s => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Mission Banner ──────────────────────────────────────────────── */}
      <div className={cx("missionBanner")}>
        <div className={cx("missionBannerGrid")}>
          <div className={cx("missionBannerLeft")}>
            <div className={cx("missionPulseRow")}>
              <span className={cx(missionPulseCls)} />
              <span className={cx("missionOnTrack")}>{missionStatusText}</span>
              <span className={cx("badge", missionActiveBadge, "missionBadgeOffset")}>
                {missionActiveBadgeText}
              </span>
            </div>
            <h2 className={cx("missionProjectName")}>
              {firstProject?.name ?? (dataLoading ? "Loading…" : "No active project")}
            </h2>
            <p className={cx("missionProjectSub")}>
              {hasProject
                ? [
                    apiPhases.length > 0 ? apiPhases[0].name : (firstProject?.status ?? "In Progress"),
                    assignedCount > 0 ? `${assignedCount} assigned` : "Team assignment pending",
                  ].join(" · ")
                : "No active project assigned to your account"}
              {dataLoading && <span className={cx("ml8", "opacity50", "fs06")}>Loading…</span>}
            </p>
          </div>
          <div className={cx("missionChipGrid")}>
            {[
              { label: "Progress",    val: `${progressPct}%`,  sub: "overall complete"  },
              { label: "Milestones",  val: apiMilestones.length > 0 ? `${approvedMilestones} / ${apiMilestones.length}` : "—", sub: "approved" },
              { label: "Days Left",   val: daysRemaining !== null ? String(daysRemaining) : "—", sub: "to due date" },
              { label: "Budget Burn", val: apiBudgetHealth ? `${apiBudgetHealth.burnRate}%` : "—", sub: "of total budget" },
            ].map(c => (
              <div key={c.label} className={cx("missionChip")}>
                <span className={cx("missionChipLabel")}>{c.label}</span>
                <span className={cx("missionChipValue")}>{c.val}</span>
                <span className={cx("missionChipSub")}>{c.sub}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={cx("missionProgressSection")}>
          <div className={cx("missionProgressTrack")}>
            <div
              className={cx("missionProgressFill", mounted ? "missionProgressFillActive" : "")}
              style={{ "--bar-pct": String(progressPct / 100) } as React.CSSProperties}
            />
          </div>
          <span className={cx("missionProgressLabel")}>{progressPct}% complete</span>
        </div>
      </div>

      {/* ── 2-col: Action Cards + Project DNA radar ──────────────────────── */}
      <div className={cx("dashMainGrid")}>

        {/* Left: What Needs You */}
        <div className={cx("dashActionWrapper")}>
          <div className={cx("sectionEyebrow")}>
            <Ic n="alert" sz={13} c="var(--amber)" />
            <span className={cx("sectionEyebrowLabel")}>What Needs You</span>
            <span className={cx("badge", "badgeAmber")}>{activeActions.length} items</span>
          </div>

          {activeActions.length === 0 ? (
            <div className={cx("emptyPad40x16", "textCenter")}>
              <div className={cx("iconCircle48")}>
                <Ic n="check" sz={20} c="var(--lime)" />
              </div>
              <div className={cx("fw700", "text13")}>All caught up</div>
              <div className={cx("text11", "colorMuted", "mt4")}>No actions pending right now</div>
            </div>
          ) : (
            <div className={cx("actionGrid")}>
              {activeActions.map((action, i) => (
                <div key={action.id} className={cx("commandCard", `commandFade${i}`)}>
                  <div className={cx("commandCardIconRow")}>
                    <span className={cx("commandCardIconBox", `commandIconTone${action.tone}`)}>
                      <Ic n={action.icon} sz={16} />
                    </span>
                    <span className={cx("badge", action.badge, "commandUrgencyBadge")}>{action.urgency}</span>
                    <button type="button"
                      onClick={() => setDismissed(p => new Set([...p, action.id]))}
                      aria-label="Dismiss" title="Dismiss"
                      className={cx("mlAuto", "btnGhost", "opacity40", "p2")}
                    >
                      <Ic n="x" sz={11} c="var(--muted2)" />
                    </button>
                  </div>
                  <div className={cx("commandCardBody")}>
                    <div className={cx("commandCardTitle")}>{action.title}</div>
                    <div className={cx("commandCardSub")}>{action.sub}</div>
                    <div className={cx("hxActCountdown", action.dueCls, "mt6", "flexRow", "gap4")}>
                      <Ic n="clock" sz={9} c="currentColor" />
                      {action.due}
                    </div>
                  </div>
                  <button type="button" className={cx("btnSm", "btnAccent", "commandCardCta", "dynColor")} style={{ "--color": "inherit" } as React.CSSProperties}
                    onClick={() => onNavigate?.(action.pageTarget)}>
                    {action.cta}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Project DNA radar */}
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <span className={cx("cardHdTitle")}>Project DNA</span>
            <span className={cx("badge", "badgeAccent")}>{avgDna} avg</span>
          </div>
          {!hasProject ? (
            <div className={cx("missionEmptyState")}>
              <div className={cx("iconCircle48")}>
                <Ic n="activity" sz={18} c="var(--lime)" />
              </div>
              <div className={cx("missionEmptyTitle")}>Project intelligence will appear here</div>
              <div className={cx("missionEmptySub")}>
                Once a project is active, Mission Control will chart delivery, budget, approvals, quality, and collaboration in one view.
              </div>
            </div>
          ) : (
            <div className={cx("dnaVertWrap")}>
              <svg className={cx("dnaRadarSvg")} viewBox="0 0 200 200">
                {[25, 50, 75, 100].map(pct => (
                  <polygon key={pct} points={ringPts(pct)} fill="none" stroke="var(--b2)" strokeWidth={0.8} opacity={0.6} />
                ))}
                {displayDna.map((_, i) => {
                  const [x, y] = axisEnd(i);
                  return <line key={i} x1={CX_R} y1={CY_R} x2={x} y2={y} stroke="var(--b2)" strokeWidth={0.8} opacity={0.5} />;
                })}
                <polygon points={dnaPolygonStr}
                  fill="color-mix(in oklab, var(--lime) 12%, transparent)"
                  stroke="var(--lime)" strokeWidth={1.5} strokeLinejoin="round"
                />
                {dnaDataPoints.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={3} fill="var(--lime)" stroke="var(--s1)" strokeWidth={1.5} />
                ))}
                {displayDna.map((ax, i) => {
                  const [lx, ly] = labelPos(i);
                  return (
                    <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                      fontSize={7} fontWeight={600} fill="var(--muted2)">
                      {ax.label}
                    </text>
                  );
                })}
                <text x={CX_R} y={CY_R - 6} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--lime)">{avgDna}</text>
                <text x={CX_R} y={CY_R + 10} textAnchor="middle" fontSize={7} fill="var(--muted2)">/ 100</text>
              </svg>
              <div className={cx("dnaDimGrid")}>
                {displayDna.map(ax => {
                  const dimClass  = ax.value > 85 ? "dnaDimLime"  : ax.value > 70 ? "dnaDimAmber"  : "dnaDimRed";
                  const textClass = ax.value > 85 ? "colorAccent" : ax.value > 70 ? "colorAmber"   : "colorRed";
                  return (
                    <div key={ax.label} className={cx("dnaDimRow")}>
                      <div className={cx("flexBetween", "mb4")}>
                        <span className={cx("text11")}>{ax.label}</span>
                        <span className={cx("fw700", "text11", textClass)}>{ax.value}</span>
                      </div>
                      <div className={cx("dnaDimTrack")}>
                        <div className={cx("dnaDimFill", dimClass, mounted ? "dnaDimFillMounted" : "")}
                          style={{ "--dim-scale": String(ax.value / 100) } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Project Timeline ────────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <Ic n="activity" sz={14} c="var(--lime)" />
          <span className={cx("cardHdTitle")}>Project Timeline</span>
          <span className={cx("badge", riskLevel === "CRITICAL" || riskLevel === "HIGH" ? "badgeRed" : riskLevel === "MEDIUM" ? "badgeAmber" : "badgeGreen")}>
            {missionStatusText}
          </span>
          <span className={cx("text11", "colorMuted", "mlAuto")}>
            {projectStartLabel}
            {" → "}
            {firstProject?.dueAt
              ? new Date(firstProject.dueAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })
              : "TBD"}
          </span>
        </div>
        {!hasProject ? (
          <div className={cx("missionEmptyState")}>
            <div className={cx("iconCircle48")}>
              <Ic n="calendar" sz={18} c="var(--lime)" />
            </div>
            <div className={cx("missionEmptyTitle")}>Timeline unavailable until kickoff</div>
            <div className={cx("missionEmptySub")}>
              Milestones, phases, and launch checkpoints will show up here once a project is approved and scoped.
            </div>
          </div>
        ) : (
          <>
        {/* Phase legend */}
        {displayPhases.length > 0 && (
          <div className={cx("flexRow", "gap16", "flexWrap", "p4x18x0")}>
            {displayPhases.map(ph => (
              <div key={ph.label} className={cx("flexRow", "gap5")}>
                <div className={cx("dot8sq", "dynBgColor")} style={{ "--bg-color": ph.color, "--op": ph.done ? 1 : 0.4 } as React.CSSProperties} />
                <span className={cx("text10", "colorMuted")}>{ph.label}</span>
              </div>
            ))}
          </div>
        )}
        <div className={cx("timelineSvgWrap")}>
          <svg width="100%" height="80" viewBox="0 0 800 80">
            {/* Phase segments */}
            {displayPhases.map(ph => {
              const x1 = 40 + 720 * (ph.pct[0] / 100);
              const x2 = 40 + 720 * (ph.pct[1] / 100);
              return (
                <rect key={ph.label} x={x1} y={28} width={Math.max(x2 - x1 - 2, 0)} height={6}
                  fill={ph.color} opacity={ph.done ? 0.28 : 0.1} rx={2} />
              );
            })}
            {/* Track + progress */}
            <line x1={40} y1={36} x2={760} y2={36} stroke="var(--b2)" strokeWidth={2} />
            <line x1={40} y1={36} x2={40 + 720 * (progressPct / 100)} y2={36}
              stroke="var(--lime)" strokeWidth={3} strokeLinecap="round" />
            {/* Milestones */}
            {displayMilestones.map(m => {
              const x = 40 + 720 * (m.pct / 100);
              return (
                <g key={m.label}>
                  {m.now ? (
                    <>
                      <circle cx={x} cy={36} r={12} fill="var(--lime)" opacity={0.12} />
                      <circle cx={x} cy={36} r={5} fill="var(--lime)" stroke="var(--s1)" strokeWidth={2} />
                      <text x={x} y={20} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--lime)">{m.label}</text>
                    </>
                  ) : (
                    <>
                      <circle cx={x} cy={36} r={4}
                        fill={m.done ? "var(--lime)" : "var(--s3)"}
                        stroke={m.done ? "var(--lime)" : "var(--b2)"} strokeWidth={1.5}
                      />
                      <text x={x} y={m.done ? 64 : 66} textAnchor="middle" fontSize={8}
                        fontWeight={m.done ? 500 : 400}
                        fill={m.done ? "var(--muted)" : "var(--muted2)"}
                      >{m.label}</text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
          </>
        )}
      </div>

      {/* ── Live Now: Team + Activity Feed ──────────────────────────────── */}
        <div className={cx("card", "p0", "overflowHidden")}>
          <div className={cx("cardHd")}>
            <div className={cx("flexRow", "flexCenter", "gap7")}>
              <span className={cx("livePulse")} />
              <span className={cx("cardHdTitle")}>Project Signals</span>
            </div>
            <span className={cx("badge", assignedCount > 0 ? "badgeAccent" : "badgeMuted")}>
              {assignedCount > 0 ? `${assignedCount} assigned` : "Pending team"}
            </span>
            {dataLoading && <span className={cx("text11", "colorMuted", "ml8")}>Loading…</span>}
          </div>

        <div className={cx("grid2Cols", "borderT", "projectSignalsGrid")}>
          {/* Team status */}
          <div className={cx("p0x18x14", "borderR", "projectSignalsCol")}>
            <div className={cx("text10", "colorMuted", "fw700", "ls006", "sectionHeadPad")}>
              TEAM STATUS
            </div>
            {displayTeam.length === 0 ? (
              <div className={cx("projectSignalsEmpty")}>
                {dataLoading ? "Loading team…" : "Team allocation is still being confirmed for this project."}
              </div>
            ) : displayTeam.map(m => (
              <div key={m.name} className={cx("flexRow", "flexCenter", "gap10", "p7x0", "borderTop")}>
                <div className={cx("relative", "noShrink")}>
                  <Av initials={m.av} size={30} />
                  <div className={cx("statusIndicatorDot", "dynBgColor")} style={{ "--bg-color": "var(--accent)" } as React.CSSProperties} />
                </div>
                <div className={cx("flex1", "minW0")}>
                  <div className={cx("text12", "fw600")}>{m.name}</div>
                  <div className={cx("text10", "colorMuted", "truncate")}>
                    {m.task}
                  </div>
                </div>
                <span className={cx("text10", "colorMuted")}>Assigned</span>
              </div>
            ))}
          </div>

          {/* Activity feed */}
          <div className={cx("p0x18x14", "projectSignalsCol")}>
            <div className={cx("text10", "colorMuted", "fw700", "ls006", "sectionHeadPad")}>
              RECENT ACTIVITY
            </div>
            {displayFeed.length === 0 ? (
              <div className={cx("projectSignalsEmpty")}>
                {dataLoading ? "Loading activity…" : "No recent activity yet"}
              </div>
            ) : (
              <div className={cx("relative", "pl20")}>
                <div className={cx("timelineLineL5")} />
                {displayFeed.map((f, i) => (
                  <div key={i} className={cx("flexRow", "flexAlignStart", "gap10", "relative", i < displayFeed.length - 1 && "mb12")}>
                    <div className={cx("timelineFeedDot", "dynBgColor")} style={{ "--bg-color": f.evColor } as React.CSSProperties} />
                    <Av initials={f.av} size={22} />
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("lineH15text11")}>
                        {f.text}
                      </div>
                      <div className={cx("text10", "colorMuted")}>{f.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Budget + Velocity | AI Report ───────────────────── */}
      <div className={cx("dashBottomRow")}>

        {/* Budget + Velocity stacked */}
        <div className={cx("budgetVelStack")}>

          {/* Budget Donut */}
          <div className={cx("card")}>
            <div className={cx("cardHd")}>
              <span className={cx("cardHdTitle")}>Budget</span>
              <span className={cx("badge", "badgeAmber")}>
                {apiBudgetHealth ? `${apiBudgetHealth.burnRate}%` : "—"} used
              </span>
            </div>
            <div className={cx("budgetDonutWrap")}>
              <svg width={120} height={120} viewBox="0 0 120 120" className={cx("budgetDonutSvg")}>
                <circle cx={60} cy={60} r={38} fill="none" stroke="var(--b1)" strokeWidth={14} />
                <circle cx={60} cy={60} r={38} fill="none" stroke="var(--amber)" strokeWidth={14}
                  strokeDasharray={`${budgetCirc} ${budgetCirc}`}
                  strokeDashoffset={mounted ? budgetCirc * (1 - budgetPctComputed) : budgetCirc}
                  strokeLinecap="round" transform="rotate(-90 60 60)"
                  className={cx("budgetRingFill")}
                />
                <text x={60} y={57} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--amber)">
                  {apiBudgetHealth ? `${apiBudgetHealth.burnRate}%` : "—"}
                </text>
                <text x={60} y={70} textAnchor="middle" fontSize={7} fill="var(--muted2)">Budget</text>
              </svg>
              <div className={cx("budgetStats")}>
                {[
                  { label: "Used",      val: apiBudgetHealth ? fmtMoney(apiBudgetHealth.spentCents) : "—",          cls: "colorAmber"  },
                  { label: "Remaining", val: budgetRemainingStr,                                                     cls: ""            },
                  { label: "Total",     val: apiBudgetHealth ? fmtMoney(apiBudgetHealth.totalBudgetCents) : "—",     cls: ""            },
                  { label: "Burn Rate", val: apiBudgetHealth ? (apiBudgetHealth.status === "healthy" ? "On track" : apiBudgetHealth.status) : "—", cls: "colorAccent" },
                ].map((r, i) => (
                  <div key={r.label} className={cx("budgetStatRow", i === 3 ? "budgetStatRowBorder" : "")}>
                    <span className={cx("text11", "colorMuted")}>{r.label}</span>
                    <span className={cx("fw700", "text12", r.cls)}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sprint Velocity */}
          <div className={cx("card")}>
            <div className={cx("cardHd")}>
              <span className={cx("cardHdTitle")}>Sprint Velocity</span>
              <span className={cx("badge", "badgeMuted")}>Tasks done</span>
            </div>
            {displayVelocity.length === 0 ? (
              <div className={cx("velocityWrap")}>
                <div className={cx("text11", "colorMuted", "py20_0")}>
                  {dataLoading ? "Loading sprints…" : "No sprint data yet"}
                </div>
              </div>
            ) : (
              <div className={cx("velocityWrap")}>
                {displayVelocity.map(w => (
                  <div key={w.week} className={cx("velocityItem", w.current ? "velocityItemCurrent" : "")}>
                    <span className={cx("velocityLabel")}>{w.week}</span>
                    <div className={cx("velocityBarTrack")}>
                      <div
                        className={cx("velocityBarFill", w.current ? "velocityBarFillCurrent" : "", mounted ? "velocityBarFillMounted" : "")}
                        style={{ "--vel-scale": String(Math.min(w.pts / Math.max(...displayVelocity.map(v => v.pts), 1), 1)) } as React.CSSProperties}
                      />
                    </div>
                    <span className={cx("velocityValue", w.current ? "velocityValueCurrent" : "")}>{w.pts}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Situation Report */}
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <Ic n="sparkle" sz={14} c="var(--amber)" />
            <span className={cx("cardHdTitle")}>AI Situation Report</span>
            <span className={cx("badge", "badgeAccent")}>Live analysis</span>
            {dataLoading && <span className={cx("text11", "colorMuted", "mlAuto")}>Updating…</span>}
          </div>
          <div className={cx("aiScanRow")}>
            <span className={cx("aiScanLabel")}>
              MAPHARI.AI · SCAN COMPLETE · {displayInsights.length} SIGNAL{displayInsights.length !== 1 ? "S" : ""} DETECTED
            </span>
          </div>
          <div className={cx("cardBody")}>
            <div className={cx("aiInsightList")}>
              {displayInsights.map((ins, i) => {
                const isExpanded = expandedIns === i;
                const tc = TONE_COLOR[ins.tone] ?? "var(--lime)";
                return (
                  <div key={i} className={cx("aiInsight", "pointer")}
                    onClick={() => setExpandedIns(isExpanded ? null : i)}>
                    <div className={cx("flexRow", "flexAlignStart", "gap10")}>
                      <div className={cx("aiIconBox")}
                        style={{
                          "--bg-color": `color-mix(in oklab, ${tc} 12%, var(--s2))`,
                          "--color": `color-mix(in oklab, ${tc} 25%, transparent)`,
                        } as React.CSSProperties}>
                        <Ic n={ins.icon} sz={12} c={tc} />
                      </div>
                      <div className={cx("aiInsightContent", "flex1")}>
                        <p className={cx("text12")}>{ins.text}</p>
                        <div className={cx("aiConfRow")}>
                          {Array.from({ length: 10 }, (_, j) => (
                            <span key={j} className={cx("aiPip", j < Math.round(ins.confidence / 10) ? "aiPipFull" : "")} />
                          ))}
                          <span className={cx("text10", "colorMuted", "aiConfLabel")}>{ins.confidence}%</span>
                          <span className={cx("badge", TONE_BADGE[ins.tone] ?? "badgeMuted", "mlAuto")}>{ins.tone}</span>
                        </div>
                      </div>
                      <Ic n={isExpanded ? "chevronDown" : "chevronRight"} sz={11} c="var(--muted2)" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI answer */}
            {aiAnswer && (
              <div className={cx("aiAnswerCard")}>
                <div className={cx("flexRow", "flexCenter", "gap6", "mb6")}>
                  <Ic n="sparkle" sz={11} c="var(--amber)" />
                  <span className={cx("text10", "colorMuted", "fw700", "ls006")}>MAPHARI.AI RESPONSE</span>
                </div>
                <p className={cx("text11", "colorMuted", "lineH175")}>{aiAnswer}</p>
              </div>
            )}

            <div className={cx("aiAskRow")}>
              <input className={cx("aiAskInput")} type="text"
                placeholder="Ask AI about your project..."
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAsk()}
              />
              <button type="button" className={cx("btnSm", "btnGhost", "dynColor")} onClick={handleAsk}
                disabled={aiLoading} style={{ "--color": "inherit" } as React.CSSProperties}>
                {aiLoading ? "..." : "Ask →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
