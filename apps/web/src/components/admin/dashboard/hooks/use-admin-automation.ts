"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createNotificationJobWithRefresh,
  getProjectPreferenceWithRefresh,
  loadNotificationJobsWithRefresh,
  loadPublicApiKeysWithRefresh,
  processNotificationQueueWithRefresh,
  setProjectPreferenceWithRefresh,
  type NotificationJob,
  type PartnerApiKey
} from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import type { DashboardToast } from "../../../shared/dashboard-core";

type Snapshot = {
  clients: Array<{ id: string; name: string }>;
  invoices: Array<{ id: string; status: string }>;
  leads: Array<{ id: string; status: string; updatedAt: string }>;
  projects: Array<{ id: string; status: string; updatedAt: string }>;
};

export type UseAdminAutomationReturn = {
  processingQueue: boolean;
  setProcessingQueue: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: "workflow health" | "run controls" | "simulation lab" | "coverage map";
  setActiveTab: React.Dispatch<React.SetStateAction<"workflow health" | "run controls" | "simulation lab" | "coverage map">>;
  statusFilter: "all" | "ACTIVE" | "AT_RISK" | "DRAFT";
  setStatusFilter: React.Dispatch<React.SetStateAction<"all" | "ACTIVE" | "AT_RISK" | "DRAFT">>;
  domainFilter: "all" | "billing" | "sales" | "delivery" | "comms";
  setDomainFilter: React.Dispatch<React.SetStateAction<"all" | "billing" | "sales" | "delivery" | "comms">>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  leadTrigger: "event" | "schedule";
  setLeadTrigger: React.Dispatch<React.SetStateAction<"event" | "schedule">>;
  billingTrigger: "event" | "schedule";
  setBillingTrigger: React.Dispatch<React.SetStateAction<"event" | "schedule">>;
  projectTrigger: "event" | "schedule";
  setProjectTrigger: React.Dispatch<React.SetStateAction<"event" | "schedule">>;
  autoEscalateSla: boolean;
  setAutoEscalateSla: React.Dispatch<React.SetStateAction<boolean>>;
  autoRetryFailures: boolean;
  setAutoRetryFailures: React.Dispatch<React.SetStateAction<boolean>>;
  publishState: "DRAFT" | "REVIEW" | "PUBLISHED";
  setPublishState: React.Dispatch<React.SetStateAction<"DRAFT" | "REVIEW" | "PUBLISHED">>;
  simulationPayload: string;
  setSimulationPayload: React.Dispatch<React.SetStateAction<string>>;
  simulationResult: string | null;
  setSimulationResult: React.Dispatch<React.SetStateAction<string | null>>;
  lastSavedPhase2: string | null;
  integrationsActiveTab: "keys inventory" | "issue key" | "security posture" | "provider map";
  setIntegrationsActiveTab: React.Dispatch<React.SetStateAction<"keys inventory" | "issue key" | "security posture" | "provider map">>;
  integrationsQuery: string;
  setIntegrationsQuery: React.Dispatch<React.SetStateAction<string>>;
  integrationsClientFilter: string;
  setIntegrationsClientFilter: React.Dispatch<React.SetStateAction<string>>;
  queued: number;
  sent: number;
  failed: number;
  latestJobAt: string | null;
  successRate: number;
  failureByChannel: Array<{ channel: string; failed: number; total: number; color: string }>;
  workflowStatus: readonly [
    { id: string; workflow: string; domain: string; trigger: string; state: string; lastRun: string | null; successRate: number },
    { id: string; workflow: string; domain: string; trigger: string; state: string; lastRun: string | null; successRate: number },
    { id: string; workflow: string; domain: string; trigger: string; state: string; lastRun: string | null; successRate: number },
    { id: string; workflow: string; domain: string; trigger: string; state: string; lastRun: string | null; successRate: number }
  ];
  filteredWorkflows: Array<{ id: string; workflow: string; domain: string; trigger: string; state: string; lastRun: string | null; successRate: number }>;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
  handleProcessQueue: () => Promise<void>;
  savePhase2Settings: () => Promise<void>;
  runSimulation: () => void;
  handleQueueNotification: (params: { clientId?: string; channel: "EMAIL" | "SMS" | "PUSH"; recipient: string; subject?: string; message: string; onRefreshSnapshot: (sessionOverride?: AuthSession) => Promise<void> }) => Promise<void>;
  handleRefreshKeys: (sessionOverride: AuthSession | undefined, setPublicApiKeys: React.Dispatch<React.SetStateAction<PartnerApiKey[]>>) => Promise<void>;
};

