"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { qualifyLeadWithAI } from "../../../../lib/api/admin/ai";
import { queueAutomationJobWithRefresh } from "../../../../lib/api/admin/automation";
import type { LeadPipelineStatus } from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { AutomationBanner } from "../../../shared/automation-banner";
import { toneClass } from "./admin-page-utils";
import widgetStyles from "@/app/style/admin/widgets.module.css";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

const STAGES: LeadPipelineStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

type ViewMode = "list" | "kanban";

function tone(status: LeadPipelineStatus): string {
  if (status === "NEW") return "var(--blue)";
  if (status === "QUALIFIED") return "var(--amber)";
  if (status === "LOST") return "var(--red)";
  if (status === "WON") return "var(--green)";
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

// ─── New helpers ───────────────────────────────────────────────────────────

function stageStripCls(status: LeadPipelineStatus): string {
  if (status === "LOST") return styles.ldrStripRed;
  if (status === "NEW") return styles.ldrStripBlue;
  if (status === "QUALIFIED") return styles.ldrStripAmber;
  if (status === "WON") return styles.ldrStripGreen;
  return styles.ldrStripAccent;
}

function priorityStripCls(priority: string): string {
  if (priority === "Hot") return styles.ldrRowHot;
  if (priority === "Warm") return styles.ldrRowWarm;
  return "";
}

function priorityBadgeCls(priority: string): string {
  if (priority === "Hot") return styles.ldrPrioBadgeRed;
  if (priority === "Warm") return styles.ldrPrioBadgeAmber;
  return styles.ldrPrioBadgeMuted;
}

function scoreFillCls(score: number): string {
  if (score >= 75) return styles.ldrFillGreen;
  if (score >= 45) return styles.ldrFillAmber;
  return styles.ldrFillRed;
}

function stageBadgeCls(status: LeadPipelineStatus): string {
  const map: Record<LeadPipelineStatus, string> = {
    NEW: styles.ldrBadgeBlue,
    CONTACTED: styles.ldrBadgeAccent,
    QUALIFIED: styles.ldrBadgeAmber,
    PROPOSAL: styles.ldrBadgeAccent,
    WON: styles.ldrBadgeGreen,
    LOST: styles.ldrBadgeRed,
  };
  return map[status];
}

// ─── Component ─────────────────────────────────────────────────────────────

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

  // AI Qualify state
  const [qualifyingLeadId, setQualifyingLeadId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ leadId: string; response: string } | null>(null);

  // Lost reason modal state
  const [lostReasonModal, setLostReasonModal] = useState<{ leadId: string; newStage: LeadPipelineStatus } | null>(null);
  const [lostReason, setLostReason] = useState("");

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
  const qualified = rows.filter((row) => row.status === "QUALIFIED" || row.status === "PROPOSAL" || row.status === "WON").length;

  const staleLeads = rows.filter(
    (row) => row.status !== "WON" && row.status !== "LOST" && (row.staleDays ?? 0) >= 7
  );
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;
  const newThisMonth = rows.filter((row) => {
    const created = new Date(row.createdAt ?? row.updatedAt);
    const now = new Date(clock);
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;

  // Chart data: leads by source
  const sourceChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const src = row.source ?? "Unknown";
      counts[src] = (counts[src] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));
  }, [rows]);

  // Pipeline stages for widget
  const pipelineStages = STAGES.map((stage) => ({
    label: label(stage),
    count: rows.filter((r) => r.status === stage).length,
    total: rows.length,
  }));

  // Table rows for widget
  const tableRows = useMemo(() => filtered.slice(0, 20).map((row) => ({
    id: row.id,
    name: row.title,
    company: row.company ?? "—",
    source: row.source ?? "Unknown",
    score: row.score,
    status: row.status,
  })), [filtered]);

  async function qualifyLead(lead: typeof selected): Promise<void> {
    if (!lead || !session || isClient) return;
    setQualifyingLeadId(lead.id);
    setAiResult(null);

    const prompt = [
      `Lead: ${lead.title}`,
      lead.company ? `Company: ${lead.company}` : null,
      `Stage: ${lead.status}`,
      lead.source ? `Source: ${lead.source}` : null,
      `Score: ${lead.score}`,
      lead.notes?.trim() ? `Notes: ${lead.notes.trim()}` : null,
      `Days idle: ${lead.staleDays}`
    ]
      .filter(Boolean)
      .join("\n");

    const result = await qualifyLeadWithAI(session, {
      leadId: lead.id,
      clientId: session.user.clientId ?? undefined,
      prompt: `Qualify this lead and provide: fit score (0–100), recommended service tier, and the single best next action.\n\n${prompt}`
    });

    setQualifyingLeadId(null);
    if (result.data) {
      setAiResult({ leadId: lead.id, response: result.data.response });
    }
  }

  function moveLead(id: string, status: LeadPipelineStatus): void {
    if (isClient) return;
    if (status === "LOST") {
      setLostReasonModal({ leadId: id, newStage: status });
      setLostReason("");
      return;
    }
    void moveLeadConfirmed(id, status, undefined);
  }

  async function moveLeadConfirmed(id: string, status: LeadPipelineStatus, reason: string | undefined): Promise<void> {
    const ok = await onMoveLead(id, status, status === "LOST" ? { lostReason: reason ?? "" } : undefined);
    if (!ok) return;
    await onRefreshSnapshot(session ?? undefined);
    onNotify("success", `Lead moved to ${label(status)}.`);
  }

  return (
    <div className={styles.pageBody}>

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>OPERATIONS / LEADS</div>
          <h1 className={styles.pageTitle}>Leads</h1>
          <div className={styles.pageSub}>Lead pipeline · Qualification rate · Source breakdown</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Lead</button>
        </div>
      </div>

      {/* ── Automation: stale leads (7d+ idle) ───────────────────────── */}
      <AutomationBanner
        show={staleLeads.length > 0}
        variant="warning"
        icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        }
        title={`${staleLeads.length} lead${staleLeads.length > 1 ? "s" : ""} idle for 7+ days`}
        description="These leads have had no activity in a week. Queue re-engagement follow-ups to keep the pipeline moving."
        actionLabel="Queue follow-ups"
        onAction={async () => {
          if (!session) return;
          const result = await queueAutomationJobWithRefresh(session, {
            type: "LEAD_FOLLOWUP",
            leadIds: staleLeads.map((l) => l.id),
          });
          if (result.nextSession) saveSession(result.nextSession);
          if (!result.error) {
            onNotify("success", `Follow-up tasks queued for ${staleLeads.length} idle lead${staleLeads.length > 1 ? "s" : ""}.`);
          } else {
            onNotify("error", result.error.message ?? "Failed to queue follow-ups.");
          }
        }}
        dismissKey={`admin:leads-stale-banner:${staleLeads.map((l) => l.id).sort().join(",")}`}
        secondaryLabel="AI qualify all"
        onSecondary={async () => {
          onNotify("success", `AI qualification batch started for ${staleLeads.length} lead${staleLeads.length > 1 ? "s" : ""}.`);
        }}
      />

      {/* ── Row 1: 4 stat widgets ─────────────────────────────────────── */}
      <WidgetGrid columns={4}>
        <StatWidget
          label="Total Leads"
          value={rows.length}
          sub={`${active} active`}
          tone="accent"
        />
        <StatWidget
          label="New This Month"
          value={newThisMonth}
          sub="Added this month"
          tone="default"
          subTone={newThisMonth > 0 ? "up" : "neutral"}
        />
        <StatWidget
          label="Qualified"
          value={qualified}
          sub={rows.length > 0 ? `${Math.round((qualified / rows.length) * 100)}% of pipeline` : "0% of pipeline"}
          tone="amber"
        />
        <StatWidget
          label="Win Rate"
          value={`${winRate}%`}
          sub={`${won} won · ${lost} lost`}
          tone={winRate >= 50 ? "green" : "amber"}
          subTone={winRate >= 50 ? "up" : "warn"}
          progressValue={winRate}
        />
      </WidgetGrid>

      {/* ── Row 2: chart + pipeline ───────────────────────────────────── */}
      <WidgetGrid columns={4}>
        <ChartWidget
          label="Leads by Source"
          data={sourceChartData}
          dataKey="count"
          type="bar"
          xKey="label"
          height={140}
        />
        <PipelineWidget
          label="Pipeline Stages"
          stages={pipelineStages}
        />
      </WidgetGrid>

      {/* ── Row 3: leads table ────────────────────────────────────────── */}
      <WidgetGrid columns={4}>
        <TableWidget
          label="Leads"
          rows={tableRows}
          rowKey="id"
          rowCount={filtered.length}
          columns={[
            { key: "name", header: "Lead" },
            { key: "company", header: "Company" },
            { key: "source", header: "Source" },
            { key: "score", header: "Score", align: "right" },
            {
              key: "status",
              header: "Status",
              align: "right",
              render: (value) => {
                const s = value as LeadPipelineStatus;
                const badgeCls =
                  s === "WON" ? cx("badgeGreen") :
                  s === "LOST" ? cx("badgeRed") :
                  s === "QUALIFIED" || s === "PROPOSAL" ? cx("badgeAmber") :
                  cx("badgeMuted");
                return <span className={badgeCls}>{label(s)}</span>;
              },
            },
          ]}
          emptyMessage="No leads match current filters."
        />
      </WidgetGrid>

      {/* ── Filter row ────────────────────────────────────────────────── */}
      <div className={styles.ldrFilters}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lead, source, notes…"
          className={cx("formInput", styles.ldrSearchInput)}
        />
        <select
          title="Filter by stage"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as "ALL" | LeadPipelineStatus)}
          className={styles.formInput}
        >
          <option value="ALL">All stages</option>
          {STAGES.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
        </select>
        <select
          title="Filter by source"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className={styles.formInput}
        >
          <option value="ALL">All sources</option>
          {sources.map((source) => <option key={source} value={source}>{source}</option>)}
        </select>
        <select
          title="Switch view mode"
          value={view}
          onChange={(e) => setView(e.target.value as ViewMode)}
          className={cx(styles.filterSelect, "mlAuto")}
        >
          <option value="list">List</option>
          <option value="kanban">Kanban</option>
        </select>
      </div>

      {/* ── Main layout: content + detail panel ───────────────────────── */}
      <div className={styles.ldrLayout}>

        {/* ── Left: list or kanban ────────────────────────────────────── */}
        <div>
          {view === "list" ? (

            <div className={styles.ldrSection}>
              <div className={styles.ldrSectionHeader}>
                <span className={styles.ldrSectionTitle}>All Leads</span>
                <span className={styles.ldrSectionMeta}>{filtered.length} LEADS</span>
              </div>

              {/* Column header */}
              <div className={styles.ldrListHead}>
                <span>Lead</span>
                <span>Stage</span>
                <span>Source</span>
                <span>Score</span>
                <span>Idle</span>
                <span>Follow-up</span>
                <span />
              </div>

              {filtered.length > 0 ? filtered.map((row) => (
                <div
                  key={row.id}
                  className={`${styles.ldrLeadRow} ${priorityStripCls(row.priority)} ${row.id === selectedId ? styles.ldrLeadSelected : ""}`}
                  onClick={() => setSelectedId(row.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(row.id); } }}
                >
                  <div>
                    <div className={styles.ldrLeadName}>{row.title}</div>
                    <div className={styles.ldrLeadCompany}>{row.company ?? "No company"}</div>
                  </div>
                  <span className={`${styles.ldrStageBadge} ${stageBadgeCls(row.status)}`}>{label(row.status)}</span>
                  <span className={styles.ldrLeadSource}>{row.source ?? "Unknown"}</span>
                  <div className={styles.ldrScoreCell}>
                    <span className={styles.ldrScoreVal}>{row.score}</span>
                    <div className={styles.ldrScoreTrack}>
                      <div className={`${styles.ldrScoreFill} ${scoreFillCls(row.score)}`} style={{ "--pct": `${row.score}%` } as CSSProperties} />
                    </div>
                  </div>
                  <span className={`${styles.ldrIdleMono} ${row.staleDays >= 5 ? styles.ldrIdleRed : ""}`}>{row.staleDays}d</span>
                  <span className={styles.ldrFollowDate}>{formatDate(row.nextFollowUpAt)}</span>
                  <button
                    type="button"
                    className={styles.ldrOpenBtn}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(row.id); }}
                  >
                    Open
                  </button>
                </div>
              )) : (
                <div className={styles.ldrEmpty}>No leads match current filters.</div>
              )}
            </div>

          ) : (

            /* Kanban — 3-col grid, 6 lanes wrap into 2 rows */
            <div className={styles.ldrKanban}>
              {STAGES.map((stage) => {
                const items = filtered.filter((row) => row.status === stage);
                return (
                  <div key={stage} className={styles.ldrLane}>
                    <div className={`${styles.ldrLaneHeader} ${stageStripCls(stage)}`}>
                      <span className={styles.ldrLaneLabel}>{label(stage)}</span>
                      <span className={styles.ldrLaneCount}>{items.length}</span>
                    </div>
                    <div className={styles.ldrLaneBody}>
                      {items.length > 0 ? items.map((row) => (
                        <div
                          key={row.id}
                          className={`${styles.ldrKanbanCard} ${priorityStripCls(row.priority)} ${row.id === selectedId ? styles.ldrKanbanSelected : ""}`}
                          onClick={() => setSelectedId(row.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(row.id); } }}
                        >
                          <div className={styles.ldrKanbanTitle}>{row.title}</div>
                          <div className={styles.ldrKanbanSub}>{row.source ?? "Unknown"}</div>
                          <div className={styles.ldrKanbanMeta}>
                            <span className={`${styles.ldrPrioBadge} ${priorityBadgeCls(row.priority)}`}>{row.priority}</span>
                            <span className={styles.ldrKanbanScore}>Score {row.score}</span>
                            <span className={styles.ldrKanbanIdle}>{row.staleDays}d idle</span>
                          </div>
                          {!isClient ? STAGES.filter((next) => next !== stage).slice(0, 2).map((next) => (
                            <button
                              type="button"
                              key={next}
                              className={styles.ldrKanbanMoveBtn}
                              onClick={(e) => { e.stopPropagation(); void moveLead(row.id, next); }}
                              disabled={transitioningLeadId === row.id}
                            >
                              {transitioningLeadId === row.id ? "Saving…" : label(next)}
                            </button>
                          )) : null}
                        </div>
                      )) : (
                        <div className={styles.ldrLaneEmpty}>No leads</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          )}
        </div>

        {/* ── Detail panel ──────────────────────────────────────────────── */}
        <div className={styles.ldrDetailPanel}>
          <div className={styles.ldrDetailHeader}>
            <span className={styles.ldrDetailTitle}>Lead Detail</span>
            <span className={styles.ldrDetailId}>{selected ? (selected.company ?? `#LEAD-${selected.id.slice(0, 6).toUpperCase()}`) : "—"}</span>
          </div>
          <div className={styles.ldrDetailBody}>
            {selected ? (
              <>
                {/* Name + company */}
                <div>
                  <div className={styles.ldrDetailName}>{selected.title}</div>
                  <div className={styles.ldrDetailSub}>{selected.company ?? "No company"} · {selected.source ?? "Unknown"}</div>
                </div>

                {/* Score bar */}
                <div className={styles.ldrScoreBarWrap}>
                  <div className={styles.ldrScoreBarMeta}>
                    <span className={styles.ldrScoreBarLabel}>Lead Score</span>
                    <span className={`${styles.ldrScoreBarVal} ${cx(toneClass(selected.score >= 75 ? "var(--accent)" : selected.score >= 45 ? "var(--amber)" : "var(--muted)"))}`}>
                      {selected.score}
                    </span>
                  </div>
                  <div className={styles.ldrScoreBarTrack}>
                    <div
                      className={`${styles.ldrScoreBarFill} ${scoreFillCls(selected.score)}`}
                      style={{ "--pct": `${selected.score}%` } as CSSProperties}
                    />
                  </div>
                </div>

                {/* 4 metric cells */}
                <div className={styles.ldrMetaGrid}>
                  {[
                    { label: "Stage", value: label(selected.status), color: tone(selected.status) },
                    { label: "Score", value: String(selected.score), color: "var(--accent)" },
                    { label: "Idle", value: `${selected.staleDays}d`, color: selected.staleDays >= 5 ? "var(--red)" : "var(--muted)" },
                    { label: "Priority", value: selected.priority, color: selected.priority === "Hot" ? "var(--red)" : selected.priority === "Warm" ? "var(--amber)" : "var(--muted)" }
                  ].map((m) => (
                    <div key={m.label} className={styles.ldrMetaCell}>
                      <div className={styles.ldrMetaLabel}>{m.label}</div>
                      <div className={`${styles.ldrMetaValue} ${cx(styles.leadsToneText, toneClass(m.color))}`}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Follow-up row */}
                <div className={styles.ldrFollowRow}>
                  <span className={styles.ldrFollowLabel}>Next Follow-up</span>
                  <span className={styles.ldrFollowVal}>{formatDate(selected.nextFollowUpAt)}</span>
                </div>

                {/* Notes */}
                <div className={styles.ldrNotesBox}>
                  {selected.notes?.trim() || "No notes available."}
                </div>

                {/* AI Qualify */}
                {!isClient ? (
                  <div>
                    <button
                      type="button"
                      className={cx("btnSm", "btnAccent", "wFull")}
                      onClick={() => void qualifyLead(selected)}
                      disabled={qualifyingLeadId === selected.id}
                    >
                      {qualifyingLeadId === selected.id ? "Qualifying…" : "✦ AI Qualify Lead"}
                    </button>
                    {aiResult?.leadId === selected.id && (
                      <div className={cx("text12", "mt8", "p12", "bgBg", "rXs")}>
                        <div className={cx("text10", "colorMuted", "mb4", "fontMono")}>AI ANALYSIS</div>
                        <div className={cx("preWrap")}>{aiResult.response}</div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Move actions */}
                {!isClient ? (
                  <div className={styles.ldrMoveGrid}>
                    {STAGES.filter((next) => next !== selected.status).map((next) => (
                      <button
                        type="button"
                        key={next}
                        className={styles.ldrMoveBtn}
                        onClick={() => void moveLead(selected.id, next)}
                        disabled={transitioningLeadId === selected.id}
                      >
                        {transitioningLeadId === selected.id ? "Saving…" : label(next)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className={styles.ldrEmptyDetail}>Select a lead to view details.</div>
            )}
          </div>
        </div>

      </div>

      {/* ── Lost Reason Modal ────────────────────────────────────────── */}
      {lostReasonModal && (
        <div className={styles.cobModalOverlay}>
          <div className={styles.cobModal}>
            <div className={styles.cobModalTitle}>Mark Lead as Lost</div>
            <div className={styles.cobModalField}>
              <label className={styles.cobModalLabel} htmlFor="lost-reason-input">Reason for losing this lead</label>
              <textarea
                id="lost-reason-input"
                className={styles.cobModalInput}
                rows={3}
                placeholder="e.g. No budget / delayed decision"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
              />
            </div>
            <div className={styles.cobModalActions}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => setLostReasonModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                disabled={!lostReason.trim()}
                onClick={() => {
                  const { leadId, newStage } = lostReasonModal;
                  setLostReasonModal(null);
                  void moveLeadConfirmed(leadId, newStage, lostReason.trim());
                }}
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
