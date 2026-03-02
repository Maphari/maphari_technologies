"use client";

import { useState } from "react";
import { cx } from "../style";

type RetainerStatus = "healthy" | "moderate" | "critical" | "exceeded";

type RetainerTask = {
  name: string;
  hours: number;
  category: "Design" | "Strategy" | "Research" | "Admin" | "Production";
};

type RetainerRecord = {
  id: number;
  client: string;
  avatar: string;
  project: string;
  status: RetainerStatus;
  retainerHours: number;
  hoursUsed: number;
  retainerValue: number;
  billingCycle: string;
  cycleStart: string;
  cycleEnd: string;
  daysLeft: number;
  hourlyRate: number;
  overage: number;
  tasks: RetainerTask[];
  burnHistory: number[];
  alert: string | null;
};

const retainers: RetainerRecord[] = [
  {
    id: 1,
    client: "Volta Studios",
    avatar: "VS",
    project: "Brand Identity System",
    status: "healthy",
    retainerHours: 80,
    hoursUsed: 49.5,
    retainerValue: 28000,
    billingCycle: "Monthly",
    cycleStart: "Feb 1",
    cycleEnd: "Feb 28",
    daysLeft: 6,
    hourlyRate: 350,
    overage: 0,
    tasks: [
      { name: "Logo & Visual Direction", hours: 18, category: "Design" },
      { name: "Brand Guidelines Doc", hours: 12.5, category: "Design" },
      { name: "Client Communication", hours: 7, category: "Admin" },
      { name: "Asset Exports", hours: 5, category: "Production" },
      { name: "Internal Review", hours: 7, category: "Admin" }
    ],
    burnHistory: [62, 55, 49, 61, 58, 62],
    alert: null
  },
  {
    id: 2,
    client: "Kestrel Capital",
    avatar: "KC",
    project: "Q1 Campaign Strategy",
    status: "critical",
    retainerHours: 60,
    hoursUsed: 58.5,
    retainerValue: 21000,
    billingCycle: "Monthly",
    cycleStart: "Feb 1",
    cycleEnd: "Feb 28",
    daysLeft: 6,
    hourlyRate: 350,
    overage: 0,
    tasks: [
      { name: "Strategy Deck", hours: 22, category: "Strategy" },
      { name: "Audience Research", hours: 14, category: "Research" },
      { name: "Content Calendar", hours: 11, category: "Strategy" },
      { name: "Client Calls & Admin", hours: 8, category: "Admin" },
      { name: "Revision Rounds", hours: 3.5, category: "Design" }
    ],
    burnHistory: [80, 75, 90, 97, 95, 97],
    alert: "97.5% burned - 1.5 hours remaining. Flag for scope review."
  },
  {
    id: 3,
    client: "Mira Health",
    avatar: "MH",
    project: "Website Redesign",
    status: "moderate",
    retainerHours: 100,
    hoursUsed: 61,
    retainerValue: 35000,
    billingCycle: "Monthly",
    cycleStart: "Feb 1",
    cycleEnd: "Feb 28",
    daysLeft: 6,
    hourlyRate: 350,
    overage: 0,
    tasks: [
      { name: "UX Wireframes - Mobile", hours: 24, category: "Design" },
      { name: "Component Library", hours: 18, category: "Design" },
      { name: "UX Research", hours: 10, category: "Research" },
      { name: "Client Workshops", hours: 6, category: "Admin" },
      { name: "Revision Rounds", hours: 3, category: "Design" }
    ],
    burnHistory: [48, 52, 55, 58, 60, 61],
    alert: null
  },
  {
    id: 4,
    client: "Dune Collective",
    avatar: "DC",
    project: "Editorial Design System",
    status: "exceeded",
    retainerHours: 50,
    hoursUsed: 56,
    retainerValue: 17500,
    billingCycle: "Monthly",
    cycleStart: "Feb 1",
    cycleEnd: "Feb 28",
    daysLeft: 6,
    hourlyRate: 350,
    overage: 6,
    tasks: [
      { name: "Type & Grid System", hours: 20, category: "Design" },
      { name: "Component Docs", hours: 16, category: "Design" },
      { name: "Revision Rounds", hours: 12, category: "Design" },
      { name: "Client Comms", hours: 8, category: "Admin" }
    ],
    burnHistory: [70, 80, 90, 100, 108, 112],
    alert: "Retainer exceeded by 6 hours - R2,100 in unbilled work. Raise with admin."
  },
  {
    id: 5,
    client: "Okafor & Sons",
    avatar: "OS",
    project: "Annual Report 2025",
    status: "healthy",
    retainerHours: 40,
    hoursUsed: 13.5,
    retainerValue: 14000,
    billingCycle: "Monthly",
    cycleStart: "Feb 1",
    cycleEnd: "Feb 28",
    daysLeft: 6,
    hourlyRate: 350,
    overage: 0,
    tasks: [
      { name: "Data Visualisation", hours: 8, category: "Design" },
      { name: "Layout & Typesetting", hours: 3, category: "Design" },
      { name: "Client Review Session", hours: 1.5, category: "Admin" },
      { name: "Asset Prep", hours: 1, category: "Production" }
    ],
    burnHistory: [20, 22, 28, 30, 33, 33],
    alert: null
  }
];

