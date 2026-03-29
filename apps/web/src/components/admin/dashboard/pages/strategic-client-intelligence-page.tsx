"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

type Segment = "Champion" | "Growth" | "At Risk" | "New";

type Client = {
  id: number;
  name: string;
  avatar: string;
  color: string;
  segment: Segment;
  ltv: number;
  cac: number;
  mrr: number;
  tenure: number;
  health: number;
  churnRisk: number;
  upsellScore: number;
  retainerTier: "Core" | "Growth" | "Enterprise";
  industry: string;
  revenueGrowth: number;
  netMargin: number;
  touchpoints: number;
  lastUpsell: string;
};

const clients: Client[] = [];

const segmentConfig: Record<Segment, { color: string; icon: string; desc: string }> = {
  Champion: { color: "var(--accent)", icon: "★", desc: "High LTV, high health, low churn risk" },
  Growth: { color: "var(--blue)", icon: "↑", desc: "Expanding engagement, strong potential" },
  "At Risk": { color: "var(--red)", icon: "⚠", desc: "Declining health, high churn probability" },
  New: { color: "var(--purple)", icon: "◈", desc: "Recent clients, establishing relationship" }
};

const cohorts = [
  { quarter: "Q1 2024", clients: 2, avgLTV: 280000, retentionRate: 100, churned: 0 },
  { quarter: "Q2 2024", clients: 1, avgLTV: 192000, retentionRate: 100, churned: 0 },
  { quarter: "Q3 2024", clients: 1, avgLTV: 258000, retentionRate: 100, churned: 0 },
  { quarter: "Q4 2024", clients: 0, avgLTV: 0, retentionRate: 0, churned: 0 },
  { quarter: "Q1 2025", clients: 2, avgLTV: 168000, retentionRate: 50, churned: 1 }
] as const;

const tabs = ["segmentation", "ltv & cac", "churn prediction", "cohort analysis", "upsell targets"] as const;

type Tab = (typeof tabs)[number];

function riskClass(value: number): string {
  if (value > 50) return "colorRed";
  if (value > 25) return "colorAmber";
  return "colorAccent";
}

function toneVarClass(value: string): string {
  if (value === "var(--red)") return styles.sciToneRed;
  if (value === "var(--blue)") return styles.sciToneBlue;
  if (value === "var(--amber)") return styles.sciToneAmber;
  if (value === "var(--purple)") return styles.sciTonePurple;
  if (value === "var(--muted)") return styles.sciToneMuted;
  if (value === "var(--border)") return styles.sciToneBorder;
  return styles.sciToneAccent;
}

function fillClass(value: string): string {
  if (value === "var(--red)") return styles.sciFillRed;
  if (value === "var(--blue)") return styles.sciFillBlue;
  if (value === "var(--amber)") return styles.sciFillAmber;
  if (value === "var(--purple)") return styles.sciFillPurple;
  if (value === "var(--muted)") return styles.sciFillMuted;
  return styles.sciFillAccent;
}

function SegmentBadge({ segment }: { segment: Segment }) {
  const cfg = segmentConfig[segment];
  return (
    <span className={cx(styles.sciSegmentBadge, toneVarClass(cfg.color))}>
      {cfg.icon} {segment}
    </span>
  );
}

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size === 28 ? "sciAvatar28" : size === 30 ? "sciAvatar30" : size === 32 ? "sciAvatar32" : "sciAvatar36";
  return (
    <div className={cx(styles.sciAvatar, toneVarClass(color), sizeClass)}>
      {initials}
    </div>
  );
}

