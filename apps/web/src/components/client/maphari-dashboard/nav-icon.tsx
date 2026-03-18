/**
 * Client dashboard navigation icon component.
 * Maps each client PageId to a unique SVG icon.
 */
import type { PageId } from "./config";

export function NavIcon({ id, className }: { id: PageId; className: string }) {
  // Overview
  if (id === "home") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 7.5L8 2l6 5.5V14H10v-3.5H6V14H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
  if (id === "notifications") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M8 2a4.5 4.5 0 0 0-4.5 4.5V10l-1 2h11l-1-2V6.5A4.5 4.5 0 0 0 8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.2 13a2 2 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );

  // Projects
  if (id === "myProjects") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 4.5V13h12V4.5H2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M2 4.5l2-2.5h4l2 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 8.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "timeline") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 8h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 5v1.5M8 4v2M12 6v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "milestones") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L2.5 4v4c0 3.5 2.4 5.8 5.5 6.5 3.1-.7 5.5-3 5.5-6.5V4L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "sprintBoard") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="6.25" y="2" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="11" y="2" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
  if (id === "deliverables") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M4 1.5h5.5l3 3V14.5H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.5 1.5v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5l1.8 1.8L10.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "changeRequests") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M3 5.5h10M3 8h7M3 10.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11.5 9.5l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1.5" y="2" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
  if (id === "riskRegister") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M8 2L1.5 13.5h13L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 6.5v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
    </svg>
  );
  if (id === "decisionLog") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 5h6M5 7.5h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.5 10.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "contentApproval") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 3h12v8H6l-3 2v-2H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.5 7.5l1.5 1.5 3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // Finance
  if (id === "payments") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 10h3M9 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "invoices") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 13.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="3" y="9" width="2.2" height="4.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="6.9" y="5.5" width="2.2" height="8" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10.8" y="2.5" width="2.2" height="11" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
  if (id === "budgetTracker") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "contractsProposals") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M3.5 1.5h9v13h-9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.5 4.5h5M5.5 7h5M5.5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8.5 11.5l1.5 1.5 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "retainerDashboard") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4v4l3 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8a4 4 0 0 1 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="1.5 1.5" />
    </svg>
  );
  if (id === "quoteAcceptance") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 7h6M5 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9 12v2l2-1-2-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
  if (id === "financialReports") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 12l3.5-4 3 2.5 3.5-6L15 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 14h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );

  // Communication
  if (id === "messages") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 2.5h8v6H5.5L3 10.5V8.5H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 5.5h4v6h-1v2l-2.5-2H7v-3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
  if (id === "bookCall") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 1.5v2.2M11.5 1.5v2.2M4 7h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 10l1.5 1.5L11 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "announcements") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M3 7H1.5v3H3l3 2.5V4.5L3 7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.5 5.5c1.5.8 2.5 2.2 2.5 3.5s-1 2.7-2.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 3.5C13.8 4.8 15 6.8 15 8.5s-1.2 3.7-3.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "designReview") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.5 12v2M9.5 12v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "meetingArchive") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13.5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );

  // Files
  if (id === "filesAssets") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M4 1.5h5.5l3 3V14.5H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.5 1.5v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8h4.5M6 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "brandLibrary") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="7" r="1.2" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="0.8" />
      <path d="M8 1v1.5M8 11.5V13M1 7h1.5M11.5 7H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 10.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "resourceHub") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );

  // Reporting
  if (id === "projectReports") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 10V8M8 10V6M11 10V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
  if (id === "healthScore") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 8h2.5l2-4 3 8 2-4H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "performanceDashboard") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 12l3.5-4 3 2.5 3.5-6L15 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 14h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );

  // Growth
  if (id === "serviceCatalog") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2.5 4.5h11v7h-11z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.2 4.5V3.2a2.8 2.8 0 0 1 5.6 0v1.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "referralProgram") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 5.5l3.5-1.5M7 6.5l3.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "loyaltyCredits") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5l3.5-.5L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );

  // Support
  if (id === "knowledgeBase") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2.5 2h11v12h-11z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5 5h6M5 7.5h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "slaEscalation") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M8 2L2 6v8h12V6L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 7v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
    </svg>
  );

  // Account
  if (id === "feedbackSurvey") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M8 2l1.2 2.4 2.8.4-2 2 .5 2.7L8 8.2l-2.5 1.3.5-2.7-2-2 2.8-.4L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3 12h10M4.5 14h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "teamAccess") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="4.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 13c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="11.5" cy="5.5" r="1.7" stroke="currentColor" strokeWidth="1.2" />
      <path d="M14.5 12.5c0-1.7-1.3-3-3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "integrations") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 4h4M5.5 5.5l-1 5M10.5 5.5l1 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "settings") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M7 1.5h2v1.2c.5.2 1 .4 1.4.8l1-.6 1.4 1.4-.6 1c.3.4.5.9.6 1.4H14v2h-1.2c-.1.5-.3 1-.6 1.4l.6 1-1.4 1.4-1-.6c-.4.3-.9.6-1.4.8V14H7v-1.2c-.5-.2-1-.5-1.4-.8l-1 .6-1.4-1.4.6-1c-.3-.4-.5-.9-.6-1.4H2V7h1.2c.1-.5.3-1 .6-1.4l-.6-1 1.4-1.4 1 .6c.4-.4.9-.6 1.4-.8V1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
  if (id === "dataPrivacy") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="10.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );

  // Mission Control dashboard
  if (id === "dashboard") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="1.5" width="6" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="6.5" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="10" width="6" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
  if (id === "onboardingStatus") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "onboarding") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 14c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 2l1.5 1.5L15 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "projectBrief") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M3 2h7l3 3v9H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 7h6M5 9.5h4M5 12h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "projectRequest") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5.5v5M5.5 8h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
  if (id === "invoiceHistory") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M3 1.5h7l3 3v10H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 1.5v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 8h4M5 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 5.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "communicationHistory") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 2.5h9v6.5H5l-3 2V2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5 5.5h4M5 7.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 5.5h2v5h-1v1.5l-2-1.5h-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "progressKnowledge") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 12l3-5 3 3 3-7 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 14h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "knowledgeAccess") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2.5 2h8v11h-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5 5h4M5 7.5h4M5 10h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12.5" cy="11" r="2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M14 12.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "offboarding") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M6 8h8M11 5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );

  // profile (settings mode)
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
