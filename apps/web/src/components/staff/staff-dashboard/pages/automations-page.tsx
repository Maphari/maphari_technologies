"use client";

import { cx, styles } from "../style";

type StaffAutomationRow = {
  id: string;
  name: string;
  trigger: string;
  status: "active" | "watch" | "risk" | "draft";
  coverage: string;
  lastRun: string;
};

type AutomationsPageProps = {
  isActive: boolean;
  queuedNotifications: number;
  failedNotifications: number;
  openBlockers: number;
  overdueMilestones: number;
  openThreads: number;
  workflowRows: StaffAutomationRow[];
  jobs: Array<{
    id: string;
    status: string;
    tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
    readAt: string | null;
  }>;
  processingQueue: boolean;
  acknowledgingFailures: boolean;
  onProcessQueue: () => void;
  onAcknowledgeFailures: () => void;
  onOpenDeliverables: () => void;
  onOpenClients: () => void;
};

export function AutomationsPage({
  isActive,
  queuedNotifications,
  failedNotifications,
  openBlockers,
  overdueMilestones,
  openThreads,
  workflowRows,
  jobs,
  processingQueue,
  acknowledgingFailures,
  onProcessQueue,
  onAcknowledgeFailures,
  onOpenDeliverables,
  onOpenClients
}: AutomationsPageProps) {
  const recentJobs = jobs.slice(0, 8);
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-automations">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>Operations</div>
          <div className={styles.pageTitle}>Automations</div>
          <div className={styles.pageSub}>Track delivery, messaging, and escalation automations assigned to staff workflows.</div>
        </div>
        <div className={styles.pageActions}>
          <button className={cx("button", "buttonGhost")} type="button" onClick={onOpenClients}>
            Open Threads
          </button>
          <button className={cx("button", "buttonGhost")} type="button" onClick={onOpenDeliverables}>
            Open Blockers
          </button>
          <button className={cx("button", "buttonGhost")} type="button" onClick={onAcknowledgeFailures} disabled={acknowledgingFailures || failedNotifications === 0}>
            {acknowledgingFailures ? "Acknowledging..." : "Acknowledge Failures"}
          </button>
          <button className={cx("button", "buttonBlue")} type="button" onClick={onProcessQueue} disabled={processingQueue}>
            {processingQueue ? "Processing..." : "Process Queue"}
          </button>
        </div>
      </div>

      <div className={cx("stats", "stats4", "mb20")}>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentBlue")} />
          <div className={styles.statLabel}>Queue</div>
          <div className={styles.statValue}>{queuedNotifications}</div>
          <div className={styles.statSub}>Pending automation jobs</div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentRed")} />
          <div className={styles.statLabel}>Failures</div>
          <div className={styles.statValue}>{failedNotifications}</div>
          <div className={styles.statSub}><span className={failedNotifications > 0 ? styles.dn : styles.up}>{failedNotifications > 0 ? "Needs retry" : "Healthy"}</span></div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentAmber")} />
          <div className={styles.statLabel}>Open Blockers</div>
          <div className={styles.statValue}>{openBlockers}</div>
          <div className={styles.statSub}>Escalation candidates</div>
        </div>
        <div className={styles.stat}>
          <div className={cx("statAccent", "statAccentAccent")} />
          <div className={styles.statLabel}>Client Load</div>
          <div className={styles.statValue}>{openThreads + overdueMilestones}</div>
          <div className={styles.statSub}>Threads + overdue deliverables</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Staff Automation Board</span>
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
              {workflowRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>No automation workflows are configured yet.</td>
                </tr>
              ) : (
                workflowRows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.trigger}</td>
                    <td>
                      <span className={cx("badge", item.status === "active" ? "badgeGreen" : item.status === "watch" ? "badgeAmber" : item.status === "risk" ? "badgeRed" : "badgeMuted")}>
                        {item.status === "risk" ? "At Risk" : item.status === "watch" ? "Watch" : item.status === "active" ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td>{item.coverage}</td>
                    <td>{item.lastRun}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cx("card", "mt16")}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Queue Diagnostics</span>
          <span className={cx("badge", queuedNotifications > 0 ? "badgeAmber" : "badgeGreen")}>
            {queuedNotifications > 0 ? `${queuedNotifications} queued` : "Queue clear"}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Job ID</th>
                <th scope="col">Status</th>
                <th scope="col">Tab</th>
                <th scope="col">Read</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>No notification jobs yet.</td>
                </tr>
              ) : (
                recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.id.slice(0, 8)}…</td>
                    <td>
                      <span
                        className={cx(
                          "badge",
                          job.status === "FAILED"
                            ? "badgeRed"
                            : job.status === "QUEUED"
                              ? "badgeAmber"
                              : "badgeGreen"
                        )}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td>{job.tab}</td>
                    <td>{job.readAt ? "Read" : "Unread"}</td>
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
