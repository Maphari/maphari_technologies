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

const statusConfig: Record<RetainerStatus, { label: string; color: string; bg: string; bar: string }> = {
  healthy: { label: "Healthy", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 8%, transparent)", bar: "var(--accent)" },
  moderate: { label: "Moderate", color: "#f5c518", bg: "rgba(245,197,24,0.08)", bar: "#f5c518" },
  critical: { label: "Critical", color: "#ff8c00", bg: "rgba(255,140,0,0.08)", bar: "#ff8c00" },
  exceeded: { label: "Exceeded", color: "#ff4444", bg: "rgba(255,68,68,0.08)", bar: "#ff4444" }
};

const categoryColors: Record<RetainerTask["category"], string> = {
  Design: "var(--accent)",
  Strategy: "#a78bfa",
  Research: "#60a5fa",
  Admin: "#a0a0b0",
  Production: "#f5c518"
};

function BurnBar({ used, total, status, height = 8 }: { used: number; total: number; status: RetainerStatus; height?: number }) {
  const pct = Math.min((used / total) * 100, 100);
  const over = used > total;
  const cfg = statusConfig[status];
  return (
    <div style={{ position: "relative", height, background: "rgba(255,255,255,0.06)", borderRadius: height / 2, overflow: "visible" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${pct}%`,
          background: cfg.bar,
          borderRadius: height / 2,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)"
        }}
      />
      {over ? (
        <div
          style={{
            position: "absolute",
            right: -2,
            top: -2,
            width: height + 4,
            height: height + 4,
            background: "#ff4444",
            borderRadius: "50%",
            border: "2px solid #050508"
          }}
        />
      ) : null}
    </div>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 100);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 120;
      const y = 30 - (value / max) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="120" height="32" viewBox="0 0 120 32">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * 120;
        const y = 30 - (value / max) * 28;
        return index === data.length - 1 ? <circle key={index} cx={x} cy={y} r="2.5" fill={color} /> : null;
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
  const cfg = statusConfig[current.status];

  const r = 54;
  const circ = 2 * Math.PI * r;
  const usedDash = Math.min(burnPct / 100, 1) * circ;
  const overColor = current.status === "exceeded" ? "#ff4444" : cfg.bar;

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-retainer-burn">
      <style>{`
        .retainer-client-tab { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .retainer-client-tab:hover { background: color-mix(in srgb, var(--accent) 5%, transparent) !important; }
        .retainer-task-row { transition: background 0.1s ease; }
        .retainer-task-row:hover { background: rgba(255,255,255,0.02) !important; }
        .retainer-action-btn { transition: all 0.15s ease; cursor: pointer; }
        .retainer-action-btn:hover { opacity: 0.75; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Client Finance
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Retainer Burn
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Cycle", value: "Feb 2026", color: "#a0a0b0" },
              { label: "Days left", value: "6", color: "#f5c518" },
              { label: "Exceeded", value: retainers.filter((retainer) => retainer.status === "exceeded").length, color: "#ff4444" },
              { label: "Critical", value: retainers.filter((retainer) => retainer.status === "critical").length, color: "#ff8c00" }
            ].map((summary) => (
              <div key={summary.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{summary.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: summary.color }}>{summary.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
          {retainers.map((retainer) => {
            const pct = Math.round((retainer.hoursUsed / retainer.retainerHours) * 100);
            const tabCfg = statusConfig[retainer.status];
            const isCurrent = selected === retainer.id;
            return (
              <button
                key={retainer.id}
                className="retainer-client-tab"
                onClick={() => setSelected(retainer.id)}
                type="button"
                style={{
                  padding: "12px 20px",
                  background: "transparent",
                  borderBottom: `2px solid ${isCurrent ? tabCfg.color : "transparent"}`,
                  marginBottom: -1,
                  minWidth: 140,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: tabCfg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: isCurrent ? "#fff" : "var(--muted2)", letterSpacing: "0.04em" }}>{retainer.client}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: tabCfg.bar, borderRadius: 1 }} />
                  </div>
                  <span style={{ fontSize: 10, color: tabCfg.color, minWidth: 28 }}>{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>
        <div>
          {current.alert ? (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: 24,
                border: `1px solid ${current.status === "exceeded" ? "rgba(255,68,68,0.3)" : "rgba(255,140,0,0.3)"}`,
                borderRadius: 3,
                background: current.status === "exceeded" ? "rgba(255,68,68,0.06)" : "rgba(255,140,0,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 10
              }}
            >
              <span style={{ fontSize: 14 }}>⚠</span>
              <span style={{ fontSize: 12, color: current.status === "exceeded" ? "#ff4444" : "#ff8c00" }}>{current.alert}</span>
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
            {[
              { label: "Hours used", value: current.hoursUsed, unit: "h", color: cfg.bar },
              { label: "Retainer total", value: current.retainerHours, unit: "h", color: "#a0a0b0" },
              { label: "Remaining", value: current.status === "exceeded" ? `-${current.overage}` : remaining, unit: "h", color: current.status === "exceeded" ? "#ff4444" : "var(--accent)" },
              { label: "Overage cost", value: current.overage > 0 ? `R${(current.overage * current.hourlyRate).toLocaleString()}` : "-", unit: "", color: current.overage > 0 ? "#ff4444" : "#333344" }
            ].map((stat) => (
              <div key={stat.label} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: stat.color }}>
                  {stat.value}
                  <span style={{ fontSize: 12, color: "var(--muted2)", fontFamily: "'DM Mono', monospace", fontWeight: 400 }}>{stat.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Cycle burn</div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--muted2)" }}>{current.cycleStart}</span>
                <span style={{ fontSize: 11, color: "var(--muted2)" }}>→</span>
                <span style={{ fontSize: 11, color: "var(--muted2)" }}>{current.cycleEnd}</span>
                <span style={{ fontSize: 11, color: cfg.color, fontWeight: 500 }}>{burnPct}%</span>
              </div>
            </div>
            <BurnBar used={current.hoursUsed} total={current.retainerHours} status={current.status} height={12} />
            {current.status === "exceeded" ? (
              <div style={{ marginTop: 6, fontSize: 10, color: "#ff4444" }}>
                Exceeded by {current.overage}h - R{(current.overage * current.hourlyRate).toLocaleString()} unbilled
              </div>
            ) : null}
          </div>

          <div>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Hours by Task</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[...current.tasks]
                .sort((left, right) => right.hours - left.hours)
                .map((task, index) => {
                  const pct = (task.hours / current.hoursUsed) * 100;
                  const catColor = categoryColors[task.category] ?? "#a0a0b0";
                  return (
                    <div key={index} className="retainer-task-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: catColor, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: "var(--text)" }}>{task.name}</span>
                          <span style={{ fontSize: 11, color: "#a0a0b0" }}>{task.hours}h</span>
                        </div>
                        <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: catColor, borderRadius: 2, opacity: 0.7 }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color: catColor, minWidth: 28, textAlign: "right" }}>{Math.round(pct)}%</span>
                    </div>
                  );
                })}
            </div>

            <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
              {Object.entries(categoryColors).map(([category, color]) => (
                <div key={category} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 10, color: "var(--muted2)" }}>{category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16, alignSelf: "flex-start" }}>
              Burn overview
            </div>
            <svg width="132" height="132" viewBox="0 0 132 132">
              <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle
                cx="66"
                cy="66"
                r={r}
                fill="none"
                stroke={overColor}
                strokeWidth="10"
                strokeDasharray={`${usedDash} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 66 66)"
                style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
              />
              <text x="66" y="60" textAnchor="middle" fill={overColor} fontFamily="'Syne', sans-serif" fontSize="22" fontWeight="800">
                {burnPct}%
              </text>
              <text x="66" y="76" textAnchor="middle" fill="var(--muted2)" fontFamily="'DM Mono', monospace" fontSize="9">
                burned
              </text>
            </svg>
            <div style={{ width: "100%", marginTop: 16 }}>
              {[
                { label: "Used", value: `${current.hoursUsed}h`, color: cfg.bar },
                { label: "Total", value: `${current.retainerHours}h`, color: "var(--muted2)" },
                { label: "Value", value: `R${current.retainerValue.toLocaleString()}`, color: "#a0a0b0" },
                { label: "Cycle", value: current.billingCycle, color: "#a0a0b0" }
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 11, color: "var(--muted2)" }}>{row.label}</span>
                  <span style={{ fontSize: 11, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 16, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>6-Month Trend</div>
            <MiniSparkline data={current.burnHistory} color={cfg.bar} />
            <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 8 }}>
              {current.burnHistory[current.burnHistory.length - 1] > current.burnHistory[0]
                ? "↑ Burn rate increasing - check scope creep"
                : "↓ Burn rate stable or decreasing"}
            </div>
          </div>

          <div style={{ padding: 16, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>End-of-cycle Projection</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: projectedTotal > current.retainerHours ? "#ff4444" : "var(--accent)", marginBottom: 4 }}>
              {Math.round(projectedTotal * 10) / 10}h
            </div>
            <div style={{ fontSize: 11, color: "var(--muted2)" }}>
              {projectedTotal > current.retainerHours
                ? `Will exceed by ~${Math.round((projectedTotal - current.retainerHours) * 10) / 10}h`
                : `~${Math.round((current.retainerHours - projectedTotal) * 10) / 10}h buffer remaining`}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Actions</div>
            {[
              { label: "Request scope extension", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "color-mix(in srgb, var(--accent) 20%, transparent)" },
              { label: "Flag to admin", color: "#ff8c00", bg: "rgba(255,140,0,0.06)", border: "rgba(255,140,0,0.2)" },
              { label: "Export burn report", color: "#a0a0b0", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" }
            ].map((action) => (
              <button
                key={action.label}
                className="retainer-action-btn"
                type="button"
                style={{
                  padding: "10px 14px",
                  border: `1px solid ${action.border}`,
                  borderRadius: 3,
                  background: action.bg,
                  color: action.color,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  textAlign: "left",
                  fontFamily: "'DM Mono', monospace"
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
