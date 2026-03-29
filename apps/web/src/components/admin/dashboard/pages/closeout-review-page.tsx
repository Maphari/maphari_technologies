"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCloseoutReports, approveCloseoutReport, type CloseoutReport } from "../../../../lib/api/admin/closeout";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";

export function CloseoutReviewPage() {
  const { session } = useAdminWorkspaceContext();
  const [reports, setReports] = useState<CloseoutReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCloseoutReports(session);
      if (result.error) {
        setError(result.error.message);
      } else {
        setReports(result.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove(id: string) {
    if (!session) return;
    setApprovingId(id);
    const result = await approveCloseoutReport(session, id, "APPROVED");
    if (result.data) {
      setReports((prev) => prev.map((r) => (r.id === id ? result.data! : r)));
    }
    setApprovingId(null);
  }

  const pending  = reports.filter((r) => r.status === "PENDING_REVIEW").length;
  const approved = reports.filter((r) => r.status === "APPROVED").length;

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
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>KNOWLEDGE / CLOSE-OUT REVIEW</div>
          <h1 className={styles.pageTitle}>Close-out Review</h1>
          <div className={styles.pageSub}>Approve project close-out reports and capture lessons learned</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void load()} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* ── Summary KPIs ─────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb28")}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Reports</div>
          <div className={styles.statValue}>{reports.length}</div>
          <div className={cx("text11", "colorMuted")}>All close-out reports</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pending Review</div>
          <div className={cx(styles.statValue, pending > 0 ? "colorAmber" : "colorMuted")}>{pending}</div>
          <div className={cx("text11", "colorMuted")}>Awaiting admin approval</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Approved</div>
          <div className={cx(styles.statValue, "colorGreen")}>{approved}</div>
          <div className={cx("text11", "colorMuted")}>Reports signed off</div>
        </div>
      </div>

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className={cx(styles.card, styles.cardInner)}>
          <div className={cx("text13", "colorRed", "mb8")}>Failed to load reports</div>
          <div className={cx("text12", "colorMuted", "mb16")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void load()}>Retry</button>
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────────────────────────── */}
      {loading && (
        <article className={styles.card}>
          <div className={cx(styles.cardHd)}><span className={styles.cardHdTitle}>Loading…</span></div>
          <div className={cx(styles.cardInner, "text12", "colorMuted")}>Fetching close-out reports…</div>
        </article>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && !error && reports.length === 0 && (
        <div className={cx(styles.card, styles.cardInner, "textCenter")}>
          <div className={cx("text13", "mb4")}>No close-out reports yet</div>
          <div className={cx("text12", "colorMuted")}>
            Submit a close-out report at project completion to capture budget variance and lessons learned.
          </div>
        </div>
      )}

      {/* ── Reports table ────────────────────────────────────────────────── */}
      {!loading && !error && reports.length > 0 && (
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Close-out Reports</span>
          </div>
          <div className={styles.cardInner}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Client</th>
                  <th scope="col">Submitted By</th>
                  <th scope="col">Date</th>
                  <th scope="col">Budget Δ</th>
                  <th scope="col">Lessons</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td className={cx("fw600")}>{r.projectName}</td>
                    <td className={cx("colorMuted")}>{r.clientName}</td>
                    <td className={cx("text12")}>{r.submittedBy}</td>
                    <td className={cx("text12", "colorMuted")}>
                      {new Date(r.createdAt).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className={cx("fontMono", "fw600", r.budgetVariance.startsWith("+") ? "colorRed" : "colorGreen")}>
                      {r.budgetVariance}
                    </td>
                    <td className={cx("fontMono")}>{r.lessonsCount}</td>
                    <td>
                      <span
                        className={cx(
                          "badge",
                          r.status === "APPROVED"
                            ? "badgeGreen"
                            : r.status === "CHANGES_REQUESTED"
                              ? "badgeRed"
                              : "badgeAmber"
                        )}
                      >
                        {r.status === "PENDING_REVIEW"
                          ? "Pending Review"
                          : r.status === "APPROVED"
                            ? "Approved"
                            : "Changes Requested"}
                      </span>
                    </td>
                    <td>
                      {r.status === "PENDING_REVIEW" && (
                        <button
                          type="button"
                          className={cx("btnSm", "btnAccent")}
                          onClick={() => void handleApprove(r.id)}
                          disabled={approvingId === r.id}
                        >
                          {approvingId === r.id ? "…" : "Approve"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </div>
  );
}
