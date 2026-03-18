// ════════════════════════════════════════════════════════════════════════════
// home-page-helpers.ts — Pure helpers for the client home page
// No React imports — plain TS utility functions only.
// ════════════════════════════════════════════════════════════════════════════

import type { PortalDeliverable, PortalRisk } from "../../../../lib/api/portal/project-layer";
import type { PortalInvoice, PortalMilestoneApproval } from "../../../../lib/api/portal/types";
import type { PortalAppointment } from "../../../../lib/api/portal/client-cx";
import type { PortalAnnouncement } from "../../../../lib/api/portal/governance";

// ── Greeting helpers ──────────────────────────────────────────────────────────

export function extractFirstName(email: string): string {
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._-]/)[0] ?? local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── Date formatter ────────────────────────────────────────────────────────────

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export function fmtCents(cents: number): string {
  return `R ${Math.round(cents / 100).toLocaleString("en-ZA")}`;
}

// ── Time-ago helper (internal) ────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)    return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ── Initials helper (internal) ────────────────────────────────────────────────

function initials(name: string | null | undefined, fallback = "??"): string {
  if (!name || !name.trim()) return fallback;
  return name.trim().split(/\s+/).map(n => n[0] ?? "").join("").toUpperCase().slice(0, 2);
}

// ── 8-week health trend from deliverable timestamps ──────────────────────────

/**
 * Builds an 8-point health score sparkline (one point per week, oldest→newest).
 * Uses deliverable.deliveredAt timestamps to reconstruct how many were approved
 * at each past week, then maps that approval ratio to a 40-100 health score,
 * adjusted by current riskLevel.
 */
export function buildHealthTrend(
  deliverables: PortalDeliverable[],
  currentScore: number,
  riskLevel: string,
): number[] {
  const WEEKS    = 8;
  const weekMs   = 7 * 86_400_000;
  const now      = Date.now();

  const riskPenalty =
    riskLevel === "CRITICAL" ? 25 :
    riskLevel === "HIGH"     ? 15 :
    riskLevel === "MEDIUM"   ?  5 : 0;

  // No data → flat line at current score
  if (deliverables.length === 0) {
    return Array<number>(WEEKS).fill(Math.max(0, currentScore));
  }

  return Array.from({ length: WEEKS }, (_, i) => {
    const weekEnd = now - (WEEKS - 1 - i) * weekMs;

    // Deliverables that already existed at this point in time
    const existing = deliverables.filter(
      d => new Date(d.createdAt).getTime() <= weekEnd
    );

    if (existing.length === 0) {
      // Before any deliverables existed — step down from current proportionally
      return Math.max(40, currentScore - (WEEKS - 1 - i) * 3);
    }

    // Deliverables approved on or before this week-end
    const approved = deliverables.filter(
      d =>
        d.status === "APPROVED" &&
        d.deliveredAt &&
        new Date(d.deliveredAt).getTime() <= weekEnd,
    ).length;

    const ratio = approved / existing.length;
    return Math.round(Math.max(40, Math.min(100, 60 + ratio * 40 - riskPenalty)));
  });
}

// ── Activity feed from real data ──────────────────────────────────────────────

export interface FeedItem {
  av: string;
  avColor: string;
  evColor: string;
  text: string;
  time: string;
  ts: number;
}

