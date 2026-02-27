"use client";

import { useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  lime: "#c8f135",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

const mrrHistory = [244000, 262000, 280000, 296000, 344000, 380600];
const profitHistory = [68000, 74000, 79000, 91000, 98000, 112000];
const npsHistory = [42, 45, 51, 48, 38, 42];
const utilizationHistory = [74, 76, 79, 82, 78, 81];

const clients = [
  { name: "Volta Studios", color: C.lime, mrr: 28000, health: 94, nps: 9, trend: "stable" },
  { name: "Kestrel Capital", color: C.purple, mrr: 21000, health: 44, nps: 4, trend: "declining" },
  { name: "Mira Health", color: C.blue, mrr: 21600, health: 74, nps: 8, trend: "improving" },
  { name: "Dune Collective", color: C.amber, mrr: 16000, health: 38, nps: 3, trend: "declining" },
  { name: "Okafor & Sons", color: C.orange, mrr: 12000, health: 96, nps: 10, trend: "stable" }
] as const;

const alerts = [
  { type: "critical", icon: "🔴", message: "Kestrel Capital — invoice INV-0039 overdue 12 days. NPS dropped to 4.", action: "View" },
  { type: "warning", icon: "🟡", message: "Dune Collective — scope dispute unresolved. Health score 38.", action: "Review" },
  { type: "warning", icon: "🟡", message: "Leilani Fotu — leave pending approval (5 days from Mar 10).", action: "Approve" },
  { type: "info", icon: "🟢", message: "Zoe Hendricks onboarding starts Mar 3 — 8 tasks outstanding.", action: "View" },
  { type: "info", icon: "🟢", message: "FY2025 closeout 52% complete — accountant review Mar 10.", action: "View" }
] as const;

const kpis = [
  { label: "Monthly MRR", value: "R380.6k", prev: "R344k", change: "+10.6%", color: C.lime, up: true },
  { label: "Net Profit (Feb)", value: "R112k", prev: "R98k", change: "+14.3%", color: C.lime, up: true },
  { label: "Gross Margin", value: "51%", prev: "48%", change: "+3pp", color: C.lime, up: true },
  { label: "Team Utilisation", value: "81%", prev: "78%", change: "+3pp", color: C.lime, up: true },
  { label: "Portfolio NPS", value: "42", prev: "38", change: "+4", color: C.lime, up: true },
  { label: "Active Projects", value: "5", prev: "5", change: "—", color: C.blue, up: null },
  { label: "Overdue Invoices", value: "R37k", prev: "R0", change: "+R37k", color: C.red, up: false },
  { label: "Clients at Risk", value: "2", prev: "1", change: "+1", color: C.red, up: false }
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
    <svg width={width} height={height} style={{ overflow: "visible" }}>
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

export function ExecutiveDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const totalMRR = clients.reduce((s, c) => s + c.mrr, 0);
  const avgHealth = Math.round(clients.reduce((s, c) => s + c.health, 0) / clients.length);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / REPORTING & INTELLIGENCE</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Executive Dashboard</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Single pane of glass · Maphari Creative Studio · Feb 2026</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ padding: "8px 14px", background: C.surface, border: `1px solid ${C.border}`, fontSize: 11, fontFamily: "DM Mono, monospace", color: C.muted }}>Last updated: Feb 24 09:00</div>
          <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export Board Pack</button>
        </div>
      </div>

      {alerts.filter((a) => a.type === "critical" || a.type === "warning").length > 0 && (
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 6 }}>
          {alerts
            .filter((a) => a.type !== "info")
            .map((alert, i) => (
              <div key={i} style={{ padding: "10px 16px", background: alert.type === "critical" ? "#1a0505" : "#1a1000", border: `1px solid ${alert.type === "critical" ? C.red + "44" : C.amber + "44"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 14 }}>{alert.icon}</span>
                  <span style={{ fontSize: 12 }}>{alert.message}</span>
                </div>
                <button style={{ background: "none", border: `1px solid ${alert.type === "critical" ? C.red : C.amber}`, color: alert.type === "critical" ? C.red : C.amber, padding: "3px 10px", fontSize: 10, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>{alert.action}</button>
              </div>
            ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: C.surface, border: `1px solid ${k.color === C.red ? C.red + "44" : C.border}`, padding: 18 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 26, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {k.up !== null && <span style={{ fontSize: 12, color: k.up ? C.lime : C.red }}>{k.up ? "▲" : "▼"}</span>}
              <span style={{ fontSize: 11, color: k.up ? C.lime : k.up === false ? C.red : C.muted }}>{k.change}</span>
              <span style={{ fontSize: 10, color: C.muted }}>vs {k.prev}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === t ? C.primary : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: `2px solid ${activeTab === t ? C.primary : "transparent"}`,
              marginBottom: -1
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>MRR Trend (6mo)</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: C.lime, fontSize: 20 }}>R{(mrrHistory[mrrHistory.length - 1] / 1000).toFixed(0)}k</div>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
              {mrrHistory.map((v, i) => {
                const h = (v / Math.max(...mrrHistory)) * 80;
                const isLast = i === mrrHistory.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ height: h, background: isLast ? C.lime : `${C.lime}44`, width: "100%" }} />
                    <span style={{ fontSize: 9, color: C.muted }}>{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Net Profit (6mo)</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: C.blue, fontSize: 20 }}>R{(profitHistory[profitHistory.length - 1] / 1000).toFixed(0)}k</div>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
              {profitHistory.map((v, i) => {
                const h = (v / Math.max(...profitHistory)) * 80;
                const isLast = i === profitHistory.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ height: h, background: isLast ? C.blue : `${C.blue}44`, width: "100%" }} />
                    <span style={{ fontSize: 9, color: C.muted }}>{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Client Health Snapshot</div>
            {clients.map((c) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, flex: 1, color: c.color }}>{c.name}</span>
                <div style={{ width: 80, height: 6, background: C.border }}>
                  <div style={{ height: "100%", width: `${c.health}%`, background: c.health >= 70 ? C.lime : c.health >= 50 ? C.amber : C.red }} />
                </div>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, color: c.health >= 70 ? C.lime : c.health >= 50 ? C.amber : C.red, width: 32, textAlign: "right" }}>{c.health}</span>
                <span style={{ fontSize: 12 }}>{c.trend === "improving" ? "▲" : c.trend === "declining" ? "▼" : "→"}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: 12, background: C.bg, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: C.muted }}>Portfolio avg health</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: avgHealth >= 70 ? C.lime : C.amber, fontSize: 18 }}>{avgHealth}</span>
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Team & Operations Pulse</div>
            {[
              { label: "Utilisation", values: utilizationHistory, color: C.purple, unit: "%" },
              { label: "eNPS", values: npsHistory, color: C.orange, unit: "" }
            ].map((metric) => (
              <div key={metric.label} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{metric.label}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: metric.color }}>
                    {metric.values[metric.values.length - 1]}
                    {metric.unit}
                  </span>
                </div>
                <Sparkline data={[...metric.values]} color={metric.color} height={36} width={360} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  {months.map((m) => (
                    <span key={m} style={{ fontSize: 9, color: C.muted }}>{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "financial" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Revenue by Client</div>
            {clients.map((c) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 12, flex: 1, color: c.color }}>{c.name.split(" ")[0]}</span>
                <div style={{ width: 120, height: 8, background: C.border }}>
                  <div style={{ height: "100%", width: `${(c.mrr / totalMRR) * 100}%`, background: c.color }} />
                </div>
                <span style={{ fontFamily: "DM Mono, monospace", color: c.color, fontWeight: 700, width: 60, textAlign: "right" }}>R{(c.mrr / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cash Position (Feb)</div>
            {[
              { label: "Opening balance", value: "R285k", color: C.blue },
              { label: "Inflows expected", value: "R381k", color: C.lime },
              { label: "Outflows planned", value: "-R335k", color: C.red },
              { label: "Net cash movement", value: "+R46k", color: C.lime },
              { label: "Closing balance (est.)", value: "R331k", color: C.lime },
              { label: "Overdue receivables", value: "R37k", color: C.red }
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.muted }}>{r.label}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "clients" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clients.map((c) => (
            <div key={c.name} style={{ background: C.surface, border: `1px solid ${c.health < 50 ? C.red + "44" : C.border}`, padding: 20, display: "grid", gridTemplateColumns: "180px 80px 1fr 80px 80px 80px 80px", alignItems: "center", gap: 20 }}>
              <div style={{ fontWeight: 700, color: c.color, fontSize: 15 }}>{c.name}</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 24, color: c.health >= 70 ? C.lime : c.health >= 50 ? C.amber : C.red }}>{c.health}</div>
              <div>
                <div style={{ height: 8, background: C.border, marginBottom: 4 }}>
                  <div style={{ height: "100%", width: `${c.health}%`, background: c.health >= 70 ? C.lime : c.health >= 50 ? C.amber : C.red }} />
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.muted }}>MRR</div>
                <div style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{(c.mrr / 1000).toFixed(0)}k</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.muted }}>NPS</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: c.nps >= 8 ? C.lime : c.nps >= 6 ? C.amber : C.red }}>{c.nps}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.muted }}>Trend</div>
                <span style={{ fontSize: 16, color: c.trend === "improving" ? C.lime : c.trend === "declining" ? C.red : C.muted }}>{c.trend === "improving" ? "▲" : c.trend === "declining" ? "▼" : "→"}</span>
              </div>
              {c.health < 50 ? <span style={{ fontSize: 10, color: C.red, background: `${C.red}15`, padding: "3px 8px", textAlign: "center" }}>At Risk</span> : <span />}
            </div>
          ))}
        </div>
      )}

      {activeTab === "team" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Utilisation Trend (6mo)</div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
              {utilizationHistory.map((v, i) => {
                const h = (v / 100) * 80;
                const isLast = i === utilizationHistory.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ height: h, background: isLast ? C.purple : `${C.purple}44`, width: "100%" }} />
                    <span style={{ fontSize: 9, color: C.muted }}>{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff eNPS (6mo)</div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
              {npsHistory.map((v, i) => {
                const h = ((v + 20) / 80) * 80;
                const isLast = i === npsHistory.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ height: Math.max(h, 4), background: isLast ? C.orange : `${C.orange}44`, width: "100%" }} />
                    <span style={{ fontSize: 9, color: C.muted }}>{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "alerts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map((alert, i) => (
            <div key={i} style={{ padding: 18, background: C.surface, border: `1px solid ${alert.type === "critical" ? C.red + "44" : alert.type === "warning" ? C.amber + "44" : C.lime + "22"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>{alert.icon}</span>
                <div>
                  <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: alert.type === "critical" ? C.red : alert.type === "warning" ? C.amber : C.lime, marginRight: 8 }}>{alert.type}</span>
                  <span style={{ fontSize: 13 }}>{alert.message}</span>
                </div>
              </div>
              <button style={{ background: "none", border: `1px solid ${alert.type === "critical" ? C.red : alert.type === "warning" ? C.amber : C.lime}`, color: alert.type === "critical" ? C.red : alert.type === "warning" ? C.amber : C.lime, padding: "5px 14px", fontSize: 11, cursor: "pointer", fontFamily: "DM Mono, monospace", flexShrink: 0 }}>{alert.action}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
