"use client";

import { useEffect, useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#a78bfa",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0",
};

type ServiceStatus = "healthy" | "degraded" | "down";

const services: Array<{
  name: string;
  uptime: number;
  latency: number;
  status: ServiceStatus;
  requests24h: number;
}> = [
  { name: "API Gateway", uptime: 99.98, latency: 142, status: "healthy", requests24h: 48200 },
  { name: "Client Portal", uptime: 99.91, latency: 210, status: "healthy", requests24h: 3840 },
  { name: "Staff Dashboard", uptime: 99.95, latency: 178, status: "healthy", requests24h: 12400 },
  { name: "Webhook Engine", uptime: 98.82, latency: 89, status: "degraded", requests24h: 2100 },
  { name: "File Storage (S3)", uptime: 100, latency: 44, status: "healthy", requests24h: 8900 },
  { name: "Email Service", uptime: 99.72, latency: 320, status: "healthy", requests24h: 1240 },
  { name: "AI / Claude API", uptime: 99.6, latency: 2100, status: "healthy", requests24h: 640 },
];

const dbMetrics = {
  usage: 68,
  connections: 24,
  maxConnections: 100,
  queryAvg: 48,
  slowQueries: 3,
  size: "12.4 GB",
  backupAge: "2h ago",
};

const errorLog = [
  { time: "09:14", service: "Webhook Engine", code: "503", message: "Upstream timeout on Kestrel Capital webhook", count: 12 },
  { time: "08:52", service: "API Gateway", code: "429", message: "Rate limit hit - staff bulk export", count: 1 },
  { time: "07:30", service: "Email Service", code: "550", message: "Delivery failure - invalid address", count: 3 },
  { time: "Yesterday", service: "Client Portal", code: "500", message: "Session timeout during file upload", count: 2 },
];

const activeSessions = [
  { user: "Nomsa Dlamini", role: "Account Manager", ip: "102.176.x.x", started: "08:42", page: "Client Health Scores", device: "Chrome / macOS" },
  { user: "Renzo Fabbri", role: "Senior Designer", ip: "197.84.x.x", started: "09:01", page: "Sprint Planning", device: "Chrome / macOS" },
  { user: "Kira Bosman", role: "UX Designer", ip: "105.230.x.x", started: "09:08", page: "Task Dependencies", device: "Safari / macOS" },
  { user: "Client - Volta Studios", role: "Client Portal", ip: "41.224.x.x", started: "09:10", page: "Invoices", device: "Chrome / Windows" },
];

const featureFlags = [
  { name: "AI Auto-Draft Updates", enabled: true, scope: "All staff", description: "AI-generated client update emails" },
  { name: "Client Portal V2 UI", enabled: false, scope: "Beta testers only", description: "Redesigned client dashboard" },
  { name: "Smart Task Suggestions", enabled: true, scope: "All staff", description: "AI-powered next-action recommendations" },
  { name: "Real-time Notifications", enabled: true, scope: "All users", description: "WebSocket push notifications" },
  { name: "New Invoice Builder", enabled: false, scope: "Disabled", description: "Updated invoice creation flow" },
];

const tabs = ["services", "database", "error log", "sessions", "feature flags"] as const;
type Tab = (typeof tabs)[number];

const statusConfig: Record<ServiceStatus, { color: string; label: string; dot: string }> = {
  healthy: { color: C.lime, label: "Healthy", dot: C.lime },
  degraded: { color: C.amber, label: "Degraded", dot: C.amber },
  down: { color: C.red, label: "Down", dot: C.red },
};

