"use client";

import { useState } from "react";
import { cx } from "../style";

type StaffMember = {
  id: number;
  name: string;
  avatar: string;
  toneClass: string;
  surfaceClass: string;
  role: string;
};

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  toneClass: string;
  surfaceClass: string;
  bannerClass: string;
};

type CollabType = "review" | "feedback" | "pairing" | "cover" | "input";
type Urgency = "high" | "medium" | "low";
type RequestStatus = "pending" | "accepted" | "completed" | "declined";

type ThreadMessage = {
  authorId: number;
  text: string;
  time: string;
};

type PeerRequest = {
  id: number;
  fromId: number;
  toId: number;
  clientId: number;
  type: CollabType;
  title: string;
  description: string;
  dueBy: string;
  estimatedTime: string;
  urgency: Urgency;
  status: RequestStatus;
  createdAt: string;
  attachments: string[];
  thread: ThreadMessage[];
};

type Draft = {
  toId: number;
  clientId: number;
  type: CollabType;
  title: string;
  description: string;
  dueBy: string;
  estimatedTime: string;
  urgency: Urgency;
};

const staff: StaffMember[] = [
  { id: 1, name: "You", avatar: "YU", toneClass: "prToneAccent", surfaceClass: "prSurfaceAccent", role: "Senior Designer" },
  { id: 2, name: "Priya Nair", avatar: "PN", toneClass: "prTonePurple", surfaceClass: "prSurfacePurple", role: "Brand Strategist" },
  { id: 3, name: "James Osei", avatar: "JO", toneClass: "prToneBlue", surfaceClass: "prSurfaceBlue", role: "Junior Designer" },
  { id: 4, name: "Zara Hoffman", avatar: "ZH", toneClass: "prToneAmber", surfaceClass: "prSurfaceAmber", role: "Account Manager" },
  { id: 5, name: "Luca Ferreira", avatar: "LF", toneClass: "prToneOrange", surfaceClass: "prSurfaceOrange", role: "Motion Designer" }
];

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", toneClass: "prToneAccent", surfaceClass: "prSurfaceAccent", bannerClass: "prClientBannerAccent" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", toneClass: "prTonePurple", surfaceClass: "prSurfacePurple", bannerClass: "prClientBannerPurple" },
  { id: 3, name: "Mira Health", avatar: "MH", toneClass: "prToneBlue", surfaceClass: "prSurfaceBlue", bannerClass: "prClientBannerBlue" },
  { id: 4, name: "Dune Collective", avatar: "DC", toneClass: "prToneAmber", surfaceClass: "prSurfaceAmber", bannerClass: "prClientBannerAmber" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", toneClass: "prToneOrange", surfaceClass: "prSurfaceOrange", bannerClass: "prClientBannerOrange" }
];

const collabTypes: Record<CollabType, { label: string; icon: string; badgeClass: string; sideClass: string }> = {
  review: { label: "Peer Review", icon: "\u25CE", badgeClass: "prTypeReview", sideClass: "prCardReview" },
  feedback: { label: "Feedback", icon: "\u25CC", badgeClass: "prTypeFeedback", sideClass: "prCardFeedback" },
  pairing: { label: "Pair Session", icon: "\u25C9", badgeClass: "prTypePairing", sideClass: "prCardPairing" },
  cover: { label: "Coverage", icon: "\u22A1", badgeClass: "prTypeCover", sideClass: "prCardCover" },
  input: { label: "Expert Input", icon: "\u25C8", badgeClass: "prTypeInput", sideClass: "prCardInput" }
};

const urgencyClasses: Record<Urgency, string> = {
  high: "prToneOrange",
  medium: "prToneAmber",
  low: "prToneMuted2"
};

