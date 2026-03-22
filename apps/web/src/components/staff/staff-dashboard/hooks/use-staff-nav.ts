// ════════════════════════════════════════════════════════════════════════════
// use-staff-nav.ts — Navigation section builder for the staff dashboard
// Inputs  : badge counts (tasks, threads, notifications, blockers, milestones)
// Outputs : allNavSections (all 79 pages), navSections (primary sidebar subset)
// ════════════════════════════════════════════════════════════════════════════

"use client";

// ── Imports ──────────────────────────────────────────────────────────────────
import { useMemo } from "react";
import type { NavItem, PageId } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface UseStaffNavInput {
  openTasksCount: number;
  openConversationsCount: number;
  overdueDeliverables: number;
  openBlockersCount: number;
  totalUnreadNotifications: number;
  pendingApprovalsCount: number;
  unreadByTab: {
    dashboard: number;
    messages: number;
    operations: number;
    projects: number;
    settings: number;
  };
}

export interface UseStaffNavResult {
  /** All 79 pages grouped by section — used by command search + secondary drawer */
  allNavSections: Array<[string, NavItem[]]>;
  /** Primary sidebar subset (key pages only) */
  navSections: Array<[string, NavItem[]]>;
}

// ── Primary sidebar page set ──────────────────────────────────────────────────
// Pages shown in the main sidebar; all others accessible via command search
// or the secondary "All pages" drawer.
const PRIMARY_SIDEBAR_IDS = new Set<PageId>([
  // Workspace
  "dashboard",
  "notifications",
  "tasks",
  "kanban",
  // Client Work
  "clients",
  "appointments",
  "deliverables",
  "signoff",
  "retainer",
  "health",
  "meetingprep",
  "comms",
  // Tracking
  "standup",
  "timelog",
  "performance",
  "mygoals",
  // Workflow
  "approvalqueue",
  // Project Management
  "myportfolio",
  // Client Lifecycle
  "clientteam",
  "deliverystatus",
  // Governance
  "myteam",
  "myrisks",
  "systemstatus",
  "incidentalerts",
  // Analytics
  "myanalytics",
  "myreports",
  "teamperformance",
  "workloadheatmap",
  // Settings
  "myintegrations",
  // Account
  "settings",
]);

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useStaffNav({
  openTasksCount,
  openConversationsCount,
  overdueDeliverables,
  openBlockersCount,
  totalUnreadNotifications,
  pendingApprovalsCount,
  unreadByTab,
}: UseStaffNavInput): UseStaffNavResult {

  // ── All pages (flat → sectioned) ────────────────────────────────────────────
  const allNavSections = useMemo((): Array<[string, NavItem[]]> => {
    const items: NavItem[] = [
      // ── Workspace ─────────────────────────────────────────────────────────
      {
        id: "dashboard",
        label: "My Dashboard",
        section: "Workspace",
        badge: unreadByTab.dashboard > 0 ? { value: String(unreadByTab.dashboard), tone: "blue" } : undefined
      },
      {
        id: "notifications",
        label: "Notifications",
        section: "Workspace",
        badge: totalUnreadNotifications > 0 ? { value: String(totalUnreadNotifications), tone: "amber" } : undefined
      },
      {
        id: "tasks",
        label: "My Tasks",
        section: "Workspace",
        badge: Math.max(openTasksCount, unreadByTab.operations) > 0
          ? { value: String(Math.max(openTasksCount, unreadByTab.operations)), tone: "blue" }
          : undefined
      },
      {
        id: "kanban",
        label: "Kanban Board",
        section: "Workspace",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },

      // ── Client Work ───────────────────────────────────────────────────────
      {
        id: "clients",
        label: "Client Threads",
        section: "Client Work",
        badge: Math.max(openConversationsCount, unreadByTab.messages) > 0
          ? { value: String(Math.max(openConversationsCount, unreadByTab.messages)), tone: "amber" }
          : undefined
      },
      {
        id: "appointments",
        label: "Appointments",
        section: "Client Work",
      },
      {
        id: "meetingprep",
        label: "Meeting Prep",
        section: "Client Work",
        badge: unreadByTab.messages > 0 ? { value: String(unreadByTab.messages), tone: "amber" } : undefined
      },
      {
        id: "comms",
        label: "Communication History",
        section: "Client Work",
        badge: unreadByTab.messages > 0 ? { value: String(unreadByTab.messages), tone: "amber" } : undefined
      },
      {
        id: "onboarding",
        label: "Client Onboarding",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "health",
        label: "Client Health",
        section: "Client Work",
        badge: Math.max(openBlockersCount, overdueDeliverables) > 0
          ? { value: String(Math.max(openBlockersCount, overdueDeliverables)), tone: "red" }
          : undefined
      },
      {
        id: "response",
        label: "Response Time",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "sentiment",
        label: "Sentiment Flags",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "lasttouched",
        label: "Last Touched",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "portal",
        label: "Portal Activity",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "smartsuggestions",
        label: "Smart Suggestions",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "satisfactionscores",
        label: "Client Health",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "signoff",
        label: "Milestone Sign-off",
        section: "Client Work",
        badge: Math.max(overdueDeliverables, unreadByTab.projects) > 0
          ? { value: String(Math.max(overdueDeliverables, unreadByTab.projects)), tone: "red" }
          : undefined
      },
      {
        id: "retainer",
        label: "Retainer Burn",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "context",
        label: "Project Context",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },

      // ── Tracking ──────────────────────────────────────────────────────────
      {
        id: "standup",
        label: "Daily Standup",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "timelog",
        label: "Time Log",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "deliverables",
        label: "Deliverables",
        section: "Client Work",
        badge: Math.max(overdueDeliverables, unreadByTab.projects, openBlockersCount) > 0
          ? { value: String(Math.max(overdueDeliverables, unreadByTab.projects, openBlockersCount)), tone: "red" }
          : undefined
      },
      {
        id: "sprintplanning",
        label: "Sprint Planning",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "taskdependencies",
        label: "Task Dependencies",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "recurringtasks",
        label: "Recurring Tasks",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "focusmode",
        label: "Focus Mode",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "peerrequests",
        label: "Peer Requests",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "triggerlog",
        label: "Trigger Log",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "amber" } : undefined
      },
      {
        id: "privatenotes",
        label: "Private Notes",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "keyboardshortcuts",
        label: "Keyboard Shortcuts",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "estimatesactuals",
        label: "Estimates vs Actuals",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "knowledge",
        label: "Knowledge Base",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "decisionlog",
        label: "Decision Log",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "handoverchecklist",
        label: "Handover Checklist",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "closeoutreport",
        label: "Close-out Report",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "staffhandovers",
        label: "Staff Handovers",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "performance",
        label: "My Performance",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "eodwrap",
        label: "End-of-day Wrap",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "automations",
        label: "Automations",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "amber" } : undefined
      },

      // ── Automations ───────────────────────────────────────────────────────
      {
        id: "autodraft",
        label: "Auto-draft Updates",
        section: "Automations",
        badge: unreadByTab.messages > 0 ? { value: String(unreadByTab.messages), tone: "amber" } : undefined
      },

      // ── Client Finance ────────────────────────────────────────────────────
      { id: "invoiceviewer",  label: "Invoice Viewer",     section: "Client Finance"   },
      { id: "projectbudget",  label: "Project Budget",     section: "Client Finance"   },
      { id: "clientbudget",   label: "Client Budget",      section: "Client Finance"   },
      { id: "expensesubmit",  label: "Expense Submission", section: "Client Finance"   },
      { id: "ratecard",       label: "Rate Card",          section: "Client Finance"   },
      { id: "vendordirectory",label: "Vendor Directory",   section: "Client Finance"   },

      // ── Personal Finance ──────────────────────────────────────────────────
      { id: "paystub", label: "Pay Stubs", section: "Personal Finance" },

      // ── Project Management ────────────────────────────────────────────────
      { id: "myportfolio", label: "My Portfolio", section: "Project Management" },
      { id: "mycapacity",  label: "My Capacity",  section: "Project Management" },
      { id: "mytimeline",  label: "My Timeline",  section: "Project Management" },

      // ── Quality ───────────────────────────────────────────────────────────
      { id: "qachecklist", label: "QA Checklist", section: "Quality" },

      // ── Workflow ──────────────────────────────────────────────────────────
      {
        id: "approvalqueue",
        label: "Approval Queue",
        section: "Workflow",
        badge: pendingApprovalsCount > 0 ? { value: String(pendingApprovalsCount), tone: "red" } : undefined,
      },

      // ── Client Intelligence ───────────────────────────────────────────────
      { id: "clienthealthsummary", label: "Health Summary",  section: "Client Intelligence" },
      { id: "feedbackinbox",       label: "Feedback Inbox",  section: "Client Intelligence" },

      // ── HR ────────────────────────────────────────────────────────────────
      { id: "myonboarding", label: "My Onboarding",        section: "HR" },
      { id: "myleave",      label: "My Leave",             section: "HR" },
      { id: "mylearning",   label: "My Learning",          section: "HR" },
      { id: "myenps",       label: "My Feedback (eNPS)",   section: "HR" },
      { id: "myemployment", label: "My Employment",        section: "HR" },

      // ── Knowledge ─────────────────────────────────────────────────────────
      { id: "brandkit",        label: "Brand Kit",          section: "Knowledge" },
      { id: "contractviewer",  label: "Contract Viewer",    section: "Knowledge" },
      { id: "servicecatalog",  label: "Service Catalog",    section: "Knowledge" },
      { id: "projectdocuments",label: "Project Documents",  section: "Knowledge" },

      // ── Client Lifecycle ──────────────────────────────────────────────────
      { id: "changeRequests",      label: "Change Requests",      section: "Client Lifecycle" },
      { id: "slaTracker",          label: "SLA Tracker",          section: "Client Lifecycle" },
      { id: "requestviewer",       label: "Request Viewer",       section: "Client Lifecycle" },
      { id: "clientjourney",       label: "Client Journey",       section: "Client Lifecycle" },
      { id: "offboardingtasks",    label: "Offboarding Tasks",    section: "Client Lifecycle" },
      { id: "interventionactions", label: "Intervention Actions", section: "Client Lifecycle" },
      { id: "clientteam",          label: "Client Team",          section: "Client Lifecycle" },
      { id: "deliverystatus",      label: "Delivery Status",      section: "Client Lifecycle" },

      // ── Governance ────────────────────────────────────────────────────────
      { id: "myteam",        label: "My Team",       section: "Governance" },
      { id: "myrisks",       label: "My Risks",      section: "Governance" },
      { id: "systemstatus",  label: "System Status", section: "Governance" },
      { id: "incidentalerts",label: "Incident Alerts",section: "Governance" },

      // ── Analytics ─────────────────────────────────────────────────────────
      { id: "myanalytics",      label: "My Analytics",        section: "Analytics" },
      { id: "myreports",        label: "My Reports",          section: "Analytics" },
      { id: "teamperformance",  label: "Team Performance",    section: "Analytics" },
      { id: "workloadheatmap",  label: "Workload Heatmap",    section: "Analytics" },

      // ── Personal Growth ────────────────────────────────────────────────────
      { id: "mygoals",          label: "My Goals & OKRs",     section: "Personal Growth" },

      // ── HR ────────────────────────────────────────────────────────────────
      { id: "peerreview",       label: "Peer Reviews",         section: "HR" },

      // ── Settings ──────────────────────────────────────────────────────────
      { id: "myintegrations", label: "My Integrations", section: "Settings" },

      // ── Account ───────────────────────────────────────────────────────────
      {
        id: "settings",
        label: "Settings",
        section: "Account",
        badge: unreadByTab.settings > 0 ? { value: String(unreadByTab.settings), tone: "amber" } : undefined
      },
    ];

    // Group flat list into ordered section map
    const sections = new Map<string, NavItem[]>();
    for (const item of items) {
      if (!sections.has(item.section)) sections.set(item.section, []);
      sections.get(item.section)!.push(item);
    }
    return Array.from(sections.entries());
  }, [
    openTasksCount,
    openConversationsCount,
    overdueDeliverables,
    openBlockersCount,
    totalUnreadNotifications,
    pendingApprovalsCount,
    unreadByTab,
  ]);

  // ── Primary sidebar (filtered subset) ────────────────────────────────────
  const navSections = useMemo(
    () =>
      allNavSections
        .map(
          ([section, items]) =>
            [section, items.filter((item) => PRIMARY_SIDEBAR_IDS.has(item.id))] as [string, NavItem[]]
        )
        .filter(([, items]) => items.length > 0),
    [allNavSections]
  );

  return { allNavSections, navSections };
}