export function buildRealFeed(
  deliverables: PortalDeliverable[],
  risks: PortalRisk[],
  appointments: PortalAppointment[],
  announcements: PortalAnnouncement[],
): FeedItem[] {
  const items: FeedItem[] = [];

  // ── Deliverables — show the 4 most recently updated ──────────────────────
  const sorted = [...deliverables]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  for (const d of sorted) {
    const ts = new Date(d.updatedAt).getTime();
    const av = initials(d.ownerName ?? d.name.split(" ")[0] ?? "?", "DL");
    const avColor =
      d.status === "APPROVED"    ? "var(--lime)"   :
      d.status === "IN_REVIEW"   ? "var(--amber)"  :
      d.status === "IN_PROGRESS" ? "var(--accent)"  : "var(--muted2)";
    const evColor =
      d.status === "APPROVED"  ? "var(--lime)"  :
      d.status === "IN_REVIEW" ? "var(--amber)" :
      d.status === "REJECTED"  ? "var(--red)"   : "var(--purple)";
    const verb =
      d.status === "APPROVED"    ? "approved and delivered" :
      d.status === "IN_REVIEW"   ? "moved to review — awaiting sign-off" :
      d.status === "IN_PROGRESS" ? "is in progress" :
      d.status === "REJECTED"    ? "needs revisions" : "updated";
    items.push({ av, avColor, evColor, text: `'${d.name}' ${verb}`, time: timeAgo(ts), ts });
  }

  // ── Risks — show the 2 most recent active risks ───────────────────────────
  const recentRisks = [...risks]
    .filter(r => r.status !== "RESOLVED" && r.status !== "CLOSED")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);

  for (const r of recentRisks) {
    const ts = new Date(r.createdAt).getTime();
    items.push({
      av: "RM", avColor: "var(--red)", evColor: "var(--red)",
      text: `Risk identified: '${r.name}'`,
      time: timeAgo(ts), ts,
    });
  }

  // ── Appointments — show the 2 nearest upcoming ────────────────────────────
  const upcomingAppts = [...appointments]
    .filter(a => a.status !== "CANCELLED" && new Date(a.scheduledAt).getTime() > Date.now() - 86_400_000)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 2);

  for (const a of upcomingAppts) {
    const ts = new Date(a.scheduledAt).getTime();
    const label =
      a.type === "REVIEW"   ? "Review session" :
      a.type === "KICKOFF"  ? "Kickoff call"   :
      a.type === "STRATEGY" ? "Strategy session" : "Call";
    const dateLbl = new Date(a.scheduledAt).toLocaleDateString("en-ZA", { weekday: "short", month: "short", day: "numeric" });
    items.push({
      av: "CA", avColor: "var(--purple)", evColor: "var(--purple)",
      text: `${label} scheduled for ${dateLbl}`,
      time: timeAgo(ts), ts,
    });
  }

  // ── Announcements — most recent published ─────────────────────────────────
  const recentAnn = announcements
    .filter(a => a.publishedAt)
    .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
    .slice(0, 1);

  for (const ann of recentAnn) {
    const ts = new Date(ann.publishedAt!).getTime();
    items.push({
      av: "AN", avColor: "var(--accent)", evColor: "var(--accent)",
      text: `Announcement: '${ann.title}'`,
      time: timeAgo(ts), ts,
    });
  }

  // Sort descending by timestamp, cap at 6
  return items.sort((a, b) => b.ts - a.ts).slice(0, 6);
}

// ── Pulse stats from real data ────────────────────────────────────────────────

export interface PulseStat {
  icon: string;
  lbl: string;
  val: string;
  note: string;
  color: string;
}

