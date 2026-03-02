"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type ClientRow = { id: number; name: string; avatar: string };
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
  { id: 1, name: "Volta Studios", avatar: "VS" },
  { id: 2, name: "Kestrel Capital", avatar: "KC" },
  { id: 3, name: "Mira Health", avatar: "MH" },
  { id: 4, name: "Dune Collective", avatar: "DC" },
  { id: 5, name: "Okafor & Sons", avatar: "OS" }
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

function varianceToneClass(value: number) {
  if (value > 2) return "evaToneBad";
  if (value > 0) return "evaToneWarn";
  return "evaToneGood";
}

function accuracyToneClass(value: number) {
  if (value >= 85) return "evaToneGood";
  if (value >= 70) return "evaToneWarn";
  return "evaToneBad";
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
    return weeklyData.map((row, index) => `${index * xStep},${100 - (row.estimated / weeklyMax) * 100}`).join(" ");
  }, [weeklyMax]);

  const pointsActual = useMemo(() => {
    const xStep = 100 / (weeklyData.length - 1);
    return weeklyData.map((row, index) => `${index * xStep},${100 - (row.actual / weeklyMax) * 100}`).join(" ");
  }, [weeklyMax]);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-estimates-vs-actuals">
      <div className={cx("pageHeaderBar")}> 
        <div className={cx("flexBetween", "mb20", "evaHeaderTop")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Performance</div>
            <h1 className={cx("pageTitleText")}>Estimates vs Actuals</h1>
          </div>

          <div className={cx("evaTopStats")}>
            {[
              { label: "Accuracy", value: `${accuracy}%`, toneClass: accuracyToneClass(accuracy) },
              { label: "Over budget", value: overCount, toneClass: overCount > 0 ? "evaToneBad" : "evaToneMuted" },
              { label: "Under budget", value: underCount, toneClass: underCount > 0 ? "evaToneGood" : "evaToneMuted" },
              {
                label: "Total variance",
                value: `${totalVar > 0 ? "+" : ""}${Math.round(totalVar * 10) / 10}h`,
                toneClass: varianceToneClass(totalVar)
              }
            ].map((stat) => (
              <div key={stat.label} className={cx("snStatCard")}>
                <div className={cx("statLabelNew")}>{stat.label}</div>
                <div className={cx("statValueNew", stat.toneClass)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("flexBetween", "evaTabsRow")}> 
          <div className={cx("flexRow", "evaTabStrip")}> 
            {[
              { key: "milestones" as const, label: "By milestone" },
              { key: "weekly" as const, label: "Weekly trend" },
              { key: "category" as const, label: "By category" }
            ].map((tabItem) => (
              <button
                key={tabItem.key}
                type="button"
                className={cx("evaTabBtn", tab === tabItem.key && "evaTabBtnActive")}
                onClick={() => setTab(tabItem.key)}
              >
                {tabItem.label}
              </button>
            ))}
          </div>

          <div className={cx("evaClientFilters", "filterRow")}> 
            <select
              className={cx("filterSelect")}
              aria-label="Filter client"
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
            >
              <option value="all">All clients</option>
              {clients.map((client) => (
                <option key={client.id} value={String(client.id)}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={cx("evaContent")}> 
        {tab === "milestones" ? (
          <div className={cx("evaLayout")}> 
            <div>
              <div className={cx("evaSortRow")}> 
                <span className={cx("evaSortLabel")}>Sort</span>
                <select
                  className={cx("filterSelect")}
                  aria-label="Sort milestones"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as "variance" | "estimated" | "client")}
                >
                  <option value="variance">Biggest variance</option>
                  <option value="estimated">Largest job</option>
                  <option value="client">By client</option>
                </select>
              </div>

              {sorted.map((milestone) => {
                const varianceHours = variance(milestone.estimated, milestone.actual);
                const variancePercent = variancePct(milestone.estimated, milestone.actual);
                const toneClass = varianceToneClass(varianceHours);
                const maxHours = Math.max(milestone.estimated, milestone.actual);
                const client = clients.find((entry) => entry.id === milestone.clientId);

                return (
                  <div key={milestone.id} className={cx("cardSurface", "mb14")}> 
                    <div className={cx("flexBetween", "mb10", "evaMilestoneHead")}> 
                      <div>
                        <div className={cx("text13", "colorText", "mb4")}>{milestone.title}</div>
                        <div className={cx("evaMilestoneMeta")}> 
                          <span className={cx("text10", "evaClientLabel")} data-client-id={String(milestone.clientId)}>
                            {client?.name ?? "Unknown"}
                          </span>
                          <span className={cx("text10", "colorMuted2")}>{milestone.category}</span>
                          {milestone.status === "in_progress" ? <span className={cx("evaStatusChip")}>In progress</span> : null}
                        </div>
                      </div>

                      <div className={cx("textRight")}> 
                        <div className={cx("text14", "fw600", toneClass)}>
                          {varianceHours > 0 ? "+" : ""}
                          {Math.round(varianceHours * 10) / 10}h
                        </div>
                        <div className={cx("text10", toneClass)}>
                          {variancePercent > 0 ? "+" : ""}
                          {variancePercent}%
                        </div>
                      </div>
                    </div>

                    <div className={cx("flexCol", "gap6")}> 
                      {[
                        { label: "Est", value: milestone.estimated, toneClass: "evaHoursProgressEstimated" },
                        { label: "Act", value: milestone.actual, toneClass }
                      ].map((bar) => (
                        <div key={bar.label} className={cx("evaHoursRow")}> 
                          <span className={cx("text10", "colorMuted2", "noShrink", "evaHoursLabel")}>{bar.label}</span>
                          <progress className={cx("evaHoursProgress", bar.toneClass)} max={maxHours * 1.2} value={bar.value} />
                          <span className={cx("text10", "colorMuted", "noShrink", "textRight", "evaHoursValue")}>{bar.value}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={cx("flexCol", "gap16")}> 
              <div className={cx("cardSurface")}> 
                <div className={cx("sectionLabel", "mb12")}>Portfolio summary</div>
                {[
                  { label: "Total estimated", value: `${totalEst}h`, toneClass: "evaToneMuted" },
                  { label: "Total actual", value: `${Math.round(totalAct * 10) / 10}h`, toneClass: "evaToneMuted" },
                  {
                    label: "Net variance",
                    value: `${totalVar > 0 ? "+" : ""}${Math.round(totalVar * 10) / 10}h`,
                    toneClass: varianceToneClass(totalVar)
                  },
                  { label: "Estimate accuracy", value: `${accuracy}%`, toneClass: accuracyToneClass(accuracy) }
                ].map((row) => (
                  <div key={row.label} className={cx("dividerRow")}> 
                    <span className={cx("text11", "colorMuted2")}>{row.label}</span>
                    <span className={cx("text12", "fw600", row.toneClass)}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className={cx("cardSurface")}> 
                <div className={cx("sectionLabel", "mb12")}>By client</div>
                {clients
                  .filter((client) => filtered.some((milestone) => milestone.clientId === client.id))
                  .map((client) => {
                    const clientMilestones = filtered.filter((milestone) => milestone.clientId === client.id);
                    const clientEst = clientMilestones.reduce((sum, milestone) => sum + milestone.estimated, 0);
                    const clientAct = clientMilestones.reduce((sum, milestone) => sum + milestone.actual, 0);
                    const clientVar = clientAct - clientEst;
                    const ratio = clientEst > 0 ? Math.min((clientAct / clientEst) * 100, 150) : 0;
                    const toneClass = varianceToneClass(clientVar);

                    return (
                      <div key={client.id} className={cx("evaClientSummaryRow")}> 
                        <span className={cx("text10", "noShrink", "evaClientLabel", "evaClientLabelShort")} data-client-id={String(client.id)}>
                          {client.name.split(" ")[0]}
                        </span>
                        <progress className={cx("evaClientProgress", toneClass)} max={150} value={ratio} />
                        <span className={cx("text10", "noShrink", "textRight", "evaClientDelta", toneClass)}>
                          {clientVar > 0 ? "+" : ""}
                          {Math.round(clientVar * 10) / 10}h
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "weekly" ? (
          <div className={cx("evaWeeklyChart")}> 
            <div className={cx("text12", "colorMuted2", "mb20")}>Estimated vs actual hours logged per week - last 7 weeks</div>
            <div className={cx("cardSurface", "p16", "evaWeeklyCard")}> 
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cx("evaWeeklySvg")}> 
                <polyline fill="none" stroke="color-mix(in srgb, var(--text) 20%, transparent)" strokeWidth="1.8" points={pointsEstimated} />
                <polyline fill="none" stroke="var(--accent)" strokeWidth="1.8" points={pointsActual} />
                {weeklyData.map((row, index) => {
                  const xStep = 100 / (weeklyData.length - 1);
                  const x = index * xStep;
                  const y = 100 - (row.actual / weeklyMax) * 100;
                  return <circle key={row.week} cx={x} cy={y} r="1.5" fill="var(--accent)" />;
                })}
              </svg>
            </div>

            <div className={cx("evaWeekLabels")}> 
              {weeklyData.map((row) => (
                <div key={row.week} className={cx("text10", "colorMuted2", "textCenter", "evaWeekLabel")}> 
                  {row.week}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "category" ? (
          <div className={cx("evaCategoryView")}> 
            <div className={cx("text12", "colorMuted2", "mb20")}>Estimated vs actual hours by work category - all time</div>
            <div className={cx("flexCol", "gap10")}> 
              {categoryData.map((category) => {
                const varianceHours = category.actual - category.estimated;
                const variancePercent = variancePct(category.estimated, category.actual);
                const toneClass = varianceToneClass(varianceHours);

                return (
                  <div key={category.name} className={cx("cardSurface")}> 
                    <div className={cx("flexRow", "gap14", "mb8", "evaCategoryTop")}> 
                      <span className={cx("text12", "colorText", "evaCategoryName")}>{category.name}</span>
                      <span className={cx("text11", "colorMuted2")}>Est {category.estimated}h</span>
                      <span className={cx("text11", "colorMuted2")}>Act {category.actual}h</span>
                      <span className={cx("text12", "fw600", "evaMlAuto", toneClass)}>
                        {varianceHours > 0 ? "+" : ""}
                        {Math.round(varianceHours * 10) / 10}h ({variancePercent > 0 ? "+" : ""}
                        {variancePercent}%)
                      </span>
                    </div>

                    <div className={cx("flexRow", "gap10")}> 
                      <div className={cx("flex1")}> 
                        <div className={cx("text10", "colorMuted2", "mb4", "evaMiniLabel")}>Estimated</div>
                        <progress className={cx("evaCategoryProgress", "evaHoursProgressEstimated")} max={categoryMax} value={category.estimated} />
                      </div>

                      <div className={cx("flex1")}> 
                        <div className={cx("text10", "colorMuted2", "mb4", "evaMiniLabel")}>Actual</div>
                        <progress className={cx("evaCategoryProgress", toneClass)} max={categoryMax} value={category.actual} />
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
