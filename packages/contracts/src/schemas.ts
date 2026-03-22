import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  role: z.enum(["ADMIN", "STAFF", "CLIENT"]).optional(),
  password: z.string().min(8).max(256).optional(),
  rememberMe: z.boolean().optional()
});

// Password complexity: min 12 chars, at least one uppercase, one lowercase,
// one digit, and one special character (#, ?, !, @, $, %, ^, &, *, -).
const strongPassword = z
  .string()
  .trim()
  .min(12, "Password must be at least 12 characters")
  .max(256)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit")
  .regex(/[#?!@$%^&*\-]/, "Password must contain at least one special character (#?!@$%^&*-)");

export const registerAdminSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: strongPassword
});

export const verifyAdminOtpSchema = z.object({
  email: z.email().trim().toLowerCase(),
  otp: z.string().trim().regex(/^\d{6}$/)
});

export const resendAdminOtpSchema = z.object({
  email: z.email().trim().toLowerCase()
});

export const registerStaffSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: strongPassword
});

export const verifyStaffPinSchema = z.object({
  email: z.email().trim().toLowerCase(),
  pin: z.string().trim().regex(/^\d{6}$/)
});

export const approveStaffRequestSchema = z.object({
  requestId: z.uuid()
});

export const revokeStaffAccessSchema = z.object({
  userId: z.uuid()
});

export const provisionClientAccessSchema = z.object({
  email: z.email().trim().toLowerCase(),
  clientId: z.uuid(),
  clientName: z.string().trim().min(2).max(200).optional()
});

export const refreshSchema = z.object({
  refreshToken: z.string().trim().min(1)
});

export const createProjectSchema = z.object({
  clientId: z.uuid().optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional(),
  status: z.string().trim().min(2).max(64).optional(),
  ownerName: z.string().trim().max(120).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  startAt: z.iso.datetime().optional(),
  dueAt: z.iso.datetime().optional(),
  budgetCents: z.number().int().min(0).max(10_000_000_000).optional(),
  slaDueAt: z.iso.datetime().optional()
});

export const createProjectRequestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional(),
  desiredStartAt: z.iso.datetime().optional(),
  desiredDueAt: z.iso.datetime().optional(),
  estimatedBudgetCents: z.number().int().min(0).max(10_000_000_000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  serviceType: z
    .enum(["AUTO_RECOMMEND", "WEBSITE", "MOBILE_APP", "AUTOMATION", "UI_UX_DESIGN", "OTHER"])
    .optional(),
  buildMode: z.enum(["AUTO", "WORDPRESS", "CUSTOM_CODE"]).optional(),
  complexity: z.enum(["SIMPLE", "STANDARD", "ADVANCED"]).optional(),
  designPackage: z.enum(["NONE", "WIREFRAMES", "WIREFRAMES_AND_UX"]).optional(),
  websitePageCount: z.number().int().min(0).max(500).optional(),
  appScreenCount: z.number().int().min(0).max(2000).optional(),
  integrationsCount: z.number().int().min(0).max(200).optional(),
  targetPlatforms: z.array(z.enum(["WEB", "IOS", "ANDROID"])).max(3).optional(),
  requiresContentSupport: z.boolean().optional(),
  requiresDomainAndHosting: z.boolean().optional(),
  scopePrompt: z.string().trim().max(8000).optional(),
  selectedServices: z
    .array(
      z.enum([
        "WEB_DEVELOPMENT",
        "WORDPRESS_DEVELOPMENT",
        "CUSTOM_WEB_APP_DEVELOPMENT",
        "ECOMMERCE_DEVELOPMENT",
        "CMS_IMPLEMENTATION",
        "UI_UX_DESIGN",
        "UX_RESEARCH_TESTING",
        "WIREFRAMING_PROTOTYPING",
        "BRANDING_VISUAL_IDENTITY",
        "MOBILE_APP_IOS",
        "MOBILE_APP_ANDROID",
        "MOBILE_APP_CROSS_PLATFORM",
        "API_DEVELOPMENT",
        "THIRD_PARTY_INTEGRATIONS",
        "AUTOMATION_WORKFLOWS",
        "RPA_LEGACY_AUTOMATION",
        "AI_LLM_AUTOMATIONS",
        "QA_TESTING",
        "SECURITY_COMPLIANCE",
        "DEVOPS_CI_CD_CLOUD",
        "ANALYTICS_TRACKING",
        "SEO_TECHNICAL",
        "CONTENT_MIGRATION",
        "MAINTENANCE_SUPPORT",
        "DEDICATED_TEAM",
        "DISCOVERY_CONSULTING"
      ])
    )
    .max(26)
    .optional(),
  addonServices: z
    .array(
      z.enum([
        "COPYWRITING_CONTENT",
        "ADVANCED_SEO",
        "PERFORMANCE_OPTIMIZATION",
        "TRAINING_HANDOFF",
        "PRIORITY_SUPPORT",
        "ADDITIONAL_QA_CYCLE",
        "SECURITY_REVIEW",
        "ANALYTICS_DASHBOARD"
      ])
    )
    .max(8)
    .optional(),
  signedAgreementFileId: z.uuid(),
  estimatedQuoteCents: z.number().int().positive().max(10_000_000_000),
  depositInvoiceId: z.uuid(),
  depositPaymentId: z.uuid()
});

