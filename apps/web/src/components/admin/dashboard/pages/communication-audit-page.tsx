"use client";

import { useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#a78bfa",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0",
};

type CommType = "email" | "call" | "meeting" | "slack";
type Direction = "inbound" | "outbound";
type Sentiment = "positive" | "neutral" | "negative";
type Tab = "all comms" | "flagged" | "by client" | "analytics";

type CommItem = {
  id: string;
  client: string;
  clientColor: string;
  type: CommType;
  direction: Direction;
  from: string;
  to: string;
  subject: string;
  date: string;
  time: string;
  snippet: string;
  read: boolean;
  flagged: boolean;
  sentiment: Sentiment;
  duration?: string;
};

const commsLog: CommItem[] = [
  { id: "COM-0241", client: "Kestrel Capital", clientColor: C.purple, type: "email", direction: "inbound", from: "David Nkosi (Client)", to: "Nomsa Dlamini", subject: "RE: Invoice INV-0039 - Dispute", date: "Feb 22", time: "09:14", snippet: "We still haven't received the itemised breakdown we requested last week. This is now urgent.", read: true, flagged: true, sentiment: "negative" },
  { id: "COM-0240", client: "Volta Studios", clientColor: C.lime, type: "call", direction: "outbound", from: "Nomsa Dlamini", to: "Lena Brandt (Client)", subject: "Monthly check-in call", date: "Feb 22", time: "08:30", snippet: "30min call. Discussed brand direction progress. Client very happy. Requested a sneak peek of logo options.", read: true, flagged: false, sentiment: "positive", duration: "28m" },
  { id: "COM-0239", client: "Dune Collective", clientColor: C.amber, type: "email", direction: "inbound", from: "Sam Dune (Client)", to: "Renzo Fabbri", subject: "Scope changes - urgent discussion needed", date: "Feb 21", time: "17:42", snippet: "We need to talk about the additional templates that were added. We didn't authorise this.", read: true, flagged: true, sentiment: "negative" },
  { id: "COM-0238", client: "Mira Health", clientColor: C.blue, type: "email", direction: "outbound", from: "Nomsa Dlamini", to: "Dr. Aisha Obi (Client)", subject: "Wireframe review - your feedback needed", date: "Feb 21", time: "14:05", snippet: "Please find the updated wireframes attached. We'd love your feedback by end of week.", read: true, flagged: false, sentiment: "neutral" },
  { id: "COM-0237", client: "Okafor & Sons", clientColor: C.orange, type: "meeting", direction: "outbound", from: "Tapiwa Moyo", to: "James Okafor (Client)", subject: "Annual Report final review meeting", date: "Feb 21", time: "10:00", snippet: "In-person review session. Client approved all sections. Minor copy changes requested on p.12.", read: true, flagged: false, sentiment: "positive", duration: "90m" },
  { id: "COM-0236", client: "Kestrel Capital", clientColor: C.purple, type: "email", direction: "outbound", from: "Nomsa Dlamini", to: "David Nkosi (Client)", subject: "Invoice INV-0039 - Payment breakdown", date: "Feb 20", time: "11:22", snippet: "Please find the full itemised breakdown for INV-0039. I'm happy to walk through this on a call.", read: true, flagged: false, sentiment: "neutral" },
  { id: "COM-0235", client: "Dune Collective", clientColor: C.amber, type: "call", direction: "outbound", from: "Renzo Fabbri", to: "Sam Dune (Client)", subject: "Scope conversation", date: "Feb 20", time: "09:00", snippet: "Attempted to reach client re: scope concern. No answer. Left voicemail.", read: true, flagged: true, sentiment: "neutral", duration: "0m (VM)" },
  { id: "COM-0234", client: "Mira Health", clientColor: C.blue, type: "email", direction: "inbound", from: "Dr. Aisha Obi (Client)", to: "Kira Bosman", subject: "Wireframe feedback round 1", date: "Feb 19", time: "16:30", snippet: "Overall structure looks great. Main concern is the mobile nav - it needs to be more prominent.", read: true, flagged: false, sentiment: "neutral" },
  { id: "COM-0233", client: "Volta Studios", clientColor: C.lime, type: "email", direction: "inbound", from: "Lena Brandt (Client)", to: "Nomsa Dlamini", subject: "Logo concepts - excited!", date: "Feb 18", time: "13:45", snippet: "Just saw the concept previews and we're really excited. Option 2 is our favourite by far.", read: true, flagged: false, sentiment: "positive" },
];

