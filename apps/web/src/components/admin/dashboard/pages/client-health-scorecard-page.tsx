"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { StatWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAllHealthScoresWithRefresh, type AdminHealthScore } from "../../../../lib/api/admin/client-ops";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import type { AdminClient } from "../../../../lib/api/admin";

type DimensionScore = {
  score: number;
  weight: number;
  prev: number;
  note: string;
};

type DimensionMap = Record<string, DimensionScore>;

type ScorecardClient = {
  client: string;
  color: string;
  avatar: string;
  tier: string;
  am: string;
  mrr: number;
  months: number;
  dimensions: DimensionMap;
  history: number[];
  churnRisk: number;
  renewalProbability: number;
  openIssues: number;
};

const CLIENT_COLORS = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--red)", "var(--green)"];

const SCORE_WEIGHTS = {
  PAID_INVOICE: 10,
  PENDING_INVOICE: 7,
  OVERDUE_INVOICE: 3,
  DELIVERY_PENALTY_PER_TASK: 2,
  COMMS_PENALTY_PER_MESSAGE: 1,
  SCHEDULE_PENALTY_DAYS_INTERVAL: 3,
  MIN_DIMENSION_SCORE: 1,
} as const;

function invoiceDimScore(status: string): number {
  const s = status.toUpperCase();
  if (s === "PAID" || s === "CURRENT")                    return SCORE_WEIGHTS.PAID_INVOICE;
  if (s === "SENT" || s === "PENDING" || s === "ISSUED")  return SCORE_WEIGHTS.PENDING_INVOICE;
  if (s === "OVERDUE")                                    return SCORE_WEIGHTS.OVERDUE_INVOICE;
  return 5;
}

function buildDimensions(hs: AdminHealthScore, prevHs: AdminHealthScore | null): DimensionMap {
  const delivery  = Math.max(SCORE_WEIGHTS.MIN_DIMENSION_SCORE, 10 - hs.overdueTasks * SCORE_WEIGHTS.DELIVERY_PENALTY_PER_TASK);
  const comms     = Math.max(SCORE_WEIGHTS.MIN_DIMENSION_SCORE, 10 - hs.unreadMessages * SCORE_WEIGHTS.COMMS_PENALTY_PER_MESSAGE);
  const schedule  = Math.max(SCORE_WEIGHTS.MIN_DIMENSION_SCORE, 10 - Math.floor(hs.milestoneDelayDays / SCORE_WEIGHTS.SCHEDULE_PENALTY_DAYS_INTERVAL));
  const invoice   = invoiceDimScore(hs.invoiceStatus);
  const hsSig     = +Math.min(10, hs.score / 10).toFixed(1);

  const pDelivery = prevHs ? Math.max(SCORE_WEIGHTS.MIN_DIMENSION_SCORE, 10 - prevHs.overdueTasks * SCORE_WEIGHTS.DELIVERY_PENALTY_PER_TASK) : delivery;
  const pComms    = prevHs ? Math.max(SCORE_WEIGHTS.MIN_DIMENSION_SCORE, 10 - prevHs.unreadMessages * SCORE_WEIGHTS.COMMS_PENALTY_PER_MESSAGE) : comms;
  const pSchedule = prevHs ? Math.max(SCORE_WEIGHTS.MIN_DIMENSION_SCORE, 10 - Math.floor(prevHs.milestoneDelayDays / SCORE_WEIGHTS.SCHEDULE_PENALTY_DAYS_INTERVAL)) : schedule;
  const pInvoice  = prevHs ? invoiceDimScore(prevHs.invoiceStatus) : invoice;
  const pHsSig    = prevHs ? +Math.min(10, prevHs.score / 10).toFixed(1) : hsSig;

  return {
    "Delivery":       { score: delivery,  weight: 25, prev: pDelivery,  note: hs.overdueTasks > 0 ? `${hs.overdueTasks} overdue task${hs.overdueTasks !== 1 ? "s" : ""}` : "On track" },
    "Communication":  { score: comms,     weight: 20, prev: pComms,     note: hs.unreadMessages > 0 ? `${hs.unreadMessages} unread msg${hs.unreadMessages !== 1 ? "s" : ""}` : "Up to date" },
    "Schedule":       { score: schedule,  weight: 20, prev: pSchedule,  note: hs.milestoneDelayDays > 0 ? `${hs.milestoneDelayDays}d behind` : "On schedule" },
    "Invoice":        { score: invoice,   weight: 20, prev: pInvoice,   note: hs.invoiceStatus },
    "Health Signal":  { score: hsSig,     weight: 15, prev: pHsSig,     note: `Score: ${hs.score}` },
  };
}

