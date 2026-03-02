"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type WeeklyPoint = {
  week: string;
  hours: number;
  tasks: number;
  responseTime: number;
  score: number;
};

type Tone = "accent" | "purple" | "blue" | "amber" | "orange" | "muted";

type TaskTypePoint = {
  type: string;
  hours: number;
  tasks: number;
  tone: Tone;
};

type ClientPoint = {
  client: string;
  hours: number;
  tasks: number;
  tone: Tone;
};

type MilestonePoint = {
  name: string;
  client: string;
  status: "pending" | "revision" | "approved";
  deliveredOn: string;
  dueDate: string;
  onTime: boolean;
};

const weeklyData: WeeklyPoint[] = [
  { week: "Jan W1", hours: 38, tasks: 14, responseTime: 2.1, score: 78 },
  { week: "Jan W2", hours: 41, tasks: 17, responseTime: 1.8, score: 83 },
  { week: "Jan W3", hours: 36, tasks: 12, responseTime: 2.4, score: 74 },
  { week: "Jan W4", hours: 43, tasks: 19, responseTime: 1.5, score: 89 },
  { week: "Feb W1", hours: 40, tasks: 16, responseTime: 1.9, score: 85 },
  { week: "Feb W2", hours: 37, tasks: 13, responseTime: 2.2, score: 80 },
  { week: "Feb W3", hours: 42, tasks: 18, responseTime: 1.6, score: 87 },
  { week: "Feb W4", hours: 39, tasks: 15, responseTime: 1.7, score: 84 }
];

const tasksByType: TaskTypePoint[] = [
  { type: "Design", hours: 62, tasks: 28, tone: "accent" },
  { type: "Strategy", hours: 24, tasks: 9, tone: "purple" },
  { type: "Research", hours: 18, tasks: 7, tone: "blue" },
  { type: "Admin", hours: 21, tasks: 14, tone: "muted" },
  { type: "Production", hours: 11, tasks: 6, tone: "amber" }
];

const clientBreakdown: ClientPoint[] = [
  { client: "Volta Studios", hours: 49.5, tasks: 18, tone: "accent" },
  { client: "Kestrel Capital", hours: 38, tasks: 14, tone: "purple" },
  { client: "Mira Health", hours: 31, tasks: 12, tone: "blue" },
  { client: "Dune Collective", hours: 27, tasks: 10, tone: "amber" },
  { client: "Okafor & Sons", hours: 13.5, tasks: 6, tone: "muted" }
];

const milestoneHistory: MilestonePoint[] = [
  { name: "Logo & Visual Direction", client: "Volta", status: "pending", deliveredOn: "Feb 22", dueDate: "Feb 22", onTime: true },
  { name: "Campaign Strategy Deck", client: "Kestrel", status: "pending", deliveredOn: "Feb 17", dueDate: "Feb 16", onTime: false },
  { name: "Mobile Wireframes", client: "Mira", status: "revision", deliveredOn: "Feb 19", dueDate: "Feb 20", onTime: true },
  { name: "Data Visualisation", client: "Okafor", status: "approved", deliveredOn: "Feb 19", dueDate: "Feb 20", onTime: true },
  { name: "Type & Grid System", client: "Dune", status: "pending", deliveredOn: "Feb 9", dueDate: "Feb 10", onTime: true }
];

const targets = { hours: 40, tasks: 16, responseTime: 2.0 };

function toneClass(tone: Tone) {
  if (tone === "accent") return "ppToneAccent";
  if (tone === "purple") return "ppTonePurple";
  if (tone === "blue") return "ppToneBlue";
  if (tone === "amber") return "ppToneAmber";
  if (tone === "orange") return "ppToneOrange";
  return "ppToneMuted";
}

function meterToneClass(tone: Tone) {
  if (tone === "accent") return "ppMeterAccent";
  if (tone === "purple") return "ppMeterPurple";
  if (tone === "blue") return "ppMeterBlue";
  if (tone === "amber") return "ppMeterAmber";
  if (tone === "orange") return "ppMeterOrange";
  return "ppMeterMuted";
}

function toneStroke(tone: Tone) {
  if (tone === "accent") return "var(--accent)";
  if (tone === "purple") return "var(--purple)";
  if (tone === "blue") return "var(--blue)";
  if (tone === "amber") return "var(--amber)";
  if (tone === "orange") return "var(--amber)";
  return "var(--muted)";
}

function milestoneStatusClass(status: MilestonePoint["status"]) {
  if (status === "approved") return "ppStatusApproved";
  if (status === "revision") return "ppStatusRevision";
  return "ppStatusPending";
}

