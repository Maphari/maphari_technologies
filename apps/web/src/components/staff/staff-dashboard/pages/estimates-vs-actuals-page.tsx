"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type ClientRow = { id: number; name: string; avatar: string; color: string };
type MilestoneStatus = "delivered" | "in_progress";
type MilestoneCategory = "Design" | "Strategy" | "Comms" | "Admin";
type Milestone = {
  id: number;
  clientId: number;
  title: string;
  category: MilestoneCategory;
  estimated: number;
  actual: number;
  status: MilestoneStatus;
};

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00" }
];

const milestones: Milestone[] = [
  { id: 1, clientId: 1, title: "Logo & Visual Direction", category: "Design", estimated: 12, actual: 14.5, status: "delivered" },
  { id: 2, clientId: 1, title: "Brand Colour System", category: "Design", estimated: 4, actual: 3.5, status: "delivered" },
  { id: 3, clientId: 1, title: "Typography Pairing", category: "Design", estimated: 3, actual: 2, status: "delivered" },
  { id: 4, clientId: 2, title: "Audience Segmentation", category: "Strategy", estimated: 6, actual: 8, status: "delivered" },
  { id: 5, clientId: 2, title: "Campaign Strategy Deck", category: "Strategy", estimated: 8, actual: 11, status: "delivered" },
  { id: 6, clientId: 3, title: "UX Audit", category: "Design", estimated: 5, actual: 4.5, status: "delivered" },
  { id: 7, clientId: 3, title: "Mobile Wireframes", category: "Design", estimated: 10, actual: 13, status: "delivered" },
  { id: 8, clientId: 4, title: "Type & Grid System", category: "Design", estimated: 8, actual: 7, status: "delivered" },
  { id: 9, clientId: 5, title: "Data Visualisation Suite", category: "Design", estimated: 10, actual: 9.5, status: "delivered" },
  { id: 10, clientId: 5, title: "Annual Report Layout", category: "Design", estimated: 14, actual: 16, status: "in_progress" },
  { id: 11, clientId: 1, title: "Brand Guidelines Doc", category: "Design", estimated: 8, actual: 5, status: "in_progress" },
  { id: 12, clientId: 2, title: "LinkedIn Channel Brief", category: "Strategy", estimated: 4, actual: 3, status: "in_progress" }
];

const weeklyData = [
  { week: "Jan W1", estimated: 28, actual: 31 },
  { week: "Jan W2", estimated: 32, actual: 29 },
  { week: "Jan W3", estimated: 30, actual: 34 },
  { week: "Jan W4", estimated: 26, actual: 28 },
  { week: "Feb W1", estimated: 34, actual: 38 },
  { week: "Feb W2", estimated: 30, actual: 33 },
  { week: "Feb W3", estimated: 28, actual: 31 }
];

const categoryData = [
  { name: "Design", estimated: 74, actual: 79.5 },
  { name: "Strategy", estimated: 18, actual: 22 },
  { name: "Comms", estimated: 8, actual: 6 },
  { name: "Admin", estimated: 10, actual: 12 }
] as const;

function variance(estimated: number, actual: number) {
  return actual - estimated;
}
function variancePct(estimated: number, actual: number) {
  return Math.round(((actual - estimated) / estimated) * 100);
}
function varColor(v: number) {
  return v > 2 ? "#ff4444" : v > 0 ? "#f5c518" : "var(--accent)";
}

