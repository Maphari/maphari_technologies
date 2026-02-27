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
  project: string;
};

type HandoverUrgency = "critical" | "high" | "medium" | "low";
type HandoverStatus = "active" | "complete" | "draft";

type HandoverItem = {
  id: number;
  fromId: number;
  toId: number;
  clientId: number;
  title: string;
  urgency: HandoverUrgency;
  context: string;
  openItems: string[];
  clientNotes: string;
  credentials: string;
  dueDate: string;
  myReturnDate: string;
  status: HandoverStatus;
  createdAt: string;
  acknowledged: boolean;
};

type Draft = {
  toId: number;
  clientId: number;
  title: string;
  urgency: HandoverUrgency;
  context: string;
  openItems: string[];
  clientNotes: string;
  credentials: string;
  dueDate: string;
  myReturnDate: string;
};

const staff: StaffMember[] = [
  { id: 1, name: "You", avatar: "YU", color: "var(--accent)", role: "Senior Designer" },
  { id: 2, name: "Priya Nair", avatar: "PN", color: "#a78bfa", role: "Brand Strategist" },
  { id: 3, name: "James Osei", avatar: "JO", color: "#60a5fa", role: "Junior Designer" },
  { id: 4, name: "Zara Hoffman", avatar: "ZH", color: "#f5c518", role: "Account Manager" },
  { id: 5, name: "Luca Ferreira", avatar: "LF", color: "#ff8c00", role: "Motion Designer" }
];

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)", project: "Brand Identity System" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa", project: "Q1 Campaign Strategy" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa", project: "Website Redesign" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518", project: "Editorial Design System" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00", project: "Annual Report 2025" }
];

const urgencyConfig: Record<HandoverUrgency, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "#ff4444", bg: "rgba(255,68,68,0.08)", border: "rgba(255,68,68,0.2)" },
  high: { label: "High", color: "#ff8c00", bg: "rgba(255,140,0,0.08)", border: "rgba(255,140,0,0.2)" },
  medium: { label: "Medium", color: "#f5c518", bg: "rgba(245,197,24,0.08)", border: "rgba(245,197,24,0.2)" },
  low: { label: "Low", color: "#a0a0b0", bg: "rgba(160,160,176,0.06)", border: "rgba(160,160,176,0.15)" }
};

const initialHandovers: HandoverItem[] = [
  {
    id: 1,
    fromId: 1,
    toId: 3,
    clientId: 1,
    title: "Brand guidelines - cover the logo section while I am out",
    urgency: "high",
    context:
      "Lena approved the logo on Feb 22. The brand guidelines doc is in Drive > Volta > Brand Guidelines v1. Section 1 (logo usage) is 60% done - I drafted the clear space rules and misuse examples but have not done the responsive sizing chart yet.\n\nUse the sizing from the master Figma file (Volta / Logo / Sizing grid). The template for the chart is already on page 4.",
    openItems: [
      "Complete responsive logo sizing chart (Figma reference linked in Drive doc)",
      "Write the colour-on-colour usage rules - lime on dark, dark on white",
      "Do not approve any milestone until I am back - Lena prefers to deal with me directly"
    ],
    clientNotes: "Lena communicates via portal messages only. She replies fast in the mornings (9-11 AM). Do not CC Tobias on anything.",
    credentials: "Figma access already shared. Drive folder: Clients / Volta Studios / Brand Identity",
    dueDate: "Mar 1",
    myReturnDate: "Feb 28",
    status: "active",
    createdAt: "Feb 23",
    acknowledged: false
  },
  {
    id: 2,
    fromId: 4,
    toId: 1,
    clientId: 4,
    title: "Monitor Dune situation - escalate if needed",
    urgency: "critical",
    context:
      "Kofi Asante has been silent for 6 days. I sent 3 follow-ups. The Type & Grid System milestone is 12 days past due and the retainer has been exceeded by 4.5 hours.\n\nI am stepping away from this client for 2 weeks (holiday). You are the point of contact. Do not do any more billable work until Kofi responds and approves the exceeded hours.",
    openItems: [
      "Send one final follow-up message (template in SOPs > Comms)",
      "If no response by Feb 28 - escalate to director (email Sofia)",
      "Do not begin the Master Template milestone under any circumstances",
      "Log this handover in the decision log"
    ],
    clientNotes:
      "Kofi goes silent for 5-10 days, then comes back. This may be normal. But the retainer overage is new - that is the urgent bit. Keep tone warm but firm.",
    credentials: "Full project files in Drive > Dune Collective > Editorial Design. InDesign files in Packaging folder.",
    dueDate: "Mar 6",
    myReturnDate: "Mar 8",
    status: "active",
    createdAt: "Feb 22",
    acknowledged: true
  }
];

