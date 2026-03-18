"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type FeedbackTab = "Feedback Rounds" | "Quick Reactions" | "Async Video" | "@Mentions";
type ReactionKey = "approve" | "changes" | "question";

type RoundDeliverable = {
  icon: string;
  name: string;
  status: string;
};

type Round = {
  title: string;
  meta: string;
  status: "open" | "closed";
  deadline: string | null;
  deliverables: RoundDeliverable[];
};

type MilestoneReaction = {
  id: number;
  title: string;
  meta: string;
};

type VideoItem = {
  title: string;
  from: string;
  duration: string;
  time: string;
  isNew: boolean;
  bg: string;
};

type Mention = {
  id: number;
  av: string;
  avColor: string;
  title: string;
  text: string;
  time: string;
  unread: boolean;
};

const ROUNDS: Round[] = [
  {
    title: "UI/UX Design — Round 2",
    meta: "Opened Feb 20 · Closes Feb 27 · 5 items",
    status: "open",
    deadline: "Closes in 4 days",
    deliverables: [
      { icon: "🖥", name: "Homepage Design v2", status: "Awaiting your feedback" },
      { icon: "📊", name: "Dashboard UI v1", status: "Awaiting your feedback" },
      { icon: "📱", name: "Mobile Navigation", status: "Awaiting your feedback" },
    ],
  },
  {
    title: "Brand Identity — Round 1",
    meta: "Completed Feb 14 · 3 items",
    status: "closed",
    deadline: null,
    deliverables: [
      { icon: "🎨", name: "Logo Suite v2", status: "Approved Feb 14" },
      { icon: "📄", name: "Brand Guidelines", status: "Approved Feb 14" },
      { icon: "🎨", name: "Colour Palette", status: "Approved Feb 12" },
    ],
  },
];

const MILESTONES_REACT: MilestoneReaction[] = [
  { title: "Brand Identity System complete", meta: "Delivered Feb 12 · Sipho Ndlovu", id: 1 },
  { title: "Homepage Design v2 ready for review", meta: "Delivered Feb 20 · Sipho Ndlovu", id: 2 },
  { title: "Mobile navigation flows uploaded", meta: "Delivered Feb 22 · Thabo Khumalo", id: 3 },
];

const VIDEOS: VideoItem[] = [
  { title: "Walkthrough: Homepage Design v2", from: "Sipho Ndlovu", duration: "2:34", time: "Feb 20", isNew: true, bg: "rgba(200,241,53,.08)" },
  { title: "Explaining the dashboard layout decisions", from: "Sipho Ndlovu", duration: "1:47", time: "Feb 18", isNew: false, bg: "rgba(139,111,255,.08)" },
  { title: "Brand identity final walkthrough", from: "Lerato Mokoena", duration: "4:12", time: "Feb 14", isNew: false, bg: "rgba(61,217,214,.08)" },
];

const MENTIONS: Mention[] = [
  {
    av: "SN",
    avColor: "#c8f135",
    title: "Sipho Ndlovu mentioned you",
    text: "@Naledi your approval on the dashboard UI is needed before we can start frontend. Can you review by Wednesday? Tagging you on the sign-off portal too.",
    time: "2 hours ago",
    unread: true,
    id: 1,
  },
  {
    av: "LM",
    avColor: "#8b6fff",
    title: "Lerato Mokoena mentioned you",
    text: "@Naledi I have uploaded the final brand guideline PDF to the documents section. Let me know if you want the source files too.",
    time: "Feb 19",
    unread: true,
    id: 2,
  },
  {
    av: "JM",
    avColor: "#3dd9d6",
    title: "James Mahlangu mentioned you",
    text: "@Naledi we need the homepage copy before we can start frontend. This is currently blocking sprint 4.",
    time: "Feb 18",
    unread: false,
    id: 3,
  },
];

const REACTIONS: Array<{ key: ReactionKey; emoji: string; label: string; selectedCls: string }> = [
  { key: "approve", emoji: "✅", label: "Looks good", selectedCls: styles.fbCollabSelGreen },
  { key: "changes", emoji: "🔄", label: "Needs changes", selectedCls: styles.fbCollabSelAmber },
  { key: "question", emoji: "❓", label: "Have questions", selectedCls: styles.fbCollabSelCyan },
];