function statusClass(status: RetainerStatus) {
  if (status === "healthy") return "rbStatusHealthy";
  if (status === "moderate") return "rbStatusModerate";
  if (status === "critical") return "rbStatusCritical";
  return "rbStatusExceeded";
}

function statusMeterClass(status: RetainerStatus) {
  if (status === "healthy") return "rbMeterHealthy";
  if (status === "moderate") return "rbMeterModerate";
  if (status === "critical") return "rbMeterCritical";
  return "rbMeterExceeded";
}

function statusStroke(status: RetainerStatus) {
  if (status === "healthy") return "var(--accent)";
  if (status === "moderate") return "var(--amber)";
  if (status === "critical") return "var(--amber)";
  return "var(--red)";
}

function categoryClass(category: RetainerTask["category"]) {
  if (category === "Design") return "rbCatDesign";
  if (category === "Strategy") return "rbCatStrategy";
  if (category === "Research") return "rbCatResearch";
  if (category === "Production") return "rbCatProduction";
  return "rbCatAdmin";
}

function actionToneClass(index: number) {
  if (index === 0) return "rbActionPrimary";
  if (index === 1) return "rbActionWarn";
  return "rbActionNeutral";
}

function BurnBar({ used, total, status, compact = false }: { used: number; total: number; status: RetainerStatus; compact?: boolean }) {
  const pct = Math.min((used / total) * 100, 100);
  const over = used > total;
  return (
    <div className={cx("rbBurnBarTrack", compact ? "rbBurnBarTrackSm" : "rbBurnBarTrackLg")}>
      <progress className={cx("progressMeter", "rbBurnProgress", compact ? "rbBurnProgressSm" : "rbBurnProgressLg", statusMeterClass(status))} max={100} value={pct} />
      {over ? <div className={cx("rbBurnOverDot", compact ? "rbBurnOverDotSm" : "rbBurnOverDotLg")} /> : null}
    </div>
  );
}

function MiniSparkline({ data, status }: { data: number[]; status: RetainerStatus }) {
  const max = Math.max(...data, 100);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 120;
      const y = 30 - (value / max) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  const stroke = statusStroke(status);

  return (
    <svg width="120" height="32" viewBox="0 0 120 32" className={cx("rbSparkline")}>
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * 120;
        const y = 30 - (value / max) * 28;
        return index === data.length - 1 ? <circle key={index} cx={x} cy={y} r="2.5" fill={stroke} /> : null;
      })}
    </svg>
  );
}