export function EstimatesVsActualsPage({ isActive }: { isActive: boolean }) {
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [tab, setTab] = useState<"milestones" | "weekly" | "category">("milestones");
  const [sort, setSort] = useState<"variance" | "client" | "estimated">("variance");

  const filtered = milestones.filter((milestone) => clientFilter === "all" || milestone.clientId === Number(clientFilter));
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "variance") return Math.abs(variance(b.estimated, b.actual)) - Math.abs(variance(a.estimated, a.actual));
    if (sort === "client") return a.clientId - b.clientId;
    return b.estimated - a.estimated;
  });

  const totalEst = filtered.reduce((sum, milestone) => sum + milestone.estimated, 0);
  const totalAct = filtered.reduce((sum, milestone) => sum + milestone.actual, 0);
  const totalVar = totalAct - totalEst;
  const accuracy = totalEst === 0 ? 100 : Math.max(0, Math.round((1 - Math.abs(totalVar) / totalEst) * 100));
  const overCount = filtered.filter((milestone) => variance(milestone.estimated, milestone.actual) > 0).length;
  const underCount = filtered.filter((milestone) => variance(milestone.estimated, milestone.actual) < 0).length;

  const weeklyMax = Math.max(...weeklyData.flatMap((row) => [row.estimated, row.actual]));
  const categoryMax = Math.max(...categoryData.flatMap((row) => [row.estimated, row.actual]));

  const pointsEstimated = useMemo(() => {
    const xStep = 100 / (weeklyData.length - 1);
    return weeklyData.map((row, i) => `${i * xStep},${100 - (row.estimated / weeklyMax) * 100}`).join(" ");
  }, [weeklyMax]);
  const pointsActual = useMemo(() => {
    const xStep = 100 / (weeklyData.length - 1);
    return weeklyData.map((row, i) => `${i * xStep},${100 - (row.actual / weeklyMax) * 100}`).join(" ");
  }, [weeklyMax]);

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-estimates-vs-actuals">
      <style>{`
        .eva-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .eva-tab-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .eva-sort-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .eva-sort-btn:hover { color: #a0a0b0 !important; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Performance
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Estimates vs Actuals
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Accuracy", value: `${accuracy}%`, color: accuracy >= 85 ? "var(--accent)" : accuracy >= 70 ? "#f5c518" : "#ff4444" },
              { label: "Over budget", value: overCount, color: overCount > 0 ? "#ff4444" : "var(--muted2)" },
              { label: "Under budget", value: underCount, color: underCount > 0 ? "var(--accent)" : "var(--muted2)" },
              { label: "Total variance", value: `${totalVar > 0 ? "+" : ""}${Math.round(totalVar * 10) / 10}h`, color: varColor(totalVar) }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>
            {[
              { k: "milestones" as const, l: "By milestone" },
              { k: "weekly" as const, l: "Weekly trend" },
              { k: "category" as const, l: "By category" }
            ].map((tabItem) => (
              <button key={tabItem.k} className="eva-tab-btn" onClick={() => setTab(tabItem.k)} style={{ padding: "10px 20px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", background: "transparent", color: tab === tabItem.k ? "var(--accent)" : "var(--muted2)", borderBottom: `2px solid ${tab === tabItem.k ? "var(--accent)" : "transparent"}`, marginBottom: -1 }}>
                {tabItem.l}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, paddingBottom: 10 }}>
            <button className="eva-filter-btn" onClick={() => setClientFilter("all")} style={{ padding: "5px 12px", fontSize: 10, borderRadius: 2, background: clientFilter === "all" ? "var(--accent)" : "rgba(255,255,255,0.04)", color: clientFilter === "all" ? "#050508" : "var(--muted2)" }}>
              All
            </button>
            {clients.map((client) => (
              <button key={client.id} className="eva-filter-btn" onClick={() => setClientFilter(clientFilter === String(client.id) ? "all" : String(client.id))} style={{ padding: "5px 12px", fontSize: 10, borderRadius: 2, background: clientFilter === String(client.id) ? `${client.color}20` : "rgba(255,255,255,0.04)", color: clientFilter === String(client.id) ? client.color : "var(--muted2)", border: `1px solid ${clientFilter === String(client.id) ? `${client.color}40` : "transparent"}` }}>
                {client.avatar}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 0" }}>
        {tab === "milestones" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>
            <div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.08em" }}>SORT</span>
                {[
                  { k: "variance" as const, l: "Biggest variance" },
                  { k: "estimated" as const, l: "Largest job" },
                  { k: "client" as const, l: "By client" }
                ].map((item) => (
                  <button key={item.k} className="eva-sort-btn" onClick={() => setSort(item.k)} style={{ fontSize: 10, background: "transparent", color: sort === item.k ? "var(--text)" : "var(--muted2)", borderBottom: `1px solid ${sort === item.k ? "var(--accent)" : "transparent"}`, paddingBottom: 1 }}>
                    {item.l}
                  </button>
                ))}
              </div>

              {sorted.map((milestone) => {
                const v = variance(milestone.estimated, milestone.actual);
                const vPct = variancePct(milestone.estimated, milestone.actual);
                const client = clients.find((entry) => entry.id === milestone.clientId);
                const maxHours = Math.max(milestone.estimated, milestone.actual);
                return (
                  <div key={milestone.id} style={{ marginBottom: 14, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 3 }}>{milestone.title}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ fontSize: 10, color: client?.color }}>{client?.name}</span>
                          <span style={{ fontSize: 10, color: "var(--muted2)" }}>{milestone.category}</span>
                          {milestone.status === "in_progress" ? <span style={{ fontSize: 9, color: "#60a5fa", padding: "1px 5px", background: "rgba(96,165,250,0.1)", borderRadius: 2 }}>In progress</span> : null}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: varColor(v) }}>{v > 0 ? "+" : ""}{Math.round(v * 10) / 10}h</div>
                        <div style={{ fontSize: 10, color: varColor(v) }}>{vPct > 0 ? "+" : ""}{vPct}%</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {[
                        { label: "Est", value: milestone.estimated, color: "rgba(255,255,255,0.15)" },
                        { label: "Act", value: milestone.actual, color: varColor(v) }
                      ].map((bar) => (
                        <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 9, color: "var(--muted2)", width: 22, flexShrink: 0 }}>{bar.label}</span>
                          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3 }}>
                            <div style={{ height: "100%", width: `${(bar.value / (maxHours * 1.2)) * 100}%`, background: bar.color, borderRadius: 3, transition: "width 0.4s ease" }} />
                          </div>
                          <span style={{ fontSize: 10, color: "#a0a0b0", width: 32, textAlign: "right", flexShrink: 0 }}>{bar.value}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Portfolio summary</div>
                {[
                  { label: "Total estimated", value: `${totalEst}h`, color: "#a0a0b0" },
                  { label: "Total actual", value: `${Math.round(totalAct * 10) / 10}h`, color: "#a0a0b0" },
                  { label: "Net variance", value: `${totalVar > 0 ? "+" : ""}${Math.round(totalVar * 10) / 10}h`, color: varColor(totalVar) },
                  { label: "Estimate accuracy", value: `${accuracy}%`, color: accuracy >= 85 ? "var(--accent)" : "#f5c518" }
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 11, color: "var(--muted2)" }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: row.color, fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>By client</div>
                {clients.filter((client) => filtered.some((milestone) => milestone.clientId === client.id)).map((client) => {
                  const clientMilestones = filtered.filter((milestone) => milestone.clientId === client.id);
                  const clientEst = clientMilestones.reduce((sum, milestone) => sum + milestone.estimated, 0);
                  const clientAct = clientMilestones.reduce((sum, milestone) => sum + milestone.actual, 0);
                  const clientVar = clientAct - clientEst;
                  return (
                    <div key={client.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: 10, color: client.color, width: 80, flexShrink: 0 }}>{client.name.split(" ")[0]}</span>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${Math.min((clientAct / clientEst) * 100, 150)}%`, background: varColor(clientVar), borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, color: varColor(clientVar), width: 36, textAlign: "right", flexShrink: 0 }}>{clientVar > 0 ? "+" : ""}{Math.round(clientVar * 10) / 10}h</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "weekly" ? (
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 20 }}>Estimated vs actual hours logged per week - last 7 weeks</div>
            <div style={{ height: 280, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)", padding: 16 }}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                <polyline fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.8" points={pointsEstimated} />
                <polyline fill="none" stroke="var(--accent)" strokeWidth="1.8" points={pointsActual} />
                {weeklyData.map((row, i) => {
                  const xStep = 100 / (weeklyData.length - 1);
                  const x = i * xStep;
                  const y = 100 - (row.actual / weeklyMax) * 100;
                  return <circle key={row.week} cx={x} cy={y} r="1.5" fill="var(--accent)" />;
                })}
              </svg>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${String(weeklyData.length)}, 1fr)`, gap: 8, marginTop: 10 }}>
              {weeklyData.map((row) => (
                <div key={row.week} style={{ fontSize: 10, color: "var(--muted2)", textAlign: "center" }}>
                  {row.week}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "category" ? (
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 20 }}>Estimated vs actual hours by work category - all time</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {categoryData.map((category) => {
                const v = category.actual - category.estimated;
                return (
                  <div key={category.name} style={{ padding: "12px 14px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text)", width: 80 }}>{category.name}</span>
                      <span style={{ fontSize: 11, color: "var(--muted2)" }}>Est {category.estimated}h</span>
                      <span style={{ fontSize: 11, color: "var(--muted2)" }}>Act {category.actual}h</span>
                      <span style={{ fontSize: 12, color: varColor(v), marginLeft: "auto", fontWeight: 500 }}>
                        {v > 0 ? "+" : ""}
                        {Math.round(v * 10) / 10}h ({variancePct(category.estimated, category.actual) > 0 ? "+" : ""}
                        {variancePct(category.estimated, category.actual)}%)
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, color: "var(--muted2)", marginBottom: 4 }}>Estimated</div>
                        <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 3 }}>
                          <div style={{ width: `${(category.estimated / categoryMax) * 100}%`, height: "100%", background: "rgba(255,255,255,0.18)", borderRadius: 3 }} />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, color: "var(--muted2)", marginBottom: 4 }}>Actual</div>
                        <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 3 }}>
                          <div style={{ width: `${(category.actual / categoryMax) * 100}%`, height: "100%", background: varColor(v), borderRadius: 3 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
