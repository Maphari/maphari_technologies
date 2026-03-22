export type LeadPipelineStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

export interface AdminClient {
  id: string;
  name: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  tier: "STARTER" | "GROWTH" | "ENTERPRISE";
  timezone: string | null;
  billingEmail: string | null;
  ownerName: string | null;
  contractStartAt: string | null;
  contractRenewalAt: string | null;
  slaTier: "STANDARD" | "PRIORITY" | "ENTERPRISE";
  slaResponseHours: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientContact {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientActivity {
  id: string;
  clientId: string;
  type: string;
  message: string;
  actorId: string | null;
  actorRole: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface ClientStatusHistory {
  id: string;
  clientId: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  actorId: string | null;
  actorRole: string | null;
  changedAt: string;
}

export interface AdminFileRecord {
  id: string;
  clientId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDirectoryResult {
  items: AdminClient[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClientDetail extends AdminClient {
  contacts: ClientContact[];
  activities: ClientActivity[];
  statusHistory: ClientStatusHistory[];
  projects: AdminProject[];
  leads: AdminLead[];
}

export interface AdminProject {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: string;
  ownerName: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  startAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  budgetCents: number;
  progressPercent: number;
  slaDueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  dueAt: string | null;
  fileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  assigneeName: string | null;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  collaborators?: ProjectTaskCollaborator[];
}

export interface ProjectDependency {
  id: string;
  projectId: string;
  blockedByProjectId: string;
  type: "BLOCKS" | "RELATED";
  createdAt: string;
  blockedByProject?: AdminProject;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  clientId: string;
  type: string;
  details: string | null;
  createdAt: string;
}

export interface ProjectPaymentMilestone {
  stage: "MILESTONE_30" | "FINAL_20";
  paid: boolean;
  amountCents: number;
  invoiceId: string | null;
  paymentId: string | null;
  markedAt: string | null;
  note: string | null;
}

export interface ProjectBlocker {
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

export interface TimelineEvent {
  id: string;
  clientId: string;
  projectId: string | null;
  category: "PROJECT" | "LEAD" | "BLOCKER";
  title: string;
  detail: string | null;
  createdAt: string;
}

export interface ProjectChangeRequest {
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
    | "CLIENT_REJECTED";
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

export interface ProjectRequestQueueItem {
  projectId: string;
  clientId: string;
  name: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  desiredStartAt: string | null;
  desiredDueAt: string | null;
  estimatedBudgetCents: number;
  requestedAt: string;
  requestNote: string | null;
  requestDetails?: {
    serviceType: string;
    buildMode: string;
    complexity: string;
    designPackage: string;
    signedAgreementFileName: string;
    estimatedQuoteCents: number;
    depositAmountCents: number;
    scopePrompt: string | null;
  } | null;
}

export interface ProjectTimeEntry {
  id: string;
  projectId: string;
  clientId: string;
  staffUserId: string | null;
  staffName: string | null;
  taskLabel: string;
  minutes: number;
  startedAt: string | null;
  endedAt: string | null;
  status?: string;           // DRAFT | SUBMITTED | APPROVED | REJECTED
  submittedAt?: string | null;
  submittedWeek?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTaskCollaborator {
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

export interface ProjectCollaborationNote {
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

export interface ProjectWorkSession {
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

export interface ProjectCollaborationSnapshot {
  projectId: string;
  contributors: Array<{ name: string; role: string; activeSessions: number; taskCount: number }>;
  sessions: ProjectWorkSession[];
  notes: ProjectCollaborationNote[];
}

export interface ProjectDetail extends AdminProject {
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  dependencies: ProjectDependency[];
  activities: ProjectActivity[];
  collaborators?: ProjectTaskCollaborator[];
  collaborationNotes?: ProjectCollaborationNote[];
  workSessions?: ProjectWorkSession[];
}

export interface ProjectDirectoryResult {
  items: AdminProject[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProjectAnalyticsSummary {
  total: number;
  completed: number;
  atRisk: number;
  overdue: number;
  completionRate: number;
  avgProgress: number;
}

export interface ProjectHandoffSummary {
  docs: number;
  decisions: number;
  blockers: number;
  generatedAt: string;
}

export interface ProjectHandoffExportRecord {
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

export interface ProjectHandoffExportPayload {
  record: ProjectHandoffExportRecord;
}

export interface AdminLead {
  id: string;
  clientId: string;
  title: string;
  source: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  company: string | null;
  status: LeadPipelineStatus;
  notes: string | null;
  ownerName: string | null;
  nextFollowUpAt: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  clientId: string;
  type: string;
  details: string | null;
  createdAt: string;
}

export interface LeadPreference {
  id: string;
  userId: string;
  key: "savedView" | "slaConfig";
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadAnalyticsSummary {
  total: number;
  won: number;
  lost: number;
  conversionRate: number;
  avgTimeInStageDays: number;
}

export interface AdminInvoice {
  id: string;
  clientId: string;
  number: string;
  amountCents: number;
  currency: string;
  status: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Computed client-side: days past due for OVERDUE invoices */
  daysOverdue?: number;
  /** 0=current, 1=gentle(7-13d), 2=firm(14-29d), 3=director(30+d) */
  escalationLevel?: 0 | 1 | 2 | 3;
}

export interface AdminPayment {
  id: string;
  clientId: string;
  invoiceId: string;
  amountCents: number;
  status: string;
  provider: string | null;
  transactionRef: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminConversation {
  id: string;
  clientId: string;
  assigneeUserId: string | null;
  subject: string;
  projectId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMessage {
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

export interface ConversationNote {
  id: string;
  conversationId: string;
  authorId: string | null;
  authorRole: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationEscalation {
  id: string;
  conversationId: string;
  messageId: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  reason: string;
  ownerAdminId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneApproval {
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

export interface AdminAppointment {
  id: string;
  clientId: string;
  type: string;
  scheduledAt: string;
  durationMins: number;
  ownerName: string | null;
  status: string;
  notes: string | null;
  videoRoomUrl: string | null;
  videoProvider: string | null;
  videoCallStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSnapshot {
  clients: AdminClient[];
  projects: AdminProject[];
  leads: AdminLead[];
  invoices: AdminInvoice[];
  payments: AdminPayment[];
}

export interface NotificationJob {
  id: string;
  clientId: string;
  channel: "EMAIL" | "SMS" | "PUSH";
  recipient: string;
  subject: string | null;
  message: string;
  tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
  metadata: Record<string, string | number | boolean>;
  status: "QUEUED" | "SENT" | "FAILED";
  failureReason: string | null;
  attempts: number;
  maxAttempts: number;
  readAt: string | null;
  readByUserId: string | null;
  readByRole: "ADMIN" | "STAFF" | "CLIENT" | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationUnreadCount {
  total: number;
  byTab: Record<"dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations", number>;
}

export interface PartnerApiKey {
  id: string;
  clientId: string;
  label: string;
  keyId: string;
  keySecret: string;
  createdAt: string;
}

export interface StaffAccessRequest {
  id: string;
  email: string;
  pin: string;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  expiresAt: string;
  verifiedAt: string | null;
  revokedAt: string | null;
  userId: string | null;
}

export interface StaffAccessUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientAccessProvision {
  userId: string;
  email: string;
  role: string;
  clientId: string | null;
  invited: boolean;
}

export interface PartnerProject {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  createdAt: string;
}
