"use client";

import { useState } from "react";
import { cx } from "../style";

type ClientRecord = {
  id: number;
  name: string;
  avatar: string;
  project: string;
  contact: string;
};

type ClientActivity = {
  milestones: string[];
  tasks: string[];
  upcoming: string[];
  blockers: string[];
  hoursLogged: number;
};

type ToneOption = "professional" | "friendly" | "brief";
type FocusOption = "progress" | "milestone" | "blockers" | "upcoming" | "full";

const clients: ClientRecord[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", project: "Brand Identity System", contact: "Lena Muller" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", project: "Q1 Campaign Strategy", contact: "Marcus Rehn" },
  { id: 3, name: "Mira Health", avatar: "MH", project: "Website Redesign", contact: "Dr. Amara Nkosi" },
  { id: 4, name: "Dune Collective", avatar: "DC", project: "Editorial Design System", contact: "Kofi Asante" }
];

const recentActivity: Record<number, ClientActivity> = {
  1: {
    milestones: ["Logo & Visual Direction - submitted for approval Feb 22", "Brand colour palette - approved Feb 18"],
    tasks: ["Updated amber secondary colour per feedback", "Exported RGB + CMYK asset packages", "Internal review of typography pairings"],
    upcoming: ["Brand guidelines document - due Mar 3", "Animation direction deck - due Mar 10"],
    blockers: ["Awaiting client sign-off on logo suite"],
    hoursLogged: 12.5
  },
  2: {
    milestones: ["Campaign Strategy Deck - submitted for approval Feb 17"],
    tasks: ["Finalised KPI framework with CAC and LTV metrics", "Completed audience segmentation analysis", "Drafted content calendar for EMEA market"],
    upcoming: ["Channel brief - due Feb 26", "Paid media plan - due Mar 5"],
    blockers: ["Invoice overdue - not related to delivery", "Strategy approval 5 days outstanding"],
    hoursLogged: 9
  },
  3: {
    milestones: ["Mobile wireframes - in revision per client feedback Feb 20"],
    tasks: ["Revised booking flow - simplified to 4-step wizard", "Updated navigation labels to patient-friendly language", "Submitted for clinical copy review"],
    upcoming: ["Desktop wireframes - due Feb 28", "Component library handoff - due Mar 7"],
    blockers: ["Clinical review adds 5-7 days to copy turnaround"],
    hoursLogged: 8
  },
  4: {
    milestones: ["Type & Grid System - awaiting approval 12 days"],
    tasks: ["Delivered InDesign package with full documentation", "Revised type scale from digital to editorial rhythm", "Sent multiple follow-up messages - no response"],
    upcoming: ["Print handoff - overdue (hard deadline Feb 10)"],
    blockers: ["No client contact in 6 days - escalation recommended"],
    hoursLogged: 7
  }
};

const toneOptions: Array<{ key: ToneOption; label: string; desc: string }> = [
  { key: "professional", label: "Professional", desc: "Formal, structured, business-appropriate" },
  { key: "friendly", label: "Friendly", desc: "Warm, approachable, relationship-focused" },
  { key: "brief", label: "Brief", desc: "Short and to the point - 3 sentences max" }
];

const focusOptions: Array<{ key: FocusOption; label: string }> = [
  { key: "progress", label: "Progress update" },
  { key: "milestone", label: "Milestone status" },
  { key: "blockers", label: "Blockers & needs" },
  { key: "upcoming", label: "What's next" },
  { key: "full", label: "Full weekly wrap" }
];

function generateDraft(clientId: number, tone: ToneOption, focus: FocusOption, customNote: string): string {
  const client = clients.find((entry) => entry.id === clientId);
  const activity = recentActivity[clientId];
  if (!client || !activity) return "";

  const greeting =
    tone === "friendly"
      ? `Hi ${client.contact.split(" ")[0]},\n\nHope you're having a good week!`
      : `Hi ${client.contact.split(" ")[0]},\n\nI wanted to send through a quick update on ${client.project}.`;

  let body = "";

  if (focus === "progress" || focus === "full") {
    body += `\n\n**This week we completed:**\n${activity.tasks.map((task) => `- ${task}`).join("\n")}`;
  }
  if (focus === "milestone" || focus === "full") {
    body += `\n\n**Milestone status:**\n${activity.milestones.map((item) => `- ${item}`).join("\n")}`;
  }
  if ((focus === "blockers" || focus === "full") && activity.blockers.length > 0) {
    body += `\n\n**Items needing your attention:**\n${activity.blockers.map((blocker) => `- ${blocker}`).join("\n")}`;
  }
  if (focus === "upcoming" || focus === "full") {
    body += `\n\n**Coming up next:**\n${activity.upcoming.map((item) => `- ${item}`).join("\n")}`;
  }
  if (focus === "progress" && body === "") {
    body = `\n\nThis week we logged ${activity.hoursLogged} hours across ${client.project}. ${activity.tasks[0]}.`;
  }
  if (customNote.trim()) {
    body += `\n\n${customNote.trim()}`;
  }

  const closing =
    tone === "brief"
      ? `\n\nLet me know if you have any questions.`
      : tone === "friendly"
      ? `\n\nDon't hesitate to reach out if anything comes up - always happy to chat.\n\nBest,\n[Your name]`
      : `\n\nPlease don't hesitate to get in touch with any questions.\n\nKind regards,\n[Your name]`;

  if (tone === "brief") {
    const taskLine = activity.tasks[0] || "";
    const blockerLine = activity.blockers[0] ? `\n\nOne item needing your attention: ${activity.blockers[0].toLowerCase()}.` : "";
    return `Hi ${client.contact.split(" ")[0]},\n\nQuick update on ${client.project}: ${taskLine.toLowerCase()}.${blockerLine}\n\nNext milestone: ${
      activity.upcoming[0] || "TBC"
    }.\n\nLet me know if you have questions.`;
  }

  return greeting + body + closing;
}

