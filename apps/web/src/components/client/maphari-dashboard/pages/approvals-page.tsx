"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type ChangeTab = "All Changes" | "Pending" | "Approved" | "Declined";
type ChangeStatus = "pending" | "approved" | "declined";
type ChangeType = "Scope" | "Timeline";

type ChangeItem = {
  id: number;
  title: string;
  type: ChangeType;
  requestedBy: string;
  date: string;
  status: ChangeStatus;
  approvedBy?: string;
  impact: {
    budget: string;
    timeline: string;
  };
  reason: string;
};

const TABS: ChangeTab[] = ["All Changes", "Pending", "Approved", "Declined"];

const INITIAL_CHANGES: ChangeItem[] = [
  {
    id: 1,
    title: "Add Zulu language support to all screens",
    type: "Scope",
    requestedBy: "Sipho Ndlovu",
    date: "Feb 18",
    status: "pending",
    impact: { budget: "+R 2,400", timeline: "+3 days" },
    reason:
      "Our user research showed 38% of users prefer Zulu as their primary language. This aligns directly with the brief goal to serve peri-urban users effectively.",
  },
  {
    id: 2,
    title: "Reduce homepage sections from 8 to 5",
    type: "Scope",
    requestedBy: "Sipho Ndlovu",
    date: "Feb 17",
    status: "approved",
    approvedBy: "Naledi D.",
    impact: { budget: "No change", timeline: "No change" },
    reason:
      "User testing feedback from similar projects showed 5 focused sections outperform 8 diluted ones and keep the page scannable.",
  },
  {
    id: 3,
    title: "Defer dark mode to Phase 2",
    type: "Scope",
    requestedBy: "Sipho Ndlovu",
    date: "Feb 21",
    status: "approved",
    approvedBy: "Naledi D.",
    impact: { budget: "-R 3,200", timeline: "-5 days" },
    reason:
      "Dark mode adds significant QA overhead. Better to launch clean and add it in the retainer phase.",
  },
  {
    id: 4,
    title: "Extend UI/UX phase by 1 week",
    type: "Timeline",
    requestedBy: "Sipho Ndlovu",
    date: "Feb 19",
    status: "approved",
    approvedBy: "Naledi D.",
    impact: { budget: "No change", timeline: "+7 days" },
    reason:
      "The dashboard UI is more complex than scoped. An extra week ensures the quality we both want.",
  },
];

function impactTone(value: string): string {
  if (value.startsWith("+")) return "var(--amber)";
  if (value.startsWith("-")) return "var(--green)";
  return "var(--muted)";
}

