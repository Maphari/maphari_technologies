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
  | "knowledgeBaseAdmin"
  | "decisionRegistry"
  | "handoverManagement"
  | "closeoutReview"
  | "staffTransitionPlanner"
  | "serviceCatalogManager"
  | "requestInbox"
  | "changeRequestManager"
  | "supportQueue"
  | "lifecycleDashboard"
  | "stakeholderDirectory"
  | "aiActionRecommendations"
  | "updateQueueManager"
  | "standupFeed"
  | "eodDigest"
  | "peerReviewQueue"
  | "automationAuditTrail"
  | "projectBriefing"
  | "activeHealthMonitor"
  | "announcementsManager"
  | "loyaltyCredits"
  | "bookingAppointments"
  | "designReviewAdmin"
  | "sprintBoardAdmin"
  | "contentApproval"
  | "meetingArchive"
  | "prospecting"
  | "staffUtilisation"
  | "capacityForecast"
  | "invoiceChasing"
  | "pipelineAnalytics"
  | "webhookHub"
  | "contractRenewal"
  | "clvAnalytics"
  | "projectTemplates"
  | "staffScheduling"
  | "proposals"
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
  { id: "executive", label: "Executive", section: "Operations" },
  { id: "dashboard", label: "BizDev", section: "Operations" },
  { id: "bookingAppointments", label: "Bookings", section: "Operations" },
  { id: "sprintBoardAdmin", label: "Sprint Board", section: "Operations" },
  { id: "leads", label: "Leads", section: "Operations" },
  { id: "prospecting", label: "Prospecting", section: "Operations" },
  { id: "clients", label: "Clients", section: "Operations", badgeRed: true },
  { id: "projects", label: "Proj. Ops", section: "Operations" },
  { id: "projectTemplates", label: "Templates", section: "Operations" },
  { id: "portfolio", label: "Portfolio", section: "Operations" },
  { id: "resources", label: "Resources", section: "Operations" },
  { id: "gantt", label: "Gantt", section: "Operations" },
  { id: "qa", label: "QA", section: "Operations" },
  { id: "sla", label: "SLA", section: "Operations" },
  { id: "designReviewAdmin", label: "Design Review", section: "Experience" },
  { id: "experience", label: "Journey", section: "Experience" },
  { id: "onboarding", label: "Onboarding", section: "Experience" },
  { id: "offboarding", label: "Offboarding", section: "Experience" },
  { id: "satisfaction", label: "Satisfaction", section: "Experience" },
  { id: "comms", label: "Comms Audit", section: "Experience" },
  { id: "vault", label: "Vault", section: "Experience" },
  { id: "referrals", label: "Referrals", section: "Experience" },
  { id: "interventions", label: "Interventions", section: "Experience" },
  { id: "loyaltyCredits", label: "Loyalty", section: "Finance" },
  { id: "invoices", label: "Billing", section: "Finance" },
  { id: "invoiceChasing", label: "Invoice Chasing", section: "Finance" },
  { id: "revops", label: "RevOps", section: "Finance" },
  { id: "revenueForecasting", label: "Rev. Forecast", section: "Finance" },
  { id: "profitability", label: "Prof. / Client", section: "Finance" },
  { id: "projectProfitability", label: "Prof. / Project", section: "Finance" },
  { id: "cashflow", label: "Cash Flow", section: "Finance" },
  { id: "fyCloseout", label: "FY Closeout", section: "Finance" },
  { id: "expenses", label: "Expenses", section: "Finance" },
  { id: "payroll", label: "Payroll", section: "Finance" },
  { id: "proposals", label: "Proposals", section: "Finance" },
  { id: "pricing", label: "Pricing", section: "Finance" },
  { id: "vendors", label: "Vendors", section: "Finance" },
  { id: "clvAnalytics", label: "CLV Analytics", section: "Finance" },
  { id: "announcementsManager", label: "Announcements", section: "Communication" },
  { id: "messages", label: "Messages", section: "Communication" },
  { id: "notifications", label: "Notifications", section: "Communication" },
  { id: "staff", label: "Staff", section: "Communication" },
  { id: "staffOnboarding", label: "Staff Onboard.", section: "Communication" },
  { id: "leaveAbsence", label: "Leave", section: "Communication" },
  { id: "staffScheduling", label: "Schedule", section: "Communication" },
  { id: "recruitment", label: "Recruitment", section: "Communication" },
  { id: "learningDev", label: "L&D", section: "Communication" },
  { id: "contentApproval", label: "Content", section: "Communication" },
  { id: "meetingArchive", label: "Meetings", section: "Communication" },
  { id: "staffSatisfaction", label: "Staff NPS", section: "Communication" },
  { id: "employmentRecords", label: "Employment", section: "Communication" },
  { id: "automation", label: "Workflows", section: "Automation" },
  { id: "integrations", label: "Integrations", section: "Automation" },
  { id: "webhookHub", label: "Webhooks", section: "Automation" },
  { id: "owner", label: "Owner", section: "Governance" },
  { id: "team", label: "Team", section: "Governance" },
  { id: "brand", label: "Brand", section: "Governance" },
  { id: "market", label: "Market Intel", section: "Governance" },
  { id: "intelligence", label: "Intelligence", section: "Governance" },
  { id: "healthScorecard", label: "Health Score", section: "Governance" },
  { id: "platform", label: "Platform", section: "Governance" },
  { id: "performance", label: "Performance", section: "Governance" },
  { id: "staffUtilisation", label: "Utilisation", section: "Governance" },
  { id: "capacityForecast", label: "Capacity Forecast", section: "Governance" },
  { id: "teamPerformanceReport", label: "Team Report", section: "Governance" },
  { id: "portfolioRiskRegister", label: "Risk Register", section: "Governance" },
  { id: "legal", label: "Legal", section: "Governance" },
  { id: "contractRenewal", label: "Contract Renewal", section: "Governance" },
  { id: "crisis", label: "Crisis", section: "Governance" },
  { id: "analytics", label: "Analytics", section: "Governance" },
  { id: "reports", label: "Reports", section: "Governance" },
  { id: "access", label: "Access", section: "Governance" },
  { id: "audit", label: "Audit Log", section: "Governance" },
  { id: "knowledgeBaseAdmin", label: "Knowledge Base", section: "Knowledge" },
  { id: "decisionRegistry", label: "Decisions", section: "Knowledge" },
  { id: "handoverManagement", label: "Handovers", section: "Knowledge" },
  { id: "closeoutReview", label: "Closeout", section: "Knowledge" },
  { id: "staffTransitionPlanner", label: "Transitions", section: "Knowledge" },
  { id: "serviceCatalogManager", label: "Service Catalog", section: "Knowledge" },
  { id: "requestInbox", label: "Requests", section: "Lifecycle" },
  { id: "changeRequestManager", label: "Change Requests", section: "Lifecycle" },
  { id: "supportQueue", label: "Support", section: "Lifecycle" },
  { id: "lifecycleDashboard", label: "Lifecycle", section: "Lifecycle" },
  { id: "stakeholderDirectory", label: "Stakeholders", section: "Lifecycle" },
  { id: "aiActionRecommendations", label: "AI Actions", section: "AI/ML" },
  { id: "updateQueueManager", label: "Update Queue", section: "AI/ML" },
  { id: "standupFeed", label: "Standup", section: "Governance" },
  { id: "eodDigest", label: "EOD Digest", section: "Governance" },
  { id: "peerReviewQueue", label: "Peer Review", section: "Governance" },
  { id: "automationAuditTrail", label: "Auto. Audit", section: "Governance" },
  { id: "projectBriefing", label: "Briefing", section: "Governance" },
  { id: "activeHealthMonitor", label: "Health Monitor", section: "Governance" },
  { id: "pipelineAnalytics", label: "Pipeline Analytics", section: "Finance" },
  { id: "settings", label: "Settings", section: "Governance" }
];