const TABS: FeedbackTab[] = ["Feedback Rounds", "Quick Reactions", "Async Video", "@Mentions"];

function renderMentionText(text: string) {
  return text.split(/(@Naledi)/g).map((part, idx) => (
    part === "@Naledi"
      ? <span key={`m-${idx}`} className={styles.fbCollabMentionAccent}>{part}</span>
      : <span key={`t-${idx}`}>{part}</span>
  ));
}

export function FeedbackPage() {
  const [tab, setTab] = useState<FeedbackTab>("Feedback Rounds");
  const [reactions, setReactions] = useState<Record<number, ReactionKey | null>>({});
  const [mentions, setMentions] = useState<Mention[]>(MENTIONS);
  const [feedbackModal, setFeedbackModal] = useState<RoundDeliverable | "new" | null>(null);
  const [videoModal, setVideoModal] = useState<VideoItem | null>(null);
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const unreadCount = useMemo(() => mentions.filter((item) => item.unread).length, [mentions]);

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  return (
    <div className={cx("pageBody", styles.fbCollabRoot)}>
      <section className={styles.fbCollabMain}>
          <div className={cx("pageHeader", "mb0")}>
            <div>
              <div className={cx("pageEyebrow")}>Veldt Finance · Feedback</div>
              <h1 className={cx("pageTitle")}>Feedback &amp; Collaboration</h1>
              <p className={cx("pageSub")}>Structured review cycles, quick reactions, async video, and mentions in one place.</p>
            </div>
            <div className={cx("pageActions")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Reminder sent", "Team notified you have reviewed")}>Nudge Team</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setFeedbackModal("new")}>Submit Feedback</button>
            </div>
          </div>

          <div className={styles.fbCollabTabs}>
            {TABS.map((item) => (
              <button key={item} type="button" className={cx(styles.fbCollabTab, tab === item && styles.fbCollabTabActive)} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>

          {tab === "Feedback Rounds" ? (
            <div className={styles.fbCollabContent}>
              <div>
                <div className={styles.fbCollabSectionTitle}>Review Rounds</div>
                <div className={styles.fbCollabInfoStrip}>Give all feedback in one place per round — no scattered threads.</div>

                {ROUNDS.map((round) => (
                  <div key={round.title} className={cx(styles.fbCollabRoundCard, round.status === "open" && styles.fbCollabRoundOpen)}>
                    <div className={styles.fbCollabRoundHead}>
                      <div>
                        <div className={styles.fbCollabRoundTitle}>{round.title}</div>
                        <div className={styles.fbCollabRoundMeta}>{round.meta}</div>
                      </div>
                      <span className={cx("badge", round.status === "open" ? "badgeAccent" : "badgeGreen")}>{round.status === "open" ? "Open" : "Closed"}</span>
                    </div>

                    <div className={styles.fbCollabRoundBody}>
                      {round.deadline ? (
                        <div className={styles.fbCollabDeadlineRow}>
                          <span>⏰</span>
                          <span>{round.deadline} — please submit all feedback before this date</span>
                        </div>
                      ) : null}

                      {round.deliverables.map((deliverable) => (
                        <div key={`${round.title}-${deliverable.name}`} className={styles.fbCollabDeliverableRow}>
                          <span className={styles.fbCollabDeliverableIcon}>{deliverable.icon}</span>
                          <div className={styles.fbCollabGrow}>
                            <div className={styles.fbCollabDeliverableName}>{deliverable.name}</div>
                            <div className={styles.fbCollabDeliverableStatus}>{deliverable.status}</div>
                          </div>
                          {round.status === "open" ? (
                            <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setFeedbackModal(deliverable)}>Give Feedback</button>
                          ) : (
                            <span className={cx("badge", "badgeGreen")}>✓</span>
                          )}
                        </div>
                      ))}

                      {round.status === "open" ? (
                        <button type="button" className={cx("btnSm", "btnAccent", styles.fbCollabFullBtn)} onClick={() => notify("Feedback submitted", "Team has been notified and will respond within 24 hours")}>Submit All Feedback for This Round</button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Quick Reactions" ? (
            <div className={styles.fbCollabContent}>
              <div>
                <div className={styles.fbCollabSectionTitle}>React to Milestones</div>
                <div className={styles.fbCollabInfoStrip}>One-click reactions update the team instantly.</div>

                {MILESTONES_REACT.map((item) => (
                  <div key={item.id} className={styles.fbCollabReactionCard}>
                    <div className={styles.fbCollabReactionHead}>
                      <div>
                        <div className={styles.fbCollabReactionTitle}>{item.title}</div>
                        <div className={styles.fbCollabReactionMeta}>{item.meta}</div>
                      </div>
                      {reactions[item.id] ? <span className={cx("badge", "badgeGreen")}>Reacted</span> : null}
                    </div>

                    <div className={styles.fbCollabReactionRow}>
                      {REACTIONS.map((reaction) => (
                        <button
                          key={`${item.id}-${reaction.key}`}
                          type="button"
                          className={cx(styles.fbCollabReactionBtn, reactions[item.id] === reaction.key && reaction.selectedCls)}
                          onClick={() => {
                            setReactions((prev) => ({ ...prev, [item.id]: prev[item.id] === reaction.key ? null : reaction.key }));
                            notify("Reaction sent", "Team has been notified");
                          }}
                        >
                          <span className={styles.fbCollabReactionEmoji}>{reaction.emoji}</span>
                          <span className={styles.fbCollabReactionLabel}>{reaction.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Async Video" ? (
            <div className={styles.fbCollabContent}>
              <div>
                <div className={styles.fbCollabSectionTitle}>Video Messages</div>
                <div className={styles.fbCollabInfoStrip}>Watch walkthroughs or record quick async updates.</div>

                {VIDEOS.map((item) => (
                  <div key={item.title} className={styles.fbCollabVideoCard}>
                    <button type="button" className={styles.fbCollabVideoThumb} style={{ '--bg-color': item.bg } as React.CSSProperties} onClick={() => setVideoModal(item)}>
                      <span className={styles.fbCollabVideoPlay}>▶</span>
                      <span className={styles.fbCollabVideoDur}>{item.duration}</span>
                      {item.isNew ? <span className={styles.fbCollabVideoNew}>NEW</span> : null}
                    </button>
                    <div className={styles.fbCollabVideoBody}>
                      <div className={styles.fbCollabVideoTitle}>{item.title}</div>
                      <div className={styles.fbCollabVideoMeta}>By {item.from} · {item.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className={styles.fbCollabSectionTitle}>Record a Message</div>
                <button type="button" className={styles.fbCollabRecordZone} onClick={() => notify("Recording started", "Your browser will request microphone and camera access")}> 
                  <div className={styles.fbCollabRecordIcon}>🎥</div>
                  <div className={styles.fbCollabRecordTitle}>Record a video message</div>
                  <div className={styles.fbCollabRecordSub}>Up to 5 minutes · sent directly to your project team</div>
                  <span className={cx("btnSm", "btnAccent")}>Start Recording</span>
                </button>
              </div>
            </div>
          ) : null}

          {tab === "@Mentions" ? (
            <div className={styles.fbCollabContent}>
              <div>
                <div className={styles.fbCollabHeadInline}>
                  <div className={styles.fbCollabHeadLineWrap}>
                    <span className={styles.fbCollabSectionTitlePlain}>Mentions &amp; Tags</span>
                    <div className={styles.fbCollabHeadLine} />
                  </div>
                  {unreadCount > 0 ? (
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setMentions((prev) => prev.map((item) => ({ ...item, unread: false })))}>Mark all read</button>
                  ) : null}
                </div>

                {mentions.map((item) => (
                  <div key={item.id} className={cx(styles.fbCollabMentionCard, item.unread && styles.fbCollabMentionUnread)}>
                    <div className={styles.fbCollabMentionAvatar} style={{ '--bg-color': item.avColor } as React.CSSProperties}>{item.av}</div>
                    <div className={styles.fbCollabGrow}>
                      <div className={styles.fbCollabMentionTitle}>{item.title}</div>
                      <div className={styles.fbCollabMentionText}>{renderMentionText(item.text)}</div>
                      <div className={styles.fbCollabMentionTime}>{item.time}</div>

                      {item.unread ? (
                        <div className={styles.fbCollabMentionActions}>
                          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => notify("Reply sent", "Your response has been sent")}>Reply</button>
                          <button
                            type="button"
                            className={cx("btnSm", "btnGhost")}
                            onClick={() => {
                              setMentions((prev) => prev.map((row) => (row.id === item.id ? { ...row, unread: false } : row)));
                            }}
                          >
                            Mark read
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {item.unread ? <span className={styles.fbCollabUnreadDot} /> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

      {feedbackModal ? (
        <div className={styles.fbCollabModalBackdrop} onClick={() => setFeedbackModal(null)}>
          <div className={styles.fbCollabModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.fbCollabModalHeader}>
              <span className={styles.fbCollabModalTitle}>{feedbackModal === "new" ? "Submit New Feedback" : `Feedback: ${feedbackModal.name}`}</span>
              <button type="button" className={styles.fbCollabModalClose} onClick={() => setFeedbackModal(null)}>✕</button>
            </div>

            <div className={styles.fbCollabModalBody}>
              {feedbackModal !== "new" ? (
                <div className={styles.fbCollabDeliverableNotice}>
                  <span>{feedbackModal.icon}</span>
                  <strong>{feedbackModal.name}</strong>
                </div>
              ) : null}

              <label className={styles.fbCollabFieldLabel}>How do you feel about this?</label>
              <div className={styles.fbCollabReactionGrid}>
                {REACTIONS.map((reaction) => (
                  <button key={`modal-${reaction.key}`} type="button" className={styles.fbCollabReactionBtnCenter}>
                    <span className={styles.fbCollabReactionEmoji}>{reaction.emoji}</span>
                    <span className={styles.fbCollabReactionLabel}>{reaction.label}</span>
                  </button>
                ))}
              </div>

              <label className={styles.fbCollabFieldLabel}>Your feedback</label>
              <textarea className={styles.fbCollabFieldArea} placeholder="Be as specific as possible. What works? What needs to change?" />

              <label className={styles.fbCollabFieldLabel}>Priority</label>
              <div className={styles.fbCollabPriorityGrid}>
                {["Minor tweak", "Significant change", "Blocking issue"].map((priority) => (
                  <button key={priority} type="button" className={styles.fbCollabPriorityBtn}>{priority}</button>
                ))}
              </div>
            </div>

            <div className={styles.fbCollabModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setFeedbackModal(null)}>Cancel</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => {
                  setFeedbackModal(null);
                  notify("Feedback submitted", "Team will respond within 24 hours");
                }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {videoModal ? (
        <div className={styles.fbCollabModalBackdrop} onClick={() => setVideoModal(null)}>
          <div className={styles.fbCollabModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.fbCollabModalHeader}>
              <span className={styles.fbCollabModalTitle}>{videoModal.title}</span>
              <button type="button" className={styles.fbCollabModalClose} onClick={() => setVideoModal(null)}>✕</button>
            </div>

            <div className={styles.fbCollabModalBody}>
              <div className={styles.fbCollabPlayerStub} style={{ '--bg-color': videoModal.bg } as React.CSSProperties}>
                <div className={styles.fbCollabPlayerInner}>
                  <span className={styles.fbCollabPlayerPlay}>▶</span>
                  <div>Click to play · {videoModal.duration}</div>
                </div>
              </div>

              <div className={styles.fbCollabPlayerMeta}>
                <div><strong>From:</strong> {videoModal.from}</div>
                <div><strong>Sent:</strong> {videoModal.time}</div>
                <div><strong>Duration:</strong> {videoModal.duration}</div>
              </div>
            </div>

            <div className={styles.fbCollabModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setVideoModal(null)}>Close</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => {
                  setVideoModal(null);
                  notify("Reply recording started", "Your browser will request camera access");
                }}
              >
                Reply with Video
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.subtitle}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
