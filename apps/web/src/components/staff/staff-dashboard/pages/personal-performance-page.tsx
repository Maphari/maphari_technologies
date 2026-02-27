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

type TaskTypePoint = {
  type: string;
  hours: number;
  tasks: number;
  color: string;
};

type ClientPoint = {
  client: string;
  hours: number;
  tasks: number;
  color: string;
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
  { type: "Design", hours: 62, tasks: 28, color: "var(--accent)" },
  { type: "Strategy", hours: 24, tasks: 9, color: "#a78bfa" },
  { type: "Research", hours: 18, tasks: 7, color: "#60a5fa" },
  { type: "Admin", hours: 21, tasks: 14, color: "#a0a0b0" },
  { type: "Production", hours: 11, tasks: 6, color: "#f5c518" }
];

const clientBreakdown: ClientPoint[] = [
  { client: "Volta Studios", hours: 49.5, tasks: 18, color: "var(--accent)" },
  { client: "Kestrel Capital", hours: 38, tasks: 14, color: "#a78bfa" },
  { client: "Mira Health", hours: 31, tasks: 12, color: "#60a5fa" },
  { client: "Dune Collective", hours: 27, tasks: 10, color: "#f5c518" },
  { client: "Okafor & Sons", hours: 13.5, tasks: 6, color: "#a0a0b0" }
];

const milestoneHistory: MilestonePoint[] = [
  { name: "Logo & Visual Direction", client: "Volta", status: "pending", deliveredOn: "Feb 22", dueDate: "Feb 22", onTime: true },
  { name: "Campaign Strategy Deck", client: "Kestrel", status: "pending", deliveredOn: "Feb 17", dueDate: "Feb 16", onTime: false },
  { name: "Mobile Wireframes", client: "Mira", status: "revision", deliveredOn: "Feb 19", dueDate: "Feb 20", onTime: true },
  { name: "Data Visualisation", client: "Okafor", status: "approved", deliveredOn: "Feb 19", dueDate: "Feb 20", onTime: true },
  { name: "Type & Grid System", client: "Dune", status: "pending", deliveredOn: "Feb 9", dueDate: "Feb 10", onTime: true }
];

const targets = { hours: 40, tasks: 16, responseTime: 2.0 };

