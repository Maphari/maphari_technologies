export type DashboardNotificationTab = "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";

export const DASHBOARD_NOTIFICATION_TABS: DashboardNotificationTab[] = [
  "dashboard",
  "projects",
  "invoices",
  "messages",
  "settings",
  "operations"
];

export type DashboardNotificationJobLite = {
  id: string;
  status: string;
  tab: DashboardNotificationTab;
  readAt: string | null;
  channel?: string | null;
  subject?: string | null;
  message?: string | null;
  recipient?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, string | number | boolean>;
  createdAt?: string;
  updatedAt?: string;
};
