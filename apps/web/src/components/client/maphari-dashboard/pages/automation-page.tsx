import { cx, styles } from "../style";

type ClientAutomationRow = {
  id: string;
  name: string;
  trigger: string;
  status: "active" | "watch" | "risk" | "draft";
  impact: string;
  lastEvent: string;
};

type ClientAutomationPageProps = {
  active: boolean;
  queuedJobs: number;
  overdueInvoices: number;
  pendingApprovals: number;
  openBlockers: number;
  workflowRows: ClientAutomationRow[];
  onOpenMessages: () => void;
  onOpenInvoices: () => void;
  onOpenProjects: () => void;
};

export function ClientAutomationPage({
  active,
  queuedJobs,
  overdueInvoices,
  pendingApprovals,
  openBlockers,
  workflowRows,
  onOpenMessages,
  onOpenInvoices,
  onOpenProjects
}: ClientAutomationPageProps) {
  return (
    <section className={cx("page", active && "pageActive")} id="page-automation">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>Operations</div>
          <div className={styles.pageTitle}>Automations</div>
          <div className={styles.pageSub}>Visibility into automations affecting your project updates, invoices, and approvals.</div>
        </div>
        <div className={styles.pageActions}>
          <button className={cx("button", "buttonGhost")} type="button" onClick={onOpenProjects}>Open Projects</button>
          <button className={cx("button", "buttonAccent")} type="button" onClick={onOpenMessages}>Open Messages</button>
        </div>
      </div>

      <div className={cx("stats", "stats4")} style={{ marginBottom: 20 }}>
        <div className={styles.stat}>
          <div className={styles.statTopBar} style={{ background: "var(--accent)" }} />
          <div className={styles.statLabel}>Queued Jobs</div>
          <div className={styles.statValue}>{queuedJobs}</div>
          <div className={styles.statDelta}>Pending client-facing updates</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statTopBar} style={{ background: "var(--red)" }} />
          <div className={styles.statLabel}>Overdue Invoices</div>
          <div className={styles.statValue}>{overdueInvoices}</div>
          <div className={cx("statDelta", overdueInvoices > 0 ? "dn" : "up")}>
            {overdueInvoices > 0 ? "Needs attention" : "No overdue invoices"}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statTopBar} style={{ background: "var(--amber)" }} />
          <div className={styles.statLabel}>Pending Approvals</div>
          <div className={styles.statValue}>{pendingApprovals}</div>
          <div className={styles.statDelta}>Milestones awaiting your decision</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statTopBar} style={{ background: "var(--purple)" }} />
          <div className={styles.statLabel}>Open Blockers</div>
          <div className={styles.statValue}>{openBlockers}</div>
          <div className={styles.statDelta}>
            <span style={{ cursor: "pointer" }} onClick={onOpenInvoices}>Review from finance + project tabs</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Client Automation Streams</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Impact</th>
              <th>Last Event</th>
            </tr>
          </thead>
          <tbody>
            {workflowRows.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>No client automation workflows found yet.</td>
              </tr>
            ) : (
              workflowRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.trigger}</td>
                  <td>
                    <span className={cx("badge", row.status === "active" ? "bgGreen" : row.status === "watch" ? "bgAmber" : row.status === "risk" ? "bgRed" : "bgMuted")}>
                      {row.status === "risk" ? "At Risk" : row.status === "watch" ? "Watch" : row.status === "active" ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td>{row.impact}</td>
                  <td>{row.lastEvent}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
