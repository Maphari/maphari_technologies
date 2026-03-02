import type { PageId } from "./config";

// Tone system used everywhere for color coding
export type Tone = "accent" | "green" | "amber" | "red" | "purple" | "muted";
export type ExtendedTone = Tone | "blue";

// ── Dashboard Page types ──
export interface DashboardStat {
  id: string;
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: Tone;
  tone: Tone;
}

export interface ConfidenceSummary {
  level: "on-track" | "needs-attention" | "at-risk";
  score: number;
  label: string;
  detail: string;
  nextActions: string[];
}

export interface ActionCenterItem {
  id: string;
  label: string;
  detail: string;
  tone: Tone;
  actionLabel: string;
  targetPage: PageId;
}

export interface ActivityItem {
  id: string;
  icon: string;
  tone: string;
  color: string;
  text: string;
  detail: string;
  time: string;
  timestamp: number;
}

export interface SmartSuggestion {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  actionLabel: string;
  targetPage: PageId;
}

export interface SlaWatchItem {
  id: string;
  projectName: string;
  metric: string;
  status: "breached" | "warning" | "on-track";
  dueAt: string;
}

export interface LoginDigestItem {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
}

// ── Project types ──
export interface ProjectCard {
  id: string;
  name: string;
  status: string;
  statusTone: Tone;
  progressPercent: number;
  progressTone: Tone;
  dueAt: string | null;
  dueTone: Tone;
  budgetCents: number;
  ownerName: string | null;
  riskLevel: string;
  description: string | null;
  milestoneCount: number;
  taskCount: number;
  completedTaskCount: number;
  collaborators: Array<{ name: string; role: string }>;
  scopeOriginal: number;
  scopeCurrent: number;
  scopeDriftPercent: number;
}

export interface ProjectRow {
  id: string;
  name: string;
  status: string;
  statusTone: Tone;
  progressPercent: number;
  progressTone: Tone;
  dueAt: string | null;
  ownerName: string | null;
}

export interface MilestoneRow {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: string;
  statusTone: Tone;
  dueAt: string | null;
  hasFile: boolean;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
}

export interface DeliveryHealth {
  velocity: number;
  blockerCount: number;
  riskLevel: string;
  slaStatus: "on-track" | "warning" | "breached";
}

export interface ScopeTracker {
  originalFeatures: number;
  currentFeatures: number;
  driftPercent: number;
  changeRequestCount: number;
}

export interface TimelineItem {
  id: string;
  title: string;
  detail: string | null;
  category: "PROJECT" | "LEAD" | "BLOCKER";
  createdAt: string;
  tone: Tone;
}

// ── Financial types ──
export interface InvoiceSummaryRow {
  id: string;
  number: string;
  issuedAt: string | null;
  dueAt: string | null;
  amountCents: number;
  currency: string;
  status: string;
  statusTone: Tone;
  paidAt: string | null;
  projectName?: string;
}

export interface BudgetHealth {
  totalBudgetCents: number;
  spentCents: number;
  burnRate: number;
  projectedOverrunCents: number;
  status: "healthy" | "warning" | "critical";
}

export interface RetainerTracker {
  id: string;
  projectName: string;
  totalHours: number;
  consumedHours: number;
  remainingHours: number;
  periodLabel: string;
}

// ── Contract types ──
export interface ContractDocument {
  id: string;
  title: string;
  type: "NDA" | "MSA" | "SOW" | "ADDENDUM" | "IP_TRANSFER" | "OTHER";
  status: "ACTIVE" | "PENDING_SIGNATURE" | "EXPIRED" | "ARCHIVED";
  statusTone: Tone;
  partyA: string;
  partyB: string;
  startAt: string | null;
  endAt: string | null;
  amendments: number;
  fileId: string | null;
}

// ── Message types ──
export interface Thread {
  id: string;
  subject: string;
  projectId: string | null;
  projectName: string;
  lastMessageAt: string;
  status: string;
  senderName: string;
  senderInitials: string;
  avatarBg: string;
  preview: string;
  unread: boolean;
  messageCount: number;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  authorId: string | null;
  authorRole: string | null;
  content: string;
  deliveryStatus: "SENT" | "DELIVERED" | "READ";
  createdAt: string;
  isMine: boolean;
}

