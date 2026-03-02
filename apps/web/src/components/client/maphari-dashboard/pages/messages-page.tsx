"use client";

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Av, Ic } from "../ui";
import { cx, styles } from "../style";

type MsgUpdatesTab = "Messages" | "Activity" | "Support Ticket";
type Priority = "Low" | "Medium" | "High";
type Tone = "accent" | "green" | "amber" | "red" | "purple" | "muted";
type ThreadTagTone = "green" | "purple" | "amber" | "red" | "muted";
type ActivityTone = "accent" | "amber" | "purple" | "red" | "green";

type ThreadTag = {
  label: string;
  tone: ThreadTagTone;
};

type Thread = {
  id: number;
  name: string;
  avatar: string;
  title: string;
  preview: string;
  time: string;
  tags: ThreadTag[];
  unread: boolean;
  project: string;
  tone: Tone;
};

type MsgFile = {
  name: string;
  size: string;
};

type ChatMessage = {
  id: number;
  threadId: number;
  from: string;
  fromName: string;
  text: string;
  time: string;
  mine: boolean;
  reactions: string[];
  tone: Tone;
  file?: MsgFile;
};

type ActivityItem = {
  tone: ActivityTone;
  text: string;
  time: string;
};

type ToastState = { text: string; sub: string } | null;
const TABS: MsgUpdatesTab[] = ["Messages", "Activity", "Support Ticket"];

const THREADS: Thread[] = [
  {
    id: 1,
    name: "Thabo Khumalo",
    avatar: "TK",
    title: "Stripe Integration - Staging Live",
    preview: "All endpoints confirmed. Ready for your go-ahead on production deploy.",
    time: "Now",
    tags: [{ tone: "green", label: "projects" }],
    unread: true,
    project: "Client Portal v2",
    tone: "amber",
  },
  {
    id: 2,
    name: "James Mahlangu",
    avatar: "JM",
    title: "UAT Checklist - Items 1-7",
    preview: "Checklist shared. 7 items need your sign-off before Friday's window.",
    time: "2h",
    tags: [{ tone: "amber", label: "milestone" }],
    unread: true,
    project: "Lead Pipeline",
    tone: "red",
  },
  {
    id: 3,
    name: "Lerato Mokoena",
    avatar: "LM",
    title: "Updated Figma Screens v3",
    preview: "14 screens exported. Handoff doc attached in this thread.",
    time: "Yesterday",
    tags: [{ tone: "purple", label: "design" }],
    unread: false,
    project: "Automation Suite",
    tone: "purple",
  },
  {
    id: 4,
    name: "Sipho Ndlovu",
    avatar: "SN",
    title: "Q1 Kickoff - Action Items",
    preview: "Meeting notes attached. Your approvals needed on 3 items.",
    time: "Feb 18",
    tags: [{ tone: "muted", label: "general" }],
    unread: false,
    project: "All Projects",
    tone: "accent",
  },
  {
    id: 5,
    name: "Nomsa Dlamini",
    avatar: "ND",
    title: "QA Report - Sprint 4",
    preview: "All tests passing. Zero critical issues found in staging.",
    time: "Feb 17",
    tags: [{ tone: "green", label: "qa" }],
    unread: false,
    project: "Client Portal v2",
    tone: "green",
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    threadId: 1,
    from: "TK",
    fromName: "Thabo K.",
    text: "Hey! Stripe integration is live on staging. All endpoints returning expected responses.",
    time: "09:12",
    mine: false,
    reactions: ["👍", "✅"],
    tone: "amber",
  },
  {
    id: 2,
    threadId: 1,
    from: "TK",
    fromName: "Thabo K.",
    text: "I attached the deployment checklist below. Once approved, we can push to production in under an hour.",
    time: "09:13",
    mine: false,
    reactions: [],
    tone: "amber",
    file: { name: "Deployment-Checklist-v2.pdf", size: "124 KB" },
  },
  {
    id: 3,
    threadId: 1,
    from: "me",
    fromName: "You",
    text: "Great work. Give me 20 minutes to review and I will confirm.",
    time: "09:31",
    mine: true,
    reactions: ["🔥"],
    tone: "accent",
  },
  {
    id: 4,
    threadId: 1,
    from: "TK",
    fromName: "Thabo K.",
    text: "No rush. Load test is clean - p95 latency under 180ms.",
    time: "09:33",
    mine: false,
    reactions: ["💪"],
    tone: "amber",
  },
  {
    id: 5,
    threadId: 1,
    from: "me",
    fromName: "You",
    text: "Reviewed and approved. Go ahead with production deploy.",
    time: "09:52",
    mine: true,
    reactions: ["✅", "🎉"],
    tone: "accent",
  },
];

