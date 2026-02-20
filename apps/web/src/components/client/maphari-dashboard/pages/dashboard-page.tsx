import { cx, styles } from "../style";
import { capitalize } from "../utils";
import type {
  ActionCenterItem,
  ActionItem,
  ActivityItem,
  ApprovalQueueItem,
  ConfidenceSummary,
  DecisionLogItem,
  DashboardStat,
  LoginDigestItem,
  OnboardingChecklistItem,
  RiskItem,
  ThreadPreview,
  TimelineItem
} from "../types";
import type { InvoiceSummaryRow, MilestoneRow, ProjectRow } from "./types";

type DashboardPageProps = {
  active: boolean;
  userGreetingName: string;
  lastSyncedLabel: string;
  projectDetailsLoading: boolean;
  dashboardStats: DashboardStat[];
  projectRows: ProjectRow[];
  animateProgress: boolean;
  actionCenter: ActionCenterItem[];
  milestoneRows: MilestoneRow[];
  recentThreads: ThreadPreview[];
  invoiceRows: InvoiceSummaryRow[];
  nextActions: ActionItem[];
  activityFeed: ActivityItem[];
  timelineItems: TimelineItem[];
  onboardingChecklist: OnboardingChecklistItem[];
  digestItems: LoginDigestItem[];
  approvalQueue: ApprovalQueueItem[];
  decisionLog: DecisionLogItem[];
  slaAlerts: RiskItem[];
  confidenceSummary: ConfidenceSummary;
  handoffSummary: {
    docs: number;
    decisions: number;
    blockers: number;
    generatedAt: string;
  } | null;
  onGenerateHandoff: () => void;
  onOpenProjects: () => void;
  onOpenMessages: () => void;
  onOpenInvoices: () => void;
  onOpenThread: (threadId: string) => void;
  onOpenInvoice: (invoiceId: string) => void;
  onOpenActionItem: (id: string) => void;
  onOpenRiskItem: (id: string) => void;
  onOpenActivityItem: (id: string) => void;
  onOpenTimelineItem: (id: string) => void;
  onOpenApprovalItem: (id: string) => void;
  onOpenDecisionItem: (id: string) => void;
  onApproveMilestone: (milestoneId: string) => void;
  onRejectMilestone: (milestoneId: string) => void;
};