export const decideProjectRequestSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().trim().max(5000).optional(),
  ownerName: z.string().trim().max(120).optional()
});

export const clientLifecycleStatusSchema = z.enum(["ONBOARDING", "ACTIVE", "PAUSED", "CHURNED"]);

export const createClientSchema = z.object({
  name: z.string().trim().min(2).max(200),
  status: clientLifecycleStatusSchema.optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  tier: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]).optional(),
  timezone: z.string().trim().max(80).optional(),
  billingEmail: z.email().trim().toLowerCase().optional(),
  ownerName: z.string().trim().max(120).optional(),
  contractStartAt: z.iso.datetime().optional(),
  contractRenewalAt: z.iso.datetime().optional(),
  slaTier: z.enum(["STANDARD", "PRIORITY", "ENTERPRISE"]).optional(),
  slaResponseHours: z.number().int().min(1).max(168).optional(),
  notes: z.string().trim().max(5000).optional()
});

export const updateClientSchema = z.object({
  clientId: z.uuid(),
  name: z.string().trim().min(2).max(200).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  tier: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]).optional(),
  timezone: z.string().trim().max(80).optional(),
  billingEmail: z.email().trim().toLowerCase().optional(),
  ownerName: z.string().trim().max(120).optional(),
  contractStartAt: z.iso.datetime().nullable().optional(),
  contractRenewalAt: z.iso.datetime().nullable().optional(),
  slaTier: z.enum(["STANDARD", "PRIORITY", "ENTERPRISE"]).optional(),
  slaResponseHours: z.number().int().min(1).max(168).optional(),
  notes: z.string().trim().max(5000).optional()
});

export const updateClientStatusSchema = z.object({
  clientId: z.uuid(),
  status: clientLifecycleStatusSchema,
  reason: z.string().trim().max(500).optional()
});

export const createClientContactSchema = z.object({
  clientId: z.uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().max(32).optional(),
  role: z.string().trim().max(80).optional(),
  isPrimary: z.boolean().optional()
});

export const updateClientContactSchema = z.object({
  clientId: z.uuid(),
  contactId: z.uuid(),
  name: z.string().trim().min(2).max(120).optional(),
  email: z.email().trim().toLowerCase().optional(),
  phone: z.string().trim().max(32).optional(),
  role: z.string().trim().max(80).optional(),
  isPrimary: z.boolean().optional()
});

export const getClientQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: clientLifecycleStatusSchema.optional(),
  tier: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]).optional(),
  sortBy: z.enum(["name", "updatedAt", "createdAt", "contractRenewalAt"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional()
});

export const upsertClientPreferencesSchema = z.object({
  key: z.enum(["savedView"]),
  value: z.string().trim().min(2).max(5000)
});

export const getClientPreferencesQuerySchema = z.object({
  key: z.enum(["savedView"])
});