const ACTIVITY: ActivityItem[] = [
  { tone: "accent", text: "Thabo K. sent a message in Stripe Integration", time: "Just now" },
  { tone: "amber", text: "James M. shared UAT checklist - 7 items pending", time: "2h ago" },
  { tone: "purple", text: "Lerato M. uploaded 14 Figma screens", time: "Yesterday" },
  { tone: "red", text: "System flagged INV-011 as overdue", time: "Feb 19" },
  { tone: "green", text: "Nomsa D. closed all QA issues in Sprint 4", time: "Feb 17" },
];

function toneDotClass(tone: Tone | ThreadTagTone | ActivityTone): string {
  if (tone === "green") return "msguDotGreen";
  if (tone === "amber") return "msguDotAmber";
  if (tone === "red") return "msguDotRed";
  if (tone === "purple") return "msguDotPurple";
  if (tone === "muted") return "msguDotMuted";
  return "msguDotAccent";
}

function badgeToneClass(tone: ThreadTagTone): string {
  if (tone === "green") return "msguTagGreen";
  if (tone === "purple") return "msguTagPurple";
  if (tone === "amber") return "msguTagAmber";
  if (tone === "red") return "msguTagRed";
  return "msguTagMuted";
}

function bubbleToneClass(tone: Tone, mine: boolean): string {
  if (mine) return "msguBubbleMine";
  if (tone === "amber") return "msguBubbleAmber";
  if (tone === "red") return "msguBubbleRed";
  if (tone === "purple") return "msguBubblePurple";
  if (tone === "green") return "msguBubbleGreen";
  return "msguBubbleTheirs";
}

function tabId(tab: MsgUpdatesTab): string {
  return `messages-tab-${tab.toLowerCase().replace(/\s+/g, "-")}`;
}

function panelId(tab: MsgUpdatesTab): string {
  return `messages-panel-${tab.toLowerCase().replace(/\s+/g, "-")}`;
}

