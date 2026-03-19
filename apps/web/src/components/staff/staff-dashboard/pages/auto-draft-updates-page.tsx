// ════════════════════════════════════════════════════════════════════════════
// auto-draft-updates-page.tsx — Staff: AI-assisted client update drafts
// Data     : getStaffClients + getStaffProjects (session-based)
//            Draft generation: POST /ai/auto-draft (claude-sonnet-4-6)
//            History persistence: GET/POST /staff/auto-drafts (core service)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffClients } from "../../../../lib/api/staff/clients";
import { getStaffProjects } from "../../../../lib/api/staff/projects";
import {
  generateAutoDraftWithRefresh,
  loadAutoDraftsWithRefresh,
  saveAutoDraftWithRefresh,
} from "../../../../lib/api/staff/auto-drafts";
import { cx } from "../style";

// ── Types ─────────────────────────────────────────────────────────────────────

type PageProps = {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
};

type ClientRecord = {
  id: string;
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

type SentItem = {
  client: string;
  project: string;
  tone: ToneOption;
  focus: FocusOption;
  sentAt: string;
  preview: string;
};

// ── Static option lists ───────────────────────────────────────────────────────

const toneOptions: Array<{ key: ToneOption; label: string; desc: string }> = [
  { key: "professional", label: "Professional", desc: "Formal, structured, business-appropriate" },
  { key: "friendly", label: "Friendly", desc: "Warm, approachable, relationship-focused" },
  { key: "brief", label: "Brief", desc: "Short and to the point - 3 sentences max" },
];

const focusOptions: Array<{ key: FocusOption; label: string }> = [
  { key: "progress", label: "Progress update" },
  { key: "milestone", label: "Milestone status" },
  { key: "blockers", label: "Blockers & needs" },
  { key: "upcoming", label: "What's next" },
  { key: "full", label: "Full weekly wrap" },
];

// ── Draft generator ───────────────────────────────────────────────────────────

function generateDraft(
  client: ClientRecord,
  activity: ClientActivity,
  tone: ToneOption,
  focus: FocusOption,
  customNote: string
): string {
  const firstName = client.contact.split(" ")[0] ?? client.contact;

  if (tone === "brief") {
    const taskLine = activity.tasks[0] ?? "work progressing as planned";
    const blockerLine =
      activity.blockers[0]
        ? `\n\nOne item needing your attention: ${activity.blockers[0].toLowerCase()}.`
        : "";
    return (
      `Hi ${firstName},\n\nQuick update on ${client.project}: ${taskLine.toLowerCase()}.${blockerLine}\n\n` +
      `Next milestone: ${activity.upcoming[0] ?? "TBC"}.\n\nLet me know if you have questions.`
    );
  }

  const greeting =
    tone === "friendly"
      ? `Hi ${firstName},\n\nHope you're having a good week!`
      : `Hi ${firstName},\n\nI wanted to send through a quick update on ${client.project}.`;

  let body = "";

  if (focus === "progress" || focus === "full") {
    if (activity.tasks.length > 0) {
      body += `\n\n**This week we completed:**\n${activity.tasks.map((t) => `- ${t}`).join("\n")}`;
    }
  }
  if (focus === "milestone" || focus === "full") {
    if (activity.milestones.length > 0) {
      body += `\n\n**Milestone status:**\n${activity.milestones.map((m) => `- ${m}`).join("\n")}`;
    }
  }
  if ((focus === "blockers" || focus === "full") && activity.blockers.length > 0) {
    body += `\n\n**Items needing your attention:**\n${activity.blockers.map((b) => `- ${b}`).join("\n")}`;
  }
  if (focus === "upcoming" || focus === "full") {
    if (activity.upcoming.length > 0) {
      body += `\n\n**Coming up next:**\n${activity.upcoming.map((u) => `- ${u}`).join("\n")}`;
    }
  }
  if (body === "") {
    body = `\n\nWork on ${client.project} is progressing as planned.`;
  }
  if (customNote.trim()) {
    body += `\n\n${customNote.trim()}`;
  }

  const closing =
    tone === "friendly"
      ? `\n\nDon't hesitate to reach out if anything comes up - always happy to chat.\n\nBest,\n[Your name]`
      : `\n\nPlease don't hesitate to get in touch with any questions.\n\nKind regards,\n[Your name]`;

  return greeting + body + closing;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AutoDraftUpdatesPage({ isActive, session, onNotify }: PageProps) {
  const [clientList, setClientList] = useState<ClientRecord[]>([]);
  const [activityMap, setActivityMap] = useState<Record<string, ClientActivity>>({});
  const [loading, setLoading] = useState(true);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [tone, setTone] = useState<ToneOption>("professional");
  const [focus, setFocus] = useState<FocusOption>("full");
  const [customNote, setCustomNote] = useState("");
  const [draft, setDraft] = useState("");
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentHistory, setSentHistory] = useState<SentItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [view, setView] = useState<"compose" | "history">("compose");

  useEffect(() => {
    if (!isActive) return;
    if (!session) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    void Promise.all([
      getStaffClients(session),
      getStaffProjects(session),
    ]).then(([clientsResult, projectsResult]) => {
      if (cancelled) return;

      if (clientsResult.nextSession) saveSession(clientsResult.nextSession);
      if (projectsResult.nextSession) saveSession(projectsResult.nextSession);

      const apiClients = clientsResult.data ?? [];
      const apiProjects = projectsResult.data ?? [];

      const newClients: ClientRecord[] = apiClients.slice(0, 6).map((c) => ({
        id: c.id,
        name: c.name,
        avatar: c.name
          .split(" ")
          .map((w) => w[0] ?? "")
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        project:
          apiProjects.find((p) => p.clientId === c.id)?.name ?? "Active Project",
        contact: c.contactEmail?.split("@")[0] ?? c.name.split(" ")[0] ?? "Contact",
      }));

      const newActivity: Record<string, ClientActivity> = {};
      for (const client of newClients) {
        const clientProjects = apiProjects.filter((p) => p.clientId === client.id);
        const proj = clientProjects[0];
        newActivity[client.id] = {
          milestones: proj
            ? [`${proj.name} — ${proj.progressPercent}% complete`]
            : [],
          tasks: proj
            ? [
                `${proj.status === "IN_PROGRESS" ? "In progress" : proj.status}: ${proj.name}`,
                ...(proj.ownerName ? [`Managed by ${proj.ownerName}`] : []),
              ]
            : [],
          upcoming: proj?.dueAt
            ? [
                `${proj.name} — due ${new Date(proj.dueAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}`,
              ]
            : [],
          blockers: [],
          hoursLogged: 0,
        };
      }

      if (!cancelled) {
        setClientList(newClients);
        setActivityMap(newActivity);
        if (newClients.length > 0 && newClients[0]) {
          setSelectedClientId(newClients[0].id);
        }
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [isActive, session]);

  const selectedClient = clientList.find((c) => c.id === selectedClientId) ?? null;
  const selectedActivity = selectedClientId ? (activityMap[selectedClientId] ?? null) : null;

  const handleGenerate = async () => {
    if (!selectedClient || !selectedActivity) return;
    setGenerating(true);
    setCopied(false);

    if (session) {
      const result = await generateAutoDraftWithRefresh(session, {
        clientName: selectedClient.name,
        projectName: selectedClient.project,
        milestones: selectedActivity.milestones,
        tasks: selectedActivity.tasks,
        tone,
        focus,
        customNote,
      });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data?.draft) {
        setDraft(result.data.draft);
        setGenerated(true);
        setGenerating(false);
        return;
      }
    }

    // Fallback: client-side generation (no session or AI error)
    setDraft(generateDraft(selectedClient, selectedActivity, tone, focus, customNote));
    setGenerated(true);
    setGenerating(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(draft);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  // Load draft history from API when switching to history tab
  useEffect(() => {
    if (view !== "history" || !session) return;
    setHistoryLoading(true);
    void loadAutoDraftsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      setHistoryLoading(false);
      if (r.data && r.data.length > 0) {
        const apiHistory: SentItem[] = r.data.map((d) => ({
          client: d.clientId,
          project: "",
          tone: "professional",
          focus: "full",
          sentAt: new Date(d.occurredAt).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          preview: (d.actionLabel ?? d.subject).slice(0, 100) + "...",
        }));
        setSentHistory(apiHistory);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, session?.accessToken]);

  const handleSend = () => {
    if (!selectedClient || draft.trim().length === 0) return;
    const newItem: SentItem = {
      client: selectedClient.name,
      project: selectedClient.project,
      tone,
      focus,
      sentAt: new Date().toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      preview: `${draft.slice(0, 100)}...`,
    };
    setSentHistory((prev) => [newItem, ...prev]);

    // Persist to backend
    if (session) {
      void saveAutoDraftWithRefresh(session, {
        clientId: selectedClient.id,
        subject: `${selectedClient.name} — ${tone} ${focus} update`,
        content: draft,
      }).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
      });
    }

    setDraft("");
    setGenerated(false);
    setCustomNote("");
    onNotify?.("success", "Draft saved to history");
  };

  if (!isActive) return null;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-autodraft">
      <div className={cx("pageHeaderBar", "borderB", "mb16", "aduHeaderWrap")}>
        <div className={cx("flexBetween", "mb20", "itemsStart")}>
          <div>
            <div className={cx("pageEyebrow", "mb8")}>Staff Dashboard / Communication</div>
            <h1 className={cx("pageTitle")}>Auto-draft Client Updates</h1>
            <div className={cx("text12", "colorMuted2", "mt6")}>
              Generate personalised client messages from recent project activity
            </div>
          </div>
          {sentHistory.length > 0 && (
            <div className={cx("aduSentCounter")}>
              <span className={cx("text11", "colorAccent")}>{sentHistory.length} sent this session</span>
            </div>
          )}
        </div>

        <div className={cx("flexRow")}>
          {(["compose", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={cx(
                "adTabBtn",
                "uppercase",
                "aduTabBtn",
                view === tab ? "aduTabBtnActive" : "aduTabBtnIdle"
              )}
              onClick={() => setView(tab)}
            >
              {tab === "compose" ? "Compose" : `Sent (${sentHistory.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ──────────────────────────────────────────────────── */}
      {loading && (
        <div className={cx("flexCenter", "pt32")}>
          <span className={cx("text12", "colorMuted2")}>Loading client data…</span>
        </div>
      )}

      {/* ── Empty (no clients) ───────────────────────────────────────── */}
      {!loading && clientList.length === 0 && (
        <div className={cx("flexCenter", "flexCol", "gap12", "aduDraftEmpty", "pt32")}>
          <div className={cx("aduDraftEmptyIcon")}>✦</div>
          <div className={cx("text12")}>No clients assigned to your account yet.</div>
        </div>
      )}

      {/* ── History tab ──────────────────────────────────────────────── */}
      {!loading && clientList.length > 0 && view === "history" && (
        <div className={cx("pt8")}>
          {historyLoading ? (
            <div className={cx("textCenter", "text12", "aduHistoryEmpty", "colorMuted")}>
              Loading history...
            </div>
          ) : sentHistory.length === 0 ? (
            <div className={cx("textCenter", "text12", "aduHistoryEmpty")}>
              No saved drafts yet. Generate and send a draft to save it.
            </div>
          ) : (
            <div className={cx("flexCol", "gap10", "aduHistoryList")}>
              {sentHistory.map((item, index) => (
                <div key={index} className={cx("p16", "aduHistoryCard")}>
                  <div className={cx("flexBetween", "mb8")}>
                    <div>
                      <span className={cx("text13", "colorText", "fontDisplay", "fw700")}>
                        {item.client}
                      </span>
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
      )}

      {/* ── Compose tab ──────────────────────────────────────────────── */}
      {!loading && clientList.length > 0 && view === "compose" && (
        <div className={cx("pt8", "aduMainGrid")}>
          {/* Left column: selectors */}
          <div className={cx("flexCol", "aduComposerCol")}>
            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb12", "trackingWide12")}>
                Select Client
              </div>
              <div className={cx("flexCol", "gap8")}>
                {clientList.map((item) => {
                  const isSelected = selectedClientId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={cx(
                        "adClientCard",
                        "flexRow",
                        "gap12",
                        "aduClientCard",
                        isSelected && "aduClientCardActive"
                      )}
                      onClick={() => {
                        setSelectedClientId(item.id);
                        setGenerated(false);
                        setDraft("");
                      }}
                    >
                      <div
                        className={cx(
                          "flexCenter",
                          "noShrink",
                          "aduClientAvatar",
                          isSelected ? "aduClientAvatarActive" : "aduClientAvatarIdle"
                        )}
                      >
                        {item.avatar}
                      </div>
                      <div className={cx("flex1")}>
                        <div className={cx("text12", isSelected ? "colorText" : "colorMuted")}>
                          {item.name}
                        </div>
                        <div className={cx("text10", "colorMuted2", "mt2")}>{item.project}</div>
                      </div>
                      {isSelected && <span className={cx("text12", "colorAccent")}>◈</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb12", "trackingWide12")}>
                Tone
              </div>
              <div className={cx("flexCol", "gap6")}>
                {toneOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={cx(
                      "adOptionBtn",
                      "aduOptionBtn",
                      tone === option.key ? "aduOptionBtnActive" : "aduOptionBtnIdle"
                    )}
                    onClick={() => { setTone(option.key); setGenerated(false); }}
                  >
                    <div className={cx("text12", "mb2", tone === option.key ? "colorAccent" : "colorMuted")}>
                      {option.label}
                    </div>
                    <div className={cx("text10", "colorMuted2")}>{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb12", "trackingWide12")}>
                Focus
              </div>
              <div className={cx("flexWrap", "aduFocusWrap")}>
                {focusOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={cx(
                      "adOptionBtn",
                      "aduFocusBtn",
                      focus === option.key ? "aduFocusBtnActive" : "aduFocusBtnIdle"
                    )}
                    onClick={() => { setFocus(option.key); setGenerated(false); }}
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
                onChange={(e) => { setCustomNote(e.target.value); setGenerated(false); }}
                placeholder="e.g. Mention the revised timeline, or add a personal touch..."
                className={cx("aduNoteInput")}
              />
            </div>

            <button
              className={cx("adGenBtn", "uppercase", "aduGenBtn")}
              onClick={() => void handleGenerate()}
              type="button"
              disabled={!selectedClient || generating}
            >
              {generating ? "Generating…" : generated ? "↺ Regenerate draft" : "Generate draft →"}
            </button>
          </div>

          {/* Right column: draft */}
          <div className={cx("flexCol")}>
            <div className={cx("flexBetween", "mb14")}>
              <div className={cx("text10", "colorMuted2", "uppercase", "trackingWide12")}>
                {generated && selectedClient
                  ? `Draft - ${selectedClient.name} / ${toneOptions.find((t) => t.key === tone)?.label}`
                  : "Draft will appear here"}
              </div>
              {generated && (
                <div className={cx("flexRow", "gap8")}>
                  <button
                    type="button"
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
              )}
            </div>

            {!generated ? (
              <div className={cx("flexCenter", "flexCol", "gap12", "aduDraftEmpty")}>
                <div className={cx("aduDraftEmptyIcon")}>✦</div>
                <div className={cx("text12")}>
                  Select a client, tone, and focus - then generate
                </div>
              </div>
            ) : (
              <div className={cx("flex1", "flexCol")}>
                <div className={cx("flexRow", "gap20", "aduDraftMeta")}>
                  {[
                    {
                      label: "Source data",
                      value: `${selectedActivity?.tasks.length ?? 0} tasks, ${selectedActivity?.milestones.length ?? 0} milestones`,
                    },
                    { label: "Hours this week", value: `${selectedActivity?.hoursLogged ?? 0}h` },
                    { label: "Open blockers", value: selectedActivity?.blockers.length ?? 0 },
                  ].map((summary) => (
                    <div key={summary.label}>
                      <div
                        className={cx(
                          "textXs",
                          "colorMuted2",
                          "uppercase",
                          "trackingWide10",
                          "mb2"
                        )}
                      >
                        {summary.label}
                      </div>
                      <div className={cx("text11", "colorMuted")}>{summary.value}</div>
                    </div>
                  ))}
                </div>

                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className={cx("aduDraftTextarea")}
                />
                <div className={cx("aduCharCount")}>
                  {draft.length} chars
                </div>

                <div className={cx("flexBetween", "mt10")}>
                  <div className={cx("text10", "colorMuted2")}>
                    {draft.split(/\s+/).filter(Boolean).length} words · Edit freely before sending
                  </div>
                  <div className={cx("text10", "colorMuted2")}>
                    Sending via: Slack / Email / Portal message
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
