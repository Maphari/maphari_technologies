"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { broadcastToClientsWithRefresh, createClientWithRefresh, updateClientWithRefresh, updateClientStatusWithRefresh } from "../../../../lib/api/admin/clients";
import { provisionClientAccessWithRefresh } from "../../../../lib/api/admin/staff";
import { decideProjectRequestWithRefresh } from "../../../../lib/api/admin/projects";
import { loadAdminContractsWithRefresh, type LegalContract } from "../../../../lib/api/admin/contracts";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type ViewMode = "list" | "portfolio";
type PageTab = "clients" | "request-inbox";

function formatDate(value?: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-ZA", { month: "short", day: "2-digit" }).format(date);
}

function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}


function healthScore(input: {
  projectInProgress: number;
  projectOverdue: number;
  overdueInvoices: number;
  wonLeads: number;
  lostLeads: number;
}): number {
  const projectScore = Math.max(0, 35 - input.projectOverdue * 9) + Math.min(20, input.projectInProgress * 4);
  const billingScore = Math.max(0, 30 - input.overdueInvoices * 12);
  const growthScore = Math.max(0, Math.min(35, 15 + (input.wonLeads - input.lostLeads) * 6));
  return Math.max(0, Math.min(100, Math.round(projectScore + billingScore + growthScore)));
}

function healthColor(score: number): string {
  if (score >= 80) return "var(--accent)";
  if (score >= 60) return "var(--amber)";
  return "var(--red)";
}

function healthStripCls(score: number): string {
  if (score >= 80) return styles.clmStripAccent;
  if (score >= 60) return styles.clmStripAmber;
  return styles.clmStripRed;
}

function healthFillCls(score: number): string {
  if (score >= 80) return styles.clmFillAccent;
  if (score >= 60) return styles.clmFillAmber;
  return styles.clmFillRed;
}

function statusChipCls(status: string): string {
  if (status === "ACTIVE")     return styles.clmChipGreen;
  if (status === "ONBOARDING") return styles.clmChipAccent;
  if (status === "PAUSED")     return styles.clmChipAmber;
  if (status === "CHURNED")    return styles.clmChipRed;
  return styles.clmChipMuted;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    ONBOARDING: "Onboarding", ACTIVE: "Active",
    PAUSED: "Paused", CHURNED: "Churned"
  };
  return map[status] ?? status;
}

