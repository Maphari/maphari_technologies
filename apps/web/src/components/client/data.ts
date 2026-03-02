export type ProjectRow = {
  name: string;
  category: string;
  status: string;
  statusTone: string;
  progress: number;
  due: string;
  client: string;
  budget: string;
  dueTone?: string;
  avatars: Array<{ label: string; bg: string; color: string }>;
};

export type InvoiceRow = {
  id: string;
  client: string;
  project: string;
  issued: string;
  due: string;
  amount: string;
  badgeTone: string;
  badgeLabel: string;
  actionLabel: string;
  actionStyle: "btn-sm-accent" | "btn-sm-ghost";
  statusColor?: string;
};

export type MessageThread = {
  id: string;
  sender: string;
  project: string;
  time: string;
  preview: string;
  unread?: boolean;
  tagColor?: string;
  messages: Array<{ from: "them" | "you"; text: string; time: string }>;
};

export const clientStats = [
  { label: "Active Projects 🟢", value: "3", delta: "↑ 1 this month", tone: "green" },
  { label: "Milestones Done", value: "8", delta: "↑ 3 this week", tone: "purple" },
  { label: "Pending Invoices", value: "2", delta: "R 34,500 outstanding", tone: "amber" },
  { label: "Messages", value: "3", delta: "↑ unread", tone: "" }
];

export const projectRows: ProjectRow[] = [
  {
    name: "Lead Pipeline Rebuild",
    category: "Web App",
    status: "In Progress",
    statusTone: "badge-green",
    progress: 72,
    due: "Mar 14, 2026",
    client: "Nexus Logistics",
    budget: "R 68,000",
    avatars: [
      { label: "JM", bg: "var(--accent)", color: "#050508" },
      { label: "TK", bg: "var(--blue)", color: "#fff" },
      { label: "LN", bg: "var(--amber)", color: "#050508" }
    ]
  },
  {
    name: "Client Portal v2",
    category: "Platform",
    status: "Review",
    statusTone: "badge-amber",
    progress: 88,
    due: "Feb 28, 2026",
    client: "Nexus Logistics",
    budget: "R 44,000",
    dueTone: "var(--amber)",
    avatars: [
      { label: "JM", bg: "var(--accent)", color: "#050508" },
      { label: "LN", bg: "var(--amber)", color: "#050508" }
    ]
  },
  {
    name: "Automation Suite",
    category: "Integration",
    status: "Scoping",
    statusTone: "badge-purple",
    progress: 18,
    due: "Apr 30, 2026",
    client: "Nexus Logistics",
    budget: "R 32,000",
    avatars: [{ label: "TK", bg: "var(--blue)", color: "#fff" }]
  }
];

export const invoiceRows: InvoiceRow[] = [
  {
    id: "INV-2026-014",
    client: "Nexus Logistics",
    project: "Lead Pipeline Rebuild",
    issued: "Feb 01, 2026",
    due: "Feb 20, 2026",
    amount: "R 18,500",
    badgeTone: "badge-amber",
    badgeLabel: "Due Soon",
    actionLabel: "Pay Now",
    actionStyle: "btn-sm-accent",
    statusColor: "var(--amber)"
  },
  {
    id: "INV-2026-011",
    client: "Nexus Logistics",
    project: "Client Portal v2",
    issued: "Jan 15, 2026",
    due: "Feb 03, 2026",
    amount: "R 16,000",
    badgeTone: "badge-red",
    badgeLabel: "Overdue",
    actionLabel: "Pay Now",
    actionStyle: "btn-sm-accent",
    statusColor: "var(--red)"
  },
  {
    id: "INV-2026-008",
    client: "Veldt Finance",
    project: "Risk Dashboard",
    issued: "Jan 01, 2026",
    due: "Jan 20, 2026",
    amount: "R 22,000",
    badgeTone: "badge-green",
    badgeLabel: "Paid",
    actionLabel: "Download",
    actionStyle: "btn-sm-ghost"
  },
  {
    id: "INV-2025-044",
    client: "Savanna Tech",
    project: "HubSpot Integration",
    issued: "Dec 01, 2025",
    due: "Dec 21, 2025",
    amount: "R 12,000",
    badgeTone: "badge-green",
    badgeLabel: "Paid",
    actionLabel: "Download",
    actionStyle: "btn-sm-ghost"
  }
];

export const milestoneItems = [
  { title: "Design sign-off", date: "Completed Feb 10", status: "done" },
  { title: "Backend API delivery", date: "Completed Feb 15", status: "done" },
  { title: "UAT & Feedback", date: "Due Feb 22", status: "active" },
  { title: "Production launch", date: "Target Mar 14", status: "" }
];

export const messageThreads: MessageThread[] = [
  {
    id: "lead",
    sender: "James M. · Maphari",
    project: "Lead Pipeline Rebuild",
    time: "2h ago",
    preview: "UAT checklist is ready — please review and sign off on items 1–7 before Friday.",
    unread: true,
    tagColor: "var(--accent)",
    messages: [
      {
        from: "them",
        text: "The backend API is fully deployed to staging. All endpoints are documented in Notion. Can you run through the happy path and let us know if anything feels off before we move to load testing?",
        time: "Feb 15, 14:32"
      },
      {
        from: "you",
        text: "Tested the flow — looks great. One thing: the confirmation email isn't triggering after checkout. Everything else is smooth!",
        time: "Feb 15, 15:10"
      },
      {
        from: "them",
        text: "Good catch — it's a Sendgrid webhook issue. Fix is deployed. UAT checklist is ready for your sign-off. Please review items 1–7 before Friday so we can move to production. 🎯",
        time: "2h ago"
      }
    ]
  },
  {
    id: "portal",
    sender: "Thabo K.",
    project: "Client Portal v2",
    time: "Yesterday",
    preview: "Stripe integration is live on staging.",
    unread: true,
    tagColor: "var(--blue)",
    messages: []
  },
  {
    id: "design",
    sender: "Lerato N.",
    project: "Automation Suite",
    time: "Feb 15",
    preview: "Updated screens exported to Figma.",
    unread: true,
    tagColor: "var(--amber)",
    messages: []
  },
  {
    id: "general",
    sender: "General",
    project: "All Projects",
    time: "Feb 12",
    preview: "Q1 kickoff notes attached to this thread.",
    messages: []
  }
];

export const activityFeed = [
  { color: "var(--accent)", text: "INV-2026-014 marked as sent to Nexus Logistics", time: "15 min ago" },
  { color: "var(--blue)", text: "Client Portal v2 moved to Review stage", time: "2h ago" },
  { color: "var(--amber)", text: "Savanna Tech invoice overdue — 14 days", time: "Today, 09:00" },
  { color: "var(--accent)", text: "Veldt Finance paid INV-2026-012 (R 28,000)", time: "Yesterday" },
  { color: "var(--muted2)", text: "New project scoped for Birchwood Media", time: "Feb 15" }
];
