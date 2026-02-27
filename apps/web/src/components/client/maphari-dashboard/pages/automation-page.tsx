"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cx, styles } from "../style";
import { formatMoney } from "../utils";
import type { PortalProject } from "../../../../lib/api/portal";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type ClientAutomationPageProps = {
  active: boolean;
  queuedJobs?: number;
  overdueInvoices?: number;
  pendingApprovals?: number;
  openBlockers?: number;
  workflowRows?: Array<{
    id: string;
    name: string;
    trigger: string;
    status: "active" | "watch" | "risk" | "draft";
    impact: string;
    lastEvent: string;
  }>;
  onOpenMessages?: () => void;
  onOpenInvoices?: () => void;
  onOpenProjects?: () => void;
  automationRows?: AutomationRow[];
  projects?: PortalProject[];
  convertMoney?: (cents: number, currency: string) => number;
  displayCurrency?: string;
};

type AutomationRow = {
  id: string;
  name: string;
  trigger: string;
  status: "active" | "draft" | "risk" | "watch";
  impact: string;
  lastEvent: string;
};

type ChatMessage = {
  role: "ai" | "user";
  text: string;
};

type TeamMember = {
  name: string;
  role: string;
  skills: string[];
  online: boolean;
  avatar: string;
  avatarTone: "accent" | "purple" | "amber" | "green" | "red";
};

type UpcomingEvent = {
  day: string;
  month: string;
  icon: string;
  iconTone: "purple" | "accent" | "amber" | "red";
  title: string;
  meta: string;
  tags: Array<{ tone: "purple" | "green" | "red" | "amber" | "muted"; label: string }>;
  actions: Array<{ label: string; variant?: "primary" | "join" | "ghost" }>;
};

type CalendarEvent = { label: string; tone: "meeting" | "deadline" | "milestone" | "call" };

type MainTab = "Active Automations" | "Calendar & Schedule" | "AI Assistant";

/* ─── Badge / tag styling maps ───────────────────────────────────────────── */

const TAG_CLASS: Record<"purple" | "green" | "red" | "amber" | "muted", string> = {
  purple: styles.badgePurple,
  green:  styles.badgeAccent,
  red:    styles.badgeRed,
  amber:  styles.badgeAmber,
  muted:  styles.badgeMuted,
};

/* Maps status → CSS class for the glow bar */
const GLOW_CLASS: Record<AutomationRow["status"], string> = {
  active: styles.autoGlowAccent,
  watch:  styles.autoGlowAmber,
  risk:   styles.autoGlowRed,
  draft:  styles.autoGlowMuted,
};

/* Maps static seed glow value → CSS class (for STATIC_AUTOMATIONS) */
const GLOW_VAR_CLASS: Record<string, string> = {
  "var(--accent)":  styles.autoGlowAccent,
  "var(--amber)":   styles.autoGlowAmber,
  "var(--red)":     styles.autoGlowRed,
  "var(--green)":   styles.autoGlowAccent, // green maps to accent style as closest
  "var(--purple)":  styles.autoGlowMuted,  // purple maps to muted for now
  "var(--muted3)":  styles.autoGlowMuted,
};

/* Maps forecast color token → progressFill tone class */
const FORECAST_FILL_CLASS: Record<string, string> = {
  "var(--amber)":   styles.progressFillAmber,
  "var(--accent)":  styles.progressFillAccent,
  "var(--purple)":  styles.progressFillPurple,
  "var(--green)":   styles.progressFillGreen,
};

/* Maps event icon tone → eventIconBox modifier class */
const ICON_BOX_CLASS: Record<"purple" | "accent" | "amber" | "red", string> = {
  purple: styles.eventIconBoxPurple,
  accent: styles.eventIconBoxAccent,
  amber:  styles.eventIconBoxAmber,
  red:    styles.eventIconBoxRed,
};

/* Maps calendar tone → calEventPill modifier class */
const CAL_PILL_CLASS: Record<CalendarEvent["tone"], string> = {
  meeting:   styles.calEventPillMeeting,
  deadline:  styles.calEventPillDeadline,
  milestone: styles.calEventPillMilestone,
  call:      styles.calEventPillCall,
};

/* Maps calendar tone → calLegendDot modifier class */
const CAL_DOT_CLASS: Record<CalendarEvent["tone"], string> = {
  meeting:   styles.calLegendDotMeeting,
  deadline:  styles.calLegendDotDeadline,
  milestone: styles.calLegendDotMilestone,
  call:      styles.calLegendDotCall,
};

/* Maps team member avatarTone → teamAvatar modifier class */
const AVATAR_CLASS: Record<TeamMember["avatarTone"], string> = {
  accent: styles.teamAvatarAccent,
  purple: styles.teamAvatarPurple,
  amber:  styles.teamAvatarAmber,
  green:  styles.teamAvatarGreen,
  red:    styles.teamAvatarRed,
};