export function buildPulseStats(
  deliverables: PortalDeliverable[],
  milestoneApprovals: PortalMilestoneApproval[],
  risks: PortalRisk[],
  invoices: PortalInvoice[],
  dataLoading: boolean,
): PulseStat[] {
  const now = Date.now();
  const weekMs = 7 * 86_400_000;

  const dueSoon = deliverables.filter(
    d => d.dueAt && new Date(d.dueAt).getTime() < now + weekMs && d.status !== "APPROVED"
  ).length;

  const pendingApprovals = milestoneApprovals.filter(m => m.status === "PENDING").length;
  const activeRisks = risks.filter(r => r.status !== "RESOLVED" && r.status !== "CLOSED").length;
  const openInvoices = invoices.filter(i => i.status === "ISSUED" || i.status === "OVERDUE").length;

  const loading = dataLoading ? "…" : undefined;

  return [
    {
      icon: "layers",
      lbl: "Due This Week",
      val: loading ?? String(dueSoon),
      note: dueSoon > 0 ? `${dueSoon} deliverable${dueSoon !== 1 ? "s" : ""} need attention` : "nothing due this week",
      color: dueSoon > 0 ? "var(--amber)" : "var(--lime)",
    },
    {
      icon: "check",
      lbl: "Approvals Pending",
      val: loading ?? String(pendingApprovals),
      note: pendingApprovals > 0 ? "waiting for your sign-off" : "all milestones clear",
      color: pendingApprovals > 0 ? "var(--purple)" : "var(--lime)",
    },
    {
      icon: "alert",
      lbl: "Active Risks",
      val: loading ?? String(activeRisks),
      note: activeRisks > 0 ? `${activeRisks} risk${activeRisks !== 1 ? "s" : ""} being monitored` : "no active risks",
      color: activeRisks > 0 ? "var(--red)" : "var(--lime)",
    },
    {
      icon: "creditCard",
      lbl: "Open Invoices",
      val: loading ?? String(openInvoices),
      note: openInvoices > 0 ? "outstanding payment required" : "all invoices settled",
      color: openInvoices > 0 ? "var(--amber)" : "var(--lime)",
    },
  ];
}

// ── Team from project collaborators ──────────────────────────────────────────

export interface TeamMemberDisplay {
  av: string;
  color: string;
  name: string;
  task: string;
  active: boolean;
}

const TEAM_COLORS = ["var(--lime)", "var(--purple)", "var(--amber)", "var(--accent)"] as const;

export function buildTeamFromCollaborators(
  collaborators: Array<{ name: string; role: string }>,
): TeamMemberDisplay[] {
  if (collaborators.length === 0) {
    return [{
      av: "MT", color: "var(--lime)", name: "Maphari Team",
      task: "Working on your project", active: true,
    }];
  }
  return collaborators.slice(0, 4).map((c, i) => ({
    av: initials(c.name, "MT"),
    color: TEAM_COLORS[i % TEAM_COLORS.length] as string,
    name: c.name,
    task: c.role,
    active: true,
  }));
}

// ── Dynamic action builder types ──────────────────────────────────────────────

export interface DynamicAction {
  id: string;
  icon: string;
  icoTone: string;
  icoColor: string;
  accent: string;
  badge: string;
  urgency: string;
  due: string;
  dueCls: string;
  wait: string;
  waitCls: string;
  title: string;
  sub: string;
  cta: string;
  secondaryCta: string | null;
  detail: string;
}

// ── Build dynamic actions from real data ─────────────────────────────────────

