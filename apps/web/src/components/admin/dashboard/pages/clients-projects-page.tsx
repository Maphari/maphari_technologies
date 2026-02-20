"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createClientContactWithRefresh,
  createClientWithRefresh,
  decideProjectRequestWithRefresh,
  createProjectWithRefresh,
  getClientPreferenceWithRefresh,
  loadClientActivitiesWithRefresh,
  loadClientContactsWithRefresh,
  loadClientDetailWithRefresh,
  loadClientDirectoryWithRefresh,
  loadClientStatusHistoryWithRefresh,
  loadFilesWithRefresh,
  loadProjectChangeRequestsWithRefresh,
  loadProjectRequestsQueueWithRefresh,
  loadStaffUsersWithRefresh,
  provisionClientAccessWithRefresh,
  setClientPreferenceWithRefresh,
  updateProjectChangeRequestWithRefresh,
  updateClientContactWithRefresh,
  updateClientStatusWithRefresh,
  updateClientWithRefresh,
  type AdminClient,
  type AdminFileRecord,
  type ClientActivity,
  type ClientContact,
  type ClientDetail,
  type ClientStatusHistory,
  type ProjectChangeRequest,
  type ProjectRequestQueueItem,
  type StaffAccessUser,
  markProjectPaymentMilestoneWithRefresh,
  loadProjectPaymentMilestonesWithRefresh
} from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import styles from "../../../../app/style/maphari-dashboard.module.css";
import { EmptyState, formatDate, formatMoney } from "./shared";