const statusConfig: Record<HandoverStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 8%, transparent)" },
  complete: { label: "Complete", color: "#a0a0b0", bg: "rgba(160,160,176,0.06)" },
  draft: { label: "Draft", color: "var(--muted2)", bg: "rgba(255,255,255,0.04)" }
};

const emptyDraft: Draft = {
  toId: 3,
  clientId: 1,
  title: "",
  urgency: "medium",
  context: "",
  openItems: [""],
  clientNotes: "",
  credentials: "",
  dueDate: "",
  myReturnDate: ""
};

export function StaffHandoversPage({ isActive }: { isActive: boolean }) {
  const [handovers, setHandovers] = useState<HandoverItem[]>(initialHandovers);
  const [selected, setSelected] = useState<HandoverItem | null>(initialHandovers[0]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [view, setView] = useState<"all" | "incoming" | "outgoing">("all");

  const acknowledge = (id: number) => {
    setHandovers((previous) => previous.map((row) => (row.id === id ? { ...row, acknowledged: true } : row)));
    if (selected?.id === id) setSelected((previous) => (previous ? { ...previous, acknowledged: true } : previous));
  };

  const addItem = () => setDraft((previous) => ({ ...previous, openItems: [...previous.openItems, ""] }));
  const updateItem = (index: number, value: string) =>
    setDraft((previous) => ({ ...previous, openItems: previous.openItems.map((item, itemIndex) => (itemIndex === index ? value : item)) }));
  const removeItem = (index: number) =>
    setDraft((previous) => ({ ...previous, openItems: previous.openItems.filter((_, itemIndex) => itemIndex !== index) }));

  const saveHandover = () => {
    const next: HandoverItem = {
      id: Date.now(),
      fromId: 1,
      toId: Number(draft.toId),
      clientId: Number(draft.clientId),
      title: draft.title,
      urgency: draft.urgency,
      context: draft.context,
      openItems: draft.openItems.filter(Boolean),
      clientNotes: draft.clientNotes,
      credentials: draft.credentials,
      dueDate: draft.dueDate,
      myReturnDate: draft.myReturnDate,
      status: "active",
      createdAt: "Today",
      acknowledged: false
    };
    setHandovers((previous) => [next, ...previous]);
    setSelected(next);
    setCreating(false);
    setDraft(emptyDraft);
  };

  const filtered = handovers.filter((row) => {
    if (view === "incoming") return row.toId === 1;
    if (view === "outgoing") return row.fromId === 1;
    return true;
  });

  const incomingUnack = handovers.filter((row) => row.toId === 1 && !row.acknowledged).length;

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-staff-handovers">
      <style>{`
        input,textarea,select{outline:none;font-family:'DM Mono',monospace;}
        input:focus,textarea:focus{border-color:color-mix(in srgb, var(--accent) 25%, transparent)!important;}
        textarea{resize:none;}
        .handover-row{transition:all 0.12s ease;cursor:pointer;}
        .handover-row:hover{border-color:color-mix(in srgb, var(--accent) 20%, transparent)!important;background:color-mix(in srgb, var(--accent) 2%, transparent)!important;}
        .tab-btn{transition:all 0.12s ease;cursor:pointer;border:none;font-family:'DM Mono',monospace;}
        .new-btn{transition:all 0.15s ease;cursor:pointer;font-family:'DM Mono',monospace;}
        .new-btn:hover{background:#a8d420!important;}
        .save-btn{transition:all 0.15s ease;cursor:pointer;font-family:'DM Mono',monospace;}
        .save-btn:hover:not(:disabled){background:#a8d420!important;}
        .save-btn:disabled{opacity:0.3;cursor:not-allowed;}
        .ack-btn{transition:all 0.15s ease;cursor:pointer;font-family:'DM Mono',monospace;}
        .ack-btn:hover{background:color-mix(in srgb, var(--accent) 15%, transparent)!important;}
        .remove-item{cursor:pointer;background:none;border:none;font-family:'DM Mono',monospace;}
        .remove-item:hover{color:#ff4444!important;}
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Workflow
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Staff Handovers
            </h1>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {[
              { label: "Active", value: handovers.filter((row) => row.status === "active").length, color: "#a0a0b0" },
              { label: "Incoming", value: handovers.filter((row) => row.toId === 1).length, color: incomingUnack > 0 ? "#f5c518" : "#a0a0b0" },
              { label: "Unacked", value: incomingUnack, color: incomingUnack > 0 ? "#ff4444" : "var(--muted2)" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
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
              + New handover
            </button>
          </div>
        </div>

        <div style={{ display: "flex" }}>
          {[
            { key: "all", label: "All handovers" },
            { key: "incoming", label: `Incoming${incomingUnack > 0 ? ` (${incomingUnack})` : ""}` },
            { key: "outgoing", label: "Outgoing" }
          ].map((tab) => (
            <button
              key={tab.key}
              className="tab-btn"
              onClick={() => setView(tab.key as "all" | "incoming" | "outgoing")}
              style={{
                padding: "10px 20px",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "transparent",
                color: view === tab.key ? (tab.key === "incoming" && incomingUnack > 0 ? "#f5c518" : "var(--accent)") : "var(--muted2)",
                borderBottom: `2px solid ${view === tab.key ? (tab.key === "incoming" && incomingUnack > 0 ? "#f5c518" : "var(--accent)") : "transparent"}`,
                marginBottom: -1
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", minHeight: "calc(100vh - 170px)" }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", padding: "16px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
          {filtered.map((row) => {
            const urgency = urgencyConfig[row.urgency];
            const fromStaff = staff.find((item) => item.id === row.fromId);
            const toStaff = staff.find((item) => item.id === row.toId);
            const client = clients.find((item) => item.id === row.clientId);
            const isSelected = selected?.id === row.id;
            const isIncoming = row.toId === 1;
            return (
              <div
                key={row.id}
                className="handover-row"
                onClick={() => {
                  setSelected(row);
                  setCreating(false);
                }}
                style={{
                  padding: "13px 14px",
                  borderRadius: 3,
                  border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 25%, transparent)" : urgency.border}`,
                  borderLeft: `3px solid ${urgency.color}`,
                  background: isSelected ? "color-mix(in srgb, var(--accent) 2%, transparent)" : "rgba(255,255,255,0.01)"
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 9, padding: "1px 6px", background: isIncoming ? "rgba(96,165,250,0.12)" : "color-mix(in srgb, var(--accent) 8%, transparent)", color: isIncoming ? "#60a5fa" : "var(--accent)", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {isIncoming ? "Incoming" : "Outgoing"}
                  </span>
                  <span style={{ fontSize: 9, padding: "1px 6px", background: urgency.bg, color: urgency.color, borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {urgency.label}
                  </span>
                  <span style={{ fontSize: 9, padding: "1px 6px", background: statusConfig[row.status].bg, color: statusConfig[row.status].color, borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {statusConfig[row.status].label}
                  </span>
                  {isIncoming && !row.acknowledged ? <span style={{ fontSize: 8, padding: "1px 6px", background: "rgba(255,68,68,0.1)", color: "#ff4444", borderRadius: 2, letterSpacing: "0.08em" }}>NEW</span> : null}
                </div>
                <div style={{ fontSize: 12, color: isSelected ? "#fff" : "#a0a0b0", lineHeight: 1.3, marginBottom: 6 }}>{row.title}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: client?.color }}>{client?.name}</span>
                  <span style={{ fontSize: 10, color: "var(--muted2)" }}>
                    {fromStaff?.name} -&gt; {toStaff?.name}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: "var(--muted2)", marginTop: 4 }}>Due {row.dueDate} - Created {row.createdAt}</div>
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <div style={{ padding: "30px 8px", textAlign: "center", fontSize: 11, color: "var(--muted2)" }}>No handovers in this view.</div>
          ) : null}
        </div>

        <div style={{ overflowY: "auto" }}>
          {creating ? (
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 18, maxWidth: 640 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>New Handover</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Handing over to</label>
                  <select value={draft.toId} onChange={(event) => setDraft((previous) => ({ ...previous, toId: Number(event.target.value) }))} style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}>
                    {staff.filter((item) => item.id !== 1).map((item) => (
                      <option key={item.id} value={item.id}>{item.name} - {item.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Client / Project</label>
                  <select value={draft.clientId} onChange={(event) => setDraft((previous) => ({ ...previous, clientId: Number(event.target.value) }))} style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}>
                    {clients.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Handover title</label>
                <input value={draft.title} onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))} placeholder="What needs covering while you are away?" style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Urgency</label>
                  <select value={draft.urgency} onChange={(event) => setDraft((previous) => ({ ...previous, urgency: event.target.value as HandoverUrgency }))} style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}>
                    {(Object.keys(urgencyConfig) as HandoverUrgency[]).map((key) => (
                      <option key={key} value={key}>{urgencyConfig[key].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Cover until</label>
                  <input value={draft.dueDate} onChange={(event) => setDraft((previous) => ({ ...previous, dueDate: event.target.value }))} placeholder="e.g. Mar 1" style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>My return date</label>
                  <input value={draft.myReturnDate} onChange={(event) => setDraft((previous) => ({ ...previous, myReturnDate: event.target.value }))} placeholder="e.g. Feb 28" style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Context & background</label>
                <textarea value={draft.context} onChange={(event) => setDraft((previous) => ({ ...previous, context: event.target.value }))} placeholder="What is the current state of play? What work is in progress? What decisions have been made?" style={{ width: "100%", minHeight: 100, padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, lineHeight: 1.7 }} />
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Open items & instructions</label>
                {draft.openItems.map((item, index) => (
                  <div key={index} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--muted2)" }}>-&gt;</span>
                    <input value={item} onChange={(event) => updateItem(index, event.target.value)} placeholder={`Action item ${index + 1}...`} style={{ flex: 1, padding: "8px 10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }} />
                    <button className="remove-item" onClick={() => removeItem(index)} style={{ fontSize: 14, color: "var(--muted2)", padding: "0 4px" }}>×</button>
                  </div>
                ))}
                <button onClick={addItem} style={{ fontSize: 11, color: "var(--muted2)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace", marginTop: 4, letterSpacing: "0.06em" }}>
                  + Add item
                </button>
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Client notes (personality, preferences)</label>
                <textarea value={draft.clientNotes} onChange={(event) => setDraft((previous) => ({ ...previous, clientNotes: event.target.value }))} placeholder="How does this client communicate? What to avoid? Any sensitivities?" style={{ width: "100%", minHeight: 70, padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, lineHeight: 1.7 }} />
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>File & tool access</label>
                <input value={draft.credentials} onChange={(event) => setDraft((previous) => ({ ...previous, credentials: event.target.value }))} placeholder="Drive folder, Figma link, any relevant access info" style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="save-btn" disabled={!draft.title.trim() || !draft.context.trim()} onClick={saveHandover} style={{ padding: "11px 24px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Send handover
                </button>
                <button onClick={() => setCreating(false)} style={{ padding: "11px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--muted2)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {selected && !creating
            ? (() => {
                const urgency = urgencyConfig[selected.urgency];
                const fromStaff = staff.find((item) => item.id === selected.fromId);
                const toStaff = staff.find((item) => item.id === selected.toId);
                const client = clients.find((item) => item.id === selected.clientId);
                const isIncoming = selected.toId === 1;
                return (
                  <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: urgency.bg, color: urgency.color, letterSpacing: "0.08em", textTransform: "uppercase", border: `1px solid ${urgency.border}` }}>{urgency.label}</span>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: isIncoming ? "rgba(96,165,250,0.1)" : "color-mix(in srgb, var(--accent) 8%, transparent)", color: isIncoming ? "#60a5fa" : "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{isIncoming ? "Incoming" : "Outgoing"}</span>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: statusConfig[selected.status].bg, color: statusConfig[selected.status].color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{statusConfig[selected.status].label}</span>
                          {isIncoming && !selected.acknowledged ? <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: "rgba(255,68,68,0.1)", color: "#ff4444", letterSpacing: "0.08em", textTransform: "uppercase" }}>Unacknowledged</span> : null}
                        </div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.3, maxWidth: 500 }}>{selected.title}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                      {[fromStaff, toStaff].map((item, index) => (
                        <span key={index} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {index === 1 ? <span style={{ fontSize: 14, color: "var(--muted2)" }}>-&gt;</span> : null}
                          <div style={{ width: 24, height: 24, borderRadius: 2, background: `${item?.color ?? "#a0a0b0"}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: item?.color ?? "#a0a0b0" }}>{item?.avatar ?? "??"}</div>
                          <div>
                            <div style={{ fontSize: 11, color: item?.id === 1 ? "var(--accent)" : "var(--text)" }}>{item?.name ?? "Unknown"}</div>
                            <div style={{ fontSize: 9, color: "var(--muted2)" }}>{item?.role ?? "Unknown role"}</div>
                          </div>
                        </span>
                      ))}
                      <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "var(--muted2)" }}>Cover until {selected.dueDate}</div>
                        <div style={{ fontSize: 10, color: "var(--muted2)" }}>Return {selected.myReturnDate}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: `${client?.color ?? "#a0a0b0"}08`, border: `1px solid ${(client?.color ?? "#a0a0b0")}25`, borderRadius: 3 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 2, background: `${client?.color ?? "#a0a0b0"}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: client?.color ?? "#a0a0b0" }}>{client?.avatar ?? "??"}</div>
                      <div>
                        <div style={{ fontSize: 12, color: client?.color ?? "#a0a0b0" }}>{client?.name ?? "Unknown client"}</div>
                        <div style={{ fontSize: 10, color: "var(--muted2)" }}>{client?.project ?? "Unknown project"}</div>
                      </div>
                    </div>

                    <div style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                      <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Context & background</div>
                      <div style={{ fontSize: 13, color: "#a0a0b0", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{selected.context}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Open items</div>
                      {selected.openItems.map((item, index) => (
                        <div key={index} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 12px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 3, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: urgency.color, flexShrink: 0, marginTop: 1 }}>-&gt;</span>
                          <span style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.5 }}>{item}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {selected.clientNotes ? (
                        <div style={{ padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                          <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Client notes</div>
                          <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.6 }}>{selected.clientNotes}</div>
                        </div>
                      ) : null}
                      {selected.credentials ? (
                        <div style={{ padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                          <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Files & access</div>
                          <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.6 }}>{selected.credentials}</div>
                        </div>
                      ) : null}
                    </div>

                    {isIncoming && !selected.acknowledged ? (
                      <button className="ack-btn" onClick={() => acknowledge(selected.id)} style={{ padding: "13px", background: "color-mix(in srgb, var(--accent) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)", borderRadius: 3, color: "var(--accent)", fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>
                        ✓ Acknowledge handover
                      </button>
                    ) : null}
                    {isIncoming && selected.acknowledged ? (
                      <div style={{ padding: "10px 14px", border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)", borderRadius: 3, background: "color-mix(in srgb, var(--accent) 4%, transparent)", fontSize: 11, color: "var(--accent)" }}>
                        ✓ You acknowledged this handover
                      </div>
                    ) : null}
                  </div>
                );
              })()
            : null}

          {!selected && !creating ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--muted2)", padding: "60px" }}>
              <div style={{ fontSize: 28 }}>◌</div>
              <div style={{ fontSize: 13 }}>Select a handover or create one</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