const typeConfig: Record<CommType, { icon: string; color: string; label: string }> = {
  email: { icon: "✉", color: C.blue, label: "Email" },
  call: { icon: "📞", color: C.lime, label: "Call" },
  meeting: { icon: "🤝", color: C.purple, label: "Meeting" },
  slack: { icon: "💬", color: C.amber, label: "Slack" },
};

const sentimentConfig: Record<Sentiment, { color: string; icon: string }> = {
  positive: { color: C.lime, icon: "▲" },
  neutral: { color: C.muted, icon: "→" },
  negative: { color: C.red, icon: "▼" },
};

const tabs: Tab[] = ["all comms", "flagged", "by client", "analytics"];

export function CommunicationAuditPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all comms");
  const [filterClient, setFilterClient] = useState("All");
  const [filterType, setFilterType] = useState<"All" | CommType>("All");
  const [selectedComm, setSelectedComm] = useState<CommItem | null>(null);

  const clients = ["All", ...new Set(commsLog.map((c) => c.client))];
  const types: Array<"All" | CommType> = ["All", "email", "call", "meeting"];

  const filtered = commsLog.filter((c) => filterClient === "All" || c.client === filterClient).filter((c) => filterType === "All" || c.type === filterType);

  const flagged = commsLog.filter((c) => c.flagged);
  const negSentiment = commsLog.filter((c) => c.sentiment === "negative");
  const totalToday = commsLog.filter((c) => c.date === "Feb 22").length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Communication Audit</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Cross-portfolio comms log - Flagged items - Sentiment analysis</div>
        </div>
        <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Log Communication</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Comms (7d)", value: commsLog.length.toString(), color: C.blue, sub: `${totalToday} today` },
          { label: "Flagged Items", value: flagged.length.toString(), color: flagged.length > 0 ? C.red : C.lime, sub: "Require follow-up" },
          { label: "Negative Sentiment", value: negSentiment.length.toString(), color: negSentiment.length > 0 ? C.amber : C.lime, sub: "In last 7 days" },
          { label: "Silent Clients (5d+)", value: "1", color: C.red, sub: "Kestrel - last reply Feb 17" },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ background: "none", border: "none", color: activeTab === t ? C.lime : C.muted, padding: "8px 16px", cursor: "pointer", fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `2px solid ${activeTab === t ? C.lime : "transparent"}`, marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {(activeTab === "all comms" || activeTab === "flagged") && (
        <div>
          {activeTab === "all comms" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {clients.map((c) => (
                <button key={c} onClick={() => setFilterClient(c)} style={{ background: filterClient === c ? C.lime : C.surface, color: filterClient === c ? C.bg : C.muted, border: `1px solid ${filterClient === c ? C.lime : C.border}`, padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>
                  {c}
                </button>
              ))}
              <div style={{ width: 1, background: C.border, margin: "0 4px" }} />
              {types.map((t) => (
                <button key={t} onClick={() => setFilterType(t)} style={{ background: filterType === t ? C.blue : C.surface, color: filterType === t ? C.bg : C.muted, border: `1px solid ${filterType === t ? C.blue : C.border}`, padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "DM Mono, monospace", textTransform: "capitalize" }}>
                  {t}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: selectedComm ? "1fr 380px" : "1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(activeTab === "flagged" ? flagged : filtered).map((comm) => {
                const tc = typeConfig[comm.type];
                const sc = sentimentConfig[comm.sentiment];
                const isSelected = selectedComm?.id === comm.id;
                return (
                  <div key={comm.id} onClick={() => setSelectedComm(isSelected ? null : comm)} style={{ background: isSelected ? `${C.lime}08` : C.surface, border: `1px solid ${isSelected ? `${C.lime}44` : comm.flagged ? `${C.red}44` : C.border}`, borderRadius: 10, padding: 16, cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "32px 140px 1fr 80px 80px 60px 60px", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 18, textAlign: "center" }}>{tc.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: comm.clientColor }}>{comm.client}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{comm.from.split(" (")[0]}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{comm.subject}</div>
                        <div style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{comm.snippet}</div>
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: C.muted, textAlign: "right" }}>{comm.date}</span>
                      <span style={{ fontSize: 10, color: tc.color, background: `${tc.color}15`, padding: "2px 6px", borderRadius: 4, textAlign: "center" }}>{tc.label}</span>
                      <span style={{ fontSize: 14, color: sc.color, textAlign: "center" }}>{sc.icon}</span>
                      {comm.flagged ? <span style={{ fontSize: 12, color: C.red, textAlign: "center" }}>🚩</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedComm && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, height: "fit-content", position: "sticky", top: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: "DM Mono, monospace" }}>{selectedComm.id}</div>
                  {selectedComm.flagged ? <span style={{ fontSize: 11, color: C.red }}>🚩 Flagged</span> : null}
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{selectedComm.subject}</div>
                <div style={{ fontSize: 12, color: selectedComm.clientColor, marginBottom: 16 }}>{selectedComm.client}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {[
                    { label: "From", value: selectedComm.from },
                    { label: "To", value: selectedComm.to },
                    { label: "Date", value: `${selectedComm.date} ${selectedComm.time}` },
                    { label: "Type", value: typeConfig[selectedComm.type].label },
                    { label: "Sentiment", value: selectedComm.sentiment },
                    ...(selectedComm.duration ? [{ label: "Duration", value: selectedComm.duration }] : []),
                  ].map((f) => (
                    <div key={f.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: C.muted }}>{f.label}</span>
                      <span style={{ color: C.text, fontWeight: 600 }}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 14, background: C.bg, borderRadius: 8, fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 16 }}>{selectedComm.snippet}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, background: C.lime, color: C.bg, border: "none", padding: "8px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Reply</button>
                  <button style={{ flex: 1, background: C.border, border: "none", color: C.text, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>{selectedComm.flagged ? "Unflag" : "Flag"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "by client" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {["Volta Studios", "Kestrel Capital", "Mira Health", "Dune Collective", "Okafor & Sons"].map((client, ci) => {
            const clientComms = commsLog.filter((c) => c.client === client);
            const color = [C.lime, C.purple, C.blue, C.amber, C.orange][ci];
            const lastComm = clientComms[0];
            const neg = clientComms.filter((c) => c.sentiment === "negative").length;
            return (
              <div key={client} style={{ background: C.surface, border: `1px solid ${color}33`, borderRadius: 10, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color }}>{client}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 800, color: C.blue }}>{clientComms.length}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {(["email", "call", "meeting"] as const).map((type) => {
                    const count = clientComms.filter((c) => c.type === type).length;
                    return (
                      <div key={type} style={{ padding: 10, background: C.bg, borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 18 }}>{typeConfig[type].icon}</div>
                        <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: typeConfig[type].color }}>{count}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>{typeConfig[type].label}</div>
                      </div>
                    );
                  })}
                </div>
                {lastComm && (
                  <div style={{ padding: 12, background: C.bg, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>
                      Last Comm: {lastComm.date} - {lastComm.time}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{lastComm.subject}</div>
                    {neg > 0 ? <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>⚠ {neg} negative sentiment flagged</div> : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Comms by Type</div>
            {Object.entries(typeConfig).map(([type, cfg]) => {
              const count = commsLog.filter((c) => c.type === type).length;
              return (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 18, width: 28 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 13, flex: 1 }}>{cfg.label}</span>
                  <div style={{ width: 120, height: 8, background: C.border, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${(count / commsLog.length) * 100}%`, background: cfg.color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: cfg.color, fontWeight: 700, width: 20 }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sentiment Breakdown</div>
            {(["positive", "neutral", "negative"] as const).map((s) => {
              const count = commsLog.filter((c) => c.sentiment === s).length;
              const cfg = sentimentConfig[s];
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span style={{ color: cfg.color, fontSize: 14, width: 20 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 13, flex: 1, textTransform: "capitalize" }}>{s}</span>
                  <div style={{ width: 120, height: 8, background: C.border, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${(count / commsLog.length) * 100}%`, background: cfg.color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: cfg.color, fontWeight: 700, width: 20 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