const initialRequests: PeerRequest[] = [
  {
    id: 1,
    fromId: 2,
    toId: 1,
    clientId: 1,
    type: "review",
    title: "Review brand guidelines before client send",
    description:
      "I drafted sections 1-3 of the Volta brand guidelines. Can you do a peer review before I send to Lena? Mainly checking for consistency with the approved logo direction and colour rationale.",
    dueBy: "Feb 25",
    estimatedTime: "45 min",
    urgency: "high",
    status: "pending",
    createdAt: "Today 9:14 AM",
    attachments: ["Volta_BrandGuidelines_v2_draft.figma", "Approved logo reference.pdf"],
    thread: [
      {
        authorId: 2,
        text: "Happy to walk you through it on a quick call if easier - 15 mins should cover it.",
        time: "9:15 AM"
      }
    ]
  },
  {
    id: 2,
    fromId: 4,
    toId: 1,
    clientId: 2,
    type: "input",
    title: "Strategy input - Kestrel LinkedIn brief",
    description:
      "James is working on the LinkedIn channel brief for Kestrel. He is flagging that the content pillars feel too broad. Can you give him 20 mins of your time? Your experience with B2B positioning would really help.",
    dueBy: "Feb 26",
    estimatedTime: "20 min",
    urgency: "medium",
    status: "pending",
    createdAt: "Yesterday 4:30 PM",
    attachments: ["LinkedIn_ChannelBrief_v1.docx"],
    thread: []
  },
  {
    id: 3,
    fromId: 3,
    toId: 1,
    clientId: 3,
    type: "pairing",
    title: "Pair session - desktop wireframe information architecture",
    description:
      "I am stuck on the IA for the Mira Health desktop flows. The patient journey and the clinician journey are overlapping in a confusing way. Could we do a 30-min whiteboard session this week?",
    dueBy: "Feb 27",
    estimatedTime: "30 min",
    urgency: "medium",
    status: "accepted",
    createdAt: "Feb 21",
    attachments: ["Mira_Wireframes_Mobile_v2.fig"],
    thread: [
      {
        authorId: 1,
        text: "Sure - Thursday at 2 PM works for me. I will set up a FigJam board beforehand.",
        time: "Feb 21 5:02 PM"
      },
      {
        authorId: 3,
        text: "Perfect, Thursday 2 PM confirmed. I will share the current state in the thread before.",
        time: "Feb 21 5:18 PM"
      }
    ]
  },
  {
    id: 4,
    fromId: 1,
    toId: 5,
    clientId: 1,
    type: "cover",
    title: "Motion guidelines - need Luca's expertise",
    description:
      "Volta wants animation guidelines as part of the brand system. I have the direction but I am not confident on the technical spec (easing values, duration guidelines for different contexts). Can you draft the motion principles section?",
    dueBy: "Mar 3",
    estimatedTime: "2 hrs",
    urgency: "low",
    status: "pending",
    createdAt: "Feb 22",
    attachments: [],
    thread: []
  },
  {
    id: 5,
    fromId: 1,
    toId: 2,
    clientId: 2,
    type: "feedback",
    title: "Messaging framework feedback - Kestrel strategy deck",
    description:
      "I wrote the messaging hierarchy in the campaign strategy deck. Before it goes to Marcus, I would love your eyes on the positioning language - you are much stronger than me on financial services tone.",
    dueBy: "Feb 24",
    estimatedTime: "30 min",
    urgency: "high",
    status: "completed",
    createdAt: "Feb 19",
    attachments: ["KC_CampaignStrategy_v3.pdf"],
    thread: [
      {
        authorId: 2,
        text: "Done - left comments in the doc. Main note: enterprise-grade is overused in FS. Swapped for institutional-quality which landed better.",
        time: "Feb 20 11:00 AM"
      },
      {
        authorId: 1,
        text: "Brilliant, thank you. Updated and sent to Marcus.",
        time: "Feb 20 2:30 PM"
      }
    ]
  }
];

const statusConfig: Record<RequestStatus, { label: string; badgeClass: string }> = {
  pending: { label: "Pending", badgeClass: "prStatusPending" },
  accepted: { label: "Accepted", badgeClass: "prStatusAccepted" },
  completed: { label: "Completed", badgeClass: "prStatusCompleted" },
  declined: { label: "Declined", badgeClass: "prStatusDeclined" }
};

const emptyDraft: Draft = {
  toId: 2,
  clientId: 1,
  type: "review",
  title: "",
  description: "",
  dueBy: "",
  estimatedTime: "",
  urgency: "medium"
};