export function RetainerBurnPage({ isActive }: { isActive: boolean }) {
  const [selected, setSelected] = useState(retainers[0].id);

  const current = retainers.find((retainer) => retainer.id === selected) ?? retainers[0];
  const burnPct = Math.round((current.hoursUsed / current.retainerHours) * 100);
  const remaining = Math.max(current.retainerHours - current.hoursUsed, 0);
  const projectedTotal = current.hoursUsed + (current.hoursUsed / (30 - current.daysLeft)) * current.daysLeft;

  const r = 54;
  const circ = 2 * Math.PI * r;
  const usedDash = Math.min(burnPct / 100, 1) * circ;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-retainer-burn">
      <div className={cx("pageHeaderBar", "rbHeaderBar")}>
        <div className={cx("flexBetween", "mb20")}> 
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
            <h1 className={cx("pageTitleText")}>Retainer Burn</h1>
          </div>
          <div className={cx("rbTopStats")}>
            {[
              { label: "Cycle", value: "Feb 2026", className: "colorMuted" },
              { label: "Days left", value: "6", className: "colorAmber" },
              { label: "Exceeded", value: retainers.filter((retainer) => retainer.status === "exceeded").length, className: "colorRed" },
              { label: "Critical", value: retainers.filter((retainer) => retainer.status === "critical").length, className: "rbToneCritical" }
            ].map((summary) => (
              <div key={summary.label} className={cx("textRight")}>
                <div className={cx("statLabelNew")}>{summary.label}</div>
                <div className={cx("statValueNew", summary.className)}>{summary.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("rbClientTabs")}> 
          {retainers.map((retainer) => {
            const pct = Math.round((retainer.hoursUsed / retainer.retainerHours) * 100);
            const isCurrent = selected === retainer.id;
            return (
              <button type="button"
                key={retainer.id}
                className={cx("rbClientTab", "rbClientTabCard", isCurrent ? "rbClientTabActive" : "rbClientTabIdle", statusClass(retainer.status))}
                onClick={() => setSelected(retainer.id)}
              >
                <div className={cx("rbClientTabHead")}>
                  <div className={cx("rbTabDot", statusClass(retainer.status))} />
                  <span className={cx("rbClientTabName", isCurrent ? "colorText" : "colorMuted2")}>{retainer.client}</span>
                </div>
                <div className={cx("rbClientTabBarRow")}>
                  <progress className={cx("progressMeter", "rbClientTabProgress", statusMeterClass(retainer.status))} max={100} value={Math.min(pct, 100)} />
                  <span className={cx("text10", statusClass(retainer.status), "rbPctMin")}>{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={cx("rbLayout")}> 
        <div>
          {current.alert ? (
            <div className={cx("rbAlertBanner", current.status === "exceeded" ? "rbAlertExceeded" : "rbAlertCritical", "mb24")}>
              <span className={cx("text14")}>⚠</span>
              <span className={cx("text12", current.status === "exceeded" ? "colorRed" : "rbToneCritical")}>{current.alert}</span>
            </div>
          ) : null}

          <div className={cx("rbStatGrid", "mb28")}>
            {[
              { label: "Hours used", value: `${current.hoursUsed}`, unit: "h", className: statusClass(current.status) },
              { label: "Retainer total", value: `${current.retainerHours}`, unit: "h", className: "colorMuted" },
              {
                label: "Remaining",
                value: `${current.status === "exceeded" ? `-${current.overage}` : remaining}`,
                unit: "h",
                className: current.status === "exceeded" ? "colorRed" : "colorAccent"
              },
              {
                label: "Overage cost",
                value: current.overage > 0 ? `R${(current.overage * current.hourlyRate).toLocaleString()}` : "-",
                unit: "",
                className: current.overage > 0 ? "colorRed" : "colorMuted2"
              }
            ].map((stat) => (
              <div key={stat.label} className={cx("rbStatCard")}>
                <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
                <div className={cx("fontDisplay", "fw800", "text20", stat.className)}>
                  {stat.value}
                  <span className={cx("text12", "colorMuted2", "fontMono", "fw400")}>{stat.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={cx("mb28")}>
            <div className={cx("rbCycleHead")}>
              <div className={cx("sectionLabel")}>Cycle burn</div>
              <div className={cx("rbCycleMeta")}>
                <span className={cx("text11", "colorMuted2")}>{current.cycleStart}</span>
                <span className={cx("text11", "colorMuted2")}>→</span>
                <span className={cx("text11", "colorMuted2")}>{current.cycleEnd}</span>
                <span className={cx("text11", "fw600", statusClass(current.status))}>{burnPct}%</span>
              </div>
            </div>
            <BurnBar used={current.hoursUsed} total={current.retainerHours} status={current.status} />
            {current.status === "exceeded" ? (
              <div className={cx("text10", "colorRed", "mt6")}>
                Exceeded by {current.overage}h - R{(current.overage * current.hourlyRate).toLocaleString()} unbilled
              </div>
            ) : null}
          </div>

          <div>
            <div className={cx("sectionLabel", "mb14")}>Hours by Task</div>
            <div className={cx("flexCol")}>
              {[...current.tasks]
                .sort((left, right) => right.hours - left.hours)
                .map((task, index) => {
                  const pct = (task.hours / current.hoursUsed) * 100;
                  return (
                    <div key={index} className={cx("rbTaskRow", "rbTaskRowCard")}>
                      <div className={cx("rbTaskDot", categoryClass(task.category))} />
                      <div className={cx("flex1", "minW0")}>
                        <div className={cx("rbTaskHead")}>
                          <span className={cx("text12", "colorText")}>{task.name}</span>
                          <span className={cx("text11", "colorMuted")}>{task.hours}h</span>
                        </div>
                        <progress className={cx("progressMeter", "rbTaskProgress", categoryClass(task.category))} max={100} value={pct} />
                      </div>
                      <span className={cx("text10", categoryClass(task.category), "rbPctMin", "textRight")}>{Math.round(pct)}%</span>
                    </div>
                  );
                })}
            </div>

            <div className={cx("rbLegendRow")}> 
              {(["Design", "Strategy", "Research", "Admin", "Production"] as const).map((category) => (
                <div key={category} className={cx("rbLegendItem")}>
                  <div className={cx("rbCatDot", categoryClass(category))} />
                  <span className={cx("text10", "colorMuted2")}>{category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cx("rbSideCol")}>
          <div className={cx("rbOverviewCard")}>
            <div className={cx("sectionLabel", "mb16", "wFull")}>Burn overview</div>
            <svg width="132" height="132" viewBox="0 0 132 132" className={cx("rbDonut")}> 
              <circle cx="66" cy="66" r={r} fill="none" className={cx("rbDonutTrack")} strokeWidth="10" />
              <circle
                cx="66"
                cy="66"
                r={r}
                fill="none"
                stroke={statusStroke(current.status)}
                className={cx("rbDonutArc")}
                strokeWidth="10"
                strokeDasharray={`${usedDash} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 66 66)"
              />
              <text x="66" y="60" textAnchor="middle" fill={statusStroke(current.status)} className={cx("rbDonutPct")}>{burnPct}%</text>
              <text x="66" y="76" textAnchor="middle" className={cx("rbDonutLabel")}>burned</text>
            </svg>
            <div className={cx("wFull", "mt16")}>
              {[
                { label: "Used", value: `${current.hoursUsed}h`, className: statusClass(current.status) },
                { label: "Total", value: `${current.retainerHours}h`, className: "colorMuted2" },
                { label: "Value", value: `R${current.retainerValue.toLocaleString()}`, className: "colorMuted" },
                { label: "Cycle", value: current.billingCycle, className: "colorMuted" }
              ].map((row, index, arr) => (
                <div key={row.label} className={cx("rbOverviewRow", index === arr.length - 1 && "rbOverviewRowLast")}>
                  <span className={cx("text11", "colorMuted2")}>{row.label}</span>
                  <span className={cx("text11", row.className)}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={cx("rbDetailCard")}>
            <div className={cx("sectionLabel", "mb12")}>6-Month Trend</div>
            <MiniSparkline data={current.burnHistory} status={current.status} />
            <div className={cx("text10", "colorMuted2", "mt8")}>
              {current.burnHistory[current.burnHistory.length - 1] > current.burnHistory[0]
                ? "↑ Burn rate increasing - check scope creep"
                : "↓ Burn rate stable or decreasing"}
            </div>
          </div>

          <div className={cx("rbDetailCard")}>
            <div className={cx("sectionLabel", "mb12")}>End-of-cycle Projection</div>
            <div className={cx("fontDisplay", "fw800", "text24", projectedTotal > current.retainerHours ? "colorRed" : "colorAccent", "mb4")}>
              {Math.round(projectedTotal * 10) / 10}h
            </div>
            <div className={cx("text11", "colorMuted2")}>
              {projectedTotal > current.retainerHours
                ? `Will exceed by ~${Math.round((projectedTotal - current.retainerHours) * 10) / 10}h`
                : `~${Math.round((current.retainerHours - projectedTotal) * 10) / 10}h buffer remaining`}
            </div>
          </div>

          <div className={cx("rbActions")}> 
            <div className={cx("sectionLabel", "mb4")}>Actions</div>
            {["Request scope extension", "Flag to admin", "Export burn report"].map((label, index) => (
              <button key={label} className={cx("rbActionBtn", "rbActionBtnBase", actionToneClass(index))} type="button">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
