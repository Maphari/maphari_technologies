"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createNotificationJobWithRefresh, type AdminClient } from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import type { DashboardToast } from "../../../shared/dashboard-core";

type ExperienceStage = "Discovery" | "Planning" | "Delivery" | "Billing" | "Retention";

const experienceStageOrder: ExperienceStage[] = ["Discovery", "Planning", "Delivery", "Billing", "Retention"];

type SupportTicketPriority = "LOW" | "MEDIUM" | "HIGH";
type SupportTicketStatus = "OPEN" | "ESCALATED" | "RESOLVED";

interface SupportTicket {
  id: string;
  clientId: string;
  owner: string;
  description: string;
  slaDueAt: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  nextAction: string;
}

type FeedbackChannel = "Call" | "Email" | "Portal" | "Meeting";

interface FeedbackEntry {
  id: string;
  clientId: string;
  rating: number;
  channel: FeedbackChannel;
  notes: string;
  createdAt: string;
}

function determineExperienceStageForSummary(
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

export type UseAdminSupportReturn = {
  supportTickets: SupportTicket[];
  setSupportTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  ticketClientId: string;
  setTicketClientId: React.Dispatch<React.SetStateAction<string>>;
  ticketDescription: string;
  setTicketDescription: React.Dispatch<React.SetStateAction<string>>;
  ticketOwner: string;
  setTicketOwner: React.Dispatch<React.SetStateAction<string>>;
  ticketPriority: SupportTicketPriority;
  setTicketPriority: React.Dispatch<React.SetStateAction<SupportTicketPriority>>;
  ticketDue: string;
  setTicketDue: React.Dispatch<React.SetStateAction<string>>;
  feedbackClientId: string;
  setFeedbackClientId: React.Dispatch<React.SetStateAction<string>>;
  feedbackRating: number;
  setFeedbackRating: React.Dispatch<React.SetStateAction<number>>;
  feedbackChannel: FeedbackChannel;
  setFeedbackChannel: React.Dispatch<React.SetStateAction<FeedbackChannel>>;
  feedbackNotes: string;
  setFeedbackNotes: React.Dispatch<React.SetStateAction<string>>;
  feedbackEntries: FeedbackEntry[];
  setFeedbackEntries: React.Dispatch<React.SetStateAction<FeedbackEntry[]>>;
  summarySending: boolean;
  openTickets: SupportTicket[];
  escalatedTickets: SupportTicket[];
  slaBreaches: SupportTicket[];
  feedbackCount: number;
  averageRating: number;
  recentFeedback: FeedbackEntry[];
  portalSummary: string;
  handleCreateTicket: () => Promise<void>;
  handleResolveTicket: (ticketId: string) => Promise<void>;
  handleLogFeedback: () => Promise<void>;
};

type Params = {
  session: AuthSession | null;
  snapshot: Snapshot;
  clock: number;
  pushToast: (tone: DashboardToast["tone"], message: string) => void;
};

export function useAdminSupport({ session, snapshot, clock, pushToast }: Params): UseAdminSupportReturn {
  const clientLookup = useMemo(
    () => new Map(snapshot.clients.map((client) => [client.id, client])),
    [snapshot.clients]
  );
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [ticketClientId, setTicketClientId] = useState(snapshot.clients[0]?.id ?? "");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketOwner, setTicketOwner] = useState("");
  const [ticketPriority, setTicketPriority] = useState<SupportTicketPriority>("MEDIUM");
  const [ticketDue, setTicketDue] = useState("");
  const [feedbackClientId, setFeedbackClientId] = useState(snapshot.clients[0]?.id ?? "");
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [feedbackChannel, setFeedbackChannel] = useState<FeedbackChannel>("Call");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [summarySending, setSummarySending] = useState(false);
  const slaAlertedRef = useRef<Set<string>>(new Set());

  // Init defaults
  useEffect(() => {
    if (!ticketClientId && snapshot.clients.length > 0) {
      queueMicrotask(() => setTicketClientId(snapshot.clients[0].id));
    }
    if (!feedbackClientId && snapshot.clients.length > 0) {
      queueMicrotask(() => setFeedbackClientId(snapshot.clients[0].id));
    }
  }, [snapshot.clients, ticketClientId, feedbackClientId]);

  // Derive support tickets
  useEffect(() => {
    if (supportTickets.length > 0) return;
    const derived: SupportTicket[] = [];
    const overdueInvoices = snapshot.invoices.filter((invoice) => invoice.status === "OVERDUE");
    const blockedProjects = snapshot.projects.filter((project) =>
      ["BLOCKED", "DELAYED"].includes(project.status)
    );
    overdueInvoices.slice(0, 2).forEach((invoice) => {
      const client = clientLookup.get(invoice.clientId);
      derived.push({
        id: `ticket-${invoice.id}`,
        clientId: invoice.clientId,
        owner: client?.ownerName ?? "Account Team",
        description: `Collections follow-up for ${invoice.number}`,
        slaDueAt: invoice.dueAt ?? invoice.updatedAt,
        status: "ESCALATED",
        priority: "HIGH",
        createdAt: invoice.updatedAt,
        nextAction: "Confirm payment and notify delivery."
      });
    });
    blockedProjects.slice(0, 1).forEach((project) => {
      const client = clientLookup.get(project.clientId);
      derived.push({
        id: `ticket-${project.id}`,
        clientId: project.clientId,
        owner: project.ownerName ?? client?.ownerName ?? "Delivery",
        description: `Project ${project.name} is ${project.status.toLowerCase()}.`,
        slaDueAt: project.slaDueAt ?? project.dueAt ?? project.updatedAt,
        status: "OPEN",
        priority: "MEDIUM",
        createdAt: project.updatedAt,
        nextAction: "Remove blocker and publish status."
      });
    });
    if (derived.length) {
      queueMicrotask(() => setSupportTickets(derived));
    }
  }, [clientLookup, snapshot.clients, snapshot.invoices, snapshot.projects, supportTickets.length, clock]);

  const openTickets = supportTickets.filter((ticket) => ticket.status !== "RESOLVED");
  const escalatedTickets = supportTickets.filter((ticket) => ticket.status === "ESCALATED");
  const slaBreaches = openTickets.filter((ticket) => {
    if (!ticket.slaDueAt) return false;
    const dueMs = new Date(ticket.slaDueAt).getTime();
    return dueMs < clock;
  });

  // SLA breach notifications
  useEffect(() => {
    if (!session) return;
    const ticketsToNotify = slaBreaches.filter((ticket) => !slaAlertedRef.current.has(ticket.id));
    if (!ticketsToNotify.length) return;
    let active = true;
    void (async () => {
      let sent = 0;
      for (const ticket of ticketsToNotify) {
        if (!active) break;
        const client = clientLookup.get(ticket.clientId);
        const recipientEmail = client?.billingEmail ?? session.user.email ?? "team@maphari";
        const result = await createNotificationJobWithRefresh(session, {
          clientId: ticket.clientId,
          channel: "EMAIL",
          recipient: recipientEmail,
          subject: `SLA breach · ${ticket.priority}`,
          message: `SLA breach detected for ${client?.name ?? "client"}: ${ticket.description}. SLA due ${ticket.slaDueAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(ticket.slaDueAt)) : "soon"}.`,
          metadata: { type: "sla-breach", ticketId: ticket.id, priority: ticket.priority }
        });
        if (result.nextSession && result.data) {
          slaAlertedRef.current.add(ticket.id);
          sent += 1;
        }
      }
      if (!active) return;
      if (sent > 0) {
        pushToast("success", `${sent} SLA breach${sent === 1 ? "" : "es"} synced to the portal bridge.`);
      }
    })();
    return () => {
      active = false;
    };
  }, [slaBreaches, session, clientLookup, pushToast]);

  const feedbackCount = feedbackEntries.length;
  const averageRating =
    feedbackCount === 0 ? 0 : Math.round((feedbackEntries.reduce((sum, entry) => sum + entry.rating, 0) / feedbackCount) * 10) / 10;
  const recentFeedback = [...feedbackEntries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const portalSummary = useMemo(() => {
    const stageCounts = snapshot.clients.reduce<Record<ExperienceStage, number>>(
      (acc, client) => {
        const stage = determineExperienceStageForSummary(client, snapshot);
        acc[stage] = (acc[stage] ?? 0) + 1;
        return acc;
      },
      { Discovery: 0, Planning: 0, Delivery: 0, Billing: 0, Retention: 0 }
    );
    const stageSummary = experienceStageOrder.map((stage) => `${stage}: ${stageCounts[stage] ?? 0}`).join(" · ");
    const windowMs = 1000 * 60 * 60 * 24 * 60;
    const renewalEntries = snapshot.clients
      .map((client) => {
        if (!client.contractRenewalAt) return null;
        const dueMs = new Date(client.contractRenewalAt).getTime();
        const daysUntil = Math.max(0, Math.ceil((dueMs - clock) / (1000 * 60 * 60 * 24)));
        if (dueMs < clock || dueMs - clock > windowMs) return null;
        return { client, daysUntil };
      })
      .filter((entry): entry is { client: AdminClient; daysUntil: number } => Boolean(entry))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
    const renewalSummary = renewalEntries.length
      ? renewalEntries.map((entry) => `${entry.client.name} in ${entry.daysUntil}d`).join(", ")
      : "No renewals within 60 days";
    const feedbackSummary = feedbackCount > 0 ? `${averageRating.toFixed(1)}/5 from ${feedbackCount} entries` : "No feedback logged yet";
    return `Experience snapshot: ${stageSummary}. Support queue: ${openTickets.length} open, ${escalatedTickets.length} escalated, ${slaBreaches.length} SLA breaches. Renewals: ${renewalSummary}. Feedback: ${feedbackSummary}.`;
  }, [snapshot, clock, openTickets.length, escalatedTickets.length, slaBreaches.length, averageRating, feedbackCount]);

  async function handleCreateTicket(): Promise<void> {
    if (!session) {
      pushToast("error", "Session required to create a support ticket.");
      return;
    }
    if (!ticketClientId || !ticketDescription.trim()) {
      pushToast("error", "Select a client and describe the issue.");
      return;
    }
    const newTicket: SupportTicket = {
      id: `support-${Math.random().toString(36).slice(2, 8)}`,
      clientId: ticketClientId,
      owner: ticketOwner || "Client Success",
      description: ticketDescription.trim(),
      slaDueAt: ticketDue || new Date(clock + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "OPEN",
      priority: ticketPriority,
      createdAt: new Date(clock).toISOString(),
      nextAction: "Share next steps with the client and notify delivery."
    };
    setSupportTickets((previous) => [newTicket, ...previous]);
    const client = clientLookup.get(ticketClientId);
    const recipientEmail = client?.billingEmail ?? session.user.email ?? "team@maphari";
    const result = await createNotificationJobWithRefresh(session, {
      clientId: ticketClientId,
      channel: "EMAIL",
      recipient: recipientEmail,
      subject: `Support ticket · ${ticketPriority}`,
      message: `Support ticket created for ${client?.name ?? "client"}: ${ticketDescription.trim()}. SLA due ${new Date(
        newTicket.slaDueAt
      ).toLocaleDateString()}.`,
      metadata: {
        type: "support-ticket",
        ticketId: newTicket.id,
        priority: newTicket.priority
      }
    });
    if (!result.nextSession || !result.data) {
      pushToast("error", result.error?.message ?? "Unable to queue support notification.");
    } else {
      pushToast("success", "Support ticket queued and portal bridge notified.");
      setTicketDescription("");
      setTicketOwner("");
      setTicketDue("");
    }
  }

  async function handleResolveTicket(ticketId: string): Promise<void> {
    if (!session) {
      pushToast("error", "Session required to resolve tickets.");
      return;
    }
    const ticket = supportTickets.find((entry) => entry.id === ticketId);
    if (!ticket) return;
    setSupportTickets((previous) =>
      previous.map((entry) => (entry.id === ticketId ? { ...entry, status: "RESOLVED" } : entry))
    );
    const client = clientLookup.get(ticket.clientId);
    const recipientEmail = client?.billingEmail ?? session.user.email ?? "team@maphari";
    const result = await createNotificationJobWithRefresh(session, {
      clientId: ticket.clientId,
      channel: "EMAIL",
      recipient: recipientEmail,
      subject: `Resolved · ${ticket.description}`,
      message: `Support ticket for ${client?.name ?? "client"} is resolved and a summary is available.`,
      metadata: { type: "support-ticket", ticketId, status: "RESOLVED" }
    });
    if (!result.nextSession || !result.data) {
      pushToast("error", result.error?.message ?? "Unable to notify about the resolved ticket.");
    } else {
      pushToast("success", "Portal bridge notified of the resolved ticket.");
    }
  }

  async function handleLogFeedback(): Promise<void> {
    if (!session) {
      pushToast("error", "Session required to log feedback.");
      return;
    }
    if (!feedbackClientId || !feedbackNotes.trim()) {
      pushToast("error", "Select a client and add feedback.");
      return;
    }
    const entry: FeedbackEntry = {
      id: `feedback-${Math.random().toString(36).slice(2, 8)}`,
      clientId: feedbackClientId,
      rating: feedbackRating,
      channel: feedbackChannel,
      notes: feedbackNotes.trim(),
      createdAt: new Date(clock).toISOString()
    };
    setFeedbackEntries((previous) => [entry, ...previous]);
    const client = clientLookup.get(feedbackClientId);
    const recipientEmail = client?.billingEmail ?? session.user.email ?? "team@maphari";
    const result = await createNotificationJobWithRefresh(session, {
      clientId: feedbackClientId,
      channel: "EMAIL",
      recipient: recipientEmail,
      subject: `Client feedback · ${feedbackRating}/5`,
      message: `Feedback captured for ${client?.name ?? "client"} via ${feedbackChannel}: ${feedbackNotes.trim()}`,
      metadata: { type: "feedback", rating: feedbackRating, channel: feedbackChannel }
    });
    if (!result.nextSession || !result.data) {
      pushToast("error", result.error?.message ?? "Unable to send feedback summary.");
    } else {
      pushToast("success", "Feedback captured and queued for the portal.");
      setFeedbackNotes("");
    }
  }

  return {
    supportTickets,
    setSupportTickets,
    ticketClientId,
    setTicketClientId,
    ticketDescription,
    setTicketDescription,
    ticketOwner,
    setTicketOwner,
    ticketPriority,
    setTicketPriority,
    ticketDue,
    setTicketDue,
    feedbackClientId,
    setFeedbackClientId,
    feedbackRating,
    setFeedbackRating,
    feedbackChannel,
    setFeedbackChannel,
    feedbackNotes,
    setFeedbackNotes,
    feedbackEntries,
    setFeedbackEntries,
    summarySending,
    openTickets,
    escalatedTickets,
    slaBreaches,
    feedbackCount,
    averageRating,
    recentFeedback,
    portalSummary,
    handleCreateTicket,
    handleResolveTicket,
    handleLogFeedback
  };
}
