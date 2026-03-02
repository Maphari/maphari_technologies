"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type Trend = "stable" | "improving" | "declining";
type Tab = "client sla scores" | "sla matrix" | "breach log" | "sla definitions";
type SlaDataKey = "firstResponse" | "substantive" | "milestoneUpdate" | "deliverableReview" | "invoiceAck" | "escalation";

const slaDefinitions = [
  { id: "SLA-01", name: "First Response Time", tier: "All", target: "4 hours", targetHrs: 4, description: "Time from client message to first acknowledgement" },
  { id: "SLA-02", name: "Substantive Response Time", tier: "All", target: "24 hours", targetHrs: 24, description: "Time to meaningful reply or resolution" },
  { id: "SLA-03", name: "Milestone Update Frequency", tier: "Core", target: "Weekly", targetHrs: 168, description: "Minimum project status updates to client" },
  { id: "SLA-04", name: "Milestone Update Frequency", tier: "Growth / Enterprise", target: "Bi-weekly", targetHrs: 84, description: "Minimum project status updates to client" },
  { id: "SLA-05", name: "Deliverable Review Turnaround", tier: "All", target: "48 hours", targetHrs: 48, description: "Time from client feedback to revised deliverable" },
  { id: "SLA-06", name: "Invoice Acknowledgement", tier: "All", target: "Same day", targetHrs: 8, description: "Invoice confirmed received and correct" },
  { id: "SLA-07", name: "Emergency Escalation Response", tier: "Growth / Enterprise", target: "2 hours", targetHrs: 2, description: "Critical issues or client escalations" },
] as const;

type SlaPoint = { avg: number; breaches30d: number; lastBreached: string | null; unit?: "days" };
type SlaDataMap = {
  firstResponse: SlaPoint;
  substantive: SlaPoint;
  milestoneUpdate: SlaPoint;
  deliverableReview: SlaPoint;
  invoiceAck: SlaPoint;
  escalation: SlaPoint | null;
};

const clients: Array<{
  name: string;
  color: string;
  tier: string;
  am: string;
  slaData: SlaDataMap;
  overallScore: number;
  trend: Trend;
}> = [
  {
    name: "Volta Studios",
    color: "var(--accent)",
    tier: "Growth",
    am: "Nomsa Dlamini",
    slaData: {
      firstResponse: { avg: 2.1, breaches30d: 0, lastBreached: null },
      substantive: { avg: 18.4, breaches30d: 0, lastBreached: null },
      milestoneUpdate: { avg: 5.2, breaches30d: 0, lastBreached: null, unit: "days" },
      deliverableReview: { avg: 31.2, breaches30d: 1, lastBreached: "Feb 14" },
      invoiceAck: { avg: 3.1, breaches30d: 0, lastBreached: null },
      escalation: { avg: 1.4, breaches30d: 0, lastBreached: null },
    },
    overallScore: 97,
    trend: "stable",
  },
  {
    name: "Kestrel Capital",
    color: "var(--accent)",
    tier: "Core",
    am: "Nomsa Dlamini",
    slaData: {
      firstResponse: { avg: 5.8, breaches30d: 3, lastBreached: "Feb 20" },
      substantive: { avg: 29.1, breaches30d: 2, lastBreached: "Feb 19" },
      milestoneUpdate: { avg: 8.1, breaches30d: 1, lastBreached: "Feb 12" },
      deliverableReview: { avg: 52.4, breaches30d: 2, lastBreached: "Feb 18" },
      invoiceAck: { avg: 12.4, breaches30d: 1, lastBreached: "Feb 17" },
      escalation: null,
    },
    overallScore: 52,
    trend: "declining",
  },
  {
    name: "Mira Health",
    color: "var(--blue)",
    tier: "Core",
    am: "Nomsa Dlamini",
    slaData: {
      firstResponse: { avg: 3.2, breaches30d: 0, lastBreached: null },
      substantive: { avg: 21.0, breaches30d: 1, lastBreached: "Feb 10" },
      milestoneUpdate: { avg: 6.4, breaches30d: 0, lastBreached: null },
      deliverableReview: { avg: 44.8, breaches30d: 1, lastBreached: "Feb 16" },
      invoiceAck: { avg: 5.2, breaches30d: 0, lastBreached: null },
      escalation: null,
    },
    overallScore: 81,
    trend: "improving",
  },
  {
    name: "Dune Collective",
    color: "var(--amber)",
    tier: "Core",
    am: "Renzo Fabbri",
    slaData: {
      firstResponse: { avg: 6.2, breaches30d: 4, lastBreached: "Feb 22" },
      substantive: { avg: 31.8, breaches30d: 3, lastBreached: "Feb 21" },
      milestoneUpdate: { avg: 9.8, breaches30d: 2, lastBreached: "Feb 15" },
      deliverableReview: { avg: 61.2, breaches30d: 3, lastBreached: "Feb 20" },
      invoiceAck: { avg: 8.9, breaches30d: 0, lastBreached: null },
      escalation: null,
    },
    overallScore: 38,
    trend: "declining",
  },
  {
    name: "Okafor & Sons",
    color: "var(--amber)",
    tier: "Core",
    am: "Tapiwa Moyo",
    slaData: {
      firstResponse: { avg: 2.8, breaches30d: 0, lastBreached: null },
      substantive: { avg: 16.2, breaches30d: 0, lastBreached: null },
      milestoneUpdate: { avg: 5.9, breaches30d: 0, lastBreached: null },
      deliverableReview: { avg: 38.4, breaches30d: 0, lastBreached: null },
      invoiceAck: { avg: 4.1, breaches30d: 0, lastBreached: null },
      escalation: null,
    },
    overallScore: 98,
    trend: "stable",
  },
];