const STATUS_TEXT: Record<AutomationRow["status"], string> = {
  active: "Active",
  watch:  "Monitoring",
  risk:   "At Risk",
  draft:  "Inactive",
};

const ROW_ICONS: Record<string, string> = {
  "client-status-sync":       "✅",
  "client-invoice-reminders": "🧾",
  "client-approvals":         "📝",
  "client-thread-alerts":     "⚠",
};

/* ─── Seed data: automations ─────────────────────────────────────────────── */

const STATIC_AUTOMATIONS = [
  { icon: "🧾", name: "Invoice Reminder Engine",  desc: "Auto-sends payment reminders at 7 days before due, on due date, and 3 days after.", runs: "Ran 3× this week",    on: true,  glow: "var(--amber)",   statusText: "Active"     },
  { icon: "✅", name: "Milestone Status Sync",     desc: "Pushes status updates when team marks a milestone complete or in review.",           runs: "Ran 6× this month",   on: true,  glow: "var(--accent)",  statusText: "Active"     },
  { icon: "📊", name: "Weekly Digest Generator",   desc: "Every Monday at 08:00, generates a project summary and emails it.",                  runs: "Ran 4× this month",   on: true,  glow: "var(--purple)",  statusText: "Active"     },
  { icon: "⚠",  name: "SLA Breach Alerter",        desc: "Monitors milestone due dates and warns when within 48 hours of breach.",             runs: "Triggered Feb 18",    on: true,  glow: "var(--red)",     statusText: "Monitoring" },
  { icon: "📝", name: "Meeting Notes Archiver",    desc: "After every call, AI transcribes and attaches a summary to project thread.",         runs: "Last run: Feb 19",    on: false, glow: "var(--green)",   statusText: "Paused"     },
  { icon: "🔮", name: "Scope Creep Detector",      desc: "Compares milestone descriptions against completed work and flags risk.",              runs: "No triggers yet",     on: false, glow: "var(--purple)",  statusText: "Paused"     },
] as const;

const ALERTS = [
  { toneClass: "notifRowRed"    as const, icon: "⚠",  title: "Late Payment Prediction — INV-011",  desc: "There is an 87% probability this invoice will remain unpaid past Feb 25.",   time: "Just now", actions: [{ label: "Call Client",      primary: true  }, { label: "Send Reminder",   primary: false }] },
  { toneClass: "notifRowAmber"  as const, icon: "⏱",  title: "Delivery Delay Risk — UAT Phase",    desc: "Current UAT velocity suggests a 6-day delay vs the Mar 14 go-live.",         time: "2h ago",   actions: [{ label: "View Blocker",     primary: true  }, { label: "Adjust Timeline", primary: false }] },
  { toneClass: "notifRowGreen"  as const, icon: "🎉",  title: "Milestone Completed — Backend API",  desc: "All 14 endpoints confirmed live on staging. Ready for client sign-off.",      time: "Feb 18",   actions: [{ label: "Sign Off",         primary: true  }]                                                },
  { toneClass: "notifRowPurple" as const, icon: "📊",  title: "Retainer Burn Rate Alert",           desc: "At current velocity, Lead Pipeline retainer will be exhausted by Mar 08.",   time: "Feb 17",   actions: [{ label: "Review Scope",     primary: false }, { label: "Extend Retainer", primary: false }] },
] as const;

const MEETING_NOTES = [
  { title: "Sprint Review & Demo — Feb 21", date: "Today · 14:00",  summary: "Stripe integration demoed successfully. Client approved staging build. UAT sign-off item raised.", tags: ["approved", "uat", "action items"] },
  { title: "Q1 Kickoff — All Projects",     date: "Feb 12 · 10:00", summary: "Priorities confirmed: Client Portal first, then Lead Pipeline UAT.",                                 tags: ["strategy", "q2 planning"]         },
  { title: "Design Review — Screen v3",     date: "Feb 09 · 11:00", summary: "Navigation spacing approved. 3 minor revisions requested.",                                           tags: ["design", "approved"]              },
  { title: "Invoice Dispute Resolution",    date: "Feb 06 · 09:30", summary: "INV-009 dispute resolved with a credit applied to next invoice.",                                     tags: ["finance", "resolved"]             },
] as const;

/* ─── Seed data: AI assistant ────────────────────────────────────────────── */

const QUICK_QUESTIONS = [
  "Where is my invoice?",
  "What stage is Client Portal v2?",
  "When is the next milestone due?",
  "How many hours were logged this week?",
  "Is the project on track for go-live?",
  "What is my outstanding balance?",
  "When was the last payment made?",
  "Who is working on my project?",
] as const;

