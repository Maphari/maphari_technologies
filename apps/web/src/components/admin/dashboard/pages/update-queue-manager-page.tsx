// ════════════════════════════════════════════════════════════════════════════
// update-queue-manager-page.tsx — Admin update queue wired to real API
// Data   : loadContentSubmissionsWithRefresh → GET /admin/content-submissions
//          approveContentSubmissionWithRefresh → PATCH /:id/approve
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminContentSubmission } from "../../../../lib/api/admin/governance";
import {
  loadContentSubmissionsWithRefresh,
  approveContentSubmissionWithRefresh
} from "../../../../lib/api/admin/governance";

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function confidenceBadge(status: string): number {
  if (status === "APPROVED") return 95;
  if (status === "REJECTED") return 40;
  return 80;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UpdateQueueManagerPage({ session, onNotify }: Props) {
  const [submissions, setSubmissions] = useState<AdminContentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setError(null);
    try {
      const r = await loadContentSubmissionsWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message ?? "Failed to load."); }
      else setSubmissions(r.data ?? []);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [session, onNotify]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [load]);

  const handleApprove = useCallback(async (id: string) => {
    if (!session) return;
    setProcessing(id);
    const r = await approveContentSubmissionWithRefresh(session, id, { approved: true });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
    } else {
      onNotify("success", "Submission approved.");
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: "APPROVED", approvedAt: new Date().toISOString() } : s));
    }
    setProcessing(null);
  }, [session, onNotify]);

  const handleReject = useCallback(async (id: string) => {
    if (!session) return;
    setProcessing(id);
    const r = await approveContentSubmissionWithRefresh(session, id, { approved: false });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
    } else {
      onNotify("info", "Submission rejected.");
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: "REJECTED", rejectedAt: new Date().toISOString() } : s));
    }
    setProcessing(null);
  }, [session, onNotify]);

  const pending   = submissions.filter((d) => d.status === "PENDING");
  const approved  = submissions.filter((d) => d.status === "APPROVED");
  const avgConf   = submissions.length > 0
    ? Math.round(submissions.reduce((s, d) => s + confidenceBadge(d.status), 0) / submissions.length)
    : 0;

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

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>AI / ML / UPDATE QUEUE MANAGER</div>
          <h1 className={styles.pageTitle}>Update Queue Manager</h1>
          <div className={styles.pageSub}>Review and approve AI-drafted client updates before sending</div>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Pending Review",  value: String(pending.length),  color: "var(--amber)" },
          { label: "Approved Today",  value: String(approved.length), color: "var(--accent)" },
          { label: "Avg Confidence",  value: `${avgConf}%`,           color: "var(--accent)" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
          </div>
        ))}
      </div>

      {submissions.length === 0 && (
        <div className={cx("card", "p24", "text13", "colorMuted")}>No content submissions found.</div>
      )}

      <div className={cx("flexCol", "gap16")}>
        {submissions.map((d) => {
          const conf = confidenceBadge(d.status);
          const isPending = d.status === "PENDING";
          const isProcessing = processing === d.id;
          return (
            <article key={d.id} className={styles.card}>
              <div className={styles.cardHd}>
                <span className={styles.cardHdTitle}>{d.submittedByName ?? "Unknown"} — {d.title}</span>
                <span className={cx("badge", d.status === "APPROVED" ? "badgeGreen" : d.status === "REJECTED" ? "badgeRed" : "badgeAmber")}>{d.status}</span>
              </div>
              <div className={styles.cardInner}>
                {d.notes && (
                  <div className={cx("text12", "mb12", "p12", "bgBg", "rXs", "italic")}>
                    {d.notes}
                  </div>
                )}
                <div className={cx("flexBetween")}>
                  <div className={cx("flex", "gap12", "text11", "colorMuted")}>
                    <span>Submitted: {formatDate(d.createdAt)}</span>
                    <span>Type: <strong className={cx("fontMono")}>{d.type}</strong></span>
                    <span>Confidence: <strong className={cx("fontMono", conf >= 85 ? "colorGreen" : "colorAmber")}>{conf}%</strong></span>
                  </div>
                  {isPending && (
                    <div className={cx("flex", "gap4")}>
                      <button
                        type="button"
                        className={cx("btnSm", "btnAccent")}
                        disabled={isProcessing}
                        onClick={() => void handleApprove(d.id)}
                      >
                        {isProcessing ? "…" : "Approve & Send"}
                      </button>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        disabled={isProcessing}
                        onClick={() => void handleReject(d.id)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
