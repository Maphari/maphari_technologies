// ════════════════════════════════════════════════════════════════════════════
// system-status-page.tsx — Staff Dashboard: System Status
// Derives platform service health from automation job data.
// Data: GET /automation/jobs (via getAutomationJobs)
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getAutomationJobs, type AutomationJob } from "@/lib/api/staff";
import { cx } from "../style";

// ── Service definition ────────────────────────────────────────────────────────

type Status = "Operational" | "Degraded";

interface ServiceEntry {
  name: string;
  status: Status;
  uptime: string;
  lastIncident: string;
}

/** Maps automation job workflow/topic keywords to a named platform service. */
const SERVICE_KEYS = [
  { key: "web",      name: "Web Application",    keywords: ["portal", "web", "login", "session"] },
  { key: "gateway",  name: "API Gateway",        keywords: ["gateway", "api", "proxy", "route"] },
  { key: "storage",  name: "File Storage (S3)",   keywords: ["file", "upload", "storage", "s3", "drive"] },
  { key: "email",    name: "Email Service",       keywords: ["email", "notification", "mail", "smtp"] },
  { key: "database", name: "Database (Primary)",  keywords: ["db", "database", "prisma", "migration", "query"] },
  { key: "ai",       name: "AI Service",          keywords: ["ai", "ml", "reporting", "analytics", "embedding"] },
] as const;

const DEGRADED_FAILURE_THRESHOLD = 0.15; // >15% failure rate = degraded