const AI_RESPONSES: Record<string, string> = {
  "Where is my invoice?":                  "INV-2026-011 is currently <strong>overdue</strong> by 18 days. You can pay directly from the Invoices screen.",
  "What stage is Client Portal v2?":       "Client Portal v2 is <strong>72% complete</strong>. The Design System is in review and UAT is pending API sign-off.",
  "When is the next milestone due?":       "The next milestone deadline is <strong>UAT Sign-off on Feb 28</strong>. This is currently blocked.",
  "How many hours were logged this week?": "<strong>54 hours</strong> were logged this week across all projects.",
  "Is the project on track for go-live?":  "<strong>At risk.</strong> Current UAT delay may move go-live from Mar 14 to Mar 20.",
  "What is my outstanding balance?":       "Outstanding balance is <strong>R 38,000 total</strong>.",
  "When was the last payment made?":       "Last payment: <strong>R 22,000</strong> received Feb 15.",
  "Who is working on my project?":         "Your team: <strong>Sipho N.</strong>, <strong>Lerato M.</strong>, <strong>Thabo K.</strong>, <strong>Nomsa D.</strong>, <strong>James M.</strong>",
};

/* ─── Seed data: budget forecasting ─────────────────────────────────────── */

const STATIC_FORECASTS = [
  { label: "Client Portal v2 Retainer", used: 78, color: "var(--amber)",  meta: "R 70,200 of R 90,000" },
  { label: "Lead Pipeline Retainer",    used: 40, color: "var(--accent)", meta: "R 22,000 of R 55,000" },
  { label: "Automation Suite Budget",   used: 24, color: "var(--purple)", meta: "R 8,400 of R 35,000"  },
] as const;

/* ─── Seed data: calendar & schedule ────────────────────────────────────── */

export const CLIENT_SCHEDULING_TEAM: TeamMember[] = [
  { name: "Sipho Ndlovu",   role: "Project Lead",     skills: ["React", "Node.js", "Strategy"],      online: true,  avatar: "SN", avatarTone: "accent"  },
  { name: "Lerato Mokoena", role: "UI/UX Designer",   skills: ["Figma", "Design Systems", "Motion"], online: true,  avatar: "LM", avatarTone: "purple"  },
  { name: "Thabo Khumalo",  role: "Backend Engineer", skills: ["API", "PostgreSQL", "AWS"],           online: false, avatar: "TK", avatarTone: "amber"   },
  { name: "Nomsa Dlamini",  role: "QA Engineer",      skills: ["Cypress", "Jest", "UAT"],             online: true,  avatar: "ND", avatarTone: "green"   },
  { name: "James Mahlangu", role: "DevOps",            skills: ["Docker", "CI/CD", "Vercel"],          online: false, avatar: "JM", avatarTone: "red"     },
  { name: "Aisha Petersen", role: "Product Manager",  skills: ["Roadmap", "Scrum", "OKRs"],           online: true,  avatar: "AP", avatarTone: "accent"  },
];

export const CLIENT_SCHEDULING_UPCOMING: UpcomingEvent[] = [
  { day: "21", month: "Feb", icon: "📹", iconTone: "purple", title: "Sprint Review & Demo",     meta: "Today · 14:00–15:00 · Google Meet",    tags: [{ tone: "purple", label: "Meeting"   }],                                  actions: [{ label: "Join Now",       variant: "join"    }, { label: "Agenda",       variant: "ghost"   }] },
  { day: "24", month: "Feb", icon: "✓",  iconTone: "accent", title: "UAT Sign-off Deadline",    meta: "Monday · All day · Client Portal v2",  tags: [{ tone: "green",  label: "Milestone"  }],                                  actions: [{ label: "Review",         variant: "primary" }, { label: "Remind team", variant: "ghost"   }] },
  { day: "26", month: "Feb", icon: "📞", iconTone: "amber",  title: "Quarterly Strategy Call",  meta: "Wednesday · 10:00–11:30 · Zoom",       tags: [{ tone: "amber",  label: "Call"       }, { tone: "purple", label: "Recurring" }], actions: [{ label: "Reschedule",     variant: "ghost"   }, { label: "Add note",    variant: "ghost"   }] },
  { day: "03", month: "Mar", icon: "⚠",  iconTone: "red",    title: "INV-011 Payment Deadline", meta: "Tuesday · Finance · Client Portal v2", tags: [{ tone: "red",    label: "Invoice"    }],                                  actions: [{ label: "Pay Now",        variant: "primary" }]                                                         },
  { day: "07", month: "Mar", icon: "🚀", iconTone: "accent", title: "Production Go-Live",       meta: "Saturday · 09:00 · Client Portal v2",  tags: [{ tone: "green",  label: "Launch"     }, { tone: "red",    label: "Critical"  }], actions: [{ label: "View checklist", variant: "ghost"   }, { label: "Set reminder",variant: "ghost"   }] },
];

