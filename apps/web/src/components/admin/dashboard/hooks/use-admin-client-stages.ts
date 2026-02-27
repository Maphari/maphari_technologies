"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createNotificationJobWithRefresh, type AdminClient } from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import type { DashboardToast } from "../../../shared/dashboard-core";

type ExperienceStage = "Discovery" | "Planning" | "Delivery" | "Billing" | "Retention";

export const experienceStageDetails: Record<ExperienceStage, { description: string; nextAction: string }> = {
  Discovery: {
    description: "Qualifying the opportunity and assembling the intake so the strategy call lands with clarity.",
    nextAction: "Book the kickoff session and capture intake notes."
  },
  Planning: {
    description: "Contract signed; project plan, roles, and timelines are being staffed and aligned.",
    nextAction: "Confirm milestones and assign delivery leads."
  },
  Delivery: {
    description: "Project work is in flight; we are tracking sprint updates and risks.",
    nextAction: "Publish current milestone status and next steps."
  },
  Billing: {
    description: "Invoices are out for review and payments are being scheduled.",
    nextAction: "Chase outstanding invoices and confirm settle dates."
  },
  Retention: {
    description: "Delivery complete; we are nurturing renewal and value reports.",
    nextAction: "Share impact summary and schedule the next check-in."
  }
};

export const experienceStageOrder: ExperienceStage[] = ["Discovery", "Planning", "Delivery", "Billing", "Retention"];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function determineExperienceStage(
  client: AdminClient,
  snapshot: {
    leads: Array<{ id: string; clientId?: string | null; status: string }>;
    projects: Array<{ id: string; clientId: string; status: string }>;
    invoices: Array<{ id: string; clientId: string; status: string }>;
  }
): ExperienceStage {
  const clientLeads = snapshot.leads.filter((lead) => lead.clientId === client.id);
  const wonLead = clientLeads.some((lead) => lead.status === "WON");
  const clientProjects = snapshot.projects.filter((project) => project.clientId === client.id);
  const activeProject = clientProjects.some((project) =>
    ["IN_PROGRESS", "REVIEW", "PLANNING"].includes(project.status)
  );
  const outstandingInvoice = snapshot.invoices.some(
    (invoice) => invoice.clientId === client.id && invoice.status !== "PAID" && invoice.status !== "VOID"
  );

  if (!wonLead) { return "Discovery"; }
  if (!clientProjects.length) { return "Planning"; }
  if (activeProject) { return "Delivery"; }
  if (outstandingInvoice) { return "Billing"; }
  return "Retention";
}

type Snapshot = {
  clients: AdminClient[];
  leads: Array<{ id: string; clientId?: string | null; status: string }>;
  projects: Array<{
    id: string;
    name: string;
    clientId: string;
    status: string;
    ownerName?: string | null;
    updatedAt: string;
    dueAt?: string | null;
    slaDueAt?: string | null;
  }>;
  invoices: Array<{ id: string; clientId: string; status: string; dueAt?: string | null; updatedAt: string; number: string }>;
};

export type UseAdminClientStagesReturn = {
  selectedClientId: string | null;
  setSelectedClientId: React.Dispatch<React.SetStateAction<string | null>>;
  recipient: string;
  setRecipient: React.Dispatch<React.SetStateAction<string>>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  messageDirty: boolean;
  setMessageDirty: React.Dispatch<React.SetStateAction<boolean>>;
  sending: boolean;
  slaAlertedRef: React.MutableRefObject<Set<string>>;
  renewalAlertedRef: React.MutableRefObject<Set<string>>;
  templateKeyRef: React.MutableRefObject<string>;
  clientLookup: Map<string, AdminClient>;
  stageRows: Array<{ client: AdminClient; stage: ExperienceStage; owner: string; nextAction: string }>;
  riskRows: Array<{ client: AdminClient; overdue: number; blocked: number; stage: ExperienceStage; score: number }>;
  renewalRows: Array<{ client: AdminClient; daysUntil: number; dueDate: string; stage: ExperienceStage }>;
  stageCounts: Record<ExperienceStage, number>;
  sortedRows: Array<{ client: AdminClient; stage: ExperienceStage; owner: string; nextAction: string }>;
  selectedRow: { client: AdminClient; stage: ExperienceStage; owner: string; nextAction: string } | null;
  experienceStageOrder: ExperienceStage[];
  experienceStageDetails: Record<ExperienceStage, { description: string; nextAction: string }>;
  handleBroadcastSummary: (portalSummary: string) => Promise<void>;
  handlePublish: () => Promise<void>;
};

