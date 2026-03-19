// ════════════════════════════════════════════════════════════════════════════
// announcements-page.tsx — Client Portal Announcements
// Data     : loadPortalAnnouncementsWithRefresh → GET /announcements
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
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

// ── Types ─────────────────────────────────────────────────────────────────────
const EMOJIS = ["👍", "🎉", "❤️"] as const;
type EmojiKey = typeof EMOJIS[number];

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

// ── Component ─────────────────────────────────────────────────────────────────
export function AnnouncementsPage() {
  const { session } = useProjectLayer();
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<PortalAnnouncement[]>([]);
  const [read,          setRead]          = useState<Record<string, boolean>>({});
  const [reactions,     setReactions]     = useState<Record<string, Record<EmojiKey, number>>>({});
  const [myReactions,   setMyReactions]   = useState<Record<string, Set<EmojiKey>>>({});

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void Promise.all([
      loadPortalAnnouncementsWithRefresh(session),
      getPortalPreferenceWithRefresh(session, "readAnnouncements"),
    ]).then(([ar, pr]) => {
      if (ar.nextSession) saveSession(ar.nextSession);
      if (pr.nextSession) saveSession(pr.nextSession);
      if (ar.error) { setError(ar.error.message ?? "Failed to load."); setLoading(false); return; }
      if (!ar.error && ar.data) setAnnouncements(ar.data);
      if (!pr.error && pr.data?.value) {
        try {
          const ids: string[] = JSON.parse(pr.data.value);
          setRead(Object.fromEntries(ids.map((id) => [id, true])));
        } catch { /* ignore */ }
      }
      setLoading(false);
    });
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

  const toggleReaction = (id: string, emoji: EmojiKey) => {
    setReactions((prev) => {
      const curr = prev[id] ?? { "👍": 0, "🎉": 0, "❤️": 0 };
      const mine = myReactions[id] ?? new Set<EmojiKey>();
      const hasIt = mine.has(emoji);
      return {
        ...prev,
        [id]: { ...curr, [emoji]: hasIt ? Math.max(0, curr[emoji] - 1) : curr[emoji] + 1 },
      };
    });
    setMyReactions((prev) => {
      const mine = new Set<EmojiKey>(prev[id] ?? []);
      if (mine.has(emoji)) mine.delete(emoji);
      else mine.add(emoji);
      return { ...prev, [id]: mine };
    });
  };

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

      {announcements.length === 0 ? (
        <div className={cx("emptyState", "mt32")}>
          <div className={cx("emptyStateIcon")}><Ic n="bell" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No announcements yet</div>
          <div className={cx("emptyStateSub")}>Official updates, milestone news and system notices from your project team will appear here.</div>
        </div>
      ) : (
        /* ── Vertical timeline feed ── */
        <div className={cx("relative", "pl36")}>
          {/* Connector line */}
          <div className={cx("anConnectorLine")} />

          {announcements.map((a, idx) => {
            const isRead   = !!read[a.id];
            const rxns     = reactions[a.id] ?? { "👍": 0, "🎉": 0, "❤️": 0 };
            const mine     = myReactions[a.id] ?? new Set<EmojiKey>();
            const dotColor = typeToColor(a.type);

            return (
              <div key={a.id} className={cx("relative", idx < announcements.length - 1 && "mb20")}>
                {/* Timeline dot */}
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
                        <span className={cx("text10", "colorMuted")}>{formatDate(a.publishedAt ?? a.createdAt)}</span>
                        {!isRead && (
                          <span className={cx("wh7", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": dotColor } as React.CSSProperties} />
                        )}
                      </div>
                      <span className={cx("cardHdTitle", "mt2")}>{a.title}</span>
                    </div>
                  </div>

                  <div className={cx("cardBodyPad")}>
                    {/* Emoji reactions row */}
                    <div className={cx("flexRow", "gap6", "alignCenter", "flexWrap")}>
                      {EMOJIS.map((emoji) => {
                        const count  = rxns[emoji];
                        const active = mine.has(emoji);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaction(a.id, emoji)}
                            className={cx("anReactionBtn", "dynBgColor", "dynBorderColor")}
                            style={{
                              "--bg-color": active ? `color-mix(in oklab, ${dotColor} 10%, transparent)` : "var(--s2)",
                              "--border-color": active ? dotColor : "var(--b2)",
                            } as React.CSSProperties}
                          >
                            {emoji}
                            {count > 0 && (
                              <span className={cx("anReactionCount", "dynColor")} style={{ "--color": active ? dotColor : "var(--muted2)" } as React.CSSProperties}>{count}</span>
                            )}
                          </button>
                        );
                      })}

                      <div className={cx("mlAuto")}>
                        {!isRead && (
                          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => markRead(a.id)}>
                            Mark as Read
                          </button>
                        )}
                      </div>
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