// ── Approval types ──
export interface ApprovalQueueItem {
  id: string;
  type: "milestone" | "change_request" | "budget" | "timeline";
  title: string;
  projectName: string;
  projectId: string;
  requestedAt: string;
  requestedBy: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  statusTone: Tone;
  detail: string;
}

export interface ChangeRequestItem {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string | null;
  reason: string | null;
  status: string;
  statusTone: Tone;
  estimatedCostCents: number | null;
  estimatedHours: number | null;
  impactBudget: string | null;
  impactTimeline: string | null;
  impactScope: string | null;
  requestedAt: string;
  requestedBy: string;
}

export interface DecisionLogItem {
  id: string;
  title: string;
  decision: string;
  decidedBy: string;
  decidedAt: string;
  type: "approval" | "rejection" | "info_request";
}

// ── Meeting types ──
export interface MeetingEvent {
  id: string;
  title: string;
  type: "kickoff" | "review" | "standup" | "retrospective" | "ad_hoc";
  date: string;
  time: string;
  duration: string;
  attendees: string[];
  agenda: string[];
  notes: string | null;
  recordingUrl: string | null;
  actionItems: Array<{ text: string; owner: string; done: boolean }>;
  projectName: string;
}

export interface BookingSlot {
  id: string;
  date: string;
  time: string;
  duration: string;
  available: boolean;
}

// ── File types ──
export interface FileItem {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  projectName: string;
  projectId: string | null;
  pinned: boolean;
  version: number;
  comments: number;
}

export interface FileFolder {
  id: string;
  name: string;
  fileCount: number;
  projectId: string | null;
}

export interface HandoffPackage {
  id: string;
  projectName: string;
  version: string;
  format: "json" | "markdown";
  generatedAt: string;
  docs: number;
  decisions: number;
  blockers: number;
  downloadPath: string;
}

// ── Feedback types ──
export interface FeedbackRound {
  id: string;
  projectName: string;
  deliverableTitle: string;
  status: "open" | "resolved" | "in_progress";
  openCount: number;
  resolvedCount: number;
  createdAt: string;
}

export interface FeedbackAnnotation {
  id: string;
  roundId: string;
  x: number;
  y: number;
  content: string;
  priority: "critical" | "minor" | "nice_to_have";
  status: "open" | "resolved";
  author: string;
  createdAt: string;
  replies: Array<{ id: string; content: string; author: string; createdAt: string }>;
}

// ── Report types ──
export interface ReportConfig {
  id: string;
  title: string;
  type: "status" | "roi" | "performance" | "seo" | "uptime" | "finance";
  period: string;
  generatedAt: string;
  downloadUrl: string | null;
  autoEmail: boolean;
}

export interface WebVital {
  metric: string;
  value: number;
  unit: string;
  status: "good" | "needs-improvement" | "poor";
}

export interface UptimeRecord {
  service: string;
  uptimePercent: number;
  lastIncident: string | null;
  status: "operational" | "degraded" | "outage";
}

// ── Support types ──
export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  statusTone: Tone;
  slaDueAt: string | null;
  slaBreached: boolean;
  createdAt: string;
  updatedAt: string;
  satisfactionRating: number | null;
  messages: Array<{ id: string; content: string; authorRole: string; createdAt: string }>;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  helpful: number;
  updatedAt: string;
}

// ── Onboarding types ──
export interface OnboardingSection {
  id: string;
  title: string;
  items: OnboardingChecklistItem[];
}

export interface OnboardingChecklistItem {
  id: string;
  label: string;
  description: string;
  section: string;
  owner: "client" | "maphari";
  required: boolean;
  completed: boolean;
  etaAt: string | null;
  evidence: string | null;
}

// ── Team types ──
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "approver" | "editor" | "viewer";
  status: "active" | "invited" | "suspended";
  twoFactorEnabled: boolean;
  lastActiveAt: string | null;
  joinedAt: string;
}

export interface TeamAuditEntry {
  id: string;
  action: string;
  actorName: string;
  detail: string;
  createdAt: string;
}

// ── Settings types ──
export interface NotificationPreference {
  category: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface ConnectedIntegration {
  id: string;
  name: string;
  status: "connected" | "disconnected";
  connectedAt: string | null;
}

export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActiveAt: string;
  current: boolean;
  icon?: string;
}

// ── Navigation types ──
export interface NavItem {
  id: PageId;
  label: string;
  section?: string;
  badge?: { value: number; tone: "amber" | "red" };
}

// PageId type - re-exported from config for convenience
export type { PageId };