export function StrategicClientIntelligencePage() {
  const [activeTab, setActiveTab] = useState<Tab>("segmentation");
  const [selectedSegment, setSelectedSegment] = useState<"All" | Segment>("All");

  const filtered = selectedSegment === "All" ? clients : clients.filter((c) => c.segment === selectedSegment);
  const totalLTV = clients.reduce((s, c) => s + c.ltv, 0);
  const avgCAC = clients.length > 0 ? Math.round(clients.reduce((s, c) => s + c.cac, 0) / clients.length) : 0;
  const atRisk = clients.filter((c) => c.churnRisk > 50).length;
  const upsellReady = clients.filter((c) => c.upsellScore > 60).length;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / STRATEGIC CLIENT INTELLIGENCE</div>
          <h1 className={styles.pageTitle}>Strategic Client Intelligence</h1>
          <div className={styles.pageSub}>LTV · CAC · Churn risk · Cohort analysis · Upsell scoring</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Segment Report</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "Total Portfolio LTV", value: `R${(totalLTV / 1000).toFixed(0)}k`, color: "var(--accent)", sub: `Across ${clients.length} clients` },
          { label: "Avg CAC", value: `R${(avgCAC / 1000).toFixed(1)}k`, color: "var(--blue)", sub: "Cost per acquisition" },
          { label: "At-Risk Clients", value: atRisk.toString(), color: "var(--red)", sub: "Churn risk > 50%" },
          { label: "Upsell Ready", value: upsellReady.toString(), color: "var(--purple)", sub: "Score > 60" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="View" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {activeTab === "segmentation" ? (
          <select title="Segment" value={selectedSegment} onChange={e => setSelectedSegment(e.target.value as "All" | Segment)} className={styles.filterSelect}>
            {(["All", ...Object.keys(segmentConfig)] as Array<"All" | Segment>).map(seg => <option key={seg} value={seg}>{seg}</option>)}
          </select>
        ) : null}
      </div>

      {activeTab === "segmentation" ? (
        <div>
          <div className={cx("grid2", "gap16")}>
            {filtered.map((c) => (
              <div key={c.id} className={cx("card", "p24")}>
                <div className={styles.sciClientHead}>
                  <Avatar initials={c.avatar} color={c.color} />
                  <div>
                    <div className={cx("fw700")}>{c.name}</div>
                    <div className={cx("text12", "colorMuted")}>{c.industry} · {c.tenure} months</div>
                  </div>
                  <div className={styles.sciMlAuto}><SegmentBadge segment={c.segment} /></div>
                </div>
                <div className={styles.sciStatsGrid}>
                  {[
                    { label: "LTV", value: `R${(c.ltv / 1000).toFixed(0)}k`, color: "var(--accent)" },
                    { label: "MRR", value: `R${(c.mrr / 1000).toFixed(0)}k`, color: "var(--blue)" },
                    { label: "Health", value: `${c.health}`, color: c.health >= 80 ? "var(--accent)" : c.health >= 60 ? "var(--amber)" : "var(--red)" },
                    { label: "Churn Risk", value: `${c.churnRisk}%`, color: c.churnRisk > 50 ? "var(--red)" : c.churnRisk > 25 ? "var(--amber)" : "var(--accent)" },
                    { label: "Net Margin", value: `${c.netMargin}%`, color: "var(--purple)" },
                    { label: "Upsell Score", value: `${c.upsellScore}`, color: c.upsellScore > 60 ? "var(--accent)" : "var(--muted)" }
                  ].map((stat) => (
                    <div key={stat.label} className={styles.sciStatBox}>
                      <div className={styles.sciStatLabel}>{stat.label}</div>
                      <div className={cx(styles.sciStatValue, colorClass(stat.color))}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "ltv & cac" ? (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.sciSecTitle}>LTV Ranking</div>
            <div className={cx("flexCol", "gap16")}>
              {[...clients].sort((a, b) => b.ltv - a.ltv).map((c, i) => (
                <div key={c.id} className={styles.sciLtvRow}>
                  <div className={styles.sciRank}>#{i + 1}</div>
                  <Avatar initials={c.avatar} color={c.color} size={30} />
                  <div className={styles.sciFlex1}>
                    <div className={styles.sciLtvHead}>
                      <span className={cx("text13", "fw600")}>{c.name}</span>
                      <span className={styles.sciLtvMoney}>R{(c.ltv / 1000).toFixed(0)}k</span>
                    </div>
                    <div className={styles.sciTrack6}>
                      <progress className={cx(styles.sciTrackFill, "uiProgress", fillClass(c.color))} max={100} value={(c.ltv / clients[0].ltv) * 100} />
                    </div>
                    <div className={styles.sciLtvMeta}>CAC: R{c.cac.toLocaleString()} · LTV:CAC = {(c.ltv / c.cac).toFixed(1)}x</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.sciSideCol}>
            {clients.map((c) => {
              const ratio = Number((c.ltv / c.cac).toFixed(1));
              const ratioColor = ratio >= 5 ? "var(--accent)" : ratio >= 3 ? "var(--amber)" : "var(--red)";
              return (
                <div key={c.id} className={styles.sciRatioCard}>
                  <div className={styles.sciRatioClient}>
                    <Avatar initials={c.avatar} color={c.color} size={28} />
                    <div>
                      <div className={cx("fw600", "text13")}>{c.name}</div>
                      <div className={cx("text11", "colorMuted")}>CAC: R{c.cac.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className={styles.sciRatioBox}>
                    <div className={styles.sciRatioLabel}>LTV:CAC</div>
                    <div className={cx(styles.sciRatioValue, colorClass(ratioColor))}>{ratio.toFixed(1)}x</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "churn prediction" ? (
        <div className={styles.sciChurnSplit}>
          <div className={cx("flexCol", "gap12")}>
            {[...clients].sort((a, b) => b.churnRisk - a.churnRisk).map((c) => (
              <div key={c.id} className={cx(styles.sciChurnCard, toneVarClass(c.churnRisk > 50 ? "var(--red)" : "var(--border"))}>
                <div className={styles.sciChurnGrid}>
                  <div className={styles.sciClientInline}>
                    <Avatar initials={c.avatar} color={c.color} size={32} />
                    <div>
                      <div className={cx("fw600")}>{c.name}</div>
                      <div className={cx("text11", "colorMuted")}>{c.segment}</div>
                    </div>
                  </div>
                  <div>
                    <div className={styles.sciRiskHead}>
                      <span className={styles.sciRiskLabel}>Churn Risk</span>
                      <span className={cx(styles.sciRiskValue, riskClass(c.churnRisk))}>{c.churnRisk}%</span>
                    </div>
                    <div className={styles.sciTrack8}>
                      <progress className={cx(styles.sciTrackFill, "uiProgress", c.churnRisk > 50 ? styles.sciFillRed : c.churnRisk > 25 ? styles.sciFillAmber : styles.sciFillAccent)} max={100} value={c.churnRisk} />
                    </div>
                  </div>
                  <div className={styles.sciKpiCol}>
                    <div className={styles.sciKpiLabel}>Health</div>
                    <div className={cx(styles.sciKpiValue, c.health >= 80 ? "colorAccent" : c.health >= 60 ? "colorAmber" : "colorRed")}>{c.health}</div>
                  </div>
                  <div className={styles.sciKpiCol}>
                    <div className={styles.sciKpiLabel}>Growth</div>
                    <div className={cx(styles.sciKpiValue, c.revenueGrowth > 0 ? "colorAccent" : "colorRed")}>{c.revenueGrowth > 0 ? "+" : ""}{c.revenueGrowth}%</div>
                  </div>
                  <div className={styles.sciKpiCol}>
                    <div className={styles.sciKpiLabel}>Touches</div>
                    <div className={styles.sciKpiValue}>{c.touchpoints}</div>
                  </div>
                  {c.churnRisk > 50 ? (
                    <button type="button" className={styles.sciRecoveryBtn}>Recovery Plan</button>
                  ) : (
                    <button type="button" className={styles.sciMonitorBtn}>Monitor</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.sciSideCol}>
            <div className={styles.sciRiskSummary}>
              <div className={styles.sciRiskTitle}>⚠ Churn Risk Summary</div>
              <div className={styles.sciRiskBody}>
                <div><span className={styles.sciRed}>{clients.filter((c) => c.churnRisk > 50).length} clients</span> above 50% churn risk</div>
                <div>Estimated revenue at risk: <span className={styles.sciRed}>R{clients.filter((c) => c.churnRisk > 50).reduce((s, c) => s + c.mrr, 0).toLocaleString()}/mo</span></div>
                <div>Recovery window: <span className={styles.sciAmber}>30-45 days</span></div>
              </div>
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.sciSecTitle}>Churn Signals</div>
              {[
                "Silent 6+ days",
                "Overdue invoice",
                "Retainer above 90%",
                "Health drop > 10pts",
                "Missed milestone",
                "Reduced touchpoints"
              ].map((signal, i, arr) => (
                <div key={signal} className={cx(styles.sciSignalRow, i < arr.length - 1 && "borderB")}>
                  <div className={styles.sciSignalDot} />
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "cohort analysis" ? (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "overflowHidden", "p0")}>
            <div className={styles.sciCohortTitle}>Acquisition Cohorts</div>
            <div className={styles.sciCohortHead}>{["Quarter", "Clients", "Avg LTV", "Retention", "Churned"].map((h) => <span key={h}>{h}</span>)}</div>
            {cohorts.map((c, i) => (
              <div key={c.quarter} className={cx(styles.sciCohortRow, i < cohorts.length - 1 && "borderB")}>
                <span className={cx("fontMono", "colorMuted")}>{c.quarter}</span>
                <span className={cx("fontMono", "colorBlue")}>{c.clients}</span>
                <span className={cx("fontMono", "colorAccent")}>{c.avgLTV > 0 ? `R${(c.avgLTV / 1000).toFixed(0)}k` : "-"}</span>
                <span className={cx("fontMono", c.retentionRate === 100 ? "colorAccent" : c.retentionRate >= 75 ? "colorAmber" : "colorRed")}>{c.retentionRate > 0 ? `${c.retentionRate}%` : "-"}</span>
                <span className={cx("fontMono", c.churned > 0 ? "colorRed" : "colorMuted")}>{c.churned}</span>
              </div>
            ))}
          </div>
          <div className={cx("card", "p24")}>
            <div className={styles.sciSecTitle}>Overall Retention</div>
            {(() => {
              const totalAcquired = cohorts.reduce((s, c) => s + c.clients, 0);
              const totalChurned = cohorts.reduce((s, c) => s + c.churned, 0);
              const totalActive = totalAcquired - totalChurned;
              const retentionRate = totalAcquired > 0 ? Math.round((totalActive / totalAcquired) * 100) : 0;
              const avgTenure = clients.length > 0 ? Math.round(clients.reduce((s, c) => s + c.tenure, 0) / clients.length) : null;
              return (
          <div className={styles.sciRetentionWrap}>
              <div className={styles.sciRetentionHero}>
                <div className={styles.sciRetentionValue}>{retentionRate}%</div>
                <div className={styles.sciRetentionSub}>12-month client retention</div>
              </div>
              <div className={cx("grid2", "gap12")}>
                {[
                  { label: "Total Acquired", value: totalAcquired.toString(), color: "var(--blue)" },
                  { label: "Currently Active", value: totalActive.toString(), color: "var(--accent)" },
                  { label: "Churned", value: totalChurned.toString(), color: "var(--red)" },
                  { label: "Avg Tenure", value: avgTenure !== null ? `${avgTenure}mo` : "—", color: "var(--amber)" }
                ].map((s) => (
                  <div key={s.label} className={styles.sciRetentionTile}>
                    <div className={styles.sciStatLabel}>{s.label}</div>
                    <div className={cx(styles.sciRetentionTileValue, colorClass(s.color))}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
              );
            })()}
          </div>
        </div>
      ) : null}

      {activeTab === "upsell targets" ? (
        <div className={cx("flexCol", "gap12")}>
          <div className={styles.sciUpsellInfo}>
            Upsell score is calculated from: retainer headroom, health score, tenure, recent NPS, and engagement frequency.
          </div>
          {[...clients].sort((a, b) => b.upsellScore - a.upsellScore).map((c) => (
            <div key={c.id} className={cx("card", "p24")}>
              <div className={styles.sciUpsellGrid}>
                <div className={styles.sciClientInline}>
                  <Avatar initials={c.avatar} color={c.color} size={32} />
                  <div>
                    <div className={cx("fw600")}>{c.name}</div>
                    <div className={cx("text11", "colorMuted")}>{c.retainerTier} tier</div>
                  </div>
                </div>
                <div>
                  <div className={styles.sciRiskHead}>
                    <span className={styles.sciRiskLabel}>Upsell Score</span>
                    <span className={cx("fontMono", "fw700", c.upsellScore > 60 ? "colorAccent" : c.upsellScore > 35 ? "colorAmber" : "colorMuted")}>{c.upsellScore}/100</span>
                  </div>
                  <div className={styles.sciTrack8}>
                    <progress className={cx(styles.sciTrackFill, "uiProgress", c.upsellScore > 60 ? styles.sciFillAccent : c.upsellScore > 35 ? styles.sciFillAmber : styles.sciFillMuted)} max={100} value={c.upsellScore} />
                  </div>
                </div>
                <div>
                  <div className={styles.sciKpiLabel}>Last Upsell</div>
                  <div className={cx("fontMono", "text12", c.lastUpsell === "Never" ? "colorRed" : "colorMuted")}>{c.lastUpsell}</div>
                </div>
                <div>
                  <div className={styles.sciKpiLabel}>Suggested Move</div>
                  <div className={styles.sciSuggestValue}>
                    {c.retainerTier === "Core" && c.upsellScore > 60
                      ? "→ Growth Tier"
                      : c.retainerTier === "Growth" && c.upsellScore > 60
                        ? "→ Enterprise Tier"
                        : c.upsellScore > 35
                          ? "Add-on services"
                          : "Retain & stabilise"}
                  </div>
                </div>
                <button
                  type="button"
                  className={cx(styles.sciUpsellBtn, toneVarClass(c.upsellScore > 60 ? "var(--accent)" : "var(--border)"), c.upsellScore > 60 ? styles.sciTextBg : styles.sciTextMuted)}
                >
                  {c.upsellScore > 60 ? "Create Proposal" : "Not Ready"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