export const CLIENT_SCHEDULING_CAL_EVENTS: Record<number, CalendarEvent[]> = {
  21: [{ label: "Sprint Review",  tone: "meeting"   }],
  24: [{ label: "UAT Deadline",   tone: "milestone" }],
  26: [{ label: "Strategy Call",  tone: "call"      }],
  28: [{ label: "INV-010 Due",    tone: "deadline"  }],
  3:  [{ label: "INV-011 Due",    tone: "deadline"  }],
  7:  [{ label: "Go-Live 🚀",     tone: "milestone" }],
  14: [{ label: "Monthly Review", tone: "meeting"   }],
};

export const CLIENT_SCHEDULING_DAYS       = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const CLIENT_SCHEDULING_TIMES      = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"] as const;
export const CLIENT_SCHEDULING_DURATIONS  = ["30 min", "45 min", "60 min", "90 min"] as const;
export const CLIENT_SCHEDULING_UNAVAILABLE = ["09:00", "10:00", "14:00", "15:30"] as const;
const UNAVAILABLE_SLOTS = new Set<string>(CLIENT_SCHEDULING_UNAVAILABLE);

function buildCalendar() {
  const cells: Array<{ day: number; other: boolean }> = [];
  for (let i = 0; i < 6; i += 1) cells.push({ day: 26 + i, other: true });
  for (let i = 1; i <= 28; i += 1) cells.push({ day: i, other: false });
  for (let i = 1; i <= 7; i += 1) cells.push({ day: i, other: true });
  return cells;
}

/* ─── ForecastBar: sets progress fill width imperatively via ref ─────────── */

function ForecastBar({ used, colorClass }: { used: number; colorClass: string }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackRef.current?.style.setProperty("--fill-w", `${used}%`);
  }, [used]);

  return (
    <div className={styles.progressTrack} ref={trackRef}>
      <div className={cx(styles.progressFill, colorClass)} />
    </div>
  );
}

/* ─── Forecast block (shared between Retainer Forecast sub-tab and AI Assistant) */

type ForecastItem = { label: string; used: number; color: string; meta: string };