export const updateProjectStatusSchema = z.object({
  projectId: z.uuid(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD", "CANCELLED"])
});

export const updateProjectSchema = z.object({
  projectId: z.uuid(),
  name: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(5000).optional(),
  ownerName: z.string().trim().max(120).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  startAt: z.iso.datetime().nullable().optional(),
  dueAt: z.iso.datetime().nullable().optional(),
  budgetCents: z.number().int().min(0).max(10_000_000_000).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  slaDueAt: z.iso.datetime().nullable().optional()
});

export const getProjectQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  sortBy: z.enum(["name", "updatedAt", "createdAt", "dueAt", "progressPercent"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional()
});

export const createProjectMilestoneSchema = z.object({
  projectId: z.uuid(),
  title: z.string().trim().min(2).max(180),
  dueAt: z.iso.datetime().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  fileId: z.uuid().optional()
});

export const updateProjectMilestoneSchema = z.object({
  projectId: z.uuid(),
  milestoneId: z.uuid(),
  title: z.string().trim().min(2).max(180).optional(),
  dueAt: z.iso.datetime().nullable().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  fileId: z.uuid().nullable().optional()
});

export const createProjectTaskSchema = z.object({
  projectId: z.uuid(),
  title: z.string().trim().min(2).max(180),
  assigneeName: z.string().trim().max(120).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  dueAt: z.iso.datetime().optional()
});

export const createTimeEntrySchema = z.object({
  projectId: z.uuid(),
  taskLabel: z.string().trim().min(2).max(200),
  minutes: z.number().int().min(1).max(24 * 60),
  startedAt: z.iso.datetime().optional(),
  endedAt: z.iso.datetime().optional(),
  staffName: z.string().trim().max(120).optional()
});

export const getTimeEntryQuerySchema = z.object({
  projectId: z.uuid().optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});

export const updateProjectTaskSchema = z.object({
  projectId: z.uuid(),
  taskId: z.uuid(),
  title: z.string().trim().min(2).max(180).optional(),
  assigneeName: z.string().trim().max(120).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  dueAt: z.iso.datetime().nullable().optional()
});

export const createTaskCollaboratorSchema = z.object({
  projectId: z.uuid(),
  taskId: z.uuid(),
  staffUserId: z.uuid().optional(),
  staffName: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(64).optional(),
  allocationPercent: z.number().int().min(0).max(100).optional()
});

export const updateTaskCollaboratorSchema = z.object({
  projectId: z.uuid(),
  taskId: z.uuid(),
  collaboratorId: z.uuid(),
  role: z.string().trim().min(2).max(64).optional(),
  allocationPercent: z.number().int().min(0).max(100).optional(),
  active: z.boolean().optional()
});

export const createProjectCollaborationNoteSchema = z.object({
  projectId: z.uuid(),
  message: z.string().trim().min(2).max(4000),
  visibility: z.enum(["INTERNAL", "EXTERNAL"]).optional(),
  workstream: z.string().trim().max(120).optional()
});

export const createProjectWorkSessionSchema = z.object({
  projectId: z.uuid(),
  taskId: z.uuid().optional(),
  memberName: z.string().trim().min(2).max(120),
  memberRole: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
  workstream: z.string().trim().max(120).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "DONE"]).optional()
});

export const updateProjectWorkSessionSchema = z.object({
  projectId: z.uuid(),
  sessionId: z.uuid(),
  status: z.enum(["ACTIVE", "PAUSED", "DONE"]).optional(),
  workstream: z.string().trim().max(120).optional(),
  taskId: z.uuid().nullable().optional(),
  endedAt: z.iso.datetime().nullable().optional()
});

export const createProjectBlockerSchema = z.object({
  projectId: z.uuid(),
  clientId: z.uuid().optional(),
  title: z.string().trim().min(3).max(220),
  description: z.string().trim().max(5000).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  ownerRole: z.enum(["ADMIN", "STAFF", "CLIENT"]).optional(),
  ownerName: z.string().trim().max(120).optional(),
  etaAt: z.iso.datetime().optional()
});

export const createProjectChangeRequestSchema = z.object({
  projectId: z.uuid(),
  clientId: z.uuid().optional(),
  title: z.string().trim().min(3).max(220),
  description: z.string().trim().max(5000).optional(),
  reason: z.string().trim().max(2000).optional(),
  impactSummary: z.string().trim().max(2000).optional()
});

