// ════════════════════════════════════════════════════════════════════════════
// design-review-admin-page.tsx — Admin Design Review
// Data     : loadDesignReviewsWithRefresh → GET /admin/design-reviews
//            resolveDesignReviewWithRefresh → PATCH /admin/design-reviews/:id/resolve
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
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

  useEffect(() => {
    if (!session) return;
    void loadDesignReviewsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setReviews(r.data);
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

  return (
    <div className={cx(styles.pageBody)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / EXPERIENCE</div>
          <h1 className={styles.pageTitle}>Design Review</h1>
          <div className={styles.pageSub}>Review and resolve design submissions from clients</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className={styles.cjKpiGrid}>
        {[
          { label: "Pending Review", value: String(pendingCount),  sub: "Awaiting action",    color: "var(--amber)"  },
          { label: "In Review",      value: String(inReviewCount), sub: "Being reviewed",     color: "var(--blue)"   },
          { label: "Resolved",       value: String(resolvedCount), sub: "Signed off",         color: "var(--accent)" },
          { label: "Total",          value: String(reviews.length),sub: "All submissions",    color: "var(--muted)"  },
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
