"use client";

import { useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

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
  const code = currency && currency !== "AUTO" ? currency : "ZAR";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0
    }).format(amountCents / 100);
  } catch {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0
    }).format(amountCents / 100);
  }
}

function statusTone(status: string): string {
  const s = status.toUpperCase();
  if (["BLOCKED", "DELAYED", "ON_HOLD", "CANCELLED"].includes(s)) return C.red;
  if (["REVIEW", "PLANNING"].includes(s)) return C.amber;
  if (s === "IN_PROGRESS") return C.blue;
  return C.primary;
}

function riskTone(risk: string): string {
  if (risk === "HIGH") return C.red;
  if (risk === "MEDIUM") return C.amber;
  return C.primary;
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
  if (project.status === "COMPLETED") return { label: "Closed", color: C.primary };
  if (project.dueDays !== null && project.dueDays < 0) return { label: "Missed", color: C.red };
  if (project.riskLevel === "HIGH") return { label: "At Risk", color: C.red };
  if (project.dueDays !== null && project.dueDays <= 7) return { label: "Due Soon", color: C.amber };
  if (project.idleDays >= 7) return { label: "Stale", color: C.amber };
  return { label: "On Rhythm", color: C.blue };
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

  const lanes: Array<{ key: string; label: string; color: string }> = [
    { key: "PLANNING", label: "Planning", color: C.amber },
    { key: "IN_PROGRESS", label: "In Progress", color: C.blue },
    { key: "REVIEW", label: "Review", color: C.amber },
    { key: "AT_RISK", label: "At Risk", color: C.red },
    { key: "COMPLETED", label: "Completed", color: C.primary }
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
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Syne, sans-serif", padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / OPERATIONS</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Project Operations</h1>
          <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>Execution control · Blocker queue · Checkpoint discipline</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, border: "none", padding: "8px 16px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ New Project</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Active Projects", value: filtered.length.toString(), sub: `${active} in execution`, color: C.primary },
          { label: "Blocked / High Risk", value: blocked.toString(), sub: "Needs admin action", color: blocked > 0 ? C.red : C.primary },
          { label: "Overdue", value: overdue.toString(), sub: "Past checkpoint", color: overdue > 0 ? C.red : C.primary },
          { label: "Stale Updates", value: stale.toString(), sub: "No update in 7d+", color: stale > 0 ? C.amber : C.primary },
          {
            label: "Ops Health",
            value: `${avgHealth}`,
            sub: money(filtered.reduce((sum, p) => sum + p.budgetCents, 0), currency) + " managed",
            color: avgHealth >= 75 ? C.primary : avgHealth >= 60 ? C.amber : C.red
          }
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 24, fontWeight: 800, color: kpi.color, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search project, client, owner"
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", minWidth: 280, fontFamily: "DM Mono, monospace", fontSize: 12 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}
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
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}
          >
            <option value="ALL">All risk</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <select
            value={checkpointFilter}
            onChange={(e) => setCheckpointFilter(e.target.value as typeof checkpointFilter)}
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}
          >
            <option value="ALL">All checkpoints</option>
            <option value="ON_RHYTHM">On Rhythm</option>
            <option value="DUE_SOON">Due Soon</option>
            <option value="AT_RISK">At Risk</option>
            <option value="MISSED">Missed</option>
            <option value="STALE">Stale</option>
          </select>
          <button
            onClick={() => {
              setQuery("");
              setStatusFilter("ALL");
              setRiskFilter("ALL");
              setCheckpointFilter("ALL");
            }}
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}
          >
            Reset
          </button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {(["execution board", "ops queue", "checkpoint tracker"] as ViewMode[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                style={{
                  background: "none",
                  color: view === tab ? C.primary : C.muted,
                  border: "none",
                  borderBottom: view === tab ? `2px solid ${C.primary}` : "none",
                  padding: "8px 12px",
                  fontFamily: "Syne, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "capitalize",
                  cursor: "pointer"
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "execution board" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {lanes.map((lane) => {
              const items = filtered.filter((p) => {
                if (lane.key === "AT_RISK") return p.riskLevel === "HIGH" || ["BLOCKED", "DELAYED", "ON_HOLD"].includes(p.status);
                return p.status === lane.key;
              });
              return (
                <div key={lane.key} style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div style={{ padding: "12px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: "0.08em", color: lane.color, textTransform: "uppercase" }}>{lane.label}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{items.length}</span>
                  </div>
                  <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.length > 0 ? (
                      items.map((p) => (
                        <div key={p.id} style={{ background: C.bg, border: `1px solid ${p.id === selectedId ? `${C.primary}66` : C.border}`, padding: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{p.clientName}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "DM Mono, monospace", fontSize: 10 }}>
                            <span style={{ color: riskTone(p.riskLevel) }}>{p.riskLevel}</span>
                            <span style={{ color: p.overdue ? C.red : C.muted }}>{p.dueDays === null ? "No due" : `${p.dueDays}d`}</span>
                          </div>
                          <button
                            onClick={() => setSelectedId(p.id)}
                            style={{ marginTop: 6, background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "4px 8px", fontFamily: "DM Mono, monospace", fontSize: 10, cursor: "pointer" }}
                          >
                            Open
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 8, color: C.muted, fontSize: 11 }}>No items</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Execution Detail</div>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{selected?.id.slice(0, 8) ?? "No project"}</span>
            </div>
            {selected ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{selected.clientName} · Owner: {selected.ownerName ?? "Unassigned"}</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Status", value: selected.status, color: statusTone(selected.status) },
                    { label: "Risk", value: selected.riskLevel, color: riskTone(selected.riskLevel) },
                    { label: "Progress", value: `${selected.progressPercent}%`, color: selected.progressPercent >= 70 ? C.primary : selected.progressPercent >= 40 ? C.amber : C.red },
                    { label: "Checkpoint", value: selected.checkpoint.label, color: selected.checkpoint.color },
                    { label: "Due", value: selected.dueDays === null ? "Not set" : `${selected.dueDays}d`, color: selected.overdue ? C.red : C.muted },
                    { label: "Idle", value: `${selected.idleDays}d`, color: selected.idleDays >= 7 ? C.amber : C.muted }
                  ].map((m) => (
                    <div key={m.label} style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 10 }}>
                      <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Operations Focus</div>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 10, marginBottom: 12, fontSize: 12 }}>
                  {selected.overdue
                    ? "Rebaseline scope and secure immediate client checkpoint update."
                    : selected.riskLevel === "HIGH"
                      ? "Escalate owner and remove dependency blockers within 48 hours."
                      : selected.idleDays >= 7
                        ? "Restart cadence with a same-day owner sync and visible next step."
                        : "Current execution rhythm is healthy; keep weekly checkpoint updates."}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => onNotify("success", "Escalation logged for Project Operations.")}
                    disabled={!canOperate}
                    style={{ background: C.primary, color: C.bg, border: "none", padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: canOperate ? 1 : 0.5 }}
                  >
                    Log Escalation
                  </button>
                  <button
                    onClick={() => onNotify("success", "Owner follow-up queued.")}
                    disabled={!canOperate}
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer", opacity: canOperate ? 1 : 0.5 }}
                  >
                    Nudge Owner
                  </button>
                  <button
                    onClick={() => onNotify("success", "Checkpoint reminder scheduled.")}
                    disabled={!canOperate}
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer", opacity: canOperate ? 1 : 0.5 }}
                  >
                    Send Checkpoint Prompt
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: C.muted, fontSize: 12 }}>Select a project to view execution details.</div>
            )}
          </div>
        </div>
      ) : null}

      {view === "ops queue" ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 100px 90px 90px 100px 1fr", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {["Project", "Status", "Risk", "Due", "Idle", "Recommended Action"].map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {queue.length > 0 ? (
            queue.map((p, i) => (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 100px 90px 90px 100px 1fr", padding: "12px 20px", borderBottom: i < queue.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{p.clientName}</div>
                </div>
                <span style={{ fontFamily: "DM Mono, monospace", color: statusTone(p.status) }}>{p.status}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: riskTone(p.riskLevel) }}>{p.riskLevel}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: p.overdue ? C.red : C.muted }}>{p.dueDays === null ? "Not set" : `${p.dueDays}d`}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: p.idleDays >= 7 ? C.amber : C.muted }}>{p.idleDays}d</span>
                <span style={{ fontSize: 11, color: C.muted }}>
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
            <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>No active blockers in current filter set.</div>
          )}
        </div>
      ) : null}

      {view === "checkpoint tracker" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 90px 100px 110px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {["Project", "Status", "Risk", "Checkpoint", "Due"].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {checkpoints.length > 0 ? (
              checkpoints.map((p, i) => (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 90px 100px 110px", padding: "12px 20px", borderBottom: i < checkpoints.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{p.clientName}</div>
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: statusTone(p.status), fontSize: 11 }}>{p.status}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: riskTone(p.riskLevel), fontSize: 11 }}>{p.riskLevel}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: p.checkpoint.color, fontSize: 11 }}>{p.checkpoint.label}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: p.overdue ? C.red : p.dueDays !== null && p.dueDays <= 7 ? C.amber : C.muted, fontSize: 11 }}>
                    {p.dueDays === null ? "Not set" : `${fmtDate(p.dueAt)} (${p.dueDays}d)`}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>No checkpoints available for current filter.</div>
            )}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Checkpoint Discipline</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Due this week", value: String(checkpoints.filter((p) => p.dueDays !== null && p.dueDays >= 0 && p.dueDays <= 7).length), color: C.amber },
                { label: "Missed", value: String(checkpoints.filter((p) => p.dueDays !== null && p.dueDays < 0).length), color: C.red },
                { label: "No due date", value: String(checkpoints.filter((p) => p.dueDays === null).length), color: C.muted },
                { label: "Invoice risk linked", value: String(checkpoints.filter((p) => p.invoiceOverdue > 0).length), color: C.red }
              ].map((m) => (
                <div key={m.label} style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 10 }}>
                  <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
              This view focuses only on operational discipline: checkpoint dates, stale ownership, and risk states. Planning depth and capacity remain in Portfolio, Gantt, and Resource Allocation.
            </div>
            <button
              onClick={() => onNotify("success", "Weekly checkpoint digest queued.")}
              disabled={!canOperate}
              style={{ width: "100%", background: C.primary, color: C.bg, border: "none", padding: "10px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: canOperate ? 1 : 0.5 }}
            >
              Send Weekly Checkpoint Digest
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
