// ════════════════════════════════════════════════════════════════════════════
// incident-alerts-page.tsx — Staff Incident Alerts
// Data : GET /automation/jobs  + GET /automation/dead-letters
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import {
  getAutomationJobs,
  getAutomationDeadLetters,
  type AutomationJob,
  type AutomationJobStatus,
} from "@/lib/api/staff";
import { saveSession, type AuthSession } from "@/lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type IncidentAlertsPageProps = {
  isActive: boolean;
  session: AuthSession | null;
};

// ── Derived incident model ────────────────────────────────────────────────────

type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";
type Status   = "Active" | "Scheduled" | "Resolved";
type Role     = "Monitor" | "Aware" | "None";

interface Incident {
  id:        string;
  title:     string;
  severity:  Severity;
  status:    Status;
  startedAt: string;
  role:      Role;
  action:    string;
}

// ── Mapping helpers ──────────────────────────────────────────────────────────

function mapJobToIncident(job: AutomationJob): Incident {
  return {
    id:        job.jobId,
    title:     `${job.workflow} — ${job.topic}${job.lastError ? ` (${job.lastError})` : ""}`,
    severity:  mapSeverity(job.status, job.attempts, job.maxAttempts),
    status:    mapStatus(job.status),
    startedAt: formatDate(job.createdAt),
    role:      mapRole(job.status),
    action:    mapAction(job),
  };
}

function mapSeverity(s: AutomationJobStatus, attempts: number, maxAttempts: number): Severity {
  if (s === "dead-lettered") return "Critical";
  if (s === "failed") return attempts >= maxAttempts ? "High" : "Medium";
  if (s === "processing") return "Info";
  if (s === "succeeded" || s === "skipped-duplicate") return "Low";
  return "Info";
}

function mapStatus(s: AutomationJobStatus): Status {
  if (s === "dead-lettered" || s === "failed") return "Active";
  if (s === "received" || s === "processing") return "Scheduled";
  return "Resolved";
}

function mapRole(s: AutomationJobStatus): Role {
  if (s === "dead-lettered") return "Monitor";
  if (s === "failed") return "Aware";
  return "None";
}

