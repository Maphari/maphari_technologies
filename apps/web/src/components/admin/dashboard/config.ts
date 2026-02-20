export type PageId =
  | "dashboard"
  | "leads"
  | "clients"
  | "projects"
  | "invoices"
  | "messages"
  | "notifications"
  | "staff"
  | "automation"
  | "integrations"
  | "analytics"
  | "reports"
  | "security"
  | "audit"
  | "experience"
  | "settings";

export type Toast = {
  id: number;
  tone: "success" | "error";
  message: string;
};

export type NavItem = {
  id: PageId;
  label: string;
  section: string;
  badgeRed?: boolean;
};

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", section: "Overview" },
  { id: "leads", label: "Leads", section: "Operations" },
  { id: "clients", label: "Clients", section: "Operations", badgeRed: true },
  { id: "experience", label: "Client Experience", section: "Experience" },
  { id: "projects", label: "Projects", section: "Operations" },
  { id: "invoices", label: "Billing", section: "Finance" },
  { id: "messages", label: "Messages", section: "Communication" },
  { id: "notifications", label: "Notifications", section: "Communication" },
  { id: "staff", label: "Staff", section: "Communication" },
  { id: "automation", label: "Automation", section: "Automation" },
  { id: "integrations", label: "Integrations", section: "Automation" },
  { id: "analytics", label: "Analytics", section: "Governance" },
  { id: "reports", label: "Reports", section: "Governance" },
  { id: "security", label: "Security", section: "Governance" },
  { id: "audit", label: "Audit Log", section: "Governance" },
  { id: "settings", label: "Settings", section: "Governance" }
];

export const pageTitles: Record<PageId, [string, string]> = {
  dashboard: ["Overview", "Dashboard"],
  leads: ["Operations", "Leads"],
  clients: ["Operations", "Clients"],
  projects: ["Projects", "All Projects"],
  invoices: ["Finance", "Billing"],
  messages: ["Communication", "Messages"],
  notifications: ["Communication", "Notifications"],
  staff: ["Communication", "Staff Access"],
  automation: ["Automation", "Workflows"],
  integrations: ["Automation", "Integrations"],
  analytics: ["Governance", "Analytics"],
  reports: ["Governance", "Reports"],
  security: ["Governance", "Security"],
  audit: ["Governance", "Audit Log"],
  experience: ["Experience", "Client Journey"],
  settings: ["Account", "Settings"]
};