export const updateProjectChangeRequestSchema = z.object({
  changeRequestId: z.uuid(),
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "ESTIMATED",
      "ADMIN_APPROVED",
      "ADMIN_REJECTED",
      "CLIENT_APPROVED",
      "CLIENT_REJECTED"
    ])
    .optional(),
  estimatedHours: z.number().nonnegative().max(10_000).optional(),
  estimatedCostCents: z.number().int().nonnegative().max(10_000_000_000).optional(),
  staffAssessment: z.string().trim().max(5000).optional(),
  adminDecisionNote: z.string().trim().max(5000).optional(),
  clientDecisionNote: z.string().trim().max(5000).optional(),
  addendumFileId: z.uuid().optional(),
  additionalPaymentInvoiceId: z.uuid().optional(),
  additionalPaymentId: z.uuid().optional(),
  forceOverride: z.boolean().optional()
});

export const markProjectPaymentMilestoneSchema = z.object({
  projectId: z.uuid(),
  stage: z.enum(["MILESTONE_30", "FINAL_20"]),
  invoiceId: z.uuid(),
  paymentId: z.uuid()
});

export const getProjectChangeRequestsQuerySchema = z.object({
  clientId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "ESTIMATED",
      "ADMIN_APPROVED",
      "ADMIN_REJECTED",
      "CLIENT_APPROVED",
      "CLIENT_REJECTED"
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});

export const updateProjectBlockerSchema = z.object({
  blockerId: z.uuid(),
  title: z.string().trim().min(3).max(220).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  ownerRole: z.enum(["ADMIN", "STAFF", "CLIENT"]).nullable().optional(),
  ownerName: z.string().trim().max(120).nullable().optional(),
  etaAt: z.iso.datetime().nullable().optional(),
  resolvedAt: z.iso.datetime().nullable().optional()
});

export const getProjectBlockersQuerySchema = z.object({
  clientId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});

export const getTimelineQuerySchema = z.object({
  clientId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});

export const createProjectDependencySchema = z.object({
  projectId: z.uuid(),
  blockedByProjectId: z.uuid(),
  type: z.enum(["BLOCKS", "RELATED"]).optional()
});

export const upsertProjectPreferencesSchema = z.object({
  key: z.enum([
    "savedView",
    "layout",
    "settingsProfile",
    "settingsWorkspace",
    "settingsSecurity",
    "settingsNotifications",
    "settingsApiAccess",
    "settingsAutomationPhase2",
    "dashboardLastSeenAt",
    "kanbanBoardPrefs",
    "documentCenterAdminTemplates",
    "documentCenterClientAgreements"
  ]),
  value: z.string().trim().min(2).max(5000)
});

export const getProjectPreferencesQuerySchema = z.object({
  key: z.enum([
    "savedView",
    "layout",
    "settingsProfile",
    "settingsWorkspace",
    "settingsSecurity",
    "settingsNotifications",
    "settingsApiAccess",
    "settingsAutomationPhase2",
    "dashboardLastSeenAt",
    "kanbanBoardPrefs",
    "documentCenterAdminTemplates",
    "documentCenterClientAgreements"
  ])
});

export const createLeadSchema = z.object({
  clientId: z.uuid().optional(),
  title: z.string().trim().min(2).max(200),
  source: z.string().trim().max(120).optional(),
  status: z.string().trim().min(2).max(64).optional(),
  notes: z.string().trim().max(5000).optional(),
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.email().trim().toLowerCase().optional(),
  contactPhone: z.string().trim().max(32).optional(),
  company: z.string().trim().max(200).optional()
});

export const createBookingSchema = z.object({
  clientId: z.uuid().optional(),
  service: z.string().trim().min(2).max(120),
  startsAt: z.iso.datetime(),
  attendeeName: z.string().trim().min(2).max(120),
  attendeeEmail: z.email().trim().toLowerCase(),
  attendeePhone: z.string().trim().min(7).max(32).optional(),
  notes: z.string().trim().max(5000).optional(),
  source: z.string().trim().max(120).optional()
});

