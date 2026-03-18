export type PageId =
  | "profile"
  // Overview
  | "home"
  | "dashboard"
  | "notifications"
  // Projects
  | "myProjects"
  | "projectRequest"
  | "timeline"
  | "projectRoadmap"
  | "milestones"
  | "sprintBoard"
  | "deliverables"
  | "changeRequests"
  | "riskRegister"
  | "decisionLog"
  | "contentApproval"
  // Finance
  | "payments"
  | "invoices"
  | "budgetTracker"
  | "contractsProposals"
  | "retainerDashboard"
  | "quoteAcceptance"
  | "financialReports"
  | "invoiceHistory"
  // Communication
  | "messages"
  | "bookCall"
  | "announcements"
  | "designReview"
  | "meetingArchive"
  // Files
  | "filesAssets"
  | "brandLibrary"
  | "resourceHub"
  // Reporting
  | "projectReports"
  | "healthScore"
  | "performanceDashboard"
  // Growth
  | "serviceCatalog"
  | "referralProgram"
  | "loyaltyCredits"
  // Support
  | "knowledgeBase"
  | "knowledgeAccess"
  | "slaEscalation"
  // Account
  | "feedbackSurvey"
  | "teamAccess"
  | "integrations"
  | "settings"
  | "dataPrivacy"
  | "onboardingStatus"
  | "onboarding"
  | "progressKnowledge"
  | "communicationHistory"
  | "projectBrief"
  | "offboarding";

export type NavSection = {
  title: string;
  items: Array<{ id: PageId; label: string }>;
};

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { id: "home", label: "Home" },
      { id: "dashboard", label: "Mission Control" },
      { id: "notifications", label: "Notifications" },
      { id: "onboardingStatus", label: "Onboarding Status" },
    ],
  },
  {
    title: "Projects",
    items: [
      { id: "myProjects", label: "My Projects" },
      { id: "projectBrief", label: "Project Brief" },
      { id: "projectRequest", label: "Request a Project" },
      { id: "timeline", label: "Project Timeline" },
      { id: "projectRoadmap", label: "Project Roadmap" },
      { id: "milestones", label: "Milestones & Approvals" },
      { id: "sprintBoard", label: "Sprint Board" },
      { id: "deliverables", label: "Deliverables" },
      { id: "changeRequests", label: "Change Requests" },
      { id: "riskRegister", label: "Risk Register" },
      { id: "decisionLog", label: "Decision Log" },
      { id: "contentApproval", label: "Content Approval" },
    ],
  },
  {
    title: "Finance",
    items: [
      { id: "payments", label: "Payments & Billing" },
      { id: "invoices", label: "Invoices" },
      { id: "budgetTracker", label: "Budget Tracker" },
      { id: "contractsProposals", label: "Contracts & Proposals" },
      { id: "retainerDashboard", label: "Retainer Dashboard" },
      { id: "quoteAcceptance", label: "Quote Acceptance" },
      { id: "financialReports", label: "Financial Reports" },
      { id: "invoiceHistory", label: "Invoice History" },
    ],
  },
  {
    title: "Communication",
    items: [
      { id: "messages", label: "Messages" },
      { id: "communicationHistory", label: "Communication History" },
      { id: "bookCall", label: "Book a Call" },
      { id: "announcements", label: "Announcements" },
      { id: "designReview", label: "Design Review" },
      { id: "meetingArchive", label: "Meeting Archive" },
    ],
  },
  {
    title: "Files",
    items: [
      { id: "filesAssets", label: "Files & Assets" },
      { id: "brandLibrary", label: "Brand Library" },
      { id: "resourceHub", label: "Resource Hub" },
    ],
  },
  {
    title: "Reporting",
    items: [
      { id: "projectReports", label: "Project Reports" },
      { id: "healthScore", label: "Health Score" },
      { id: "performanceDashboard", label: "Performance" },
    ],
  },
  {
    title: "Growth",
    items: [
      { id: "serviceCatalog", label: "Service Catalog" },
      { id: "referralProgram", label: "Referral Program" },
      { id: "loyaltyCredits", label: "Loyalty & Credits" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "progressKnowledge", label: "Progress & Knowledge" },
      { id: "knowledgeBase", label: "Knowledge Base" },
      { id: "knowledgeAccess", label: "Knowledge Access" },
      { id: "slaEscalation", label: "SLA & Escalation" },
    ],
  },
  {
    title: "Account",
    items: [
      { id: "profile", label: "Company Profile" },
      { id: "onboarding", label: "Onboarding Hub" },
      { id: "feedbackSurvey", label: "Feedback" },
      { id: "offboarding", label: "Offboarding" },
      { id: "teamAccess", label: "Team & Access" },
      { id: "integrations", label: "Integrations" },
      { id: "settings", label: "Settings" },
      { id: "dataPrivacy", label: "Data & Privacy" },
    ],
  },
];

export const allPageIds: PageId[] = navSections.flatMap((s) => s.items.map((i) => i.id));