export function MessagesPage() {
  const [activeTab, setActiveTab] = useState<MsgUpdatesTab>("Messages");
  const [threads, setThreads] = useState<Thread[]>(THREADS);
  const [activeThreadId, setActiveThreadId] = useState<number>(THREADS[0]?.id ?? 1);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [compose, setCompose] = useState("");
  const [searchThread, setSearchThread] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Project / Milestone Issue");
  const [ticketProject, setTicketProject] = useState("Select a project...");
  const [ticketDescription, setTicketDescription] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const msgBodyRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Partial<Record<MsgUpdatesTab, HTMLButtonElement | null>>>({});
  const threadButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const unreadCount = useMemo(() => threads.filter((thread) => thread.unread).length, [threads]);

  const filteredThreads = useMemo(() => {
    const query = searchThread.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((thread) =>
      thread.title.toLowerCase().includes(query) || thread.preview.toLowerCase().includes(query),
    );
  }, [searchThread, threads]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [activeThreadId, threads],
  );

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.threadId === activeThreadId),
    [activeThreadId, messages],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!msgBodyRef.current) return;
    msgBodyRef.current.scrollTop = msgBodyRef.current.scrollHeight;
  }, [visibleMessages]);

  const showToast = (text: string, sub: string) => setToast({ text, sub });

  const selectThread = (threadId: number) => {
    const selected = threads.find((thread) => thread.id === threadId);
    setActiveThreadId(threadId);
    setThreads((prev) => prev.map((thread) => (thread.id === threadId ? { ...thread, unread: false } : thread)));
    if (selected) {
      setLiveAnnouncement(
        `${selected.title}. ${selected.project}.${selected.unread ? " Marked as read." : ""}`,
      );
    }
  };

  const sendMessage = () => {
    const text = compose.trim();
    if (!text || !activeThread) return;
    const nextMessage: ChatMessage = {
      id: Date.now(),
      threadId: activeThread.id,
      from: "me",
      fromName: "You",
      text,
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
      mine: true,
      reactions: [],
      tone: "accent",
    };
    setMessages((prev) => [...prev, nextMessage]);
    setCompose("");
    setLiveAnnouncement("Message sent.");
  };

  const addReaction = (msgId: number, emoji: string) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== msgId) return message;
        const exists = message.reactions.includes(emoji);
        return {
          ...message,
          reactions: exists ? message.reactions.filter((item) => item !== emoji) : [...message.reactions, emoji],
        };
      }),
    );
  };

  const submitTicket = () => {
    showToast("Ticket submitted", "We'll respond within 1 business day.");
    setTicketSubject("");
    setTicketDescription("");
    setPriority("Medium");
    setTicketCategory("Project / Milestone Issue");
    setTicketProject("Select a project...");
    setLiveAnnouncement("Support ticket submitted.");
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tab: MsgUpdatesTab) => {
    const index = TABS.indexOf(tab);
    if (index < 0) return;

    let targetIndex = index;
    if (event.key === "ArrowRight") targetIndex = (index + 1) % TABS.length;
    if (event.key === "ArrowLeft") targetIndex = (index - 1 + TABS.length) % TABS.length;
    if (event.key === "Home") targetIndex = 0;
    if (event.key === "End") targetIndex = TABS.length - 1;
    if (targetIndex === index) return;

    event.preventDefault();
    const nextTab = TABS[targetIndex];
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const handleThreadKeyDown = (event: KeyboardEvent<HTMLButtonElement>, threadId: number) => {
    const index = filteredThreads.findIndex((thread) => thread.id === threadId);
    if (index < 0) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (index + delta + filteredThreads.length) % filteredThreads.length;
      const nextThreadId = filteredThreads[nextIndex]?.id;
      if (!nextThreadId) return;
      selectThread(nextThreadId);
      threadButtonRefs.current[nextThreadId]?.focus();
    }
  };

  return (
    <div className={cx("pageBody", "msguPageRoot")}>
      <div className={cx("msguPage")}> 
        <div className={cx("msguMain")}>
          <div className={cx("pageHeader")}> 
            <div>
              <div className={cx("pageEyebrow")}>Communication · Inbox</div>
              <h1 className={cx("pageTitle")}>Messages & Updates</h1>
              <p className={cx("pageSub")}>Threaded conversations, status nudges, reactions, and support tickets.</p>
            </div>
            <div className={cx("pageActions")}>
              {unreadCount > 0 ? <span className={cx("msguUnreadPill")}>{unreadCount} unread</span> : null}
              <button className={cx("btnSm", "btnGhost")} type="button" onClick={() => showToast("Status nudge sent", "Team has been notified.")}>Nudge Team</button>
              <button className={cx("btnSm", "btnAccent")} type="button" onClick={() => showToast("Composer", "New thread composer opened.")}>+ New Thread</button>
            </div>
          </div>

          <div className={styles.filterTabs} role="tablist" aria-label="Messages page sections">
            {TABS.map((tab) => (
              <button
                key={tab}
                id={tabId(tab)}
                type="button"
                className={cx("filterTab", activeTab === tab && "filterTabActive")}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(event) => handleTabKeyDown(event, tab)}
                role="tab"
                tabIndex={activeTab === tab ? 0 : -1}
                aria-selected={activeTab === tab}
                aria-controls={panelId(tab)}
                ref={(element) => {
                  tabRefs.current[tab] = element;
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Messages" ? (
            <div
              className={cx("msguCommLayout")}
              role="tabpanel"
              id={panelId("Messages")}
              aria-labelledby={tabId("Messages")}
            >
              <section className={cx("msguFeedCol")}>
                <label htmlFor="messages-thread-search" className={cx("srOnly")}>
                  Search message threads
                </label>
                <div className={cx("msguThreadSearch")}> 
                  <span aria-hidden="true">
                    <Ic n="search" sz={12} c="var(--muted2)" />
                  </span>
                  <input
                    id="messages-thread-search"
                    placeholder="Search threads..."
                    value={searchThread}
                    onChange={(event) => setSearchThread(event.target.value)}
                    aria-label="Search threads"
                  />
                </div>

                <div className={cx("msguThreadList")} role="listbox" aria-label="Conversation threads">
                  {filteredThreads.length === 0 ? (
                    <div className={cx("msguThreadEmpty")} role="status">
                      No threads match this search.
                    </div>
                  ) : (
                    filteredThreads.map((thread) => (
                      <button
                        key={thread.id}
                        id={`msg-thread-${thread.id}`}
                        type="button"
                        role="option"
                        aria-selected={activeThreadId === thread.id}
                        aria-label={`${thread.title}, ${thread.project}${thread.unread ? ", unread" : ""}`}
                        className={cx(
                          "msguThreadItem",
                          activeThreadId === thread.id && "msguThreadItemActive",
                          thread.unread && "msguThreadItemUnread",
                        )}
                        onClick={() => selectThread(thread.id)}
                        onKeyDown={(event) => handleThreadKeyDown(event, thread.id)}
                        ref={(element) => {
                          threadButtonRefs.current[thread.id] = element;
                        }}
                      >
                        <Av initials={thread.avatar} size={34} />
                        <div className={cx("msguThreadBody")}>
                          <div className={cx("msguThreadTop")}> 
                            <span className={cx("msguThreadTitle")} title={thread.title}>{thread.title}</span>
                            <span className={cx("msguThreadTime")}>{thread.time}</span>
                          </div>
                          <div className={cx("msguThreadPreview")}>{thread.preview}</div>
                          <div className={cx("msguThreadTags")}>
                            {thread.tags.map((tag) => (
                              <span key={`${thread.id}-${tag.label}`} className={cx("msguTag", badgeToneClass(tag.tone))}>{tag.label}</span>
                            ))}
                            <span className={cx("msguThreadProject")}>{thread.project}</span>
                          </div>
                        </div>
                        {thread.unread ? <span className={cx("msguThreadPulse")} aria-hidden="true" /> : null}
                      </button>
                    ))
                  )}
                </div>
              </section>

              <section className={cx("msguThreadCol")}>
                {activeThread ? (
                  <>
                    <div className={cx("msguThreadHeader")}> 
                      <div>
                        <div className={cx("msguThreadHeaderTitle")}>{activeThread.title}</div>
                        <div className={cx("msguThreadHeaderSub")}>{activeThread.project} · {activeThread.name}</div>
                      </div>
                      <div className={cx("msguThreadHeaderActions")}> 
                        <button type="button" className={cx("msguIconBtn")} aria-label="Pin thread" onClick={() => showToast("Pinned", "Thread pinned")}>📌</button>
                        <button type="button" className={cx("msguIconBtn")} aria-label="Search in conversation" onClick={() => showToast("Search", "Search opened")}>🔍</button>
                        <button type="button" className={cx("msguIconBtn")} aria-label="Open more thread actions" onClick={() => showToast("More", "More actions")}>⋯</button>
                      </div>
                    </div>

                    <div
                      className={cx("msguMsgBody")}
                      ref={msgBodyRef}
                      role="log"
                      aria-live="polite"
                      aria-relevant="additions text"
                      aria-label={`Conversation with ${activeThread.name}`}
                    >
                      {visibleMessages.map((message) => (
                        <div key={message.id} className={cx("msguBubbleRow", message.mine && "msguBubbleRowMine")}>
                          {!message.mine ? <Av initials={message.from} size={28} /> : null}

                          <div className={cx("msguBubbleContent")}> 
                            <div className={cx("msguBubbleName", message.mine && "msguBubbleNameRight")}>{message.fromName}</div>
                            <div className={cx("msguBubble", bubbleToneClass(message.tone, message.mine))}>
                              {message.text}
                              {message.file ? (
                                <div className={cx("msguFileBubble")}> 
                                  <div className={cx("msguFileIcon")}>📄</div>
                                  <div>
                                    <div className={cx("msguFileName")}>{message.file.name}</div>
                                    <div className={cx("msguFileSize")}>{message.file.size}</div>
                                  </div>
                                  <button
                                    type="button"
                                    className={cx("msguFileDownload")}
                                    aria-label={`Download ${message.file.name}`}
                                    onClick={() => {
                                      const fileName = message.file?.name ?? "attachment";
                                      showToast("Downloading...", fileName);
                                    }}
                                  >
                                    ↓
                                  </button>
                                </div>
                              ) : null}
                            </div>
                            <div className={cx("msguBubbleTime", message.mine && "msguBubbleTimeRight")}>{message.time}</div>

                            {message.reactions.length > 0 ? (
                              <div className={cx("msguReactions")}> 
                                {message.reactions.map((reaction) => (
                                  <button
                                    key={`${message.id}-${reaction}`}
                                    type="button"
                                    className={cx("msguReaction", message.mine && "msguReactionMine")}
                                    aria-label={`Toggle reaction ${reaction}`}
                                    onClick={() => addReaction(message.id, reaction)}
                                  >
                                    {reaction}
                                  </button>
                                ))}
                                <button type="button" className={cx("msguReaction")} aria-label="Add thumbs up reaction" onClick={() => addReaction(message.id, "👍")}>+</button>
                              </div>
                            ) : null}
                          </div>

                          {message.mine ? <Av initials="Me" size={28} /> : null}
                        </div>
                      ))}
                    </div>

                    <div className={cx("msguComposeWrap")}>
                      <div className={cx("msguMentionRow")}> 
                        <span className={cx("msguMentionLabel")}>@ Mention:</span>
                        {threads.slice(0, 4).map((thread) => (
                          <button
                            key={`mention-${thread.id}`}
                            type="button"
                            className={cx("msguMentionBtn")}
                            aria-label={`Mention ${thread.name}`}
                            onClick={() => setCompose((prev) => `${prev} @${thread.name.split(" ")[0]}`.trim())}
                          >
                            {thread.name.split(" ")[0]}
                          </button>
                        ))}
                      </div>

                      <div className={cx("msguComposeInputWrap")}> 
                        <textarea
                          className={cx("msguComposeInput")}
                          rows={1}
                          placeholder="Type a message... use @ to mention someone"
                          aria-label="Message composer"
                          value={compose}
                          onChange={(event) => setCompose(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              sendMessage();
                            }
                          }}
                        />
                        <div className={cx("msguComposeActions")}>
                          <button type="button" className={cx("msguComposeBtn")} aria-label="Attach a file" onClick={() => showToast("File picker", "Choose a file to attach")}>📎</button>
                          <button type="button" className={cx("msguComposeBtn")} aria-label="Record voice note" onClick={() => showToast("Voice note", "Recording started")}>🎙</button>
                          <button type="button" className={cx("msguSendBtn")} aria-label="Send message" onClick={sendMessage}>→</button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </section>

              <aside className={cx("msguRightCol")}>
                <div className={cx("msguNudgeCard")}>
                  <div className={cx("msguNudgeTitle")}>Request an Update</div>
                  <div className={cx("msguNudgeSub")}>Send a gentle nudge to the team without messaging directly.</div>
                  <button
                    type="button"
                    className={cx("msguNudgeBtn")}
                    onClick={() => showToast("Status nudge sent", "Team has been notified you're waiting for an update")}
                  >
                    Send Nudge
                  </button>
                </div>

                <div className={cx("msguSideSectionWrap")}>
                  <div className={cx("msguSideSectionTitle")}>Recent Activity</div>
                  {ACTIVITY.map((item, index) => (
                    <div key={`${item.text}-${index}`} className={cx("msguActivityItem")}>
                      <span className={cx("msguActivityDot", toneDotClass(item.tone))} />
                      <div>
                        <div className={cx("msguActivityText")}>{item.text}</div>
                        <div className={cx("msguActivityTime")}>{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          ) : null}

          {activeTab === "Activity" ? (
            <div
              className={cx("msguActivityPage")}
              role="tabpanel"
              id={panelId("Activity")}
              aria-labelledby={tabId("Activity")}
            >
              {[...ACTIVITY, ...ACTIVITY.map((item, index) => ({ ...item, time: `${index + 1} weeks ago` }))].map((item, index) => (
                <div key={`${item.text}-${index}`} className={cx("msguActivityRow")}> 
                  <span className={cx("msguActivityDot", toneDotClass(item.tone))} />
                  <div className={cx("msguGrow")}> 
                    <div className={cx("msguActivityText")}>{item.text}</div>
                    <div className={cx("msguActivityTime")}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "Support Ticket" ? (
            <div
              className={cx("msguTicketPage")}
              role="tabpanel"
              id={panelId("Support Ticket")}
              aria-labelledby={tabId("Support Ticket")}
            >
              <div className={cx("card", "msguTicketIntro")}> 
                <div className={cx("msguTicketIntroTitle")}>Submit a Support Ticket</div>
                <div className={cx("msguTicketIntroSub")}>Log an issue, ask a question, or flag something that needs attention. We respond within 1 business day.</div>
              </div>

              <div className={cx("card", "msguTicketForm")}> 
                <label className={cx("msguFieldLabel")} htmlFor="support-ticket-subject">Subject</label>
                <input
                  id="support-ticket-subject"
                  className={cx("msguFieldInput")}
                  placeholder="Brief description of the issue"
                  value={ticketSubject}
                  onChange={(event) => setTicketSubject(event.target.value)}
                />

                <label className={cx("msguFieldLabel")} htmlFor="support-ticket-category">Category</label>
                <select
                  id="support-ticket-category"
                  className={cx("msguFieldInput")}
                  value={ticketCategory}
                  onChange={(event) => setTicketCategory(event.target.value)}
                >
                  <option>Project / Milestone Issue</option>
                  <option>Invoice / Billing Query</option>
                  <option>Technical Problem</option>
                  <option>Communication Issue</option>
                  <option>File / Document Access</option>
                  <option>Other</option>
                </select>

                <label className={cx("msguFieldLabel")}>Priority</label>
                <div className={cx("msguPriorityGrid")} role="radiogroup" aria-label="Ticket priority">
                  {(["Low", "Medium", "High"] as Priority[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={priority === level}
                      className={cx(
                        "msguPriorityBtn",
                        level === "Low" && priority === level && "msguPriorityLow",
                        level === "Medium" && priority === level && "msguPriorityMed",
                        level === "High" && priority === level && "msguPriorityHigh",
                      )}
                      onClick={() => setPriority(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                <label className={cx("msguFieldLabel")} htmlFor="support-ticket-project">Project (if applicable)</label>
                <select
                  id="support-ticket-project"
                  className={cx("msguFieldInput")}
                  value={ticketProject}
                  onChange={(event) => setTicketProject(event.target.value)}
                >
                  <option>Select a project...</option>
                  <option>Client Portal v2</option>
                  <option>Lead Pipeline Rebuild</option>
                  <option>Automation Suite</option>
                  <option>Not project-specific</option>
                </select>

                <label className={cx("msguFieldLabel")} htmlFor="support-ticket-description">Description</label>
                <textarea
                  id="support-ticket-description"
                  className={cx("msguFieldTextarea")}
                  placeholder="Describe the issue in detail. Include steps to reproduce if technical."
                  value={ticketDescription}
                  onChange={(event) => setTicketDescription(event.target.value)}
                />

                <label className={cx("msguFieldLabel")}>Attachments (optional)</label>
                <div className={cx("msguUploadBox")}>Drop files here or click to upload · Max 10MB per file</div>

                <button
                  type="button"
                  className={cx("btnSm", "btnAccent", "msguSubmitBtn")}
                  onClick={submitTicket}
                  disabled={!ticketSubject.trim() || !ticketDescription.trim()}
                >
                  Submit Ticket
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {toast ? (
        <div className={cx("msguToast")} role="status" aria-live="polite" aria-atomic="true">
          <div className={cx("msguToastIcon")}>✓</div>
          <div>
            <div className={cx("msguToastText")}>{toast.text}</div>
            <div className={cx("msguToastSub")}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
      <div className={cx("srOnly")} aria-live="polite" aria-atomic="true">{liveAnnouncement}</div>
    </div>
  );
}
