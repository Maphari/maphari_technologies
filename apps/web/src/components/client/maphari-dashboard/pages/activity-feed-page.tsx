// ════════════════════════════════════════════════════════════════════════════
// activity-feed-page.tsx — Real-time project activity feed (client portal)
// Data: /portal/activity-feed  →  last 50 audit events mapped to human labels
// Refresh: every 60 s auto-poll  |  Filter: All / Invoices / Milestones /
//          Payments / Messages
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadActivityFeedWithRefresh,
  type ActivityItem,
} from "../../../../lib/api/portal/activity";
import { Alert } from "@/components/shared/ui/alert";

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterTab = "all" | "invoices" | "milestones" | "payments" | "messages";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns "Today", "Yesterday", or a formatted date string like "Mar 15". */
function dayLabel(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) /
      86_400_000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

/** Relative time label: "just now", "2 hours ago", etc. */
function relativeTime(isoDate: string, nowMs: number): string {
  const diffSecs = Math.floor((nowMs - new Date(isoDate).getTime()) / 1_000);
  if (diffSecs < 60) return "just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

/** CSS class for dot colour by entity type. */
const DOT_CLASS: Record<string, string> = {
  milestone: "dotLime",
  invoice:   "dotAmber",
  payment:   "dotGreen",
  message:   "dotMuted",
  project:   "dotAccent",
  task:      "dotAccent",
  sprint:    "dotLime",
  file:      "dotMuted",
};

function dotClass(entityType: string): string {
  return DOT_CLASS[entityType] ?? "dotMuted";
}

/** Maps entityType to a FilterTab. */
function entityToTab(entityType: string): FilterTab {
  if (entityType === "invoice")   return "invoices";
  if (entityType === "payment")   return "payments";
  if (entityType === "milestone" || entityType === "sprint" || entityType === "task") return "milestones";
  if (entityType === "message")   return "messages";
  return "all";
}

const TABS: { id: FilterTab; label: string; icon: string }[] = [
  { id: "all",        label: "All",        icon: "list"    },
  { id: "invoices",   label: "Invoices",   icon: "dollar"  },
  { id: "milestones", label: "Milestones", icon: "layers"  },
  { id: "payments",   label: "Payments",   icon: "check"   },
  { id: "messages",   label: "Messages",   icon: "message" },
];

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className={cx("afItem")}>
      <div className={cx("afDot")} style={{ background: "var(--b2)" }} />
      <div className={cx("afContent")}>
        <div className={cx("skeletonLine")} style={{ width: "60%", height: 12, marginBottom: 6 }} />
        <div className={cx("skeletonLine")} style={{ width: "35%", height: 10 }} />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActivityFeedPage() {
  const { session } = useProjectLayer();
  const [items,     setItems]     = useState<ActivityItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const fetchFeed = useCallback(
    async (background = false) => {
      if (!session) return;
      if (!background) setLoading(true);
      const r = await loadActivityFeedWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        setLoadError(r.error?.message ?? "Failed to load activity feed. Please try again.");
        setLoading(false);
        return;
      }
      setLoadError(null);
      setItems(r.data);
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.accessToken]
  );

  // Initial load
  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed]);

  // Auto-refresh every 60 s
  useEffect(() => {
    const id = setInterval(() => { void fetchFeed(true); }, 60_000);
    return () => clearInterval(id);
  }, [fetchFeed]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((i) => entityToTab(i.entityType) === activeTab);
  }, [items, activeTab]);

  // ── Group by day ───────────────────────────────────────────────────────────

  const grouped = useMemo<{ day: string; rows: ActivityItem[] }[]>(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const item of filtered) {
      const label = dayLabel(item.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(item);
    }
    return Array.from(map.entries()).map(([day, rows]) => ({ day, rows }));
  }, [filtered]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const todayCount    = useMemo(() => items.filter((i) => dayLabel(i.createdAt) === "Today").length, [items]);
  const invoiceCount  = useMemo(() => items.filter((i) => entityToTab(i.entityType) === "invoices").length, [items]);
  const milestoneCount = useMemo(() => items.filter((i) => entityToTab(i.entityType) === "milestones").length, [items]);

  // ── Render ─────────────────────────────────────────────────────────────────

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
    <div className={cx("pageBody")}>

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Overview · Activity</div>
          <h1 className={cx("pageTitle")}>Activity Feed</h1>
          <p className={cx("pageSub")}>
            Everything happening on your projects — team actions, milestones, payments and more.
          </p>
        </div>
        <div className={cx("pageActions")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost", "dynColor", "flexRow", "gap5")}
            onClick={() => { void fetchFeed(); }}
            style={{ "--color": "inherit" } as React.CSSProperties}
          >
            <Ic n="refresh" sz={12} c="var(--muted2)" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Total Events",  value: items.length,    color: "statCardAccent" },
          { label: "Today",         value: todayCount,      color: "statCardAccent" },
          { label: "Invoice Events", value: invoiceCount,   color: invoiceCount > 0 ? "statCardAmber" : "statCardAccent" },
          { label: "Milestones",    value: milestoneCount,  color: milestoneCount > 0 ? "statCardBlue" : "statCardAccent" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {loadError && (
        <Alert
          variant="error"
          message={loadError}
          onRetry={() => { setLoadError(null); void fetchFeed(); }}
        />
      )}

      {/* ── Filter Tabs ───────────────────────────────────────────────── */}
      <div className={cx("ntfTabRow", "mb12")}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cx("ntfTab", activeTab === tab.id ? "ntfTabActive" : "", "dynColor")}
            onClick={() => setActiveTab(tab.id)}
            style={{ "--color": "inherit" } as React.CSSProperties}
          >
            <Ic n={tab.icon} sz={11} c={activeTab === tab.id ? "var(--bg)" : "var(--muted2)"} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Feed ──────────────────────────────────────────────────────── */}
      <div className={cx("card")}>
        {filtered.length === 0 ? (
          <div className={cx("ntfEmpty")}>
            <div className={cx("ntfEmptyIco")}>
              <Ic n="activity" sz={20} c="var(--muted2)" />
            </div>
            <div className={cx("emptyStateTitle")}>No activity yet</div>
            <div className={cx("emptyStateDesc")}>
              Your project activity will appear here as the team works on your projects.
            </div>
          </div>
        ) : (
          <div className={cx("afWrap")}>
            {grouped.map(({ day, rows }) => (
              <div key={day}>
                <div className={cx("afDayHeader")}>{day}</div>
                {rows.map((item) => (
                  <div key={item.id} className={cx("afItem")}>
                    {/* Coloured dot */}
                    <div
                      className={cx("afDot", dotClass(item.entityType))}
                    />

                    {/* Content */}
                    <div className={cx("afContent")}>
                      <div className={cx("afAction")}>{item.action}</div>
                      <div className={cx("afMeta")}>
                        {item.actorName && (
                          <>
                            <span>{item.actorName}</span>
                            <span> · </span>
                          </>
                        )}
                        <span>{relativeTime(item.createdAt, now)}</span>
                      </div>
                    </div>

                    {/* Entity type badge */}
                    <span className={cx("afBadge")}>
                      {item.entityType.charAt(0).toUpperCase() + item.entityType.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* Footer */}
            <div className={cx("ntfFooter")}>
              <span className={cx("text11", "colorMuted")}>
                Showing {filtered.length} event{filtered.length !== 1 ? "s" : ""}
                {activeTab !== "all" && ` · ${activeTab}`}
                {" · "}Auto-refreshes every 60 s
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
