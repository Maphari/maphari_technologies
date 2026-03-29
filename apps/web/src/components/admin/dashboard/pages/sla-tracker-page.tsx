"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAllSlaRecordsWithRefresh, type AdminSlaRecord } from "../../../../lib/api/admin/client-ops";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import type { AdminClient } from "../../../../lib/api/admin/types";

type Trend = "stable" | "improving" | "declining";
type Tab = "client sla scores" | "sla matrix" | "breach log" | "sla definitions";
type SlaDataKey = "firstResponse" | "substantive" | "milestoneUpdate" | "deliverableReview" | "invoiceAck" | "escalation";

const slaDefinitions = [
  { id: "SLA-01", name: "First Response Time",         tier: "All",                  target: "4 hours",    targetHrs: 4,   description: "Time from client message to first acknowledgement" },
  { id: "SLA-02", name: "Substantive Response Time",   tier: "All",                  target: "24 hours",   targetHrs: 24,  description: "Time to meaningful reply or resolution" },
  { id: "SLA-03", name: "Milestone Update Frequency",  tier: "Core",                 target: "Weekly",     targetHrs: 168, description: "Minimum project status updates to client" },
  { id: "SLA-04", name: "Milestone Update Frequency",  tier: "Growth / Enterprise",  target: "Bi-weekly",  targetHrs: 84,  description: "Minimum project status updates to client" },
  { id: "SLA-05", name: "Deliverable Review Turnaround", tier: "All",                target: "48 hours",   targetHrs: 48,  description: "Time from client feedback to revised deliverable" },
  { id: "SLA-06", name: "Invoice Acknowledgement",     tier: "All",                  target: "Same day",   targetHrs: 8,   description: "Invoice confirmed received and correct" },
  { id: "SLA-07", name: "Emergency Escalation Response", tier: "Growth / Enterprise", target: "2 hours",   targetHrs: 2,   description: "Critical issues or client escalations" },
] as const;

type SlaPoint = { avg: number; breaches30d: number; lastBreached: string | null; unit?: "days" };
type SlaDataMap = {
  firstResponse:     SlaPoint;
  substantive:       SlaPoint;
  milestoneUpdate:   SlaPoint;
  deliverableReview: SlaPoint;
  invoiceAck:        SlaPoint;
  escalation:        SlaPoint | null;
};

type ClientSlaRow = {
  name:         string;
  color:        string;
  tier:         string;
  am:           string;
  slaData:      SlaDataMap;
  overallScore: number;
  trend:        Trend;
};

const slaMetrics: Array<{ key: Exclude<SlaDataKey, "escalation">; name: string; targetHrs: number; unit: string; divisor?: number }> = [
  { key: "firstResponse",     name: "First Response",     targetHrs: 4,   unit: "h"              },
  { key: "substantive",       name: "Substantive Reply",  targetHrs: 24,  unit: "h"              },
  { key: "milestoneUpdate",   name: "Milestone Update",   targetHrs: 168, unit: "d", divisor: 24 },
  { key: "deliverableReview", name: "Deliverable Review", targetHrs: 48,  unit: "h"              },
  { key: "invoiceAck",        name: "Invoice Ack.",        targetHrs: 8,   unit: "h"             },
];

const tabs: Tab[] = ["client sla scores", "sla matrix", "breach log", "sla definitions"];

const CLIENT_COLORS = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--red)", "var(--green)"];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getMetricKey(metric: string): SlaDataKey | null {
  const m = metric.toLowerCase();
  if (m.includes("first response"))  return "firstResponse";
  if (m.includes("substantive"))     return "substantive";
  if (m.includes("milestone"))       return "milestoneUpdate";
  if (m.includes("deliverable") || m.includes("review")) return "deliverableReview";
  if (m.includes("invoice"))         return "invoiceAck";
  if (m.includes("escalat") || m.includes("emergency")) return "escalation";
  return null;
}

function emptyPoint(): SlaPoint {
  return { avg: 0, breaches30d: 0, lastBreached: null };
}

function buildSlaData(records: AdminSlaRecord[]): SlaDataMap {
  const now      = Date.now();
  const data: SlaDataMap = {
    firstResponse:     emptyPoint(),
    substantive:       emptyPoint(),
    milestoneUpdate:   emptyPoint(),
    deliverableReview: emptyPoint(),
    invoiceAck:        emptyPoint(),
    escalation:        null,
  };
  const buckets: Record<SlaDataKey, AdminSlaRecord[]> = {
    firstResponse: [], substantive: [], milestoneUpdate: [],
    deliverableReview: [], invoiceAck: [], escalation: [],
  };
  records.forEach(r => {
    const key = getMetricKey(r.metric);
    if (key) buckets[key].push(r);
  });
  (Object.keys(buckets) as SlaDataKey[]).forEach(key => {
    const recs = buckets[key];
    if (recs.length === 0) return;
    const avg         = recs.reduce((s, r) => s + (r.actualHrs ?? 0), 0) / recs.length;
    const breaches30d = recs.filter(r =>
      r.status === "MISSED" && (now - new Date(r.periodStart).getTime()) <= THIRTY_DAYS_MS
    ).length;
    const lastMissed  = recs
      .filter(r => r.status === "MISSED")
      .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime())[0];
    const point: SlaPoint = {
      avg,
      breaches30d,
      lastBreached: lastMissed
        ? new Date(lastMissed.periodStart).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
        : null,
    };
    if (key === "escalation") {
      data.escalation = point;
    } else {
      (data as Record<string, SlaPoint>)[key] = point;
    }
  });
  return data;
}