function tierChipCls(tier: string): string {
  if (tier === "ENTERPRISE") return styles.clmTierEnterprise;
  if (tier === "GROWTH")     return styles.clmTierGrowth;
  return styles.clmTierStarter;
}

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
  void clock;

  const [pageTab, setPageTab] = useState<PageTab>("clients");
  const [view, setView] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [contractMap, setContractMap] = useState<Map<string, { hasNda: boolean; ndaSigned: boolean; hasSow: boolean; sowSigned: boolean }>>(new Map());
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED">("ALL");
  const [tierFilter, setTierFilter] = useState<"ALL" | "STARTER" | "GROWTH" | "ENTERPRISE">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(snapshot.clients[0]?.id ?? null);

  // ── Create client modal ────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTier, setNewTier] = useState<"STARTER" | "GROWTH" | "ENTERPRISE">("STARTER");
  const [newStatus, setNewStatus] = useState<"ONBOARDING" | "ACTIVE">("ONBOARDING");
  const [newBillingEmail, setNewBillingEmail] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Edit client ────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTier, setEditTier] = useState<"STARTER" | "GROWTH" | "ENTERPRISE">("STARTER");
  const [editStatus, setEditStatus] = useState<"ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED">("ACTIVE");
  const [editBillingEmail, setEditBillingEmail] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editRenewalAt, setEditRenewalAt] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // ── Broadcast state ────────────────────────────────────────────────────────
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastBusy, setBroadcastBusy] = useState(false);
  const [broadcastError, setBroadcastError] = useState("");
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; total: number } | null>(null);

  // Load all contracts and build a per-client map
  useEffect(() => {
    if (!session) return;
    void loadAdminContractsWithRefresh(session).then((res) => {
      if (res.nextSession) saveSession(res.nextSession);
      if (!res.error && res.data) {
        const map = new Map<string, { hasNda: boolean; ndaSigned: boolean; hasSow: boolean; sowSigned: boolean }>();
        for (const contract of res.data as LegalContract[]) {
          const entry = map.get(contract.clientId) ?? { hasNda: false, ndaSigned: false, hasSow: false, sowSigned: false };
          if (contract.type === "NDA") { entry.hasNda = true; entry.ndaSigned = contract.signed; }
          if (contract.type === "SOW") { entry.hasSow = true; entry.sowSigned = contract.signed; }
          map.set(contract.clientId, entry);
        }
        setContractMap(map);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Sync edit fields whenever selected client changes
  useEffect(() => {
    if (!editMode) return;
    const s = snapshot.clients.find((c) => c.id === selectedId) ?? null;
    if (!s) return;
    setEditName(s.name);
    setEditTier(s.tier as "STARTER" | "GROWTH" | "ENTERPRISE");
    setEditStatus(s.status as "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED");
    setEditBillingEmail(s.billingEmail ?? "");
    setEditOwner(s.ownerName ?? "");
    setEditRenewalAt(s.contractRenewalAt ? s.contractRenewalAt.slice(0, 10) : "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, editMode]);

  function openEdit() {
    const s = clients.find((c) => c.id === selectedId);
    if (!s) return;
    setEditName(s.name);
    setEditTier(s.tier as "STARTER" | "GROWTH" | "ENTERPRISE");
    setEditStatus(s.status as "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED");
    setEditBillingEmail(s.billingEmail ?? "");
    setEditOwner(s.ownerName ?? "");
    setEditRenewalAt(s.contractRenewalAt ? s.contractRenewalAt.slice(0, 10) : "");
    setEditMode(true);
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !newName.trim()) return;
    setCreating(true);
    const r = await createClientWithRefresh(session, {
      name: newName.trim(),
      tier: newTier,
      status: newStatus,
      billingEmail: newBillingEmail.trim() || undefined,
      ownerName: newOwner.trim() || undefined,
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
    } else {
      const clientName = newName.trim();
      const email = newBillingEmail.trim();

      // Auto-provision portal access if a billing email was provided
      if (email && r.data?.id) {
        const activeSession = r.nextSession ?? session;
        const pr = await provisionClientAccessWithRefresh(activeSession, {
          email,
          clientId: r.data.id,
          clientName,
        });
        if (pr.nextSession) saveSession(pr.nextSession);
        if (pr.error) {
          // Client was created but portal access failed — warn but don't block
          onNotify("success", `Client "${clientName}" created. Portal access could not be provisioned: ${pr.error.message}`);
        } else {
          onNotify("success", `Client "${clientName}" created and portal access provisioned for ${email}.`);
        }
      } else {
        onNotify("success", `Client "${clientName}" created successfully.`);
      }

      setShowCreate(false);
      setNewName(""); setNewBillingEmail(""); setNewOwner("");
      setNewTier("STARTER"); setNewStatus("ONBOARDING");
      await onRefreshSnapshot(r.nextSession ?? undefined);
    }
    setCreating(false);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !selectedId) return;
    setEditSaving(true);
    const current = clients.find((c) => c.id === selectedId);
    const updateResult = await updateClientWithRefresh(session, selectedId, {
      name: editName.trim() || undefined,
      tier: editTier,
      billingEmail: editBillingEmail.trim() || undefined,
      ownerName: editOwner.trim() || undefined,
      contractRenewalAt: editRenewalAt || null,
    });
    if (updateResult.nextSession) saveSession(updateResult.nextSession);
    if (updateResult.error) {
      onNotify("error", updateResult.error.message);
      setEditSaving(false);
      return;
    }
    // Update status separately if changed
    if (current && editStatus !== current.status) {
      const statusResult = await updateClientStatusWithRefresh(session, selectedId, editStatus);
      if (statusResult.nextSession) saveSession(statusResult.nextSession);
      if (statusResult.error) {
        onNotify("error", statusResult.error.message);
        setEditSaving(false);
        return;
      }
    }
    onNotify("success", "Client updated successfully.");
    setEditMode(false);
    await onRefreshSnapshot();
    setEditSaving(false);
  }

  async function handleDecision(projectId: string, decision: "APPROVED" | "REJECTED") {
    if (!session) return;
    setDecidingId(projectId);
    const result = await decideProjectRequestWithRefresh(session, projectId, { decision });
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error) {
      onNotify("error", result.error.message);
    } else {
      onNotify("success", `Project ${decision === "APPROVED" ? "approved" : "rejected"} successfully.`);
      await onRefreshSnapshot(result.nextSession ?? undefined);
    }
    setDecidingId(null);
  }

  const handleBroadcast = useCallback(async () => {
    if (!session || selectedClientIds.size === 0) return;
    setBroadcastBusy(true);
    setBroadcastError("");
    const result = await broadcastToClientsWithRefresh(
      session,
      Array.from(selectedClientIds),
      broadcastSubject,
      broadcastBody
    );
    if (result.nextSession) saveSession(result.nextSession);
    if (result.data) {
      setBroadcastResult(result.data);
      setBroadcastOpen(false);
      setSelectedClientIds(new Set());
      setBroadcastSubject("");
      setBroadcastBody("");
    } else {
      setBroadcastError(result.error?.message ?? "Broadcast failed.");
    }
    setBroadcastBusy(false);
  }, [session, selectedClientIds, broadcastSubject, broadcastBody]);

  // ── Derived: projects pending admin decision ───────────────────────────────
  const pendingRequests = useMemo(
    () => snapshot.projects.filter((p) => p.status === "PLANNING"),
    [snapshot.projects]
  );

  const clients = useMemo(() => {
    return snapshot.clients.map((client) => {
      const projects = snapshot.projects.filter((project) => project.clientId === client.id);
      const invoices = snapshot.invoices.filter((invoice) => invoice.clientId === client.id);
      const payments = snapshot.payments.filter((payment) => payment.clientId === client.id);
      const leads = snapshot.leads.filter((lead) => lead.clientId === client.id);

      const inProgress = projects.filter((project) => project.status === "IN_PROGRESS").length;
      const overdueProjects = projects.filter((project) => project.status !== "COMPLETED" && project.dueAt && new Date(project.dueAt).getTime() < Date.now()).length;
      const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
      const wonLeads = leads.filter((lead) => lead.status === "WON").length;
      const lostLeads = leads.filter((lead) => lead.status === "LOST").length;

      const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
      const paidInvoiced = invoices.filter((invoice) => invoice.status === "PAID").reduce((sum, invoice) => sum + invoice.amountCents, 0);
      const outstandingInvoiced = invoices.filter((invoice) => invoice.status !== "PAID" && invoice.status !== "VOID").reduce((sum, invoice) => sum + invoice.amountCents, 0);

      return {
        ...client,
        health: healthScore({
          projectInProgress: inProgress,
          projectOverdue: overdueProjects,
          overdueInvoices,
          wonLeads,
          lostLeads
        }),
        inProgress,
        overdueProjects,
        overdueInvoices,
        wonLeads,
        lostLeads,
        totalInvoiced,
        paidInvoiced,
        outstandingInvoiced,
        paymentsCount: payments.length,
        renewalDays: daysUntil(client.contractRenewalAt),
        projectsCount: projects.length,
        invoicesCount: invoices.length,
        leadsCount: leads.length
      };
    });
  }, [snapshot.clients, snapshot.invoices, snapshot.leads, snapshot.payments, snapshot.projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((client) => {
      if (statusFilter !== "ALL" && client.status !== statusFilter) return false;
      if (tierFilter !== "ALL" && client.tier !== tierFilter) return false;
      if (!q) return true;
      return (
        client.name.toLowerCase().includes(q) ||
        (client.ownerName ?? "").toLowerCase().includes(q) ||
        (client.billingEmail ?? "").toLowerCase().includes(q)
      );
    });
  }, [clients, query, statusFilter, tierFilter]);

  const selected = filtered.find((client) => client.id === selectedId) ?? clients.find((client) => client.id === selectedId) ?? null;

  const avgHealth = filtered.length > 0 ? Math.round(filtered.reduce((sum, c) => sum + c.health, 0) / filtered.length) : 0;
  const atRisk = filtered.filter((c) => c.health < 60).length;
  const renewals30d = filtered.filter((c) => c.renewalDays !== null && c.renewalDays <= 30).length;
  const totalOutstanding = filtered.reduce((sum, c) => sum + c.outstandingInvoiced, 0);

  const total = clients.length || 1;
  const statusCounts = {
    ACTIVE:     clients.filter((c) => c.status === "ACTIVE").length,
    ONBOARDING: clients.filter((c) => c.status === "ONBOARDING").length,
    PAUSED:     clients.filter((c) => c.status === "PAUSED").length,
    CHURNED:    clients.filter((c) => c.status === "CHURNED").length,
    atRisk:     clients.filter((c) => c.health < 60).length,
  };

  return (
    <div className={styles.pageBody}>

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / OPERATIONS</div>
          <h1 className={styles.pageTitle}>Client Management</h1>
          <div className={styles.pageSub}>Account health &middot; Renewal readiness &middot; Billing exposure</div>
        </div>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={cx("btnSm", pageTab === "request-inbox" ? "btnAccent" : "btnGhost")}
            onClick={() => setPageTab((t) => t === "request-inbox" ? "clients" : "request-inbox")}
          >
            {pendingRequests.length > 0 ? `📥 Request Inbox (${pendingRequests.length})` : "📥 Request Inbox"}
          </button>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowCreate(true)}>+ Add Client</button>
        </div>
      </div>

      {/* ── Request Inbox ──────────────────────────────────────────────────── */}
      {pageTab === "request-inbox" && (
        <div className={cx("flexCol", "gap16", "mb28")}>
          <div className={cx(styles.card)}>
            <div className={styles.cardHd}>
              <span className={styles.cardHdTitle}>Project Request Inbox</span>
              <span className={cx("badge", pendingRequests.length > 0 ? "badgeAmber" : "badgeMuted")}>
                {pendingRequests.length} pending
              </span>
            </div>
            <div className={styles.cardInner}>
              {pendingRequests.length === 0 ? (
                <div className={cx("textCenter", "py16")}>
                  <div className={cx("text13", "mb4")}>No pending project requests</div>
                  <div className={cx("text12", "colorMuted")}>All client project requests have been reviewed.</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Project</th>
                      <th scope="col">Client</th>
                      <th scope="col">Owner</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Submitted</th>
                      <th scope="col">Budget</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((p) => {
                      const client = snapshot.clients.find((c) => c.id === p.clientId);
                      const isDeciding = decidingId === p.id;
                      return (
                        <tr key={p.id}>
                          <td className={cx("fw600")}>{p.name}</td>
                          <td className={cx("colorMuted")}>{client?.name ?? p.clientId.slice(0, 8)}</td>
                          <td className={cx("text12")}>{p.ownerName ?? "—"}</td>
                          <td>
                            <span className={cx("badge",
                              p.priority === "HIGH" ? "badgeRed" :
                              p.priority === "MEDIUM" ? "badgeAmber" : "badgeMuted"
                            )}>{p.priority}</span>
                          </td>
                          <td className={cx("text12", "colorMuted")}>
                            {new Date(p.createdAt).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                          </td>
                          <td className={cx("fontMono", "text12")}>
                            {p.budgetCents ? formatMoneyCents(Number(p.budgetCents), { maximumFractionDigits: 0 }) : "—"}
                          </td>
                          <td>
                            <div className={cx("flex", "gap8")}>
                              <button
                                type="button"
                                className={cx("btnSm", "btnAccent")}
                                onClick={() => void handleDecision(p.id, "APPROVED")}
                                disabled={isDeciding}
                              >
                                {isDeciding ? "…" : "Approve"}
                              </button>
                              <button
                                type="button"
                                className={cx("btnSm", "btnGhost")}
                                onClick={() => void handleDecision(p.id, "REJECTED")}
                                disabled={isDeciding}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4 KPI cards ── */}
      <div className={styles.clmKpiGrid}>
        {([
          { label: "Total Accounts", value: filtered.length.toString(),        meta: `${filtered.filter((c) => c.status === "ACTIVE").length} active`,  color: "var(--accent)" },
          { label: "Avg Health",     value: avgHealth.toString(),               meta: `${atRisk} at risk (<60)`,                                         color: "var(--blue)"   },
          { label: "Renewals (30d)", value: renewals30d.toString(),             meta: "Needs retention plan",                                            color: "var(--amber)"  },
          { label: "Open Exposure",  value: formatMoneyCents(totalOutstanding, { maximumFractionDigits: 0 }),     meta: "Unpaid invoice exposure",                                         color: "var(--red)"    },
        ] as const).map((kpi) => (
          <div key={kpi.label} className={cx(styles.clmKpiCard, toneClass(kpi.color))}>
            <div className={styles.clmKpiLabel}>{kpi.label}</div>
            <div className={cx(styles.clmKpiValue, toneClass(kpi.color))}>{kpi.value}</div>
            <div className={styles.clmKpiMeta}>{kpi.meta}</div>
          </div>
        ))}
      </div>

      {/* ── Status rail ── */}
      <div className={styles.clmStatusRail}>
        {([
          { label: "Active",     count: statusCounts.ACTIVE,     strip: styles.clmStripGreen  },
          { label: "Onboarding", count: statusCounts.ONBOARDING, strip: styles.clmStripAccent },
          { label: "Paused",     count: statusCounts.PAUSED,     strip: styles.clmStripAmber  },
          { label: "Churned",    count: statusCounts.CHURNED,    strip: styles.clmStripRed    },
          { label: "At Risk",    count: statusCounts.atRisk,     strip: styles.clmStripBlue   },
        ] as const).map((tile) => (
          <div key={tile.label} className={`${styles.clmStatusTile} ${tile.strip}`}>
            <div className={styles.clmStatusTileLabel}>{tile.label}</div>
            <div className={styles.clmStatusTileCount}>{tile.count}</div>
            <div className={styles.clmStatusTilePct}>{Math.round((tile.count / total) * 100)}% of accounts</div>
          </div>
        ))}
      </div>

      {/* ── Broadcast result toast ── */}
      {broadcastResult ? (
        <div className={cx("flexRow", "gap8", "mb8")}>
          <span className={cx("badge", "badgeGreen")}>
            Sent to {broadcastResult.sent} of {broadcastResult.total} client{broadcastResult.total !== 1 ? "s" : ""}.
          </span>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => setBroadcastResult(null)}
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* ── Filter bar ── */}
      <div className={styles.clmFilters}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search client, owner, billing email…"
          className={cx("formInput", styles.clmSearchInput)}
        />
        <select title="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={styles.filterSelect}>
          <option value="ALL">All status</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="CHURNED">Churned</option>
        </select>
        <select title="Filter by tier" value={tierFilter} onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)} className={styles.filterSelect}>
          <option value="ALL">All tiers</option>
          <option value="STARTER">Starter</option>
          <option value="GROWTH">Growth</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        <select title="Select view mode" value={view} onChange={(e) => setView(e.target.value as ViewMode)} className={cx(styles.filterSelect, "mlAuto")}>
          <option value="list">List</option>
          <option value="portfolio">Portfolio</option>
        </select>
        {selectedClientIds.size > 0 ? (
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={() => setBroadcastOpen(true)}
          >
            Broadcast ({selectedClientIds.size})
          </button>
        ) : null}
      </div>

      {/* ── Main split layout ── */}
      <div className={styles.clmLayout}>

        {/* Left pane */}
        <div>
          {view === "list" ? (
            <div className={styles.clmSection}>
              <div className={styles.clmSectionHeader}>
                <span className={styles.clmSectionTitle}>All Clients</span>
                <span className={styles.clmSectionMeta}>{filtered.length} ACCOUNTS</span>
              </div>
              <div className={styles.clmListHead}>
                <span>
                  <input
                    type="checkbox"
                    title="Select all clients"
                    checked={filtered.length > 0 && filtered.every((c) => selectedClientIds.has(c.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClientIds(new Set(filtered.map((c) => c.id)));
                      } else {
                        setSelectedClientIds((prev) => {
                          const next = new Set(prev);
                          filtered.forEach((c) => next.delete(c.id));
                          return next;
                        });
                      }
                    }}
                  />
                </span>
                <span>Client</span>
                <span>Status</span>
                <span>Tier</span>
                <span>Contracts</span>
                <span>Health</span>
                <span>Projects</span>
                <span>Renewal</span>
                <span />
              </div>
              {filtered.map((client) => {
                const hColor = healthColor(client.health);
                const rTone = client.renewalDays !== null && client.renewalDays <= 30 ? "var(--amber)" : "var(--muted)";
                return (
                  <div
                    key={client.id}
                    className={`${styles.clmClientRow} ${healthStripCls(client.health)}${client.id === selectedId ? ` ${styles.clmClientSelected}` : ""}`}
                    onClick={() => setSelectedId(client.id)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        title={`Select ${client.name}`}
                        checked={selectedClientIds.has(client.id)}
                        onChange={(e) => {
                          setSelectedClientIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) {
                              next.add(client.id);
                            } else {
                              next.delete(client.id);
                            }
                            return next;
                          });
                        }}
                      />
                    </div>
                    <div>
                      <div className={styles.clmClientName}>{client.name}</div>
                      <div className={styles.clmClientOwner}>{client.ownerName ?? "Unassigned"}</div>
                    </div>
                    <span className={`${styles.clmStatusChip} ${statusChipCls(client.status)}`}>{statusLabel(client.status)}</span>
                    <span className={`${styles.clmTierChip} ${tierChipCls(client.tier)}`}>{client.tier}</span>
                    {/* Contract status column */}
                    {(() => {
                      const cs = contractMap.get(client.id);
                      if (!cs) return <span className={cx("text10", "colorMuted2")}>No docs</span>;
                      return (
                        <div className={cx("flexRow", "gap4", "flexWrap")}>
                          {cs.hasNda && (
                            <span className={cx("badge", cs.ndaSigned ? "badgeGreen" : "badgeAmber")}>
                              NDA {cs.ndaSigned ? "✓" : "⚠"}
                            </span>
                          )}
                          {cs.hasSow && (
                            <span className={cx("badge", cs.sowSigned ? "badgeGreen" : "badgeAmber")}>
                              SOW {cs.sowSigned ? "✓" : "⚠"}
                            </span>
                          )}
                          {!cs.hasNda && !cs.hasSow && <span className={cx("text10", "colorMuted2")}>No docs</span>}
                        </div>
                      );
                    })()}
                    <div className={styles.clmHealthCell}>
                      <span className={cx(styles.clmHealthVal, toneClass(hColor))}>{client.health}</span>
                      <div className={styles.clmHealthTrack}>
                        <div className={`${styles.clmHealthFill} ${healthFillCls(client.health)}`} style={{ "--pct": `${client.health}%` } as CSSProperties} />
                      </div>
                    </div>
                    <span className={styles.clmCellMono}>{client.projectsCount}</span>
                    <span className={cx(styles.clmCellMono, toneClass(rTone))}>
                      {client.renewalDays === null ? "—" : `${client.renewalDays}d`}
                    </span>
                    <div className={cx("flexRow", "gap4")}>
                      {contractMap.get(client.id) &&
                        (!contractMap.get(client.id)!.ndaSigned || !contractMap.get(client.id)!.sowSigned) && (
                          <button
                            type="button"
                            className={cx("btnSm", "btnGhost")}
                            onClick={(e) => { e.stopPropagation(); onNotify("success", `Contract reminder sent to ${client.name}.`); }}
                          >
                            Remind
                          </button>
                        )}
                      <button
                        type="button"
                        className={styles.clmOpenBtn}
                        onClick={(e) => { e.stopPropagation(); setSelectedId(client.id); }}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                );
              })}
                      {filtered.length === 0 && query === "" && statusFilter === "ALL" && tierFilter === "ALL" ? (
                <div className={styles.clmEmptyState}>
                  <div className={styles.clmEmptyIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className={styles.clmEmptyTitle}>No clients yet</div>
                  <div className={styles.clmEmptySub}>Add your first client to start tracking accounts, health, and billing.</div>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowCreate(true)}>+ Add your first client</button>
                </div>
              ) : filtered.length === 0 ? (
                <div className={styles.clmEmpty}>No clients match current filters.</div>
              ) : null}
            </div>
          ) : (
            <div className={styles.clmPortfolioGrid}>
              {filtered.map((client) => {
                const hColor = healthColor(client.health);
                const overdueColor = client.overdueInvoices > 0 ? "var(--red)" : "var(--accent)";
                return (
                  <div
                    key={client.id}
                    className={`${styles.clmPortfolioCard} ${healthStripCls(client.health)}${client.id === selectedId ? ` ${styles.clmPortfolioSelected}` : ""}`}
                    onClick={() => setSelectedId(client.id)}
                  >
                    <div className={styles.clmPortfolioHeader}>
                      <div>
                        <div className={styles.clmPortfolioName}>{client.name}</div>
                        <div className={styles.clmPortfolioOwner}>{client.ownerName ?? "Unassigned"}</div>
                      </div>
                      <span className={`${styles.clmStatusChip} ${statusChipCls(client.status)}`}>{statusLabel(client.status)}</span>
                    </div>
                    <div className={styles.clmPortfolioHealthRow}>
                      <span className={styles.clmPortfolioHealthLabel}>Health</span>
                      <span className={cx(styles.clmHealthVal, toneClass(hColor))}>{client.health}</span>
                    </div>
                    <div className={styles.clmHealthTrack}>
                      <div className={`${styles.clmHealthFill} ${healthFillCls(client.health)}`} style={{ "--pct": `${client.health}%` } as CSSProperties} />
                    </div>
                    <div className={styles.clmPortfolioMeta}>
                      <div className={styles.clmPortfolioMetaCell}>
                        <div className={styles.clmPortfolioMetaLabel}>Projects</div>
                        <div className={styles.clmPortfolioMetaVal}>{client.projectsCount}</div>
                      </div>
                      <div className={styles.clmPortfolioMetaCell}>
                        <div className={styles.clmPortfolioMetaLabel}>Overdue</div>
                        <div className={cx(styles.clmPortfolioMetaVal, toneClass(overdueColor))}>{client.overdueInvoices}</div>
                      </div>
                      <div className={styles.clmPortfolioMetaCell}>
                        <div className={styles.clmPortfolioMetaLabel}>Tier</div>
                        <span className={`${styles.clmTierChip} ${tierChipCls(client.tier)}`}>{client.tier}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <div className={styles.clmEmpty}>No clients match current filters.</div>}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className={styles.clmDetailPanel}>
          <div className={styles.clmDetailHeader}>
            <span className={styles.clmDetailTitle}>Account Detail</span>
            <div className={cx("flexRow", "gap8")}>
              {selected && !editMode && (
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={openEdit}>Edit</button>
              )}
              <span className={styles.clmDetailId}>{selected?.id.slice(0, 8) ?? "—"}</span>
            </div>
          </div>
          <div className={styles.clmDetailBody}>
            {selected ? (
              editMode ? (
                <form onSubmit={handleSaveEdit} className={styles.modalBody}>
                  <label className={styles.fieldLabel}>Client Name *</label>
                  <input className={styles.fieldInput} value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  <label className={styles.fieldLabel}>Tier</label>
                  <select className={styles.fieldInput} value={editTier} onChange={(e) => setEditTier(e.target.value as typeof editTier)}>
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                  <label className={styles.fieldLabel}>Status</label>
                  <select className={styles.fieldInput} value={editStatus} onChange={(e) => setEditStatus(e.target.value as typeof editStatus)}>
                    <option value="ONBOARDING">Onboarding</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="CHURNED">Churned</option>
                  </select>
                  <label className={styles.fieldLabel}>Owner Name</label>
                  <input className={styles.fieldInput} value={editOwner} onChange={(e) => setEditOwner(e.target.value)} placeholder="Account owner…" />
                  <label className={styles.fieldLabel}>Billing Email</label>
                  <input type="email" className={styles.fieldInput} value={editBillingEmail} onChange={(e) => setEditBillingEmail(e.target.value)} placeholder="billing@client.com" />
                  <label className={styles.fieldLabel}>Contract Renewal</label>
                  <input type="date" className={styles.fieldInput} value={editRenewalAt} onChange={(e) => setEditRenewalAt(e.target.value)} />
                  <div className={cx("flexEnd", "gap8", "mt12")}>
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setEditMode(false)}>Cancel</button>
                    <button type="submit" className={cx("btnSm", "btnAccent")} disabled={editSaving}>{editSaving ? "Saving…" : "Save Changes"}</button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <div className={styles.clmDetailName}>{selected.name}</div>
                    <div className={styles.clmDetailSub}>
                      {selected.tier} &middot; {statusLabel(selected.status)} &middot; {selected.ownerName ?? "Unassigned"}
                    </div>
                  </div>

                  {/* Health score bar */}
                  <div className={styles.clmScoreBarWrap}>
                    <div className={styles.clmScoreBarMeta}>
                      <span className={styles.clmScoreBarLabel}>Health Score</span>
                      <span className={cx(styles.clmScoreBarVal, toneClass(healthColor(selected.health)))}>{selected.health}</span>
                    </div>
                    <div className={styles.clmScoreBarTrack}>
                      <div
                        className={`${styles.clmScoreBarFill} ${healthFillCls(selected.health)}`}
                        style={{ "--pct": `${selected.health}%` } as CSSProperties}
                      />
                    </div>
                  </div>

                  {/* 4-cell metric grid */}
                  <div className={styles.clmMetaGrid}>
                    {([
                      {
                        label: "Renewal",
                        value: selected.renewalDays === null ? "Not set" : `${selected.renewalDays}d`,
                        color: selected.renewalDays !== null && selected.renewalDays <= 30 ? "var(--amber)" : "var(--muted)"
                      },
                      {
                        label: "Outstanding",
                        value: formatMoneyCents(selected.outstandingInvoiced, { maximumFractionDigits: 0 }),
                        color: selected.outstandingInvoiced > 0 ? "var(--red)" : "var(--accent)"
                      },
                      {
                        label: "Paid",
                        value: formatMoneyCents(selected.paidInvoiced, { maximumFractionDigits: 0 }),
                        color: "var(--accent)"
                      },
                      {
                        label: "Projects",
                        value: selected.projectsCount.toString(),
                        color: "var(--accent)"
                      },
                    ] as const).map((m) => (
                      <div key={m.label} className={styles.clmMetaCell}>
                        <div className={styles.clmMetaLabel}>{m.label}</div>
                        <div className={cx(styles.clmMetaValue, toneClass(m.color))}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Info blocks */}
                  <div>
                    <div className={styles.clmInfoLabel}>Billing Contact</div>
                    <div className={styles.clmInfoBlock}>{selected.billingEmail ?? "Not set"}</div>
                  </div>
                  <div>
                    <div className={styles.clmInfoLabel}>Contract Renewal</div>
                    <div className={styles.clmInfoBlock}>{formatDate(selected.contractRenewalAt)}</div>
                  </div>

                  {/* Actions */}
                  <div className={styles.clmDetailActions}>
                    <button type="button" className={cx("btnSm", "btnAccent")} onClick={openEdit}>Edit Client</button>
                    <button type="button" className={cx("btnSm", "btnGhost")}>Log Intervention</button>
                    <button type="button" className={cx("btnSm", "btnGhost")}>Renewal Reminder</button>
                  </div>
                </>
              )
            ) : (
              <div className={styles.clmEmptyDetail}>Select a client to view account details.</div>
            )}
          </div>
        </div>

      </div>

      {/* ── Renewal queue ── */}
      <div className={styles.clmRenewalWrap}>
        <div className={styles.clmRenewalHeader}>
          <span className={styles.clmRenewalTitle}>Renewal Queue</span>
          <span className={styles.clmRenewalMeta}>NEXT 45 DAYS</span>
        </div>
        <div className={styles.clmRenewalHead}>
          <span>Client</span>
          <span>Health</span>
          <span>Renewal</span>
          <span>Outstanding</span>
          <span>Next Action</span>
        </div>
        {filtered
          .filter((c) => c.renewalDays !== null && c.renewalDays <= 45)
          .sort((a, b) => (a.renewalDays ?? 999) - (b.renewalDays ?? 999))
          .map((client) => {
            const rDays = client.renewalDays ?? 999;
            const urgentTone = rDays <= 14 ? "var(--red)" : "var(--amber)";
            const outTone = client.outstandingInvoiced > 0 ? "var(--red)" : "var(--accent)";
            const action = client.health < 60 ? "Exec check-in + rescue plan" : "Send renewal pack + confirm scope";
            return (
              <div
                key={client.id}
                className={`${styles.clmRenewalRow}${rDays <= 14 ? ` ${styles.clmRenewalRowUrgent}` : ""}`}
              >
                <div>
                  <div className={styles.clmRenewalClientName}>{client.name}</div>
                  <div className={styles.clmRenewalClientSub}>{client.tier} &middot; {statusLabel(client.status)}</div>
                </div>
                <div className={styles.clmHealthCell}>
                  <span className={cx(styles.clmHealthVal, toneClass(healthColor(client.health)))}>{client.health}</span>
                  <div className={styles.clmHealthTrack}>
                    <div className={`${styles.clmHealthFill} ${healthFillCls(client.health)}`} style={{ "--pct": `${client.health}%` } as CSSProperties} />
                  </div>
                </div>
                <span className={cx(styles.clmCellMono, toneClass(urgentTone))}>{client.renewalDays}d</span>
                <span className={cx(styles.clmCellMono, toneClass(outTone))}>{formatMoneyCents(client.outstandingInvoiced, { maximumFractionDigits: 0 })}</span>
                <span className={styles.clmRenewalAction}>{action}</span>
              </div>
            );
          })}
        {filtered.filter((c) => c.renewalDays !== null && c.renewalDays <= 45).length === 0 && (
          <div className={styles.clmEmpty}>No renewals due in the next 45 days.</div>
        )}
      </div>

      <div className={cx("mt16", "text10", "colorMuted", "fontMono")}>
        Signed in as {session?.user.email ?? "Unknown"}
      </div>

      {/* ── Broadcast Modal ─────────────────────────────────────────────── */}
      {broadcastOpen ? (
        <div className={styles.modalOverlay} onClick={() => { if (!broadcastBusy) setBroadcastOpen(false); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHd}>
              <span className={styles.modalTitle}>
                Broadcast to {selectedClientIds.size} Client{selectedClientIds.size !== 1 ? "s" : ""}
              </span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => { if (!broadcastBusy) setBroadcastOpen(false); }}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.fieldLabel}>Subject</label>
              <input
                type="text"
                className={styles.fieldInput}
                placeholder="Email subject…"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                maxLength={200}
              />
              <label className={styles.fieldLabel}>Message</label>
              <textarea
                className={styles.formTextarea}
                placeholder="Email body (min 10 characters)…"
                rows={5}
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                maxLength={10000}
              />
              {broadcastSubject.trim() && broadcastBody.trim().length >= 10 ? (
                <div className={cx("summaryPreview")}>
                  <p className={cx("text11", "colorMuted")}>Preview</p>
                  <p className={cx("text12")}><strong>{broadcastSubject}</strong></p>
                  <p className={cx("text12", "colorMuted")}>{broadcastBody}</p>
                </div>
              ) : null}
              {broadcastError ? (
                <p className={cx("text12", "colorRed")}>{broadcastError}</p>
              ) : null}
            </div>
            <div className={cx("flexEnd", "gap8", "px20", "mb20")}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => { if (!broadcastBusy) setBroadcastOpen(false); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => void handleBroadcast()}
                disabled={broadcastBusy || !broadcastSubject.trim() || broadcastBody.trim().length < 10}
              >
                {broadcastBusy ? "Sending…" : `Send to ${selectedClientIds.size} client${selectedClientIds.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Create Client Modal ─────────────────────────────────────────── */}
      {showCreate ? (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHd}>
              <span className={styles.modalTitle}>New Client</span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateClient} className={styles.modalBody}>
              <label className={styles.fieldLabel}>Client Name *</label>
              <input
                className={styles.fieldInput}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Acme Corp…"
                required
                autoFocus
              />
              <label className={styles.fieldLabel}>Tier</label>
              <select className={styles.fieldInput} value={newTier} onChange={(e) => setNewTier(e.target.value as typeof newTier)}>
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
              <label className={styles.fieldLabel}>Initial Status</label>
              <select className={styles.fieldInput} value={newStatus} onChange={(e) => setNewStatus(e.target.value as typeof newStatus)}>
                <option value="ONBOARDING">Onboarding</option>
                <option value="ACTIVE">Active</option>
              </select>
              <label className={styles.fieldLabel}>Owner Name</label>
              <input
                className={styles.fieldInput}
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="Account owner…"
              />
              <label className={styles.fieldLabel}>Billing Email</label>
              <input
                type="email"
                className={styles.fieldInput}
                value={newBillingEmail}
                onChange={(e) => setNewBillingEmail(e.target.value)}
                placeholder="billing@client.com"
              />
              <div className={cx("flexEnd", "gap8", "mt8")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className={cx("btnSm", "btnAccent")} disabled={creating}>{creating ? "Creating…" : "Create Client"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

    </div>
  );
}
