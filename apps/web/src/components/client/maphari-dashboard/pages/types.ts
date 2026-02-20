export type ProjectRow = {
  id: string;
  name: string;
  subtitle: string;
  status: string;
  statusTone: string;
  progress: number;
  progressTone: string;
  due: string;
  dueTone: string;
};

export type MilestoneRow = {
  id: string;
  title: string;
  date: string;
  status: "" | "done" | "now";
  highlight: boolean;
  fileName: string | null;
  approval: "PENDING" | "APPROVED" | "REJECTED";
};

export type InvoiceSummaryRow = {
  id: string;
  sourceId: string;
  issued: string;
  amount: string;
  amountTone?: string;
  badge: { label: string; tone: "amber" | "red" | "green" };
  action: { label: string; tone: "accent" | "ghost" };
};

export type ProjectInvoiceRow = {
  id: string;
  sourceId: string;
  status: string;
  project: string;
  issued: string;
  due: string;
  dueTone: string;
  amount: string;
  amountTone: string;
  badge: { label: string; tone: "amber" | "red" | "green" };
  action: { label: string; tone: "accent" | "ghost" };
};

export type ProjectCard = {
  id: string;
  name: string;
  status: string;
  statusTone: string;
  progressTone: string;
  progressPercent: number;
  dueAt?: string | null;
  description?: string | null;
  priority: string;
  ownerName?: string | null;
  budgetCents: number;
  collaborators: Array<{
    name: string;
    role: string;
    activeSessions: number;
    taskCount: number;
  }>;
  activeSessions: number;
  milestones: Array<{
    id: string;
    title: string;
    status: string;
  }>;
};

export type InvoiceTab = {
  id: "all" | "outstanding" | "paid";
  label: string;
};