export function ApprovalsPage() {
  const [tab, setTab] = useState<ChangeTab>("All Changes");
  const [changes, setChanges] = useState<ChangeItem[]>(INITIAL_CHANGES);
  const [declineModalId, setDeclineModalId] = useState<number | null>(null);
  const [declineNote, setDeclineNote] = useState("");
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const pending = useMemo(() => changes.filter((item) => item.status === "pending"), [changes]);
  const filtered = useMemo(
    () => (tab === "All Changes" ? changes : changes.filter((item) => item.status === tab.toLowerCase())),
    [changes, tab],
  );

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  function approve(id: number): void {
    setChanges((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "approved", approvedBy: "You" } : item)),
    );
    notify("Change approved", "Team has been notified and will proceed");
  }

  function decline(id: number): void {
    setChanges((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "declined" } : item)),
    );
    setDeclineModalId(null);
    setDeclineNote("");
    notify("Change declined", "Team has been notified");
  }

  return (
    <div className={cx("pageBody", styles.changeHistRoot)}>
      <div className={styles.changeHistLayout}>
        <aside className={styles.changeHistSidebar}>
          <div className={styles.changeHistSection}>Changes</div>
          {TABS.map((item, idx) => (
            <button
              key={item}
              type="button"
              className={cx(styles.changeHistSideItem, tab === item && styles.changeHistSideItemActive)}
              onClick={() => setTab(item)}
            >
              <span
                className={styles.changeHistDot}
                style={{
                  background:
                    idx === 0 ? "var(--accent)" : idx === 1 ? "var(--amber)" : idx === 2 ? "var(--green)" : "var(--red)",
                }}
              />
              <span>{item}</span>
              {item === "Pending" && pending.length > 0 ? (
                <span className={styles.changeHistBadge}>{pending.length}</span>
              ) : null}
            </button>
          ))}

          <div className={styles.changeHistDivider} />
          <div className={styles.changeHistHintCard}>
            <div className={styles.changeHistHintText}>
              Every project change needs your approval before the team proceeds. No surprises and no verbal agreements.
            </div>
          </div>
        </aside>

        <section className={styles.changeHistMain}>
          <div className={styles.changeHistHeader}>
            <div className={cx("pageEyebrow")}>Veldt Finance · Changes</div>
            <h1 className={cx("pageTitle")}>Change History</h1>
            <p className={cx("pageSub")}>
              Every scope, timeline, and budget change — who requested it, why, and what you decided.
            </p>
          </div>

          <div className={styles.changeHistTabs}>
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                className={cx(styles.changeHistTab, tab === item && styles.changeHistTabActive)}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className={styles.changeHistContent}>
            {pending.length > 0 && tab === "All Changes" ? (
              <div className={styles.changeHistWarnBanner}>
                You have {pending.length} pending change{pending.length > 1 ? "s" : ""} awaiting your approval.
              </div>
            ) : null}

            {filtered.map((item) => (
              <div
                key={item.id}
                className={cx(styles.changeHistCard, item.status === "pending" && styles.changeHistCardPending)}
              >
                <div className={styles.changeHistCardHead}>
                  <div>
                    <div className={styles.changeHistTitle}>{item.title}</div>
                    <div className={styles.changeHistMeta}>
                      Requested by {item.requestedBy} · {item.date} · {item.type} change
                    </div>
                  </div>
                  <span
                    className={cx(
                      "badge",
                      item.status === "approved"
                        ? "badgeGreen"
                        : item.status === "pending"
                          ? "badgeAmber"
                          : "badgeRed",
                    )}
                  >
                    {item.status === "approved"
                      ? "Approved"
                      : item.status === "pending"
                        ? "Awaiting Approval"
                        : "Declined"}
                  </span>
                </div>

                <div className={styles.changeHistCardBody}>
                  <div className={styles.changeHistDiff}>
                    <div className={styles.changeHistDiffBox}>
                      <div className={styles.changeHistDiffLabel}>Budget Impact</div>
                      <div className={styles.changeHistDiffValue} style={{ color: impactTone(item.impact.budget) }}>
                        {item.impact.budget}
                      </div>
                    </div>
                    <div className={styles.changeHistDiffArrow}>→</div>
                    <div className={styles.changeHistDiffBox}>
                      <div className={styles.changeHistDiffLabel}>Timeline Impact</div>
                      <div className={styles.changeHistDiffValue} style={{ color: impactTone(item.impact.timeline) }}>
                        {item.impact.timeline}
                      </div>
                    </div>
                  </div>

                  <div className={styles.changeHistReason}>{item.reason}</div>

                  {item.status === "approved" ? (
                    <div className={styles.changeHistApprovedBy}>Approved by {item.approvedBy}</div>
                  ) : null}

                  {item.status === "pending" ? (
                    <div className={styles.changeHistActions}>
                      <button type="button" className={styles.changeHistApproveBtn} onClick={() => approve(item.id)}>
                        Approve Change
                      </button>
                      <button type="button" className={styles.changeHistDeclineBtn} onClick={() => setDeclineModalId(item.id)}>
                        Decline
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {filtered.length === 0 ? (
              <div className={styles.changeHistEmpty}>No {tab.toLowerCase()} changes.</div>
            ) : null}
          </div>
        </section>
      </div>

      {declineModalId !== null ? (
        <div className={styles.changeHistModalBackdrop} onClick={() => setDeclineModalId(null)}>
          <div className={styles.changeHistModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.changeHistModalHeader}>
              <span className={styles.changeHistModalTitle}>Decline Change</span>
              <button type="button" className={styles.changeHistModalClose} onClick={() => setDeclineModalId(null)}>
                ✕
              </button>
            </div>
            <div className={styles.changeHistModalBody}>
              <div className={styles.changeHistModalText}>
                Let the team know why you are declining so they can propose an alternative.
              </div>
              <textarea
                className={styles.changeHistTextarea}
                placeholder="Reason for declining (optional but helpful)..."
                value={declineNote}
                onChange={(event) => setDeclineNote(event.target.value)}
              />
            </div>
            <div className={styles.changeHistModalFooter}>
              <button type="button" className={styles.changeHistModalDecline} onClick={() => decline(declineModalId)}>
                Decline Change
              </button>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setDeclineModalId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.subtitle}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