function mapToScorecardClient(
  records: AdminHealthScore[],
  client: AdminClient | undefined,
  color: string
): ScorecardClient {
  // records sorted descending (most recent first)
  const latest = records[0];
  const prev   = records[1] ?? null;

  // history: ascending time order (oldest → newest)
  const history = [...records].reverse().map(r => r.score);

  const dimensions = buildDimensions(latest, prev);

  const churnRisk          = Math.max(0, Math.min(100, Math.round(100 - latest.score)));
  const renewalProbability = Math.max(0, Math.min(100, Math.round(latest.score)));
  const openIssues         = latest.overdueTasks + (latest.unreadMessages > 0 ? 1 : 0);

  let months = 0;
  if (client?.contractStartAt) {
    const start = new Date(client.contractStartAt);
    months = Math.max(0, Math.round((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  }

  return {
    client:              client?.name ?? "Client",
    color,
    avatar:              (client?.name ?? "C").charAt(0).toUpperCase(),
    tier:                client?.tier ?? "STARTER",
    am:                  client?.ownerName ?? "\u2014",
    mrr:                 0,
    months,
    dimensions,
    history,
    churnRisk,
    renewalProbability,
    openIssues,
  };
}

function calcHealthScore(dimensions: DimensionMap): number {
  const rows = Object.values(dimensions);
  const totalWeight = rows.reduce((s, d) => s + d.weight, 0);
  if (totalWeight === 0) return 0;
  return Math.round((rows.reduce((s, d) => s + (d.score / 10) * d.weight, 0) / totalWeight) * 100);
}

function healthColor(health: number): string {
  if (health >= 70) return "var(--green)";
  if (health >= 50) return "var(--amber)";
  return "var(--red)";
}

function dimColor(score: number): string {
  if (score >= 8) return "var(--green)";
  if (score >= 6) return "var(--blue)";
  if (score >= 4) return "var(--amber)";
  return "var(--red)";
}

function churnColor(risk: number): string {
  if (risk >= 50) return "var(--red)";
  if (risk >= 25) return "var(--amber)";
  return "var(--green)";
}

function renewalColor(prob: number): string {
  if (prob >= 75) return "var(--green)";
  return "var(--amber)";
}

const tabs = ["scorecard grid", "deep dive", "risk summary"] as const;
type Tab = (typeof tabs)[number];

export function ClientHealthScorecardPage({ session }: { session: AuthSession | null }) {
  const [scorecardData, setScorecardData] = useState<ScorecardClient[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<Tab>("scorecard grid");
  const [selected, setSelected]           = useState<ScorecardClient | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const [hsRes, snapRes] = await Promise.all([
          loadAllHealthScoresWithRefresh(session),
          loadAdminSnapshotWithRefresh(session),
        ]);
        if (cancelled) return;
        if (hsRes.nextSession)        saveSession(hsRes.nextSession);
        else if (snapRes.nextSession) saveSession(snapRes.nextSession);

        if (hsRes.error || snapRes.error) {
          const msg = hsRes.error?.message ?? snapRes.error?.message ?? "Failed to load health data";
          setError(msg);
          return;
        }

        const scores  = hsRes.data   ?? [];
        const clients = snapRes.data?.clients ?? [];

        // Group by clientId, sort each group descending by recordedAt
        const grouped = new Map<string, AdminHealthScore[]>();
        for (const s of scores) {
          const arr = grouped.get(s.clientId) ?? [];
          arr.push(s);
          grouped.set(s.clientId, arr);
        }
        for (const arr of grouped.values()) {
          arr.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
        }

        const clientMap = new Map<string, AdminClient>(clients.map(c => [c.id, c]));
        let colorIdx = 0;
        const list: ScorecardClient[] = [];
        for (const [clientId, records] of grouped) {
          const client = clientMap.get(clientId);
          const color  = CLIENT_COLORS[colorIdx++ % CLIENT_COLORS.length];
          list.push(mapToScorecardClient(records, client, color));
        }
        setScorecardData(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const atRisk          = scorecardData.filter((c) => c.churnRisk >= 50).length;
  const avgHealth       = scorecardData.length > 0
    ? Math.round(scorecardData.reduce((s, c) => s + calcHealthScore(c.dimensions), 0) / scorecardData.length)
    : 0;
  const totalMRRAtRisk  = scorecardData.filter((c) => c.churnRisk >= 50).reduce((s, c) => s + c.mrr, 0);

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

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / CLIENT HEALTH SCORECARD</div>
          <h1 className={styles.pageTitle}>Client Health Scorecard</h1>
          <div className={styles.pageSub}>Multi-dimension weighted health model · Churn risk · Renewal probability</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Scorecard</button>
        </div>
      </div>

      <WidgetGrid>
        <StatWidget
          label="Portfolio Avg Health"
          value={avgHealth}
          sub="Weighted score"
          tone={avgHealth >= 70 ? "green" : avgHealth >= 40 ? "amber" : "red"}
        />
        <StatWidget
          label="Clients at Risk"
          value={atRisk}
          sub="Churn risk ≥ 50%"
          tone={atRisk > 0 ? "red" : "green"}
        />
        <StatWidget
          label="MRR at Risk"
          value={`R${(totalMRRAtRisk / 1000).toFixed(0)}k`}
          sub="From at-risk clients"
          tone={totalMRRAtRisk > 0 ? "red" : "green"}
        />
        <StatWidget
          label="Renewal Probability"
          value={`${scorecardData.length > 0 ? Math.round(scorecardData.reduce((s, c) => s + c.renewalProbability, 0) / scorecardData.length) : 0}%`}
          sub="Portfolio average"
          tone="accent"
        />
      </WidgetGrid>

      <PipelineWidget
          label="Health Tier Distribution"
          stages={[
            { label: "Healthy (70+)",   count: scorecardData.filter((c) => calcHealthScore(c.dimensions) >= 70).length, total: scorecardData.length || 1, color: "#34d98b" },
            { label: "Moderate (40-69)", count: scorecardData.filter((c) => { const h = calcHealthScore(c.dimensions); return h >= 40 && h < 70; }).length, total: scorecardData.length || 1, color: "#f5a623" },
            { label: "At Risk (<40)",    count: scorecardData.filter((c) => calcHealthScore(c.dimensions) < 40).length,  total: scorecardData.length || 1, color: "#ff5f5f" },
          ]}
        />

      <div className={styles.filterRow}>
        <select
          title="Select tab"
          value={activeTab}
          onChange={e => setActiveTab(e.target.value as Tab)}
          className={styles.filterSelect}
        >
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {scorecardData.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>No health score data</div>
          <p className={cx("emptyStateSub")}>Client health scorecard data will appear here once health checks are recorded.</p>
        </div>
      ) : (
        <>
          {activeTab === "scorecard grid" && (
            <div>
              <div className={cx("card", "overflowAuto", "mb20")}>
                <div className={styles.healthMinW900}>
                  <div className={cx("healthGridHead")}>
                    <span className={cx("text10", "colorMuted")}>Client</span>
                    {(scorecardData[0] ? Object.keys(scorecardData[0].dimensions) : []).map((d) => (
                      <span key={d} className={cx("textXs", "colorMuted", "textCenter")}>{d.split(" ")[0]}</span>
                    ))}
                    <span className={cx("text10", "colorMuted", "textCenter")}>Score</span>
                    <span className={cx("text10", "colorMuted", "textCenter")}>Churn%</span>
                    <span className={cx("text10", "colorMuted", "textCenter")}>Issues</span>
                  </div>

                  {[...scorecardData]
                    .sort((a, b) => calcHealthScore(a.dimensions) - calcHealthScore(b.dimensions))
                    .map((c) => {
                      const health = calcHealthScore(c.dimensions);
                      return (
                        <div
                          key={c.client}
                          onClick={() => { setSelected(c); setActiveTab("deep dive"); }}
                          className={cx("healthGridRow", "pointerCursor", c.churnRisk >= 50 && styles.healthRowAtRisk)}
                        >
                          <div className={cx("flexRow", "gap8")}>
                            <div className={cx(styles.healthDot8, toneClass(c.color))} />
                            <span className={cx("fw600", "text13", styles.healthToneText, toneClass(c.color))}>{c.client.split(" ")[0]}</span>
                          </div>

                          {Object.values(c.dimensions).map((d, di) => {
                            const score = d.score;
                            const color = dimColor(score);
                            return (
                              <div key={`${c.client}-${di}`} className={cx("textCenter")}>
                                <div className={styles.healthTinyTrack}>
                                  <progress className={cx(styles.healthTinyFill, "uiProgress", toneClass(color))} max={100} value={(score / 10) * 100} />
                                </div>
                                <span className={cx("fontMono", "text10", styles.healthToneText, toneClass(color))}>{score.toFixed(1)}</span>
                              </div>
                            );
                          })}

                          <div className={cx("textCenter", "fontMono", "fw800", styles.healthScore18, styles.healthToneText, toneClass(healthColor(health)))}>{health}</div>
                          <div className={cx("textCenter", "fontMono", styles.healthToneText, toneClass(churnColor(c.churnRisk)))}>{c.churnRisk}%</div>
                          <div className={cx("textCenter", styles.healthToneText, c.openIssues > 0 ? "toneRed" : "toneMuted")}>
                            {c.openIssues > 0 ? `! ${c.openIssues}` : "\u2014"}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className={cx("text11", "colorMuted", "flexRow", "gap4")}>
                <span>Click any row to open deep dive.</span>
                <span>Dimension weights: Delivery 25%, Communication 20%, Schedule 20%, Invoice 20%, Health Signal 15%</span>
              </div>
            </div>
          )}

          {activeTab === "deep dive" && (
            <div className={styles.healthDeepDiveSplit}>
              <div className={cx("flexCol", "gap8")}>
                {scorecardData.map((c) => {
                  const h = calcHealthScore(c.dimensions);
                  return (
                    <div
                      key={c.client}
                      onClick={() => setSelected(c)}
                      className={cx(
                        "pointerCursor",
                        styles.healthSelectCard,
                        selected?.client === c.client && styles.healthSelectCardActive,
                        selected?.client === c.client && toneClass(c.color)
                      )}
                    >
                      <div className={cx("fw600", "text12", selected?.client === c.client && styles.healthToneText, selected?.client === c.client && toneClass(c.color))}>
                        {c.client.split(" ")[0]}
                      </div>
                      <div className={cx("fontMono", "fw800", styles.healthScore16, styles.healthToneText, toneClass(healthColor(h)))}>{h}</div>
                    </div>
                  );
                })}
              </div>

              {selected ? (
                <div className={cx("card", "p24", styles.healthDetailCard, toneClass(selected.color))}>
                  <div className={cx("flexBetween", "mb28")}>
                    <div>
                      <div className={cx("fw800", styles.healthTitle22, styles.healthToneText, toneClass(selected.color))}>{selected.client}</div>
                      <div className={cx("colorMuted", "text13")}>{selected.tier} · {selected.am} · {selected.months} months</div>
                    </div>
                    <div className={cx("textRight")}>
                      <div className={cx("fontMono", "fw800", styles.healthScore40, styles.healthToneText, churnColor(selected.churnRisk) === "var(--red)" ? "toneRed" : "toneAccent")}>
                        {calcHealthScore(selected.dimensions)}
                      </div>
                      <div className={cx("text11", "colorMuted")}>Health Score</div>
                    </div>
                  </div>

                  <div className={cx("flexCol", "gap10", "mb24")}>
                    {Object.entries(selected.dimensions).map(([dim, data]) => {
                      const color = dimColor(data.score);
                      const delta = (data.score - data.prev).toFixed(1);
                      return (
                        <div key={dim} className={styles.healthDimRow}>
                          <div>
                            <div className={cx("fw600", "text12")}>{dim}</div>
                            <div className={cx("text10", "colorMuted")}>Weight: {data.weight}%</div>
                          </div>
                          <div>
                            <div className={cx("h6", styles.healthTrackBg)}>
                              <progress className={cx(styles.healthFillFull, "uiProgress", toneClass(color))} max={100} value={(data.score / 10) * 100} />
                            </div>
                            <div className={cx("text10", "colorMuted", "mt4")}>{data.note}</div>
                          </div>
                          <div className={cx("fontMono", "fw800", "textCenter", styles.healthScore18, styles.healthToneText, toneClass(color))}>{data.score.toFixed(1)}</div>
                          <span className={cx("text12", "textCenter", styles.healthToneText, Number.parseFloat(delta) > 0 ? "toneAccent" : Number.parseFloat(delta) < 0 ? "toneRed" : "toneMuted")}>
                            {Number.parseFloat(delta) > 0 ? "\u25B2" : Number.parseFloat(delta) < 0 ? "\u25BC" : "\u2192"}
                          </span>
                          <span className={cx("fontMono", "text10", "colorMuted", "textCenter")}>prev {data.prev.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={cx("grid3", "mb20")}>
                    {[
                      { label: "Churn Risk",           value: `${selected.churnRisk}%`,          color: churnColor(selected.churnRisk) },
                      { label: "Renewal Probability",  value: `${selected.renewalProbability}%`, color: renewalColor(selected.renewalProbability) },
                      { label: "MRR at Stake",         value: selected.mrr > 0 ? `R${(selected.mrr / 1000).toFixed(0)}k` : "\u2014", color: "var(--blue)" },
                    ].map((m) => (
                      <div key={m.label} className={cx("bgBg", "p14", "textCenter")}>
                        <div className={cx("fontMono", "fw800", styles.healthScore24, styles.healthToneText, toneClass(m.color))}>{m.value}</div>
                        <div className={cx("text10", "colorMuted", "mt4")}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className={cx("flexRow", "gap8")}>
                    {selected.churnRisk >= 50 ? <button type="button" className={cx("btnSm", styles.healthDangerBtn, styles.healthBtnPad)}>Log Intervention</button> : null}
                    <button type="button" className={cx("btnSm", "btnAccent", styles.healthBtnPad)}>View Client</button>
                  </div>
                </div>
              ) : (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateTitle")}>Select a client</div>
                  <p className={cx("emptyStateSub")}>Click a client in the list to view their detailed health breakdown.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "risk summary" && (
            <div className={cx("flexCol", "gap16")}>
              {[...scorecardData].sort((a, b) => b.churnRisk - a.churnRisk).map((c) => {
                const health = calcHealthScore(c.dimensions);
                const entries = Object.entries(c.dimensions);
                const worstDim = entries.reduce<[string, DimensionScore]>(
                  (a, [k, v]) => (v.score < a[1].score ? [k, v] : a),
                  entries[0]
                );
                return (
                  <div key={c.client} className={cx("card", "p24", c.churnRisk >= 50 && styles.healthRiskCard)}>
                    <div className={styles.healthRiskGrid}>
                      <div className={cx("fw700", styles.healthName15, styles.healthToneText, toneClass(c.color))}>{c.client}</div>
                      <div className={cx("fontMono", "fw800", styles.healthScore24, styles.healthToneText, toneClass(healthColor(health)))}>{health}</div>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb4")}>Weakest dimension: {worstDim[0]}</div>
                        <div className={cx("text12", styles.healthToneText, worstDim[1].score < 5 ? "toneRed" : "toneAmber")}>{worstDim[1].note}</div>
                      </div>
                      <div className={cx("textCenter")}>
                        <div className={cx("text10", "colorMuted", "mb3")}>Churn Risk</div>
                        <div className={cx("fontMono", "fw800", styles.healthScore20, styles.healthToneText, toneClass(churnColor(c.churnRisk)))}>{c.churnRisk}%</div>
                      </div>
                      <div className={cx("textCenter")}>
                        <div className={cx("text10", "colorMuted", "mb3")}>Renewal Probability</div>
                        <div className={cx("fontMono", "fw800", styles.healthScore20, styles.healthToneText, toneClass(renewalColor(c.renewalProbability)))}>{c.renewalProbability}%</div>
                      </div>
                      {c.churnRisk >= 50
                        ? <button type="button" className={cx("btnSm", styles.healthDangerBtn)}>Intervene</button>
                        : <span className={cx("text11", "colorGreen", "textCenter")}>Healthy</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
