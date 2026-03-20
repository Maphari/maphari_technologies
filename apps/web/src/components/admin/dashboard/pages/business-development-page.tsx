// ════════════════════════════════════════════════════════════════════════════
// business-development-page.tsx — Admin Business Development page
// Data sources: loadAdminSnapshotWithRefresh (leads + client names)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin";
import type { AdminLead, AdminClient, LeadPipelineStatus } from "../../../../lib/api/admin";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "pipeline" | "analytics";
const tabs: Tab[] = ["pipeline", "analytics"];
type ViewMode = "list" | "kanban";

// ── Constants ─────────────────────────────────────────────────────────────────

const stageOrder: LeadPipelineStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

const stageColors: Record<LeadPipelineStatus, string> = {
  NEW: "var(--muted)",
  CONTACTED: "var(--blue)",
  QUALIFIED: "var(--purple)",
  PROPOSAL: "var(--amber)",
  WON: "var(--accent)",
  LOST: "var(--red)",
};

const stageLabel: Record<LeadPipelineStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  WON: "Won",
  LOST: "Lost",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

function fillClass(color: string): string {
  if (color === "var(--accent)") return styles.bdevFillAccent;
  if (color === "var(--red)") return styles.bdevFillRed;
  if (color === "var(--amber)") return styles.bdevFillAmber;
  if (color === "var(--blue)") return styles.bdevFillBlue;
  if (color === "var(--purple)") return styles.bdevFillPurple;
  return styles.bdevFillMuted;
}

function tagClass(color: string): string {
  if (color === "var(--accent)") return styles.bdevTagAccent;
  if (color === "var(--red)") return styles.bdevTagRed;
  if (color === "var(--amber)") return styles.bdevTagAmber;
  if (color === "var(--blue)") return styles.bdevTagBlue;
  if (color === "var(--purple)") return styles.bdevTagPurple;
  return styles.bdevTagMuted;
}

