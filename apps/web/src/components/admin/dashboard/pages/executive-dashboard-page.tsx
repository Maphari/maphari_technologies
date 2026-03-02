"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";

const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

const mrrHistory = [244000, 262000, 280000, 296000, 344000, 380600];
const profitHistory = [68000, 74000, 79000, 91000, 98000, 112000];
const npsHistory = [42, 45, 51, 48, 38, 42];
const utilizationHistory = [74, 76, 79, 82, 78, 81];

const clients = [
  { name: "Volta Studios", color: "var(--accent)", mrr: 28000, health: 94, nps: 9, trend: "stable" },
  { name: "Kestrel Capital", color: "var(--purple)", mrr: 21000, health: 44, nps: 4, trend: "declining" },
  { name: "Mira Health", color: "var(--blue)", mrr: 21600, health: 74, nps: 8, trend: "improving" },
  { name: "Dune Collective", color: "var(--amber)", mrr: 16000, health: 38, nps: 3, trend: "declining" },
  { name: "Okafor & Sons", color: "var(--amber)", mrr: 12000, health: 96, nps: 10, trend: "stable" }
] as const;

const alerts = [
  { type: "critical", icon: "🔴", message: "Kestrel Capital — invoice INV-0039 overdue 12 days. NPS dropped to 4.", action: "View" },
  { type: "warning", icon: "🟡", message: "Dune Collective — scope dispute unresolved. Health score 38.", action: "Review" },
  { type: "warning", icon: "🟡", message: "Leilani Fotu — leave pending approval (5 days from Mar 10).", action: "Approve" },
  { type: "info", icon: "🟢", message: "Zoe Hendricks onboarding starts Mar 3 — 8 tasks outstanding.", action: "View" },
  { type: "info", icon: "🟢", message: "FY2025 closeout 52% complete — accountant review Mar 10.", action: "View" }
] as const;

const kpis = [
  { label: "Monthly MRR", value: "R380.6k", prev: "R344k", change: "+10.6%", color: "var(--accent)", up: true },
  { label: "Net Profit (Feb)", value: "R112k", prev: "R98k", change: "+14.3%", color: "var(--accent)", up: true },
  { label: "Gross Margin", value: "51%", prev: "48%", change: "+3pp", color: "var(--accent)", up: true },
  { label: "Team Utilisation", value: "81%", prev: "78%", change: "+3pp", color: "var(--accent)", up: true },
  { label: "Portfolio NPS", value: "42", prev: "38", change: "+4", color: "var(--accent)", up: true },
  { label: "Active Projects", value: "5", prev: "5", change: "—", color: "var(--blue)", up: null },
  { label: "Overdue Invoices", value: "R37k", prev: "R0", change: "+R37k", color: "var(--red)", up: false },
  { label: "Clients at Risk", value: "2", prev: "1", change: "+1", color: "var(--red)", up: false }
] as const;

function Sparkline({ data, color, height = 40, width = 100 }: { data: number[]; color: string; height?: number; width?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className={styles.exdSparkSvg}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return i === data.length - 1 ? <circle key={i} cx={x} cy={y} r="3.5" fill={color} /> : null;
      })}
    </svg>
  );
}

const tabs = ["overview", "financial", "clients", "team", "alerts"] as const;
type Tab = (typeof tabs)[number];

function healthClass(score: number): string {
  if (score >= 70) return "colorAccent";
  if (score >= 50) return "colorAmber";
  return "colorRed";
}

function trendClass(trend: "stable" | "declining" | "improving"): string {
  if (trend === "improving") return "colorAccent";
  if (trend === "declining") return "colorRed";
  return "colorMuted";
}

function dotClass(value: string): string {
  if (value === "var(--red)") return styles.exdDotRed;
  if (value === "var(--amber)") return styles.exdDotAmber;
  if (value === "var(--blue)") return styles.exdDotBlue;
  if (value === "var(--purple)") return styles.exdDotPurple;
  return styles.exdDotAccent;
}