export function ClientsAndProjectsPage({
  snapshot,
  session,
  onRefreshSnapshot,
  onNotify,
  clock
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  onRefreshSnapshot: (sessionOverride?: AuthSession) => Promise<void>;
  onNotify: (tone: "success" | "error", message: string) => void;
  clock: number;
}) {
  const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const canProvisionClientAccess = session?.user.role === "ADMIN";
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED">("ALL");
  const [tierFilter, setTierFilter] = useState<"ALL" | "STARTER" | "GROWTH" | "ENTERPRISE">("ALL");
  const [sortBy] = useState<"name" | "updatedAt" | "createdAt" | "contractRenewalAt">("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(8);
  const [directoryRows, setDirectoryRows] = useState<AdminClient[]>(snapshot.clients);
  const [directoryTotal, setDirectoryTotal] = useState(snapshot.clients.length);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(snapshot.clients[0]?.id ?? null);
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [clientContacts, setClientContacts] = useState<ClientContact[]>([]);
  const [clientActivities, setClientActivities] = useState<ClientActivity[]>([]);
  const [clientStatusHistory, setClientStatusHistory] = useState<ClientStatusHistory[]>([]);
  const [clientFiles, setClientFiles] = useState<AdminFileRecord[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"overview" | "contacts" | "projects" | "billing" | "files" | "activity" | "changes">("overview");
  const [savedView, setSavedView] = useState("All clients");
  const [changeRequests, setChangeRequests] = useState<ProjectChangeRequest[]>([]);
  const [adminDecisionNotes, setAdminDecisionNotes] = useState<Record<string, string>>({});
  const [projectRequestQueue, setProjectRequestQueue] = useState<ProjectRequestQueueItem[]>([]);
  const [projectRequestNotes, setProjectRequestNotes] = useState<Record<string, string>>({});
  const [staffUsers, setStaffUsers] = useState<StaffAccessUser[]>([]);
  const [requestAssignments, setRequestAssignments] = useState<Record<string, string[]>>({});
  const [milestoneInvoiceIdByProject, setMilestoneInvoiceIdByProject] = useState<Record<string, string>>({});
  const [milestonePaymentIdByProject, setMilestonePaymentIdByProject] = useState<Record<string, string>>({});
  const [projectPaymentMilestones, setProjectPaymentMilestones] = useState<Record<string, { stage: "MILESTONE_30" | "FINAL_20"; paid: boolean }[]>>({});
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const [createName, setCreateName] = useState("");
  const [createOwner, setCreateOwner] = useState("");
  const [createBillingEmail, setCreateBillingEmail] = useState("");
  const [createPriority, setCreatePriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [createTier, setCreateTier] = useState<"STARTER" | "GROWTH" | "ENTERPRISE">("STARTER");

  const [editName, setEditName] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [editBillingEmail, setEditBillingEmail] = useState("");
  const [editTimezone, setEditTimezone] = useState("");
  const [editSlaTier, setEditSlaTier] = useState<"STANDARD" | "PRIORITY" | "ENTERPRISE">("STANDARD");
  const [editSlaHours, setEditSlaHours] = useState(24);
  const [editNotes, setEditNotes] = useState("");
  const [editRenewalAt, setEditRenewalAt] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPrimary, setContactPrimary] = useState(false);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const clientProjects = useMemo(
    () => snapshot.projects.filter((project) => project.clientId === selectedClientId),
    [selectedClientId, snapshot.projects]
  );
  const clientInvoices = useMemo(
    () => snapshot.invoices.filter((invoice) => invoice.clientId === selectedClientId),
    [selectedClientId, snapshot.invoices]
  );
  const clientPayments = useMemo(
    () => snapshot.payments.filter((payment) => payment.clientId === selectedClientId),
    [selectedClientId, snapshot.payments]
  );
  const clientLeads = useMemo(
    () => snapshot.leads.filter((lead) => lead.clientId === selectedClientId),
    [selectedClientId, snapshot.leads]
  );
  const selectedFiles = useMemo(
    () => clientFiles.filter((file) => file.clientId === selectedClientId),
    [clientFiles, selectedClientId]
  );

  const healthScore = useMemo(() => {
    if (!selectedClientId) return 0;
    const overdueCount = clientInvoices.filter((invoice) => invoice.status === "OVERDUE").length;
    const activeProjects = clientProjects.filter((project) => project.status === "IN_PROGRESS").length;
    const wonLeads = clientLeads.filter((lead) => lead.status === "WON").length;
    const lostLeads = clientLeads.filter((lead) => lead.status === "LOST").length;
    const leadDelta = wonLeads - lostLeads;
    const projectScore = Math.min(35, activeProjects * 7);
    const billingScore = Math.max(0, 35 - overdueCount * 12);
    const pipelineScore = Math.max(0, Math.min(30, 15 + leadDelta * 4));
    return Math.max(0, Math.min(100, projectScore + billingScore + pipelineScore));
  }, [clientInvoices, clientLeads, clientProjects, selectedClientId]);

  const billingSummary = useMemo(() => {
    const totalInvoiced = clientInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
    const paid = clientInvoices.filter((invoice) => invoice.status === "PAID").reduce((sum, invoice) => sum + invoice.amountCents, 0);
    const outstanding = clientInvoices.filter((invoice) => invoice.status !== "PAID" && invoice.status !== "VOID").reduce((sum, invoice) => sum + invoice.amountCents, 0);
    const overdue = clientInvoices.filter((invoice) => invoice.status === "OVERDUE").reduce((sum, invoice) => sum + invoice.amountCents, 0);
    return {
      totalInvoiced,
      paid,
      outstanding,
      overdue,
      paymentCount: clientPayments.length
    };
  }, [clientInvoices, clientPayments.length]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const pref = await getClientPreferenceWithRefresh(session, "savedView");
      if (pref.nextSession && pref.data?.value) setSavedView(pref.data.value);
    })();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      setDirectoryLoading(true);
      const directory = await loadClientDirectoryWithRefresh(session, {
        q: query || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        tier: tierFilter === "ALL" ? undefined : tierFilter,
        sortBy,
        sortDir,
        page: pageIndex,
        pageSize
      });
      if (!directory.nextSession) {
        onNotify("error", directory.error?.message ?? "Session expired.");
        setDirectoryLoading(false);
        return;
      }
      if (directory.error) {
        onNotify("error", directory.error.message);
      }
      if (directory.data) {
        setDirectoryRows(directory.data.items);
        setDirectoryTotal(directory.data.total);
        if (!selectedClientId && directory.data.items.length > 0) {
          setSelectedClientId(directory.data.items[0].id);
        }
      }
      setDirectoryLoading(false);
    };
    void load();
  }, [session, query, statusFilter, tierFilter, sortBy, sortDir, pageIndex, pageSize, selectedClientId, onNotify]);

  useEffect(() => {
    if (!session || !selectedClientId) return;
    const load = async () => {
      setDetailsLoading(true);
      const [detail, contacts, activities, history, files] = await Promise.all([
        loadClientDetailWithRefresh(session, selectedClientId),
        loadClientContactsWithRefresh(session, selectedClientId),
        loadClientActivitiesWithRefresh(session, selectedClientId),
        loadClientStatusHistoryWithRefresh(session, selectedClientId),
        loadFilesWithRefresh(session)
      ]);

      const allResults = [detail, contacts, activities, history, files];
      const failed = allResults.find((result) => !result.nextSession);
      if (failed) {
        onNotify("error", failed.error?.message ?? "Session expired.");
        setDetailsLoading(false);
        return;
      }

      if (detail.data) {
        setSelectedClient(detail.data);
        setEditName(detail.data.name);
        setEditOwner(detail.data.ownerName ?? "");
        setEditPriority(detail.data.priority);
        setEditBillingEmail(detail.data.billingEmail ?? "");
        setEditTimezone(detail.data.timezone ?? "");
        setEditSlaTier(detail.data.slaTier);
        setEditSlaHours(detail.data.slaResponseHours);
        setEditNotes(detail.data.notes ?? "");
        setEditRenewalAt(detail.data.contractRenewalAt ? new Date(detail.data.contractRenewalAt).toISOString().slice(0, 16) : "");
      } else {
        setSelectedClient(null);
      }
      setClientContacts(contacts.data ?? []);
      setClientActivities(activities.data ?? []);
      setClientStatusHistory(history.data ?? []);
      setClientFiles(files.data ?? []);
      setDetailsLoading(false);
    };
    void load();
  }, [session, selectedClientId, onNotify]);

  useEffect(() => {
    if (!session || !selectedClientId) return;
    void (async () => {
      const loaded = await loadProjectChangeRequestsWithRefresh(session, { clientId: selectedClientId, limit: 80 });
      if (!loaded.nextSession) {
        onNotify("error", loaded.error?.message ?? "Session expired.");
        return;
      }
      setChangeRequests(loaded.data ?? []);
    })();
  }, [onNotify, selectedClientId, session]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const queued = await loadProjectRequestsQueueWithRefresh(session);
      if (!queued.nextSession) {
        onNotify("error", queued.error?.message ?? "Session expired.");
        return;
      }
      if (queued.error) onNotify("error", queued.error.message);
      setProjectRequestQueue(queued.data ?? []);
    })();
  }, [onNotify, session]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const users = await loadStaffUsersWithRefresh(session);
      if (!users.nextSession) {
        onNotify("error", users.error?.message ?? "Session expired.");
        return;
      }
      if (users.error) onNotify("error", users.error.message);
      setStaffUsers((users.data ?? []).filter((item) => item.isActive && item.role === "STAFF"));
    })();
  }, [onNotify, session]);

  useEffect(() => {
    if (!session || projectRequestQueue.length === 0) return;
    void (async () => {
      const statuses = await Promise.all(
        projectRequestQueue.map(async (request) => {
          const result = await loadProjectPaymentMilestonesWithRefresh(session, request.projectId);
          return [request.projectId, result.data ?? []] as const;
        })
      );
      const next: Record<string, { stage: "MILESTONE_30" | "FINAL_20"; paid: boolean }[]> = {};
      statuses.forEach(([projectId, rows]) => {
        next[projectId] = rows.map((row) => ({ stage: row.stage, paid: row.paid }));
      });
      setProjectPaymentMilestones(next);
    })();
  }, [projectRequestQueue, session]);

  const totalPages = Math.max(1, Math.ceil(directoryTotal / pageSize));

  async function handleCreateClient(): Promise<void> {
    if (!session || !canEdit) return;
    if (!createName.trim()) {
      onNotify("error", "Client name is required.");
      return;
    }
    const created = await createClientWithRefresh(session, {
      name: createName.trim(),
      ownerName: createOwner.trim() || undefined,
      billingEmail: createBillingEmail.trim() || undefined,
      priority: createPriority,
      tier: createTier,
      status: "ONBOARDING"
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to create client.");
      return;
    }
    const inviteEmail = createBillingEmail.trim();
    let nextSession = created.nextSession;
    let inviteMessage = "Client created.";

    if (inviteEmail && canProvisionClientAccess) {
      const provisioned = await provisionClientAccessWithRefresh(nextSession, {
        email: inviteEmail,
        clientId: created.data.id,
        clientName: created.data.name
      });
      if (provisioned.nextSession) nextSession = provisioned.nextSession;
      if (!provisioned.data) {
        onNotify("error", `Client created, but access invite failed: ${provisioned.error?.message ?? "Unknown error"}`);
      } else {
        inviteMessage = "Client created and portal invite sent.";
      }
    } else if (inviteEmail && !canProvisionClientAccess) {
      inviteMessage = "Client created. Ask an admin to send the portal invite.";
    } else {
      inviteMessage = "Client created. Add billing email to send client portal invite automatically.";
    }

    setCreateName("");
    setCreateOwner("");
    setCreateBillingEmail("");
    setCreatePriority("MEDIUM");
    onNotify("success", inviteMessage);
    await onRefreshSnapshot(nextSession);
    setSelectedClientId(created.data.id);
  }

  async function handleSaveClientProfile(): Promise<void> {
    if (!session || !selectedClientId || !canEdit) return;
    const updated = await updateClientWithRefresh(session, selectedClientId, {
      name: editName.trim() || undefined,
      ownerName: editOwner.trim() || undefined,
      priority: editPriority,
      billingEmail: editBillingEmail.trim() || undefined,
      timezone: editTimezone.trim() || undefined,
      slaTier: editSlaTier,
      slaResponseHours: Number.isFinite(editSlaHours) ? editSlaHours : 24,
      notes: editNotes.trim() || undefined,
      contractRenewalAt: editRenewalAt ? new Date(editRenewalAt).toISOString() : null
    });
    if (!updated.nextSession || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to save client profile.");
      return;
    }
    onNotify("success", "Client profile saved.");
    await onRefreshSnapshot(updated.nextSession);
    setSelectedClient((prev) => (prev ? { ...prev, ...updated.data } : prev));
  }

  async function handleStatusChange(nextStatus: "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED"): Promise<void> {
    if (!session || !selectedClientId || !canEdit) return;
    const reason =
      nextStatus === "PAUSED" || nextStatus === "CHURNED"
        ? window.prompt(`Reason for marking client as ${nextStatus}`, "Billing pause / strategic hold")?.trim() ?? ""
        : "";
    const updated = await updateClientStatusWithRefresh(session, selectedClientId, nextStatus, reason || undefined);
    if (!updated.nextSession || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to update client status.");
      return;
    }
    const nextClientStatus = updated.data.status;
    onNotify("success", `Client moved to ${nextStatus}.`);
    await onRefreshSnapshot(updated.nextSession);
    setSelectedClient((prev) => (prev ? { ...prev, status: nextClientStatus } : prev));
  }

  async function handleAddContact(): Promise<void> {
    if (!session || !selectedClientId || !canEdit) return;
    if (!contactName.trim() || !contactEmail.trim()) {
      onNotify("error", "Contact name and email are required.");
      return;
    }
    const created = await createClientContactWithRefresh(session, selectedClientId, {
      name: contactName.trim(),
      email: contactEmail.trim(),
      phone: contactPhone.trim() || undefined,
      role: contactRole.trim() || undefined,
      isPrimary: contactPrimary
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to add contact.");
      return;
    }
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactRole("");
    setContactPrimary(false);
    const contacts = await loadClientContactsWithRefresh(created.nextSession, selectedClientId);
    if (contacts.data) setClientContacts(contacts.data);
    onNotify("success", "Contact added.");
  }

  async function togglePrimaryContact(contact: ClientContact): Promise<void> {
    if (!session || !selectedClientId || !canEdit) return;
    const updated = await updateClientContactWithRefresh(session, selectedClientId, contact.id, {
      isPrimary: true
    });
    if (!updated.nextSession || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to update primary contact.");
      return;
    }
    const contacts = await loadClientContactsWithRefresh(updated.nextSession, selectedClientId);
    if (contacts.data) setClientContacts(contacts.data);
    onNotify("success", "Primary contact updated.");
  }

  async function handleCreateProject(): Promise<void> {
    if (!session || !selectedClientId || !canEdit) return;
    if (!newProjectName.trim()) {
      onNotify("error", "Project name is required.");
      return;
    }
    const created = await createProjectWithRefresh(session, {
      clientId: selectedClientId,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || undefined,
      status: "PLANNING"
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to create project.");
      return;
    }
    setNewProjectName("");
    setNewProjectDesc("");
    onNotify("success", "Project created and linked.");
    await onRefreshSnapshot(created.nextSession);
  }

  async function handleProjectRequestDecision(
    projectId: string,
    decision: "APPROVED" | "REJECTED"
  ): Promise<void> {
    if (!session || !canEdit || processingRequestId) return;
    setProcessingRequestId(projectId);
    const note = projectRequestNotes[projectId]?.trim() ?? "";
    const selectedAssignees = (requestAssignments[projectId] ?? [])
      .map((userId) => staffUsers.find((staff) => staff.id === userId))
      .filter((user): user is StaffAccessUser => Boolean(user));
    const ownerName =
      selectedAssignees.length > 0
        ? selectedAssignees.map((staff) => staff.email.split("@")[0]).join(", ")
        : undefined;
    const assignmentNote =
      selectedAssignees.length > 0
        ? `Assigned staff: ${selectedAssignees.map((staff) => staff.email).join(", ")}.`
        : "";
    const decided = await decideProjectRequestWithRefresh(session, projectId, {
      decision,
      note: [note, assignmentNote].filter(Boolean).join(" ").trim() || undefined,
      ownerName
    });
    setProcessingRequestId(null);
    if (!decided.nextSession || !decided.data) {
      onNotify("error", decided.error?.message ?? "Unable to process project request.");
      return;
    }
    setProjectRequestQueue((previous) => previous.filter((item) => item.projectId !== projectId));
    setProjectRequestNotes((previous) => {
      const next = { ...previous };
      delete next[projectId];
      return next;
    });
    setRequestAssignments((previous) => {
      const next = { ...previous };
      delete next[projectId];
      return next;
    });
    onNotify("success", decision === "APPROVED" ? "Project request approved." : "Project request rejected.");
    await onRefreshSnapshot(decided.nextSession);
  }

  function handleAutoAssign(projectId: string): void {
    if (staffUsers.length === 0) return;
    const picks = [...staffUsers]
      .sort((a, b) => {
        const aLoad = Object.values(requestAssignments).filter((assigned) => assigned.includes(a.id)).length;
        const bLoad = Object.values(requestAssignments).filter((assigned) => assigned.includes(b.id)).length;
        return aLoad - bLoad;
      })
      .slice(0, Math.min(2, staffUsers.length))
      .map((staff) => staff.id);
    setRequestAssignments((previous) => ({ ...previous, [projectId]: picks }));
  }

  async function handleMarkPaymentMilestone(
    projectId: string,
    stage: "MILESTONE_30" | "FINAL_20"
  ): Promise<void> {
    if (!session || !canEdit) return;
    const invoiceId = milestoneInvoiceIdByProject[projectId]?.trim();
    const paymentId = milestonePaymentIdByProject[projectId]?.trim();
    if (!invoiceId || !paymentId) {
      onNotify("error", "Invoice ID and payment ID are required.");
      return;
    }
    const marked = await markProjectPaymentMilestoneWithRefresh(session, projectId, { stage, invoiceId, paymentId });
    if (!marked.nextSession || !marked.data) {
      onNotify("error", marked.error?.message ?? "Unable to mark payment milestone.");
      return;
    }
    const refreshed = await loadProjectPaymentMilestonesWithRefresh(marked.nextSession, projectId);
    if (refreshed.data) {
      setProjectPaymentMilestones((previous) => ({ ...previous, [projectId]: refreshed.data ?? [] }));
    }
    onNotify("success", stage === "MILESTONE_30" ? "30% milestone payment confirmed." : "Final 20% payment confirmed.");
  }

  async function handleAdminChangeDecision(
    changeRequestId: string,
    status: "ADMIN_APPROVED" | "ADMIN_REJECTED"
  ): Promise<void> {
    if (!session) return;
    const note = adminDecisionNotes[changeRequestId]?.trim() ?? "";
    const updated = await updateProjectChangeRequestWithRefresh(session, changeRequestId, {
      status,
      adminDecisionNote: note || undefined
    });
    if (!updated.nextSession || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to update change request.");
      return;
    }
    setChangeRequests((previous) =>
      previous.map((item) => (item.id === changeRequestId ? updated.data! : item))
    );
    onNotify("success", status === "ADMIN_APPROVED" ? "Change request approved." : "Change request rejected.");
  }

  async function handleAdminOverrideStatus(
    changeRequestId: string,
    status: "SUBMITTED" | "ESTIMATED"
  ): Promise<void> {
    if (!session) return;
    const note = adminDecisionNotes[changeRequestId]?.trim() ?? "";
    const updated = await updateProjectChangeRequestWithRefresh(session, changeRequestId, {
      status,
      adminDecisionNote: note || "Admin override applied.",
      forceOverride: true
    });
    if (!updated.nextSession || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to override change request.");
      return;
    }
    setChangeRequests((previous) =>
      previous.map((item) => (item.id === changeRequestId ? updated.data! : item))
    );
    onNotify("success", `Change request moved to ${status}.`);
  }

  async function handleSaveView(): Promise<void> {
    if (!session) return;
    const result = await setClientPreferenceWithRefresh(session, { key: "savedView", value: savedView });
    if (!result.nextSession || !result.data) {
      onNotify("error", result.error?.message ?? "Unable to save view.");
      return;
    }
    onNotify("success", "Saved view updated.");
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Operations</div>
          <div className={styles.projName}>Client Management</div>
          <div className={styles.projMeta}>Directory, lifecycle, contacts, billing posture, documents, and activity in one workspace.</div>
        </div>
      </div>

      <div className={`${styles.statsRow} ${styles.statsRowCols4}`}>
        <div className={`${styles.statCard} ${styles.green}`}><div className={styles.statLabel}>Total Clients</div><div className={styles.statValue}>{snapshot.clients.length}</div><div className={styles.statDelta}>Accounts tracked</div></div>
        <div className={`${styles.statCard} ${styles.red}`}><div className={styles.statLabel}>At Risk</div><div className={styles.statValue}>{snapshot.clients.filter((client) => client.status === "PAUSED" || client.status === "CHURNED").length}</div><div className={`${styles.statDelta} ${styles.deltaDown}`}>Needs intervention</div></div>
        <div className={`${styles.statCard} ${styles.amber}`}><div className={styles.statLabel}>Renewals (45d)</div><div className={styles.statValue}>{snapshot.clients.filter((client) => client.contractRenewalAt && (new Date(client.contractRenewalAt).getTime() - clock) / (24 * 60 * 60 * 1000) <= 45).length}</div><div className={styles.statDelta}>Upcoming contracts</div></div>
        <div className={`${styles.statCard} ${styles.purple}`}><div className={styles.statLabel}>Health Score</div><div className={styles.statValue}>{healthScore}</div><div className={styles.statDelta}>Selected account</div></div>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Project Requests Queue</span>
          <span className={styles.metaMono}>{projectRequestQueue.length} pending</span>
        </div>
        <div className={styles.cardInner}>
          <div className={styles.emptySub} style={{ marginBottom: 10 }}>
            Review signed agreement + deposit, assign staff, then approve or reject.
          </div>
          {projectRequestQueue.length === 0 ? (
            <EmptyState title="No pending project requests" subtitle="Client-submitted requests will appear here for approval." compact />
          ) : (
            <div className={styles.activityList}>
              {projectRequestQueue.map((request) => (
                <div key={request.projectId} className={styles.activityItem} style={{ alignItems: "stretch" }}>
                  <div className={styles.activityDot} style={{ background: "var(--amber)", marginTop: 8 }} />
                  <div className={styles.activityText} style={{ width: "100%" }}>
                    <div className={styles.activityMain}>
                      <strong>{request.name}</strong>
                    </div>
                    <div className={styles.activityTime}>
                      Client {request.clientId.slice(0, 8)} · requested {formatDate(request.requestedAt)} · {request.priority}
                    </div>
                    <div className={styles.emptySub} style={{ marginTop: 6 }}>
                      {request.description ?? "No additional request description."}
                    </div>
                    <div className={styles.toolbarRow} style={{ marginTop: 8 }}>
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>
                        Budget {request.requestDetails?.estimatedQuoteCents ? formatMoney(request.requestDetails.estimatedQuoteCents, "AUTO") : request.estimatedBudgetCents > 0 ? formatMoney(request.estimatedBudgetCents, "AUTO") : "TBD"}
                      </span>
                      {request.requestDetails?.depositAmountCents ? (
                        <span className={`${styles.badge} ${styles.badgeGreen}`}>
                          Deposit paid {formatMoney(request.requestDetails.depositAmountCents, "AUTO")}
                        </span>
                      ) : null}
                      {request.requestDetails?.serviceType ? (
                        <span className={`${styles.badge} ${styles.badgeMuted}`}>
                          Service {request.requestDetails.serviceType}
                        </span>
                      ) : null}
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>
                        Start {request.desiredStartAt ? formatDate(request.desiredStartAt) : "TBD"}
                      </span>
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>
                        Due {request.desiredDueAt ? formatDate(request.desiredDueAt) : "TBD"}
                      </span>
                      {request.requestDetails?.signedAgreementFileName ? (
                        <span className={`${styles.badge} ${styles.badgeMuted}`}>
                          Agreement {request.requestDetails.signedAgreementFileName}
                        </span>
                      ) : null}
                    </div>
                    {request.requestDetails?.scopePrompt ? (
                      <div className={styles.emptySub} style={{ marginTop: 6 }}>
                        Scope: {request.requestDetails.scopePrompt}
                      </div>
                    ) : null}
                    <textarea
                      className={styles.formTextarea}
                      style={{ marginTop: 8 }}
                      placeholder="Decision note (optional)"
                      aria-label={`Decision note for ${request.name}`}
                      value={projectRequestNotes[request.projectId] ?? ""}
                      onChange={(event) =>
                        setProjectRequestNotes((previous) => ({ ...previous, [request.projectId]: event.target.value }))
                      }
                      disabled={!canEdit || processingRequestId === request.projectId}
                    />
                    <div className={styles.cardInner} style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: 10 }}>
                      <div className={styles.emptySub} style={{ marginBottom: 8 }}>
                        Assign staff members (manual or auto).
                      </div>
                      <div className={styles.toolbarRow}>
                        {staffUsers.length === 0 ? (
                          <span className={styles.metaMono}>No active staff users.</span>
                        ) : staffUsers.map((staff) => (
                          <label key={`${request.projectId}-${staff.id}`} className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              aria-label={`Assign ${staff.email} to ${request.name}`}
                              checked={(requestAssignments[request.projectId] ?? []).includes(staff.id)}
                              onChange={(event) => {
                                setRequestAssignments((previous) => {
                                  const current = previous[request.projectId] ?? [];
                                  const next = event.target.checked
                                    ? [...new Set([...current, staff.id])]
                                    : current.filter((id) => id !== staff.id);
                                  return { ...previous, [request.projectId]: next };
                                });
                              }}
                              disabled={!canEdit || processingRequestId === request.projectId}
                            />
                            {staff.email}
                          </label>
                        ))}
                      </div>
                      <div className={styles.toolbarRow} style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className={`${styles.btnSm} ${styles.btnGhost}`}
                          onClick={() => handleAutoAssign(request.projectId)}
                          disabled={!canEdit || staffUsers.length === 0}
                        >
                          Auto pick free staff
                        </button>
                        <span className={styles.metaMono}>
                          Selected {(requestAssignments[request.projectId] ?? []).length}
                        </span>
                      </div>
                    </div>
                    <div className={styles.cardInner} style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: 10 }}>
                      <div className={styles.emptySub} style={{ marginBottom: 8 }}>
                        Payment checkpoints (30% milestone and final 20%) are required before handoff.
                      </div>
                      <div className={styles.toolbarRow}>
                        <input
                          className={styles.formInput}
                          placeholder="Invoice ID"
                          aria-label={`Invoice ID for ${request.name}`}
                          value={milestoneInvoiceIdByProject[request.projectId] ?? ""}
                          onChange={(event) =>
                            setMilestoneInvoiceIdByProject((previous) => ({ ...previous, [request.projectId]: event.target.value }))
                          }
                          disabled={!canEdit}
                        />
                        <input
                          className={styles.formInput}
                          placeholder="Payment ID"
                          aria-label={`Payment ID for ${request.name}`}
                          value={milestonePaymentIdByProject[request.projectId] ?? ""}
                          onChange={(event) =>
                            setMilestonePaymentIdByProject((previous) => ({ ...previous, [request.projectId]: event.target.value }))
                          }
                          disabled={!canEdit}
                        />
                      </div>
                      <div className={styles.toolbarRow} style={{ marginTop: 8 }}>
                        <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => void handleMarkPaymentMilestone(request.projectId, "MILESTONE_30")} disabled={!canEdit}>
                          Mark 30% paid
                        </button>
                        <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => void handleMarkPaymentMilestone(request.projectId, "FINAL_20")} disabled={!canEdit}>
                          Mark final 20% paid
                        </button>
                        <span className={styles.metaMono}>
                          {projectPaymentMilestones[request.projectId]?.find((item) => item.stage === "MILESTONE_30" && item.paid) ? "30% paid" : "30% pending"} ·{" "}
                          {projectPaymentMilestones[request.projectId]?.find((item) => item.stage === "FINAL_20" && item.paid) ? "Final paid" : "Final pending"}
                        </span>
                      </div>
                    </div>
                    <div className={styles.toolbarRow}>
                      <button
                        type="button"
                        className={`${styles.btnSm} ${styles.btnAccent}`}
                        onClick={() => void handleProjectRequestDecision(request.projectId, "APPROVED")}
                        disabled={!canEdit || Boolean(processingRequestId)}
                      >
                        {processingRequestId === request.projectId ? "Processing..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        className={styles.btnSm}
                        onClick={() => void handleProjectRequestDecision(request.projectId, "REJECTED")}
                        disabled={!canEdit || Boolean(processingRequestId)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Client Directory</span>
          <div className={`${styles.toolbarRow} ${styles.toolbarRowNoWrap}`}>
            <input className={styles.searchInput} value={query} onChange={(event) => { setQuery(event.target.value); setPageIndex(1); }} placeholder="Search client, owner, billing email" />
            <select className={styles.selectInput} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPageIndex(1); }}>
              <option value="ALL">All status</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="CHURNED">Churned</option>
            </select>
            <select className={styles.selectInput} value={tierFilter} onChange={(event) => { setTierFilter(event.target.value as typeof tierFilter); setPageIndex(1); }}>
              <option value="ALL">All tiers</option>
              <option value="STARTER">Starter</option>
              <option value="GROWTH">Growth</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => setSortDir((v) => (v === "asc" ? "desc" : "asc"))}>
              Sort {sortDir === "asc" ? "ASC" : "DESC"}
            </button>
          </div>
        </div>

        <table className={styles.projTable}>
          <thead><tr><th>Client</th><th>Tier</th><th>Priority</th><th>Status</th><th>Owner</th><th>Renewal</th><th>Health</th></tr></thead>
          <tbody>
            {directoryRows.length > 0 ? (
              directoryRows.map((client) => {
                const clientInvoiceOutstanding = snapshot.invoices
                  .filter((invoice) => invoice.clientId === client.id && invoice.status !== "PAID" && invoice.status !== "VOID")
                  .reduce((sum, invoice) => sum + invoice.amountCents, 0);
                const scorePenalty = Math.min(35, Math.floor(clientInvoiceOutstanding / 20000));
                const rowScore = Math.max(20, 95 - scorePenalty - (client.status === "PAUSED" || client.status === "CHURNED" ? 20 : 0));
                return (
                  <tr key={client.id} className={selectedClientId === client.id ? styles.selectedRow : ""} onClick={() => setSelectedClientId(client.id)}>
                    <td>
                      <div className={styles.cellStrong}>{client.name}</div>
                      <div className={styles.cellSub}>{client.billingEmail ?? "No billing email"}</div>
                    </td>
                    <td><span className={`${styles.badge} ${styles.badgeMuted}`}>{client.tier}</span></td>
                    <td><span className={`${styles.badge} ${client.priority === "HIGH" ? styles.badgeRed : client.priority === "MEDIUM" ? styles.badgeAmber : styles.badgeGreen}`}>{client.priority}</span></td>
                    <td><span className={`${styles.badge} ${client.status === "ACTIVE" ? styles.badgeGreen : client.status === "ONBOARDING" ? styles.badgeBlue : styles.badgeAmber}`}>{client.status}</span></td>
                    <td>{client.ownerName ?? "Unassigned"}</td>
                    <td>{client.contractRenewalAt ? formatDate(client.contractRenewalAt) : "Not set"}</td>
                    <td>{rowScore}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                  <EmptyState title="No clients in this view" subtitle="This view updates once filters match client records." compact />
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className={styles.paginationRow}>
          <button type="button" className={styles.btnSm} disabled={pageIndex <= 1} onClick={() => setPageIndex((v) => Math.max(1, v - 1))}>Prev</button>
          <span className={styles.metaMono}>Page {pageIndex} / {totalPages}</span>
          <button type="button" className={styles.btnSm} disabled={pageIndex >= totalPages} onClick={() => setPageIndex((v) => Math.min(totalPages, v + 1))}>Next</button>
        </div>
      </article>

      <div className={`${styles.twoCol} ${styles.clientsTopCards}`}>
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Create Client</span>
            {canEdit ? <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleCreateClient()}>Create Client</button> : null}
          </div>
          <div className={styles.cardInner}>
            <div className={styles.createClientIntro}>
              Create a client account first. The system provisions an onboarding project automatically.
            </div>
            <div className={styles.createClientGrid}>
              <input className={styles.formInput} placeholder="Client name" value={createName} onChange={(event) => setCreateName(event.target.value)} disabled={!canEdit} />
              <input className={styles.formInput} placeholder="Account owner" value={createOwner} onChange={(event) => setCreateOwner(event.target.value)} disabled={!canEdit} />
              <input className={styles.formInput} placeholder="Billing email" value={createBillingEmail} onChange={(event) => setCreateBillingEmail(event.target.value)} disabled={!canEdit} />
              <select className={styles.selectInput} value={createPriority} onChange={(event) => setCreatePriority(event.target.value as typeof createPriority)} disabled={!canEdit}>
                <option value="LOW">Low priority</option>
                <option value="MEDIUM">Medium priority</option>
                <option value="HIGH">High priority</option>
              </select>
              <div className={styles.formSpanFull}>
                <select className={styles.selectInput} value={createTier} onChange={(event) => setCreateTier(event.target.value as typeof createTier)} disabled={!canEdit}>
                  <option value="STARTER">Starter</option>
                  <option value="GROWTH">Growth</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
            </div>
            <div className={`${styles.toolbarRow} ${styles.createClientMeta}`}>
              <span className={`${styles.badge} ${styles.badgeMuted}`}>Invite-ready: billing email required</span>
              <span className={`${styles.badge} ${styles.badgeMuted}`}>Default status: ONBOARDING</span>
            </div>
          </div>
          {!canEdit ? <div className={styles.emptySub}>Read-only mode for this role.</div> : null}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Saved View</span>
            <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => void handleSaveView()}>Save</button>
          </div>
          <div className={styles.cardInner}>
            <div className={styles.savedViewStack}>
              <input
                className={`${styles.formInput} ${styles.savedViewInput}`}
                value={savedView}
                onChange={(event) => setSavedView(event.target.value)}
                placeholder="At Risk / Renewals this month / Enterprise"
              />
              <div className={styles.emptySub}>
              Saved views persist server-side per user profile.
              </div>
            </div>
          </div>
        </article>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Document Center</span>
          <span className={styles.metaMono}>Legal templates + signed intake docs</span>
        </div>
        <div className={styles.cardInner}>
          <div className={styles.toolbarRow}>
            <button
              type="button"
              className={`${styles.btnSm} ${styles.btnGhost}`}
              onClick={() => {
                const content = "Master Service Agreement Template\n\nClient:\nScope:\nTerms:\n";
                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "maphari-msa-template.txt";
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                URL.revokeObjectURL(url);
              }}
            >
              Download MSA template
            </button>
            <button
              type="button"
              className={`${styles.btnSm} ${styles.btnGhost}`}
              onClick={() => {
                const content = "Change Request Addendum Template\n\nChange summary:\nCost delta:\nTimeline delta:\n";
                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "maphari-change-request-addendum-template.txt";
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                URL.revokeObjectURL(url);
              }}
            >
              Download addendum template
            </button>
            <span className={styles.metaMono}>
              Signed agreements in queue: {projectRequestQueue.filter((item) => Boolean(item.requestDetails?.signedAgreementFileName)).length}
            </span>
          </div>
          <div className={styles.emptySub} style={{ marginTop: 10 }}>
            Client-request agreements, addendums, and payment milestone references are logged in request activities for audit.
          </div>
        </div>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Client Detail</span>
          <div className={`${styles.toolbarRow} ${styles.toolbarRowNoWrap}`}>
            <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => setSelectedTab("overview")}>Overview</button>
            <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => setSelectedTab("contacts")}>Contacts</button>
            <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => setSelectedTab("projects")}>Projects</button>
            <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => setSelectedTab("billing")}>Billing</button>
            <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => setSelectedTab("files")}>Files</button>
            <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => setSelectedTab("activity")}>Activity</button>
            <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => setSelectedTab("changes")}>Changes</button>
          </div>
        </div>

        {detailsLoading ? (
          <div className={styles.loading}>Loading client detail…</div>
        ) : selectedClient ? (
          <>
            {selectedTab === "overview" ? (
              <div className={styles.formGrid}>
                <input className={styles.formInput} value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Client name" disabled={!canEdit} />
                <input className={styles.formInput} value={editOwner} onChange={(event) => setEditOwner(event.target.value)} placeholder="Account owner" disabled={!canEdit} />
                <input className={styles.formInput} value={editBillingEmail} onChange={(event) => setEditBillingEmail(event.target.value)} placeholder="Billing email" disabled={!canEdit} />
                <input className={styles.formInput} value={editTimezone} onChange={(event) => setEditTimezone(event.target.value)} placeholder="Timezone (e.g. Africa/Johannesburg)" disabled={!canEdit} />
                <select className={styles.selectInput} value={editPriority} onChange={(event) => setEditPriority(event.target.value as typeof editPriority)} disabled={!canEdit}>
                  <option value="LOW">Low priority</option>
                  <option value="MEDIUM">Medium priority</option>
                  <option value="HIGH">High priority</option>
                </select>
                <select className={styles.selectInput} value={editSlaTier} onChange={(event) => setEditSlaTier(event.target.value as typeof editSlaTier)} disabled={!canEdit}>
                  <option value="STANDARD">Standard SLA</option>
                  <option value="PRIORITY">Priority SLA</option>
                  <option value="ENTERPRISE">Enterprise SLA</option>
                </select>
                <input className={styles.formInput} type="number" value={editSlaHours} onChange={(event) => setEditSlaHours(Number(event.target.value))} placeholder="SLA response hours" disabled={!canEdit} />
                <input className={styles.formInput} type="datetime-local" value={editRenewalAt} onChange={(event) => setEditRenewalAt(event.target.value)} disabled={!canEdit} />
                <textarea className={styles.formTextarea} value={editNotes} onChange={(event) => setEditNotes(event.target.value)} placeholder="Internal notes" disabled={!canEdit} />
                <div className={styles.toolbarRow}>
                  {canEdit ? <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleSaveClientProfile()}>Save Profile</button> : null}
                  <button type="button" className={styles.btnSm} onClick={() => void handleStatusChange("ACTIVE")} disabled={!canEdit}>Mark Active</button>
                  <button type="button" className={styles.btnSm} onClick={() => void handleStatusChange("PAUSED")} disabled={!canEdit}>Pause</button>
                  <button type="button" className={styles.btnSm} onClick={() => void handleStatusChange("CHURNED")} disabled={!canEdit}>Mark Churned</button>
                </div>
              </div>
            ) : null}

            {selectedTab === "contacts" ? (
              <>
                <div className={styles.formGrid}>
                  <input className={styles.formInput} placeholder="Contact name" value={contactName} onChange={(event) => setContactName(event.target.value)} disabled={!canEdit} />
                  <input className={styles.formInput} placeholder="Email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} disabled={!canEdit} />
                  <input className={styles.formInput} placeholder="Phone" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} disabled={!canEdit} />
                  <input className={styles.formInput} placeholder="Role tag (Ops, Founder, Finance)" value={contactRole} onChange={(event) => setContactRole(event.target.value)} disabled={!canEdit} />
                  <label className={styles.checkboxRow}><input type="checkbox" checked={contactPrimary} onChange={(event) => setContactPrimary(event.target.checked)} disabled={!canEdit} /> Primary contact</label>
                  {canEdit ? <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleAddContact()}>Add Contact</button> : null}
                </div>
                <table className={styles.projTable}>
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Primary</th></tr></thead>
                  <tbody>
                    {clientContacts.length > 0 ? clientContacts.map((contact) => (
                      <tr key={contact.id}>
                        <td>{contact.name}</td>
                        <td>{contact.email}</td>
                        <td>{contact.phone ?? "—"}</td>
                        <td>{contact.role ?? "—"}</td>
                        <td>{contact.isPrimary ? <span className={`${styles.badge} ${styles.badgeGreen}`}>Primary</span> : canEdit ? <button type="button" className={styles.btnSm} onClick={() => void togglePrimaryContact(contact)}>Set Primary</button> : "No"}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className={styles.emptyCell}><EmptyState title="No contacts yet" subtitle="This section updates once client contacts are added." compact /></td></tr>
                    )}
                  </tbody>
                </table>
              </>
            ) : null}

            {selectedTab === "projects" ? (
              <>
                <div className={styles.cardInner} style={{ marginBottom: 10, border: "1px solid var(--border)", borderRadius: 10 }}>
                  <div className={styles.cardHd} style={{ paddingLeft: 0, paddingRight: 0 }}>
                    <span className={styles.cardHdTitle}>Create Project Manually</span>
                    {canEdit ? <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleCreateProject()}>Create Project</button> : null}
                  </div>
                  <div className={styles.emptySub} style={{ marginBottom: 8 }}>
                    Use this for internal/admin-created projects. Client-submitted requests are handled in the queue above.
                  </div>
                  <div className={styles.formGrid}>
                    <input className={styles.formInput} placeholder="New project name" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} disabled={!canEdit} />
                    <input className={styles.formInput} placeholder="Description" value={newProjectDesc} onChange={(event) => setNewProjectDesc(event.target.value)} disabled={!canEdit} />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.emptySub}>Linked projects for this client:</div>
                </div>
                <table className={styles.projTable}>
                  <thead><tr><th>Project</th><th>Status</th><th>Updated</th></tr></thead>
                  <tbody>
                    {clientProjects.length > 0 ? clientProjects.map((project) => (
                      <tr key={project.id}>
                        <td>{project.name}</td>
                        <td><span className={`${styles.badge} ${project.status === "COMPLETED" ? styles.badgeGreen : styles.badgeAmber}`}>{project.status}</span></td>
                        <td>{formatDate(project.updatedAt)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className={styles.emptyCell}><EmptyState title="No linked projects" subtitle="This section updates once projects are linked to this client." compact /></td></tr>
                    )}
                  </tbody>
                </table>
              </>
            ) : null}

            {selectedTab === "billing" ? (
              <>
                <div className={`${styles.statsRow} ${styles.statsRowCols4}`}>
                  <div className={styles.statCard}><div className={styles.statLabel}>Invoiced</div><div className={styles.statValue}>{formatMoney(billingSummary.totalInvoiced, "AUTO")}</div></div>
                  <div className={styles.statCard}><div className={styles.statLabel}>Paid</div><div className={styles.statValue}>{formatMoney(billingSummary.paid, "AUTO")}</div></div>
                  <div className={styles.statCard}><div className={styles.statLabel}>Outstanding</div><div className={styles.statValue}>{formatMoney(billingSummary.outstanding, "AUTO")}</div></div>
                  <div className={styles.statCard}><div className={styles.statLabel}>Overdue</div><div className={styles.statValue}>{formatMoney(billingSummary.overdue, "AUTO")}</div></div>
                </div>
                <table className={styles.projTable}>
                  <thead><tr><th>Invoice</th><th>Status</th><th>Amount</th><th>Due</th></tr></thead>
                  <tbody>
                    {clientInvoices.length > 0 ? clientInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.number}</td>
                        <td><span className={`${styles.badge} ${invoice.status === "PAID" ? styles.badgeGreen : invoice.status === "OVERDUE" ? styles.badgeRed : styles.badgeAmber}`}>{invoice.status}</span></td>
                        <td>{formatMoney(invoice.amountCents, "AUTO")}</td>
                        <td>{invoice.dueAt ? formatDate(invoice.dueAt) : "—"}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className={styles.emptyCell}><EmptyState title="No invoices yet" subtitle="This section updates once billing records exist for this client." compact /></td></tr>
                    )}
                  </tbody>
                </table>
              </>
            ) : null}

            {selectedTab === "files" ? (
              <table className={styles.projTable}>
                <thead><tr><th>File</th><th>Type</th><th>Uploaded</th><th>Tag</th></tr></thead>
                <tbody>
                  {selectedFiles.length > 0 ? selectedFiles.map((file) => {
                    const lowered = file.fileName.toLowerCase();
                    const tag = lowered.includes("contract") ? "Contract" : lowered.includes("onboarding") ? "Onboarding" : "Asset";
                    return (
                      <tr key={file.id}>
                        <td>{file.fileName}</td>
                        <td>{file.mimeType}</td>
                        <td>{formatDate(file.createdAt)}</td>
                        <td><span className={`${styles.badge} ${styles.badgeMuted}`}>{tag}</span></td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={4} className={styles.emptyCell}><EmptyState title="No documents yet" subtitle="This section updates once client documents are uploaded." compact /></td></tr>
                  )}
                </tbody>
              </table>
            ) : null}

            {selectedTab === "activity" ? (
              <div className={styles.twoCol}>
                <article className={styles.card}>
                  <div className={styles.cardHd}><span className={styles.cardHdTitle}>Activity Timeline</span></div>
                  <div className={styles.activityList}>
                    {clientActivities.length > 0 ? clientActivities.map((entry) => (
                      <div key={entry.id} className={styles.activityItem}>
                        <div className={styles.activityDot} style={{ background: "var(--accent)" }} />
                        <div className={styles.activityText}>
                          <div className={styles.activityMain}>{entry.message}</div>
                          <div className={styles.activityTime}>{formatDate(entry.createdAt)}</div>
                        </div>
                      </div>
                    )) : <EmptyState title="No activity yet" subtitle="This section updates once client events are recorded." compact />}
                  </div>
                </article>
                <article className={styles.card}>
                  <div className={styles.cardHd}><span className={styles.cardHdTitle}>Lifecycle History</span></div>
                  <table className={styles.projTable}>
                    <thead><tr><th>From</th><th>To</th><th>Reason</th><th>When</th></tr></thead>
                    <tbody>
                      {clientStatusHistory.length > 0 ? clientStatusHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.fromStatus ?? "—"}</td>
                          <td>{entry.toStatus}</td>
                          <td>{entry.reason ?? "—"}</td>
                          <td>{formatDate(entry.changedAt)}</td>
                        </tr>
                      )) : <tr><td colSpan={4} className={styles.emptyCell}><EmptyState title="No lifecycle changes" subtitle="This section updates once lifecycle transitions are logged." compact /></td></tr>}
                    </tbody>
                  </table>
                </article>
              </div>
            ) : null}

            {selectedTab === "changes" ? (
              <div className={styles.twoCol}>
                <article className={styles.card}>
                  <div className={styles.cardHd}><span className={styles.cardHdTitle}>Pending Decisions</span></div>
                  <div className={styles.activityList}>
                    {changeRequests
                      .filter((request) => request.status === "ESTIMATED" || request.status === "SUBMITTED")
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .map((request) => (
                        <div key={request.id} className={styles.activityItem}>
                          <div className={styles.activityDot} style={{ background: request.status === "ESTIMATED" ? "var(--amber)" : "var(--purple)" }} />
                          <div className={styles.activityText} style={{ width: "100%" }}>
                            <div className={styles.activityMain}>{request.title}</div>
                            <div className={styles.activityTime}>
                              {request.estimatedHours !== null ? `${request.estimatedHours}h` : "No hours"}
                              {" · "}
                              {request.estimatedCostCents !== null ? formatMoney(request.estimatedCostCents, "AUTO") : "No cost"}
                            </div>
                            <textarea
                              className={styles.formTextarea}
                              style={{ marginTop: 8 }}
                              placeholder="Admin decision note"
                              value={adminDecisionNotes[request.id] ?? ""}
                              onChange={(event) =>
                                setAdminDecisionNotes((previous) => ({ ...previous, [request.id]: event.target.value }))
                              }
                            />
                            <div className={styles.toolbarRow}>
                              <button
                                type="button"
                                className={`${styles.btnSm} ${styles.btnAccent}`}
                                onClick={() => void handleAdminChangeDecision(request.id, "ADMIN_APPROVED")}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className={styles.btnSm}
                                onClick={() => void handleAdminChangeDecision(request.id, "ADMIN_REJECTED")}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {changeRequests.filter((request) => request.status === "ESTIMATED" || request.status === "SUBMITTED").length === 0 ? (
                      <EmptyState title="No pending decisions" subtitle="This section updates once staff submits estimates." compact />
                    ) : null}
                  </div>
                </article>

                <article className={styles.card}>
                  <div className={styles.cardHd}><span className={styles.cardHdTitle}>Decision History</span></div>
                  <table className={styles.projTable}>
                    <thead><tr><th>Request</th><th>Status</th><th>Updated</th><th>Notes</th></tr></thead>
                    <tbody>
                      {changeRequests.length > 0 ? (
                        [...changeRequests]
                          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                          .slice(0, 12)
                          .map((request) => (
                            <tr key={request.id}>
                              <td>{request.title}</td>
                              <td>
                                <span
                                  className={`${styles.badge} ${
                                    request.status === "CLIENT_APPROVED"
                                      ? styles.badgeGreen
                                      : request.status === "ADMIN_REJECTED" || request.status === "CLIENT_REJECTED"
                                      ? styles.badgeRed
                                      : request.status === "ADMIN_APPROVED"
                                      ? styles.badgePurple
                                      : request.status === "ESTIMATED"
                                      ? styles.badgeAmber
                                      : styles.badgeMuted
                                  }`}
                                >
                                  {request.status}
                                </span>
                              </td>
                              <td>{formatDate(request.updatedAt)}</td>
                              <td>
                                {request.clientDecisionNote ?? request.adminDecisionNote ?? request.staffAssessment ?? "—"}
                                {(request.status === "CLIENT_APPROVED" || request.status === "CLIENT_REJECTED" || request.status === "ADMIN_REJECTED") ? (
                                  <div className={styles.toolbarRow} style={{ marginTop: 8 }}>
                                    <button
                                      type="button"
                                      className={`${styles.btnSm} ${styles.btnGhost}`}
                                      onClick={() => void handleAdminOverrideStatus(request.id, "SUBMITTED")}
                                    >
                                      Reopen
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.btnSm}
                                      onClick={() => void handleAdminOverrideStatus(request.id, "ESTIMATED")}
                                    >
                                      Rollback to Estimate
                                    </button>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr><td colSpan={4} className={styles.emptyCell}><EmptyState title="No change requests yet" subtitle="This section updates once client scope changes are submitted." compact /></td></tr>
                      )}
                    </tbody>
                  </table>
                </article>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState title="Select a client" subtitle="Select a client to load account details." />
        )}
      </article>

      {directoryLoading ? <div className={styles.loading}>Refreshing directory…</div> : null}
    </div>
  );
}