function calcOverallScore(slaData: SlaDataMap): number {
  const points: Array<{ avg: number; targetHrs: number }> = [
    { avg: slaData.firstResponse.avg,     targetHrs: 4   },
    { avg: slaData.substantive.avg,       targetHrs: 24  },
    { avg: slaData.milestoneUpdate.avg,   targetHrs: 168 },
    { avg: slaData.deliverableReview.avg, targetHrs: 48  },
    { avg: slaData.invoiceAck.avg,        targetHrs: 8   },
  ].filter(p => p.avg > 0);
  if (points.length === 0) return 100;
  const met = points.filter(p => p.avg <= p.targetHrs).length;
  return Math.round((met / points.length) * 100);
}

function buildClientRows(records: AdminSlaRecord[], clients: AdminClient[]): ClientSlaRow[] {
  const clientMap = new Map<string, AdminClient>(clients.map(c => [c.id, c]));
  const byClient  = new Map<string, AdminSlaRecord[]>();
  records.forEach(r => {
    if (!byClient.has(r.clientId)) byClient.set(r.clientId, []);
    byClient.get(r.clientId)!.push(r);
  });
  let colorIdx = 0;
  return [...byClient.entries()].map(([clientId, recs]) => {
    const client   = clientMap.get(clientId);
    const slaData  = buildSlaData(recs);
    const score    = calcOverallScore(slaData);
    return {
      name:         client?.name ?? clientId,
      color:        CLIENT_COLORS[colorIdx++ % CLIENT_COLORS.length],
      tier:         client?.tier ?? "STARTER",
      am:           client?.ownerName ?? "—",
      slaData,
      overallScore: score,
      trend:        "stable" as Trend,
    };
  });
}