export const signProposalSchema = z.object({
  clientId: z.uuid().optional(),
  proposalId: z.uuid(),
  leadId: z.uuid().optional(),
  packageName: z.string().trim().min(2).max(160),
  contactEmail: z.email().trim().toLowerCase(),
  signedAt: z.iso.datetime().optional()
});

export const submitOnboardingSchema = z.object({
  clientId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  contactEmail: z.email().trim().toLowerCase(),
  assetsProvided: z.array(z.string().trim().min(1).max(120)).optional(),
  notes: z.string().trim().max(5000).optional(),
  submittedAt: z.iso.datetime().optional()
});

export const createMaintenanceCheckSchema = z.object({
  clientId: z.uuid().optional(),
  checkType: z.enum(["BACKUP", "SECURITY", "PERFORMANCE", "UPTIME", "DEPENDENCY", "SSL"]),
  status: z.enum(["PASS", "WARN", "FAIL"]),
  details: z.string().trim().max(5000).optional(),
  checkedAt: z.iso.datetime().optional()
});

export const createSecurityIncidentSchema = z.object({
  clientId: z.uuid().optional(),
  incidentType: z.enum(["FAILED_LOGINS_THRESHOLD", "SUSPICIOUS_LOGIN", "VULNERABILITY", "ACCESS_ANOMALY"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  message: z.string().trim().min(3).max(5000),
  occurredAt: z.iso.datetime().optional()
});

export const createReportGeneratedSchema = z.object({
  clientId: z.uuid().optional(),
  reportType: z.enum([
    "WEEKLY_LEADS",
    "MONTHLY_REVENUE",
    "MAINTENANCE",
    "CLIENT_PERFORMANCE",
    "AUTOMATION_FAILURE"
  ]),
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime(),
  generatedAt: z.iso.datetime().optional()
});

export const createTestimonialReceivedSchema = z.object({
  clientId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  authorName: z.string().trim().min(2).max(120),
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(3).max(5000),
  submittedAt: z.iso.datetime().optional()
});

export const createClientReengagementSchema = z.object({
  clientId: z.uuid().optional(),
  contactEmail: z.email().trim().toLowerCase(),
  monthsInactive: z.number().int().min(1).max(120),
  dueAt: z.iso.datetime().optional()
});

export const updateLeadStatusSchema = z.object({
  leadId: z.uuid(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]),
  lostReason: z.string().trim().max(500).optional()
});

export const updateLeadSchema = z.object({
  leadId: z.uuid(),
  title: z.string().trim().min(2).max(200).optional(),
  source: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(5000).optional(),
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.email().trim().toLowerCase().optional(),
  contactPhone: z.string().trim().max(32).optional(),
  company: z.string().trim().max(200).optional(),
  ownerName: z.string().trim().max(120).optional(),
  nextFollowUpAt: z.iso.datetime().nullable().optional()
});

export const bulkUpdateLeadStatusSchema = z.object({
  leadIds: z.array(z.uuid()).min(1).max(200),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]),
  lostReason: z.string().trim().max(500).optional()
});

export const mergeLeadsSchema = z.object({
  primaryLeadId: z.uuid(),
  duplicateLeadId: z.uuid()
});

export const upsertLeadPreferencesSchema = z.object({
  key: z.enum(["savedView", "slaConfig"]),
  value: z.string().trim().min(2).max(5000)
});

export const getLeadPreferencesQuerySchema = z.object({
  key: z.enum(["savedView", "slaConfig"])
});

export const createConversationSchema = z.object({
  clientId: z.uuid().optional(),
  subject: z.string().trim().min(2).max(200),
  projectId: z.uuid().optional(),
  assigneeUserId: z.uuid().optional()
});

export const createMessageSchema = z.object({
  conversationId: z.uuid(),
  content: z.string().trim().min(1).max(5000)
});

export const updateConversationAssigneeSchema = z.object({
  assigneeUserId: z.uuid().nullable()
});

export const updateMessageDeliverySchema = z.object({
  status: z.enum(["SENT", "DELIVERED", "READ"]),
  deliveredAt: z.iso.datetime().optional(),
  readAt: z.iso.datetime().optional()
});