export function buildDynamicActions(
  invoices: PortalInvoice[],
  milestoneApprovals: PortalMilestoneApproval[],
  deliverables: PortalDeliverable[],
  appointments: PortalAppointment[],
): DynamicAction[] {
  const actions: DynamicAction[] = [];

  // 1. Overdue invoices → one action per
  const overdueInvoices = invoices.filter(inv => inv.status === "OVERDUE");
  for (const inv of overdueInvoices) {
    actions.push({
      id:           `inv-${inv.id}`,
      icon:         "creditCard",
      icoTone:      "hxActIcoRed",
      icoColor:     "var(--red)",
      accent:       "hxActAccentRed",
      badge:        "badgeRed",
      urgency:      "Overdue",
      due:          "Overdue",
      dueCls:       "hxCountOverdue",
      wait:         "",
      waitCls:      "hxActTimerRed",
      title:        `Pay Invoice ${inv.number ?? inv.id.slice(0, 6).toUpperCase()}`,
      sub:          `${fmtCents(inv.amountCents)} · Due ${formatDate(inv.dueAt)}`,
      cta:          "Pay Now",
      secondaryCta: "View Invoice",
      detail:       "This invoice is overdue. Contact your account manager to arrange payment.",
    });
  }

  // 2. Pending milestone approvals → one action per (PENDING status)
  const pendingApprovals = milestoneApprovals.filter(ma => ma.status === "PENDING");
  for (const ma of pendingApprovals) {
    actions.push({
      id:           `ma-${ma.id}`,
      icon:         "check",
      icoTone:      "hxActIcoAmber",
      icoColor:     "var(--amber)",
      accent:       "hxActAccentAmber",
      badge:        "badgeAmber",
      urgency:      "Pending",
      due:          "Awaiting approval",
      dueCls:       "hxCountSoon",
      wait:         "",
      waitCls:      "",
      title:        `Approve Milestone`,
      sub:          "Milestone approval required",
      cta:          "Review & Approve",
      secondaryCta: "View Milestone",
      detail:       "Your approval is required to proceed to the next project stage.",
    });
  }

  // 3. Deliverables in review → one action each (max 2)
  const inReviewDeliverables = deliverables
    .filter(del => del.status === "IN_REVIEW")
    .slice(0, 2);
  for (const del of inReviewDeliverables) {
    actions.push({
      id:           `del-${del.id}`,
      icon:         "eye",
      icoTone:      "hxActIcoPurple",
      icoColor:     "var(--purple)",
      accent:       "hxActAccentPurple",
      badge:        "badgePurple",
      urgency:      "Ready",
      due:          del.dueAt ? `Due ${formatDate(del.dueAt)}` : "Ready now",
      dueCls:       "hxCountOk",
      wait:         "",
      waitCls:      "",
      title:        `Review ${del.name}`,
      sub:          del.dueAt ? `Due ${formatDate(del.dueAt)}` : "Awaiting your feedback",
      cta:          "View & Review",
      secondaryCta: null,
      detail:       "This deliverable is ready for your review.",
    });
  }

  // 4. No upcoming appointments → add "Book a Call" action
  const upcomingAppointments = appointments.filter(
    a => a.status !== "CANCELLED" && new Date(a.scheduledAt) > new Date(),
  );
  if (upcomingAppointments.length === 0) {
    actions.push({
      id:           "book-call",
      icon:         "calendar",
      icoTone:      "hxActIcoLime",
      icoColor:     "var(--lime)",
      accent:       "hxActAccentLime",
      badge:        "badgeAccent",
      urgency:      "Recommended",
      due:          "Recommended",
      dueCls:       "hxCountOk",
      wait:         "",
      waitCls:      "",
      title:        "Book a Strategy Call",
      sub:          "Schedule your next check-in with the team",
      cta:          "Pick a Time",
      secondaryCta: null,
      detail:       "Regular calls keep your project on track and give you a chance to review progress.",
    });
  }

  return actions;
}

// ── Deliverable display mapper ────────────────────────────────────────────────

export const DELIVERABLE_STATUS_MAP: Record<string, {
  label: string; badge: string; state: string; icon: string; iconColor: string;
}> = {
  APPROVED:    { label: "Done",        badge: "badgeGreen",  state: "Done",    icon: "check", iconColor: "var(--lime)"   },
  IN_REVIEW:   { label: "In Review",   badge: "badgeAmber",  state: "Review",  icon: "eye",   iconColor: "var(--amber)"  },
  IN_PROGRESS: { label: "In Progress", badge: "badgeAccent", state: "Active",  icon: "zap",   iconColor: "var(--accent)" },
  PENDING:     { label: "Planned",     badge: "badgeMuted",  state: "Planned", icon: "list",  iconColor: "var(--muted2)" },
  DRAFT:       { label: "Planned",     badge: "badgeMuted",  state: "Planned", icon: "list",  iconColor: "var(--muted2)" },
  REJECTED:    { label: "Revisions",   badge: "badgeRed",    state: "Review",  icon: "alert", iconColor: "var(--red)"    },
};

const STATUS_PRIORITY: Record<string, number> = {
  IN_REVIEW: 0, IN_PROGRESS: 1, PENDING: 2, DRAFT: 3, APPROVED: 4, REJECTED: 5,
};

