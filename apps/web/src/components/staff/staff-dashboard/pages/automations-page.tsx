// ════════════════════════════════════════════════════════════════════════════
// automations-page.tsx — Staff Automations (self-contained API version)
// Data : GET /automation/jobs → AutomationJob[]
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useMemo } from "react";
import { cx, styles } from "../style";
import {
  getAutomationJobs,
  acknowledgeAutomationFailures,
  retryAutomationFailed,
  type AutomationJob,
  type AutomationJobStatus,
} from "../../../../lib/api/staff/automation";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";

// ── Derived workflow row (from automation jobs) ──────────────────────────────

type DerivedWorkflowRow = {
  id: string;
  name: string;
  trigger: string;
  status: "active" | "watch" | "risk" | "draft";
  coverage: string;
  lastRun: string;
};

// ── SVG Icons ────────────────────────────────────────────────────────────────

function IcoThreads() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 2.5h10a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H4L1.5 11.5V3a.5.5 0 0 1 .5-.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function IcoBlocker() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IcoAck() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoProcess() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M12 7A5 5 0 1 1 7 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7 2l2-2M7 2L5 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IcoRead() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1.5 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoDot() {
  return (
    <svg width="7" height="7" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <circle cx="4" cy="4" r="3.5" fill="currentColor" />
    </svg>
  );
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<DerivedWorkflowRow["status"], { label: string; badge: string; dotCls: string }> = {
  active: { label: "Active",   badge: "badgeGreen", dotCls: "atmDotGreen"  },
  watch:  { label: "Watch",    badge: "badgeAmber", dotCls: "atmDotAmber"  },
  risk:   { label: "At Risk",  badge: "badgeRed",   dotCls: "atmDotRed"    },
  draft:  { label: "Draft",    badge: "badgeMuted", dotCls: "atmDotMuted"  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function deriveWorkflowRows(jobs: AutomationJob[]): DerivedWorkflowRow[] {
  // Group jobs by workflow
  const byWorkflow = new Map<string, AutomationJob[]>();
  for (const j of jobs) {
    const key = j.workflow || "unknown";
    const arr = byWorkflow.get(key) ?? [];
    arr.push(j);
    byWorkflow.set(key, arr);
  }

  const rows: DerivedWorkflowRow[] = [];
  for (const [workflow, wJobs] of byWorkflow) {
    const hasFailed   = wJobs.some((j) => j.status === "failed" || j.status === "dead-lettered");
    const hasActive   = wJobs.some((j) => j.status === "processing" || j.status === "received");
    const hasSuccess  = wJobs.some((j) => j.status === "succeeded");
    const latest      = wJobs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

    let status: DerivedWorkflowRow["status"] = "draft";
    if (hasFailed)       status = "risk";
    else if (hasActive)  status = "watch";
    else if (hasSuccess) status = "active";

    const topicSet = new Set(wJobs.map((j) => j.topic));
    rows.push({
      id:       workflow,
      name:     workflow.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      trigger:  [...topicSet].join(", ") || "Event-driven",
      status,
      coverage: `${wJobs.length} job${wJobs.length !== 1 ? "s" : ""}`,
      lastRun:  latest ? fmtRelative(latest.updatedAt) : "Never",
    });
  }

  return rows;
}

// ── Props ────────────────────────────────────────────────────────────────────

type AutomationsPageProps = {
  isActive: boolean;
  session: AuthSession | null;
  onOpenDeliverables: () => void;
  onOpenClients: () => void;
};

// ── Page component ───────────────────────────────────────────────────────────

export function AutomationsPage({
  isActive,
  session,
  onOpenDeliverables,
  onOpenClients,
}: AutomationsPageProps) {
  const [jobs, setJobs]           = useState<AutomationJob[]>([]);
  const [loading, setLoading]     = useState(true);
  const [acking, setAcking]       = useState(false);
  const [retrying, setRetrying]   = useState(false);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    void getAutomationJobs(session, 50).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      setJobs(result.data ?? []);
    }).catch(() => {
      // keep previous state on error
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  // Derived stats
  const queuedNotifications = useMemo(() => jobs.filter((j) => j.status === "received" || j.status === "processing").length, [jobs]);
  const failedNotifications = useMemo(() => jobs.filter((j) => j.status === "failed" || j.status === "dead-lettered").length, [jobs]);
  const succeededCount      = useMemo(() => jobs.filter((j) => j.status === "succeeded").length, [jobs]);
  const workflowRows        = useMemo(() => deriveWorkflowRows(jobs), [jobs]);

  const activeWorkflows  = workflowRows.filter((r) => r.status === "active").length;
  const watchWorkflows   = workflowRows.filter((r) => r.status === "watch").length;
  const riskWorkflows    = workflowRows.filter((r) => r.status === "risk").length;
  const draftWorkflows   = workflowRows.filter((r) => r.status === "draft").length;

  const recentJobs = jobs.slice(0, 8);

  async function handleAcknowledge(): Promise<void> {
    if (!session || acking) return;
    setAcking(true);
    const result = await acknowledgeAutomationFailures(session);
    if (result.nextSession) saveSession(result.nextSession);
    // Optimistically update UI: mark all dead-lettered jobs as acknowledged
    setJobs((prev) =>
      prev.map((j) =>
        j.status === "dead-lettered" ? { ...j, status: "acknowledged" as AutomationJobStatus } : j
      )
    );
    setAcking(false);
  }

  async function handleRetryFailed(): Promise<void> {
    if (!session || retrying) return;
    setRetrying(true);
    const result = await retryAutomationFailed(session);
    if (result.nextSession) saveSession(result.nextSession);
    // Optimistically update UI: mark all failed/dead-lettered jobs as acknowledged
    setJobs((prev) =>
      prev.map((j) =>
        j.status === "failed" || j.status === "dead-lettered"
          ? { ...j, status: "acknowledged" as AutomationJobStatus }
          : j
      )
    );
    setRetrying(false);
  }

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-automations">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-automations">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("flexBetween", "gap24", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Operations</div>
            <h1 className={cx("pageTitleText")}>Automations</h1>
            <p className={cx("pageSubtitleText")}>Track delivery, messaging, and escalation automations assigned to staff workflows.</p>
          </div>
          <div className={cx("pageActions")}>
            <button className={cx("button", "buttonGhost", "atmBtn")} type="button" onClick={onOpenClients}>
              <span className={cx("atmBtnIco")}><IcoThreads /></span>
              Open Threads
            </button>
            <button className={cx("button", "buttonGhost", "atmBtn")} type="button" onClick={onOpenDeliverables}>
              <span className={cx("atmBtnIco")}><IcoBlocker /></span>
              Open Blockers
            </button>
            <button
              className={cx("button", "buttonGhost", "atmBtn")}
              type="button"
              disabled={acking || failedNotifications === 0}
              onClick={() => void handleAcknowledge()}
              title={failedNotifications === 0 ? "No failures to acknowledge" : "Mark all dead-lettered jobs as acknowledged"}
            >
              <span className={cx("atmBtnIco")}><IcoAck /></span>
              {acking ? "Acknowledging…" : "Acknowledge Failures"}
            </button>
            <button
              className={cx("button", "buttonBlue", "atmBtn")}
              type="button"
              disabled={retrying || (failedNotifications === 0 && queuedNotifications === 0)}
              onClick={() => void handleRetryFailed()}
              title={(failedNotifications === 0 && queuedNotifications === 0) ? "No jobs to process" : "Clear failed jobs from the queue"}
            >
              <span className={cx("atmBtnIco")}><IcoProcess /></span>
              {retrying ? "Processing…" : "Process Queue"}
            </button>
          </div>
        </div>
      </div>

      <div className={cx("atmStatGrid", "mb20")}>
        {/* Row 1 -- Queue health */}
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentBlue")} />
          <div className={styles.statLabel}>Queue</div>
          <div className={styles.statValue}>{loading ? "\u2026" : queuedNotifications}</div>
          <div className={styles.statSub}>Pending jobs</div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentRed")} />
          <div className={styles.statLabel}>Failures</div>
          <div className={styles.statValue}>{loading ? "\u2026" : failedNotifications}</div>
          <div className={styles.statSub}>
            <span className={failedNotifications > 0 ? styles.dn : styles.up}>
              {failedNotifications > 0 ? "Needs retry" : "Healthy"}
            </span>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentGreen")} />
          <div className={styles.statLabel}>Succeeded</div>
          <div className={styles.statValue}>{loading ? "\u2026" : succeededCount}</div>
          <div className={styles.statSub}>Completed jobs</div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentAccent")} />
          <div className={styles.statLabel}>Total Jobs</div>
          <div className={styles.statValue}>{loading ? "\u2026" : jobs.length}</div>
          <div className={styles.statSub}>All time</div>
        </div>
        {/* Row 2 -- Workflow status breakdown */}
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentGreen")} />
          <div className={styles.statLabel}>Active</div>
          <div className={styles.statValue}>{loading ? "\u2026" : activeWorkflows}</div>
          <div className={styles.statSub}>Running workflows</div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentAmber")} />
          <div className={styles.statLabel}>Watch</div>
          <div className={styles.statValue}>{loading ? "\u2026" : watchWorkflows}</div>
          <div className={styles.statSub}>Needs monitoring</div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentRed")} />
          <div className={styles.statLabel}>At Risk</div>
          <div className={styles.statValue}>{loading ? "\u2026" : riskWorkflows}</div>
          <div className={styles.statSub}>
            <span className={riskWorkflows > 0 ? styles.dn : styles.up}>
              {riskWorkflows > 0 ? "Intervention needed" : "None at risk"}
            </span>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentMuted")} />
          <div className={styles.statLabel}>Draft</div>
          <div className={styles.statValue}>{loading ? "\u2026" : draftWorkflows}</div>
          <div className={styles.statSub}>Unpublished</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Staff Automation Board</span>
          <span className={cx("badge", workflowRows.length ? "badgeGreen" : "badgeMuted")}>
            {loading ? "\u2026" : `${workflowRows.length} workflow${workflowRows.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Workflow</th>
                <th scope="col">Trigger</th>
                <th scope="col">Status</th>
                <th scope="col">Coverage</th>
                <th scope="col">Last Run</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>Loading automation workflows\u2026</td>
                </tr>
              ) : workflowRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>No automation workflows are configured yet.</td>
                </tr>
              ) : (
                workflowRows.map((item) => {
                  const cfg = STATUS_CFG[item.status];
                  return (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td><span className={cx("atmTrigger")}>{item.trigger}</span></td>
                      <td>
                        <span className={cx("atmStatusCell")}>
                          <span className={cx("atmDot", cfg.dotCls)}><IcoDot /></span>
                          <span className={cx("badge", cfg.badge)}>{cfg.label}</span>
                        </span>
                      </td>
                      <td>{item.coverage}</td>
                      <td><span className={cx("atmLastRun")}>{item.lastRun}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cx("card", "mt16")}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Queue Diagnostics</span>
          <span className={cx("badge", queuedNotifications > 0 ? "badgeAmber" : "badgeGreen")}>
            {loading ? "\u2026" : queuedNotifications > 0 ? `${queuedNotifications} queued` : "Queue clear"}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Job ID</th>
                <th scope="col">Status</th>
                <th scope="col">Workflow</th>
                <th scope="col">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>Loading jobs\u2026</td>
                </tr>
              ) : recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>No automation jobs yet.</td>
                </tr>
              ) : (
                recentJobs.map((job) => (
                  <tr key={job.jobId}>
                    <td><span className={cx("atmJobId")}>{job.jobId.slice(0, 8)}\u2026</span></td>
                    <td>
                      <span className={cx("badge",
                        job.status === "failed" || job.status === "dead-lettered" ? "badgeRed" :
                        job.status === "received" || job.status === "processing"  ? "badgeAmber" : "badgeGreen"
                      )}>
                        {job.status}
                      </span>
                    </td>
                    <td><span className={cx("atmTabChip")}>{job.workflow || "\u2014"}</span></td>
                    <td>
                      <span className={cx("atmReadCell")}>
                        {job.attempts}/{job.maxAttempts}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
