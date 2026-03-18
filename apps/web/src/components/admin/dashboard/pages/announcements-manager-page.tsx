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

  useEffect(() => {
    if (!session) return;
    void loadAnnouncementsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setAnnouncements(r.data);
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

  return (
    <div className={cx(styles.pageBody)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / COMMUNICATION</div>
          <h1 className={styles.pageTitle}>Announcements Manager</h1>
          <div className={styles.pageSub}>Create and manage announcements for clients and staff</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Announcement</button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className={styles.cjKpiGrid}>
        {[
          { label: "Active",      value: String(activeCount),    sub: "Live right now",   color: "var(--accent)" },
          { label: "Drafts",      value: String(draftCount),     sub: "Unpublished",      color: "var(--muted)"  },
          { label: "Scheduled",   value: String(scheduledCount), sub: "Upcoming",         color: "var(--blue)"   },
          { label: "Total Reach", value: String(totalReach),     sub: "Cumulative reach", color: "var(--amber)"  },
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
