"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeadPipelineStatus } from "../../../../lib/api/admin";
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

const STAGES: LeadPipelineStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

type ViewMode = "list" | "kanban";

function tone(status: LeadPipelineStatus): string {
  if (status === "NEW") return C.blue;
  if (status === "QUALIFIED") return C.amber;
  if (status === "LOST") return C.red;
  return C.primary;
}

function label(status: LeadPipelineStatus): string {
  return status.replace("_", " ");
}

function formatDate(value?: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-ZA", { month: "short", day: "2-digit" }).format(date);
}

function leadScore(lead: ReturnType<typeof useAdminWorkspaceContext>["snapshot"]["leads"][number], now: number): number {
  const base: Record<LeadPipelineStatus, number> = {
    NEW: 20,
    CONTACTED: 35,
    QUALIFIED: 55,
    PROPOSAL: 75,
    WON: 90,
    LOST: 5
  };
  const sourceBonus: Record<string, number> = { referral: 16, linkedin: 12, website: 10, google: 9, meta: 6 };
  const staleDays = Math.max(0, Math.floor((now - new Date(lead.updatedAt).getTime()) / 86400000));
  const freshness = staleDays <= 2 ? 10 : staleDays <= 7 ? 4 : -10;
  const notes = lead.notes && lead.notes.trim().length > 24 ? 6 : 0;
  const raw = base[lead.status] + (sourceBonus[(lead.source ?? "").toLowerCase()] ?? 0) + freshness + notes;
  return Math.max(0, Math.min(100, raw));
}

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
  const isClient = session?.user.role === "CLIENT";
  const [view, setView] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"ALL" | LeadPipelineStatus>("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(leads[0]?.id ?? null);

  const rows = useMemo(() => {
    return leads.map((lead) => {
      const staleDays = Math.max(0, Math.floor((clock - new Date(lead.updatedAt).getTime()) / 86400000));
      const score = leadScore(lead, clock);
      const priority = score >= 75 ? "Hot" : score >= 45 ? "Warm" : "Cold";
      return { ...lead, staleDays, score, priority };
    });
  }, [leads, clock]);

  useEffect(() => {
    if (selectedId && !rows.some((row) => row.id === selectedId)) setSelectedId(rows[0]?.id ?? null);
  }, [rows, selectedId]);

  const sources = useMemo(
    () => Array.from(new Set(rows.map((row) => row.source?.trim()).filter((v): v is string => Boolean(v)))),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (stageFilter !== "ALL" && row.status !== stageFilter) return false;
      if (sourceFilter !== "ALL" && (row.source ?? "Unknown") !== sourceFilter) return false;
      if (!q) return true;
      return row.title.toLowerCase().includes(q) || (row.notes ?? "").toLowerCase().includes(q) || (row.source ?? "").toLowerCase().includes(q);
    });
  }, [rows, query, sourceFilter, stageFilter]);

  const selected = filtered.find((row) => row.id === selectedId) ?? rows.find((row) => row.id === selectedId) ?? null;

  const won = rows.filter((row) => row.status === "WON").length;
  const lost = rows.filter((row) => row.status === "LOST").length;
  const active = rows.filter((row) => row.status !== "WON" && row.status !== "LOST").length;
  const hot = rows.filter((row) => row.priority === "Hot").length;
  const followUps = rows.filter((row) => row.status !== "WON" && row.status !== "LOST" && row.staleDays >= 3).length;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  async function moveLead(id: string, status: LeadPipelineStatus): Promise<void> {
    if (isClient) return;
    let lostReason = "";
    if (status === "LOST") {
      lostReason = window.prompt("Reason for marking lead as LOST", "No budget / delayed decision")?.trim() ?? "";
      if (!lostReason) return;
    }
    const ok = await onMoveLead(id, status, status === "LOST" ? { lostReason } : undefined);
    if (!ok) return;
    await onRefreshSnapshot(session ?? undefined);
    onNotify("success", `Lead moved to ${label(status)}.`);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Syne, sans-serif", padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / OPERATIONS</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Leads Pipeline</h1>
          <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>Stage tracking · Next actions · Conversion control</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, border: "none", padding: "8px 16px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ New Lead</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Pipeline Leads", value: rows.length.toString(), sub: `${active} active`, color: C.primary },
          { label: "Hot Leads", value: hot.toString(), sub: rows.length > 0 ? `${Math.round((hot / rows.length) * 100)}% high intent` : "0% high intent", color: C.primary },
          { label: "Follow-ups Due", value: followUps.toString(), sub: "Idle 3d+", color: followUps > 0 ? C.amber : C.primary },
          { label: "Win Rate", value: `${winRate}%`, sub: `${won} won · ${lost} lost`, color: winRate >= 50 ? C.primary : C.amber }
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 26, fontWeight: 800, color: kpi.color, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 16 }}>
        {STAGES.map((stage) => {
          const count = filtered.filter((row) => row.status === stage).length;
          const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
          return (
            <div key={stage} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 12 }}>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: tone(stage), letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{label(stage)}</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 2 }}>{count}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{pct}% of filtered</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lead, source, notes" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", minWidth: 260, fontFamily: "DM Mono, monospace", fontSize: 12 }} />
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as "ALL" | LeadPipelineStatus)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            <option value="ALL">All stages</option>
            {STAGES.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            <option value="ALL">All sources</option>
            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
          <button onClick={() => { setQuery(""); setStageFilter("ALL"); setSourceFilter("ALL"); }} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>Reset</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={() => setView("list")} style={{ background: view === "list" ? C.primary : C.bg, color: view === "list" ? C.bg : C.muted, border: `1px solid ${view === "list" ? C.primary : C.border}`, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>List</button>
            <button onClick={() => setView("kanban")} style={{ background: view === "kanban" ? C.primary : C.bg, color: view === "kanban" ? C.bg : C.muted, border: `1px solid ${view === "kanban" ? C.primary : C.border}`, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>Kanban</button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <div>
          {view === "list" ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 100px 100px 70px 80px 120px 90px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {[
                  "Lead", "Stage", "Source", "Score", "Idle", "Follow-up", "Open"
                ].map((h) => <span key={h}>{h}</span>)}
              </div>
              {filtered.length > 0 ? filtered.map((row, i) => (
                <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 100px 100px 70px 80px 120px 90px", padding: "14px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", background: row.id === selectedId ? `${C.primary}12` : "transparent" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{row.title}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{row.company ?? "No company"}</div>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: tone(row.status), background: `${tone(row.status)}20`, padding: "3px 8px" }}>{label(row.status)}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{row.source ?? "Unknown"}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.primary }}>{row.score}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: row.staleDays >= 5 ? C.red : C.muted }}>{row.staleDays}d</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{formatDate(row.nextFollowUpAt)}</span>
                  <button onClick={() => setSelectedId(row.id)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Open</button>
                </div>
              )) : <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>No leads match current filters.</div>}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {STAGES.map((stage) => {
                const items = filtered.filter((row) => row.status === stage);
                return (
                  <div key={stage} style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: "0.08em", color: tone(stage), textTransform: "uppercase" }}>{label(stage)}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{items.length}</span>
                    </div>
                    <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                      {items.length > 0 ? items.map((row) => (
                        <div key={row.id} style={{ background: C.bg, border: `1px solid ${row.id === selectedId ? `${C.primary}66` : C.border}`, padding: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{row.title}</div>
                            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: row.priority === "Hot" ? C.red : row.priority === "Warm" ? C.amber : C.primary }}>{row.priority}</span>
                          </div>
                          <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>{row.source ?? "Unknown"} · Score {row.score}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button onClick={() => setSelectedId(row.id)} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "5px 8px", fontFamily: "DM Mono, monospace", fontSize: 10, cursor: "pointer" }}>Details</button>
                            {!isClient ? STAGES.filter((next) => next !== row.status).slice(0, 2).map((next) => (
                              <button key={next} onClick={() => void moveLead(row.id, next)} disabled={transitioningLeadId === row.id} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted, padding: "5px 8px", fontFamily: "DM Mono, monospace", fontSize: 10, cursor: "pointer" }}>
                                {transitioningLeadId === row.id ? "Saving..." : `Move ${label(next)}`}
                              </button>
                            )) : null}
                          </div>
                        </div>
                      )) : <div style={{ padding: 10, color: C.muted, fontSize: 11 }}>No leads</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Lead Detail</div>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{selected?.id.slice(0, 8) ?? "No lead"}</span>
          </div>
          {selected ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{selected.title}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{selected.company ?? "No company"} · {selected.source ?? "Unknown"}</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Stage", value: label(selected.status), color: tone(selected.status) },
                  { label: "Score", value: String(selected.score), color: C.primary },
                  { label: "Idle", value: `${selected.staleDays}d`, color: selected.staleDays >= 5 ? C.red : C.muted },
                  { label: "Priority", value: selected.priority, color: selected.priority === "Hot" ? C.red : selected.priority === "Warm" ? C.amber : C.primary }
                ].map((m) => (
                  <div key={m.label} style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 10 }}>
                    <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Next Follow-up: {formatDate(selected.nextFollowUpAt)}</div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 12, fontSize: 12, minHeight: 90 }}>
                {selected.notes?.trim() || "No notes available."}
              </div>

              {!isClient ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {STAGES.filter((next) => next !== selected.status).map((next) => (
                    <button key={next} onClick={() => void moveLead(selected.id, next)} disabled={transitioningLeadId === selected.id} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 10, cursor: "pointer" }}>
                      {transitioningLeadId === selected.id ? "Saving..." : `Move ${label(next)}`}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ color: C.muted, fontSize: 12 }}>Select a lead to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
