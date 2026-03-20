// ════════════════════════════════════════════════════════════════════════════
// content-approval-page.tsx — Admin Content Approval
// Data     : loadContentSubmissionsWithRefresh → GET /admin/content-submissions
//            approveContentSubmissionWithRefresh → PATCH /admin/content-submissions/:id/approve
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadContentSubmissionsWithRefresh,
  approveContentSubmissionWithRefresh,
  type AdminContentSubmission,
} from "../../../../lib/api/admin";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "awaiting" | "approved" | "rejected" | "all";
const tabs: Tab[] = ["awaiting", "approved", "rejected", "all"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "AWAITING")  return "badgeAmber";
  if (s === "APPROVED")  return "badgeGreen";
  if (s === "REJECTED")  return "badgeRed";
  return "badgeMuted"; // DRAFT
}

function mapTab(status: string): Tab {
  const s = status.toUpperCase();
  if (s === "APPROVED") return "approved";
  if (s === "REJECTED") return "rejected";
  if (s === "AWAITING") return "awaiting";
  return "all";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ContentApprovalPage({ session }: { session: AuthSession | null }) {
  const [items,     setItems]     = useState<AdminContentSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("awaiting");
  const [actioning, setActioning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadContentSubmissionsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) setError(r.error.message ?? "Failed to load.");
      else if (r.data) setItems(r.data);
      setLoading(false);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load.");
      setLoading(false);
    });
  }, [session]);

  const awaitingCount = items.filter((c) => c.status.toUpperCase() === "AWAITING").length;
  const approvedCount = items.filter((c) => c.status.toUpperCase() === "APPROVED").length;
  const rejectedCount = items.filter((c) => c.status.toUpperCase() === "REJECTED").length;
  const draftCount    = items.filter((c) => !["AWAITING", "APPROVED", "REJECTED"].includes(c.status.toUpperCase())).length;

  const filtered = activeTab === "all"
    ? items
    : items.filter((c) => mapTab(c.status) === activeTab);

  async function handleAction(id: string, approved: boolean) {
    if (!session || actioning) return;
    setActioning(id);
    try {
      const r = await approveContentSubmissionWithRefresh(session, id, { approved });
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setItems((prev) => prev.map((c) => c.id === id ? r.data! : c));
    } finally {
      setActioning(null);
    }
  }

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
    <div className={cx(styles.pageBody)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / COMMUNICATION</div>
          <h1 className={styles.pageTitle}>Content Approval</h1>
          <div className={styles.pageSub}>Review and approve content submissions before they are published</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className={styles.cjKpiGrid}>
        {[
          { label: "Awaiting Approval",  value: String(awaitingCount), sub: "Needs review",         color: "var(--amber)"  },
          { label: "Approved",           value: String(approvedCount), sub: "Published",             color: "var(--accent)" },
          { label: "Rejected",           value: String(rejectedCount), sub: "Returned for rework",   color: "var(--red)"    },
          { label: "Drafts",             value: String(draftCount),    sub: "Not yet submitted",      color: "var(--muted)"  },
        ].map((k) => (
          <div key={k.label} className={cx(styles.cjKpiCard, toneClass(k.color))}>
            <div className={styles.cjKpiLabel}>{k.label}</div>
            <div className={cx(styles.cjKpiValue, toneClass(k.color))}>{k.value}</div>
            <div className={styles.cjKpiMeta}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className={styles.teamFilters}>
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={cx("btnSm", activeTab === t ? "btnAccent" : "btnGhost")}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className={styles.teamSection}>
        <div className={styles.teamSectionHeader}>
          <span className={styles.teamSectionTitle}>Content Submissions</span>
          <span className={styles.teamSectionMeta}>{filtered.length} ITEMS</span>
        </div>
        <div className={styles.capHead}>
          {["Content", "Client", "Type", "Submitted By", "Date", "Status", "Actions"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No content in this view.</div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className={styles.capRow}>
              <span className={cx("fw600", "text13")}>{c.title}</span>
              <span className={cx("text12", "colorMuted")}>{c.clientId}</span>
              <span className={cx("fontMono", "text10", "colorMuted")}>{c.type}</span>
              <span className={cx("text12", "colorMuted")}>{c.submittedByName ?? "—"}</span>
              <span className={cx("fontMono", "text12")}>{formatDate(c.createdAt)}</span>
              <span className={cx("badge", statusBadge(c.status))}>{c.status}</span>
              <div className={cx("flexRow", "gap6")}>
                {c.status.toUpperCase() === "AWAITING" ? (
                  <>
                    <button
                      type="button"
                      className={cx("btnSm", "btnAccent")}
                      disabled={actioning === c.id}
                      onClick={() => void handleAction(c.id, true)}
                    >
                      {actioning === c.id ? "…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost")}
                      disabled={actioning === c.id}
                      onClick={() => void handleAction(c.id, false)}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
