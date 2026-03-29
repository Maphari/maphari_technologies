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
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

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
  const coveragePct = entries.length > 0 ? 100 : 0;

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

  // ── Chart data ─────────────────────────────────────────────────────────────
  const weekDayCounts = entries.reduce<Record<string, number>>((acc, e) => {
    const day = new Date(e.createdAt).toLocaleDateString("en-ZA", { weekday: "short" });
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(weekDayCounts).map(([name, value]) => ({ name, value }));

  const tableRows = entries.map((e) => ({
    id: e.id,
    staff: e.staff?.name ?? `Staff ${e.staffId.slice(0, 6)}`,
    today: e.today,
    blockers: e.blockers ?? "None",
    createdAt: e.createdAt,
  })) as unknown as Record<string, unknown>[];

  return (
    <div className={styles.pageBody}>

      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / EOD</div>
          <h1 className={styles.pageTitle}>EOD Digest</h1>
          <div className={styles.pageSub}>End-of-day summaries · Completion rate · Team activity — {today}</div>
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Digests Today" value={entries.length} tone="accent" sparkData={[3, 4, 5, 4, 6, 5, 7, entries.length]} />
        <StatWidget label="Tasks Completed" value={entries.length} tone="green" sub="entries submitted" />
        <StatWidget label="Blockers Raised" value={withBlockers} tone={withBlockers > 0 ? "amber" : "default"} progressValue={entries.length > 0 ? Math.round((withBlockers / entries.length) * 100) : 0} />
        <StatWidget label="Coverage %" value={`${coveragePct}%`} sub="staff submitted" />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="EOD Submissions by Day"
          type="bar"
          data={chartData.length > 0 ? chartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Digest Status"
          stages={[
            { label: "Submitted", count: entries.length, total: Math.max(entries.length, 1), color: "#34d98b" },
            { label: "With Blockers", count: withBlockers, total: Math.max(entries.length, 1), color: "#f5a623" },
            { label: "Clean", count: entries.length - withBlockers, total: Math.max(entries.length, 1), color: "#8b6fff" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="Today's Digests"
          rows={tableRows}
          rowKey="id"
          emptyMessage="No EOD entries submitted yet today."
          columns={[
            { key: "staff", header: "Staff", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.staff ?? "")}</span> },
            { key: "today", header: "Tasks Done", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{String(row.today ?? "").slice(0, 60)}{String(row.today ?? "").length > 60 ? "…" : ""}</span> },
            { key: "blockers", header: "Blockers", align: "right", render: (_v, row) => {
              const b = String(row.blockers ?? "None");
              const hasBlocker = b.toLowerCase() !== "none";
              return <span className={cx("badge", hasBlocker ? "badgeAmber" : "badgeGreen")}>{hasBlocker ? "Raised" : "None"}</span>;
            }},
            { key: "createdAt", header: "Time", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{new Date(String(row.createdAt ?? "")).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</span> },
          ]}
        />
      </WidgetGrid>

      {/* ── Detail cards ── */}
      {entries.length > 0 && (
        <div className={cx("flexCol", "gap16", "mt16")}>
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
