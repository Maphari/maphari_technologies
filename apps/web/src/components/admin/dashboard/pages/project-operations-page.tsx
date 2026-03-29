"use client";

import { useCallback, useMemo, useState } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { updateProjectWithRefresh, bulkUpdateProjectStatusWithRefresh } from "../../../../lib/api/admin/projects";
import { queueAutomationJobWithRefresh } from "../../../../lib/api/admin/automation";

type ViewMode = "execution board" | "ops queue" | "checkpoint tracker";

function fmtDate(value?: string | null): string {
  if (!value) return "Not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-ZA", { month: "short", day: "2-digit" }).format(d);
}

function daysFromNow(value?: string | null): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

function daysSince(value?: string | null): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
}

function money(amountCents: number, currency?: string): string {
  const code = currency && currency !== "AUTO" ? currency : undefined;
  return formatMoneyCents(amountCents, { currency: code, maximumFractionDigits: 0 });
}

function statusTone(status: string): string {
  const s = status.toUpperCase();
  if (["BLOCKED", "DELAYED", "ON_HOLD", "CANCELLED"].includes(s)) return "var(--red)";
  if (["REVIEW", "PLANNING"].includes(s)) return "var(--amber)";
  if (s === "IN_PROGRESS") return "var(--blue)";
  return "var(--accent)";
}

function riskTone(risk: string): string {
  if (risk === "HIGH") return "var(--red)";
  if (risk === "MEDIUM") return "var(--amber)";
  return "var(--accent)";
}

function statusClass(status: string): string {
  const s = status.toUpperCase();
  if (["BLOCKED", "DELAYED", "ON_HOLD", "CANCELLED"].includes(s)) return "colorRed";
  if (["REVIEW", "PLANNING"].includes(s)) return "colorAmber";
  if (s === "IN_PROGRESS") return "colorBlue";
  return "colorAccent";
}

function riskClass(risk: string): string {
  if (risk === "HIGH") return "colorRed";
  if (risk === "MEDIUM") return "colorAmber";
  return "colorAccent";
}

