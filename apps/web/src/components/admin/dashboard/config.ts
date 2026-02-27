export type PageId =
  | "executive"
  | "dashboard"
  | "leads"
  | "clients"
  | "projects"
  | "invoices"
  | "revops"
  | "revenueForecasting"
  | "profitability"
  | "projectProfitability"
  | "cashflow"
  | "fyCloseout"
  | "expenses"
  | "payroll"
  | "pricing"
  | "vendors"
  | "team"
  | "platform"
  | "brand"
  | "bizdev"
  | "owner"
  | "market"
  | "portfolio"
  | "resources"
  | "gantt"
  | "qa"
  | "sla"
  | "offboarding"
  | "onboarding"
  | "satisfaction"
  | "comms"
  | "vault"
  | "referrals"
  | "interventions"
  | "crisis"
  | "performance"
  | "teamPerformanceReport"
  | "portfolioRiskRegister"
  | "legal"
  | "intelligence"
  | "healthScorecard"
  | "access"
  | "messages"
  | "notifications"
  | "staff"
  | "staffOnboarding"
  | "leaveAbsence"
  | "recruitment"
  | "learningDev"
  | "staffSatisfaction"
  | "employmentRecords"
  | "automation"
  | "integrations"
  | "analytics"
  | "reports"
  | "audit"
  | "experience"
  | "settings";

// ─── Re-exports for backward compatibility ───
export type { Toast } from "./types";
export { pageTitles } from "./constants";

export type NavItem = {
  id: PageId;
  label: string;
  section: string;
  badgeRed?: boolean;
};

export const navItems: NavItem[] = [
  { id: "executive", label: "Executive Dashboard", section: "Operations" },
  { id: "dashboard", label: "Business Development", section: "Operations" },
  { id: "leads", label: "Leads", section: "Operations" },
  { id: "clients", label: "Client Management", section: "Operations", badgeRed: true },
  { id: "projects", label: "Project Operations", section: "Operations" },
  { id: "portfolio", label: "Project Portfolio", section: "Operations" },
  { id: "resources", label: "Resource Allocation", section: "Operations" },
  { id: "gantt", label: "Timeline & Gantt", section: "Operations" },
  { id: "qa", label: "Quality Assurance", section: "Operations" },
  { id: "sla", label: "SLA Tracker", section: "Operations" },
  { id: "experience", label: "Client Journey", section: "Experience" },
  { id: "onboarding", label: "Client Onboarding", section: "Experience" },
  { id: "offboarding", label: "Client Offboarding", section: "Experience" },
  { id: "satisfaction", label: "Client Satisfaction", section: "Experience" },
  { id: "comms", label: "Communication Audit", section: "Experience" },
  { id: "vault", label: "Document Vault", section: "Experience" },
  { id: "referrals", label: "Referral Tracking", section: "Experience" },
  { id: "interventions", label: "Health Interventions", section: "Experience" },
  { id: "invoices", label: "Billing", section: "Finance" },
  { id: "revops", label: "RevOps", section: "Finance" },
  { id: "revenueForecasting", label: "Revenue Forecasting", section: "Finance" },
  { id: "profitability", label: "Profitability per Client", section: "Finance" },
  { id: "projectProfitability", label: "Profitability per Project", section: "Finance" },
  { id: "cashflow", label: "Cash Flow Calendar", section: "Finance" },
  { id: "fyCloseout", label: "Financial Year Closeout", section: "Finance" },
  { id: "expenses", label: "Expense Tracker", section: "Finance" },
  { id: "payroll", label: "Payroll Ledger", section: "Finance" },
  { id: "pricing", label: "Pricing", section: "Finance" },
  { id: "vendors", label: "Vendor Costs", section: "Finance" },
  { id: "messages", label: "Messages", section: "Communication" },
  { id: "notifications", label: "Notifications", section: "Communication" },
  { id: "staff", label: "Staff Access", section: "Communication" },
  { id: "staffOnboarding", label: "Staff Onboarding", section: "Communication" },
  { id: "leaveAbsence", label: "Leave & Absence", section: "Communication" },
  { id: "recruitment", label: "Recruitment Pipeline", section: "Communication" },
  { id: "learningDev", label: "Learning & Development", section: "Communication" },
  { id: "staffSatisfaction", label: "Staff Satisfaction", section: "Communication" },
  { id: "employmentRecords", label: "Employment Records", section: "Communication" },
  { id: "automation", label: "Workflows", section: "Automation" },
  { id: "integrations", label: "Integrations", section: "Automation" },
  { id: "owner", label: "Owner Workspace", section: "Governance" },
  { id: "team", label: "Team Structure", section: "Governance" },
  { id: "brand", label: "Brand Control", section: "Governance" },
  { id: "market", label: "Market Intel", section: "Governance" },
  { id: "intelligence", label: "Intelligence", section: "Governance" },
  { id: "healthScorecard", label: "Client Health Scorecard", section: "Governance" },
  { id: "platform", label: "Platform", section: "Governance" },
  { id: "performance", label: "Performance Overview", section: "Governance" },
  { id: "teamPerformanceReport", label: "Team Performance Report", section: "Governance" },
  { id: "portfolioRiskRegister", label: "Portfolio Risk Register", section: "Governance" },
  { id: "legal", label: "Legal", section: "Governance" },
  { id: "crisis", label: "Crisis Command", section: "Governance" },
  { id: "analytics", label: "Analytics", section: "Governance" },
  { id: "reports", label: "Reports", section: "Governance" },
  { id: "access", label: "Access Control", section: "Governance" },
  { id: "audit", label: "Audit Log", section: "Governance" },
  { id: "settings", label: "Settings", section: "Governance" }
];