export function ClientDashboardPage({
  active,
  userGreetingName,
  lastSyncedLabel,
  projectDetailsLoading,
  dashboardStats,
  projectRows,
  animateProgress,
  actionCenter,
  milestoneRows,
  recentThreads,
  invoiceRows,
  nextActions,
  activityFeed,
  timelineItems,
  onboardingChecklist,
  digestItems,
  approvalQueue,
  decisionLog,
  slaAlerts,
  confidenceSummary,
  handoffSummary,
  onGenerateHandoff,
  onOpenProjects,
  onOpenMessages,
  onOpenInvoices,
  onOpenThread,
  onOpenInvoice,
  onOpenActionItem,
  onOpenRiskItem,
  onOpenActivityItem,
  onOpenTimelineItem,
  onOpenApprovalItem,
  onOpenDecisionItem,
  onApproveMilestone,
  onRejectMilestone
}: DashboardPageProps) {
  const openTarget = (target: ActionCenterItem["target"]) => {
    if (target === "projects") {
      onOpenProjects();
      return;
    }
    if (target === "invoices") {
      onOpenInvoices();
      return;
    }
    onOpenMessages();
  };

  return (
    <section className={cx("page", active && "pageActive")} id="page-dashboard">
      <div className={styles.pageHeader} id="tour-page-dashboard">
        <div>
          <div className={styles.pageEyebrow}>Good morning, {userGreetingName}</div>
          <div className={styles.pageTitle}>Your Project Overview</div>
          <div className={styles.pageSub}>Here&apos;s where everything stands across your active engagements.</div>
        </div>
        <div className={styles.pageActions}>
          <button className={cx("button", "buttonGhost")} type="button" onClick={onOpenProjects}>View Projects</button>
          <button className={cx("button", "buttonAccent")} type="button" onClick={onOpenMessages}>Message Team</button>
        </div>
      </div>

      <div className={styles.pageMetaRow}>
        <div className={styles.pageMetaItem}>
          <span className={styles.pageMetaLabel}>Last synced</span>
          <span className={styles.pageMetaValue}>{lastSyncedLabel}</span>
        </div>
        {projectDetailsLoading ? <span className={styles.pageMetaHint}>Refreshing project details…</span> : null}
      </div>

      <div className={cx("stats", "stats4")} role="region" aria-label="Action center">
        {actionCenter.map((item) => (
          <div
            key={item.id}
            className={styles.stat}
            role="button"
            tabIndex={0}
            onClick={() => openTarget(item.target)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openTarget(item.target);
              }
            }}
            style={{ cursor: "none" }}
          >
            <div
              className={styles.statTopBar}
              style={{
                background:
                  item.tone === "red"
                    ? "var(--red)"
                    : item.tone === "amber"
                    ? "var(--amber)"
                    : item.tone === "purple"
                    ? "var(--purple)"
                    : "var(--accent)"
              }}
            />
            <div className={styles.statLabel}>{item.label}</div>
            <div className={styles.statValue} style={{ fontSize: "1.4rem" }}>{item.value}</div>
            <div className={cx("statDelta", item.tone === "red" ? "deltaDown" : item.tone === "amber" ? "deltaWarn" : "deltaUp")}>
              {item.detail}
            </div>
          </div>
        ))}
      </div>

      <div className={cx("stats", "stats4")}>
        {dashboardStats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <div className={styles.statTopBar} style={{ background: stat.tone }} />
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={cx("statDelta", stat.deltaTone && stat.deltaTone)}>{stat.delta}</div>
          </div>
        ))}
      </div>

      <div className={styles.grid32}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Active Projects</span>
            <button
              type="button"
              className={styles.cardLink}
              style={{ appearance: "none", WebkitAppearance: "none", background: "none", border: "none", padding: 0 }}
              onClick={onOpenProjects}
            >
              All projects →
            </button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {projectRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>No projects available yet.</td>
                </tr>
              ) : (
                projectRows.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className={styles.tableName}>{project.name}</div>
                      <div className={styles.tableSub}>{project.subtitle}</div>
                    </td>
                    <td><span className={cx("badge", project.statusTone)}>{project.status}</span></td>
                    <td>
                      <div className={styles.progressRow}>
                        <div className={styles.progressBar}>
                          <div
                            className={cx("progressFill", project.progressTone)}
                            style={{ width: animateProgress ? `${project.progress}%` : "0%" }}
                          />
                        </div>
                        <span className={styles.progressPct}>{project.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.mono} style={{ fontSize: "0.72rem", color: project.dueTone }}>{project.due}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>Next Milestones</span></div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            {milestoneRows.length === 0 ? (
              <div className={styles.emptyState}>No milestones scheduled yet.</div>
            ) : (
              <div className={styles.milestoneList}>
                {milestoneRows.map((milestone) => {
                  const statusClass = milestone.status ? `milestone${capitalize(milestone.status)}` : null;
                  return (
                    <div key={milestone.id} className={styles.milestoneItem}>
                      <div className={cx("milestoneCheck", statusClass)}>
                        {milestone.status === "done" ? "✓" : milestone.status === "now" ? "→" : ""}
                      </div>
                      <div>
                        <div className={styles.milestoneTitle} style={milestone.highlight ? { color: "var(--accent)" } : milestone.status === "" ? { color: "var(--muted)" } : undefined}>
                          {milestone.title}
                        </div>
                        <div className={styles.milestoneDate} style={milestone.highlight ? { color: "var(--accent)" } : undefined}>
                          {milestone.date}
                        </div>
                        <div className={styles.milestoneDate} style={{ color: "var(--muted)" }}>
                          Approval: {milestone.approval}
                        </div>
                        {milestone.fileName ? (
                          <div className={styles.milestoneDate} style={{ color: "var(--muted)" }}>
                            Attachment: {milestone.fileName}
                          </div>
                        ) : null}
                        {milestone.approval === "PENDING" ? (
                          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                            <button
                              type="button"
                              className={cx("button", "buttonGreen")}
                              style={{ padding: "4px 10px", fontSize: "0.58rem" }}
                              onClick={() => onApproveMilestone(milestone.id)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className={cx("button", "buttonGhost")}
                              style={{ padding: "4px 10px", fontSize: "0.58rem" }}
                              onClick={() => onRejectMilestone(milestone.id)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Recent Messages</span>
            <button
              type="button"
              className={styles.cardLink}
              style={{ appearance: "none", WebkitAppearance: "none", background: "none", border: "none", padding: 0 }}
              onClick={onOpenMessages}
            >
              Open inbox →
            </button>
          </div>
          <div>
            {recentThreads.length === 0 ? (
              <div className={styles.cardBody} style={{ paddingTop: 12, paddingBottom: 12 }}>
                <div className={styles.emptyState}>No recent messages yet.</div>
                <button className={cx("button", "buttonGhost")} type="button" style={{ marginTop: 8 }} onClick={onOpenMessages}>
                  Start conversation
                </button>
              </div>
            ) : (
              recentThreads.map((thread, index) => (
                <button
                  key={thread.id}
                  type="button"
                  className={cx("threadItem", index === 0 && "threadItemActive")}
                  style={{ width: "100%", textAlign: "left", background: "transparent", border: "none" }}
                  onClick={() => onOpenThread(thread.id)}
                >
                  <div className={styles.threadAvatar} style={{ background: thread.avatar.bg, color: thread.avatar.color }}>{thread.avatar.label}</div>
                  <div className={styles.threadBody}>
                    <div className={styles.threadMeta}>
                      <span className={styles.threadSender} style={{ color: "var(--text)" }}>{thread.sender}</span>
                      <span className={styles.threadTime}>{thread.time}</span>
                    </div>
                    <div className={styles.threadProject}>{thread.project}</div>
                    <div className={styles.threadPreview}>{thread.preview}</div>
                  </div>
                  {thread.unread ? <div className={styles.unreadDot} /> : null}
                </button>
              ))
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Recent Invoices</span>
            <button
              type="button"
              className={styles.cardLink}
              style={{ appearance: "none", WebkitAppearance: "none", background: "none", border: "none", padding: 0 }}
              onClick={onOpenInvoices}
            >
              All invoices →
            </button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>
                    <div>No invoices found for this view.</div>
                    <button className={cx("button", "buttonGhost")} type="button" style={{ marginTop: 8 }} onClick={onOpenInvoices}>
                      Open billing
                    </button>
                  </td>
                </tr>
              ) : (
                invoiceRows.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <div className={styles.invoiceNumber}>{invoice.id}</div>
                      <div className={styles.tableSub}>{invoice.issued}</div>
                    </td>
                    <td><span className={styles.invoiceAmount} style={{ color: invoice.amountTone }}>{invoice.amount}</span></td>
                    <td><span className={cx("badge", `bg${capitalize(invoice.badge.tone)}`)}>{invoice.badge.label}</span></td>
                    <td>
                      <button
                        className={cx("button", invoice.action.tone === "accent" ? "buttonAccent" : "buttonGhost")}
                        type="button"
                        style={{ padding: "5px 12px", fontSize: "0.62rem" }}
                        onClick={() => onOpenInvoice(invoice.sourceId)}
                      >
                        {invoice.action.label}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Onboarding Checklist</span>
            <span className={styles.cardLink}>Client readiness</span>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            {onboardingChecklist.length === 0 ? (
              <div className={styles.emptyState}>No onboarding requirements yet.</div>
            ) : (
              <div className={styles.actionList}>
                {onboardingChecklist.map((item) => (
                  <div key={item.id} className={styles.actionItem}>
                    <span className={cx("actionDot", item.status === "done" ? "actionDotAccent" : "actionDotAmber")} />
                    <div>
                      <div className={styles.actionTitle}>{item.label}</div>
                      <div className={styles.actionMeta}>{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Changes Since Last Login</span>
            <span className={styles.cardLink}>Auto digest</span>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            {digestItems.length === 0 ? (
              <div className={styles.emptyState}>No major updates since your last sign-in.</div>
            ) : (
              <div className={styles.activityList}>
                {digestItems.map((item) => (
                  <div key={item.id} className={styles.activityItem}>
                    <span className={cx("activityIcon", "activityIconPurple")}>Δ</span>
                    <div>
                      <div className={styles.activityTitle}>{item.change}</div>
                      <div className={styles.activityDetail}>Impact: {item.impact}</div>
                      <div className={styles.activityDetail}>Next: {item.action}</div>
                    </div>
                    <span className={styles.activityTime}>{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Approval Queue</span>
            <button
              type="button"
              className={styles.cardLink}
              style={{ appearance: "none", WebkitAppearance: "none", background: "none", border: "none", padding: 0 }}
              onClick={onOpenProjects}
            >
              Open projects →
            </button>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            {approvalQueue.length === 0 ? (
              <div className={styles.emptyState}>No approvals waiting right now.</div>
            ) : (
              <div className={styles.actionList}>
                {approvalQueue.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.actionItem}
                    style={{ width: "100%", textAlign: "left", background: "transparent", border: "none" }}
                    onClick={() => onOpenApprovalItem(item.id)}
                  >
                    <span className={cx("actionDot", item.priority === "high" ? "actionDotRed" : "actionDotAmber")} />
                    <div>
                      <div className={styles.actionTitle}>{item.title}</div>
                      <div className={styles.actionMeta}>{item.detail}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Decision Log</span>
            <button
              type="button"
              className={styles.cardLink}
              style={{ appearance: "none", WebkitAppearance: "none", background: "none", border: "none", padding: 0 }}
              onClick={onOpenProjects}
            >
              Project history →
            </button>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            {decisionLog.length === 0 ? (
              <div className={styles.emptyState}>No decisions recorded yet.</div>
            ) : (
              <div className={styles.timelineList}>
                {decisionLog.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.timelineItem}
                    style={{ width: "100%", textAlign: "left", background: "transparent", border: "none" }}
                    onClick={() => onOpenDecisionItem(item.id)}
                  >
                    <span className={cx("timelineDot", "timelineDotPurple")} />
                    <div>
                      <div className={styles.timelineTitle}>{item.title}</div>
                      <div className={styles.timelineMeta}>{item.detail}</div>
                    </div>
                    <span className={styles.timelineDate}>{item.time}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Progress Confidence</span>
            <span className={styles.cardLink}>{confidenceSummary.score}% confidence</span>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            <div className={styles.stat}>
              <div className={styles.statTopBar} style={{ background: `var(--${confidenceSummary.tone})` }} />
              <div className={styles.statLabel}>Delivery Signal</div>
              <div className={styles.statValue}>{confidenceSummary.label}</div>
              <div className={styles.statDelta}>{confidenceSummary.reasons[0] ?? "Realtime delivery telemetry active."}</div>
            </div>
            <div className={styles.riskList} style={{ marginTop: 10 }}>
              {confidenceSummary.nextActions.map((action, index) => (
                <div key={`${action}-${index}`} className={styles.riskItem}>
                  <span className={cx("riskDot", confidenceSummary.tone === "red" ? "riskDotRed" : confidenceSummary.tone === "amber" ? "riskDotAmber" : "riskDotAccent")} />
                  <div>
                    <div className={styles.riskTitle}>{action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Handoff Package</span>
            <button className={cx("button", "buttonAccent")} type="button" style={{ padding: "6px 12px", fontSize: "0.6rem" }} onClick={onGenerateHandoff}>
              Generate
            </button>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            {handoffSummary ? (
              <div className={styles.timelineList}>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div>
                    <div className={styles.timelineTitle}>{handoffSummary.docs} latest docs bundled</div>
                    <div className={styles.timelineMeta}>Decisions: {handoffSummary.decisions}</div>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} style={{ background: handoffSummary.blockers > 0 ? "var(--amber)" : "var(--accent)" }} />
                  <div>
                    <div className={styles.timelineTitle}>{handoffSummary.blockers} open blocker{handoffSummary.blockers === 1 ? "" : "s"} captured</div>
                    <div className={styles.timelineMeta}>Generated {handoffSummary.generatedAt}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>Generate a package with current docs, decisions, and blockers.</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Next Actions</span>
            <button
              type="button"
              className={styles.cardLink}
              style={{ appearance: "none", WebkitAppearance: "none", background: "none", border: "none", padding: 0 }}
              onClick={onOpenProjects}
            >
              Open projects →
            </button>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            {nextActions.length === 0 ? (
              <div className={styles.emptyState}>No next actions yet.</div>
            ) : (
              <div className={styles.actionList}>
                {nextActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className={styles.actionItem}
                    style={{ width: "100%", textAlign: "left", background: "transparent", border: "none" }}
                    onClick={() => onOpenActionItem(action.id)}
                  >
                    <span className={cx("actionDot", `actionDot${capitalize(action.tone)}`)} />
                    <div>
                      <div className={styles.actionTitle}>{action.title}</div>
                      <div className={styles.actionMeta}>{action.meta}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>SLA &amp; Blocker Assistant</span>
            <button
              type="button"
              className={styles.cardLink}
              style={{ appearance: "none", WebkitAppearance: "none", background: "none", border: "none", padding: 0 }}
              onClick={onOpenProjects}
            >
              Review →
            </button>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            {slaAlerts.length === 0 ? (
              <div className={styles.emptyState}>No open SLA risks detected.</div>
            ) : (
              <div className={styles.riskList}>
                {slaAlerts.map((risk) => (
                  <button
                    key={risk.id}
                    type="button"
                    className={styles.riskItem}
                    style={{ width: "100%", textAlign: "left", background: "transparent", border: "none" }}
                    onClick={() => onOpenRiskItem(risk.id)}
                  >
                    <span className={cx("riskDot", risk.tone === "red" ? "riskDotRed" : "riskDotAmber")} />
                    <div>
                      <div className={styles.riskTitle}>{risk.title}</div>
                      <div className={styles.riskMeta}>{risk.meta}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid32}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Activity Feed</span>
            <span className={styles.cardLink}>Last 7 days</span>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 8, paddingBottom: 8 }}>
            {activityFeed.length === 0 ? (
              <div className={styles.emptyState}>No activity yet.</div>
            ) : (
              <div className={styles.activityList}>
                {activityFeed.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.activityItem}
                    style={{ width: "100%", textAlign: "left", background: "transparent", border: "none" }}
                    onClick={() => onOpenActivityItem(item.id)}
                  >
                    <span className={cx("activityIcon", `activityIcon${capitalize(item.tone)}`)}>{item.icon}</span>
                    <div>
                      <div className={styles.activityTitle}>{item.title}</div>
                      <div className={styles.activityDetail}>{item.detail}</div>
                    </div>
                    <span className={styles.activityTime}>{item.time}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Upcoming Events</span>
            <span className={styles.cardLink}>Next 30 days</span>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            {timelineItems.length === 0 ? (
              <div className={styles.emptyState}>No upcoming events yet.</div>
            ) : (
              <div className={styles.timelineList}>
                {timelineItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.timelineItem}
                    style={{ width: "100%", textAlign: "left", background: "transparent", border: "none" }}
                    onClick={() => onOpenTimelineItem(item.id)}
                  >
                    <span className={cx("timelineDot", `timelineDot${capitalize(item.tone)}`)} />
                    <div>
                      <div className={styles.timelineTitle}>{item.title}</div>
                      <div className={styles.timelineMeta}>{item.meta}</div>
                    </div>
                    <span className={styles.timelineDate}>{item.dateLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