type SentItem = {
  client: string;
  project: string;
  tone: ToneOption;
  focus: FocusOption;
  sentAt: string;
  preview: string;
};

export function AutoDraftUpdatesPage({ isActive }: { isActive: boolean }) {
  const [selectedClient, setSelectedClient] = useState(1);
  const [tone, setTone] = useState<ToneOption>("professional");
  const [focus, setFocus] = useState<FocusOption>("full");
  const [customNote, setCustomNote] = useState("");
  const [draft, setDraft] = useState("");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentHistory, setSentHistory] = useState<SentItem[]>([]);
  const [view, setView] = useState<"compose" | "history">("compose");

  const client = clients.find((entry) => entry.id === selectedClient);
  const selectedActivity = recentActivity[selectedClient];

  const handleGenerate = () => {
    setDraft(generateDraft(selectedClient, tone, focus, customNote));
    setGenerated(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(draft);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (!client || draft.trim().length === 0) return;
    setSentHistory((previous) => [
      {
        client: client.name,
        project: client.project,
        tone,
        focus,
        sentAt: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        preview: `${draft.slice(0, 100)}...`
      },
      ...previous
    ]);
    setDraft("");
    setGenerated(false);
    setCustomNote("");
  };

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-autodraft">
      <div className={cx("pageHeaderBar", "borderB", "mb16", "aduHeaderWrap")}>
        <div className={cx("flexBetween", "mb20", "itemsStart")}>
          <div>
            <div className={cx("pageEyebrow", "mb8")}>
              Staff Dashboard / Communication
            </div>
            <h1 className={cx("pageTitle")}>
              Auto-draft Client Updates
            </h1>
            <div className={cx("text12", "colorMuted2", "mt6")}>
              Generate personalised client messages from recent project activity
            </div>
          </div>
          {sentHistory.length > 0 ? (
            <div className={cx("aduSentCounter")}>
              <span className={cx("text11", "colorAccent")}>{sentHistory.length} sent this session</span>
            </div>
          ) : null}
        </div>

        <div className={cx("flexRow")}>
          {[
            { key: "compose", label: "Compose" },
            { key: "history", label: `Sent (${sentHistory.length})` }
          ].map((tab) => (
            <button type="button"
              key={tab.key}
              className={cx("adTabBtn", "uppercase", "aduTabBtn", view === tab.key ? "aduTabBtnActive" : "aduTabBtnIdle")}
              onClick={() => setView(tab.key as "compose" | "history")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === "history" ? (
        <div className={cx("pt8")}>
          {sentHistory.length === 0 ? (
            <div className={cx("textCenter", "text12", "aduHistoryEmpty")}>No updates sent yet this session.</div>
          ) : (
            <div className={cx("flexCol", "gap10", "aduHistoryList")}>
              {sentHistory.map((item, index) => (
                <div key={index} className={cx("p16", "aduHistoryCard")}>
                  <div className={cx("flexBetween", "mb8")}>
                    <div>
                      <span className={cx("text13", "colorText", "fontDisplay", "fw700")}>{item.client}</span>
                      <span className={cx("text11", "colorMuted2", "ml10")}>{item.project}</span>
                    </div>
                    <span className={cx("text10", "colorMuted2")}>{item.sentAt}</span>
                  </div>
                  <div className={cx("flexRow", "gap8", "mb10")}>
                    <span className={cx("text10", "colorAccent", "aduTagTone")}>{item.tone}</span>
                    <span className={cx("text10", "colorMuted", "aduTagFocus")}>{item.focus}</span>
                  </div>
                  <div className={cx("text11", "colorMuted2", "lh15")}>{item.preview}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={cx("pt8", "aduMainGrid")}>
          <div className={cx("flexCol", "aduComposerCol")}>
            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb12", "trackingWide12")}>
                Select Client
              </div>
              <div className={cx("flexCol", "gap8")}>
                {clients.map((item) => {
                  const isSelected = selectedClient === item.id;
                  return (
                    <div
                      key={item.id}
                      className={cx("adClientCard", "flexRow", "gap12", "aduClientCard", isSelected && "aduClientCardActive")}
                      onClick={() => {
                        setSelectedClient(item.id);
                        setGenerated(false);
                        setDraft("");
                      }}
                    >
                      <div
                        className={cx("flexCenter", "noShrink", "aduClientAvatar", isSelected ? "aduClientAvatarActive" : "aduClientAvatarIdle")}
                      >
                        {item.avatar}
                      </div>
                      <div className={cx("flex1")}>
                        <div className={cx("text12", isSelected ? "colorText" : "colorMuted")}>{item.name}</div>
                        <div className={cx("text10", "colorMuted2", "mt2")}>{item.project}</div>
                      </div>
                      {isSelected ? <span className={cx("text12", "colorAccent")}>◈</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb12", "trackingWide12")}>Tone</div>
              <div className={cx("flexCol", "gap6")}>
                {toneOptions.map((option) => (
                  <button type="button"
                    key={option.key}
                    className={cx("adOptionBtn", "aduOptionBtn", tone === option.key ? "aduOptionBtnActive" : "aduOptionBtnIdle")}
                    onClick={() => {
                      setTone(option.key);
                      setGenerated(false);
                    }}
                  >
                    <div className={cx("text12", "mb2", tone === option.key ? "colorAccent" : "colorMuted")}>{option.label}</div>
                    <div className={cx("text10", "colorMuted2")}>{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb12", "trackingWide12")}>Focus</div>
              <div className={cx("flexWrap", "aduFocusWrap")}>
                {focusOptions.map((option) => (
                  <button type="button"
                    key={option.key}
                    className={cx("adOptionBtn", "aduFocusBtn", focus === option.key ? "aduFocusBtnActive" : "aduFocusBtnIdle")}
                    onClick={() => {
                      setFocus(option.key);
                      setGenerated(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb10", "trackingWide12")}>
                Add a note <span className={cx("colorMuted2", "fw400")}>Optional</span>
              </div>
              <textarea
                value={customNote}
                onChange={(event) => {
                  setCustomNote(event.target.value);
                  setGenerated(false);
                }}
                placeholder="e.g. Mention the revised timeline, or add a personal touch..."
                className={cx("aduNoteInput")}
              />
            </div>

            <button
              className={cx("adGenBtn", "uppercase", "aduGenBtn")}
              onClick={handleGenerate}
              type="button"
            >
              {generated ? "↺ Regenerate draft" : "Generate draft →"}
            </button>
          </div>

          <div className={cx("flexCol")}>
            <div className={cx("flexBetween", "mb14")}>
              <div className={cx("text10", "colorMuted2", "uppercase", "trackingWide12")}>
                {generated ? `Draft - ${client?.name} / ${toneOptions.find((entry) => entry.key === tone)?.label}` : "Draft will appear here"}
              </div>
              {generated ? (
                <div className={cx("flexRow", "gap8")}>
                  <button type="button"
                    className={cx("adCopyBtn", "aduCopyBtn", copied && "aduCopyBtnCopied")}
                    onClick={() => void handleCopy()}
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                  <button
                    className={cx("adCopyBtn", "aduSendBtn")}
                    onClick={handleSend}
                    type="button"
                  >
                    Mark as sent
                  </button>
                </div>
              ) : null}
            </div>

            {!generated ? (
              <div
                className={cx("flexCenter", "flexCol", "gap12", "aduDraftEmpty")}
              >
                <div className={cx("aduDraftEmptyIcon")}>✦</div>
                <div className={cx("text12")}>Select a client, tone, and focus - then generate</div>
              </div>
            ) : (
              <div className={cx("flex1", "flexCol")}>
                <div className={cx("flexRow", "gap20", "aduDraftMeta")}>
                  {[
                    { label: "Source data", value: `${selectedActivity?.tasks.length ?? 0} tasks, ${selectedActivity?.milestones.length ?? 0} milestones` },
                    { label: "Hours this week", value: `${selectedActivity?.hoursLogged ?? 0}h` },
                    { label: "Open blockers", value: selectedActivity?.blockers.length ?? 0 }
                  ].map((summary) => (
                    <div key={summary.label}>
                      <div className={cx("textXs", "colorMuted2", "uppercase", "trackingWide10", "mb2")}>
                        {summary.label}
                      </div>
                      <div className={cx("text11", "colorMuted")}>{summary.value}</div>
                    </div>
                  ))}
                </div>

                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className={cx("aduDraftTextarea")}
                />

                <div className={cx("flexBetween", "mt10")}>
                  <div className={cx("text10", "colorMuted2")}>{draft.split(/\s+/).filter(Boolean).length} words · Edit freely before sending</div>
                  <div className={cx("text10", "colorMuted2")}>Sending via: Slack / Email / Portal message</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
