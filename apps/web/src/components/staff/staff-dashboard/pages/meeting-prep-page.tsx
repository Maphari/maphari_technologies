// ════════════════════════════════════════════════════════════════════════════
// meeting-prep-page.tsx — Meeting Prep
// Data     : getStaffMeetingsWithRefresh → GET /meetings
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffMeetingsWithRefresh, type StaffMeeting } from "../../../../lib/api/staff";

type Priority = "high" | "medium" | "low";
type MainTab = "brief" | "agenda" | "notes";

// Derive avatar initials from a title or id
function toInitials(str: string): string {
  const words = str.trim().split(/\s+/);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return str.slice(0, 2).toUpperCase();
}

// Map meeting status to a human-friendly time label
function formatScheduledAt(scheduledAt: string): string {
  const d = new Date(scheduledAt);
  const now = new Date();
  const diffDays = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const timeStr = d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  const dateStr = d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
  if (diffDays === 0)  return `Today - ${timeStr}`;
  if (diffDays === 1)  return `Tomorrow - ${timeStr}`;
  if (diffDays === -1) return `Yesterday - ${timeStr}`;
  return `${dateStr} - ${timeStr}`;
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Parse agenda text into open items
function agendaToOpenItems(agenda: string | null): Array<{ text: string; priority: Priority }> {
  if (!agenda) return [];
  return agenda
    .split(/\n/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((text, idx) => ({
      text,
      priority: idx === 0 ? "high" : idx < 3 ? "medium" : "low",
    }));
}

const priorityConfig: Record<Priority, { toneClass: string; boxClass: string }> = {
  high:   { toneClass: "mpToneRed",    boxClass: "mpCheckBoxHigh"   },
  medium: { toneClass: "mpToneAmber",  boxClass: "mpCheckBoxMedium" },
  low:    { toneClass: "mpToneMuted2", boxClass: "mpCheckBoxLow"    },
};

/* ── SVG icons ── */
function IcoVideo() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M11 6.5l4-2.5v8l-4-2.5V6.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function IcoCopy() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function IcoSave() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 5l-5 5-2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function IcoPlus() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IcoInsight() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function MeetingPrepPage({
  isActive,
  session,
  onNotify,
}: {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const [meetings, setMeetings]   = useState<StaffMeeting[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("brief");
  const [checked, setChecked]     = useState<Record<string, boolean>>({});
  const [noteText, setNoteText]   = useState("");
  const [extraAgendaItems, setExtraAgendaItems] = useState<string[]>([]);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await getStaffMeetingsWithRefresh(session);
        if (cancelled) return;
        if (result.nextSession) saveSession(result.nextSession);

        const all = (result.data ?? []).filter((m) => m.status !== "CANCELLED");
        // Sort upcoming first, then past
        all.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        setMeetings(all);
        if (all.length > 0) setSelectedId(all[0].id);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = (err as Error)?.message ?? "Failed to load meetings.";
        setError(msg);
        onNotify?.("error", msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isActive, session?.accessToken]);

  const meeting = meetings.find((m) => m.id === selectedId) ?? null;
  const openItems = meeting ? agendaToOpenItems(meeting.agenda) : [];
  const doneCount = openItems.filter((_, i) => checked[`open-${i}`]).length;

  const toggleCheck = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const TAB_DEFS: Array<{ key: MainTab; label: string; count?: number }> = [
    { key: "brief",  label: "Brief",      count: openItems.length },
    { key: "agenda", label: "Agenda",     count: openItems.length },
    { key: "notes",  label: "Call Notes"                          },
  ];

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-meeting-prep">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-meeting-prep">
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  if (!loading && meetings.length === 0) {
    return (
      <section
        className={cx("page", "pageBody", isActive && "pageActive")}
        id="page-meeting-prep"
        style={isActive ? { height: "100%", display: "flex", flexDirection: "column", padding: 0 } : undefined}
      >
        <div className={cx("pageHeaderBar", "noShrink")}>
          <div className={cx("pageEyebrow", "mb4")}>Staff Dashboard / Communication</div>
          <h1 className={cx("pageTitle")}>Meeting Prep</h1>
          <p className={cx("pageSubtitleText")}>Upcoming client meetings and call briefs</p>
        </div>
        <div className={cx("mpLayout")}>
          <div className={cx("mpSidebar")}>
            <div className={cx("mpSidebarLabel")}>Upcoming · 0</div>
          </div>
          <div className={cx("flexCol", "mpDetailWrap")}>
            <div className={cx("mpTabContent")}>
              <div className={cx("text13", "colorMuted2")}>No upcoming meetings.</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cx("page", "pageBody", isActive && "pageActive")}
      id="page-meeting-prep"
      style={isActive ? { height: "100%", display: "flex", flexDirection: "column", padding: 0 } : undefined}
    >
      <div className={cx("pageHeaderBar", "noShrink")}>
        <div className={cx("pageEyebrow", "mb4")}>Staff Dashboard / Communication</div>
        <h1 className={cx("pageTitle")}>Meeting Prep</h1>
        <p className={cx("pageSubtitleText")}>Upcoming client meetings and call briefs</p>
      </div>

      <div className={cx("mpLayout")}>

        {/* ── Left: meeting list ── */}
        <div className={cx("mpSidebar")}>
          <div className={cx("mpSidebarLabel")}>
            {`Upcoming · ${meetings.length}`}
          </div>
          {meetings.map((item) => {
            const isSelected = selectedId === item.id;
            const initials   = toInitials(item.title);
            const scheduled  = formatScheduledAt(item.scheduledAt);
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className={cx("mpMeetingItem", isSelected && "mpMeetingItemActive")}
                onClick={() => { setSelectedId(item.id); setActiveTab("brief"); setChecked({}); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(item.id);
                    setActiveTab("brief");
                    setChecked({});
                  }
                }}
              >
                {/* Header row: avatar + title */}
                <div className={cx("flexRow", "gap8", "mb6")}>
                  <div className={cx("mpAvatar24")}>{initials}</div>
                  <span className={cx("mpMeetingClient", isSelected && "mpMeetingClientActive")}>
                    {item.title}
                  </span>
                </div>
                {/* Status row */}
                <div className={cx("flexRow", "gap6", "mb5")}>
                  <span className={cx("staffChip", "mpMeetingType")}>{item.status}</span>
                  {item.durationMinutes ? (
                    <span className={cx("staffChip", "mpPlatformChip", "mpPlatformDefault")}>{formatDuration(item.durationMinutes)}</span>
                  ) : null}
                </div>
                {/* Time row */}
                <div className={cx("mpMeetingTime", isSelected ? "mpToneAccent" : "mpToneMuted2")}>
                  {scheduled}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Right: detail panel ── */}
        {meeting ? (
          <div className={cx("flexCol", "mpDetailWrap")}>

            {/* Detail header */}
            <div className={cx("mpDetailHeader")}>
              <div className={cx("mpDetailHeaderTop")}>
                <div>
                  <div className={cx("flexRow", "gap10", "mb8")}>
                    <div className={cx("mpAvatar32")}>{toInitials(meeting.title)}</div>
                    <div>
                      <div className={cx("fontDisplay", "fw800", "colorText", "mpClientName")}>{meeting.title}</div>
                      <div className={cx("text11", "colorMuted2")}>
                        {formatScheduledAt(meeting.scheduledAt)}{meeting.durationMinutes ? ` · ${formatDuration(meeting.durationMinutes)}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className={cx("flexRow", "gap8", "flexWrap")}>
                    {[meeting.status, formatScheduledAt(meeting.scheduledAt), formatDuration(meeting.durationMinutes)].map((label) => (
                      <span key={label} className={cx("mpMetaBadge")}>{label}</span>
                    ))}
                  </div>
                </div>

                {/* Join call CTA */}
                {meeting.videoRoomUrl ? (
                  <button
                    type="button"
                    className={cx("mpJoinBtn")}
                    onClick={() => window.open(meeting.videoRoomUrl!, "_blank", "noopener,noreferrer")}
                  >
                    <IcoVideo />
                    <span>Join Video Call</span>
                  </button>
                ) : (
                  <div className={cx("text11", "colorMuted2", "fontItalic")}>No video link yet</div>
                )}
              </div>

              {/* Tab bar */}
              <div className={cx("mpTabBar")}>
                {TAB_DEFS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={cx("mpTabBtn", activeTab === tab.key && "mpTabBtnActive")}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                    {tab.count != null && tab.count > 0 ? (
                      <span className={cx("mpTabCount")}>{tab.count}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab content ── */}
            <div className={cx("mpTabContent")}>

              {/* BRIEF TAB */}
              {activeTab === "brief" ? (
                <div className={cx("mpBriefGrid")}>
                  <div className={cx("flexCol", "gap20")}>

                    {/* Context box */}
                    {meeting.notes ? (
                      <div className={cx("mpContextBox")}>
                        <div className={cx("mpContextLabel")}>
                          <span className={cx("mpInsightIco")}><IcoInsight /></span>
                          Notes
                        </div>
                        <div className={cx("text12", "colorMuted", "mpContextText")}>{meeting.notes}</div>
                      </div>
                    ) : null}

                    {/* Open items from agenda */}
                    {openItems.length > 0 ? (
                      <div>
                        <div className={cx("mpSectionLabelRow", "mb12")}>
                          <span className={cx("mpSectionLabel")}>Agenda Items</span>
                          <span className={cx("mpItemCounter")}>{doneCount}/{openItems.length} done</span>
                        </div>
                        {openItems.map((item, i) => (
                          <div
                            key={`${item.text}-${i}`}
                            className={cx("staffListRow", "mpCheckItem", checked[`open-${i}`] ? "mpRowDone" : "mpRowActive")}
                            onClick={() => toggleCheck(`open-${i}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleCheck(`open-${i}`); } }}
                          >
                            <div className={cx("mpCheckBox", checked[`open-${i}`] ? "mpCheckBoxChecked" : priorityConfig[item.priority].boxClass)}>
                              {checked[`open-${i}`] ? "✓" : ""}
                            </div>
                            <div className={cx("flex1")}>
                              <div className={cx("text12", "colorText", "mpItemText", checked[`open-${i}`] && "mpItemTextDone")}>
                                {item.text}
                              </div>
                            </div>
                            <span className={cx("staffChip", "mpPriorityLabel", priorityConfig[item.priority].toneClass)}>{item.priority}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={cx("text12", "colorMuted2")}>No agenda items set for this meeting.</div>
                    )}
                  </div>

                  {/* Side card */}
                  <div className={cx("flexCol", "gap16")}>
                    <div className={cx("staffCard", "mpSideCard")}>
                      <div className={cx("staffSectionHd")}>
                        <span className={cx("staffSectionTitle")}>Meeting Details</span>
                      </div>
                      <div className={cx("staffListRow", "mpSnapshotRow")}>
                        <span className={cx("text11", "colorMuted2")}>Scheduled</span>
                        <span className={cx("text11", "colorMuted")}>{formatScheduledAt(meeting.scheduledAt)}</span>
                      </div>
                      <div className={cx("staffListRow", "mpSnapshotRow")}>
                        <span className={cx("text11", "colorMuted2")}>Duration</span>
                        <span className={cx("text11", "colorMuted")}>{formatDuration(meeting.durationMinutes)}</span>
                      </div>
                      <div className={cx("staffListRow", "mpSnapshotRow")}>
                        <span className={cx("text11", "colorMuted2")}>Status</span>
                        <span className={cx("text11", "colorMuted")}>{meeting.status}</span>
                      </div>
                      <div className={cx("staffListRow", "mpSnapshotRow")}>
                        <span className={cx("text11", "colorMuted2")}>Open items</span>
                        <span className={cx("text11", "colorMuted")}>{openItems.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* AGENDA TAB */}
              {activeTab === "agenda" ? (
                <div className={cx("mpAgendaWrap")}>
                  <div className={cx("mpSectionLabelRow", "mb16")}>
                    <span className={cx("mpSectionLabel")}>
                      Suggested Agenda · {formatDuration(meeting.durationMinutes)}
                    </span>
                  </div>
                  {openItems.length === 0 ? (
                    <div className={cx("text12", "colorMuted2")}>No agenda recorded for this meeting.</div>
                  ) : openItems.map((item, i) => {
                    const timeSlot = meeting.durationMinutes
                      ? Math.floor(meeting.durationMinutes / openItems.length)
                      : 0;
                    return (
                      <div
                        key={`${item.text}-${i}`}
                        className={cx("staffListRow", "mpAgendaItem", checked[`agenda-${i}`] ? "mpRowDone" : "mpRowActive")}
                        onClick={() => toggleCheck(`agenda-${i}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleCheck(`agenda-${i}`); } }}
                      >
                        <div className={cx("mpCheckBox", checked[`agenda-${i}`] ? "mpCheckBoxChecked" : "mpCheckBoxNeutral")}>
                          {checked[`agenda-${i}`] ? "✓" : ""}
                        </div>
                        <div className={cx("flex1")}>
                          <div className={cx("flexBetween", "mb4")}>
                            <span className={cx("text12", "colorText", checked[`agenda-${i}`] && "mpItemTextDone")}>{item.text}</span>
                            {timeSlot > 0 ? <span className={cx("mpTimeSlotChip")}>{timeSlot} min</span> : null}
                          </div>
                          <span className={cx("mpPriorityLabel", priorityConfig[item.priority].toneClass)}>
                            {item.priority} priority
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {extraAgendaItems.map((item, i) => (
                    <div key={`extra-${i}`} className={cx("mpAgendaItem", "mpRowActive")}>
                      <div className={cx("mpCheckBox", "mpCheckBoxNeutral")} />
                      <div className={cx("flex1")}>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExtraAgendaItems((prev) => prev.map((x, j) => j === i ? val : x));
                          }}
                          placeholder="Agenda item…"
                          className={cx("mpAgendaInlineInput")}
                          autoFocus={i === extraAgendaItems.length - 1}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={cx("mpAddAgendaBtn")}
                    onClick={() => setExtraAgendaItems((prev) => [...prev, ""])}
                  >
                    <IcoPlus />
                    Add agenda item
                  </button>
                </div>
              ) : null}

              {/* NOTES TAB */}
              {activeTab === "notes" ? (
                <div className={cx("mpNotesWrap")}>
                  <div className={cx("staffCard")}>
                    <div className={cx("staffSectionHd")}>
                      <span className={cx("staffSectionTitle")}>Call Notes</span>
                      <span className={cx("text10", "colorMuted2")}>{meeting.title} · {formatScheduledAt(meeting.scheduledAt)}</span>
                    </div>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder={`Notes from the meeting…\n\n- Decisions made\n- Actions agreed\n- Follow-ups`}
                      className={cx("staffInput", "mpNoteInput")}
                    />
                    <div className={cx("staffCharCount")}>{noteText.length} chars</div>
                  </div>
                  <div className={cx("flexRow", "gap10", "mt12")}>
                    <button
                      type="button"
                      className={cx("mpSaveBtn")}
                      onClick={() => {
                        if (!noteText.trim()) { onNotify?.("error", "No notes to save."); return; }
                        // TODO: wire to /staff/decisions API when available
                        const existing = JSON.parse(localStorage.getItem("decision-log") ?? "[]") as Array<{ note: string; date: string }>;
                        localStorage.setItem("decision-log", JSON.stringify([...existing, { note: noteText, date: new Date().toISOString() }]));
                        onNotify?.("success", "Notes saved to decision log.");
                      }}
                    >
                      <IcoSave />
                      Save to decision log
                    </button>
                    <button
                      type="button"
                      className={cx("mpCopyBtn")}
                      onClick={async () => {
                        if (!noteText.trim()) { onNotify?.("error", "No notes to copy."); return; }
                        try {
                          await navigator.clipboard.writeText(noteText);
                          onNotify?.("success", "Meeting notes copied to clipboard.");
                        } catch {
                          onNotify?.("error", "Clipboard unavailable.");
                        }
                      }}
                    >
                      <IcoCopy />
                      Copy notes
                    </button>
                  </div>
                </div>
              ) : null}

            </div>
          </div>
        ) : null}

      </div>
    </section>
  );
}