export function SlaTrackerPage({ session }: { session: AuthSession | null }) {
  const [clients, setClients]     = useState<ClientSlaRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("client sla scores");

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const [slaRes, snapRes] = await Promise.all([
          loadAllSlaRecordsWithRefresh(session),
          loadAdminSnapshotWithRefresh(session),
        ]);
        if (cancelled) return;
        if (slaRes.nextSession)        saveSession(slaRes.nextSession);
        else if (snapRes.nextSession)  saveSession(snapRes.nextSession);
        if (slaRes.error) { setError(slaRes.error.message ?? "Failed to load."); return; }
        setClients(buildClientRows(slaRes.data ?? [], snapRes.data?.clients ?? []));
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const totalBreaches = clients.reduce(
    (s, c) =>
      s + Object.values(c.slaData)
        .filter((m): m is SlaPoint => Boolean(m))
        .reduce((s2, m) => s2 + m.breaches30d, 0),
    0
  );
  const atRisk = clients.filter(c => c.overallScore < 70).length;

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
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>OPERATIONS / SLA TRACKER</div>
          <h1 className={styles.pageTitle}>SLA Tracker</h1>
          <div className={styles.pageSub}>Response times - Breach alerts - Client service level compliance</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export SLA Report</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Avg SLA Score",   value: `${clients.length > 0 ? Math.round(clients.reduce((s, c) => s + c.overallScore, 0) / clients.length) : 0}%`, color: "var(--accent)", sub: "Across all clients"    },
          { label: "Clients At Risk", value: atRisk.toString(),                                                                                            color: atRisk > 0 ? "var(--red)" : "var(--accent)",  sub: "Score < 70%"         },
          { label: "Breaches (30d)",  value: totalBreaches.toString(),                                                                                     color: totalBreaches > 5 ? "var(--red)" : "var(--amber)", sub: "Across all SLAs" },
          { label: "SLA Compliance",  value: `${Math.max(0, Math.round((1 - totalBreaches / Math.max(clients.length * 5, 1)) * 100))}%`,                  color: "var(--blue)",   sub: "~5 SLA events per client" },
        ].map(s => (
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
          {clients.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateTitle")}>No SLA records</div>
              <p className={cx("emptyStateSub")}>SLA records logged for clients will appear here.</p>
            </div>
          ) : [...clients].sort((a, b) => a.overallScore - b.overallScore).map(c => {
            const scoreColor = c.overallScore >= 85 ? "var(--accent)" : c.overallScore >= 65 ? "var(--amber)" : "var(--red)";
            const totalBreachesClient = Object.values(c.slaData)
              .filter((m): m is SlaPoint => Boolean(m))
              .reduce((s, m) => s + m.breaches30d, 0);
            return (
              <div key={c.name} className={cx("card", "p24", c.overallScore < 70 && "slaRiskCard")}>
                <div className={cx("slaScoreGrid", "slaScoreAligned", "gap20")}>
                  <div>
                    <div className={cx("fw700", "slaClientName", "slaToneText", toneClass(c.color))}>{c.name}</div>
                    <div className={cx("text11", "colorMuted")}>{c.tier} tier — {c.am}</div>
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
                    <span className={cx("text14")}>{c.trend === "improving" ? "▲" : c.trend === "declining" ? "▼" : "→"}</span>
                    <span className={cx("text11", "slaToneText", toneClass(c.trend === "improving" ? "var(--accent)" : c.trend === "declining" ? "var(--red)" : "var(--muted)"))}>{c.trend}</span>
                  </div>
                  {c.overallScore < 70 ? (
                    <button type="button" className={cx("btnSm", "slaActionBtn")}>Action Required</button>
                  ) : (
                    <button type="button" className={cx("btnSm", "btnGhost")}>View Detail</button>
                  )}
                </div>
                <div className={cx("slaMetricGrid", "gap10", "mt16")}>
                  {slaMetrics.map(m => {
                    const data        = c.slaData[m.key];
                    const val         = m.divisor ? (data.avg / m.divisor).toFixed(1) : data.avg.toFixed(1);
                    const overTarget  = data.avg > 0 && data.avg > m.targetHrs;
                    return (
                      <div key={m.key} className={cx("bgBg", "textCenter", "p12", "slaCellRadius")}>
                        <div className={cx("fontMono", "fw700", "slaMetricValue", "slaToneText", toneClass(overTarget ? "var(--red)" : data.avg > 0 ? "var(--accent)" : "var(--muted)"))}>{data.avg > 0 ? `${val}${m.unit}` : "—"}</div>
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
            {clients.map(c => (
              <span key={c.name} className={cx("textCenter", "slaToneText", toneClass(c.color))}>{c.name.split(" ")[0]}</span>
            ))}
          </div>
          {slaMetrics.map((m, ri) => (
            <div key={m.key} className={cx("slaMatrixGrid", "gap8", "slaMatrixRow", ri < slaMetrics.length - 1 && "borderB")}>
              <div>
                <div className={cx("text12", "fw600")}>{m.name}</div>
                <div className={cx("text10", "colorMuted")}>Target: {m.targetHrs}{m.unit}</div>
              </div>
              {clients.map(c => {
                const data  = c.slaData[m.key];
                const ok    = data.avg === 0 || data.avg <= m.targetHrs;
                const val   = m.divisor ? (data.avg / m.divisor).toFixed(1) : data.avg.toFixed(1);
                return (
                  <div key={c.name} className={cx("textCenter", "p12", "slaCellRadius", data.avg === 0 ? "" : ok ? "slaMatrixCellOk" : "slaMatrixCellFail")}>
                    <div className={cx("fontMono", "fw700", "text14", "slaToneText", toneClass(data.avg === 0 ? "var(--muted)" : ok ? "var(--accent)" : "var(--red)"))}>
                      {data.avg > 0 ? `${val}${m.unit}` : "—"}
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
            .flatMap(c =>
              slaMetrics
                .map(m => {
                  const data = c.slaData[m.key];
                  if (data.breaches30d === 0) return null;
                  return {
                    client: c.name, clientColor: c.color, am: c.am,
                    metric: m.name, breaches: data.breaches30d,
                    lastBreached: data.lastBreached, avg: data.avg,
                    target: m.targetHrs, unit: m.unit,
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
                  <div className={cx("fontMono", "colorRed", "fw700")}>{breach.avg.toFixed(1)}{breach.unit}</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb3")}>Target</div>
                  <div className={cx("fontMono", "colorAccent")}>{breach.target}{breach.unit}</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb3")}>Last Breach</div>
                  <div className={cx("fontMono", "text12")}>{breach.lastBreached ?? "—"}</div>
                </div>
                <div className={cx("textCenter", "p12", "slaCellRadius", "slaBreachBadge")}>
                  <div className={cx("fontMono", "colorRed", "fw800")}>{breach.breaches}</div>
                  <div className={cx("colorRed", "slaTiny9")}>breaches</div>
                </div>
              </div>
            ))}
          {clients.every(c => Object.values(c.slaData).filter((m): m is SlaPoint => Boolean(m)).every(m => m.breaches30d === 0)) && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateTitle")}>No breaches in last 30 days</div>
              <p className={cx("emptyStateSub")}>All SLA metrics are currently within target.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "sla definitions" && (
        <div className={cx("flexCol", "gap12")}>
          {slaDefinitions.map(sla => (
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
        </div>
      )}
    </div>
  );
}