export function PeerRequestsPage({ isActive }: { isActive: boolean }) {
  const [requests, setRequests] = useState<PeerRequest[]>(initialRequests);
  const [selected, setSelected] = useState<PeerRequest | null>(initialRequests[0]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [view, setView] = useState<"all" | "incoming" | "outgoing">("all");
  const [reply, setReply] = useState("");

  const incoming = requests.filter((request) => request.toId === 1);
  const outgoing = requests.filter((request) => request.fromId === 1);
  const pendingIncoming = incoming.filter((request) => request.status === "pending").length;
  const filtered = view === "incoming" ? incoming : view === "outgoing" ? outgoing : requests;

  const updateStatus = (id: number, status: RequestStatus) => {
    setRequests((previous) => previous.map((request) => (request.id === id ? { ...request, status } : request)));
    if (selected?.id === id) setSelected((previous) => (previous ? { ...previous, status } : previous));
  };

  const sendReply = (id: number) => {
    if (!reply.trim()) return;
    const message: ThreadMessage = { authorId: 1, text: reply, time: "Just now" };
    setRequests((previous) =>
      previous.map((request) => (request.id === id ? { ...request, thread: [...request.thread, message] } : request))
    );
    if (selected?.id === id) {
      setSelected((previous) => (previous ? { ...previous, thread: [...previous.thread, message] } : previous));
    }
    setReply("");
  };

  const saveRequest = () => {
    const next: PeerRequest = {
      id: Date.now(),
      fromId: 1,
      toId: Number(draft.toId),
      clientId: Number(draft.clientId),
      type: draft.type,
      title: draft.title,
      description: draft.description,
      dueBy: draft.dueBy,
      estimatedTime: draft.estimatedTime,
      urgency: draft.urgency,
      status: "pending",
      createdAt: "Just now",
      attachments: [],
      thread: []
    };
    setRequests((previous) => [next, ...previous]);
    setSelected(next);
    setCreating(false);
    setDraft(emptyDraft);
  };

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-peer-requests">
      <div className={cx("pageHeaderBar", "borderB", "pb0")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrow")}>Staff Dashboard / Collaboration</div>
            <h1 className={cx("pageTitle")}>Peer Requests</h1>
          </div>
          <div className={cx("flexRow", "gap20")}>
            {[
              { label: "Incoming", value: incoming.length, toneClass: "prToneMuted" },
              { label: "Needs reply", value: pendingIncoming, toneClass: pendingIncoming > 0 ? "prToneAmber" : "prToneMuted2" },
              { label: "Outgoing", value: outgoing.length, toneClass: "prToneMuted" }
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight")}>
                <div className={cx("prStatLabel")}>{stat.label}</div>
                <div className={cx("fontDisplay", "fw800", stat.toneClass)}>{stat.value}</div>
              </div>
            ))}
            <button
              type="button"
              className={cx("prNewBtn")}
              onClick={() => {
                setCreating(true);
                setSelected(null);
              }}
            >
              + New request
            </button>
          </div>
        </div>

        <div className={cx("flexRow")}>
          {[{ key: "all", label: "All" }, { key: "incoming", label: `Incoming${pendingIncoming > 0 ? ` (${pendingIncoming})` : ""}` }, { key: "outgoing", label: "Outgoing" }].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={cx("prTabBtn", view === tab.key && "prTabBtnActive")}
              onClick={() => setView(tab.key as "all" | "incoming" | "outgoing")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cx("prMainGrid")}>
        <div className={cx("prSidebar")}>
          {filtered.map((request) => {
            const ct = collabTypes[request.type];
            const from = staff.find((item) => item.id === request.fromId);
            const to = staff.find((item) => item.id === request.toId);
            const sc = statusConfig[request.status];
            const isSelected = selected?.id === request.id;
            const isIncoming = request.toId === 1;
            return (
              <div
                key={request.id}
                className={cx("prRequestCard", ct.sideClass, isSelected && "prRequestCardActive", request.status === "completed" && "prRequestCardCompleted")}
                onClick={() => {
                  setSelected(request);
                  setCreating(false);
                }}
              >
                <div className={cx("flexRow", "gap6", "mb6", "flexWrap")}>
                  <span className={cx("prTypeBadge", ct.badgeClass)}>{ct.icon} {ct.label}</span>
                  <span className={cx("prTypeBadge", sc.badgeClass)}>{sc.label}</span>
                </div>
                <div className={cx("text12", "mb6", "prRequestTitle", isSelected ? "prToneText" : "prToneMuted")}>{request.title}</div>
                <div className={cx("flexBetween")}>
                  <span className={cx("text10", "colorMuted2")}>
                    {isIncoming ? `from ${from?.name}` : `to ${to?.name}`}
                  </span>
                  <span className={cx("prUrgencyDot", urgencyClasses[request.urgency])}>&bull;</span>
                </div>
                <div className={cx("text10", "colorMuted2", "mt4")}>{request.estimatedTime} - Due {request.dueBy}</div>
              </div>
            );
          })}
        </div>

        <div className={cx("overflowAuto")}>
          {creating ? (
            <div className={cx("prDetailPane")}>
              <div className={cx("fontDisplay", "fw800", "colorText", "prFormTitle")}>New Collaboration Request</div>

              <div className={cx("formGrid2")}>
                <div>
                  <label className={cx("prFormLabel")}>Request from</label>
                  <select aria-label="Request recipient" value={draft.toId} onChange={(event) => setDraft((previous) => ({ ...previous, toId: Number(event.target.value) }))} className={cx("prFormSelect")}>
                    {staff.filter((item) => item.id !== 1).map((item) => (
                      <option key={item.id} value={item.id}>{item.name} - {item.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cx("prFormLabel")}>Client</label>
                  <select aria-label="Request client" value={draft.clientId} onChange={(event) => setDraft((previous) => ({ ...previous, clientId: Number(event.target.value) }))} className={cx("prFormSelect")}>
                    {clients.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={cx("prFormGrid3")}>
                <div>
                  <label className={cx("prFormLabel")}>Type</label>
                  <select aria-label="Request type" value={draft.type} onChange={(event) => setDraft((previous) => ({ ...previous, type: event.target.value as CollabType }))} className={cx("prFormSelect")}>
                    {Object.entries(collabTypes).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cx("prFormLabel")}>Urgency</label>
                  <select aria-label="Request urgency" value={draft.urgency} onChange={(event) => setDraft((previous) => ({ ...previous, urgency: event.target.value as Urgency }))} className={cx("prFormSelect")}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className={cx("prFormLabel")}>Due by</label>
                  <input value={draft.dueBy} onChange={(event) => setDraft((previous) => ({ ...previous, dueBy: event.target.value }))} placeholder="e.g. Feb 25" className={cx("prFormInput")} />
                </div>
              </div>

              <div>
                <label className={cx("prFormLabel")}>Title</label>
                <input value={draft.title} onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))} placeholder="What are you asking for?" className={cx("prFormInput")} />
              </div>

              <div>
                <label className={cx("prFormLabel")}>Description</label>
                <textarea value={draft.description} onChange={(event) => setDraft((previous) => ({ ...previous, description: event.target.value }))} placeholder="Context, what you need from them, and what a good outcome looks like." className={cx("prFormTextarea")} />
              </div>

              <div>
                <label className={cx("prFormLabel")}>Estimated time needed</label>
                <input value={draft.estimatedTime} onChange={(event) => setDraft((previous) => ({ ...previous, estimatedTime: event.target.value }))} placeholder="e.g. 30 min, 1 hour" className={cx("prFormInputShort")} />
              </div>

              <div className={cx("flexRow", "gap10")}>
                <button type="button" className={cx("prSaveBtn")} disabled={!draft.title.trim() || !draft.description.trim()} onClick={saveRequest}>
                  Send request
                </button>
                <button type="button" className={cx("prCancelBtn")} onClick={() => setCreating(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {selected && !creating
            ? (() => {
                const ct = collabTypes[selected.type];
                const from = staff.find((item) => item.id === selected.fromId);
                const to = staff.find((item) => item.id === selected.toId);
                const cl = clients.find((item) => item.id === selected.clientId);
                const sc = statusConfig[selected.status];
                const isIncoming = selected.toId === 1;
                return (
                  <div className={cx("prDetailPane")}>
                    <div className={cx("flexRow", "gap8", "flexWrap", "mb4")}>
                      <span className={cx("prDetailBadge", ct.badgeClass)}>{ct.icon} {ct.label}</span>
                      <span className={cx("prDetailBadge", sc.badgeClass, "prDetailBadgeStatus")}>{sc.label}</span>
                      <span className={cx("prDetailBadge", "prDetailBadgeNeutral", urgencyClasses[selected.urgency])}>{selected.urgency} priority</span>
                    </div>
                    <div className={cx("fontDisplay", "fw800", "colorText", "prDetailTitle")}>{selected.title}</div>

                    <div className={cx("flexRow", "gap16", "flexWrap")}>
                      {[from, to].map((item, index) => (
                        <div key={index} className={cx("flexRow", "gap6")}>
                          {index === 1 ? <span className={cx("text12", "colorMuted2")}>&rarr;</span> : null}
                          <div className={cx("prPersonAvatar", item?.surfaceClass ?? "prSurfaceMuted", item?.toneClass ?? "prToneMuted")}>{item?.avatar ?? "??"}</div>
                          <div>
                            <div className={cx("text11", item?.id === 1 ? "prToneAccent" : "colorText")}>{item?.name ?? "Unknown"}</div>
                            <div className={cx("prPersonRole")}>{item?.role ?? "Unknown role"}</div>
                          </div>
                        </div>
                      ))}
                      <div className={cx("prDueMeta")}>
                        <div><div className={cx("prDueMetaLabel")}>DUE</div><div className={cx("text11", "colorMuted")}>{selected.dueBy}</div></div>
                        <div><div className={cx("prDueMetaLabel")}>TIME NEEDED</div><div className={cx("text11", "colorMuted")}>{selected.estimatedTime}</div></div>
                      </div>
                    </div>

                    <div className={cx("prClientBanner", cl?.bannerClass ?? "prClientBannerMuted")}>
                      <div className={cx("prClientBannerAvatar", cl?.surfaceClass ?? "prSurfaceMuted", cl?.toneClass ?? "prToneMuted")}>{cl?.avatar ?? "??"}</div>
                      <span className={cx("text11", cl?.toneClass ?? "prToneMuted")}>{cl?.name ?? "Unknown client"}</span>
                    </div>

                    <div className={cx("prDescriptionCard")}>
                      <div className={cx("prDescriptionLabel")}>Request details</div>
                      <div className={cx("text13", "colorMuted", "prDescriptionText")}>{selected.description}</div>
                    </div>

                    {selected.attachments.length > 0 ? (
                      <div>
                        <div className={cx("prDescriptionLabel")}>Attachments</div>
                        <div className={cx("flexRow", "gap8", "flexWrap")}>
                          {selected.attachments.map((attachment) => (
                            <div key={attachment} className={cx("prAttachment")}>
                              <span className={cx("colorBlue")}>&squf;</span>{attachment}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selected.thread.length > 0 ? (
                      <div>
                        <div className={cx("prDescriptionLabel", "mb10")}>Thread</div>
                        {selected.thread.map((message, index) => {
                          const author = staff.find((item) => item.id === message.authorId);
                          const isMe = message.authorId === 1;
                          return (
                            <div key={index} className={cx("prThreadRow", isMe ? "prThreadRowMe" : "prThreadRowOther")}>
                              <div className={cx("prThreadAvatar", author?.surfaceClass ?? "prSurfaceMuted", author?.toneClass ?? "prToneMuted")}>{author?.avatar ?? "??"}</div>
                              <div className={cx(isMe ? "prThreadBubbleMe" : "prThreadBubbleOther")}>
                                <div className={cx("text12", "colorMuted", "prThreadText")}>{message.text}</div>
                                <div className={cx("prThreadTime")}>{message.time}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    {isIncoming && selected.status === "pending" ? (
                      <div className={cx("flexRow", "gap10")}>
                        <button type="button" className={cx("prAcceptBtn")} onClick={() => updateStatus(selected.id, "accepted")}>
                          &#10003; Accept
                        </button>
                        <button type="button" className={cx("prDeclineBtn")} onClick={() => updateStatus(selected.id, "declined")}>
                          Decline
                        </button>
                      </div>
                    ) : null}
                    {selected.status === "accepted" ? (
                      <div className={cx("prCompleteWrap")}>
                        <button type="button" className={cx("prCompleteBtn")} onClick={() => updateStatus(selected.id, "completed")}>
                          Mark as completed &rarr;
                        </button>
                      </div>
                    ) : null}

                    <div className={cx("prReplyRow")}>
                      <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to this request..." className={cx("prReplyInput")} />
                      <button type="button" className={cx("prSendBtn")} onClick={() => sendReply(selected.id)}>
                        Send
                      </button>
                    </div>
                  </div>
                );
              })()
            : null}
        </div>
      </div>
    </section>
  );
}
