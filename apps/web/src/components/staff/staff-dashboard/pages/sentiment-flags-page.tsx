"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type Sentiment = "positive" | "neutral" | "at_risk";
type SignalType = "positive" | "neutral" | "negative";

type ClientSignal = {
  type: SignalType;
  text: string;
};

type SentimentHistoryRow = {
  sentiment: Sentiment;
  note: string;
  date: string;
  by: string;
};

type SentimentClient = {
  id: number;
  name: string;
  avatar: string;
  project: string;
  contact: string;
  sentiment: Sentiment;
  sentimentNote: string;
  sentimentUpdatedAt: string;
  sentimentUpdatedBy: string;
  history: SentimentHistoryRow[];
  signals: ClientSignal[];
};

const initialClients: SentimentClient[] = [
  {
    id: 1,
    name: "Volta Studios",
    avatar: "VS",
    project: "Brand Identity System",
    contact: "Lena Muller",
    sentiment: "positive",
    sentimentNote: "Responsive, engaged, loves the direction. No friction.",
    sentimentUpdatedAt: "Today",
    sentimentUpdatedBy: "You",
    history: [
      { sentiment: "positive", note: "Responsive, engaged, loves the direction. No friction.", date: "Feb 22", by: "You" },
      { sentiment: "neutral", note: "Quiet after first concepts - hard to read.", date: "Feb 10", by: "You" },
      { sentiment: "positive", note: "Strong kickoff - very aligned on brief.", date: "Jan 9", by: "You" }
    ],
    signals: [
      { type: "positive", text: "Replied within 2h yesterday" },
      { type: "positive", text: "Approved milestone ahead of schedule" },
      { type: "positive", text: "Paid invoice 3 days early" }
    ]
  },
  {
    id: 2,
    name: "Kestrel Capital",
    avatar: "KC",
    project: "Q1 Campaign Strategy",
    contact: "Marcus Rehn",
    sentiment: "at_risk",
    sentimentNote: "Invoice overdue 7 days, 3 messages unanswered. AP issues likely but relationship feels fragile.",
    sentimentUpdatedAt: "2 days ago",
    sentimentUpdatedBy: "You",
    history: [
      { sentiment: "at_risk", note: "Invoice overdue, messages unanswered.", date: "Feb 20", by: "You" },
      { sentiment: "neutral", note: "Slow to respond but reliable. No major concerns.", date: "Feb 8", by: "You" },
      { sentiment: "neutral", note: "Good kickoff but slower feedback loop than expected.", date: "Jan 22", by: "You" }
    ],
    signals: [
      { type: "negative", text: "Invoice 7 days overdue" },
      { type: "negative", text: "3 messages unanswered" },
      { type: "negative", text: "Milestone approval 5 days late" }
    ]
  },
  {
    id: 3,
    name: "Mira Health",
    avatar: "MH",
    project: "Website Redesign",
    contact: "Dr. Amara Nkosi",
    sentiment: "neutral",
    sentimentNote: "Solid but demanding. Clinical review delays are frustrating her team - nothing personal.",
    sentimentUpdatedAt: "Yesterday",
    sentimentUpdatedBy: "You",
    history: [
      { sentiment: "neutral", note: "Solid but demanding. Clinical review delays frustrating her team.", date: "Feb 21", by: "You" },
      { sentiment: "positive", note: "Loved the initial wireframe direction - very enthusiastic.", date: "Feb 5", by: "You" }
    ],
    signals: [
      { type: "positive", text: "Responsive and engaged on calls" },
      { type: "neutral", text: "Clinical delays creating tension" },
      { type: "neutral", text: "1 revision request - reasonable" }
    ]
  },
  {
    id: 4,
    name: "Dune Collective",
    avatar: "DC",
    project: "Editorial Design System",
    contact: "Kofi Asante",
    sentiment: "at_risk",
    sentimentNote: "6 days silent. Project overdue. No explanation given. High escalation risk.",
    sentimentUpdatedAt: "Today",
    sentimentUpdatedBy: "You",
    history: [
      { sentiment: "at_risk", note: "6 days silent, project overdue, escalation risk.", date: "Feb 22", by: "You" },
      { sentiment: "neutral", note: "Kofi went quiet for a week then came back with feedback. Normal pattern.", date: "Feb 1", by: "You" },
      { sentiment: "positive", note: "Very enthusiastic about editorial direction. Good energy at kickoff.", date: "Nov 5", by: "You" }
    ],
    signals: [
      { type: "negative", text: "6 days without response" },
      { type: "negative", text: "Milestone 12 days overdue" },
      { type: "negative", text: "Retainer exceeded" }
    ]
  },
  {
    id: 5,
    name: "Okafor & Sons",
    avatar: "OS",
    project: "Annual Report 2025",
    contact: "Chidi Okafor",
    sentiment: "positive",
    sentimentNote: "Dream client. Fast, appreciative, pays early. Keep this relationship warm.",
    sentimentUpdatedAt: "3 days ago",
    sentimentUpdatedBy: "You",
    history: [
      { sentiment: "positive", note: "Dream client. Fast, appreciative, pays early.", date: "Feb 19", by: "You" },
      { sentiment: "positive", note: "Strong relationship from day one.", date: "Jan 15", by: "You" }
    ],
    signals: [
      { type: "positive", text: "Paid invoice 5 days early" },
      { type: "positive", text: "Approved milestone with no changes" },
      { type: "positive", text: "Sent unsolicited positive feedback" }
    ]
  }
];