export interface DeliverableDisplay {
  id: string;
  title: string;
  status: string;
  badge: string;
  state: string;
  icon: string;
  iconColor: string;
}

export function mapDeliverablesToDisplay(deliverables: PortalDeliverable[]): DeliverableDisplay[] {
  return [...deliverables]
    .sort((a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99))
    .slice(0, 5)
    .map(d => {
      const mapped = DELIVERABLE_STATUS_MAP[d.status] ?? DELIVERABLE_STATUS_MAP["PENDING"]!;
      return {
        id:        d.id,
        title:     d.name,
        status:    mapped.label,
        badge:     mapped.badge,
        state:     mapped.state,
        icon:      mapped.icon,
        iconColor: mapped.iconColor,
      };
    });
}

export function computeSprintBadge(deliverables: PortalDeliverable[]): string {
  const done = deliverables.filter(d => d.status === "APPROVED").length;
  const total = deliverables.length;
  return `${done} of ${total} done`;
}

export function computeDeliverableProgress(deliverables: PortalDeliverable[]): number {
  if (deliverables.length === 0) return 0;
  const done = deliverables.filter(d => d.status === "APPROVED").length;
  return done / deliverables.length;
}

export function computeScopeTags(deliverables: PortalDeliverable[]): string[] {
  return deliverables.slice(0, 5).map(d => d.name);
}

// ── Appointment display mapper ────────────────────────────────────────────────

export interface EventDisplay {
  id: string;
  day: string;
  date: string;
  title: string;
  meta: string;
  dot: string;
  cta: string;
  videoRoomUrl: string | null;
}

export function mapAppointmentsToDisplay(appointments: PortalAppointment[]): EventDisplay[] {
  const now = Date.now();
  return appointments
    .filter(a => a.status !== "CANCELLED" && new Date(a.scheduledAt).getTime() > now - 86400000)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3)
    .map(a => {
      const d = new Date(a.scheduledAt);
      const timeStr = d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
      const durationStr = a.durationMins ? ` · ${a.durationMins} min` : "";
      const meetingType = a.videoRoomUrl ? " · Video Call" : " · Call";
      let title = a.notes ?? "Meeting";
      if (a.type === "CHECK_IN") title = "Check-in Call";
      else if (a.type === "STRATEGY") title = "Strategy Session";
      else if (a.type === "KICKOFF") title = "Kickoff Call";
      else if (a.type === "REVIEW") title = "Review Session";
      return {
        id:           a.id,
        day:          d.toLocaleDateString("en-ZA", { weekday: "short" }).toUpperCase().slice(0, 3),
        date:         String(d.getDate()),
        title,
        meta:         `${timeStr}${durationStr}${meetingType}`,
        dot:          "var(--lime)",
        cta:          a.videoRoomUrl ? "Join" : "View",
        videoRoomUrl: a.videoRoomUrl ?? null,
      };
    });
}

// ── Risk display mapper ───────────────────────────────────────────────────────

export interface RiskDisplay {
  id: string;
  level: string;
  color: string;
  icon: string;
  title: string;
  sub: string;
}

export function mapRisksToDisplay(risks: PortalRisk[]): RiskDisplay[] {
  return risks
    .filter(r => r.status !== "RESOLVED" && r.status !== "CLOSED")
    .slice(0, 2)
    .map(r => {
      const hi = r.impact === "HIGH" || r.impact === "CRITICAL" || r.likelihood === "HIGH";
      const mid = r.impact === "MEDIUM" || r.likelihood === "MEDIUM";
      const level = hi ? "high" : mid ? "medium" : "low";
      const color = hi ? "var(--red)" : mid ? "var(--amber)" : "var(--blue)";
      const icon = level === "low" ? "info" : "alert";
      return {
        id:    r.id,
        level,
        color,
        icon,
        title: r.name,
        sub:   r.detail ?? r.mitigation ?? "Risk identified — team is investigating.",
      };
    });
}