/** Derive services from automation job data. */
function deriveServices(jobs: AutomationJob[]): ServiceEntry[] {
  return SERVICE_KEYS.map(({ name, keywords }) => {
    const matched = jobs.filter((j) =>
      keywords.some(
        (kw) =>
          j.topic.toLowerCase().includes(kw) ||
          j.workflow.toLowerCase().includes(kw)
      )
    );

    if (matched.length === 0) {
      return { name, status: "Operational" as Status, uptime: "100%", lastIncident: "None" };
    }

    const failedCount = matched.filter(
      (j) => j.status === "failed" || j.status === "dead-lettered"
    ).length;

    const failRate = failedCount / matched.length;
    const uptimePercent = ((1 - failRate) * 100).toFixed(2);
    const status: Status = failRate > DEGRADED_FAILURE_THRESHOLD ? "Degraded" : "Operational";

    const lastFailed = matched
      .filter((j) => j.status === "failed" || j.status === "dead-lettered")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

    const lastIncident = lastFailed
      ? new Date(lastFailed.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "None";

    return { name, status, uptime: `${uptimePercent}%`, lastIncident };
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseUptime(u: string): number {
  return parseFloat(u.replace("%", ""));
}

function statusBadgeCls(s: Status): string {
  return s === "Operational" ? "sysStatusOperational" : "sysStatusDegraded";
}

function statusStripCls(s: Status): string {
  return s === "Degraded" ? "sysRowDegraded" : "";
}

function uptimeCls(u: string): string {
  const v = parseUptime(u);
  if (v >= 99.9) return "colorGreen";
  if (v >= 99.0) return "colorAmber";
  return "colorRed";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SystemStatusPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }

    setLoading(true);
    void getAutomationJobs(session, 200).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data && r.data.length > 0) {
        setServices(deriveServices(r.data));
      } else {
        setServices([]);
      }
    }).catch(() => {
      // ignore
    }).finally(() => {
      setLoading(false);
    });
  }, [session?.accessToken]);

  const totalServices = services.length;
  const operationalCount = services.filter((s) => s.status === "Operational").length;
  const degradedCount = services.filter((s) => s.status === "Degraded").length;
  const avgUptime = totalServices > 0
    ? (services.reduce((sum, s) => sum + parseUptime(s.uptime), 0) / totalServices).toFixed(2) + "%"
    : "—";

  const allClear = degradedCount === 0;

  const sorted = useMemo(
    () =>
      [...services].sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === "Degraded" ? -1 : 1;
      }),
    [services]
  );

  const empty = !loading && services.length === 0;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-system-status">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-system-status">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Governance</div>
        <h1 className={cx("pageTitleText")}>System Status</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Platform uptime and known issues</p>
      </div>

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {empty ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className={cx("emptyStateTitle")}>No service data available</div>
          <div className={cx("emptyStateSub")}>
            Automation job data is used to derive service health. No jobs have been recorded yet.
          </div>
        </div>
      ) : (
        <>
          {/* ── Summary stats ────────────────────────────────────────────── */}
          <div className={cx("sysStatGrid")}>

            <div className={cx("sysStatCard")}>
              <div className={cx("sysStatCardTop")}>
                <div className={cx("sysStatLabel")}>Services</div>
                <div className={cx("sysStatValue", "colorAccent")}>{totalServices}</div>
              </div>
              <div className={cx("sysStatCardDivider")} />
              <div className={cx("sysStatCardBottom")}>
                <span className={cx("sysStatDot", "dotBgAccent")} />
                <span className={cx("sysStatMeta")}>total monitored</span>
              </div>
            </div>

            <div className={cx("sysStatCard")}>
              <div className={cx("sysStatCardTop")}>
                <div className={cx("sysStatLabel")}>Operational</div>
                <div className={cx("sysStatValue", "colorGreen")}>{operationalCount}</div>
              </div>
              <div className={cx("sysStatCardDivider")} />
              <div className={cx("sysStatCardBottom")}>
                <span className={cx("sysStatDot", "dotBgGreen")} />
                <span className={cx("sysStatMeta")}>running normally</span>
              </div>
            </div>

            <div className={cx("sysStatCard")}>
              <div className={cx("sysStatCardTop")}>
                <div className={cx("sysStatLabel")}>Degraded</div>
                <div className={cx("sysStatValue", degradedCount > 0 ? "colorAmber" : "colorGreen")}>{degradedCount}</div>
              </div>
              <div className={cx("sysStatCardDivider")} />
              <div className={cx("sysStatCardBottom")}>
                <span className={cx("sysStatDot", "dynBgColor")} style={{ "--bg-color": degradedCount > 0 ? "var(--amber)" : "var(--green)" } as React.CSSProperties} />
                <span className={cx("sysStatMeta")}>{degradedCount > 0 ? "performance issues" : "all healthy"}</span>
              </div>
            </div>

            <div className={cx("sysStatCard")}>
              <div className={cx("sysStatCardTop")}>
                <div className={cx("sysStatLabel")}>Avg Uptime</div>
                <div className={cx("sysStatValue", "colorGreen", "textLg115")} >{avgUptime}</div>
              </div>
              <div className={cx("sysStatCardDivider")} />
              <div className={cx("sysStatCardBottom")}>
                <span className={cx("sysStatDot", "dotBgGreen")} />
                <span className={cx("sysStatMeta")}>30-day average</span>
              </div>
            </div>

          </div>

          {/* ── Health banner ─────────────────────────────────────────────── */}
          <div className={cx("sysHealthBanner", allClear ? "sysHealthBannerOk" : "sysHealthBannerWarn")}>
            <span className={cx("sysHealthDot", allClear ? "sysHealthDotOk" : "sysHealthDotWarn")} />
            <span className={cx("sysHealthText")}>
              {allClear
                ? "All systems are operating normally."
                : `${degradedCount} service${degradedCount !== 1 ? "s" : ""} experiencing degraded performance.`}
            </span>
          </div>

          {/* ── Service list ──────────────────────────────────────────────── */}
          <div className={cx("sysSection")}>

            <div className={cx("sysSectionHeader")}>
              <div className={cx("sysSectionTitle")}>Services</div>
            </div>

            <div className={cx("sysServiceList")}>
              {sorted.map((s, idx) => (
                <div
                  key={s.name}
                  className={cx(
                    "sysServiceRow",
                    statusStripCls(s.status),
                    idx === sorted.length - 1 && "sysServiceRowLast",
                  )}
                >

                  {/* Status indicator dot */}
                  <span className={cx("sysIndicator", s.status === "Operational" ? "sysIndicatorOk" : "sysIndicatorWarn")} />

                  {/* Service name + last incident */}
                  <div className={cx("sysServiceInfo")}>
                    <span className={cx("sysServiceName")}>{s.name}</span>
                    <div className={cx("sysIncidentRow")}>
                      <span className={cx("sysIncidentLabel")}>Last incident</span>
                      <span className={cx("sysIncidentValue", s.lastIncident === "None" ? "colorGreen" : "")}>
                        {s.lastIncident}
                      </span>
                    </div>
                  </div>

                  {/* Uptime */}
                  <div className={cx("sysUptimeCell")}>
                    <span className={cx("sysUptimeLabel")}>Uptime</span>
                    <span className={cx("sysUptimeValue", uptimeCls(s.uptime))}>{s.uptime}</span>
                  </div>

                  {/* Status badge */}
                  <span className={cx("sysStatusBadge", statusBadgeCls(s.status))}>{s.status}</span>

                </div>
              ))}
            </div>

          </div>
        </>
      )}

    </section>
  );
}