const slaMetrics: Array<{ key: Exclude<SlaDataKey, "escalation">; name: string; targetHrs: number; unit: string; divisor?: number }> = [
  { key: "firstResponse", name: "First Response", targetHrs: 4, unit: "h" },
  { key: "substantive", name: "Substantive Reply", targetHrs: 24, unit: "h" },
  { key: "milestoneUpdate", name: "Milestone Update", targetHrs: 168, unit: "d", divisor: 24 },
  { key: "deliverableReview", name: "Deliverable Review", targetHrs: 48, unit: "h" },
  { key: "invoiceAck", name: "Invoice Ack.", targetHrs: 8, unit: "h" },
];

const tabs: Tab[] = ["client sla scores", "sla matrix", "breach log", "sla definitions"];

export function SlaTrackerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("client sla scores");

  const totalBreaches = clients.reduce(
    (s, c) =>
      s +
      Object.values(c.slaData)
        .filter((m): m is SlaPoint => Boolean(m))
        .reduce((s2, m) => s2 + m.breaches30d, 0),
    0
  );
  const atRisk = clients.filter((c) => c.overallScore < 70).length;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / OPERATIONS</div>
          <h1 className={styles.pageTitle}>SLA Tracker</h1>
          <div className={styles.pageSub}>Response times - Breach alerts - Client service level compliance</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export SLA Report</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Avg SLA Score", value: `${Math.round(clients.reduce((s, c) => s + c.overallScore, 0) / clients.length)}%`, color: "var(--accent)", sub: "Across all clients" },
          { label: "Clients At Risk", value: atRisk.toString(), color: atRisk > 0 ? "var(--red)" : "var(--accent)", sub: "Score < 70%" },
          { label: "Breaches (30d)", value: totalBreaches.toString(), color: totalBreaches > 5 ? "var(--red)" : "var(--amber)", sub: "Across all SLAs" },
          { label: "SLA Compliance", value: `${Math.round((1 - totalBreaches / 150) * 100)}%`, color: "var(--blue)", sub: "~150 SLA events / month" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, "slaToneText", toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="View" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "client sla scores" && (
        <div className={cx("flexCol", "gap12")}>
          {[...clients].sort((a, b) => a.overallScore - b.overallScore).map((c) => {
            const scoreColor = c.overallScore >= 85 ? "var(--accent)" : c.overallScore >= 65 ? "var(--amber)" : "var(--red)";
            const totalBreachesClient = Object.values(c.slaData)
              .filter((m): m is SlaPoint => Boolean(m))
              .reduce((s, m) => s + m.breaches30d, 0);
            return (
              <div key={c.name} className={cx("card", "p24", c.overallScore < 70 && "slaRiskCard")}>
                <div className={cx("slaScoreGrid", "slaScoreAligned", "gap20")}>
                  <div>
                    <div className={cx("fw700", "slaClientName", "slaToneText", toneClass(c.color))}>{c.name}</div>
                    <div className={cx("text11", "colorMuted")}>
                      {c.tier} tier - {c.am}
                    </div>
                  </div>
                  <div>
                    <div className={cx("flexBetween", "mb6")}>
                      <span className={cx("text11", "colorMuted")}>SLA Compliance Score</span>
                      <span className={cx("fontMono", "fw800", "slaToneText", toneClass(scoreColor))}>{c.overallScore}%</span>
                    </div>
                    <progress className={cx(styles.slaProgressLg, styles.slaBarFill, toneClass(scoreColor))} max={100} value={c.overallScore} aria-label={`${c.name} SLA compliance ${c.overallScore}%`} />
                  </div>
                  <div>
                    <div className={cx("text10", "colorMuted", "mb3")}>Breaches</div>
                    <div className={cx("fontMono", "fw700", "slaBreachCount", "slaToneText", toneClass(totalBreachesClient > 0 ? "var(--red)" : "var(--accent)"))}>{totalBreachesClient}</div>
                  </div>
                  <div className={cx("flexRow", "gap6")}>
                    <span className={cx("text14")}>{c.trend === "improving" ? "\u25B2" : c.trend === "declining" ? "\u25BC" : "\u2192"}</span>
                    <span className={cx("text11", "slaToneText", toneClass(c.trend === "improving" ? "var(--accent)" : c.trend === "declining" ? "var(--red)" : "var(--muted)"))}>{c.trend}</span>
                  </div>
                  {c.overallScore < 70 ? (
                    <button type="button" className={cx("btnSm", "slaActionBtn")}>Action Required</button>
                  ) : (
                    <button type="button" className={cx("btnSm", "btnGhost")}>View Detail</button>
                  )}
                </div>

                <div className={cx("slaMetricGrid", "gap10", "mt16")}>
                  {slaMetrics.map((m) => {
                    const data = c.slaData[m.key];
                    const val = m.divisor ? (data.avg / m.divisor).toFixed(1) : data.avg.toFixed(1);
                    const overTarget = data.avg > m.targetHrs;
                    return (
                      <div key={m.key} className={cx("bgBg", "textCenter", "p12", "slaCellRadius")}>
                        <div className={cx("fontMono", "fw700", "slaMetricValue", "slaToneText", toneClass(overTarget ? "var(--red)" : "var(--accent)"))}>{val}{m.unit}</div>
                        <div className={cx("colorMuted", "mt4", "slaMetricName")}>{m.name}</div>
                        {data.breaches30d > 0 ? <div className={cx("colorRed", "mt4", "slaMetricBreach")}>{data.breaches30d} breach{data.breaches30d !== 1 ? "es" : ""}</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "sla matrix" && (
        <div className={cx("card", "overflowHidden", "p0")}>
          <div className={cx("slaMatrixGrid", "px20", "borderB", "text10", "colorMuted", "uppercase", "tracking", "gap8", "slaMatrixHead")}>
            <span>SLA Metric</span>
            {clients.map((c) => (
              <span key={c.name} className={cx("textCenter", "slaToneText", toneClass(c.color))}>
                {c.name.split(" ")[0]}
              </span>
            ))}
          </div>
          {slaMetrics.map((m, ri) => (
            <div key={m.key} className={cx("slaMatrixGrid", "gap8", "slaMatrixRow", ri < slaMetrics.length - 1 && "borderB")}>
              <div>
                <div className={cx("text12", "fw600")}>{m.name}</div>
                <div className={cx("text10", "colorMuted")}>
                  Target: {m.targetHrs}
                  {m.unit}
                </div>
              </div>
              {clients.map((c) => {
                const data = c.slaData[m.key];
                const val = m.divisor ? (data.avg / m.divisor).toFixed(1) : data.avg.toFixed(1);
                const ok = data.avg <= m.targetHrs;
                return (
                  <div key={c.name} className={cx("textCenter", "p12", "slaCellRadius", ok ? "slaMatrixCellOk" : "slaMatrixCellFail")}>
                    <div className={cx("fontMono", "fw700", "text14", "slaToneText", toneClass(ok ? "var(--accent)" : "var(--red)"))}>
                      {val}
                      {m.unit}
                    </div>
                    {data.breaches30d > 0 ? <div className={cx("colorRed", "slaTiny9")}>{"\u00D7"}{data.breaches30d}</div> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {activeTab === "breach log" && (
        <div className={cx("flexCol", "gap10")}>
          {clients
            .flatMap((c) =>
              slaMetrics
                .map((m) => {
                  const data = c.slaData[m.key];
                  if (data.breaches30d === 0) return null;
                  return {
                    client: c.name,
                    clientColor: c.color,
                    am: c.am,
                    metric: m.name,
                    breaches: data.breaches30d,
                    lastBreached: data.lastBreached,
                    avg: data.avg,
                    target: m.targetHrs,
                    unit: m.unit,
                  };
                })
                .filter((x): x is NonNullable<typeof x> => Boolean(x))
            )
            .sort((a, b) => b.breaches - a.breaches)
            .map((breach, i) => (
              <div key={i} className={cx("slaBreachGrid", "card", "p20", "gap16", "slaBreachCard")}>
                <div className={cx("fw700", "slaToneText", toneClass(breach.clientColor))}>{breach.client}</div>
                <div>
                  <div className={cx("fw600")}>{breach.metric}</div>
                  <div className={cx("text11", "colorMuted")}>AM: {breach.am}</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb3")}>Avg Time</div>
                  <div className={cx("fontMono", "colorRed", "fw700")}>
                    {breach.avg.toFixed(1)}
                    {breach.unit}
                  </div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb3")}>Target</div>
                  <div className={cx("fontMono", "colorAccent")}>
                    {breach.target}
                    {breach.unit}
                  </div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb3")}>Last Breach</div>
                  <div className={cx("fontMono", "text12")}>{breach.lastBreached}</div>
                </div>
                <div className={cx("textCenter", "p12", "slaCellRadius", "slaBreachBadge")}>
                  <div className={cx("fontMono", "colorRed", "fw800")}>{breach.breaches}</div>
                  <div className={cx("colorRed", "slaTiny9")}>breaches</div>
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === "sla definitions" && (
        <div className={cx("flexCol", "gap12")}>
          {slaDefinitions.map((sla) => (
            <div key={sla.id} className={cx("slaDefGrid", "card", "p20", "gap20", "slaDefRow")}>
              <span className={cx("fontMono", "text11", "colorMuted")}>{sla.id}</span>
              <div>
                <div className={cx("fw600", "mb4")}>{sla.name}</div>
                <div className={cx("text12", "colorMuted")}>{sla.description}</div>
              </div>
              <span className={cx("badge", "badgeBlue")}>{sla.tier}</span>
              <div className={cx("fontMono", "text14", "fw700", "colorAccent")}>Target: {sla.target}</div>
              <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
            </div>
          ))}
          <button type="button" className={cx("card", "textCenter", "colorMuted", "text13", "pointerCursor", "p20", "slaAddDefBtn")}>+ Add SLA Definition</button>
        </div>
      )}
    </div>
  );
}
