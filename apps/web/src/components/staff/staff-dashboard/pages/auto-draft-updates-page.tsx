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
    <section className={cx("page", isActive && "pageActive")} id="page-autodraft">
      <style>{`
        .autodraft-option-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .autodraft-option-btn:hover { opacity: 0.8; }
        .autodraft-client-card { transition: all 0.12s ease; cursor: pointer; }
        .autodraft-client-card:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; background: color-mix(in srgb, var(--accent) 3%, transparent) !important; }
        .autodraft-gen-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .autodraft-gen-btn:hover { background: #a8d420 !important; }
        .autodraft-tab-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .autodraft-copy-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .autodraft-copy-btn:hover { opacity: 0.75; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Communication
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Auto-draft Client Updates
            </h1>
            <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 6 }}>
              Generate personalised client messages from recent project activity
            </div>
          </div>
          {sentHistory.length > 0 ? (
            <div style={{ padding: "8px 16px", background: "color-mix(in srgb, var(--accent) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)", borderRadius: 3 }}>
              <span style={{ fontSize: 11, color: "var(--accent)" }}>{sentHistory.length} sent this session</span>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          {[
            { key: "compose", label: "Compose" },
            { key: "history", label: `Sent (${sentHistory.length})` }
          ].map((tab) => (
            <button
              key={tab.key}
              className="autodraft-tab-btn"
              onClick={() => setView(tab.key as "compose" | "history")}
              type="button"
              style={{
                padding: "10px 20px",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "transparent",
                color: view === tab.key ? "var(--accent)" : "var(--muted2)",
                borderBottom: `2px solid ${view === tab.key ? "var(--accent)" : "transparent"}`,
                marginBottom: -1
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === "history" ? (
        <div style={{ paddingTop: 8 }}>
          {sentHistory.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 60, color: "#333344", fontSize: 12 }}>No updates sent yet this session.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
              {sentHistory.map((item, index) => (
                <div key={index} style={{ padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 13, color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{item.client}</span>
                      <span style={{ fontSize: 11, color: "var(--muted2)", marginLeft: 10 }}>{item.project}</span>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--muted2)" }}>{item.sentAt}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 2, background: "color-mix(in srgb, var(--accent) 8%, transparent)", color: "var(--accent)" }}>{item.tone}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 2, background: "rgba(255,255,255,0.05)", color: "#a0a0b0" }}>{item.focus}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted2)", lineHeight: 1.5 }}>{item.preview}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ paddingTop: 8, display: "grid", gridTemplateColumns: "340px 1fr", gap: 32, minHeight: "calc(100vh - 260px)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                Select Client
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {clients.map((item) => {
                  const isSelected = selectedClient === item.id;
                  return (
                    <div
                      key={item.id}
                      className="autodraft-client-card"
                      onClick={() => {
                        setSelectedClient(item.id);
                        setGenerated(false);
                        setDraft("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 3,
                        background: isSelected ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "rgba(255,255,255,0.01)"
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 2,
                          background: isSelected ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "rgba(255,255,255,0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          color: isSelected ? "var(--accent)" : "#a0a0b0",
                          fontWeight: 500
                        }}
                      >
                        {item.avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: isSelected ? "#fff" : "#a0a0b0" }}>{item.name}</div>
                        <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>{item.project}</div>
                      </div>
                      {isSelected ? <span style={{ color: "var(--accent)", fontSize: 12 }}>◈</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Tone</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {toneOptions.map((option) => (
                  <button
                    key={option.key}
                    className="autodraft-option-btn"
                    onClick={() => {
                      setTone(option.key);
                      setGenerated(false);
                    }}
                    type="button"
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      border: `1px solid ${tone === option.key ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 3,
                      background: tone === option.key ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "transparent"
                    }}
                  >
                    <div style={{ fontSize: 12, color: tone === option.key ? "var(--accent)" : "#a0a0b0", marginBottom: 2 }}>{option.label}</div>
                    <div style={{ fontSize: 10, color: "var(--muted2)" }}>{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Focus</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {focusOptions.map((option) => (
                  <button
                    key={option.key}
                    className="autodraft-option-btn"
                    onClick={() => {
                      setFocus(option.key);
                      setGenerated(false);
                    }}
                    type="button"
                    style={{
                      padding: "7px 12px",
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      border: `1px solid ${focus === option.key ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 2,
                      background: focus === option.key ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent",
                      color: focus === option.key ? "var(--accent)" : "var(--muted2)"
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                Add a note <span style={{ color: "#333344", fontWeight: 400 }}>Optional</span>
              </div>
              <textarea
                value={customNote}
                onChange={(event) => {
                  setCustomNote(event.target.value);
                  setGenerated(false);
                }}
                placeholder="e.g. Mention the revised timeline, or add a personal touch..."
                style={{
                  width: "100%",
                  minHeight: 72,
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 3,
                  color: "var(--text)",
                  fontSize: 11,
                  lineHeight: 1.6
                }}
              />
            </div>

            <button
              className="autodraft-gen-btn"
              onClick={handleGenerate}
              type="button"
              style={{
                padding: "13px 20px",
                background: "var(--accent)",
                color: "#050508",
                border: "none",
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              {generated ? "↺ Regenerate draft" : "Generate draft →"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {generated ? `Draft - ${client?.name} / ${toneOptions.find((entry) => entry.key === tone)?.label}` : "Draft will appear here"}
              </div>
              {generated ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="autodraft-copy-btn"
                    onClick={() => void handleCopy()}
                    type="button"
                    style={{
                      padding: "7px 14px",
                      fontSize: 11,
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 3,
                      background: "transparent",
                      color: copied ? "var(--accent)" : "#a0a0b0",
                      letterSpacing: "0.06em"
                    }}
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                  <button
                    className="autodraft-copy-btn"
                    onClick={handleSend}
                    type="button"
                    style={{
                      padding: "7px 16px",
                      fontSize: 11,
                      border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                      borderRadius: 3,
                      background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                      color: "var(--accent)",
                      letterSpacing: "0.06em"
                    }}
                  >
                    Mark as sent
                  </button>
                </div>
              ) : null}
            </div>

            {!generated ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed rgba(255,255,255,0.08)",
                  borderRadius: 4,
                  flexDirection: "column",
                  gap: 12,
                  minHeight: 400,
                  color: "#333344"
                }}
              >
                <div style={{ fontSize: 32 }}>✦</div>
                <div style={{ fontSize: 12 }}>Select a client, tone, and focus - then generate</div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px 3px 0 0", display: "flex", gap: 20 }}>
                  {[
                    { label: "Source data", value: `${selectedActivity?.tasks.length ?? 0} tasks, ${selectedActivity?.milestones.length ?? 0} milestones` },
                    { label: "Hours this week", value: `${selectedActivity?.hoursLogged ?? 0}h` },
                    { label: "Open blockers", value: selectedActivity?.blockers.length ?? 0 }
                  ].map((summary) => (
                    <div key={summary.label}>
                      <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
                        {summary.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#a0a0b0" }}>{summary.value}</div>
                    </div>
                  ))}
                </div>

                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  style={{
                    flex: 1,
                    padding: 20,
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderTop: "none",
                    borderRadius: "0 0 3px 3px",
                    color: "var(--text)",
                    fontSize: 13,
                    lineHeight: 1.8,
                    minHeight: 420
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: "var(--muted2)" }}>{draft.split(/\s+/).filter(Boolean).length} words · Edit freely before sending</div>
                  <div style={{ fontSize: 10, color: "#333344" }}>Sending via: Slack / Email / Portal message</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
