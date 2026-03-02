"use client";

import { useMemo, useState } from "react";
import type { LeadPipelineStatus } from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

const STAGES: LeadPipelineStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

type ViewMode = "list" | "kanban";

function tone(status: LeadPipelineStatus): string {
  if (status === "NEW") return "var(--blue)";
  if (status === "QUALIFIED") return "var(--amber)";
  if (status === "LOST") return "var(--red)";
  return "var(--accent)";
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
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / OPERATIONS</div>
          <h1 className={styles.pageTitle}>Leads Pipeline</h1>
          <div className={styles.pageSub}>Stage tracking · Next actions · Conversion control</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Lead</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Pipeline Leads", value: rows.length.toString(), sub: `${active} active`, color: "var(--accent)" },
          { label: "Hot Leads", value: hot.toString(), sub: rows.length > 0 ? `${Math.round((hot / rows.length) * 100)}% high intent` : "0% high intent", color: "var(--accent)" },
          { label: "Follow-ups Due", value: followUps.toString(), sub: "Idle 3d+", color: followUps > 0 ? "var(--amber)" : "var(--accent)" },
          { label: "Win Rate", value: `${winRate}%`, sub: `${won} won · ${lost} lost`, color: winRate >= 50 ? "var(--accent)" : "var(--amber)" }
        ].map((kpi) => (
          <div key={kpi.label} className={styles.statCard}>
            <div className={styles.statLabel}>{kpi.label}</div>
            <div className={cx(styles.statValue, "mb4", styles.leadsToneText, toneClass(kpi.color))}>{kpi.value}</div>
            <div className={cx("text11", "colorMuted")}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className={cx("mb16")}>
        <div className={styles.leadsStageRail6}>
          {STAGES.map((stage) => {
            const count = filtered.filter((row) => row.status === stage).length;
            const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
            return (
              <div key={stage} className={cx("card", "p12")}>
                <div className={cx("fontMono", "text10", "uppercase", "mb8", styles.leadsToneText, toneClass(tone(stage)))}>{label(stage)}</div>
                <div className={cx("fontMono", "fw800", "mb3", styles.leadsStageCount)}>{count}</div>
                <div className={cx("text10", "colorMuted")}>{pct}% of filtered</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={cx("card", "p14", "mb12")}>
        <div className={cx("flexRow", "gap10", "flexWrap")}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lead, source, notes" className={cx("formInput", styles.leadsSearchInput)} />
          <select title="Filter by stage" value={stageFilter} onChange={(e) => setStageFilter(e.target.value as "ALL" | LeadPipelineStatus)} className={styles.formInput}>
            <option value="ALL">All stages</option>
            {STAGES.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
          </select>
          <select title="Filter by source" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={styles.formInput}>
            <option value="ALL">All sources</option>
            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
          <select title="Switch view mode" value={view} onChange={e => setView(e.target.value as ViewMode)} className={cx(styles.filterSelect, "mlAuto")}>
            <option value="list">List</option>
            <option value="kanban">Kanban</option>
          </select>
        </div>
      </div>

      <div className={styles.leadsSplit}>
        <div>
          {view === "list" ? (
            <div className={cx("card", "overflowHidden")}>
              <div className={cx("leadsTableHead", "fontMono", "text10", "colorMuted", "uppercase")}>
                {[
                  "Lead", "Stage", "Source", "Score", "Idle", "Follow-up", "Open"
                ].map((h) => <span key={h}>{h}</span>)}
              </div>
              {filtered.length > 0 ? filtered.map((row) => (
                <div key={row.id} className={cx(styles.leadsTableRow, row.id === selectedId && styles.leadsRowSelected)}>
                  <div>
                    <div className={cx("text13", "fw700")}>{row.title}</div>
                    <div className={cx("text11", "colorMuted")}>{row.company ?? "No company"}</div>
                  </div>
                  <span className={cx("text10", "fontMono", styles.leadsToneBadge, toneClass(tone(row.status)))}>{label(row.status)}</span>
                  <span className={cx("text12", "colorMuted")}>{row.source ?? "Unknown"}</span>
                  <span className={cx("fontMono", "colorAccent")}>{row.score}</span>
                  <span className={cx("fontMono", styles.leadsToneText, toneClass(row.staleDays >= 5 ? "var(--red)" : "var(--muted)"))}>{row.staleDays}d</span>
                  <span className={cx("text11", "colorMuted")}>{formatDate(row.nextFollowUpAt)}</span>
                  <button type="button" onClick={() => setSelectedId(row.id)} className={cx("btnSm", "btnGhost")}>Open</button>
                </div>
              )) : <div className={cx("p20", "colorMuted", "text12")}>No leads match current filters.</div>}
            </div>
          ) : (
            <div className={cx("grid3")}>
              {STAGES.map((stage) => {
                const items = filtered.filter((row) => row.status === stage);
                return (
                  <div key={stage} className={styles.card}>
                    <div className={cx("flexBetween", "p12", "borderB")}>
                      <span className={cx("fontMono", "text10", "uppercase", styles.leadsToneText, toneClass(tone(stage)))}>{label(stage)}</span>
                      <span className={cx("fontMono", "text11", "colorMuted")}>{items.length}</span>
                    </div>
                    <div className={cx("flexCol", "gap8", "p10")}>
                      {items.length > 0 ? items.map((row) => (
                        <div key={row.id} className={cx("bgBg", "borderDefault", "p10", row.id === selectedId && styles.leadsKanbanSelected)}>
                          <div className={cx("flexBetween", "gap8", "mb4")}>
                            <div className={cx("text12", "fw700")}>{row.title}</div>
                            <span className={cx("fontMono", "text10", styles.leadsToneText, toneClass(row.priority === "Hot" ? "var(--red)" : row.priority === "Warm" ? "var(--amber)" : "var(--accent)"))}>{row.priority}</span>
                          </div>
                          <div className={cx("text10", "colorMuted", "mb8")}>{row.source ?? "Unknown"} · Score {row.score}</div>
                          <div className={cx("flexRow", "gap6", "flexWrap")}>
                            <button type="button" onClick={() => setSelectedId(row.id)} className={cx("btnSm", "btnGhost", styles.leadsMiniBtn)}>Details</button>
                            {!isClient ? STAGES.filter((next) => next !== row.status).slice(0, 2).map((next) => (
                              <button type="button" key={next} onClick={() => void moveLead(row.id, next)} disabled={transitioningLeadId === row.id} className={cx("btnSm", "btnGhost", styles.leadsMiniBtn)}>
                                {transitioningLeadId === row.id ? "Saving..." : `Move ${label(next)}`}
                              </button>
                            )) : null}
                          </div>
                        </div>
                      )) : <div className={cx("p10", "colorMuted", "text11")}>No leads</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={cx("card", "p16")}>
          <div className={cx("flexBetween", "mb12")}>
            <div className={cx("text12", "fw700")}>Lead Detail</div>
            <span className={cx("fontMono", "text10", "colorMuted")}>{selected?.id.slice(0, 8) ?? "No lead"}</span>
          </div>
          {selected ? (
            <>
              <div className={cx("fw800", "mb4", styles.leadsDetailTitle)}>{selected.title}</div>
              <div className={cx("text12", "colorMuted", "mb12")}>{selected.company ?? "No company"} · {selected.source ?? "Unknown"}</div>

              <div className={cx("mb12")}>
                <div className={styles.leadsDetailGrid}>
                  {[
                    { label: "Stage", value: label(selected.status), color: tone(selected.status) },
                    { label: "Score", value: String(selected.score), color: "var(--accent)" },
                    { label: "Idle", value: `${selected.staleDays}d`, color: selected.staleDays >= 5 ? "var(--red)" : "var(--muted)" },
                    { label: "Priority", value: selected.priority, color: selected.priority === "Hot" ? "var(--red)" : selected.priority === "Warm" ? "var(--amber)" : "var(--accent)" }
                  ].map((m) => (
                    <div key={m.label} className={cx("bgBg", "borderDefault", "p10")}>
                      <div className={cx("textXs", "colorMuted", "uppercase", "mb4")}>{m.label}</div>
                      <div className={cx("fontMono", "fw700", styles.leadsToneText, toneClass(m.color))}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cx("text11", "colorMuted", "mb6")}>Next Follow-up: {formatDate(selected.nextFollowUpAt)}</div>
              <div className={cx("bgBg", "borderDefault", "p12", "text12", styles.leadsNotes)}>
                {selected.notes?.trim() || "No notes available."}
              </div>

              {!isClient ? (
                <div className={cx("flexRow", "gap8", "flexWrap", "mt12")}>
                  {STAGES.filter((next) => next !== selected.status).map((next) => (
                    <button type="button" key={next} onClick={() => void moveLead(selected.id, next)} disabled={transitioningLeadId === selected.id} className={cx("btnSm", "btnGhost", styles.leadsMoveBtn)}>
                      {transitioningLeadId === selected.id ? "Saving..." : `Move ${label(next)}`}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className={cx("colorMuted", "text12")}>Select a lead to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