const sentimentConfig: Record<
  Sentiment,
  { label: string; color: string; bg: string; border: string; icon: string; description: string }
> = {
  positive: {
    label: "Positive",
    color: "var(--accent)",
    bg: "color-mix(in srgb, var(--accent) 8%, transparent)",
    border: "color-mix(in srgb, var(--accent) 20%, transparent)",
    icon: "◉",
    description: "Client is engaged, responsive, and satisfied."
  },
  neutral: {
    label: "Neutral",
    color: "#a0a0b0",
    bg: "rgba(160,160,176,0.06)",
    border: "rgba(160,160,176,0.15)",
    icon: "◎",
    description: "No major concerns. Relationship is steady."
  },
  at_risk: {
    label: "At Risk",
    color: "#ff4444",
    bg: "rgba(255,68,68,0.07)",
    border: "rgba(255,68,68,0.2)",
    icon: "◌",
    description: "Client showing signs of friction, disengagement, or dissatisfaction."
  }
};

const signalColors: Record<SignalType, string> = {
  positive: "var(--accent)",
  neutral: "#a0a0b0",
  negative: "#ff4444"
};

export function SentimentFlagsPage({ isActive }: { isActive: boolean }) {
  const [clients, setClients] = useState(initialClients);
  const [selected, setSelected] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [draftSentiment, setDraftSentiment] = useState<Sentiment | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [filter, setFilter] = useState<"all" | Sentiment>("all");
  const [showHistory, setShowHistory] = useState(false);

  const current = clients.find((client) => client.id === selected) ?? clients[0];
  const cfg = sentimentConfig[current.sentiment];

  const filtered = useMemo(
    () => clients.filter((client) => (filter === "all" ? true : client.sentiment === filter)),
    [clients, filter]
  );

  const counts = useMemo(
    () => ({
      positive: clients.filter((client) => client.sentiment === "positive").length,
      neutral: clients.filter((client) => client.sentiment === "neutral").length,
      at_risk: clients.filter((client) => client.sentiment === "at_risk").length
    }),
    [clients]
  );

  const handleEdit = () => {
    setDraftSentiment(current.sentiment);
    setDraftNote(current.sentimentNote);
    setEditMode(true);
  };

  const handleSave = () => {
    if (!draftSentiment) return;
    setClients((previous) =>
      previous.map((client) => {
        if (client.id !== selected) return client;
        const newEntry: SentimentHistoryRow = {
          sentiment: draftSentiment,
          note: draftNote,
          date: "Today",
          by: "You"
        };
        return {
          ...client,
          sentiment: draftSentiment,
          sentimentNote: draftNote,
          sentimentUpdatedAt: "Just now",
          sentimentUpdatedBy: "You",
          history: [newEntry, ...client.history]
        };
      })
    );
    setEditMode(false);
  };

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-sentiment-flags">
      <style>{`
        .sf-client-row { transition: all 0.12s ease; cursor: pointer; }
        .sf-client-row:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; background: color-mix(in srgb, var(--accent) 2%, transparent) !important; }
        .sf-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .sf-sentiment-btn { transition: all 0.15s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .sf-sentiment-btn:hover { transform: scale(1.02); }
        .sf-save-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .sf-save-btn:hover { background: #a8d420 !important; }
        .sf-edit-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .sf-edit-btn:hover { opacity: 0.75; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Client Intelligence
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Sentiment Flags
            </h1>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {Object.entries(sentimentConfig).map(([key, conf]) => (
              <div key={key} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                  {conf.label}
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: conf.color }}>
                  {counts[key as Sentiment]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {[{ key: "all", label: "All clients" }, ...Object.entries(sentimentConfig).map(([k, v]) => ({ key: k, label: v.label }))].map((entry) => {
            const conf = entry.key === "all" ? null : sentimentConfig[entry.key as Sentiment];
            const active = filter === entry.key;
            return (
              <button
                key={entry.key}
                type="button"
                className="sf-filter-btn"
                onClick={() => setFilter(entry.key as "all" | Sentiment)}
                style={{
                  padding: "6px 14px",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderRadius: 2,
                  background: active ? (entry.key === "all" ? "var(--accent)" : conf?.bg ?? "rgba(255,255,255,0.08)") : "rgba(255,255,255,0.03)",
                  color: active ? (entry.key === "all" ? "#050508" : conf?.color ?? "var(--text)") : "var(--muted2)",
                  border: `1px solid ${active && entry.key !== "all" ? conf?.border ?? "transparent" : "transparent"}`
                }}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", minHeight: "calc(100vh - 200px)" }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((client) => {
            const clientCfg = sentimentConfig[client.sentiment];
            const isSelected = selected === client.id;
            return (
              <div
                key={client.id}
                className="sf-client-row"
                onClick={() => {
                  setSelected(client.id);
                  setEditMode(false);
                  setShowHistory(false);
                }}
                style={{
                  padding: "14px",
                  borderRadius: 3,
                  border: `1px solid ${isSelected ? clientCfg.border : "rgba(255,255,255,0.06)"}`,
                  background: isSelected ? clientCfg.bg : "rgba(255,255,255,0.01)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 2, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#a0a0b0", flexShrink: 0 }}>
                    {client.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: isSelected ? "#fff" : "#a0a0b0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 1 }}>{client.contact}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <span style={{ fontSize: 16, color: clientCfg.color }}>{clientCfg.icon}</span>
                    <span style={{ fontSize: 9, color: clientCfg.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{clientCfg.label}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted2)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{client.sentimentNote}</div>
                <div style={{ fontSize: 9, color: "#333344", marginTop: 6 }}>Updated {client.sentimentUpdatedAt}</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{current.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted2)" }}>
                {current.contact} · {current.project}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="sf-edit-btn"
                onClick={() => setShowHistory((value) => !value)}
                style={{ padding: "8px 14px", fontSize: 11, letterSpacing: "0.06em", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--muted2)" }}
              >
                {showHistory ? "← Back" : "History"}
              </button>
              {!editMode && !showHistory ? (
                <button
                  type="button"
                  className="sf-edit-btn"
                  onClick={handleEdit}
                  style={{ padding: "8px 16px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 3, color: "var(--accent)" }}
                >
                  Update flag
                </button>
              ) : null}
            </div>
          </div>

          {showHistory ? (
            <div style={{ maxWidth: 560 }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Sentiment History</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {current.history.map((entry, index) => {
                  const entryCfg = sentimentConfig[entry.sentiment];
                  return (
                    <div key={`${entry.date}-${index}`} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
                        <span style={{ fontSize: 14, color: entryCfg.color }}>{entryCfg.icon}</span>
                        {index < current.history.length - 1 ? <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 4 }} /> : null}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: entryCfg.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{entryCfg.label}</span>
                          <span style={{ fontSize: 10, color: "var(--muted2)" }}>{entry.date} · {entry.by}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.6 }}>{entry.note}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : editMode ? (
            <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Set Sentiment</div>
              <div style={{ display: "flex", gap: 10 }}>
                {Object.entries(sentimentConfig).map(([key, entryCfg]) => (
                  <button
                    key={key}
                    type="button"
                    className="sf-sentiment-btn"
                    onClick={() => setDraftSentiment(key as Sentiment)}
                    style={{
                      flex: 1,
                      padding: "16px 12px",
                      border: `1px solid ${draftSentiment === key ? entryCfg.border : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 3,
                      background: draftSentiment === key ? entryCfg.bg : "transparent",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <span style={{ fontSize: 22, color: entryCfg.color }}>{entryCfg.icon}</span>
                    <span style={{ fontSize: 11, color: draftSentiment === key ? entryCfg.color : "var(--muted2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{entryCfg.label}</span>
                    <span style={{ fontSize: 10, color: "var(--muted2)", textAlign: "center", lineHeight: 1.4 }}>{entryCfg.description}</span>
                  </button>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Note</div>
                <textarea
                  value={draftNote}
                  onChange={(event) => setDraftNote(event.target.value)}
                  placeholder="What's driving this sentiment? Be specific - this will be visible in the history."
                  style={{ width: "100%", minHeight: 100, padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, lineHeight: 1.6, outline: "none", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="sf-save-btn"
                  onClick={handleSave}
                  style={{ padding: "11px 24px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}
                >
                  Save flag
                </button>
                <button
                  type="button"
                  className="sf-edit-btn"
                  onClick={() => setEditMode(false)}
                  style={{ padding: "11px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--muted2)", fontSize: 11 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ padding: 20, border: `1px solid ${cfg.border}`, borderRadius: 4, background: cfg.bg }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <span style={{ fontSize: 32, color: cfg.color }}>{cfg.icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
                      <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>
                        Updated {current.sentimentUpdatedAt} by {current.sentimentUpdatedBy}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#a0a0b0", lineHeight: 1.7, borderTop: `1px solid ${cfg.border}`, paddingTop: 14 }}>
                    {current.sentimentNote}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Recent Signals</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {current.signals.map((signal, index) => (
                      <div key={`${signal.text}-${index}`} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 12px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: signalColors[signal.type], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#a0a0b0" }}>{signal.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Portfolio Sentiment</div>
                {clients.map((client) => {
                  const clientCfg = sentimentConfig[client.sentiment];
                  const isCurrent = client.id === current.id;
                  return (
                    <div
                      key={`portfolio-${client.id}`}
                      onClick={() => {
                        setSelected(client.id);
                        setEditMode(false);
                        setShowHistory(false);
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 3, border: `1px solid ${isCurrent ? clientCfg.border : "rgba(255,255,255,0.05)"}`, background: isCurrent ? clientCfg.bg : "rgba(255,255,255,0.01)", cursor: "pointer" }}
                    >
                      <span style={{ fontSize: 14, color: clientCfg.color, flexShrink: 0 }}>{clientCfg.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: isCurrent ? "#fff" : "#a0a0b0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                        <div style={{ fontSize: 9, color: clientCfg.color, marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{clientCfg.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
