// ════════════════════════════════════════════════════════════════════════════
// standup-feed-page.tsx — Admin Standup Feed
// Data     : loadStandupFeedWithRefresh → GET /admin/standup/feed
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadStandupFeedWithRefresh,
  type AdminStandupEntry,
} from "../../../../lib/api/admin";

// ── Component ─────────────────────────────────────────────────────────────────
export function StandupFeedPage({ session }: { session: AuthSession | null }) {
  const [standups, setStandups] = useState<AdminStandupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadStandupFeedWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) setError(r.error.message ?? "Failed to load.");
      else if (r.data) setStandups(r.data);
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      setLoading(false);
    });
  }, [session]);

  const today = new Date().toLocaleDateString("en-ZA", { weekday: "long", month: "long", day: "numeric" });

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
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / GOVERNANCE</div>
          <h1 className={styles.pageTitle}>Standup Feed</h1>
          <div className={styles.pageSub}>Aggregated daily stand-ups from all staff — {today}</div>
        </div>
      </div>

      {/* ── Feed ── */}
      {standups.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.emptyTitle}>No standups today</div>
          <div className={styles.emptySub}>Staff standups for today haven&apos;t been submitted yet. Check back once your team has logged their daily updates.</div>
        </div>
      ) : (
        <div className={cx("flexCol", "gap16")}>
          {standups.map((s) => {
            const name     = s.staff?.name ?? `Staff ${s.staffId.slice(0, 6)}`;
            const role     = s.staff?.role ?? "Staff";
            const initials = s.staff?.avatarInitials ?? name.slice(0, 2).toUpperCase();
            const time     = new Date(s.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
            const blockers = s.blockers ?? "None";

            return (
              <article key={s.id} className={styles.card}>
                <div className={styles.cardHd}>
                  <span className={styles.cardHdTitle}>
                    {name}
                    <span className={cx("text11", "colorMuted", "fw400")}> · {role} · {time}</span>
                  </span>
                  <span className={cx("badge", "badgeMuted", "fontMono", "text10")}>{initials}</span>
                </div>
                <div className={styles.cardInner}>
                  <div className={cx("mb8")}>
                    <span className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700")}>Yesterday</span>
                    <div className={cx("text12", "mt4")}>{s.yesterday}</div>
                  </div>
                  <div className={cx("mb8")}>
                    <span className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700")}>Today</span>
                    <div className={cx("text12", "mt4")}>{s.today}</div>
                  </div>
                  <div>
                    <span className={cx("text10", "uppercase", "tracking", (blockers === "None" || blockers === "none") ? "colorGreen" : "colorRed", "fw700")}>
                      Blockers
                    </span>
                    <div className={cx("text12", "mt4")}>{blockers}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
