// ════════════════════════════════════════════════════════════════════════════
// announcements-manager-page.tsx — Admin Announcements Manager
// Data     : loadAnnouncementsWithRefresh → GET /admin/announcements
//            publishAnnouncementWithRefresh → PATCH /admin/announcements/:id/publish
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAnnouncementsWithRefresh,
  publishAnnouncementWithRefresh,
  type AdminAnnouncement,
} from "../../../../lib/api/admin";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "active" | "drafts" | "scheduled" | "archived";
const tabs: Tab[] = ["active", "drafts", "scheduled", "archived"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapStatus(raw: string): "live" | "draft" | "scheduled" | "archived" {
  const s = raw.toUpperCase();
  if (s === "PUBLISHED") return "live";
  if (s === "SCHEDULED") return "scheduled";
  if (s === "ARCHIVED")  return "archived";
  return "draft";
}

function typeBadge(type: string) {
  const t = type.toUpperCase();
  if (t === "ALERT") return "badgeRed";
  if (t === "INFO")  return "badgeBlue";
  return "badgeGreen";
}

function targetBadge(raw: string) {
  const t = raw.toUpperCase();
  if (t === "CLIENT") return "badgeBlue";
  if (t === "STAFF")  return "badgeAmber";
  return "badgeMuted";
}

function statusBadge(mapped: ReturnType<typeof mapStatus>) {
  if (mapped === "live")      return "badgeGreen";
  if (mapped === "scheduled") return "badgeBlue";
  return "badgeMuted";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AnnouncementsManagerPage({ session }: { session: AuthSession | null }) {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [activeTab, setActiveTab]         = useState<Tab>("active");
  const [publishing, setPublishing]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadAnnouncementsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) setError(r.error.message ?? "Failed to load.");
      else if (r.data) setAnnouncements(r.data);
      setLoading(false);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load.");
      setLoading(false);
    });
  }, [session]);

  const mapped = announcements.map((a) => ({ ...a, _status: mapStatus(a.status) }));

  const activeCount    = mapped.filter((a) => a._status === "live").length;
  const draftCount     = mapped.filter((a) => a._status === "draft").length;
  const scheduledCount = mapped.filter((a) => a._status === "scheduled").length;
  const totalReach     = announcements.reduce((s, a) => s + (a.reach ?? 0), 0);

  const filtered = mapped.filter((a) => {
    if (activeTab === "active")    return a._status === "live";
    if (activeTab === "drafts")    return a._status === "draft";
    if (activeTab === "scheduled") return a._status === "scheduled";
    return a._status === "archived";
  });

  async function handlePublish(id: string) {
    if (!session || publishing) return;
    setPublishing(id);
    try {
      const r = await publishAnnouncementWithRefresh(session, id);
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        setAnnouncements((prev) => prev.map((a) => a.id === id ? r.data! : a));
      }
    } finally {
      setPublishing(null);
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

  // ── Derived chart data ────────────────────────────────────────────────────
  const monthCounts = mapped.reduce<Record<string, number>>((acc, a) => {
    const pub = a.publishedAt ?? a.scheduledAt;
    if (!pub) return acc;
    const month = new Date(pub).toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
    acc[month] = (acc[month] ?? 0) + 1;
    return acc;
  }, {});
  const annChartData = Object.entries(monthCounts).slice(-6).map(([name, value]) => ({ name, value }));
  const archived = mapped.filter((a) => a._status === "archived").length;

  const annTableRows = mapped.map((a) => ({
    id: a.id,
    title: a.title,
    target: a.target,
    publishedAt: a.publishedAt ?? a.scheduledAt,
    reach: a.reach,
    _status: a._status,
  })) as unknown as Record<string, unknown>[];

  return (
    <div className={cx(styles.pageBody)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>COMMUNICATION / ANNOUNCEMENTS</div>
          <h1 className={styles.pageTitle}>Announcements</h1>
          <div className={styles.pageSub}>Published announcements · Audience reach · Engagement</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Announcement</button>
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Total Announcements" value={mapped.length} tone="accent" sparkData={[2, 3, 4, 5, 6, 7, 8, mapped.length]} />
        <StatWidget label="Published" value={activeCount} tone="green" progressValue={mapped.length > 0 ? Math.round((activeCount / mapped.length) * 100) : 0} />
        <StatWidget label="Draft" value={draftCount} tone="amber" progressValue={mapped.length > 0 ? Math.round((draftCount / mapped.length) * 100) : 0} />
        <StatWidget label="Avg Reach" value={mapped.length > 0 ? Math.round(totalReach / mapped.length) : 0} sub="per announcement" />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Announcements by Month"
          type="bar"
          data={annChartData.length > 0 ? annChartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Announcement Status"
          stages={[
            { label: "Draft", count: draftCount, total: mapped.length, color: "#f5a623" },
            { label: "Published", count: activeCount, total: mapped.length, color: "#34d98b" },
            { label: "Scheduled", count: scheduledCount, total: mapped.length, color: "#8b6fff" },
            { label: "Archived", count: archived, total: mapped.length, color: "#6b7280" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="All Announcements"
          rows={annTableRows}
          rowKey="id"
          emptyMessage="No announcements in this category."
          columns={[
            { key: "title", header: "Title", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.title ?? "")}</span> },
            { key: "target", header: "Audience", render: (_v, row) => <span className={cx("badge")}>{String(row.target ?? "")}</span> },
            { key: "publishedAt", header: "Published", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{formatDate(row.publishedAt as string | null)}</span> },
            { key: "reach", header: "Reach", align: "right", render: (_v, row) => <span className={cx("fontMono")}>{Number(row.reach ?? 0) > 0 ? Number(row.reach).toLocaleString() : "—"}</span> },
            { key: "_status", header: "Status", align: "right", render: (_v, row) => {
              const s = String(row._status ?? "");
              return <span className={cx("badge", s === "live" ? "badgeGreen" : s === "scheduled" ? "badgePurple" : "badgeMuted")}>{s}</span>;
            }},
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
          <span className={styles.teamSectionTitle}>Announcements</span>
          <span className={styles.teamSectionMeta}>{filtered.length} ITEMS</span>
        </div>
        <div className={styles.annHead}>
          {["Title", "Type", "Target", "Published", "Reach", "Status", "Actions"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No announcements in this category.</div>
        ) : (
          filtered.map((a) => (
            <div key={a.id} className={styles.annRow}>
              <span className={cx("fw600", "text13")}>{a.title}</span>
              <span className={cx("badge", typeBadge(a.type))}>{a.type}</span>
              <span className={cx("badge", targetBadge(a.target))}>{a.target}</span>
              <span className={cx("text12", "colorMuted", "fontMono")}>{formatDate(a.publishedAt ?? a.scheduledAt)}</span>
              <span className={cx("fontMono", "text12")}>{a.reach > 0 ? a.reach.toLocaleString() : "—"}</span>
              <span className={cx("badge", statusBadge(a._status))}>{a._status}</span>
              <div className={cx("flexRow", "gap6")}>
                {a._status === "draft" && (
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    disabled={publishing === a.id}
                    onClick={() => void handlePublish(a.id)}
                  >
                    {publishing === a.id ? "…" : "Publish"}
                  </button>
                )}
                <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
