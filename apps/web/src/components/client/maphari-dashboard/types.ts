export type PageId = "dashboard" | "projects" | "create" | "docs" | "invoices" | "messages" | "automations" | "settings";

export type NavItem = {
  id: PageId;
  label: string;
  section: string;
  badge?: { value: string; tone?: "amber" | "red" };
};

export type Thread = {
  id: string;
  sender: string;
  project: string;
  time: string;
  preview: string;
  avatar: { label: string; bg: string; color: string; bordered?: boolean };
  unread?: boolean;
};

export type DashboardStat = {
  label: string;
  value: string;
  delta: string;
  tone: string;
  deltaTone?: string;
};

export type ActionItem = {
  id: string;
  title: string;
  meta: string;
  tone: "accent" | "amber" | "red" | "purple";
};

export type ActionCenterItem = {
  id: string;
  label: string;
  value: number;
  detail: string;
  tone: "accent" | "amber" | "red" | "purple";
  target: "projects" | "invoices" | "messages";
};

export type RiskItem = {
  id: string;
  title: string;
  meta: string;
  tone: "red" | "amber";
};

export type ActivityItem = {
  id: string;
  icon: string;
  title: string;
  detail: string;
  time: string;
  tone: "accent" | "purple" | "amber" | "red" | "muted";
  timestamp: number;
};

export type TimelineItem = {
  id: string;
  title: string;
  meta: string;
  dateLabel: string;
  tone: "accent" | "amber" | "purple" | "muted";
  timestamp: number;
};

export type ThreadPreview = Thread;

export type OnboardingChecklistItem = {
  id: string;
  label: string;
  status: "done" | "pending";
  detail: string;
};

export type LoginDigestItem = {
  id: string;
  change: string;
  impact: string;
  action: string;
  time: string;
};

export type ApprovalQueueItem = {
  id: string;
  title: string;
  detail: string;
  priority: "high" | "normal";
};

export type DecisionLogItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

export type ConfidenceSummary = {
  score: number;
  tone: "accent" | "amber" | "red";
  label: "On Track" | "Needs Attention" | "At Risk";
  reasons: string[];
  nextActions: string[];
};