function health(project: {
  progressPercent: number;
  dueAt?: string | null;
  riskLevel: string;
  status: string;
  updatedAt: string;
}): number {
  const dueDays = daysFromNow(project.dueAt);
  const idleDays = daysSince(project.updatedAt) ?? 0;
  let score = 72;
  score += Math.min(18, Math.round(project.progressPercent / 6));
  if (project.riskLevel === "HIGH") score -= 24;
  if (project.riskLevel === "MEDIUM") score -= 10;
  if (["BLOCKED", "DELAYED", "ON_HOLD"].includes(project.status)) score -= 20;
  if (dueDays !== null && dueDays < 0) score -= 18;
  if (dueDays !== null && dueDays <= 7) score -= 8;
  if (idleDays >= 7) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function checkpointState(project: {
  dueDays: number | null;
  status: string;
  riskLevel: string;
  idleDays: number;
}): { label: string; color: string } {
  if (project.status === "COMPLETED") return { label: "Closed", color: "var(--accent)" };
  if (project.dueDays !== null && project.dueDays < 0) return { label: "Missed", color: "var(--red)" };
  if (project.riskLevel === "HIGH") return { label: "At Risk", color: "var(--red)" };
  if (project.dueDays !== null && project.dueDays <= 7) return { label: "Due Soon", color: "var(--amber)" };
  if (project.idleDays >= 7) return { label: "Stale", color: "var(--amber)" };
  return { label: "On Rhythm", color: "var(--blue)" };
}

export function ProjectOperationsPage({
  snapshot,
  session,
  onNotify,
  currency
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  onNotify: (tone: "success" | "error", message: string) => void;
  currency: string;
}) {
  const [view, setView] = useState<ViewMode>("execution board");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(snapshot.projects[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED">("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");
  const [checkpointFilter, setCheckpointFilter] = useState<"ALL" | "ON_RHYTHM" | "DUE_SOON" | "AT_RISK" | "MISSED" | "STALE">("ALL");

  // ── Bulk selection state ──────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<"PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED">("ON_HOLD");
  const [bulkApplying, setBulkApplying] = useState(false);

  const rows = useMemo(() => {
    return snapshot.projects.map((project) => {
      const client = snapshot.clients.find((c) => c.id === project.clientId);
      const dueDays = daysFromNow(project.dueAt);
      const overdue = dueDays !== null && dueDays < 0;
      const idleDays = daysSince(project.updatedAt) ?? 0;
      const isBlocked = ["BLOCKED", "DELAYED", "ON_HOLD"].includes(project.status) || project.riskLevel === "HIGH";
      const invoiceOverdue = snapshot.invoices.filter((inv) => inv.clientId === project.clientId && inv.status === "OVERDUE").length;
      const h = health(project);
      const checkpoint = checkpointState({
        dueDays,
        status: project.status,
        riskLevel: project.riskLevel,
        idleDays
      });
      return {
        ...project,
        clientName: client?.name ?? "Unknown client",
        dueDays,
        overdue,
        idleDays,
        isBlocked,
        invoiceOverdue,
        health: h,
        checkpoint
      };
    });
  }, [snapshot.clients, snapshot.invoices, snapshot.projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (riskFilter !== "ALL" && p.riskLevel !== riskFilter) return false;
      if (checkpointFilter !== "ALL") {
        const key =
          p.checkpoint.label === "On Rhythm"
            ? "ON_RHYTHM"
            : p.checkpoint.label === "Due Soon"
              ? "DUE_SOON"
              : p.checkpoint.label === "At Risk"
                ? "AT_RISK"
                : p.checkpoint.label === "Missed"
                  ? "MISSED"
                  : "STALE";
        if (key !== checkpointFilter) return false;
      }
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q) || (p.ownerName ?? "").toLowerCase().includes(q);
    });
  }, [rows, query, statusFilter, riskFilter, checkpointFilter]);

  const selected = filtered.find((p) => p.id === selectedId) ?? rows.find((p) => p.id === selectedId) ?? null;

  const active = filtered.filter((p) => p.status === "IN_PROGRESS").length;
  const blocked = filtered.filter((p) => p.isBlocked).length;
  const overdue = filtered.filter((p) => p.overdue).length;
  const stale = filtered.filter((p) => p.idleDays >= 7 && p.status !== "COMPLETED").length;
  const avgHealth = filtered.length > 0 ? Math.round(filtered.reduce((sum, p) => sum + p.health, 0) / filtered.length) : 0;

  const canOperate = session?.user.role === "ADMIN" || session?.user.role === "STAFF";

  const handleQueueJob = useCallback(async (type: string, projectId?: string) => {
    if (!session) return;
    const result = await queueAutomationJobWithRefresh(session, { type, ...(projectId && { projectId }) });
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error) {
      const msgs: Record<string, string> = {
        OWNER_FOLLOWUP: "Owner follow-up queued.",
        CHECKPOINT_REMINDER: "Checkpoint reminder scheduled.",
        CHECKPOINT_DIGEST: "Weekly checkpoint digest queued.",
      };
      onNotify("success", msgs[type] ?? "Job queued.");
    } else {
      onNotify("error", result.error.message ?? "Failed to queue job.");
    }
  }, [session, onNotify]);

  // ── Bulk selection helpers ────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }

  async function handleBulkApply() {
    if (!session || selectedIds.size === 0) return;
    setBulkApplying(true);
    const ids = Array.from(selectedIds);
    const result = await bulkUpdateProjectStatusWithRefresh(session, ids, bulkStatus);
    if (result.nextSession) saveSession(result.nextSession);
    setBulkApplying(false);
    if (result.error) {
      onNotify("error", result.error.message);
    } else {
      const { updated, failed } = result.data ?? { updated: 0, failed: [] };
      onNotify(
        failed.length === 0 ? "success" : "error",
        failed.length === 0
          ? `${updated} project${updated !== 1 ? "s" : ""} updated to ${bulkStatus}`
          : `${updated} updated, ${failed.length} failed`
      );
      // Keep failed IDs selected so the user can retry; clear only on full success.
      setSelectedIds(failed.length > 0 ? new Set(failed) : new Set());
    }
  }

  // ── Edit project state ────────────────────────────────────────────────────
  const [showEditProject, setShowEditProject] = useState(false);
  const [editProjName, setEditProjName] = useState("");
  const [editProjStatus, setEditProjStatus] = useState<"PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED">("IN_PROGRESS");
  const [editProjPriority, setEditProjPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [editProjOwner, setEditProjOwner] = useState("");
  const [editProjDueAt, setEditProjDueAt] = useState("");
  const [editProjBudget, setEditProjBudget] = useState("");
  const [editProjSaving, setEditProjSaving] = useState(false);

  function openEditProject() {
    if (!selected) return;
    setEditProjName(selected.name);
    setEditProjStatus(selected.status as typeof editProjStatus);
    setEditProjPriority((selected.priority ?? "MEDIUM") as typeof editProjPriority);
    setEditProjOwner(selected.ownerName ?? "");
    setEditProjDueAt(selected.dueAt ? selected.dueAt.slice(0, 10) : "");
    setEditProjBudget(selected.budgetCents ? String(Math.round(selected.budgetCents / 100)) : "");
    setShowEditProject(true);
  }

  async function handleEditProject() {
    if (!session || !selected) return;
    setEditProjSaving(true);
    const r = await updateProjectWithRefresh(session, selected.id, {
      name: editProjName.trim() || undefined,
      status: editProjStatus,
      priority: editProjPriority,
      ownerName: editProjOwner.trim() || undefined,
      dueAt: editProjDueAt ? new Date(editProjDueAt).toISOString() : null,
      budgetCents: editProjBudget ? Math.round(parseFloat(editProjBudget) * 100) : undefined,
    });
    setEditProjSaving(false);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) { onNotify("error", r.error.message); return; }
    setShowEditProject(false);
    onNotify("success", `Project "${editProjName}" updated successfully.`);
  }

  const lanes: Array<{ key: string; label: string; color: string }> = [
    { key: "PLANNING", label: "Planning", color: "var(--amber)" },
    { key: "IN_PROGRESS", label: "In Progress", color: "var(--blue)" },
    { key: "REVIEW", label: "Review", color: "var(--amber)" },
    { key: "AT_RISK", label: "At Risk", color: "var(--red)" },
    { key: "COMPLETED", label: "Completed", color: "var(--accent)" }
  ];

  const queue = filtered
    .filter((p) => p.isBlocked || p.overdue || p.idleDays >= 7)
    .sort((a, b) => {
      const aScore = (a.overdue ? 3 : 0) + (a.riskLevel === "HIGH" ? 2 : a.riskLevel === "MEDIUM" ? 1 : 0) + (a.idleDays >= 7 ? 1 : 0);
      const bScore = (b.overdue ? 3 : 0) + (b.riskLevel === "HIGH" ? 2 : b.riskLevel === "MEDIUM" ? 1 : 0) + (b.idleDays >= 7 ? 1 : 0);
      return bScore - aScore;
    });

  const checkpoints = [...filtered]
    .filter((p) => p.status !== "COMPLETED")
    .sort((a, b) => {
      if (a.dueDays === null) return 1;
      if (b.dueDays === null) return -1;
      return a.dueDays - b.dueDays;
    });

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>PROJECTS / PROJECT OPERATIONS</div>
          <h1 className={styles.pageTitle}>Project Operations</h1>
          <div className={styles.pageSub}>Execution control · Blocker queue · Checkpoint discipline</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ New Project</button>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb16")}>
        {[
          { label: "Active Projects", value: filtered.length.toString(), sub: `${active} in execution`, color: "var(--accent)" },
          { label: "Blocked / High Risk", value: blocked.toString(), sub: "Needs admin action", color: blocked > 0 ? "var(--red)" : "var(--accent)" },
          { label: "Overdue", value: overdue.toString(), sub: "Past checkpoint", color: overdue > 0 ? "var(--red)" : "var(--accent)" },
          { label: "Stale Updates", value: stale.toString(), sub: "No update in 7d+", color: stale > 0 ? "var(--amber)" : "var(--accent)" },
          {
            label: "Ops Health",
            value: `${avgHealth}`,
            sub: money(filtered.reduce((sum, p) => sum + p.budgetCents, 0), currency) + " managed",
            color: avgHealth >= 75 ? "var(--accent)" : avgHealth >= 60 ? "var(--amber)" : "var(--red)"
          }
        ].map((kpi) => (
          <div key={kpi.label} className={styles.statCard}>
            <div className={styles.statLabel}>{kpi.label}</div>
            <div className={cx(styles.statValue, colorClass(kpi.color))}>{kpi.value}</div>
            <div className={cx("text11", "colorMuted")}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search project, client, owner"
          className={cx("formInput", styles.projOpsSearch)}
        />
        <select
          title="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className={styles.filterSelect}
        >
          <option value="ALL">All status</option>
          <option value="PLANNING">Planning</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVIEW">Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          title="Filter by risk"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
          className={styles.filterSelect}
        >
          <option value="ALL">All risk</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <select
          title="Filter by checkpoint"
          value={checkpointFilter}
          onChange={(e) => setCheckpointFilter(e.target.value as typeof checkpointFilter)}
          className={styles.filterSelect}
        >
          <option value="ALL">All checkpoints</option>
          <option value="ON_RHYTHM">On Rhythm</option>
          <option value="DUE_SOON">Due Soon</option>
          <option value="AT_RISK">At Risk</option>
          <option value="MISSED">Missed</option>
          <option value="STALE">Stale</option>
        </select>
        <select title="Select view" value={view} onChange={e => setView(e.target.value as ViewMode)} className={cx(styles.filterSelect, "mlAuto")}>
          {(["execution board", "ops queue", "checkpoint tracker"] as ViewMode[]).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {view === "execution board" ? (
        <div className={styles.projOpsBoardSplit}>
          <div className={styles.projOpsLanes}>
            {lanes.map((lane) => {
              const items = filtered.filter((p) => {
                if (lane.key === "AT_RISK") return p.riskLevel === "HIGH" || ["BLOCKED", "DELAYED", "ON_HOLD"].includes(p.status);
                return p.status === lane.key;
              });
              return (
                <div key={lane.key} className={styles.projOpsLane}>
                  <div className={styles.projOpsLaneHead}>
                    <span className={cx("fontMono", "text10", "uppercase", colorClass(lane.color))}>{lane.label}</span>
                    <span className={cx("fontMono", "text11", "colorMuted")}>{items.length}</span>
                  </div>
                  <div className={styles.projOpsLaneBody}>
                    {items.length > 0 ? (
                      items.map((p) => (
                        <div key={p.id} className={cx(styles.projOpsLaneItem, p.id === selectedId && styles.projOpsLaneItemActive)}>
                          <div className={styles.projOpsLaneName}>{p.name}</div>
                          <div className={styles.projOpsLaneClient}>{p.clientName}</div>
                          <div className={styles.projOpsLaneMeta}>
                            <span className={riskClass(p.riskLevel)}>{p.riskLevel}</span>
                            <span className={p.overdue ? "colorRed" : "colorMuted"}>{p.dueDays === null ? "No due" : `${p.dueDays}d`}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedId(p.id)}
                            className={styles.projOpsMiniBtn}
                          >
                            Open
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className={styles.projOpsEmpty11}>No items</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.projOpsDetailCard}>
            <div className={styles.projOpsDetailHead}>
              <div className={cx("text12", "fw700")}>Execution Detail</div>
              <span className={styles.projOpsIdTag}>{selected?.id.slice(0, 8) ?? "No project"}</span>
            </div>
            {selected ? (
              <>
                <div className={styles.projOpsDetailName}>{selected.name}</div>
                <div className={styles.projOpsDetailMeta}>{selected.clientName} · Owner: {selected.ownerName ?? "Unassigned"}</div>

                <div className={styles.projOpsMetricGrid}>
                  {[
                    { label: "Status", value: selected.status, color: statusTone(selected.status) },
                    { label: "Risk", value: selected.riskLevel, color: riskTone(selected.riskLevel) },
                    { label: "Progress", value: `${selected.progressPercent}%`, color: selected.progressPercent >= 70 ? "var(--accent)" : selected.progressPercent >= 40 ? "var(--amber)" : "var(--red)" },
                    { label: "Checkpoint", value: selected.checkpoint.label, color: selected.checkpoint.color },
                    { label: "Due", value: selected.dueDays === null ? "Not set" : `${selected.dueDays}d`, color: selected.overdue ? "var(--red)" : "var(--muted)" },
                    { label: "Idle", value: `${selected.idleDays}d`, color: selected.idleDays >= 7 ? "var(--amber)" : "var(--muted)" }
                  ].map((m) => (
                    <div key={m.label} className={styles.projOpsMetricCard}>
                      <div className={styles.projOpsMetricLabel}>{m.label}</div>
                      <div className={cx("fontMono", "fw700", colorClass(m.color))}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className={styles.projOpsFocusLabel}>Operations Focus</div>
                <div className={styles.projOpsFocusCard}>
                  {selected.overdue
                    ? "Rebaseline scope and secure immediate client checkpoint update."
                    : selected.riskLevel === "HIGH"
                      ? "Escalate owner and remove dependency blockers within 48 hours."
                      : selected.idleDays >= 7
                        ? "Restart cadence with a same-day owner sync and visible next step."
                        : "Current execution rhythm is healthy; keep weekly checkpoint updates."}
                </div>

                <div className={styles.projOpsActionRow}>
                  <button
                    type="button"
                    onClick={openEditProject}
                    disabled={!canOperate}
                    className={cx("btnSm", "btnAccent", !canOperate && "opacity60")}
                    aria-disabled={!canOperate}
                  >
                    Edit Project
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleQueueJob("CHECKPOINT_REMINDER", selected?.id)}
                    disabled={!canOperate}
                    className={cx("btnSm", "btnGhost", !canOperate && "opacity60")}
                    aria-disabled={!canOperate}
                  >
                    Log Escalation
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleQueueJob("OWNER_FOLLOWUP", selected?.id)}
                    disabled={!canOperate}
                    className={cx("btnSm", "btnGhost", !canOperate && "opacity60")}
                    aria-disabled={!canOperate}
                  >
                    Nudge Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleQueueJob("CHECKPOINT_REMINDER", selected?.id)}
                    disabled={!canOperate}
                    className={cx("btnSm", "btnGhost", !canOperate && "opacity60")}
                    aria-disabled={!canOperate}
                  >
                    Send Checkpoint Prompt
                  </button>
                </div>
              </>
            ) : (
              <div className={cx("text12", "colorMuted")}>Select a project to view execution details.</div>
            )}
          </div>
        </div>
      ) : null}

      {view === "ops queue" ? (
        <div className={cx("card", "overflowHidden", "p0")}>
          <div className={cx(styles.projOpsQueueGrid, "px20", "borderB", "fontMono", "text10", "colorMuted", "uppercase", "tracking")}>
            <span>
              <input
                type="checkbox"
                title="Select all"
                checked={filtered.length > 0 && selectedIds.size === filtered.length}
                onChange={toggleSelectAll}
              />
            </span>
            {["Project", "Status", "Risk", "Due", "Idle", "Recommended Action"].map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {queue.length > 0 ? (
            queue.map((p, i) => (
              <div key={p.id} className={cx(styles.projOpsQueueGrid, styles.projOpsQueueRowAlign, "px20", "py12", i < queue.length - 1 && "borderB")}>
                <span>
                  <input
                    type="checkbox"
                    title={`Select ${p.name}`}
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </span>
                <div>
                  <div className={cx("text12", "fw700")}>{p.name}</div>
                  <div className={cx("text11", "colorMuted")}>{p.clientName}</div>
                </div>
                <span className={cx("fontMono", statusClass(p.status))}>{p.status}</span>
                <span className={cx("fontMono", riskClass(p.riskLevel))}>{p.riskLevel}</span>
                <span className={cx("fontMono", p.overdue ? "colorRed" : "colorMuted")}>{p.dueDays === null ? "Not set" : `${p.dueDays}d`}</span>
                <span className={cx("fontMono", p.idleDays >= 7 ? "colorAmber" : "colorMuted")}>{p.idleDays}d</span>
                <span className={cx("text11", "colorMuted")}>
                  {p.overdue
                    ? "Rebaseline and send client recovery timeline."
                    : p.riskLevel === "HIGH"
                      ? "Escalate dependency owner and set 48h unblock target."
                      : p.idleDays >= 7
                        ? "Run owner check-in and capture next committed step."
                        : "Review ops signal and monitor."}
                </span>
              </div>
            ))
          ) : (
            <div className={cx("p20", "colorMuted", "text12")}>No active blockers in current filter set.</div>
          )}
        </div>
      ) : null}

      {view === "checkpoint tracker" ? (
        <div className={styles.projOpsCheckpointSplit}>
          <div className={cx("card", "overflowHidden", "p0")}>
            <div className={cx(styles.projOpsCheckGrid, "px20", "borderB", "fontMono", "text10", "colorMuted", "uppercase", "tracking")}>
              <span>
                <input
                  type="checkbox"
                  title="Select all"
                  checked={checkpoints.length > 0 && checkpoints.every((p) => selectedIds.has(p.id))}
                  onChange={() => {
                    const allSelected = checkpoints.every((p) => selectedIds.has(p.id));
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      checkpoints.forEach((p) => { if (allSelected) next.delete(p.id); else next.add(p.id); });
                      return next;
                    });
                  }}
                />
              </span>
              {["Project", "Status", "Risk", "Checkpoint", "Due"].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {checkpoints.length > 0 ? (
              checkpoints.map((p, i) => (
                <div key={p.id} className={cx(styles.projOpsCheckGrid, styles.projOpsQueueRowAlign, "px20", "py12", i < checkpoints.length - 1 && "borderB")}>
                  <span>
                    <input
                      type="checkbox"
                      title={`Select ${p.name}`}
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </span>
                  <div>
                    <div className={cx("text12", "fw700")}>{p.name}</div>
                    <div className={cx("text11", "colorMuted")}>{p.clientName}</div>
                  </div>
                  <span className={cx("fontMono", "text11", statusClass(p.status))}>{p.status}</span>
                  <span className={cx("fontMono", "text11", riskClass(p.riskLevel))}>{p.riskLevel}</span>
                  <span className={cx("fontMono", "text11", colorClass(p.checkpoint.color))}>{p.checkpoint.label}</span>
                  <span className={cx("fontMono", "text11", p.overdue ? "colorRed" : p.dueDays !== null && p.dueDays <= 7 ? "colorAmber" : "colorMuted")}>
                    {p.dueDays === null ? "Not set" : `${fmtDate(p.dueAt)} (${p.dueDays}d)`}
                  </span>
                </div>
              ))
            ) : (
              <div className={cx("p20", "colorMuted", "text12")}>No checkpoints available for current filter.</div>
            )}
          </div>

          <div className={styles.projOpsDetailCard}>
            <div className={cx("text12", "fw700", "mb10")}>Checkpoint Discipline</div>
            <div className={styles.projOpsMetricGrid}>
              {[
                { label: "Due this week", value: String(checkpoints.filter((p) => p.dueDays !== null && p.dueDays >= 0 && p.dueDays <= 7).length), color: "var(--amber)" },
                { label: "Missed", value: String(checkpoints.filter((p) => p.dueDays !== null && p.dueDays < 0).length), color: "var(--red)" },
                { label: "No due date", value: String(checkpoints.filter((p) => p.dueDays === null).length), color: "var(--muted)" },
                { label: "Invoice risk linked", value: String(checkpoints.filter((p) => p.invoiceOverdue > 0).length), color: "var(--red)" }
              ].map((m) => (
                <div key={m.label} className={styles.projOpsMetricCard}>
                  <div className={styles.projOpsMetricLabel}>{m.label}</div>
                  <div className={cx("fontMono", "fw700", colorClass(m.color))}>{m.value}</div>
                </div>
              ))}
            </div>
            <div className={styles.projOpsDiscNote}>
              This view focuses only on operational discipline: checkpoint dates, stale ownership, and risk states. Planning depth and capacity remain in Portfolio, Gantt, and Resource Allocation.
            </div>
            <button
              type="button"
              onClick={() => void handleQueueJob("CHECKPOINT_DIGEST")}
              disabled={!canOperate}
              className={cx("btnSm", "btnAccent", "wFull", !canOperate && "opacity60")}
            >
              Send Weekly Checkpoint Digest
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Floating Bulk Action Bar ─────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className={cx("projOpsBulkBar")}>
          <span className={cx("projOpsBulkCount")}>
            {selectedIds.size} project{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <span className={cx("projOpsBulkLabel")}>Move to:</span>
          <select
            title="New status for selected projects"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED")}
            className={cx("projOpsBulkSelect")}
          >
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            disabled={bulkApplying || !canOperate}
            onClick={() => void handleBulkApply()}
          >
            {bulkApplying ? "Applying…" : "Apply"}
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => setSelectedIds(new Set())}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* ── Edit Project Modal ─────────────────────────────────────────────── */}
      {showEditProject && selected && (
        <div className={styles.modalOverlay} onClick={() => setShowEditProject(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHd}>
              <span className={cx("fw700", "text14")}>Edit Project</span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowEditProject(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fieldLabel}>Project Name</div>
              <input
                className={styles.fieldInput}
                value={editProjName}
                onChange={(e) => setEditProjName(e.target.value)}
                placeholder="Project name"
              />
              <div className={styles.fieldLabel}>Status</div>
              <select
                title="Project status"
                className={styles.fieldInput}
                value={editProjStatus}
                onChange={(e) => setEditProjStatus(e.target.value as typeof editProjStatus)}
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className={styles.fieldLabel}>Priority</div>
              <select
                title="Project priority"
                className={styles.fieldInput}
                value={editProjPriority}
                onChange={(e) => setEditProjPriority(e.target.value as typeof editProjPriority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <div className={styles.fieldLabel}>Owner Name</div>
              <input
                className={styles.fieldInput}
                value={editProjOwner}
                onChange={(e) => setEditProjOwner(e.target.value)}
                placeholder="Assigned owner"
              />
              <div className={styles.fieldLabel}>Due Date</div>
              <input
                type="date"
                className={styles.fieldInput}
                value={editProjDueAt}
                onChange={(e) => setEditProjDueAt(e.target.value)}
              />
              <div className={styles.fieldLabel}>Budget</div>
              <input
                type="number"
                className={styles.fieldInput}
                value={editProjBudget}
                onChange={(e) => setEditProjBudget(e.target.value)}
                placeholder="e.g. 50000"
                min={0}
              />
              <div className={cx("flexRow", "gap8", "mt8")}>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent", "flex1")}
                  onClick={handleEditProject}
                  disabled={editProjSaving || !editProjName.trim()}
                >
                  {editProjSaving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" className={cx("btnSm", "btnGhost", "flex1")} onClick={() => setShowEditProject(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