type Params = {
  session: AuthSession | null;
  snapshot: Snapshot;
  clock: number;
  pushToast: (tone: DashboardToast["tone"], message: string) => void;
};

export function useAdminClientStages({ session, snapshot, clock, pushToast }: Params): UseAdminClientStagesReturn {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [messageDirty, setMessageDirty] = useState(false);
  const [sending, setSending] = useState(false);
  const slaAlertedRef = useRef<Set<string>>(new Set());
  const renewalAlertedRef = useRef<Set<string>>(new Set());
  const templateKeyRef = useRef("");

  const clientLookup = useMemo(
    () => new Map(snapshot.clients.map((client) => [client.id, client])),
    [snapshot.clients]
  );

  const stageRows = useMemo(
    () =>
      snapshot.clients.map((client) => {
        const stage = determineExperienceStage(client, snapshot);
        const ownerProject = snapshot.projects.find((project) => project.clientId === client.id);
        const owner = ownerProject?.ownerName ?? client.ownerName ?? "Unassigned";
        return {
          client,
          stage,
          owner,
          nextAction: experienceStageDetails[stage].nextAction
        };
      }),
    [snapshot]
  );

  const riskRows = useMemo(() => {
    return snapshot.clients
      .map((client) => {
        const overdueInvoices = snapshot.invoices.filter((invoice) => invoice.clientId === client.id && invoice.status === "OVERDUE").length;
        const blockedProjects = snapshot.projects.filter(
          (project) => project.clientId === client.id && ["BLOCKED", "DELAYED"].includes(project.status)
        ).length;
        const stage = determineExperienceStage(client, snapshot);
        const score = Math.min(100, overdueInvoices * 14 + blockedProjects * 12 + (client.priority === "HIGH" ? 10 : 0));
        return { client, overdue: overdueInvoices, blocked: blockedProjects, stage, score };
      })
      .filter((entry) => entry.overdue > 0 || entry.blocked > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [snapshot]);

  const renewalRows = useMemo(() => {
    const windowMs = 1000 * 60 * 60 * 24 * 60;
    return snapshot.clients
      .map((client) => {
        if (!client.contractRenewalAt) return null;
        const dueMs = new Date(client.contractRenewalAt).getTime();
        const daysUntil = Math.max(0, Math.ceil((dueMs - clock) / (1000 * 60 * 60 * 24)));
        if (dueMs < clock || dueMs - clock > windowMs) return null;
        const stage = determineExperienceStage(client, snapshot);
        return { client, daysUntil, dueDate: client.contractRenewalAt, stage };
      })
      .filter(
        (entry): entry is { client: AdminClient; daysUntil: number; dueDate: string; stage: ExperienceStage } => Boolean(entry)
      )
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }, [snapshot, clock]);

  // Set selected client
  useEffect(() => {
    if (!stageRows.length) {
      queueMicrotask(() => setSelectedClientId(null));
      return;
    }
    queueMicrotask(() =>
      setSelectedClientId((current) =>
        current && stageRows.some((row) => row.client.id === current) ? current : stageRows[0].client.id
      )
    );
  }, [stageRows]);

  // Load message template
  useEffect(() => {
    if (!selectedClientId) return;
    const row = stageRows.find((entry) => entry.client.id === selectedClientId);
    if (!row) return;
    const templateKey = `${row.client.id}:${row.stage}:${row.client.updatedAt}`;
    queueMicrotask(() => setRecipient(row.client.billingEmail ?? ""));
    if (messageDirty && templateKey === templateKeyRef.current) {
      return;
    }
    templateKeyRef.current = templateKey;
    queueMicrotask(() => {
      setMessage(`Hi ${row.client.name}, ${experienceStageDetails[row.stage].description}`);
      setMessageDirty(false);
    });
  }, [selectedClientId, stageRows, messageDirty]);

  const selectedRow = stageRows.find((row) => row.client.id === selectedClientId) ?? null;

  const stageCounts = useMemo(() => {
    return stageRows.reduce<Record<ExperienceStage, number>>(
      (acc, row) => {
        acc[row.stage] = (acc[row.stage] ?? 0) + 1;
        return acc;
      },
      { Discovery: 0, Planning: 0, Delivery: 0, Billing: 0, Retention: 0 }
    );
  }, [stageRows]);

  const sortedRows = useMemo(
    () =>
      [...stageRows].sort((a, b) => {
        const weight = experienceStageOrder.indexOf(a.stage) - experienceStageOrder.indexOf(b.stage);
        if (weight !== 0) return weight;
        return a.client.name.localeCompare(b.client.name);
      }),
    [stageRows]
  );

  // Renewal notifications
  useEffect(() => {
    if (!session) return;
    const renewalsToNotify = renewalRows.filter((entry) => !renewalAlertedRef.current.has(entry.client.id));
    if (!renewalsToNotify.length) return;
    let active = true;
    void (async () => {
      let sent = 0;
      for (const entry of renewalsToNotify) {
        if (!active) break;
        const recipientEmail = entry.client.billingEmail ?? session.user.email ?? "team@maphari";
        const result = await createNotificationJobWithRefresh(session, {
          clientId: entry.client.id,
          channel: "EMAIL",
          recipient: recipientEmail,
          subject: `Renewal reminder · ${entry.client.name}`,
          message: `Renewal is due in ${entry.daysUntil} day${entry.daysUntil === 1 ? "" : "s"} for ${entry.client.name} (stage ${entry.stage}). Due ${formatDate(entry.dueDate)}.`,
          metadata: { type: "renewal-alert", clientId: entry.client.id, daysUntil: entry.daysUntil }
        });
        if (result.nextSession && result.data) {
          renewalAlertedRef.current.add(entry.client.id);
          sent += 1;
        }
      }
      if (!active) return;
      if (sent > 0) {
        pushToast("success", `${sent} renewal reminder${sent === 1 ? "" : "s"} queued for the portal bridge.`);
      }
    })();
    return () => {
      active = false;
    };
  }, [renewalRows, session, pushToast]);

  async function handlePublish(): Promise<void> {
    if (!session || !selectedRow) {
      pushToast("error", "Session required to publish updates.");
      return;
    }
    if (!recipient.trim()) {
      pushToast("error", "Recipient email is required.");
      return;
    }
    if (!message.trim()) {
      pushToast("error", "Message body cannot be empty.");
      return;
    }
    setSending(true);
    const result = await createNotificationJobWithRefresh(session, {
      clientId: selectedRow.client.id,
      channel: "EMAIL",
      recipient: recipient.trim(),
      subject: `Maphari update · ${selectedRow.stage}`,
      message: message.trim()
    });
    if (!result.nextSession || !result.data) {
      pushToast("error", result.error?.message ?? "Unable to publish client update.");
    } else {
      pushToast("success", "Update queued for the portal bridge.");
    }
    setSending(false);
  }

  async function handleBroadcastSummary(portalSummary: string): Promise<void> {
    if (!session) {
      pushToast("error", "Session required to send the summary broadcast.");
      return;
    }
    const result = await createNotificationJobWithRefresh(session, {
      channel: "EMAIL",
      recipient: session.user.email ?? "team@maphari",
      subject: "Experience digest · Portal bridge",
      message: portalSummary,
      metadata: { type: "experience-summary", totalClients: snapshot.clients.length }
    });
    if (!result.nextSession || !result.data) {
      pushToast("error", result.error?.message ?? "Unable to queue experience summary.");
    } else {
      pushToast("success", "Experience summary queued for the portal bridge.");
    }
  }

  return {
    selectedClientId,
    setSelectedClientId,
    recipient,
    setRecipient,
    message,
    setMessage,
    messageDirty,
    setMessageDirty,
    sending,
    slaAlertedRef,
    renewalAlertedRef,
    templateKeyRef,
    clientLookup,
    stageRows,
    riskRows,
    renewalRows,
    stageCounts,
    sortedRows,
    selectedRow,
    experienceStageOrder,
    experienceStageDetails,
    handleBroadcastSummary,
    handlePublish
  };
}