function progressToneClass(value: string): string {
  if (value === "var(--red)") return styles.exdProgressRed;
  if (value === "var(--amber)") return styles.exdProgressAmber;
  if (value === "var(--blue)") return styles.exdProgressBlue;
  if (value === "var(--purple)") return styles.exdProgressPurple;
  return styles.exdProgressAccent;
}

function healthToneClass(score: number): string {
  if (score >= 70) return styles.exdProgressAccent;
  if (score >= 50) return styles.exdProgressAmber;
  return styles.exdProgressRed;
}

export function ExecutiveDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const totalMRR = clients.reduce((s, c) => s + c.mrr, 0);
  const avgHealth = Math.round(clients.reduce((s, c) => s + c.health, 0) / clients.length);

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / REPORTING & INTELLIGENCE</div>
          <h1 className={styles.pageTitle}>Executive Dashboard</h1>
          <div className={styles.pageSub}>Single pane of glass · Maphari Creative Studio · Feb 2026</div>
        </div>
        <div className={styles.exdHeadActions}>
          <div className={styles.exdUpdated}>Last updated: Feb 24 09:00</div>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Board Pack</button>
        </div>
      </div>

      {alerts.filter((a) => a.type === "critical" || a.type === "warning").length > 0 && (
        <div className={styles.exdAlertStripWrap}>
          {alerts
            .filter((a) => a.type !== "info")
            .map((alert, i) => {
              const tone = alert.type === "critical" ? "var(--red)" : "var(--amber)";
              return (
                <div key={i} className={cx(styles.exdAlertStrip, toneClass(tone))}>
                  <div className={styles.exdAlertLeft}>
                    <span className={styles.exdAlertIcon}>{alert.icon}</span>
                    <span className={styles.text12}>{alert.message}</span>
                  </div>
                  <button type="button" className={cx(styles.exdAlertBtn, toneClass(tone))}>{alert.action}</button>
                </div>
              );
            })}
        </div>
      )}

      <div className={styles.exdKpiGrid}>
        {kpis.map((k) => {
          const tone = k.color === "var(--red)" ? "var(--red)" : "var(--border)";
          return (
            <div key={k.label} className={cx(styles.exdKpiCard, toneClass(tone))}>
              <div className={styles.exdKpiLabel}>{k.label}</div>
              <div className={cx(styles.exdKpiValue, colorClass(k.color))}>{k.value}</div>
              <div className={styles.exdKpiMeta}>
                {k.up !== null && <span className={cx(styles.exdKpiArrow, k.up ? "colorAccent" : "colorRed")}>{k.up ? "▲" : "▼"}</span>}
                <span className={cx("text11", k.up ? "colorAccent" : k.up === false ? "colorRed" : "colorMuted")}>{k.change}</span>
                <span className={styles.exdKpiPrev}>vs {k.prev}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.filterRow}>
        <select title="Filter by tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "overview" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.exdCardHd}>
              <div className={styles.exdSecTitle}>MRR Trend (6mo)</div>
              <div className={styles.exdHeadValueAccent}>R{(mrrHistory[mrrHistory.length - 1] / 1000).toFixed(0)}k</div>
            </div>
            <div className={styles.exdMiniBars}>
              {mrrHistory.map((v, i) => {
                const h = (v / Math.max(...mrrHistory)) * 80;
                const isLast = i === mrrHistory.length - 1;
                return (
                  <div key={i} className={styles.exdMiniBarCol}>
                    <svg className={styles.exdMiniBar} viewBox="0 0 10 80" preserveAspectRatio="none" aria-hidden="true">
                      <rect x="0" y={80 - h} width="10" height={h} fill={isLast ? "var(--accent)" : "var(--accent-d)"} />
                    </svg>
                    <span className={styles.exdMiniMonth}>{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={cx("card", "p24")}>
            <div className={styles.exdCardHd}>
              <div className={styles.exdSecTitle}>Net Profit (6mo)</div>
              <div className={styles.exdHeadValueBlue}>R{(profitHistory[profitHistory.length - 1] / 1000).toFixed(0)}k</div>
            </div>
            <div className={styles.exdMiniBars}>
              {profitHistory.map((v, i) => {
                const h = (v / Math.max(...profitHistory)) * 80;
                const isLast = i === profitHistory.length - 1;
                return (
                  <div key={i} className={styles.exdMiniBarCol}>
                    <svg className={styles.exdMiniBar} viewBox="0 0 10 80" preserveAspectRatio="none" aria-hidden="true">
                      <rect x="0" y={80 - h} width="10" height={h} fill={isLast ? "var(--blue)" : "rgba(96,165,250,0.3)"} />
                    </svg>
                    <span className={styles.exdMiniMonth}>{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Client Health Snapshot</div>
            {clients.map((c) => (
              <div key={c.name} className={styles.exdHealthRow}>
                <div className={cx(styles.exdDot, dotClass(c.color))} />
                <span className={cx(styles.exdHealthName, colorClass(c.color))}>{c.name}</span>
                <progress
                  className={cx(styles.exdHealthTrack, healthToneClass(c.health))}
                  max={100}
                  value={c.health}
                  aria-label={`${c.name} health ${c.health}`}
                />
                <span className={cx(styles.exdHealthScore, healthClass(c.health))}>{c.health}</span>
                <span className={styles.text12}>{c.trend === "improving" ? "▲" : c.trend === "declining" ? "▼" : "→"}</span>
              </div>
            ))}
            <div className={styles.exdAvgRow}>
              <span className={cx("text12", "colorMuted")}>Portfolio avg health</span>
              <span className={cx(styles.exdAvgValue, avgHealth >= 70 ? "colorAccent" : "colorAmber")}>{avgHealth}</span>
            </div>
          </div>

          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Team & Operations Pulse</div>
            {[
              { label: "Utilisation", values: utilizationHistory, color: "var(--purple)", unit: "%" },
              { label: "eNPS", values: npsHistory, color: "var(--amber)", unit: "" }
            ].map((metric) => (
              <div key={metric.label} className={styles.exdPulseBlock}>
                <div className={styles.exdPulseHead}>
                  <span className={cx("text12", "colorMuted")}>{metric.label}</span>
                  <span className={cx(styles.exdPulseValue, colorClass(metric.color))}>
                    {metric.values[metric.values.length - 1]}
                    {metric.unit}
                  </span>
                </div>
                <Sparkline data={[...metric.values]} color={metric.color} height={36} width={360} />
                <div className={styles.exdPulseMonths}>
                  {months.map((m) => (
                    <span key={m} className={styles.exdMiniMonth}>{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "financial" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Revenue by Client</div>
            {clients.map((c) => (
              <div key={c.name} className={styles.exdRevRow}>
                <span className={cx(styles.exdRevName, colorClass(c.color))}>{c.name.split(" ")[0]}</span>
                <progress
                  className={cx(styles.exdRevTrack, progressToneClass(c.color))}
                  max={totalMRR}
                  value={c.mrr}
                  aria-label={`${c.name} revenue share`}
                />
                <span className={cx(styles.exdRevValue, colorClass(c.color))}>R{(c.mrr / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Cash Position (Feb)</div>
            {[
              { label: "Opening balance", value: "R285k", color: "var(--blue)" },
              { label: "Inflows expected", value: "R381k", color: "var(--accent)" },
              { label: "Outflows planned", value: "-R335k", color: "var(--red)" },
              { label: "Net cash movement", value: "+R46k", color: "var(--accent)" },
              { label: "Closing balance (est.)", value: "R331k", color: "var(--accent)" },
              { label: "Overdue receivables", value: "R37k", color: "var(--red)" }
            ].map((r, idx) => (
              <div key={r.label} className={cx(styles.exdCashRow, idx < 5 && "borderB")}>
                <span className={styles.exdCashLabel}>{r.label}</span>
                <span className={cx(styles.exdCashValue, colorClass(r.color))}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "clients" && (
        <div className={styles.exdClientsCol}>
          {clients.map((c) => {
            const tone = c.health < 50 ? "var(--red)" : "var(--border)";
            return (
              <div key={c.name} className={cx(styles.exdClientRow, toneClass(tone))}>
                <div className={cx(styles.exdClientName, colorClass(c.color))}>{c.name}</div>
                <div className={cx(styles.exdClientHealthValue, healthClass(c.health))}>{c.health}</div>
                <div>
                  <progress
                    className={cx(styles.exdTrack8, healthToneClass(c.health))}
                    max={100}
                    value={c.health}
                    aria-label={`${c.name} health bar`}
                  />
                </div>
                <div className={styles.exdCenterCol}><div className={styles.exdMiniLabel}>MRR</div><div className={styles.exdMonoAccent}>R{(c.mrr / 1000).toFixed(0)}k</div></div>
                <div className={styles.exdCenterCol}><div className={styles.exdMiniLabel}>NPS</div><div className={cx(styles.exdMonoBold, c.nps >= 8 ? "colorAccent" : c.nps >= 6 ? "colorAmber" : "colorRed")}>{c.nps}</div></div>
                <div className={styles.exdCenterCol}><div className={styles.exdMiniLabel}>Trend</div><span className={cx(styles.exdTrendIcon, trendClass(c.trend))}>{c.trend === "improving" ? "▲" : c.trend === "declining" ? "▼" : "→"}</span></div>
                {c.health < 50 ? <span className={styles.exdAtRiskTag}>At Risk</span> : <span />}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "team" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Utilisation Trend (6mo)</div>
            <div className={styles.exdMiniBars}>
              {utilizationHistory.map((v, i) => {
                const h = (v / 100) * 80;
                const isLast = i === utilizationHistory.length - 1;
                return (
                  <div key={i} className={styles.exdMiniBarCol}>
                    <svg className={styles.exdMiniBar} viewBox="0 0 10 80" preserveAspectRatio="none" aria-hidden="true">
                      <rect x="0" y={80 - h} width="10" height={h} fill={isLast ? "var(--purple)" : "var(--accent-d)"} />
                    </svg>
                    <span className={styles.exdMiniMonth}>{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={cx("card", "p24")}>
            <div className={styles.exdSecTitle}>Staff eNPS (6mo)</div>
            <div className={styles.exdMiniBars}>
              {npsHistory.map((v, i) => {
                const h = ((v + 20) / 80) * 80;
                const isLast = i === npsHistory.length - 1;
                return (
                  <div key={i} className={styles.exdMiniBarCol}>
                    <svg className={styles.exdMiniBar} viewBox="0 0 10 80" preserveAspectRatio="none" aria-hidden="true">
                      <rect x="0" y={80 - Math.max(h, 4)} width="10" height={Math.max(h, 4)} fill={isLast ? "var(--amber)" : "rgba(245,197,24,0.3)"} />
                    </svg>
                    <span className={styles.exdMiniMonth}>{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "alerts" && (
        <div className={styles.exdAlertsCol}>
          {alerts.map((alert, i) => {
            const tone = alert.type === "critical" ? "var(--red)" : alert.type === "warning" ? "var(--amber)" : "var(--accent)";
            return (
              <div key={i} className={cx(styles.exdAlertRow, toneClass(tone))}>
                <div className={styles.exdAlertLeftBig}>
                  <span className={styles.exdAlertBigIcon}>{alert.icon}</span>
                  <div>
                    <span className={cx(styles.exdAlertType, alert.type === "critical" ? "colorRed" : alert.type === "warning" ? "colorAmber" : "colorAccent")}>{alert.type}</span>
                    <span className={styles.text13}>{alert.message}</span>
                  </div>
                </div>
                <button type="button" className={cx(styles.exdAlertBtnBig, toneClass(tone))}>{alert.action}</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
