export interface PortalConversation {
  id: string;
  clientId: string;
  assigneeUserId: string | null;
  subject: string;
  projectId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalMessage {
  id: string;
  clientId: string;
  conversationId: string;
  authorId: string | null;
  authorRole: string | null;
  deliveryStatus: "SENT" | "DELIVERED" | "READ";
  deliveredAt: string | null;
  readAt: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalFile {
  id: string;
  clientId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortalPayment {
  id: string;
  clientId: string;
  invoiceId: string;
  amountCents: number;
  status: string;
  provider: string | null;
  transactionRef: string | null;
  paidAt: string | null;
  receiptFileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalInvoice {
  id: string;
  clientId: string;
  number: string;
  amountCents: number;
  currency: string;
  status: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  pdfFileId: string | null;
  createdAt: string;
  updatedAt: string;
  payments: PortalPayment[];
}

export interface PortalProject {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: string;
  ownerName: string | null;
  priority: string;
  riskLevel: string;
  startAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  budgetCents: number;
  progressPercent: number;
  slaDueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PortalProjectRequestServiceType =
  | "AUTO_RECOMMEND"
  | "WEBSITE"
  | "MOBILE_APP"
  | "AUTOMATION"
  | "UI_UX_DESIGN"
  | "OTHER";

export type PortalProjectRequestBuildMode = "AUTO" | "WORDPRESS" | "CUSTOM_CODE";
export type PortalProjectRequestComplexity = "SIMPLE" | "STANDARD" | "ADVANCED";
export type PortalProjectRequestDesignPackage = "NONE" | "WIREFRAMES" | "WIREFRAMES_AND_UX";
export type PortalProjectRequestServiceOption =
  | "WEB_DEVELOPMENT"
  | "WORDPRESS_DEVELOPMENT"
  | "CUSTOM_WEB_APP_DEVELOPMENT"
  | "ECOMMERCE_DEVELOPMENT"
  | "CMS_IMPLEMENTATION"
  | "UI_UX_DESIGN"
  | "UX_RESEARCH_TESTING"
  | "WIREFRAMING_PROTOTYPING"
  | "BRANDING_VISUAL_IDENTITY"
  | "MOBILE_APP_IOS"
  | "MOBILE_APP_ANDROID"
  | "MOBILE_APP_CROSS_PLATFORM"
  | "API_DEVELOPMENT"
  | "THIRD_PARTY_INTEGRATIONS"
  | "AUTOMATION_WORKFLOWS"
  | "RPA_LEGACY_AUTOMATION"
  | "AI_LLM_AUTOMATIONS"
  | "QA_TESTING"
  | "SECURITY_COMPLIANCE"
  | "DEVOPS_CI_CD_CLOUD"
  | "ANALYTICS_TRACKING"
  | "SEO_TECHNICAL"
  | "CONTENT_MIGRATION"
  | "MAINTENANCE_SUPPORT"
  | "DEDICATED_TEAM"
  | "DISCOVERY_CONSULTING";
export type PortalProjectRequestAddonOption =
  | "COPYWRITING_CONTENT"
  | "ADVANCED_SEO"
  | "PERFORMANCE_OPTIMIZATION"
  | "TRAINING_HANDOFF"
  | "PRIORITY_SUPPORT"
  | "ADDITIONAL_QA_CYCLE"
  | "SECURITY_REVIEW"
  | "ANALYTICS_DASHBOARD";

export interface PortalProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  status: string;
  dueAt: string | null;
  fileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalProjectTask {
  id: string;
  projectId: string;
  title: string;
  assigneeName: string | null;
  status: string;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  collaborators?: PortalTaskCollaborator[];
}

export interface PortalTaskCollaborator {
  id: string;
  projectId: string;
  taskId: string;
  clientId: string;
  staffUserId: string | null;
  staffName: string;
  role: "LEAD" | "CONTRIBUTOR" | "REVIEWER";
  allocationPercent: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortalProjectDependency {
  id: string;
  projectId: string;
  blockedByProjectId: string;
  type: string;
  createdAt: string;
  blockedByProject?: PortalProject | null;
}

export interface PortalProjectActivity {
  id: string;
  projectId: string;
  clientId: string;
  type: string;
  details: string | null;
  createdAt: string;
}

export interface PortalProjectPaymentMilestone {
  stage: "MILESTONE_30" | "FINAL_20";
  paid: boolean;
  amountCents: number;
  invoiceId: string | null;
  paymentId: string | null;
  markedAt: string | null;
  note: string | null;
}

export interface PortalProjectBlocker {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  ownerRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  ownerName: string | null;
  etaAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalTimelineEvent {
  id: string;
  clientId: string;
  projectId: string | null;
  category: "PROJECT" | "LEAD" | "BLOCKER";
  title: string;
  detail: string | null;
  createdAt: string;
}

export interface PortalProjectChangeRequest {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string | null;
  reason: string | null;
  impactSummary: string | null;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "ESTIMATED"
    | "ADMIN_APPROVED"
    | "ADMIN_REJECTED"
    | "CLIENT_APPROVED"
    | "CLIENT_REJECTED"
    | "DEFERRED";
  requestedByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  requestedByName: string | null;
  requestedAt: string;
  estimatedHours: number | null;
  estimatedCostCents: number | null;
  staffAssessment: string | null;
  estimatedAt: string | null;
  estimatedByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  estimatedByName: string | null;
  adminDecisionNote: string | null;
  adminDecidedAt: string | null;
  adminDecidedByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  adminDecidedByName: string | null;
  clientDecisionNote: string | null;
  clientDecidedAt: string | null;
  clientDecidedByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  clientDecidedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PortalProjectDetail = PortalProject & {
  milestones: PortalProjectMilestone[];
  tasks: PortalProjectTask[];
  dependencies: PortalProjectDependency[];
  activities: PortalProjectActivity[];
  collaborators?: PortalTaskCollaborator[];
  collaborationNotes?: PortalCollaborationNote[];
  workSessions?: PortalWorkSession[];
};

export interface PortalCollaborationNote {
  id: string;
  projectId: string;
  clientId: string;
  authorId: string | null;
  authorRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  authorName: string;
  visibility: "INTERNAL" | "EXTERNAL";
  workstream: string | null;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalWorkSession {
  id: string;
  projectId: string;
  taskId: string | null;
  clientId: string;
  memberId: string | null;
  memberName: string;
  memberRole: "ADMIN" | "STAFF";
  workstream: string | null;
  status: "ACTIVE" | "PAUSED" | "DONE";
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalProjectCollaboration {
  projectId: string;
  contributors: Array<{ name: string; role: string; activeSessions: number; taskCount: number }>;
  sessions: PortalWorkSession[];
  notes: PortalCollaborationNote[];
}

export interface PortalMilestoneApproval {
  id: string;
  milestoneId: string;
  projectId: string;
  clientId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comment: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalSnapshot {
  conversations: PortalConversation[];
  files: PortalFile[];
  invoices: PortalInvoice[];
  payments: PortalPayment[];
  projects: PortalProject[];
}

export interface PortalNotificationJob {
  id: string;
  status: string;
  tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
  readAt: string | null;
  channel?: string | null;
  subject?: string | null;
  message?: string | null;
  recipient?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, string | number | boolean>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortalNotificationUnreadCount {
  total: number;
  byTab: Record<"dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations", number>;
}

export interface PortalPreference {
  id: string;
  userId: string;
  key:
    | "savedView"
    | "layout"
    | "settingsProfile"
    | "settingsWorkspace"
    | "settingsSecurity"
    | "settingsNotifications"
    | "settingsApiAccess"
    | "settingsAutomationPhase2"
    | "dashboardLastSeenAt"
    | "kanbanBoardPrefs";
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalHandoffSummary {
  docs: number;
  decisions: number;
  blockers: number;
  generatedAt: string;
}

export interface PortalHandoffExportRecord {
  id: string;
  format: "json" | "markdown";
  fileId?: string;
  fileName: string;
  mimeType: string;
  downloadPath: string;
  docs: number;
  decisions: number;
  blockers: number;
  generatedAt: string;
}

export interface PortalHandoffExportPayload {
  record: PortalHandoffExportRecord;
}

export interface UploadUrlPayload {
  uploadUrl: string;
  uploadToken: string;
  storageKey: string;
  expiresAt: string;
}
