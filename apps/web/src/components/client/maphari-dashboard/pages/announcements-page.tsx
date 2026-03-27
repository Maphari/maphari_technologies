// ════════════════════════════════════════════════════════════════════════════
// announcements-page.tsx — Client Portal Announcements
// Data     : loadPortalAnnouncementsWithRefresh → GET /announcements
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { saveSession } from "../../../../lib/auth/session";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalAnnouncementsWithRefresh,
  getPortalPreferenceWithRefresh,
  setPortalPreferenceWithRefresh,
  type PortalAnnouncement,
} from "../../../../lib/api/portal";

// ── Helpers ───────────────────────────────────────────────────────────────────
function typeToColor(type: string) {
  const t = type.toUpperCase();
  if (t === "ALERT")   return "var(--red)";
  if (t === "INFO")    return "var(--blue)";
  if (t === "FEATURE") return "var(--lime)";
  if (t === "UPDATE")  return "var(--amber)";
  return "var(--muted2)";
}

function typeToBadge(type: string) {
  const t = type.toUpperCase();
  if (t === "ALERT")   return "badgeRed";
  if (t === "FEATURE") return "badgeAccent";
  if (t === "UPDATE")  return "badgeAmber";
  return "badgeMuted";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function exportAnnouncementsCsv(rows: PortalAnnouncement[]) {
  const header = ["Title", "Type", "Target", "Status", "Published", "Scheduled", "Created"];
  const lines = rows.map((row) => [
    row.title,
    row.type,
    row.target,
    row.status,
    row.publishedAt ?? "",
    row.scheduledAt ?? "",
    row.createdAt,
  ]);
  const escape = (value: string) => `"${value.replace(/"/g, "\"\"")}"`;
  const csv = [header, ...lines].map((line) => line.map((cell) => escape(String(cell))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "announcements.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AnnouncementsPage() {
  const { session } = useProjectLayer();
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<PortalAnnouncement[]>([]);
  const [read,          setRead]          = useState<Record<string, boolean>>({});

  function loadAnnouncements() {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void Promise.all([
      loadPortalAnnouncementsWithRefresh(session),
      getPortalPreferenceWithRefresh(session, "readAnnouncements"),
    ]).then(([ar, pr]) => {
      if (ar.nextSession) saveSession(ar.nextSession);
      if (pr.nextSession) saveSession(pr.nextSession);
      if (ar.error) { setError(ar.error.message ?? "Failed to load."); return; }
      if (!ar.error && ar.data) setAnnouncements(ar.data);
      if (!pr.error && pr.data?.value) {
        try {
          const ids: string[] = JSON.parse(pr.data.value);
          setRead(Object.fromEntries(ids.map((id) => [id, true])));
        } catch { /* ignore */ }
      }
    })
    .catch((err) => setError(err?.message ?? "Failed to load"))
    .finally(() => setLoading(false));
  }

  const loadAnnouncementsEffect = useEffectEvent(() => {
    loadAnnouncements();
  });

  useEffect(() => {
    loadAnnouncementsEffect();
  }, [session]);

  function persistRead(ids: string[]) {
    if (!session) return;
    void setPortalPreferenceWithRefresh(session, { key: "readAnnouncements", value: JSON.stringify(ids) })
      .then((r) => { if (r.nextSession) saveSession(r.nextSession); });
  }

  const markRead = (id: string) => {
    setRead((p) => {
      const next = { ...p, [id]: true };
      persistRead(Object.keys(next).filter((k) => next[k]));
      return next;
      });
  };

  const unreadCount = announcements.filter((item) => !read[item.id]).length;
  const alertCount = announcements.filter((item) => item.type.toUpperCase() === "ALERT").length;
  const latestPublished = announcements.find((item) => item.publishedAt)?.publishedAt ?? announcements[0]?.createdAt ?? null;

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
          <button type="button" className={cx("btn", "btnPrimary", "mt12")} onClick={loadAnnouncements}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Communication · Updates</div>
          <h1 className={cx("pageTitle")}>Announcements</h1>
          <p className={cx("pageSub")}>Official updates from your project team — milestone news, system notices, and important alerts.</p>
        </div>
        <div className={cx("pageActions")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={loadAnnouncements}
          >
            Refresh
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => exportAnnouncementsCsv(announcements)}
          >
            Export CSV
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => {
              const ids = announcements.map((a) => a.id);
              setRead(Object.fromEntries(ids.map((id) => [id, true])));
              persistRead(ids);
            }}
          >
            Mark All Read
          </button>
        </div>
      </div>

      <div className={cx("grid4", "gap12", "mb20")}>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Announcements</div>
          <div className={cx("text22", "fw800", "colorBlue")}>{announcements.length}</div>
          <div className={cx("text12", "colorMuted")}>Published to your portal feed</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Unread</div>
          <div className={cx("text22", "fw800", "colorAmber")}>{unreadCount}</div>
          <div className={cx("text12", "colorMuted")}>Updates you have not marked as read</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Alerts</div>
          <div className={cx("text22", "fw800", "colorDanger")}>{alertCount}</div>
          <div className={cx("text12", "colorMuted")}>Urgent notices in the current feed</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Latest publish</div>
          <div className={cx("text22", "fw800", "colorSuccess")}>{formatDate(latestPublished)}</div>
          <div className={cx("text12", "colorMuted")}>Most recent update delivered to you</div>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className={cx("emptyState", "mt32")}>
          <div className={cx("emptyStateIcon")}><Ic n="bell" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No announcements yet</div>
          <div className={cx("emptyStateSub")}>Official updates, milestone news and system notices from your project team will appear here.</div>
        </div>
      ) : (
        <div className={cx("relative", "pl36")}>
          <div className={cx("anConnectorLine")} />

          {announcements.map((a, idx) => {
            const isRead   = !!read[a.id];
            const dotColor = typeToColor(a.type);

            return (
              <div key={a.id} className={cx("relative", idx < announcements.length - 1 && "mb20")}>
                <div
                  className={cx("anTimelineDot", "dynBgColor", "dynBorderColor")}
                  style={{
                    "--bg-color": isRead ? "var(--s3)" : dotColor,
                    "--border-color": isRead ? "var(--b2)" : dotColor,
                    "--box-shadow": isRead ? "none" : `0 0 0 3px color-mix(in oklab, ${dotColor} 18%, transparent)`,
                  } as React.CSSProperties}
                />

                {/* Card */}
                <div className={cx("card", isRead && "opacity65")}>
                  <div className={cx("cardHd")}>
                    <div className={cx("flexCol", "anCardHdInner")}>
                      <div className={cx("flexRow", "gap8", "alignCenter", "flexWrap")}>
                        <span className={cx("badge", typeToBadge(a.type))}>{a.type}</span>
                        <span className={cx("badge", "badgeMuted")}>{a.target}</span>
                        <span className={cx("text10", "colorMuted")}>{formatDate(a.publishedAt ?? a.createdAt)}</span>
                        {!isRead && (
                          <span className={cx("wh7", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": dotColor } as React.CSSProperties} />
                        )}
                      </div>
                      <span className={cx("cardHdTitle", "mt2")}>{a.title}</span>
                    </div>
                  </div>

                  <div className={cx("cardBodyPad")}>
                    <div className={cx("flexRow", "gap8", "alignCenter", "flexWrap")}>
                      <span className={cx("text10", "colorMuted")}>Status: {a.status}</span>
                      <span className={cx("text10", "colorMuted")}>Scheduled: {formatDate(a.scheduledAt)}</span>
                      <span className={cx("text10", "colorMuted")}>Created: {formatDate(a.createdAt)}</span>
                      {!isRead && (
                        <div className={cx("mlAuto")}>
                          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => markRead(a.id)}>
                            Mark as Read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
