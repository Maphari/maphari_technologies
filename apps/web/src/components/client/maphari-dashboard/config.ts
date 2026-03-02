export type PageId =
  | "profile"
  | "dashboard"
  | "projects"
  | "request"
  | "approvals"
  | "meetings"
  | "files"
  | "feedback"
  | "billing"
  | "contracts"
  | "messages"
  | "notifications"
  | "reports"
  | "automation"
  | "services"
  | "support"
  | "onboarding"
  | "team"
  | "retainerUsage"
  | "sprintVisibility"
  | "deliverableStatus"
  | "milestoneApprovals"
  | "healthScore"
  | "satisfactionSurvey"
  | "knowledgeAccess"
  | "settings";

export type NavSection = {
  title: string;
  items: Array<{ id: PageId; label: string }>;
};

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard" },
    ]
  },
  {
    title: "Projects",
    items: [
      { id: "projects", label: "Project Overview" },
      { id: "request", label: "Project Brief" },
      { id: "approvals", label: "Change History" },
      { id: "meetings", label: "Time Tracking" },
      { id: "files", label: "Files" },
      { id: "feedback", label: "Feedback & Collaboration" },
      { id: "sprintVisibility", label: "Sprint Progress" },
      { id: "deliverableStatus", label: "Deliverables" },
      { id: "milestoneApprovals", label: "Milestone Approvals" },
    ]
  },
  {
    title: "Finance",
    items: [
      { id: "billing", label: "Deposit & Payments" },
      { id: "contracts", label: "Legal Agreements" },
      { id: "retainerUsage", label: "Retainer Usage" },
    ]
  },
  {
    title: "Communication",
    items: [
      { id: "messages", label: "Messages" },
      { id: "notifications", label: "Communication Log" },
      { id: "reports", label: "Status & Launch" },
      { id: "automation", label: "AI & Automation" },
      { id: "services", label: "Services & Growth" },
    ]
  },
  {
    title: "Account",
    items: [
      { id: "support", label: "Progress & Knowledge" },
      { id: "knowledgeAccess", label: "Knowledge Base" },
      { id: "healthScore", label: "Relationship Health" },
      { id: "satisfactionSurvey", label: "Give Feedback" },
      { id: "onboarding", label: "Onboarding & Offboarding" },
      { id: "team", label: "Team Management" },
      { id: "settings", label: "Settings" },
    ]
  }
];

export const allPageIds: PageId[] = navSections.flatMap((s) => s.items.map((i) => i.id));