type Params = {
  session: AuthSession | null;
  snapshot: Snapshot;
  notificationJobs: NotificationJob[];
  setNotificationJobs: React.Dispatch<React.SetStateAction<NotificationJob[]>>;
  pushToast: (tone: DashboardToast["tone"], message: string) => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function readJsonObject(value: string | null | undefined): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function useAdminAutomation({ session, snapshot, notificationJobs, setNotificationJobs, pushToast }: Params): UseAdminAutomationReturn {
  const [processingQueue, setProcessingQueue] = useState(false);

  // AutomationPage state
  type StatusFilter = "all" | "ACTIVE" | "AT_RISK" | "DRAFT";
  type DomainFilter = "all" | "billing" | "sales" | "delivery" | "comms";
  const [activeTab, setActiveTab] = useState<"workflow health" | "run controls" | "simulation lab" | "coverage map">("workflow health");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [search, setSearch] = useState("");
  const [leadTrigger, setLeadTrigger] = useState<"event" | "schedule">("event");
  const [billingTrigger, setBillingTrigger] = useState<"event" | "schedule">("schedule");
  const [projectTrigger, setProjectTrigger] = useState<"event" | "schedule">("event");
  const [autoEscalateSla, setAutoEscalateSla] = useState(true);
  const [autoRetryFailures, setAutoRetryFailures] = useState(true);
  const [publishState, setPublishState] = useState<"DRAFT" | "REVIEW" | "PUBLISHED">("DRAFT");
  const [simulationPayload, setSimulationPayload] = useState("{\"type\":\"invoice.overdue\",\"client\":\"demo\"}");
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [lastSavedPhase2, setLastSavedPhase2] = useState<string | null>(null);

  // IntegrationsPage state
  const [integrationsActiveTab, setIntegrationsActiveTab] = useState<"keys inventory" | "issue key" | "security posture" | "provider map">("keys inventory");
  const [integrationsQuery, setIntegrationsQuery] = useState("");
  const [integrationsClientFilter, setIntegrationsClientFilter] = useState("ALL");

  const jobs = notificationJobs;
  const queued = jobs.filter((job) => job.status === "QUEUED").length;
  const sent = jobs.filter((job) => job.status === "SENT").length;
  const failed = jobs.filter((job) => job.status === "FAILED").length;
  const latestJobAt = jobs.length > 0
    ? jobs.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].updatedAt
    : null;
  const successRate = jobs.length > 0 ? Math.round((sent / jobs.length) * 100) : 0;

  const failureByChannel = useMemo(() => [
    { channel: "EMAIL", failed: jobs.filter((j) => j.channel === "EMAIL" && j.status === "FAILED").length, total: jobs.filter((j) => j.channel === "EMAIL").length, color: "#60a5fa" },
    { channel: "SMS", failed: jobs.filter((j) => j.channel === "SMS" && j.status === "FAILED").length, total: jobs.filter((j) => j.channel === "SMS").length, color: "#f5c518" },
    { channel: "PUSH", failed: jobs.filter((j) => j.channel === "PUSH" && j.status === "FAILED").length, total: jobs.filter((j) => j.channel === "PUSH").length, color: "#a78bfa" }
  ], [jobs]);

  const workflowStatus = useMemo(() => [
    {
      id: "billing-core",
      workflow: "Billing Core",
      domain: "billing",
      trigger: "Invoice due/paid",
      state: snapshot.invoices.length > 0 ? "ACTIVE" : "DRAFT",
      lastRun: latestJobAt,
      successRate: snapshot.invoices.length > 0 ? Math.max(70, successRate) : 0
    },
    {
      id: "lead-followups",
      workflow: "Lead Follow-ups",
      domain: "sales",
      trigger: "Lead inactivity/status",
      state: snapshot.leads.length > 0 ? "ACTIVE" : "DRAFT",
      lastRun: snapshot.leads[0]?.updatedAt ?? null,
      successRate: snapshot.leads.length > 0 ? 92 : 0
    },
    {
      id: "project-alerts",
      workflow: "Project Alerts",
      domain: "delivery",
      trigger: "Task/milestone overdue",
      state: snapshot.projects.length > 0 ? "ACTIVE" : "DRAFT",
      lastRun: snapshot.projects[0]?.updatedAt ?? null,
      successRate: snapshot.projects.length > 0 ? 88 : 0
    },
    {
      id: "notification-delivery",
      workflow: "Notification Delivery",
      domain: "comms",
      trigger: "Queue + callbacks",
      state: failed > 0 ? "AT_RISK" : queued > 0 || sent > 0 ? "ACTIVE" : "DRAFT",
      lastRun: latestJobAt,
      successRate
    }
  ] as const, [snapshot.invoices.length, snapshot.leads, snapshot.projects, latestJobAt, successRate, failed, queued, sent]);

  const filteredWorkflows = useMemo(() => workflowStatus
    .filter((item) => (statusFilter === "all" ? true : item.state === statusFilter))
    .filter((item) => (domainFilter === "all" ? true : item.domain === domainFilter))
    .filter((item) => (search.trim() ? item.workflow.toLowerCase().includes(search.trim().toLowerCase()) : true)),
    [workflowStatus, statusFilter, domainFilter, search]
  );

  // Load phase 2 automation settings
  useEffect(() => {
    if (!session) return;
    void (async () => {
      const pref = await getProjectPreferenceWithRefresh(session, "settingsAutomationPhase2");
      if (!pref.data?.value) return;
      const phase2 = readJsonObject(pref.data.value);
      if (!phase2) return;
      if (phase2.leadTrigger === "event" || phase2.leadTrigger === "schedule") setLeadTrigger(phase2.leadTrigger);
      if (phase2.billingTrigger === "event" || phase2.billingTrigger === "schedule") setBillingTrigger(phase2.billingTrigger);
      if (phase2.projectTrigger === "event" || phase2.projectTrigger === "schedule") setProjectTrigger(phase2.projectTrigger);
      if (typeof phase2.autoEscalateSla === "boolean") setAutoEscalateSla(phase2.autoEscalateSla);
      if (typeof phase2.autoRetryFailures === "boolean") setAutoRetryFailures(phase2.autoRetryFailures);
      if (phase2.publishState === "DRAFT" || phase2.publishState === "REVIEW" || phase2.publishState === "PUBLISHED") setPublishState(phase2.publishState);
      if (typeof phase2.savedAt === "string") setLastSavedPhase2(phase2.savedAt);
    })();
  }, [session]);

  async function handleProcessQueue(): Promise<void> {
    if (!session) return;
    setProcessingQueue(true);
    try {
      const processed = await processNotificationQueueWithRefresh(session);
      if (!processed.nextSession || processed.error) {
        pushToast("error", processed.error?.message ?? "Unable to process notification queue.");
      } else {
        pushToast("success", "Notification queue processed.");
      }
      const jobsResult = await loadNotificationJobsWithRefresh(session);
      if (jobsResult.nextSession && jobsResult.data) {
        setNotificationJobs(jobsResult.data);
      } else if (jobsResult.error?.message) {
        pushToast("error", jobsResult.error.message);
      }
    } finally {
      setProcessingQueue(false);
    }
  }

  async function savePhase2Settings(): Promise<void> {
    if (!session) {
      pushToast("error", "Session required to save phase settings.");
      return;
    }
    const savedAt = new Date().toISOString();
    const payload = {
      leadTrigger,
      billingTrigger,
      projectTrigger,
      autoEscalateSla,
      autoRetryFailures,
      publishState,
      savedAt
    };
    const result = await setProjectPreferenceWithRefresh(session, {
      key: "settingsAutomationPhase2",
      value: JSON.stringify(payload)
    });
    if (!result.nextSession || result.error) {
      pushToast("error", result.error?.message ?? "Unable to save automation phase settings.");
      return;
    }
    setLastSavedPhase2(savedAt);
    pushToast("success", "Automation phase settings saved.");
  }

  function runSimulation(): void {
    try {
      const parsed = JSON.parse(simulationPayload) as Record<string, unknown>;
      const flow = String(parsed.type ?? "generic.event");
      const outcome = autoRetryFailures ? "with retry policy" : "without retry policy";
      const escalation = autoEscalateSla ? "SLA escalation enabled" : "SLA escalation disabled";
      setSimulationResult(`Simulated ${flow}: dispatching actions ${outcome}; ${escalation}.`);
      pushToast("success", "Simulation completed.");
    } catch {
      setSimulationResult("Invalid JSON payload. Fix payload syntax and run again.");
      pushToast("error", "Simulation payload is invalid JSON.");
    }
  }

  async function handleQueueNotification(params: {
    clientId?: string;
    channel: "EMAIL" | "SMS" | "PUSH";
    recipient: string;
    subject?: string;
    message: string;
    onRefreshSnapshot: (sessionOverride?: AuthSession) => Promise<void>;
  }): Promise<void> {
    if (!session) return;
    if (!params.recipient.trim() || !params.message.trim()) {
      pushToast("error", "Recipient and message are required.");
      return;
    }
    const created = await createNotificationJobWithRefresh(session, {
      clientId: params.clientId || undefined,
      channel: params.channel,
      recipient: params.recipient.trim(),
      subject: params.subject?.trim() || undefined,
      message: params.message.trim()
    });
    if (!created.nextSession || !created.data) {
      pushToast("error", created.error?.message ?? "Unable to queue notification.");
      return;
    }
    pushToast("success", "Notification queued.");
    await params.onRefreshSnapshot(created.nextSession);
  }

  async function handleRefreshKeys(
    sessionOverride: AuthSession | undefined,
    setPublicApiKeys: React.Dispatch<React.SetStateAction<PartnerApiKey[]>>
  ): Promise<void> {
    const activeSession = sessionOverride ?? session;
    if (!activeSession) return;
    const keysResult = await loadPublicApiKeysWithRefresh(activeSession);
    if (keysResult.nextSession && keysResult.data) {
      setPublicApiKeys(keysResult.data);
    } else if (keysResult.error?.message) {
      pushToast("error", keysResult.error.message);
    }
  }

  return {
    processingQueue,
    setProcessingQueue,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    domainFilter,
    setDomainFilter,
    search,
    setSearch,
    leadTrigger,
    setLeadTrigger,
    billingTrigger,
    setBillingTrigger,
    projectTrigger,
    setProjectTrigger,
    autoEscalateSla,
    setAutoEscalateSla,
    autoRetryFailures,
    setAutoRetryFailures,
    publishState,
    setPublishState,
    simulationPayload,
    setSimulationPayload,
    simulationResult,
    setSimulationResult,
    lastSavedPhase2,
    integrationsActiveTab,
    setIntegrationsActiveTab,
    integrationsQuery,
    setIntegrationsQuery,
    integrationsClientFilter,
    setIntegrationsClientFilter,
    queued,
    sent,
    failed,
    latestJobAt,
    successRate,
    failureByChannel,
    workflowStatus,
    filteredWorkflows,
    formatDate,
    formatDateTime,
    handleProcessQueue,
    savePhase2Settings,
    runSimulation,
    handleQueueNotification,
    handleRefreshKeys
  };
}
