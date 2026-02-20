"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bulkUpdateLeadStatusWithRefresh,
  getLeadPreferenceWithRefresh,
  loadLeadActivitiesWithRefresh,
  loadLeadAnalyticsWithRefresh,
  mergeLeadsWithRefresh,
  setLeadPreferenceWithRefresh,
  updateLeadWithRefresh,
  type LeadActivity,
  type LeadPipelineStatus
} from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import styles from "../../../../app/style/maphari-dashboard.module.css";
import { EmptyState, formatDate, nextStatuses } from "./shared";

export function LeadsPage({
  leads,
  session,
  transitioningLeadId,
  onMoveLead,
  onRefreshSnapshot,
  onNotify,
  clock
}: {
  leads: ReturnType<typeof useAdminWorkspaceContext>["snapshot"]["leads"];
  session: AuthSession | null;
  transitioningLeadId: string | null;
  onMoveLead: (leadId: string, status: LeadPipelineStatus, options?: { lostReason?: string }) => Promise<boolean>;
  onRefreshSnapshot: (sessionOverride?: AuthSession) => Promise<void>;
  onNotify: (tone: "success" | "error", message: string) => void;
  clock: number;
}) {
  type LeadWithMeta = (typeof leads)[number] & {
    score: number;
    priority: "Hot" | "Warm" | "Cold";
    staleDays: number;
  };
  type SavedView = "ALL" | "HOT" | "FOLLOW_UP" | "PROPOSAL" | "LOST";
  type LeadSlaConfig = { followUpDays: number; breachDays: number };

  const isClientRole = session?.user.role === "CLIENT";
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(leads[0]?.id ?? null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "Hot" | "Warm" | "Cold">("ALL");
  const [savedView, setSavedView] = useState<SavedView>("ALL");
  const [bulkStatus, setBulkStatus] = useState<LeadPipelineStatus>("CONTACTED");
  const [lostReasons, setLostReasons] = useState<Record<string, string>>({});
  const [leadHistory, setLeadHistory] = useState<Record<string, LeadActivity[]>>({});
  const [editTitle, setEditTitle] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editFollowUpAt, setEditFollowUpAt] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingLead, setSavingLead] = useState(false);
  const [slaConfig, setSlaConfig] = useState<LeadSlaConfig>({ followUpDays: 3, breachDays: 5 });
  const [analyticsSummary, setAnalyticsSummary] = useState<{ avgTimeInStageDays: number; conversionRate: number } | null>(null);

  const columns: Array<{ status: LeadPipelineStatus; label: string }> = [
    { status: "NEW", label: "New" },
    { status: "CONTACTED", label: "Contacted" },
    { status: "QUALIFIED", label: "Qualified" },
    { status: "PROPOSAL", label: "Proposal" },
    { status: "WON", label: "Won" },
    { status: "LOST", label: "Lost" }
  ];

  const sourceOptions = useMemo(() => {
    return Array.from(new Set(leads.map((lead) => lead.source?.trim()).filter((value): value is string => Boolean(value))));
  }, [leads]);

  const leadsWithMeta = useMemo<LeadWithMeta[]>(() => {
    const now = clock;
    return leads.map((lead) => {
      const statusBase: Record<LeadPipelineStatus, number> = {
        NEW: 20,
        CONTACTED: 35,
        QUALIFIED: 55,
        PROPOSAL: 75,
        WON: 90,
        LOST: 5
      };
      const sourceBonus: Record<string, number> = {
        referral: 16,
        linkedin: 12,
        website: 10,
        google: 9,
        meta: 6
      };
      const normalizedSource = (lead.source ?? "").toLowerCase();
      const noteBonus = lead.notes && lead.notes.trim().length > 24 ? 6 : 0;
      const daysSinceUpdate = Math.max(
        0,
        Math.floor((now - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      );
      const freshnessDelta = daysSinceUpdate <= 2 ? 10 : daysSinceUpdate <= 7 ? 4 : -10;
      const rawScore = statusBase[lead.status] + (sourceBonus[normalizedSource] ?? 0) + noteBonus + freshnessDelta;
      const score = Math.max(0, Math.min(100, rawScore));
      const priority: "Hot" | "Warm" | "Cold" = score >= 75 ? "Hot" : score >= 45 ? "Warm" : "Cold";
      return { ...lead, score, priority, staleDays: daysSinceUpdate };
    });
  }, [leads, clock]);

  useEffect(() => {
    if (selectedLeadId && !leads.some((lead) => lead.id === selectedLeadId)) {
      queueMicrotask(() => setSelectedLeadId(leads[0]?.id ?? null));
    }
  }, [leads, selectedLeadId]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const [viewPref, slaPref] = await Promise.all([
        getLeadPreferenceWithRefresh(session, "savedView"),
        getLeadPreferenceWithRefresh(session, "slaConfig")
      ]);
      if (viewPref.nextSession && viewPref.data?.value) {
        const candidate = viewPref.data.value as SavedView;
        if (["ALL", "HOT", "FOLLOW_UP", "PROPOSAL", "LOST"].includes(candidate)) {
          setSavedView(candidate);
        }
      }
      if (slaPref.nextSession && slaPref.data?.value) {
        try {
          const parsed = JSON.parse(slaPref.data.value) as Partial<LeadSlaConfig>;
          setSlaConfig({
            followUpDays: Math.max(1, Math.min(30, Number(parsed.followUpDays ?? 3))),
            breachDays: Math.max(1, Math.min(60, Number(parsed.breachDays ?? 5)))
          });
        } catch {
          // keep defaults
        }
      }
    })();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    void setLeadPreferenceWithRefresh(session, { key: "savedView", value: savedView });
  }, [savedView, session]);

  useEffect(() => {
    if (!session) return;
    void setLeadPreferenceWithRefresh(session, { key: "slaConfig", value: JSON.stringify(slaConfig) });
  }, [session, slaConfig]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leadsWithMeta.filter((lead) => {
      if (query) {
        const matchesQuery =
          lead.title.toLowerCase().includes(query) ||
          (lead.source ?? "").toLowerCase().includes(query) ||
          (lead.notes ?? "").toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }
      if (sourceFilter !== "ALL" && (lead.source ?? "Unknown") !== sourceFilter) return false;
      if (priorityFilter !== "ALL" && lead.priority !== priorityFilter) return false;
      if (savedView === "HOT" && lead.priority !== "Hot") return false;
      if (savedView === "FOLLOW_UP" && (lead.staleDays < slaConfig.followUpDays || ["WON", "LOST"].includes(lead.status))) return false;
      if (savedView === "PROPOSAL" && lead.status !== "PROPOSAL") return false;
      if (savedView === "LOST" && lead.status !== "LOST") return false;
      return true;
    });
  }, [leadsWithMeta, priorityFilter, savedView, search, sourceFilter, slaConfig.followUpDays]);

  const selectedLead = filteredLeads.find((lead) => lead.id === selectedLeadId) ?? leadsWithMeta.find((lead) => lead.id === selectedLeadId) ?? null;
  const selectedTimeline = selectedLead ? (leadHistory[selectedLead.id] ?? []) : [];

  useEffect(() => {
    if (!selectedLead) return;
    queueMicrotask(() => {
      setEditTitle(selectedLead.title);
      setEditSource(selectedLead.source ?? "");
      setEditContactName(selectedLead.contactName ?? "");
      setEditContactEmail(selectedLead.contactEmail ?? "");
      setEditContactPhone(selectedLead.contactPhone ?? "");
      setEditCompany(selectedLead.company ?? "");
      setEditOwnerName(selectedLead.ownerName ?? "");
      setEditFollowUpAt(
        selectedLead.nextFollowUpAt
          ? new Date(selectedLead.nextFollowUpAt).toISOString().slice(0, 16)
          : ""
      );
      setEditNotes(selectedLead.notes ?? "");
    });
  }, [selectedLead]);

  useEffect(() => {
    if (!session || !selectedLeadId) return;
    void (async () => {
      const result = await loadLeadActivitiesWithRefresh(session, selectedLeadId);
      if (!result.nextSession) {
        onNotify("error", result.error?.message ?? "Session expired. Please sign in again.");
        return;
      }
      if (result.error) {
        onNotify("error", result.error.message);
      }
      if (result.data) {
        setLeadHistory((current) => ({ ...current, [selectedLeadId]: result.data ?? [] }));
      }
    })();
  }, [onNotify, selectedLeadId, session]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const result = await loadLeadAnalyticsWithRefresh(session);
      if (result.nextSession && result.data) {
        setAnalyticsSummary({
          avgTimeInStageDays: result.data.avgTimeInStageDays,
          conversionRate: result.data.conversionRate
        });
      }
    })();
  }, [session, leads.length]);

  const followUpQueue = useMemo(() => {
    const now = clock;
    return leadsWithMeta
      .filter((lead) => {
        if (["WON", "LOST"].includes(lead.status)) return false;
        const dueBySchedule = lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).getTime() <= now : false;
        return lead.staleDays >= slaConfig.followUpDays || dueBySchedule;
      })
      .sort((a, b) => b.staleDays - a.staleDays)
      .slice(0, 5);
  }, [leadsWithMeta, slaConfig.followUpDays, clock]);

  const duplicates = useMemo(() => {
    const byKey = new Map<string, LeadWithMeta[]>();
    for (const lead of leadsWithMeta) {
      const keys = [
        lead.contactEmail ? `email:${lead.contactEmail.trim().toLowerCase()}` : "",
        lead.contactPhone ? `phone:${lead.contactPhone.replace(/\D/g, "")}` : "",
        lead.company ? `company:${lead.company.trim().toLowerCase()}::title:${lead.title.trim().toLowerCase()}` : ""
      ].filter(Boolean);
      for (const key of keys) {
        const group = byKey.get(key) ?? [];
        group.push(lead);
        byKey.set(key, group);
      }
    }
    return Array.from(byKey.values()).filter((group) => group.length > 1).slice(0, 6);
  }, [leadsWithMeta]);

  const hotCount = leadsWithMeta.filter((lead) => lead.priority === "Hot").length;
  const wonCount = leadsWithMeta.filter((lead) => lead.status === "WON").length;
  const followUpCount = leadsWithMeta.filter((lead) => {
    if (["WON", "LOST"].includes(lead.status)) return false;
    const dueBySchedule = lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).getTime() <= clock : false;
    return lead.staleDays >= slaConfig.followUpDays || dueBySchedule;
  }).length;
  const breachCount = leadsWithMeta.filter((lead) => !["WON", "LOST"].includes(lead.status) && lead.staleDays >= slaConfig.breachDays).length;
  const conversionPct = (() => {
    if (analyticsSummary) return analyticsSummary.conversionRate.toFixed(1);
    const pipeline = leadsWithMeta.filter((lead) => !["WON", "LOST"].includes(lead.status)).length;
    const won = leadsWithMeta.filter((lead) => lead.status === "WON").length;
    return pipeline + won > 0 ? ((won / (pipeline + won)) * 100).toFixed(1) : "0.0";
  })();
  const avgTimeInStageDays = (() => {
    if (analyticsSummary) return analyticsSummary.avgTimeInStageDays.toFixed(1);
    if (leadsWithMeta.length === 0) return "0.0";
    const totalDays = leadsWithMeta.reduce((sum, lead) => sum + lead.staleDays, 0);
    return (totalDays / leadsWithMeta.length).toFixed(1);
  })();

  async function moveLeadWithExtras(lead: LeadWithMeta, nextStatus: LeadPipelineStatus): Promise<void> {
    let reason = "";
    if (nextStatus === "LOST") {
      reason = window.prompt("Why was this lead lost?", lostReasons[lead.id] ?? "No budget / delayed decision")?.trim() ?? "";
      if (!reason) return;
    }

    const success = await onMoveLead(lead.id, nextStatus, nextStatus === "LOST" ? { lostReason: reason } : {});
    if (!success) return;

    if (nextStatus === "LOST") {
      setLostReasons((current) => ({ ...current, [lead.id]: reason }));
    }
    await onRefreshSnapshot(session ?? undefined);
    onNotify("success", `Lead moved to ${nextStatus}.`);
  }

  async function applyBulkMove(): Promise<void> {
    if (!session || selectedLeadIds.length === 0) return;
    let lostReason = "";
    if (bulkStatus === "LOST") {
      lostReason = window.prompt("Reason for marking selected leads as LOST", "No budget / no response")?.trim() ?? "";
      if (!lostReason) return;
    }

    const result = await bulkUpdateLeadStatusWithRefresh(session, {
      leadIds: selectedLeadIds,
      status: bulkStatus,
      lostReason: bulkStatus === "LOST" ? lostReason : undefined
    });

    if (!result.nextSession) {
      onNotify("error", result.error?.message ?? "Session expired. Please sign in again.");
      return;
    }

    if (result.error) {
      onNotify("error", result.error.message);
      return;
    }

    if (bulkStatus === "LOST") {
      const next: Record<string, string> = {};
      for (const leadId of selectedLeadIds) next[leadId] = lostReason;
      setLostReasons((current) => ({ ...current, ...next }));
    }

    await onRefreshSnapshot(result.nextSession);
    onNotify("success", "Bulk status update completed.");
    setSelectedLeadIds([]);
  }

  async function saveLeadDetails(): Promise<void> {
    if (!session || !selectedLead) return;
    setSavingLead(true);
    const result = await updateLeadWithRefresh(session, selectedLead.id, {
      title: editTitle.trim(),
      source: editSource.trim() || undefined,
      contactName: editContactName.trim() || undefined,
      contactEmail: editContactEmail.trim() || undefined,
      contactPhone: editContactPhone.trim() || undefined,
      company: editCompany.trim() || undefined,
      ownerName: editOwnerName.trim() || undefined,
      notes: editNotes.trim() || undefined,
      nextFollowUpAt: editFollowUpAt ? new Date(editFollowUpAt).toISOString() : null
    });
    setSavingLead(false);

    if (!result.nextSession) {
      onNotify("error", result.error?.message ?? "Session expired. Please sign in again.");
      return;
    }
    if (result.error) {
      onNotify("error", result.error.message);
      return;
    }
    await onRefreshSnapshot(result.nextSession);
    onNotify("success", "Lead details saved.");
  }

  async function mergeDuplicateLeads(primaryLeadId: string, duplicateLeadId: string): Promise<void> {
    if (!session) return;
    const primary = leadsWithMeta.find((lead) => lead.id === primaryLeadId);
    const duplicate = leadsWithMeta.find((lead) => lead.id === duplicateLeadId);
    const preview = [
      "Merge Preview",
      `Primary: ${primary?.title ?? primaryLeadId} (${primary?.source ?? "unknown"})`,
      `Duplicate: ${duplicate?.title ?? duplicateLeadId} (${duplicate?.source ?? "unknown"})`,
      "The duplicate will be deleted and details merged into primary."
    ].join("\n");
    const confirmed = window.confirm(preview);
    if (!confirmed) return;
    const result = await mergeLeadsWithRefresh(session, { primaryLeadId, duplicateLeadId });
    if (!result.nextSession) {
      onNotify("error", result.error?.message ?? "Session expired. Please sign in again.");
      return;
    }
    if (result.error) {
      onNotify("error", result.error.message);
      return;
    }
    await onRefreshSnapshot(result.nextSession);
    onNotify("success", "Duplicate leads merged.");
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Operations</div>
          <div className={styles.projName}>Leads Pipeline</div>
          <div className={styles.projMeta}>Pipeline control, follow-ups, and conversion insights in one workspace.</div>
        </div>
      </div>

      <div className={`${styles.statsRow} ${styles.statsRowCols4}`}>
        <div className={`${styles.statCard} ${styles.green}`}>
          <div className={styles.statLabel}>Pipeline Leads</div>
          <div className={styles.statValue}>{leadsWithMeta.length}</div>
          <div className={styles.statDelta}>Across all active stages</div>
        </div>
        <div className={`${styles.statCard} ${styles.purple}`}>
          <div className={styles.statLabel}>Hot Leads</div>
          <div className={styles.statValue}>{hotCount}</div>
          <div className={styles.statDelta}>
            {leadsWithMeta.length > 0 ? `${Math.round((hotCount / leadsWithMeta.length) * 100)}%` : "0%"} high-intent
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.amber}`}>
          <div className={styles.statLabel}>Needs Follow-up</div>
          <div className={styles.statValue}>{followUpCount}</div>
          <div className={`${styles.statDelta} ${followUpCount > 0 ? styles.deltaDown : ""}`}>Queue requiring action</div>
        </div>
        <div className={`${styles.statCard} ${styles.green}`}>
          <div className={styles.statLabel}>Win Rate</div>
          <div className={styles.statValue}>{conversionPct}%</div>
          <div className={`${styles.statDelta} ${wonCount > 0 ? styles.deltaUp : ""}`}>{wonCount} won opportunities</div>
        </div>
      </div>

      {leadsWithMeta.length === 0 ? (
        <article className={styles.card}>
          <div className={styles.cardInner}>
            <EmptyState
              title="Nothing yet"
              subtitle="No leads have been created yet. New inquiries from forms or manual entries will appear here before any stage movement."
            />
          </div>
        </article>
      ) : null}

      <article className={styles.card}>
        <div className={styles.cardInner}>
          <div className={styles.inlineActions} style={{ flexWrap: "wrap", justifyContent: "space-between", gap: 14 }}>
            <div className={styles.inlineActions} style={{ flexWrap: "wrap", gap: 8 }}>
              <button type="button" className={`${styles.btnSm} ${savedView === "ALL" ? styles.btnAccent : styles.btnGhost}`} onClick={() => setSavedView("ALL")}>All</button>
              <button type="button" className={`${styles.btnSm} ${savedView === "HOT" ? styles.btnAccent : styles.btnGhost}`} onClick={() => setSavedView("HOT")}>Hot Leads</button>
              <button type="button" className={`${styles.btnSm} ${savedView === "FOLLOW_UP" ? styles.btnAccent : styles.btnGhost}`} onClick={() => setSavedView("FOLLOW_UP")}>Needs Follow-up</button>
              <button type="button" className={`${styles.btnSm} ${savedView === "PROPOSAL" ? styles.btnAccent : styles.btnGhost}`} onClick={() => setSavedView("PROPOSAL")}>Proposal</button>
              <button type="button" className={`${styles.btnSm} ${savedView === "LOST" ? styles.btnAccent : styles.btnGhost}`} onClick={() => setSavedView("LOST")}>Lost</button>
            </div>
            <div className={styles.inlineActions} style={{ flexWrap: "wrap", gap: 8 }}>
              <input className={styles.msgInput} style={{ width: 210 }} placeholder="Search lead, source, notes" value={search} onChange={(event) => setSearch(event.target.value)} />
              <select className={styles.msgInput} style={{ width: 160 }} value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                <option value="ALL">All sources</option>
                {sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
              </select>
              <select className={styles.msgInput} style={{ width: 140 }} value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}>
                <option value="ALL">All priority</option>
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </select>
            </div>
          </div>
        </div>
      </article>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Follow-up Queue</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Lead</th><th>Stage</th><th>Idle</th><th>Action</th></tr></thead>
            <tbody>
              {followUpQueue.length > 0 ? (
                followUpQueue.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.title}</td>
                    <td>{lead.status}</td>
                    <td>{lead.staleDays}d</td>
                    <td><button type="button" className={`${styles.btnSm} ${styles.btnGhost} ${styles.btnInline}`} onClick={() => setSelectedLeadId(lead.id)}>Open</button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className={styles.emptyCell}><EmptyState title="Nothing yet" subtitle="This section updates when follow-up risks are detected." compact /></td></tr>
              )}
            </tbody>
          </table>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Bulk Actions</span></div>
          <div className={styles.cardInner}>
            {isClientRole ? (
              <EmptyState title="Read-only" subtitle="Switch to an admin or staff role to use bulk stage updates." compact />
            ) : selectedLeadIds.length === 0 ? (
              <EmptyState title="Nothing yet" subtitle="Select at least one lead to enable bulk stage movement." compact />
            ) : (
              <>
                <div className={styles.projMeta}>Selected leads: <strong>{selectedLeadIds.length}</strong></div>
                <div className={styles.inlineActions} style={{ marginTop: 10, flexWrap: "wrap" }}>
                  <select className={styles.msgInput} style={{ width: 180 }} value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as LeadPipelineStatus)}>
                    {columns.map((column) => <option key={column.status} value={column.status}>{column.label}</option>)}
                  </select>
                  <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void applyBulkMove()}>
                    Apply to selected
                  </button>
                  <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => setSelectedLeadIds([])}>Clear</button>
                </div>
              </>
            )}
          </div>
        </article>
      </div>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Duplicate Detection</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Primary</th><th>Duplicate</th><th>Action</th></tr></thead>
            <tbody>
              {!isClientRole && duplicates.length > 0 ? (
                duplicates.map((group) => {
                  const [primary, ...rest] = group;
                  const duplicate = rest[0];
                  if (!duplicate) return null;
                  return (
                    <tr key={`${primary.id}:${duplicate.id}`}>
                      <td>{primary.title}</td>
                      <td>{duplicate.title}</td>
                      <td>
                        <button type="button" className={`${styles.btnSm} ${styles.btnGhost} ${styles.btnInline}`} onClick={() => void mergeDuplicateLeads(primary.id, duplicate.id)}>
                          Merge
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={3} className={styles.emptyCell}><EmptyState title={isClientRole ? "Read-only" : "Nothing yet"} subtitle={isClientRole ? "Duplicate merge is restricted to admin role." : "No duplicate leads detected."} compact /></td></tr>
              )}
            </tbody>
          </table>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Conversion Analytics</span></div>
          <div className={styles.cardInner}>
            <div className={`${styles.statsRow} ${styles.statsRowCols3}`}>
              <div className={`${styles.statCard} ${styles.green}`}>
                <div className={styles.statLabel}>Win Rate</div>
                <div className={styles.statValue}>{conversionPct}%</div>
                <div className={styles.statDelta}>Won vs closed opportunities</div>
              </div>
              <div className={`${styles.statCard} ${styles.purple}`}>
                <div className={styles.statLabel}>Avg Time In Stage</div>
                <div className={styles.statValue}>{avgTimeInStageDays}d</div>
                <div className={styles.statDelta}>Pipeline movement pace</div>
              </div>
              <div className={`${styles.statCard} ${styles.red}`}>
                <div className={styles.statLabel}>SLA Breaches</div>
                <div className={styles.statValue}>{breachCount}</div>
                <div className={`${styles.statDelta} ${breachCount > 0 ? styles.deltaDown : ""}`}>Leads past threshold</div>
              </div>
            </div>
            <div className={styles.inlineActions} style={{ marginTop: 12, gap: 12, flexWrap: "wrap" }}>
              <label className={styles.formGroup} style={{ marginBottom: 0 }}>
                <span>Follow-up SLA (days)</span>
                <input
                  className={styles.msgInput}
                  type="number"
                  min={1}
                  max={30}
                  value={slaConfig.followUpDays}
                  disabled={isClientRole}
                  onChange={(event) => setSlaConfig((current) => ({ ...current, followUpDays: Math.max(1, Math.min(30, Number(event.target.value || 1))) }))}
                />
              </label>
              <label className={styles.formGroup} style={{ marginBottom: 0 }}>
                <span>Breach threshold (days)</span>
                <input
                  className={styles.msgInput}
                  type="number"
                  min={1}
                  max={60}
                  value={slaConfig.breachDays}
                  disabled={isClientRole}
                  onChange={(event) => setSlaConfig((current) => ({ ...current, breachDays: Math.max(1, Math.min(60, Number(event.target.value || 1))) }))}
                />
              </label>
            </div>
          </div>
        </article>
      </div>

      <div className={styles.leadsBoardLayout}>
        <div className={styles.leadsKanban}>
          {columns.map((column) => {
            const items = filteredLeads.filter((lead) => lead.status === column.status);
            return (
              <article key={column.status} className={styles.card}>
                <div className={styles.cardHd}>
                  <span className={styles.cardHdTitle}>{column.label}</span>
                  <span className={styles.metaMono}>{items.length}</span>
                </div>
                <div className={styles.cardInner}>
                  {items.length === 0 ? <EmptyState title="Nothing yet" subtitle="This section updates once leads enter this stage." compact /> : null}
                  {items.map((lead) => (
                    <div key={lead.id} className={styles.card} style={{ marginBottom: 10, borderColor: selectedLeadId === lead.id ? "var(--accent)" : undefined }}>
                      <div className={styles.cardInner}>
                        <div className={styles.inlineActions} style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                          <label className={styles.inlineActions} style={{ gap: 8, alignItems: "center" }}>
                            <input
                              type="checkbox"
                              checked={selectedLeadIds.includes(lead.id)}
                              disabled={isClientRole}
                              onChange={(event) =>
                                setSelectedLeadIds((current) =>
                                  event.target.checked ? Array.from(new Set([...current, lead.id])) : current.filter((id) => id !== lead.id)
                                )
                              }
                            />
                            <span className={styles.cellStrong} style={{ marginBottom: 0 }}>{lead.title}</span>
                          </label>
                          <span className={`${styles.badge} ${lead.priority === "Hot" ? styles.badgeRed : lead.priority === "Warm" ? styles.badgeAmber : styles.badgeGreen}`}>{lead.priority}</span>
                        </div>
                        <div className={styles.cellSub}>{lead.source ?? "Unknown source"} · Score {lead.score}</div>
                        <div className={styles.cellSub}>Idle {lead.staleDays}d</div>
                        <div className={styles.inlineActions} style={{ marginTop: 10, flexWrap: "wrap" }}>
                          <button type="button" className={`${styles.btnSm} ${styles.btnGhost} ${styles.btnInline}`} onClick={() => setSelectedLeadId(lead.id)}>Details</button>
                          {!isClientRole ? nextStatuses(lead.status).map((nextStatus) => (
                            <button
                              key={nextStatus}
                              type="button"
                              className={`${styles.btnSm} ${styles.btnGhost} ${styles.btnInline}`}
                              disabled={transitioningLeadId === lead.id}
                              onClick={() => void moveLeadWithExtras(lead, nextStatus)}
                            >
                              {transitioningLeadId === lead.id ? "Saving..." : `Move ${nextStatus}`}
                            </button>
                          )) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Lead Details</span></div>
          <div className={styles.cardInner}>
            {selectedLead ? (
              <>
                <div className={styles.inlineActions} style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div className={styles.cellStrong} style={{ marginBottom: 0 }}>Lead Profile</div>
                  <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} disabled={savingLead || isClientRole} onClick={() => void saveLeadDetails()}>
                    {savingLead ? "Saving..." : "Save"}
                  </button>
                </div>
                <div className={styles.formGroup}><label>Title</label><input className={styles.msgInput} value={editTitle} onChange={(event) => setEditTitle(event.target.value)} disabled={isClientRole} /></div>
                <div className={styles.formGroup}><label>Source</label><input className={styles.msgInput} value={editSource} onChange={(event) => setEditSource(event.target.value)} disabled={isClientRole} /></div>
                <div className={styles.formGroup}><label>Contact Name</label><input className={styles.msgInput} value={editContactName} onChange={(event) => setEditContactName(event.target.value)} disabled={isClientRole} /></div>
                <div className={styles.formGroup}><label>Contact Email</label><input className={styles.msgInput} value={editContactEmail} onChange={(event) => setEditContactEmail(event.target.value)} disabled={isClientRole} /></div>
                <div className={styles.formGroup}><label>Contact Phone</label><input className={styles.msgInput} value={editContactPhone} onChange={(event) => setEditContactPhone(event.target.value)} disabled={isClientRole} /></div>
                <div className={styles.formGroup}><label>Company</label><input className={styles.msgInput} value={editCompany} onChange={(event) => setEditCompany(event.target.value)} disabled={isClientRole} /></div>
                <div className={styles.formGroup}><label>Owner</label><input className={styles.msgInput} value={editOwnerName} onChange={(event) => setEditOwnerName(event.target.value)} placeholder="Assign owner" disabled={isClientRole} /></div>
                <div className={styles.formGroup}><label>Next Follow-up</label><input className={styles.msgInput} type="datetime-local" value={editFollowUpAt} onChange={(event) => setEditFollowUpAt(event.target.value)} disabled={isClientRole} /></div>
                <div className={styles.formGroup}><label>Notes</label><textarea className={styles.msgInput} value={editNotes} onChange={(event) => setEditNotes(event.target.value)} rows={4} disabled={isClientRole} /></div>
                <div className={styles.cellSub}>Priority: {selectedLead.priority} · Score {selectedLead.score}</div>
                <div className={styles.cellSub}>Status: {selectedLead.status}</div>
                <div className={styles.cellSub}>Last updated: {formatDate(selectedLead.updatedAt)}</div>
                <div className={styles.cellSub}>SLA: {selectedLead.staleDays >= slaConfig.breachDays ? "Breached" : "On track"}</div>
                {selectedLead.status === "LOST" && (selectedLead.lostReason ?? lostReasons[selectedLead.id]) ? <div className={styles.projMeta} style={{ marginTop: 10 }}>Lost reason: {selectedLead.lostReason ?? lostReasons[selectedLead.id]}</div> : null}
                <div className={styles.card} style={{ marginTop: 14 }}>
                  <div className={styles.cardHd}><span className={styles.cardHdTitle}>Timeline</span></div>
                  <div className={styles.cardInner} style={{ paddingTop: 8, paddingBottom: 8 }}>
                    <div className={styles.activityList}>
                      {selectedTimeline.length > 0 ? (
                        [...selectedTimeline].slice(0, 8).map((entry) => (
                          <div key={entry.id} className={styles.activityItem}>
                            <div className={styles.activityDot} style={{ background: "var(--accent)" }} />
                            <div className={styles.activityText}>
                              <div className={styles.activityMain}>{entry.type}{entry.details ? ` · ${entry.details}` : ""}</div>
                              <div className={styles.activityTime}>{formatDate(entry.createdAt)}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState title="Nothing yet" subtitle="This section updates once lead events are logged." compact />
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState title="Nothing yet" subtitle="Select a lead to load detailed context." />
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
