"use client";

import { useState } from "react";
import { cx } from "../style";

type StaffMember = {
  id: number;
  name: string;
  avatar: string;
  color: string;
  role: string;
};

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  color: string;
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
  { id: 1, name: "You", avatar: "YU", color: "var(--accent)", role: "Senior Designer" },
  { id: 2, name: "Priya Nair", avatar: "PN", color: "#a78bfa", role: "Brand Strategist" },
  { id: 3, name: "James Osei", avatar: "JO", color: "#60a5fa", role: "Junior Designer" },
  { id: 4, name: "Zara Hoffman", avatar: "ZH", color: "#f5c518", role: "Account Manager" },
  { id: 5, name: "Luca Ferreira", avatar: "LF", color: "#ff8c00", role: "Motion Designer" }
];

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00" }
];

const collabTypes: Record<CollabType, { label: string; icon: string; color: string; bg: string }> = {
  review: { label: "Peer Review", icon: "◎", color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
  feedback: { label: "Feedback", icon: "◌", color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
  pairing: { label: "Pair Session", icon: "◉", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 8%, transparent)" },
  cover: { label: "Coverage", icon: "⊡", color: "#ff8c00", bg: "rgba(255,140,0,0.08)" },
  input: { label: "Expert Input", icon: "◈", color: "#f5c518", bg: "rgba(245,197,24,0.08)" }
};

const urgencyColors: Record<Urgency, string> = {
  high: "#ff8c00",
  medium: "#f5c518",
  low: "var(--muted2)"
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

const statusConfig: Record<RequestStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pending", color: "#f5c518", bg: "rgba(245,197,24,0.08)", border: "rgba(245,197,24,0.2)" },
  accepted: { label: "Accepted", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "color-mix(in srgb, var(--accent) 20%, transparent)" },
  completed: { label: "Completed", color: "#a0a0b0", bg: "rgba(160,160,176,0.06)", border: "rgba(160,160,176,0.15)" },
  declined: { label: "Declined", color: "#ff4444", bg: "rgba(255,68,68,0.08)", border: "rgba(255,68,68,0.2)" }
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
    <section className={cx("page", isActive && "pageActive")} id="page-peer-requests">
      <style>{`
        input,textarea,select{outline:none;font-family:'DM Mono',monospace;}
        input:focus,textarea:focus{border-color:color-mix(in srgb, var(--accent) 25%, transparent)!important;}
        textarea{resize:none;}
        .req-row{transition:all 0.12s ease;cursor:pointer;}
        .req-row:hover{border-color:color-mix(in srgb, var(--accent) 20%, transparent)!important;background:color-mix(in srgb, var(--accent) 2%, transparent)!important;}
        .tab-btn{transition:all 0.12s ease;cursor:pointer;border:none;font-family:'DM Mono',monospace;}
        .status-btn{transition:all 0.15s ease;cursor:pointer;font-family:'DM Mono',monospace;}
        .status-btn:hover{opacity:0.8;transform:translateY(-1px);}
        .new-btn{transition:all 0.15s ease;cursor:pointer;font-family:'DM Mono',monospace;}
        .new-btn:hover{background:#a8d420!important;}
        .save-btn{transition:all 0.15s ease;cursor:pointer;font-family:'DM Mono',monospace;}
        .save-btn:hover:not(:disabled){background:#a8d420!important;}
        .save-btn:disabled{opacity:0.3;cursor:not-allowed;}
        .send-btn{transition:all 0.12s ease;cursor:pointer;font-family:'DM Mono',monospace;}
        .send-btn:hover{opacity:0.8;}
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Staff Dashboard / Collaboration</div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Peer Requests</h1>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {[
              { label: "Incoming", value: incoming.length, color: "#a0a0b0" },
              { label: "Needs reply", value: pendingIncoming, color: pendingIncoming > 0 ? "#f5c518" : "var(--muted2)" },
              { label: "Outgoing", value: outgoing.length, color: "#a0a0b0" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
            <button
              className="new-btn"
              onClick={() => {
                setCreating(true);
                setSelected(null);
              }}
              style={{ padding: "10px 18px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", marginLeft: 8 }}
            >
              + New request
            </button>
          </div>
        </div>

        <div style={{ display: "flex" }}>
          {[{ key: "all", label: "All" }, { key: "incoming", label: `Incoming${pendingIncoming > 0 ? ` (${pendingIncoming})` : ""}` }, { key: "outgoing", label: "Outgoing" }].map((tab) => (
            <button
              key={tab.key}
              className="tab-btn"
              onClick={() => setView(tab.key as "all" | "incoming" | "outgoing")}
              style={{ padding: "10px 20px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", background: "transparent", color: view === tab.key ? "var(--accent)" : "var(--muted2)", borderBottom: `2px solid ${view === tab.key ? "var(--accent)" : "transparent"}`, marginBottom: -1 }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", minHeight: "calc(100vh - 170px)" }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", padding: "14px", display: "flex", flexDirection: "column", gap: 7, overflowY: "auto" }}>
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
                className="req-row"
                onClick={() => {
                  setSelected(request);
                  setCreating(false);
                }}
                style={{ padding: "12px 13px", borderRadius: 3, border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "rgba(255,255,255,0.06)"}`, borderLeft: `3px solid ${ct.color}`, background: isSelected ? "color-mix(in srgb, var(--accent) 2%, transparent)" : "rgba(255,255,255,0.01)", opacity: request.status === "completed" ? 0.6 : 1 }}
              >
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 9, padding: "1px 6px", background: ct.bg, color: ct.color, borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>{ct.icon} {ct.label}</span>
                  <span style={{ fontSize: 9, padding: "1px 6px", background: sc.bg, color: sc.color, borderRadius: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{sc.label}</span>
                </div>
                <div style={{ fontSize: 12, color: isSelected ? "#fff" : "#a0a0b0", lineHeight: 1.3, marginBottom: 5 }}>{request.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "var(--muted2)" }}>
                    {isIncoming ? `from ${from?.name}` : `to ${to?.name}`}
                  </span>
                  <span style={{ fontSize: 9, color: urgencyColors[request.urgency] }}>●</span>
                </div>
                <div style={{ fontSize: 9, color: "var(--muted2)", marginTop: 4 }}>{request.estimatedTime} - Due {request.dueBy}</div>
              </div>
            );
          })}
        </div>

        <div style={{ overflowY: "auto" }}>
          {creating ? (
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 18, maxWidth: 600 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>New Collaboration Request</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Request from</label>
                  <select value={draft.toId} onChange={(event) => setDraft((previous) => ({ ...previous, toId: Number(event.target.value) }))} style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}>
                    {staff.filter((item) => item.id !== 1).map((item) => (
                      <option key={item.id} value={item.id}>{item.name} - {item.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Client</label>
                  <select value={draft.clientId} onChange={(event) => setDraft((previous) => ({ ...previous, clientId: Number(event.target.value) }))} style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}>
                    {clients.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Type</label>
                  <select value={draft.type} onChange={(event) => setDraft((previous) => ({ ...previous, type: event.target.value as CollabType }))} style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}>
                    {Object.entries(collabTypes).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Urgency</label>
                  <select value={draft.urgency} onChange={(event) => setDraft((previous) => ({ ...previous, urgency: event.target.value as Urgency }))} style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Due by</label>
                  <input value={draft.dueBy} onChange={(event) => setDraft((previous) => ({ ...previous, dueBy: event.target.value }))} placeholder="e.g. Feb 25" style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Title</label>
                <input value={draft.title} onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))} placeholder="What are you asking for?" style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }} />
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Description</label>
                <textarea value={draft.description} onChange={(event) => setDraft((previous) => ({ ...previous, description: event.target.value }))} placeholder="Context, what you need from them, and what a good outcome looks like." style={{ width: "100%", minHeight: 100, padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, lineHeight: 1.7 }} />
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Estimated time needed</label>
                <input value={draft.estimatedTime} onChange={(event) => setDraft((previous) => ({ ...previous, estimatedTime: event.target.value }))} placeholder="e.g. 30 min, 1 hour" style={{ width: 200, padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="save-btn" disabled={!draft.title.trim() || !draft.description.trim()} onClick={saveRequest} style={{ padding: "11px 24px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Send request
                </button>
                <button onClick={() => setCreating(false)} style={{ padding: "11px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--muted2)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
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
                  <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, padding: "3px 9px", background: ct.bg, color: ct.color, borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>{ct.icon} {ct.label}</span>
                      <span style={{ fontSize: 10, padding: "3px 9px", background: sc.bg, color: sc.color, borderRadius: 2, border: `1px solid ${sc.border}`, letterSpacing: "0.08em", textTransform: "uppercase" }}>{sc.label}</span>
                      <span style={{ fontSize: 10, padding: "3px 9px", background: "rgba(255,255,255,0.04)", color: urgencyColors[selected.urgency], borderRadius: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{selected.urgency} priority</span>
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{selected.title}</div>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {[from, to].map((item, index) => (
                        <div key={index} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {index === 1 ? <span style={{ fontSize: 12, color: "var(--muted2)" }}>-&gt;</span> : null}
                          <div style={{ width: 24, height: 24, borderRadius: 2, background: `${item?.color ?? "#a0a0b0"}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: item?.color ?? "#a0a0b0" }}>{item?.avatar ?? "??"}</div>
                          <div>
                            <div style={{ fontSize: 11, color: item?.id === 1 ? "var(--accent)" : "var(--text)" }}>{item?.name ?? "Unknown"}</div>
                            <div style={{ fontSize: 9, color: "var(--muted2)" }}>{item?.role ?? "Unknown role"}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
                        <div><div style={{ fontSize: 9, color: "var(--muted2)", marginBottom: 2 }}>DUE</div><div style={{ fontSize: 11, color: "#a0a0b0" }}>{selected.dueBy}</div></div>
                        <div><div style={{ fontSize: 9, color: "var(--muted2)", marginBottom: 2 }}>TIME NEEDED</div><div style={{ fontSize: 11, color: "#a0a0b0" }}>{selected.estimatedTime}</div></div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: `${cl?.color ?? "#a0a0b0"}08`, border: `1px solid ${(cl?.color ?? "#a0a0b0")}25`, borderRadius: 3 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 2, background: `${cl?.color ?? "#a0a0b0"}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: cl?.color ?? "#a0a0b0" }}>{cl?.avatar ?? "??"}</div>
                      <span style={{ fontSize: 11, color: cl?.color ?? "#a0a0b0" }}>{cl?.name ?? "Unknown client"}</span>
                    </div>

                    <div style={{ padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                      <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Request details</div>
                      <div style={{ fontSize: 13, color: "#a0a0b0", lineHeight: 1.8 }}>{selected.description}</div>
                    </div>

                    {selected.attachments.length > 0 ? (
                      <div>
                        <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Attachments</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {selected.attachments.map((attachment) => (
                            <div key={attachment} style={{ padding: "6px 12px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, fontSize: 11, color: "#a0a0b0", display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ color: "#60a5fa" }}>⊡</span>{attachment}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selected.thread.length > 0 ? (
                      <div>
                        <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Thread</div>
                        {selected.thread.map((message, index) => {
                          const author = staff.find((item) => item.id === message.authorId);
                          const isMe = message.authorId === 1;
                          return (
                            <div key={index} style={{ display: "flex", gap: 10, marginBottom: 10, flexDirection: isMe ? "row-reverse" : "row" }}>
                              <div style={{ width: 22, height: 22, borderRadius: 2, background: `${author?.color ?? "#a0a0b0"}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: author?.color ?? "#a0a0b0", flexShrink: 0 }}>{author?.avatar ?? "??"}</div>
                              <div style={{ maxWidth: "72%", padding: "9px 12px", borderRadius: 3, background: isMe ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "rgba(255,255,255,0.04)", border: `1px solid ${isMe ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "rgba(255,255,255,0.06)"}` }}>
                                <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.6 }}>{message.text}</div>
                                <div style={{ fontSize: 9, color: "var(--muted2)", marginTop: 4 }}>{message.time}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    {isIncoming && selected.status === "pending" ? (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="status-btn" onClick={() => updateStatus(selected.id, "accepted")} style={{ padding: "10px 20px", background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)", borderRadius: 3, color: "var(--accent)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          ✓ Accept
                        </button>
                        <button className="status-btn" onClick={() => updateStatus(selected.id, "declined")} style={{ padding: "10px 16px", background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 3, color: "#ff4444", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Decline
                        </button>
                      </div>
                    ) : null}
                    {selected.status === "accepted" ? (
                      <div style={{ padding: "10px 14px", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 3, background: "color-mix(in srgb, var(--accent) 4%, transparent)" }}>
                        <button className="status-btn" onClick={() => updateStatus(selected.id, "completed")} style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Mark as completed -&gt;
                        </button>
                      </div>
                    ) : null}

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to this request..." style={{ flex: 1, minHeight: 52, padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, lineHeight: 1.6 }} />
                      <button className="send-btn" onClick={() => sendReply(selected.id)} style={{ padding: "10px 16px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", height: 52, flexShrink: 0 }}>
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