function MiniLineChart({
  data,
  valueKey,
  min,
  max,
  tone
}: {
  data: WeeklyPoint[];
  valueKey: keyof WeeklyPoint;
  min: number;
  max: number;
  tone: Tone;
}) {
  const width = 720;
  const height = 160;
  const padX = 10;
  const padY = 12;
  const drawW = width - padX * 2;
  const drawH = height - padY * 2;

  const points = data
    .map((row, index) => {
      const value = Number(row[valueKey]);
      const x = padX + (index / Math.max(1, data.length - 1)) * drawW;
      const y = padY + (1 - (value - min) / Math.max(1, max - min)) * drawH;
      return { x, y, label: row.week };
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const stroke = toneStroke(tone);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="160" className={cx("ppChartSvg")}>
        <polyline points={polyline} fill="none" stroke={stroke} strokeWidth="2" />
        {points.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="3" fill={stroke} />
        ))}
      </svg>
      <div className={cx("ppChartLabels")}>
        {data.map((point) => (
          <div key={point.week} className={cx("ppChartLabel")}>{point.week}</div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  target,
  targetLabel,
  tone,
  trend
}: {
  label: string;
  value: number;
  unit: string;
  target?: number;
  targetLabel?: string;
  tone: Tone;
  trend?: number;
}) {
  const hitTarget = target ? (label.toLowerCase().includes("response") ? value <= target : value >= target) : true;
  return (
    <div className={cx("ppStatCard")}>
      <div className={cx("ppStatLabel")}>{label}</div>
      <div className={cx("ppStatValue", toneClass(tone))}>
        {value}
        <span className={cx("ppStatUnit")}>{unit}</span>
      </div>
      {target ? (
        <div className={cx("ppTargetRow")}>
          <div className={cx("ppTargetDot", hitTarget ? "ppTargetHit" : "ppTargetMiss")} />
          <span className={cx("ppTargetText", hitTarget ? "ppTargetHit" : "ppTargetMiss")}>
            {hitTarget ? "On target" : "Below target"} ({targetLabel ?? `target: ${target}${unit}`})
          </span>
        </div>
      ) : null}
      {typeof trend === "number" ? (
        <div className={cx("ppTrend", trend > 0 ? "ppTrendUp" : "ppTrendDown")}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)} vs last month
        </div>
      ) : null}
    </div>
  );
}

