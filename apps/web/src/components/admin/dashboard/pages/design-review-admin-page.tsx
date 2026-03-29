// ════════════════════════════════════════════════════════════════════════════
// design-review-admin-page.tsx — Admin Design Review
// Data     : loadDesignReviewsWithRefresh → GET /admin/design-reviews
//            resolveDesignReviewWithRefresh → PATCH /admin/design-reviews/:id/resolve
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { StatWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadDesignReviewsWithRefresh,
  resolveDesignReviewWithRefresh,
  type AdminDesignReview,
} from "../../../../lib/api/admin";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "pending" | "in-review" | "resolved";
const tabs: Tab[] = ["pending", "in-review", "resolved"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapStatus(raw: string): "pending" | "in-review" | "resolved" {
  const s = raw.toUpperCase();
  if (s === "IN_REVIEW") return "in-review";
  if (s === "RESOLVED")  return "resolved";
  return "pending";
}

function statusBadge(mapped: "pending" | "in-review" | "resolved") {
  if (mapped === "pending")   return "badgeAmber";
  if (mapped === "in-review") return "badgeBlue";
  return "badgeGreen";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function DesignReviewAdminPage({ session }: { session: AuthSession | null }) {
  const [reviews,   setReviews]   = useState<AdminDesignReview[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [resolving, setResolving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadDesignReviewsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) setError(r.error.message ?? "Failed to load.");
      else if (r.data) setReviews(r.data);
      setLoading(false);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load.");
      setLoading(false);
    });
  }, [session]);

  const mapped = reviews.map((r) => ({ ...r, _status: mapStatus(r.status) }));

  const pendingCount  = mapped.filter((r) => r._status === "pending").length;
  const inReviewCount = mapped.filter((r) => r._status === "in-review").length;
  const resolvedCount = mapped.filter((r) => r._status === "resolved").length;

  const filtered = mapped.filter((r) => r._status === activeTab);

  async function handleResolve(id: string) {
    if (!session || resolving) return;
    setResolving(id);
    try {
      const r = await resolveDesignReviewWithRefresh(session, id);
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setReviews((prev) => prev.map((rv) => rv.id === id ? r.data! : rv));
    } finally {
      setResolving(null);
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
          <div className={styles.pageEyebrow}>EXPERIENCE / DESIGN REVIEW</div>
          <h1 className={styles.pageTitle}>Design Review</h1>
          <div className={styles.pageSub}>Review and resolve design submissions from clients</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
        </div>
      </div>

      {/* ── Widget stats ── */}
      <WidgetGrid>
        <StatWidget label="Pending Review" value={pendingCount}   sub="Awaiting action"  tone={pendingCount > 0 ? "amber" : "default"} />
        <StatWidget label="In Review"      value={inReviewCount}  sub="Being reviewed"   tone="accent" />
        <StatWidget label="Resolved"       value={resolvedCount}  sub="Signed off"       tone="green" />
        <StatWidget label="Total"          value={reviews.length} sub="All submissions"  tone="default" />
      </WidgetGrid>

      <WidgetGrid columns={1}>
        <PipelineWidget
          title="Review Stage Breakdown"
          stages={[
            { label: "Pending",   count: pendingCount,   total: reviews.length || 1, color: "#f5a623" },
            { label: "In Review", count: inReviewCount,  total: reviews.length || 1, color: "#8b6fff" },
            { label: "Resolved",  count: resolvedCount,  total: reviews.length || 1, color: "#34d98b" },
          ]}
        />
      </WidgetGrid>

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
          <span className={styles.teamSectionTitle}>Design Submissions</span>
          <span className={styles.teamSectionMeta}>{filtered.length} ITEMS</span>
        </div>
        <div className={styles.drvHead}>
          {["Project", "Client", "Submitted", "Reviewer", "Round", "Status", "Actions"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No submissions in this view.</div>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className={styles.drvRow}>
              <span className={cx("fw600", "text13")}>{s.projectId}</span>
              <span className={cx("text12", "colorMuted")}>{s.clientId}</span>
              <span className={cx("fontMono", "text12")}>{formatDate(s.submittedAt)}</span>
              <span className={cx("text12", "colorMuted")}>{s.reviewerName ?? "—"}</span>
              <span className={cx("fontMono", "text12")}>R{s.round}</span>
              <span className={cx("badge", statusBadge(s._status))}>{s.status}</span>
              <div className={cx("flexRow", "gap6")}>
                {s._status !== "resolved" ? (
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    disabled={resolving === s.id}
                    onClick={() => void handleResolve(s.id)}
                  >
                    {resolving === s.id ? "…" : "Resolve"}
                  </button>
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