function mapAction(job: AutomationJob): string {
  if (job.status === "dead-lettered") return `Dead-lettered after ${job.attempts}/${job.maxAttempts} attempts. Manual retry required.`;
  if (job.status === "failed") return `Failed attempt ${job.attempts}/${job.maxAttempts}. Auto-retry pending.`;
  if (job.status === "processing") return "Currently processing — monitor for completion.";
  return "No action required";
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ── Classification helpers ────────────────────────────────────────────────────

const STATUS_ORDER: Record<string, number> = { Active: 0, Scheduled: 1, Resolved: 2 };

function statusBadgeCls(s: Status): string {
  if (s === "Active")    return "incStatusActive";
  if (s === "Scheduled") return "incStatusScheduled";
  return "incStatusResolved";
}

function statusStripCls(s: Status): string {
  if (s === "Active")    return "incCardActive";
  if (s === "Scheduled") return "incCardScheduled";
  return "";
}

function severityBadgeCls(s: Severity): string {
  if (s === "Critical" || s === "High") return "incSeverityHigh";
  if (s === "Medium")                   return "incSeverityMedium";
  if (s === "Low")                      return "incSeverityLow";
  return "incSeverityInfo";
}

function roleCls(r: Role): string {
  if (r === "Monitor") return "incRoleMonitor";
  if (r === "Aware")   return "incRoleAware";
  return "incRoleNone";
}

function actionRequired(r: Role): boolean {
  return r !== "None";
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className={cx("incStatCard", "opacity50")}>
      <div className={cx("incStatCardTop")}>
        <div className={cx("skeleBlock10x50p")} />
        <div className={cx("skeleBlock22x35p")} />
      </div>
      <div className={cx("incStatCardDivider")} />
      <div className={cx("skeleBlock9x60p")} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={cx("incCard", "opacity45")}>
      <div className={cx("incCardHead")}>
        <div className={cx("skeleBlock12x70px")} />
        <div className={cx("flexRow", "gap6")}>
          <div className={cx("skeleBlock18x52px")} />
          <div className={cx("skeleBlock18x52px")} />
        </div>
      </div>
      <div className={cx("skeleBlock14x75p")} />
      <div className={cx("skeleBlock10x55p")} />
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function IncidentAlertsPage({ isActive, session }: IncidentAlertsPageProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;
    let cancelled = false;

    setLoading(true);

    Promise.all([
      getAutomationJobs(session, 50),
      getAutomationDeadLetters(session, 50),
    ]).then(([jobsResult, deadResult]) => {
      if (cancelled) return;

      if (jobsResult.nextSession) saveSession(jobsResult.nextSession);
      if (deadResult.nextSession) saveSession(deadResult.nextSession);

      const jobItems    = (jobsResult.data ?? []).filter((j) => j.status === "failed" || j.status === "processing" || j.status === "received");
      const deadItems   = deadResult.data ?? [];
      const seenIds     = new Set<string>();
      const merged: AutomationJob[] = [];

      for (const item of [...deadItems, ...jobItems]) {
        if (!seenIds.has(item.jobId)) {
          seenIds.add(item.jobId);
          merged.push(item);
        }
      }

      setIncidents(merged.map(mapJobToIncident));
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken]);

  // ── Derived counts ──────────────────────────────────────────────────────────
  const totalIncidents = incidents.length;
  const activeCount    = incidents.filter((i) => i.status === "Active").length;
  const scheduledCount = incidents.filter((i) => i.status === "Scheduled").length;
  const resolvedCount  = incidents.filter((i) => i.status === "Resolved").length;

  const sorted = [...incidents].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99),
  );

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-incident-alerts">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Governance</div>
        <h1 className={cx("pageTitleText")}>Incident Alerts</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Crisis role assignments and required actions</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("incStatGrid")}>
        {loading ? (
          [1, 2, 3, 4].map((n) => <SkeletonStat key={n} />)
        ) : (
          <>
            <div className={cx("incStatCard")}>
              <div className={cx("incStatCardTop")}>
                <div className={cx("incStatLabel")}>Total</div>
                <div className={cx("incStatValue", "colorAccent")}>{totalIncidents}</div>
              </div>
              <div className={cx("incStatCardDivider")} />
              <div className={cx("incStatCardBottom")}>
                <span className={cx("incStatDot", "dotBgAccent")} />
                <span className={cx("incStatMeta")}>being tracked</span>
              </div>
            </div>

            <div className={cx("incStatCard")}>
              <div className={cx("incStatCardTop")}>
                <div className={cx("incStatLabel")}>Active</div>
                <div className={cx("incStatValue", activeCount > 0 ? "colorRed" : "colorGreen")}>{activeCount}</div>
              </div>
              <div className={cx("incStatCardDivider")} />
              <div className={cx("incStatCardBottom")}>
                <span className={cx("incStatDot", "dynBgColor")} style={{ "--bg-color": activeCount > 0 ? "var(--red)" : "var(--green)" } as React.CSSProperties} />
                <span className={cx("incStatMeta")}>{activeCount > 0 ? "needs attention" : "none active"}</span>
              </div>
            </div>

            <div className={cx("incStatCard")}>
              <div className={cx("incStatCardTop")}>
                <div className={cx("incStatLabel")}>Scheduled</div>
                <div className={cx("incStatValue", scheduledCount > 0 ? "colorAmber" : "colorGreen")}>{scheduledCount}</div>
              </div>
              <div className={cx("incStatCardDivider")} />
              <div className={cx("incStatCardBottom")}>
                <span className={cx("incStatDot", "dynBgColor")} style={{ "--bg-color": scheduledCount > 0 ? "var(--amber)" : "var(--green)" } as React.CSSProperties} />
                <span className={cx("incStatMeta")}>{scheduledCount > 0 ? "upcoming" : "none scheduled"}</span>
              </div>
            </div>

            <div className={cx("incStatCard")}>
              <div className={cx("incStatCardTop")}>
                <div className={cx("incStatLabel")}>Resolved</div>
                <div className={cx("incStatValue", "colorGreen")}>{resolvedCount}</div>
              </div>
              <div className={cx("incStatCardDivider")} />
              <div className={cx("incStatCardBottom")}>
                <span className={cx("incStatDot", "dotBgGreen")} />
                <span className={cx("incStatMeta")}>closed out</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Incident list ─────────────────────────────────────────────────── */}
      <div className={cx("incSection")}>

        <div className={cx("incSectionHeader")}>
          <div className={cx("incSectionTitle")}>All Incidents</div>
          <span className={cx("incSectionMeta")}>
            {loading ? "LOADING\u2026" : `${incidents.length} ALERT${incidents.length !== 1 ? "S" : ""}`}
          </span>
        </div>

        <div className={cx("incList")}>
          {loading ? (
            [1, 2, 3].map((n) => <SkeletonCard key={n} />)
          ) : sorted.length === 0 ? (
            <div className={cx("incCard", "textCenter", "opacity60", "p32x16")} >
              <div className={cx("incTitle")}>No active incidents</div>
              <div className={cx("incMetaValue", "mt6")}>All systems are operating normally.</div>
            </div>
          ) : (
            sorted.map((i, idx) => (
              <div
                key={i.id}
                className={cx(
                  "incCard",
                  statusStripCls(i.status),
                  idx === sorted.length - 1 && "incCardLast",
                )}
              >

                {/* Head: ID + badges */}
                <div className={cx("incCardHead")}>
                  <span className={cx("incIncidentId")}>{i.id.slice(0, 12)}</span>
                  <div className={cx("incBadgeRow")}>
                    <span className={cx("incSeverityBadge", severityBadgeCls(i.severity))}>{i.severity}</span>
                    <span className={cx("incStatusBadge", statusBadgeCls(i.status))}>{i.status}</span>
                  </div>
                </div>

                {/* Title */}
                <div className={cx("incTitle")}>{i.title}</div>

                {/* Meta: started + role */}
                <div className={cx("incMetaRow")}>
                  <div className={cx("incMetaCell")}>
                    <span className={cx("incMetaLabel")}>Started</span>
                    <span className={cx("incMetaValue")}>{i.startedAt}</span>
                  </div>
                  <div className={cx("incMetaDivider")} />
                  <div className={cx("incMetaCell")}>
                    <span className={cx("incMetaLabel")}>Your Role</span>
                    <span className={cx("incRoleBadge", roleCls(i.role))}>{i.role}</span>
                  </div>
                </div>

                {/* Action block */}
                <div className={cx("incActionWrap", actionRequired(i.role) ? "incActionWrapActive" : "incActionWrapNone")}>
                  <span className={cx("incActionLabel")}>{actionRequired(i.role) ? "Action Required" : "No Action"}</span>
                  <span className={cx("incActionText")}>{i.action}</span>
                </div>


              </div>
            ))
          )}
        </div>

      </div>

    </section>
  );
}
