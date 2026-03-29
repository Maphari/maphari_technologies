// ════════════════════════════════════════════════════════════════════════════
// eod-digest-page.tsx — Admin EOD Digest
// Data : loadStandupFeedWithRefresh → GET /admin/standup/feed
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadStandupFeedWithRefresh, type AdminStandupEntry } from "../../../../lib/api/admin";

export function EODDigestPage({ session }: { session: AuthSession | null }) {
  const [entries, setEntries] = useState<AdminStandupEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void loadStandupFeedWithRefresh(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setEntries(r.data);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  const withBlockers = entries.filter(
    (e) => e.blockers && e.blockers.toLowerCase() !== "none"
  ).length;
  const today = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });

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
          <div className={styles.pageEyebrow}>GOVERNANCE / EOD DIGEST</div>
          <h1 className={styles.pageTitle}>EOD Digest</h1>
          <div className={styles.pageSub}>Daily wrap-up summaries from all staff — {today}</div>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Submitted",     value: String(entries.length),  cls: "colorAccent" },
          { label: "Total Entries", value: String(entries.length),  cls: "colorAccent" },
          { label: "With Blockers", value: String(withBlockers),    cls: withBlockers > 0 ? "colorAmber" : "colorAccent" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, s.cls)}>{s.value}</div>
          </div>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className={cx("colorMuted", "text12", "textCenter", "py32")}>
          No standup entries submitted today.
        </div>
      ) : (
        <div className={cx("flexCol", "gap16")}>
          {entries.map((e) => {
            const name     = e.staff?.name ?? `Staff ${e.staffId.slice(0, 6)}`;
            const role     = e.staff?.role ?? "Staff";
            const initials = e.staff?.avatarInitials ?? name.slice(0, 2).toUpperCase();
            const time     = new Date(e.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
            const blockers = e.blockers && e.blockers.toLowerCase() !== "none" ? e.blockers : null;

            return (
              <article key={e.id} className={styles.card}>
                <div className={styles.cardHd}>
                  <span className={styles.cardHdTitle}>
                    {name}
                    <span className={cx("text11", "colorMuted", "fw400")}> · {role} · {time}</span>
                  </span>
                  <span className={cx("badge", "badgeMuted", "fontMono", "text10")}>{initials}</span>
                </div>
                <div className={styles.cardInner}>
                  <div className={cx("mb8")}>
                    <span className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700")}>Completed today</span>
                    <div className={cx("text12", "mt4", "preWrap")}>{e.today}</div>
                  </div>
                  <div className={cx("mb8")}>
                    <span className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700")}>Yesterday</span>
                    <div className={cx("text12", "mt4")}>{e.yesterday}</div>
                  </div>
                  <div>
                    <span className={cx("text10", "uppercase", "tracking", blockers ? "colorAmber" : "colorGreen", "fw700")}>
                      {blockers ? "Carry Over / Blockers" : "No Blockers"}
                    </span>
                    {blockers ? <div className={cx("text12", "mt4")}>{blockers}</div> : null}
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