export const getConversationNotesQuerySchema = z.object({
  conversationId: z.uuid()
});

export const createConversationNoteSchema = z.object({
  conversationId: z.uuid(),
  content: z.string().trim().min(1).max(5000)
});

export const getConversationEscalationsQuerySchema = z.object({
  conversationId: z.uuid().optional(),
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]).optional()
});

export const createConversationEscalationSchema = z.object({
  conversationId: z.uuid(),
  messageId: z.uuid().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  reason: z.string().trim().min(3).max(1000)
});

export const updateConversationEscalationSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]).optional(),
  ownerAdminId: z.uuid().optional(),
  resolvedAt: z.iso.datetime().optional()
});

export const getMilestoneApprovalsQuerySchema = z.object({
  projectId: z.uuid().optional(),
  clientId: z.uuid().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional()
});

export const updateMilestoneApprovalSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  comment: z.string().trim().max(2000).optional()
});

export const createFileSchema = z.object({
  clientId: z.uuid().optional(),
  fileName: z.string().trim().min(1).max(255),
  storageKey: z.string().trim().min(1).max(512),
  mimeType: z.string().trim().min(3).max(120),
  sizeBytes: z.number().int().positive().max(5_000_000_000)
});

export const issueUploadUrlSchema = z.object({
  clientId: z.uuid().optional(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(3).max(120),
  sizeBytes: z.number().int().positive().max(5_000_000_000)
});

export const confirmUploadSchema = z.object({
  clientId: z.uuid().optional(),
  fileName: z.string().trim().min(1).max(255),
  storageKey: z.string().trim().min(1).max(512),
  mimeType: z.string().trim().min(3).max(120),
  sizeBytes: z.number().int().positive().max(5_000_000_000),
  uploadToken: z.string().trim().min(16).max(2048),
  versionOf: z.string().optional(),
  versionNote: z.string().optional()
});

export const createInvoiceSchema = z.object({
  clientId: z.uuid().optional(),
  number: z.string().trim().min(2).max(64),
  amountCents: z.number().int().positive().max(10_000_000_000),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  status: z.enum(["DRAFT", "ISSUED", "PAID", "OVERDUE", "VOID"]).optional(),
  issuedAt: z.iso.datetime().optional(),
  dueAt: z.iso.datetime().optional()
});

export const createPaymentSchema = z.object({
  clientId: z.uuid().optional(),
  invoiceId: z.uuid(),
  amountCents: z.number().int().positive().max(10_000_000_000),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
  provider: z.string().trim().min(2).max(64).optional(),
  transactionRef: z.string().trim().min(2).max(128).optional(),
  paidAt: z.iso.datetime().optional()
});

export const aiGenerateSchema = z.object({
  clientId: z.uuid().optional(),
  type: z.enum([
    "general",
    "proposal",
    "estimate",
    "summary",
    "project-status-summary",
    "risk-radar",
    "delivery-prediction",
    "budget-forecast",
  ]).optional(),
  prompt: z.string().trim().min(2).max(8000),
  context: z.string().trim().max(16000).optional(),
  projectId: z.uuid().optional(),
  model: z.string().trim().min(2).max(120).optional(),
  temperature: z.number().min(0).max(2).optional()
});

export const aiLeadQualificationSchema = z.object({
  clientId: z.uuid().optional(),
  leadId: z.uuid(),
  prompt: z.string().trim().min(2).max(8000),
  model: z.string().trim().min(2).max(120).optional()
});

export const aiProposalDraftSchema = z.object({
  clientId: z.uuid().optional(),
  leadId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  prompt: z.string().trim().min(2).max(8000),
  model: z.string().trim().min(2).max(120).optional()
});

export const aiEstimateSchema = z.object({
  clientId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  prompt: z.string().trim().min(2).max(8000),
  model: z.string().trim().min(2).max(120).optional()
});

export const analyticsIngestEventSchema = z.object({
  clientId: z.uuid().optional(),
  eventName: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(120).optional(),
  value: z.number().optional(),
  occurredAt: z.iso.datetime().optional(),
  properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

export const analyticsQuerySchema = z.object({
  clientId: z.uuid().optional(),
  eventName: z.string().trim().min(2).max(120).optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  interval: z.enum(["hour", "day", "week", "month"]).optional()
});

export const createNotificationJobSchema = z.object({
  clientId: z.uuid().optional(),
  channel: z.enum(["EMAIL", "SMS", "PUSH"]),
  recipient: z.string().trim().min(3).max(255),
  subject: z.string().trim().min(2).max(200).optional(),
  message: z.string().trim().min(1).max(5000),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  tab: z.enum(["dashboard", "projects", "invoices", "messages", "settings", "operations"]).optional()
});

export const providerCallbackSchema = z.object({
  provider: z.string().trim().min(2).max(64),
  externalId: z.string().trim().min(1).max(200),
  status: z.enum(["queued", "sent", "delivered", "failed"]),
  reason: z.string().trim().max(500).optional()
});

export const getNotificationJobsQuerySchema = z.object({
  unreadOnly: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  tab: z.enum(["dashboard", "projects", "invoices", "messages", "settings", "operations"]).optional()
});

export const setNotificationReadStateSchema = z.object({
  read: z.boolean()
});

export const publicApiKeyIssueSchema = z.object({
  clientId: z.uuid(),
  label: z.string().trim().min(2).max(120)
});

export const publicApiProjectCreateSchema = z.object({
  clientId: z.uuid().optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional()
});

export const publicContactRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase(),
  service: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(5000),
  company: z.string().trim().max(200).optional(),
  companyName: z.string().trim().max(200).optional(),
  budgetRange: z.string().trim().max(60).optional(),
  startedAt: z.iso.datetime().optional(),
  pagePath: z.string().trim().max(256).optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterAdminInput = z.infer<typeof registerAdminSchema>;
export type VerifyAdminOtpInput = z.infer<typeof verifyAdminOtpSchema>;
export type ResendAdminOtpInput = z.infer<typeof resendAdminOtpSchema>;
export type RegisterStaffInput = z.infer<typeof registerStaffSchema>;
export type VerifyStaffPinInput = z.infer<typeof verifyStaffPinSchema>;
export type ApproveStaffRequestInput = z.infer<typeof approveStaffRequestSchema>;
export type RevokeStaffAccessInput = z.infer<typeof revokeStaffAccessSchema>;
export type ProvisionClientAccessInput = z.infer<typeof provisionClientAccessSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateProjectRequestInput = z.infer<typeof createProjectRequestSchema>;
export type DecideProjectRequestInput = z.infer<typeof decideProjectRequestSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type GetProjectQueryInput = z.infer<typeof getProjectQuerySchema>;
export type CreateProjectMilestoneInput = z.infer<typeof createProjectMilestoneSchema>;
export type UpdateProjectMilestoneInput = z.infer<typeof updateProjectMilestoneSchema>;
export type CreateProjectTaskInput = z.infer<typeof createProjectTaskSchema>;
export type UpdateProjectTaskInput = z.infer<typeof updateProjectTaskSchema>;
export type CreateTaskCollaboratorInput = z.infer<typeof createTaskCollaboratorSchema>;
export type UpdateTaskCollaboratorInput = z.infer<typeof updateTaskCollaboratorSchema>;
export type CreateProjectCollaborationNoteInput = z.infer<typeof createProjectCollaborationNoteSchema>;
export type CreateProjectWorkSessionInput = z.infer<typeof createProjectWorkSessionSchema>;
export type UpdateProjectWorkSessionInput = z.infer<typeof updateProjectWorkSessionSchema>;
export type CreateProjectBlockerInput = z.infer<typeof createProjectBlockerSchema>;
export type CreateProjectChangeRequestInput = z.infer<typeof createProjectChangeRequestSchema>;
export type UpdateProjectChangeRequestInput = z.infer<typeof updateProjectChangeRequestSchema>;
export type GetProjectChangeRequestsQueryInput = z.infer<typeof getProjectChangeRequestsQuerySchema>;
export type UpdateProjectBlockerInput = z.infer<typeof updateProjectBlockerSchema>;
export type GetProjectBlockersQueryInput = z.infer<typeof getProjectBlockersQuerySchema>;
export type GetTimelineQueryInput = z.infer<typeof getTimelineQuerySchema>;
export type CreateProjectDependencyInput = z.infer<typeof createProjectDependencySchema>;
export type MarkProjectPaymentMilestoneInput = z.infer<typeof markProjectPaymentMilestoneSchema>;
export type UpsertProjectPreferencesInput = z.infer<typeof upsertProjectPreferencesSchema>;
export type GetProjectPreferencesQueryInput = z.infer<typeof getProjectPreferencesQuerySchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type UpdateClientStatusInput = z.infer<typeof updateClientStatusSchema>;
export type CreateClientContactInput = z.infer<typeof createClientContactSchema>;
export type UpdateClientContactInput = z.infer<typeof updateClientContactSchema>;
export type GetClientQueryInput = z.infer<typeof getClientQuerySchema>;
export type UpsertClientPreferencesInput = z.infer<typeof upsertClientPreferencesSchema>;
export type GetClientPreferencesQueryInput = z.infer<typeof getClientPreferencesQuerySchema>;
export type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type SignProposalInput = z.infer<typeof signProposalSchema>;
export type SubmitOnboardingInput = z.infer<typeof submitOnboardingSchema>;
export type CreateMaintenanceCheckInput = z.infer<typeof createMaintenanceCheckSchema>;
export type CreateSecurityIncidentInput = z.infer<typeof createSecurityIncidentSchema>;
export type CreateReportGeneratedInput = z.infer<typeof createReportGeneratedSchema>;
export type CreateTestimonialReceivedInput = z.infer<typeof createTestimonialReceivedSchema>;
export type CreateClientReengagementInput = z.infer<typeof createClientReengagementSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type BulkUpdateLeadStatusInput = z.infer<typeof bulkUpdateLeadStatusSchema>;
export type MergeLeadsInput = z.infer<typeof mergeLeadsSchema>;
export type UpsertLeadPreferencesInput = z.infer<typeof upsertLeadPreferencesSchema>;
export type GetLeadPreferencesQueryInput = z.infer<typeof getLeadPreferencesQuerySchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateConversationAssigneeInput = z.infer<typeof updateConversationAssigneeSchema>;
export type UpdateMessageDeliveryInput = z.infer<typeof updateMessageDeliverySchema>;
export type GetConversationNotesQuery = z.infer<typeof getConversationNotesQuerySchema>;
export type CreateConversationNoteInput = z.infer<typeof createConversationNoteSchema>;
export type GetConversationEscalationsQuery = z.infer<typeof getConversationEscalationsQuerySchema>;
export type CreateConversationEscalationInput = z.infer<typeof createConversationEscalationSchema>;
export type UpdateConversationEscalationInput = z.infer<typeof updateConversationEscalationSchema>;
export type GetMilestoneApprovalsQuery = z.infer<typeof getMilestoneApprovalsQuerySchema>;
export type UpdateMilestoneApprovalInput = z.infer<typeof updateMilestoneApprovalSchema>;
export type CreateFileInput = z.infer<typeof createFileSchema>;
export type IssueUploadUrlInput = z.infer<typeof issueUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type AiGenerateInput = z.infer<typeof aiGenerateSchema>;
export type AiLeadQualificationInput = z.infer<typeof aiLeadQualificationSchema>;
export type AiProposalDraftInput = z.infer<typeof aiProposalDraftSchema>;
export type AiEstimateInput = z.infer<typeof aiEstimateSchema>;
export type AnalyticsIngestEventInput = z.infer<typeof analyticsIngestEventSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type CreateNotificationJobInput = z.infer<typeof createNotificationJobSchema>;
export type ProviderCallbackInput = z.infer<typeof providerCallbackSchema>;
export type GetNotificationJobsQueryInput = z.infer<typeof getNotificationJobsQuerySchema>;
export type SetNotificationReadStateInput = z.infer<typeof setNotificationReadStateSchema>;
export type PublicApiKeyIssueInput = z.infer<typeof publicApiKeyIssueSchema>;
export type PublicApiProjectCreateInput = z.infer<typeof publicApiProjectCreateSchema>;
export type PublicContactRequestInput = z.infer<typeof publicContactRequestSchema>;