// Estimate win probability by stage
function stageProbability(status: LeadPipelineStatus): number {
  switch (status) {
    case "NEW": return 10;
    case "CONTACTED": return 25;
    case "QUALIFIED": return 45;
    case "PROPOSAL": return 65;
    case "WON": return 100;
    case "LOST": return 0;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function BusinessDevelopmentPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "info" | "warning", message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await loadAdminSnapshotWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        onNotify("error", r.error.message);
      } else if (r.data) {
        setLeads(r.data.leads);
        setClients(r.data.clients);
      }
    } finally {
      setLoading(false);
    }
  }, [session, onNotify]);

  useEffect(() => { void load(); }, [load]);

  const clientName = (clientId: string): string =>
    clients.find((c) => c.id === clientId)?.name ?? "";

  const activeLeads = leads.filter((l) => l.status !== "WON" && l.status !== "LOST");
  const won = leads.filter((l) => l.status === "WON");
  const lost = leads.filter((l) => l.status === "LOST");
  const conversionRate = leads.length > 0 ? Math.round((won.length / leads.length) * 100) : 0;

  const sourceBreakdown = leads.reduce<Record<string, number>>((acc, l) => {
    const src = l.source ?? "Unknown";
    acc[src] = (acc[src] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.pageBody, styles.bdevRoot, "rdStudioPage")}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / BUSINESS DEVELOPMENT</div>
          <h1 className={styles.pageTitle}>Business Development</h1>
          <div className={styles.pageSub}>Lead pipeline · Conversion analytics</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Pipeline</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Active Leads", value: activeLeads.length.toString(), color: "var(--accent)", sub: `${leads.length} total` },
          { label: "Won", value: won.length.toString(), color: "var(--accent)", sub: "Converted to clients" },
          { label: "Lost", value: lost.length.toString(), color: lost.length > 0 ? "var(--red)" : "var(--muted)", sub: "Not converted" },
          { label: "Conversion Rate", value: `${conversionRate}%`, color: conversionRate >= 40 ? "var(--accent)" : "var(--amber)", sub: "Win rate" },
        ].map((s) => (
          <div key={s.label} className={cx(styles.statCard, "rdStudioCard")}>
            <div className={cx(styles.statLabel, "rdStudioLabel")}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color), "rdStudioMetric", s.color === "var(--accent)" ? "rdStudioMetricPos" : s.color === "var(--red)" ? "rdStudioMetricNeg" : s.color === "var(--amber)" ? "rdStudioMetricWarn" : "")}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select
          title="Select tab"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as Tab)}
          className={styles.filterSelect}
        >
          {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {activeTab === "pipeline" && (
          <select
            title="View mode"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className={styles.filterSelect}
          >
            <option value="list">list</option>
            <option value="kanban">kanban</option>
          </select>
        )}
      </div>

      {activeTab === "pipeline" && (
        leads.length === 0 ? (
          <div className={cx("card", "p24", "text13", "colorMuted")}>No leads found.</div>
        ) : (
          <div>
            {viewMode === "list" && (
              <div className={styles.bdevTableCard}>
                <div className={cx(styles.bdevTableHead, "fontMono", "text10", "colorMuted", "uppercase")}>
                  {"Company|Contact|Stage|Source|Follow-up|Status|".split("|").map((h, idx) => (
                    <span key={`${h}-${idx}`}>{h}</span>
                  ))}
                </div>
                {leads.map((lead, i) => {
                  const color = stageColors[lead.status];
                  return (
                    <div key={lead.id} className={cx(styles.bdevTableRow, i < leads.length - 1 && "borderB", "rdStudioRow")}>
                      <div>
                        <div className={cx("fw600")}>{lead.company ?? lead.title}</div>
                        <div className={cx("text11", "colorMuted")}>{clientName(lead.clientId)}</div>
                      </div>
                      <span className={cx("text12", "colorMuted")}>{lead.contactName ?? "—"}</span>
                      <span className={cx(styles.bdevStageTag, tagClass(color))}>{stageLabel[lead.status]}</span>
                      <span className={cx("text11", "colorMuted")}>{lead.source ?? "—"}</span>
                      <span className={cx("text12", "colorMuted")}>{fmtDate(lead.nextFollowUpAt)}</span>
                      <span className={cx("fontMono", "text12", stageProbability(lead.status) >= 65 ? "colorAccent" : stageProbability(lead.status) >= 40 ? "colorAmber" : "colorMuted")}>
                        {stageProbability(lead.status)}%
                      </span>
                      <button type="button" className={cx("btnSm", "btnGhost")}>Open</button>
                    </div>
                  );
                })}
              </div>
            )}

            {viewMode === "kanban" && (
              <div className={styles.bdevKanbanGrid}>
                {stageOrder.map((stage) => {
                  const stageLeads = leads.filter((l) => l.status === stage);
                  const color = stageColors[stage];
                  return (
                    <div key={stage}>
                      <div className={styles.bdevStageHead}>
                        <span className={cx(styles.bdevStageName, colorClass(color))}>{stageLabel[stage]}</span>
                        <span className={cx("fontMono", "text11", "colorMuted")}>{stageLeads.length}</span>
                      </div>
                      <div className={styles.bdevStageStack}>
                        {stageLeads.map((lead) => (
                          <div key={lead.id} className={styles.bdevDealCard}>
                            <div className={styles.bdevDealName}>{lead.company ?? lead.title}</div>
                            <div className={styles.bdevDealMeta}>{lead.contactName ?? "—"}</div>
                            <div className={styles.bdevDealFoot}>
                              <span className={cx("text12", "colorMuted")}>{lead.source ?? "—"}</span>
                              <span className={cx("colorMuted")}>{stageProbability(lead.status)}% win</span>
                            </div>
                            <progress
                              className={cx(styles.bdevMiniTrack, fillClass(color))}
                              max={100}
                              value={stageProbability(lead.status)}
                              aria-label={`${lead.title} win probability ${stageProbability(lead.status)}%`}
                            />
                          </div>
                        ))}
                        {stageLeads.length === 0 && (
                          <div className={styles.bdevEmptyLane}>No leads</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {activeTab === "analytics" && (
        <div className={styles.bdevTargetsGrid}>
            <div className={cx("card", "p24")}>
              <div className={cx(styles.bdevSectionTitle, "rdStudioSection")}>Pipeline by Stage</div>
              <div className={styles.bdevTargetStack}>
                {stageOrder.map((stage) => {
                  const count = leads.filter((l) => l.status === stage).length;
                  const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                  const color = stageColors[stage];
                  return (
                    <div key={stage}>
                      <div className={styles.bdevTargetHead}>
                        <span className={styles.text13}>{stageLabel[stage]}</span>
                        <span className={cx("fontMono", "text12", colorClass(color))}>{count} leads</span>
                      </div>
                      <div className={styles.bdevTargetTrack}>
                        <progress
                          className={cx(styles.bdevTargetTrackFill, fillClass(color))}
                          max={100}
                          value={pct}
                          aria-label={`${stageLabel[stage]} ${pct}%`}
                        />
                      </div>
                      <div className={cx(styles.bdevTargetPct, "colorMuted")}>{pct}% of all leads</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.bdevTargetSide}>
              <div className={cx("card", "p24")}>
                <div className={styles.bdevSectionTitle}>Lead Sources</div>
                {Object.entries(sourceBreakdown).map(([source, count]) => {
                  const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                  return (
                    <div key={source} className={styles.bdevSourceRow}>
                      <span className={styles.bdevSourceName}>{source}</span>
                      <div className={styles.bdevSourceTrack}>
                        <progress
                          className={cx(styles.bdevSourceTrackFill, styles.bdevFillAccent)}
                          max={100}
                          value={pct}
                          aria-label={`${source} ${pct}%`}
                        />
                      </div>
                      <span className={cx(styles.bdevSourceCount, "colorAccent")}>{count}</span>
                    </div>
                  );
                })}
                {Object.keys(sourceBreakdown).length === 0 && (
                  <div className={cx("text12", "colorMuted")}>No source data available.</div>
                )}
              </div>

              <div className={cx(styles.bdevAnnualCard, "rdStudioCard")}>
                <div className={cx(styles.bdevAnnualTitle, "rdStudioLabel")}>Conversion Summary</div>
                <div className={cx(styles.bdevAnnualValue, "rdStudioMetric", conversionRate >= 40 ? "rdStudioMetricPos" : "rdStudioMetricWarn")}>{conversionRate}%</div>
                <div className={cx("text12", "colorMuted")}>
                  {won.length} won · {lost.length} lost · {activeLeads.length} in progress
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
