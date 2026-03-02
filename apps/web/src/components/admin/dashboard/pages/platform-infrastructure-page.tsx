"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";

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
  healthy: { color: "var(--accent)", label: "Healthy", dot: "var(--accent)" },
  degraded: { color: "var(--amber)", label: "Degraded", dot: "var(--amber)" },
  down: { color: "var(--red)", label: "Down", dot: "var(--red)" },
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
    <div className={cx(styles.pageBody, styles.pifRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / PLATFORM HEALTH</div>
          <h1 className={styles.pageTitle}>Platform &amp; Infrastructure</h1>
          <div className={styles.pageSub}>Live monitoring - API health - Sessions - Feature flags</div>
        </div>
        <div className={styles.pifHeadActions}>
          <div className={cx(styles.pifHealthBadge, styles.pifHealthBadgeTone, toneClass(statusConfig[overallHealth].color))}>
            <div
              className={cx(styles.pifHealthDot, styles.pifHealthDotTone, toneClass(statusConfig[overallHealth].color))}
            />
            <span className={cx(styles.pifHealthText, colorClass(statusConfig[overallHealth].color))}>
              System {statusConfig[overallHealth].label}
            </span>
          </div>
          <button type="button" className={cx("btnSm", "btnGhost")}>View Status Page</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28") }>
        {[
          { label: "Avg Uptime (30d)", value: `${avgUptime}%`, color: "var(--accent)", sub: "All services" },
          { label: "Active Sessions", value: activeSessions.length.toString(), color: "var(--blue)", sub: "Staff + clients now" },
          { label: "Errors (24h)", value: errorLog.reduce((s, e) => s + e.count, 0).toString(), color: errorLog.some((e) => e.code === "503") ? "var(--amber)" : "var(--accent)", sub: "Across all services" },
          { label: "DB Usage", value: `${dbMetrics.usage}%`, color: dbMetrics.usage > 80 ? "var(--red)" : dbMetrics.usage > 65 ? "var(--amber)" : "var(--accent)", sub: `${dbMetrics.connections}/${dbMetrics.maxConnections} connections` },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "services" ? (
        <div className={cx("flexCol", "gap12") }>
          {services.map((svc) => {
            const cfg = statusConfig[svc.status];
            return (
              <div key={svc.name} className={cx(styles.pifServiceRow, svc.status !== "healthy" && styles.pifServiceRowAlert, toneClass(cfg.color))}>
                <div className={styles.pifServiceNameCell}>
                  <div className={cx(styles.pifServiceDot, styles.pifServiceDotTone, svc.status !== "healthy" && styles.pifServiceDotAlert, toneClass(cfg.dot))} />
                  <span className={styles.pifServiceName}>{svc.name}</span>
                </div>
                <div>
                  <div className={styles.pifLabel}>Uptime (30d)</div>
                  <div className={cx(styles.pifMono, svc.uptime >= 99.9 ? "colorAccent" : svc.uptime >= 99 ? "colorAmber" : "colorRed")}>{svc.uptime}%</div>
                </div>
                <div>
                  <div className={styles.pifLabel}>Latency</div>
                  <div className={cx(styles.pifMono, svc.latency < 200 ? "colorAccent" : svc.latency < 500 ? "colorAmber" : "colorRed")}>{svc.latency}ms</div>
                </div>
                <div>
                  <div className={styles.pifLabel}>Requests (24h)</div>
                  <div className={styles.pifMonoBlue}>{svc.requests24h.toLocaleString()}</div>
                </div>
                <span className={cx(styles.pifStatusPill, styles.pifStatusPillTone, toneClass(cfg.color))}>{cfg.label}</span>
                <button type="button" className={cx("btnSm", "btnGhost")}>View Logs</button>
              </div>
            );
          })}
        </div>
      ) : null}

      {activeTab === "database" ? (
        <div className={styles.pifDbSplit}>
          <div className={cx("card", "p24") }>
            <div className={styles.pifSectionTitle}>Database Health</div>
            <div className={cx("flexCol", "gap20") }>
              <div>
                <div className={styles.pifMetricHead}>
                  <span className={styles.text13}>Storage Used</span>
                  <span className={cx(styles.pifMono, dbMetrics.usage > 80 ? "colorRed" : "colorAmber")}>{dbMetrics.usage}% - {dbMetrics.size}</span>
                </div>
                <progress className={cx(styles.pifProgress, dbMetrics.usage > 80 ? styles.pifProgRed : styles.pifProgAmber)} max={100} value={dbMetrics.usage} aria-label={`Database storage usage ${dbMetrics.usage}%`} />
              </div>
              <div>
                <div className={styles.pifMetricHead}>
                  <span className={styles.text13}>Active Connections</span>
                  <span className={styles.pifMonoBlue}>{dbMetrics.connections}/{dbMetrics.maxConnections}</span>
                </div>
                <progress className={cx(styles.pifProgress, styles.pifProgBlue)} max={dbMetrics.maxConnections} value={dbMetrics.connections} aria-label={`Database connections ${dbMetrics.connections} of ${dbMetrics.maxConnections}`} />
              </div>
              <div className={styles.pifMiniGrid}>
                {[
                  { label: "Avg Query Time", value: `${dbMetrics.queryAvg}ms`, color: "var(--accent)" },
                  { label: "Slow Queries (24h)", value: dbMetrics.slowQueries.toString(), color: dbMetrics.slowQueries > 5 ? "var(--red)" : "var(--amber)" },
                  { label: "Last Backup", value: dbMetrics.backupAge, color: "var(--accent)" },
                  { label: "Backup Status", value: "Success", color: "var(--accent)" },
                ].map((m) => (
                  <div key={m.label} className={styles.pifMiniCard}>
                    <div className={styles.pifLabel}>{m.label}</div>
                    <div className={cx(styles.pifMono, colorClass(m.color))}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={cx("flexCol", "gap16") }>
            <div className={styles.pifAdvisoryCard}>
              <div className={styles.pifAdvisoryTitle}>Storage Advisory</div>
              <div className={styles.pifAdvisoryText}>
                Database at 68% capacity. At current growth rate (~2% per month), will hit 80% threshold in approximately 6 months. Consider archiving old client comms or upgrading storage tier.
              </div>
              <button type="button" className={cx("btnSm", "btnAccent")}>Upgrade Storage</button>
            </div>
            <div className={cx("card", "p24") }>
              <div className={styles.pifSectionTitle}>Quick Actions</div>
              <div className={cx("flexCol", "gap8") }>
                {["Run Manual Backup", "Clear Cache", "View Query Log", "Database Console"].map((action) => (
                  <button key={action} type="button" className={styles.pifQuickBtn}>
                    {action} -&gt;
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "error log" ? (
        <div className={styles.pifTableCard}>
          <div className={cx(styles.pifErrorHead, "fontMono", "text10", "colorMuted", "uppercase")}>
            {["Time", "Service", "Code", "Message", "Count", ""].map((h) => <span key={h}>{h}</span>)}
          </div>
          {errorLog.map((err, i) => (
            <div key={err.time + err.service} className={cx(styles.pifErrorRow, i < errorLog.length - 1 && "borderB", err.code === "503" && styles.pifErrorWarn)}>
              <span className={cx("fontMono", "text11", "colorMuted")}>{err.time}</span>
              <span className={cx("text12", "fw600")}>{err.service}</span>
              <span className={cx("fontMono", "text12", err.code.startsWith("5") ? "colorRed" : err.code.startsWith("4") ? "colorAmber" : "colorMuted")}>{err.code}</span>
              <span className={cx("text12", "colorMuted")}>{err.message}</span>
              <span className={cx("fontMono", "text12", err.count > 5 ? "colorRed" : "colorAmber")}>{err.count}</span>
              <button type="button" className={cx("btnSm", "btnGhost")}>Inspect</button>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "sessions" ? (
        <div className={cx("flexCol", "gap12") }>
          <div className={cx("text12", "colorMuted", "mb4")}>{activeSessions.length} active sessions - Last refreshed {lastRefresh.toLocaleTimeString()}</div>
          {activeSessions.map((s) => (
            <div key={s.user + s.started} className={styles.pifSessionRow}>
              <div>
                <div className={cx("fw600", "text13")}>{s.user}</div>
                <div className={cx("text11", "colorMuted")}>{s.role}</div>
              </div>
              <div>
                <div className={styles.pifLabel}>IP Address</div>
                <div className={cx("fontMono", "text12")}>{s.ip}</div>
              </div>
              <div>
                <div className={styles.pifLabel}>Session Start</div>
                <div className={cx("fontMono", "text12")}>{s.started}</div>
              </div>
              <div>
                <div className={styles.pifLabel}>Current Page</div>
                <div className={cx("text12", "colorBlue")}>{s.page}</div>
              </div>
              <div className={cx("text11", "colorMuted")}>{s.device}</div>
              <button type="button" className={styles.pifTerminateBtn}>Terminate</button>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "feature flags" ? (
        <div className={cx("flexCol", "gap12") }>
          <div className={styles.pifInfoCard}>
            Feature flags allow you to enable or disable platform features without deploying new code. Use with caution - changes take effect immediately for all users in the specified scope.
          </div>
          {featureFlags.map((flag) => (
            <div key={flag.name} className={styles.pifFlagRow}>
              <div>
                <div className={cx("fw700", "mb4")}>{flag.name}</div>
                <div className={cx("text12", "colorMuted")}>{flag.description}</div>
              </div>
              <div>
                <div className={styles.pifLabel}>Scope</div>
                <div className={cx("text12", flag.enabled ? "colorBlue" : "colorMuted")}>{flag.scope}</div>
              </div>
              <div className={styles.pifToggleWrap}>
                <div className={cx(styles.pifToggle, flag.enabled && styles.pifToggleOn)}>
                  <div className={cx(styles.pifToggleKnob, flag.enabled && styles.pifToggleKnobOn)} />
                </div>
                <span className={cx(styles.pifToggleText, flag.enabled ? "colorAccent" : "colorMuted")}>{flag.enabled ? "On" : "Off"}</span>
              </div>
              <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