function ForecastBlock({
  items,
  isLive,
  projectCount,
  onTopUp,
}: {
  items: ForecastItem[];
  isLive: boolean;
  projectCount: number;
  onTopUp: (label: string) => void;
}) {
  return (
    <div className={cx(styles.card, styles.forecastCardMt)}>
      <div className={styles.cardBody}>
        <div className={cx(styles.pageSub, styles.forecastCallout)}>
          {isLive ? (
            <>
              <strong className={styles.forecastCalloutAccent}>Live data:</strong>{" "}
              Showing current budget allocation across {projectCount} active project{projectCount === 1 ? "" : "s"}.
            </>
          ) : (
            <>
              <strong className={styles.forecastCalloutAccent}>AI Forecast:</strong> At current velocity,{" "}
              <strong>Client Portal v2</strong> retainer will be exhausted by{" "}
              <strong className={styles.forecastCalloutAmber}>Mar 02</strong>.
            </>
          )}
        </div>
        {items.map((fc, idx) => (
          <div
            key={fc.label}
            className={cx(styles.forecastRow, idx < items.length - 1 && styles.forecastRowMb)}
          >
            <div className={styles.forecastLabelCol}>
              <div className={cx(styles.cardTitle, styles.forecastLabelTitle)}>{fc.label}</div>
              <div className={styles.cardSub}>{fc.meta}</div>
            </div>
            <div className={styles.forecastBarCol}>
              <ForecastBar
                used={fc.used}
                colorClass={FORECAST_FILL_CLASS[fc.color] ?? styles.progressFillAccent}
              />
              <div className={cx(styles.tableMonospace, styles.forecastMeta)}>
                {fc.used}% used · {100 - fc.used}% remaining
              </div>
            </div>
            <button
              type="button"
              className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}
              onClick={() => onTopUp(fc.label)}
            >
              Top Up
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function ClientAutomationPage({
  active,
  automationRows,
  projects,
  convertMoney,
  displayCurrency = "ZAR",
}: ClientAutomationPageProps) {
  /* ── Top-level tab ─────────────────────────────────────────────────────── */
  const [mainTab, setMainTab] = useState<MainTab>("Active Automations");

  /* ── Active Automations sub-state ──────────────────────────────────────── */
  const [autoToggles, setAutoToggles] = useState<boolean[]>(() =>
    automationRows
      ? automationRows.map((r) => r.status !== "draft")
      : STATIC_AUTOMATIONS.map((a) => a.on)
  );
  const [autoSubTab, setAutoSubTab] = useState<"Automations" | "Smart Alerts" | "Meeting Notes" | "Retainer Forecast">("Automations");

  /* Keep toggle state in sync if automationRows length changes */
  const prevRowCount = useRef(automationRows?.length ?? STATIC_AUTOMATIONS.length);
  if ((automationRows?.length ?? STATIC_AUTOMATIONS.length) !== prevRowCount.current) {
    prevRowCount.current = automationRows?.length ?? STATIC_AUTOMATIONS.length;
    setAutoToggles(
      automationRows
        ? automationRows.map((r) => r.status !== "draft")
        : STATIC_AUTOMATIONS.map((a) => a.on)
    );
  }

  const toggleAuto = (index: number) => {
    setAutoToggles((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const displayAutomations = automationRows?.length
    ? automationRows.map((row, i) => ({
        icon:       ROW_ICONS[row.id] ?? "⚙",
        name:       row.name,
        desc:       row.trigger,
        runs:       row.impact,
        glowClass:  GLOW_CLASS[row.status],
        statusText: STATUS_TEXT[row.status],
        lastEvent:  row.lastEvent,
        on:         autoToggles[i] ?? row.status !== "draft",
      }))
    : STATIC_AUTOMATIONS.map((a, i) => ({
        ...a,
        glowClass: GLOW_VAR_CLASS[a.glow] ?? styles.autoGlowAccent,
        on:        autoToggles[i] ?? a.on,
        lastEvent: "",
      }));

  const activeCount = autoToggles.filter(Boolean).length;

  const forecastData: ForecastItem[] = (() => {
    if (!projects?.length) return STATIC_FORECASTS.map((f) => ({ ...f }));
    const COLORS = ["var(--amber)", "var(--accent)", "var(--purple)", "var(--green)"] as const;
    return projects.slice(0, 4).map((p, i) => {
      const budget  = convertMoney ? convertMoney(p.budgetCents, "ZAR") : p.budgetCents / 100;
      const used    = p.progressPercent ?? 0;
      const usedAmt = Math.round((budget * used) / 100);
      return {
        label: p.name,
        used,
        color: COLORS[i % COLORS.length] as string,
        meta:  `${formatMoney(usedAmt, displayCurrency)} of ${formatMoney(budget, displayCurrency)}`,
      };
    });
  })();

  /* ── Calendar & Schedule sub-state ─────────────────────────────────────── */
  const [calSubTab, setCalSubTab]               = useState<"Calendar" | "Upcoming" | "Team">("Calendar");
  const [bookModal, setBookModal]               = useState(false);
  const [selectedTime, setSelectedTime]         = useState("");
  const [selectedDuration, setSelectedDuration] = useState<(typeof CLIENT_SCHEDULING_DURATIONS)[number]>("60 min");
  const cells                                   = useMemo(() => buildCalendar(), []);

  /* ── AI Assistant sub-state ─────────────────────────────────────────────── */
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Hi! I'm your Maphari AI assistant. Ask me anything about your projects, invoices, milestones, or team." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping]   = useState(false);
  const chatRef                   = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const sendChat = (message?: string) => {
    const text = message ?? chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    setIsTyping(true);
    window.setTimeout(() => {
      const reply =
        AI_RESPONSES[text] ??
        "Great question! Based on your current project status, everything is moving forward — though API sign-off remains the key blocker this week.";
      setIsTyping(false);
      setChatMessages((prev) => [...prev, { role: "ai", text: reply }]);
    }, 1200);
  };

  /* ── Toast ─────────────────────────────────────────────────────────────── */
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3500);
  };

  const handleBook = () => {
    setBookModal(false);
    showToast("Meeting booked", `Confirmation sent to your email · ${selectedTime || "Time TBD"}`);
  };

  /* ─── Render ────────────────────────────────────────────────────────────── */

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-automation">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Intelligence</div>
          <h1 className={styles.pageTitle}>Automation & AI</h1>
          <p className={styles.pageSub}>
            Active automations, team calendar, and AI-powered project assistant.
          </p>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={cx(styles.button, styles.buttonGhost)}
            onClick={() => showToast("Calendar exported", "ICS file ready")}
          >
            Export ICS
          </button>
          <button
            type="button"
            className={cx(styles.button, styles.buttonAccent)}
            onClick={() => setBookModal(true)}
          >
            + Book a Call
          </button>
        </div>
      </div>

      {/* ── Main tab bar ────────────────────────────────────────────────── */}
      <div className={cx(styles.filterBar, styles.filterBarBordered)}>
        {(["Active Automations", "Calendar & Schedule", "AI Assistant"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={cx(styles.filterTab, mainTab === tab && styles.filterTabActive)}
            onClick={() => setMainTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1 — ACTIVE AUTOMATIONS                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {mainTab === "Active Automations" ? (
        <>
          {/* Sub-tab bar */}
          <div className={cx(styles.filterBar, styles.subFilterBar)}>
            {(["Automations", "Smart Alerts", "Meeting Notes", "Retainer Forecast"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={cx(styles.filterTab, styles.subFilterTab, autoSubTab === tab && styles.filterTabActive)}
                onClick={() => setAutoSubTab(tab)}
              >
                {tab}
              </button>
            ))}
            <span className={cx(styles.badge, styles.badgeGreen, styles.subFilterBadge)}>
              ● {activeCount} automation{activeCount === 1 ? "" : "s"} running
            </span>
          </div>

          <div className={styles.pageBody}>

            {/* ── Automations grid ─────────────────────────────────────── */}
            {autoSubTab === "Automations" ? (
              <div>
                <div className={styles.sectionTitle}>
                  {automationRows?.length ? "Live Automation Status" : "Active & Paused Automations"}
                </div>
                <div className={cx(styles.autoGrid, styles.autoGridMt)}>
                  {displayAutomations.map((automation, idx) => (
                    <div key={automation.name} className={styles.autoCard}>
                      <div className={cx(styles.autoGlow, automation.glowClass)} />
                      <div className={styles.autoIcon}>{automation.icon}</div>
                      <div className={styles.autoName}>{automation.name}</div>
                      <div className={styles.autoDesc}>{automation.desc}</div>
                      <div className={styles.autoFooter}>
                        <div>
                          <div className={styles.autoRuns}>{automation.runs}</div>
                          {automation.lastEvent ? (
                            <div className={cx(styles.autoRuns, styles.autoRunsDimmed)}>
                              {automation.lastEvent}
                            </div>
                          ) : null}
                          <div
                            className={cx(
                              styles.autoStatus,
                              autoToggles[idx] ? styles.autoStatusActive : styles.autoStatusIdle
                            )}
                          >
                            {autoToggles[idx] ? automation.statusText : "Paused"}
                          </div>
                        </div>
                        {/* Toggle switch */}
                        <button
                          type="button"
                          aria-label={`Toggle ${automation.name}`}
                          onClick={() => toggleAuto(idx)}
                          className={cx(styles.autoToggleBtn, autoToggles[idx] && styles.autoToggleBtnOn)}
                        >
                          <span className={cx(styles.autoToggleKnob, autoToggles[idx] && styles.autoToggleKnobOn)} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ── Smart Alerts ─────────────────────────────────────────── */}
            {autoSubTab === "Smart Alerts" ? (
              <div>
                <div className={styles.sectionTitle}>AI-Generated Alerts</div>
                <div className={styles.alertsList}>
                  {ALERTS.map((alert) => (
                    <div
                      key={alert.title}
                      className={cx(styles.notifRow, styles[alert.toneClass])}
                    >
                      <div className={styles.notifIcon}>{alert.icon}</div>
                      <div className={styles.notifBody}>
                        <div className={styles.notifTitle}>{alert.title}</div>
                        <div className={styles.notifDetail}>{alert.desc}</div>
                        <div className={styles.notifActions}>
                          {alert.actions.map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              className={cx(
                                styles.button,
                                styles.buttonSm,
                                action.primary ? styles.buttonAccent : styles.buttonGhost
                              )}
                              onClick={() => showToast(action.label, alert.title)}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className={styles.notifTime}>{alert.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ── Meeting Notes ─────────────────────────────────────────── */}
            {autoSubTab === "Meeting Notes" ? (
              <div>
                <div className={styles.sectionTitle}>AI-Transcribed Meeting Summaries</div>
                <div className={cx(styles.cols2, styles.cols2Mt)}>
                  {MEETING_NOTES.map((note) => (
                    <div key={note.title} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <div>
                          <div className={styles.cardTitle}>{note.title}</div>
                          <div className={styles.cardSub}>{note.date}</div>
                        </div>
                      </div>
                      <div className={styles.cardBody}>
                        <p className={styles.pageSub}>{note.summary}</p>
                        <div className={styles.noteTagsRow}>
                          {note.tags.map((tag) => (
                            <span key={tag} className={cx(styles.badge, styles.badgeMuted)}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.cardFooter}>
                        <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}>Full Notes</button>
                        <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}>↓ PDF</button>
                        <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}>Attach</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ── Retainer Forecast ────────────────────────────────────── */}
            {autoSubTab === "Retainer Forecast" ? (
              <div>
                <div className={styles.sectionTitle}>
                  {projects?.length ? "Project Budget Burn Rate" : "AI Retainer Burn Rate Forecast"}
                </div>
                <ForecastBlock
                  items={forecastData}
                  isLive={Boolean(projects?.length)}
                  projectCount={projects?.length ?? 0}
                  onTopUp={(label) => showToast("Top Up", label)}
                />
              </div>
            ) : null}

          </div>
        </>
      ) : null}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2 — CALENDAR & SCHEDULE                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {mainTab === "Calendar & Schedule" ? (
        <>
          {/* Sub-tab bar */}
          <div className={cx(styles.filterBar, styles.subFilterBar)}>
            {(["Calendar", "Upcoming", "Team"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={cx(styles.filterTab, styles.subFilterTab, calSubTab === tab && styles.filterTabActive)}
                onClick={() => setCalSubTab(tab)}
              >
                {tab === "Team" ? "Team Profiles" : tab}
              </button>
            ))}
          </div>

          {/* ── Calendar sub-tab ──────────────────────────────────────── */}
          {calSubTab === "Calendar" ? (
            <div className={styles.pageBody}>
              {/* Month navigation */}
              <div className={styles.calMonthNav}>
                <span className={styles.calMonthLabel}>February 2026</span>
                <div className={styles.calNavBtns}>
                  {["‹", "Today", "›"].map((label) => (
                    <button key={label} type="button" className={styles.calNavBtn}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar grid */}
              <div className={styles.calGrid}>
                {CLIENT_SCHEDULING_DAYS.map((day) => (
                  <div key={day} className={styles.calDayHeader}>{day}</div>
                ))}
                {cells.map((cell, index) => (
                  <div
                    key={`${cell.day}-${index}`}
                    className={cx(
                      styles.calCell,
                      !cell.other && cell.day === 21 && styles.calCellToday
                    )}
                  >
                    <div className={cx(styles.calDayNum, cell.other && styles.calDayNumOther)}>
                      {cell.day}
                    </div>
                    {(CLIENT_SCHEDULING_CAL_EVENTS[cell.day] ?? []).map((evt, evtIdx) => (
                      <div
                        key={`${cell.day}-${evtIdx}`}
                        className={cx(styles.calEventPill, CAL_PILL_CLASS[evt.tone])}
                      >
                        {evt.label}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className={cx(styles.sectionTitle, styles.sectionTitleGantt)}>Legend</div>
              <div className={styles.calLegendRow}>
                {(["meeting", "milestone", "deadline", "call"] as const).map((tone) => (
                  <div key={tone} className={styles.calLegendItem}>
                    <div className={cx(styles.calLegendDot, CAL_DOT_CLASS[tone])} />
                    <span className={styles.calLegendLabel}>
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Upcoming sub-tab ──────────────────────────────────────── */}
          {calSubTab === "Upcoming" ? (
            <div className={styles.pageBody}>
              <div className={styles.sectionTitle}>This Week & Ahead</div>
              <div className={styles.upcomingList}>
                {CLIENT_SCHEDULING_UPCOMING.map((event) => (
                  <div
                    key={`${event.day}-${event.title}`}
                    className={cx(styles.card, styles.eventCard)}
                  >
                    {/* Date column */}
                    <div className={styles.eventDateCol}>
                      <div className={styles.eventDayNum}>{event.day}</div>
                      <div className={styles.eventMonthLabel}>{event.month}</div>
                    </div>
                    {/* Icon */}
                    <div className={cx(styles.eventIconBox, ICON_BOX_CLASS[event.iconTone])}>
                      {event.icon}
                    </div>
                    {/* Body */}
                    <div className={styles.eventBody}>
                      <div className={styles.eventTitle}>{event.title}</div>
                      <div className={cx(styles.itemMeta, styles.eventMetaRow)}>{event.meta}</div>
                      <div className={styles.eventTagsRow}>
                        {event.tags.map((tag) => (
                          <span key={`${event.title}-${tag.label}`} className={cx(styles.badge, TAG_CLASS[tag.tone])}>
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className={styles.eventActionsCol}>
                      {event.actions.map((action) => (
                        <button
                          key={`${event.title}-${action.label}`}
                          type="button"
                          className={cx(
                            styles.button,
                            styles.buttonSm,
                            action.variant === "primary" ? styles.buttonAccent
                              : action.variant === "join"  ? styles.buttonPurple
                              : styles.buttonGhost
                          )}
                          onClick={() => showToast(action.label, event.title)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Team Profiles sub-tab ─────────────────────────────────── */}
          {calSubTab === "Team" ? (
            <div className={styles.pageBody}>
              <div className={styles.sectionTitle}>Your Project Team</div>
              <div className={styles.teamGrid}>
                {CLIENT_SCHEDULING_TEAM.map((member) => (
                  <div key={member.name} className={styles.teamCard}>
                    <div className={cx(styles.teamAvatar, AVATAR_CLASS[member.avatarTone])}>
                      {member.avatar}
                    </div>
                    <div className={styles.teamName}>{member.name}</div>
                    <div className={styles.teamRole}>{member.role}</div>
                    <div className={styles.teamSpecialties}>
                      {member.skills.map((skill) => (
                        <span key={`${member.name}-${skill}`} className={styles.teamSpecialty}>{skill}</span>
                      ))}
                    </div>
                    <div className={styles.memberStatusRow}>
                      <div className={cx(
                        styles.memberStatusDot,
                        member.online ? styles.memberStatusDotOnline : styles.memberStatusDotOffline
                      )} />
                      {member.online ? "Online now" : "Offline"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3 — AI ASSISTANT                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {mainTab === "AI Assistant" ? (
        <div className={styles.pageBody}>
          <div className={styles.chatLayout}>
            <div className={styles.chatPanel}>
              <div className={styles.chatHead}>
                <div className={styles.aiAvatar}>AI</div>
                <div className={styles.chatHeadTitle}>Maphari AI</div>
                <div className={styles.chatHeadOnline}>Online · Knows your projects</div>
              </div>
              <div className={styles.chatBody} ref={chatRef}>
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cx(styles.chatMsg, msg.role === "user" && styles.chatMsgUser)}
                  >
                    {msg.role === "ai" ? (
                      <div className={cx(styles.aiAvatar, styles.aiAvatarSm)}>AI</div>
                    ) : null}
                    <div
                      className={cx(
                        styles.chatBubble,
                        msg.role === "ai" ? styles.chatBubbleAi : styles.chatBubbleUser
                      )}
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />
                  </div>
                ))}
                {isTyping ? (
                  <div className={styles.chatMsg}>
                    <div className={cx(styles.aiAvatar, styles.aiAvatarSm)}>AI</div>
                    <div className={cx(styles.chatBubble, styles.chatBubbleAi)}>
                      <div className={styles.chatTyping}>
                        <div className={styles.typingDot} />
                        <div className={styles.typingDot} />
                        <div className={styles.typingDot} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className={styles.chatInputRow}>
                <input
                  className={styles.chatInput}
                  placeholder="Ask anything about your projects…"
                  title="Chat with Maphari AI"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                />
                <button className={styles.chatSend} type="button" onClick={() => sendChat()}>→</button>
              </div>
            </div>

            <div className={styles.quickQuestions}>
              <div className={styles.qqTitle}>Quick Questions</div>
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} type="button" className={styles.qqBtn} onClick={() => sendChat(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Budget forecasting section below chat */}
          <div className={styles.aiForecastSection}>
            <div className={styles.sectionTitle}>
              {projects?.length ? "Project Budget Burn Rate" : "AI Retainer Burn Rate Forecast"}
            </div>
            <ForecastBlock
              items={forecastData}
              isLive={Boolean(projects?.length)}
              projectCount={projects?.length ?? 0}
              onTopUp={(label) => showToast("Top Up", label)}
            />
          </div>
        </div>
      ) : null}

      {/* ── Book a Call modal ─────────────────────────────────────────── */}
      {bookModal ? (
        <div className={styles.overlay} onClick={() => setBookModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Book a Call</span>
              <button type="button" className={styles.modalClose} onClick={() => setBookModal(false)}>✕</button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Meeting Type</label>
                <div className={styles.formChipGrid2}>
                  {["Check-in Call", "Project Review", "Strategy Session", "Urgent Support"].map((type) => (
                    <button key={type} type="button" className={styles.formChipBtn}>{type}</button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Preferred Date</label>
                <input className={styles.formInput} type="date" defaultValue="2026-02-26" title="Preferred date for the meeting" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Duration</label>
                <div className={styles.formChipGrid4}>
                  {CLIENT_SCHEDULING_DURATIONS.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      className={cx(
                        styles.formChipBtnMuted,
                        selectedDuration === dur && styles.formChipBtnSelected
                      )}
                      onClick={() => setSelectedDuration(dur)}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Available Slots</label>
                <div className={styles.formChipGrid4}>
                  {CLIENT_SCHEDULING_TIMES.map((time) => {
                    const unavailable = UNAVAILABLE_SLOTS.has(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        className={cx(
                          styles.formChipBtnMuted,
                          selectedTime === time && styles.formChipBtnSelected,
                          unavailable && styles.formChipBtnUnavailable
                        )}
                        onClick={() => { if (!unavailable) setSelectedTime(time); }}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Meeting Platform</label>
                <div className={styles.formChipGrid3}>
                  {["Google Meet", "Zoom", "MS Teams"].map((platform) => (
                    <button key={platform} type="button" className={styles.formChipBtnMuted}>{platform}</button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Agenda / Notes</label>
                <textarea className={styles.formTextarea} rows={3} placeholder="What would you like to discuss?" />
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={cx(styles.button, styles.buttonGhost)} onClick={() => setBookModal(false)}>
                  Cancel
                </button>
                <button type="button" className={cx(styles.button, styles.buttonAccent)} onClick={handleBook}>
                  Confirm Booking →
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast ? (
        <div className={styles.toast}>
          <div className={styles.toastIcon}>✓</div>
          <div>
            <div className={styles.toastText}>{toast.text}</div>
            <div className={styles.toastSub}>{toast.sub}</div>
          </div>
        </div>
      ) : null}

    </section>
  );
}
