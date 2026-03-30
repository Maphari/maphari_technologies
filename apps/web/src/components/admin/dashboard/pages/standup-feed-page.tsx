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
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

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

  const activeBlockers = standups.filter((s) => s.blockers && s.blockers.toLowerCase() !== "none").length;
  const resolvedThisWeek = 0; // no resolved tracking in current model
  const responseRate = standups.length > 0 ? 100 : 0;

  // ── Chart data ─────────────────────────────────────────────────────────────
  const teamCounts = standups.reduce<Record<string, number>>((acc, s) => {
    const team = s.staff?.role ?? "Unknown";
    acc[team] = (acc[team] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(teamCounts).map(([name, value]) => ({ name, value }));

  const tableRows = standups.map((s) => ({
    id: s.id,
    staff: s.staff?.name ?? `Staff ${s.staffId.slice(0, 6)}`,
    today: s.today,
    blockers: s.blockers ?? "None",
    createdAt: s.createdAt,
  })) as unknown as Record<string, unknown>[];

  return (
    <div className={styles.pageBody}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / STANDUP</div>
          <h1 className={styles.pageTitle}>Standup Feed</h1>
          <div className={styles.pageSub}>Daily standups · Blocker tracking · Team pulse — {today}</div>
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Standups Today" value={standups.length} tone="accent" sparkData={[3, 4, 5, 4, 6, 5, 7, standups.length]} />
        <StatWidget label="Blockers Active" value={activeBlockers} tone={activeBlockers > 0 ? "red" : "green"} progressValue={standups.length > 0 ? Math.round((activeBlockers / standups.length) * 100) : 0} />
        <StatWidget label="Resolved This Week" value={resolvedThisWeek} tone="green" progressValue={0} />
        <StatWidget label="Response Rate" value={`${responseRate}%`} sub="submitted today" />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Standups by Team"
          type="bar"
          data={chartData.length > 0 ? chartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Blocker Severity"
          stages={[
            { label: "Clear", count: standups.length - activeBlockers, total: standups.length, color: "#34d98b" },
            { label: "Blocked", count: activeBlockers, total: standups.length, color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="Today's Standups"
          rows={tableRows}
          rowKey="id"
          emptyMessage="No standups submitted yet today."
          columns={[
            { key: "staff", header: "Staff", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.staff ?? "")}</span> },
            { key: "today", header: "Today's Update", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{String(row.today ?? "").slice(0, 60)}{String(row.today ?? "").length > 60 ? "…" : ""}</span> },
            { key: "blockers", header: "Blockers", align: "right", render: (_v, row) => {
              const b = String(row.blockers ?? "None");
              const isBlocked = b.toLowerCase() !== "none";
              return <span className={cx("badge", isBlocked ? "badgeRed" : "badgeGreen")}>{isBlocked ? "Blocked" : "Clear"}</span>;
            }},
            { key: "createdAt", header: "Time", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{new Date(String(row.createdAt ?? "")).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</span> },
          ]}
        />
      </WidgetGrid>

      {/* ── Detail cards below ── */}
      {standups.length > 0 && (
        <div className={cx("flexCol", "gap16", "mt16")}>
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
                    <span className={cx("text10", "uppercase", "tracking", (blockers === "None" || blockers === "none") ? "colorGreen" : "colorRed", "fw700")}>Blockers</span>
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