function MiniLineChart({
  data,
  valueKey,
  min,
  max,
  stroke
}: {
  data: WeeklyPoint[];
  valueKey: keyof WeeklyPoint;
  min: number;
  max: number;
  stroke: string;
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
      return { x, y, label: row.week, value };
    });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="160" style={{ display: "block" }}>
        <polyline points={polyline} fill="none" stroke={stroke} strokeWidth="2" />
        {points.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="3" fill={stroke} />
        ))}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`, gap: 6, marginTop: 8 }}>
        {data.map((point) => (
          <div key={point.week} style={{ textAlign: "center", fontSize: 10, color: "var(--muted2)" }}>
            {point.week}
          </div>
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
  color,
  trend
}: {
  label: string;
  value: number;
  unit: string;
  target?: number;
  targetLabel?: string;
  color?: string;
  trend?: number;
}) {
  const hitTarget = target ? (label.toLowerCase().includes("response") ? value <= target : value >= target) : true;
  return (
    <div style={{ padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
      <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: color ?? "#fff", marginBottom: 4 }}>
        {value}
        <span style={{ fontSize: 13, color: "var(--muted2)", fontFamily: "'DM Mono', monospace", fontWeight: 400 }}>{unit}</span>
      </div>
      {target ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: hitTarget ? "var(--accent)" : "#f5c518" }} />
          <span style={{ fontSize: 10, color: hitTarget ? "var(--accent)" : "#f5c518" }}>
            {hitTarget ? "On target" : "Below target"} ({targetLabel ?? `target: ${target}${unit}`})
          </span>
        </div>
      ) : null}
      {typeof trend === "number" ? (
        <div style={{ fontSize: 10, color: trend > 0 ? "var(--accent)" : "#ff4444", marginTop: 4 }}>
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

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-personal-performance">
      <style>{`
        .perf-tab-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .perf-period-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .perf-period-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .perf-milestone-row { transition: background 0.1s ease; }
        .perf-milestone-row:hover { background: rgba(255,255,255,0.02) !important; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Personal Growth
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              My Performance
            </h1>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>4-week score</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
              {avgScore}
              <span style={{ fontSize: 16, color: "var(--muted2)", fontFamily: "'DM Mono', monospace", fontWeight: 400 }}>/100</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          {[
            { key: "overview", label: "Overview" },
            { key: "time", label: "Time & Tasks" },
            { key: "clients", label: "By Client" },
            { key: "milestones", label: "Milestones" }
          ].map((item) => (
            <button
              key={item.key}
              className="perf-tab-btn"
              onClick={() => setTab(item.key as "overview" | "time" | "clients" | "milestones")}
              style={{
                padding: "10px 20px",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "transparent",
                color: tab === item.key ? "var(--accent)" : "var(--muted2)",
                borderBottom: `2px solid ${tab === item.key ? "var(--accent)" : "transparent"}`,
                marginBottom: -1
              }}
            >
              {item.label}
            </button>
          ))}

          <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center", paddingBottom: 10 }}>
            {(["4w", "8w"] as const).map((item) => (
              <button
                key={item}
                className="perf-period-btn"
                onClick={() => setPeriod(item)}
                style={{
                  padding: "5px 12px",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  borderRadius: 2,
                  background: period === item ? "rgba(255,255,255,0.08)" : "transparent",
                  color: period === item ? "var(--text)" : "var(--muted2)"
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: 8 }}>
        {tab === "overview" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
              <StatCard label="Avg hours / week" value={avgHours} unit="h" target={targets.hours} color="var(--accent)" trend={1.5} />
              <StatCard label="Avg tasks / week" value={avgTasks} unit="" target={targets.tasks} color="#a78bfa" trend={2} />
              <StatCard
                label="Avg response time"
                value={avgResponse}
                unit="h"
                target={targets.responseTime}
                targetLabel={`target: <${targets.responseTime}h`}
                color="#60a5fa"
                trend={-0.3}
              />
              <StatCard label="On-time delivery" value={onTimeRate} unit="%" color={onTimeRate >= 90 ? "var(--accent)" : "#f5c518"} trend={5} />
            </div>

            <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Weekly Performance Score</div>
              <MiniLineChart data={chartData} valueKey="score" min={60} max={100} stroke="var(--accent)" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Hours by Task Type (4w)</div>
                {tasksByType.map((type) => (
                  <div key={type.type} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: type.color }} />
                        <span style={{ fontSize: 11, color: "#a0a0b0" }}>{type.type}</span>
                      </div>
                      <span style={{ fontSize: 11, color: type.color }}>{type.hours}h</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${(type.hours / totalTypeHours) * 100}%`, background: type.color, borderRadius: 2, opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Highlights & Flags</div>
                {[
                  { icon: "↑", text: "Best response time in 8 weeks (1.6h last week)", color: "var(--accent)" },
                  { icon: "✓", text: "4 of 5 milestones delivered on time this period", color: "var(--accent)" },
                  { icon: "↓", text: "Week 3 hours below target (36h vs 40h target)", color: "#f5c518" },
                  { icon: "⚑", text: "Admin time up 18% - check for inefficiencies", color: "#ff8c00" }
                ].map((item) => (
                  <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ color: item.color, fontSize: 12, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "time" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Hours per Week</div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))`, gap: 8, alignItems: "end", minHeight: 180 }}>
                  {chartData.map((item) => (
                    <div key={item.week} style={{ textAlign: "center" }}>
                      <div
                        style={{
                          height: `${(item.hours / maxHours) * 130}px`,
                          background: item.hours >= targets.hours ? "var(--accent)" : "#f5c518",
                          opacity: 0.8,
                          borderRadius: "2px 2px 0 0"
                        }}
                      />
                      <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 6 }}>{item.week}</div>
                      <div style={{ fontSize: 10, color: "#a0a0b0" }}>{item.hours}h</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Tasks Completed per Week</div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))`, gap: 8, alignItems: "end", minHeight: 180 }}>
                  {chartData.map((item) => (
                    <div key={item.week} style={{ textAlign: "center" }}>
                      <div
                        style={{
                          height: `${(item.tasks / maxTasks) * 130}px`,
                          background: item.tasks >= targets.tasks ? "#a78bfa" : "#f5c518",
                          opacity: 0.8,
                          borderRadius: "2px 2px 0 0"
                        }}
                      />
                      <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 6 }}>{item.week}</div>
                      <div style={{ fontSize: 10, color: "#a0a0b0" }}>{item.tasks}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Average Response Time (hours)</div>
                <span style={{ fontSize: 11, color: "var(--muted2)" }}>Target: &lt;{targets.responseTime}h</span>
              </div>
              <MiniLineChart data={chartData} valueKey="responseTime" min={0} max={4} stroke="#60a5fa" />
            </div>
          </div>
        ) : null}

        {tab === "clients" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Hours by Client (4 weeks)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {clientBreakdown.map((client) => (
                  <div key={client.client} style={{ padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: client.color }} />
                        <span style={{ fontSize: 12, color: "var(--text)" }}>{client.client}</span>
                      </div>
                      <div style={{ display: "flex", gap: 14 }}>
                        <span style={{ fontSize: 11, color: client.color }}>{client.hours}h</span>
                        <span style={{ fontSize: 11, color: "var(--muted2)" }}>{client.tasks} tasks</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${(client.hours / totalHours) * 100}%`, background: client.color, borderRadius: 2, opacity: 0.7 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 5 }}>
                      {Math.round((client.hours / totalHours) * 100)}% of total · avg {Math.round((client.hours / client.tasks) * 10) / 10}h/task
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Distribution</div>
              <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                {clientBreakdown.map((client) => (
                  <div key={client.client} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#a0a0b0" }}>{client.client}</span>
                      <span style={{ fontSize: 10, color: client.color }}>{client.hours}h</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${(client.hours / totalHours) * 100}%`, background: client.color, borderRadius: 2, opacity: 0.75 }} />
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: "var(--muted2)", textAlign: "center", marginTop: 8 }}>
                  {totalHours}h total across {clientBreakdown.length} clients
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "milestones" ? (
          <div style={{ maxWidth: 740 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div style={{ padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>On-time rate</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>{onTimeRate}%</div>
              </div>
              <div style={{ padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Delivered</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: "#a78bfa" }}>{milestoneHistory.length}</div>
              </div>
              <div style={{ padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Late</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: milestoneHistory.some((item) => !item.onTime) ? "#ff4444" : "var(--accent)" }}>
                  {milestoneHistory.filter((item) => !item.onTime).length}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Milestone History</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {milestoneHistory.map((milestone) => (
                <div key={milestone.name} className="perf-milestone-row" style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: milestone.status === "approved" ? "var(--accent)" : milestone.status === "revision" ? "#a78bfa" : "#f5c518"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--text)" }}>{milestone.name}</div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>{milestone.client}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: milestone.onTime ? "var(--accent)" : "#ff4444" }}>{milestone.onTime ? "✓ On time" : "✗ Late"}</div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>Delivered {milestone.deliveredOn}</div>
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