export function PlatformInfrastructurePage() {
  const [activeTab, setActiveTab] = useState<Tab>("services");
  const [lastRefresh, setLastRefresh] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setLastRefresh(new Date()), 2000);
    return () => clearInterval(t);
  }, []);

  const overallHealth: ServiceStatus = services.every((s) => s.status === "healthy")
    ? "healthy"
    : services.some((s) => s.status === "down")
      ? "down"
      : "degraded";

  const avgUptime = (services.reduce((s, sv) => s + sv.uptime, 0) / services.length).toFixed(2);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / PLATFORM HEALTH</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Platform &amp; Infrastructure</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Live monitoring - API health - Sessions - Feature flags</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: C.surface, border: `1px solid ${statusConfig[overallHealth].color}44`, borderRadius: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusConfig[overallHealth].color, boxShadow: `0 0 6px ${statusConfig[overallHealth].color}`, animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 12, color: statusConfig[overallHealth].color, fontFamily: "DM Mono, monospace" }}>System {statusConfig[overallHealth].label}</span>
          </div>
          <button style={{ background: C.border, color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>View Status Page</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Avg Uptime (30d)", value: `${avgUptime}%`, color: C.lime, sub: "All services" },
          { label: "Active Sessions", value: activeSessions.length.toString(), color: C.blue, sub: "Staff + clients now" },
          { label: "Errors (24h)", value: errorLog.reduce((s, e) => s + e.count, 0).toString(), color: errorLog.some((e) => e.code === "503") ? C.amber : C.lime, sub: "Across all services" },
          { label: "DB Usage", value: `${dbMetrics.usage}%`, color: dbMetrics.usage > 80 ? C.red : dbMetrics.usage > 65 ? C.amber : C.lime, sub: `${dbMetrics.connections}/${dbMetrics.maxConnections} connections` },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
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
              color: activeTab === t ? C.lime : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: `2px solid ${activeTab === t ? C.lime : "transparent"}`,
              marginBottom: -1,
              transition: "all 0.2s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "services" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {services.map((svc) => {
            const cfg = statusConfig[svc.status];
            return (
              <div key={svc.name} style={{ background: C.surface, border: `1px solid ${svc.status !== "healthy" ? `${cfg.color}55` : C.border}`, borderRadius: 10, padding: 20, display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 100px auto", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot, boxShadow: svc.status !== "healthy" ? `0 0 8px ${cfg.dot}` : "none", flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{svc.name}</span>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Uptime (30d)</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: svc.uptime >= 99.9 ? C.lime : svc.uptime >= 99 ? C.amber : C.red }}>{svc.uptime}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Latency</div>
                  <div style={{ fontFamily: "DM Mono, monospace", color: svc.latency < 200 ? C.lime : svc.latency < 500 ? C.amber : C.red }}>{svc.latency}ms</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Requests (24h)</div>
                  <div style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>{svc.requests24h.toLocaleString()}</div>
                </div>
                <span style={{ fontSize: 10, color: cfg.color, background: `${cfg.color}18`, padding: "3px 10px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{cfg.label}</span>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View Logs</button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "database" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Database Health</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>Storage Used</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: dbMetrics.usage > 80 ? C.red : C.amber }}>{dbMetrics.usage}% - {dbMetrics.size}</span>
                </div>
                <div style={{ height: 12, background: C.border, borderRadius: 6 }}>
                  <div style={{ height: "100%", width: `${dbMetrics.usage}%`, background: dbMetrics.usage > 80 ? C.red : C.amber, borderRadius: 6 }} />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>Active Connections</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>{dbMetrics.connections}/{dbMetrics.maxConnections}</span>
                </div>
                <div style={{ height: 12, background: C.border, borderRadius: 6 }}>
                  <div style={{ height: "100%", width: `${(dbMetrics.connections / dbMetrics.maxConnections) * 100}%`, background: C.blue, borderRadius: 6 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Avg Query Time", value: `${dbMetrics.queryAvg}ms`, color: C.lime },
                  { label: "Slow Queries (24h)", value: dbMetrics.slowQueries.toString(), color: dbMetrics.slowQueries > 5 ? C.red : C.amber },
                  { label: "Last Backup", value: dbMetrics.backupAge, color: C.lime },
                  { label: "Backup Status", value: "Success", color: C.lime },
                ].map((m) => (
                  <div key={m.label} style={{ padding: 12, background: C.bg, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, color: C.amber, marginBottom: 8 }}>Storage Advisory</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>Database at 68% capacity. At current growth rate (~2% per month), will hit 80% threshold in approximately 6 months. Consider archiving old client comms or upgrading storage tier.</div>
              <button style={{ marginTop: 12, background: C.amber, color: C.bg, border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Upgrade Storage</button>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Actions</div>
              {["Run Manual Backup", "Clear Cache", "View Query Log", "Database Console"].map((action) => (
                <button key={action} style={{ display: "block", width: "100%", background: C.border, border: "none", color: C.text, padding: "10px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", marginBottom: 8, textAlign: "left" }}>
                  {action} -&gt;
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "error log" && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "80px 160px 60px 1fr 60px auto", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {["Time", "Service", "Code", "Message", "Count", ""].map((h) => <span key={h}>{h}</span>)}
          </div>
          {errorLog.map((err, i) => (
            <div key={err.time + err.service} style={{ display: "grid", gridTemplateColumns: "80px 160px 60px 1fr 60px auto", padding: "14px 24px", borderBottom: i < errorLog.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", background: err.code === "503" ? C.surface : "transparent" }}>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{err.time}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{err.service}</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: err.code.startsWith("5") ? C.red : err.code.startsWith("4") ? C.amber : C.muted }}>{err.code}</span>
              <span style={{ fontSize: 12, color: C.muted }}>{err.message}</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: err.count > 5 ? C.red : C.amber }}>{err.count}</span>
              <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Inspect</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "sessions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{activeSessions.length} active sessions - Last refreshed {lastRefresh.toLocaleTimeString()}</div>
          {activeSessions.map((s) => (
            <div key={s.user + s.started} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, display: "grid", gridTemplateColumns: "200px 160px 140px 1fr 140px auto", alignItems: "center", gap: 20 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.user}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{s.role}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>IP Address</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{s.ip}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Session Start</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{s.started}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Current Page</div>
                <div style={{ fontSize: 12, color: C.blue }}>{s.page}</div>
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{s.device}</div>
              <button style={{ background: C.surface, color: C.red, border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Terminate</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "feature flags" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.blue}33`, borderRadius: 10, padding: 16, fontSize: 12, color: C.muted }}>
            Feature flags allow you to enable or disable platform features without deploying new code. Use with caution - changes take effect immediately for all users in the specified scope.
          </div>
          {featureFlags.map((flag) => (
            <div key={flag.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr 160px 80px", alignItems: "center", gap: 20 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{flag.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{flag.description}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Scope</div>
                <div style={{ fontSize: 12, color: flag.enabled ? C.blue : C.muted }}>{flag.scope}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 13,
                    background: flag.enabled ? C.lime : C.border,
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ position: "absolute", top: 3, left: flag.enabled ? 24 : 3, width: 20, height: 20, borderRadius: "50%", background: flag.enabled ? C.bg : "#666", transition: "left 0.2s" }} />
                </div>
                <span style={{ fontSize: 12, color: flag.enabled ? C.lime : C.muted, fontFamily: "DM Mono, monospace" }}>{flag.enabled ? "On" : "Off"}</span>
              </div>
              <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Edit</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