export function PersonalPerformancePage({ isActive }: { isActive: boolean }) {
  const [tab, setTab] = useState<"overview" | "time" | "clients" | "milestones">("overview");
  const [period, setPeriod] = useState<"4w" | "8w">("4w");

  const chartData = useMemo(() => (period === "4w" ? weeklyData.slice(-4) : weeklyData), [period]);

  const currentPeriod = useMemo(() => weeklyData.slice(-4), []);
  const avgHours = Math.round((currentPeriod.reduce((sum, week) => sum + week.hours, 0) / currentPeriod.length) * 10) / 10;
  const avgTasks = Math.round((currentPeriod.reduce((sum, week) => sum + week.tasks, 0) / currentPeriod.length) * 10) / 10;
  const avgResponse = Math.round((currentPeriod.reduce((sum, week) => sum + week.responseTime, 0) / currentPeriod.length) * 10) / 10;
  const avgScore = Math.round(currentPeriod.reduce((sum, week) => sum + week.score, 0) / currentPeriod.length);
  const onTimeRate = Math.round((milestoneHistory.filter((item) => item.onTime).length / milestoneHistory.length) * 100);
  const totalHours = clientBreakdown.reduce((sum, client) => sum + client.hours, 0);
  const totalTypeHours = tasksByType.reduce((sum, type) => sum + type.hours, 0);
  const maxHours = Math.max(...chartData.map((item) => item.hours), 1);
  const maxTasks = Math.max(...chartData.map((item) => item.tasks), 1);
  const lateCount = milestoneHistory.filter((item) => !item.onTime).length;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-personal-performance">
      <div className={cx("pageHeaderBar", "ppHeaderBar")}> 
        <div className={cx("flexBetween", "mb20", "ppHeaderTop")}> 
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Personal Growth</div>
            <h1 className={cx("pageTitleText")}>My Performance</h1>
          </div>
          <div className={cx("ppScoreWrap")}>
            <div className={cx("statLabelNew")}>4-week score</div>
            <div className={cx("ppScoreValue")}>{avgScore}<span className={cx("ppScoreUnit")}>/100</span></div>
          </div>
        </div>

        <div className={cx("flexBetween", "gap10")}> 
          <div className={cx("flexRow")}>
            {[
              { key: "overview", label: "Overview" },
              { key: "time", label: "Time & Tasks" },
              { key: "clients", label: "By Client" },
              { key: "milestones", label: "Milestones" }
            ].map((item) => (
              <button type="button"
                key={item.key}
                className={cx("ppTabBtn", "ppTabPill", tab === item.key ? "ppTabPillActive" : "ppTabPillIdle")}
                onClick={() => setTab(item.key as "overview" | "time" | "clients" | "milestones")}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={cx("ppPeriodWrap")}>
            {(["4w", "8w"] as const).map((item) => (
              <button type="button"
                key={item}
                className={cx("ppPeriodBtn", "ppPeriodPill", period === item ? "ppPeriodPillActive" : "ppPeriodPillIdle")}
                onClick={() => setPeriod(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cx("ppBody")}> 
        {tab === "overview" ? (
          <div className={cx("ppStack")}>
            <div className={cx("ppStatGrid")}>
              <StatCard label="Avg hours / week" value={avgHours} unit="h" target={targets.hours} tone="accent" trend={1.5} />
              <StatCard label="Avg tasks / week" value={avgTasks} unit="" target={targets.tasks} tone="purple" trend={2} />
              <StatCard label="Avg response time" value={avgResponse} unit="h" target={targets.responseTime} targetLabel={`target: <${targets.responseTime}h`} tone="blue" trend={-0.3} />
              <StatCard label="On-time delivery" value={onTimeRate} unit="%" tone={onTimeRate >= 90 ? "accent" : "amber"} trend={5} />
            </div>

            <div className={cx("ppPanel")}> 
              <div className={cx("sectionLabel", "mb16")}>Weekly Performance Score</div>
              <MiniLineChart data={chartData} valueKey="score" min={60} max={100} tone="accent" />
            </div>

            <div className={cx("ppGrid2")}> 
              <div className={cx("ppPanel")}>
                <div className={cx("sectionLabel", "mb16")}>Hours by Task Type (4w)</div>
                {tasksByType.map((type) => (
                  <div key={type.type} className={cx("ppTypeRow")}> 
                    <div className={cx("ppTypeTop")}>
                      <div className={cx("flexRow", "gap8")}>
                        <div className={cx("ppMiniDot", toneClass(type.tone))} />
                        <span className={cx("text11", "colorMuted")}>{type.type}</span>
                      </div>
                      <span className={cx("text11", toneClass(type.tone))}>{type.hours}h</span>
                    </div>
                    <progress className={cx("progressMeter", meterToneClass(type.tone), "ppSlimProgress")} max={totalTypeHours} value={type.hours} />
                  </div>
                ))}
              </div>

              <div className={cx("ppPanel")}>
                <div className={cx("sectionLabel", "mb16")}>Highlights & Flags</div>
                {[
                  { icon: "↑", text: "Best response time in 8 weeks (1.6h last week)", tone: "accent" as Tone },
                  { icon: "✓", text: "4 of 5 milestones delivered on time this period", tone: "accent" as Tone },
                  { icon: "↓", text: "Week 3 hours below target (36h vs 40h target)", tone: "amber" as Tone },
                  { icon: "⚑", text: "Admin time up 18% - check for inefficiencies", tone: "orange" as Tone }
                ].map((item, index, arr) => (
                  <div key={item.text} className={cx("ppHighlightRow", index === arr.length - 1 && "ppHighlightRowLast")}>
                    <span className={cx("ppHighlightIcon", toneClass(item.tone))}>{item.icon}</span>
                    <span className={cx("text12", "colorMuted", "lh15")}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "time" ? (
          <div className={cx("ppStack")}> 
            <div className={cx("ppGrid2")}>
              <div className={cx("ppPanel")}>
                <div className={cx("sectionLabel", "mb16")}>Hours per Week</div>
                <div className={cx("ppWeekList")}>
                  {chartData.map((item) => (
                    <div key={item.week} className={cx("ppWeekRow")}>
                      <div className={cx("ppWeekHead")}>
                        <span className={cx("text10", "colorMuted2")}>{item.week}</span>
                        <span className={cx("text10", item.hours >= targets.hours ? "colorAccent" : "colorAmber")}>{item.hours}h</span>
                      </div>
                      <progress className={cx("progressMeter", item.hours >= targets.hours ? "ppMeterAccent" : "ppMeterAmber", "ppWeekProgress")} max={maxHours} value={item.hours} />
                    </div>
                  ))}
                </div>
              </div>

              <div className={cx("ppPanel")}>
                <div className={cx("sectionLabel", "mb16")}>Tasks Completed per Week</div>
                <div className={cx("ppWeekList")}>
                  {chartData.map((item) => (
                    <div key={item.week} className={cx("ppWeekRow")}>
                      <div className={cx("ppWeekHead")}>
                        <span className={cx("text10", "colorMuted2")}>{item.week}</span>
                        <span className={cx("text10", item.tasks >= targets.tasks ? "ppTonePurple" : "colorAmber")}>{item.tasks}</span>
                      </div>
                      <progress className={cx("progressMeter", item.tasks >= targets.tasks ? "ppMeterPurple" : "ppMeterAmber", "ppWeekProgress")} max={maxTasks} value={item.tasks} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={cx("ppPanel")}>
              <div className={cx("ppPanelHead")}> 
                <div className={cx("sectionLabel")}>Average Response Time (hours)</div>
                <span className={cx("text11", "colorMuted2")}>Target: &lt;{targets.responseTime}h</span>
              </div>
              <MiniLineChart data={chartData} valueKey="responseTime" min={0} max={4} tone="blue" />
            </div>
          </div>
        ) : null}

        {tab === "clients" ? (
          <div className={cx("ppGrid2")}>
            <div>
              <div className={cx("sectionLabel", "mb16")}>Hours by Client (4 weeks)</div>
              <div className={cx("flexCol", "gap10")}>
                {clientBreakdown.map((client) => (
                  <div key={client.client} className={cx("ppClientCard")}>
                    <div className={cx("ppClientHead")}>
                      <div className={cx("flexRow", "gap8")}>
                        <div className={cx("ppMiniDot", toneClass(client.tone))} />
                        <span className={cx("text12", "colorText")}>{client.client}</span>
                      </div>
                      <div className={cx("flexRow", "gap14")}>
                        <span className={cx("text11", toneClass(client.tone))}>{client.hours}h</span>
                        <span className={cx("text11", "colorMuted2")}>{client.tasks} tasks</span>
                      </div>
                    </div>
                    <progress className={cx("progressMeter", meterToneClass(client.tone), "ppClientProgress")} max={totalHours} value={client.hours} />
                    <div className={cx("text10", "colorMuted2", "mt6")}>
                      {Math.round((client.hours / totalHours) * 100)}% of total · avg {Math.round((client.hours / client.tasks) * 10) / 10}h/task
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className={cx("sectionLabel", "mb16")}>Distribution</div>
              <div className={cx("ppPanel")}>
                {clientBreakdown.map((client) => (
                  <div key={client.client} className={cx("ppDistRow")}>
                    <div className={cx("ppWeekHead")}>
                      <span className={cx("text10", "colorMuted")}>{client.client}</span>
                      <span className={cx("text10", toneClass(client.tone))}>{client.hours}h</span>
                    </div>
                    <progress className={cx("progressMeter", meterToneClass(client.tone), "ppDistProgress")} max={totalHours} value={client.hours} />
                  </div>
                ))}
                <div className={cx("text11", "colorMuted2", "textCenter", "mt10")}>{totalHours}h total across {clientBreakdown.length} clients</div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "milestones" ? (
          <div className={cx("ppMilestoneWrap")}>
            <div className={cx("ppMilestoneStatGrid")}>
              <div className={cx("ppMilestoneStatCard")}>
                <div className={cx("ppMilestoneStatLabel")}>On-time rate</div>
                <div className={cx("ppMilestoneStatValue", "ppToneAccent")}>{onTimeRate}%</div>
              </div>
              <div className={cx("ppMilestoneStatCard")}>
                <div className={cx("ppMilestoneStatLabel")}>Delivered</div>
                <div className={cx("ppMilestoneStatValue", "ppTonePurple")}>{milestoneHistory.length}</div>
              </div>
              <div className={cx("ppMilestoneStatCard")}>
                <div className={cx("ppMilestoneStatLabel")}>Late</div>
                <div className={cx("ppMilestoneStatValue", lateCount > 0 ? "colorRed" : "ppToneAccent")}>{lateCount}</div>
              </div>
            </div>

            <div className={cx("sectionLabel", "mb14")}>Milestone History</div>
            <div className={cx("flexCol")}>
              {milestoneHistory.map((milestone, index) => (
                <div key={milestone.name} className={cx("perfMilestoneRow", "ppMilestoneRow", index === milestoneHistory.length - 1 && "ppMilestoneRowLast")}>
                  <div className={cx("ppMilestoneDot", milestoneStatusClass(milestone.status))} />
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("text12", "colorText")}>{milestone.name}</div>
                    <div className={cx("text10", "colorMuted2", "mt2")}>{milestone.client}</div>
                  </div>
                  <div className={cx("textRight", "noShrink")}>
                    <div className={cx("text11", milestone.onTime ? "colorAccent" : "colorRed")}>{milestone.onTime ? "✓ On time" : "✗ Late"}</div>
                    <div className={cx("text10", "colorMuted2", "mt2")}>Delivered {milestone.deliveredOn}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
