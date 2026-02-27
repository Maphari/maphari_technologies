"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type TouchType = "message" | "milestone" | "invoice" | "call" | "file";
type Staleness = "fresh" | "aging" | "stale";
type Sentiment = "positive" | "neutral" | "at_risk";

type TouchHistoryItem = {
  type: TouchType;
  label: string;
  date: Date;
};

type LastTouchedClient = {
  id: number;
  name: string;
  avatar: string;
  project: string;
  contact: string;
  sentiment: Sentiment;
  lastTouched: Date;
  lastTouchedType: TouchType;
  lastTouchedNote: string;
  nextAction: string;
  nextActionDue: Date;
  touchHistory: TouchHistoryItem[];
  staleness: Staleness;
  retainerBurn: number;
  openItems: number;
};

const now = new Date("2026-02-23T09:00:00");

const clients: LastTouchedClient[] = [
  {
    id: 1,
    name: "Volta Studios",
    avatar: "VS",
    project: "Brand Identity System",
    contact: "Lena Muller",
    sentiment: "positive",
    lastTouched: new Date("2026-02-22T14:05:00"),
    lastTouchedType: "message",
    lastTouchedNote: "Sent revised colour palette with warmer amber",
    nextAction: "Chase logo sign-off if no response by EOD",
    nextActionDue: new Date("2026-02-23T17:00:00"),
    touchHistory: [
      { type: "message", label: "Sent revised palette", date: new Date("2026-02-22T14:05:00") },
      { type: "message", label: "Received feedback on Concept B", date: new Date("2026-02-22T11:32:00") },
      { type: "milestone", label: "Submitted Logo & Visual Direction", date: new Date("2026-02-22T09:00:00") },
      { type: "invoice", label: "Invoice paid - R8,750", date: new Date("2026-02-19T15:45:00") },
      { type: "call", label: "Design review call", date: new Date("2026-02-15T10:00:00") }
    ],
    staleness: "fresh",
    retainerBurn: 62,
    openItems: 1
  },
  {
    id: 2,
    name: "Kestrel Capital",
    avatar: "KC",
    project: "Q1 Campaign Strategy",
    contact: "Marcus Rehn",
    sentiment: "at_risk",
    lastTouched: new Date("2026-02-21T14:00:00"),
    lastTouchedType: "message",
    lastTouchedNote: "Sent third follow-up chasing strategy approval",
    nextAction: "Escalate to account manager if no response",
    nextActionDue: new Date("2026-02-23T12:00:00"),
    touchHistory: [
      { type: "message", label: "Third follow-up sent", date: new Date("2026-02-21T14:00:00") },
      { type: "message", label: "Second follow-up sent", date: new Date("2026-02-19T09:00:00") },
      { type: "message", label: "Client replied - AP delays", date: new Date("2026-02-20T11:00:00") },
      { type: "milestone", label: "Campaign strategy deck submitted", date: new Date("2026-02-17T10:00:00") },
      { type: "call", label: "Strategy alignment call", date: new Date("2026-02-10T15:00:00") }
    ],
    staleness: "aging",
    retainerBurn: 97,
    openItems: 3
  },
  {
    id: 3,
    name: "Mira Health",
    avatar: "MH",
    project: "Website Redesign",
    contact: "Dr. Amara Nkosi",
    sentiment: "neutral",
    lastTouched: new Date("2026-02-22T15:00:00"),
    lastTouchedType: "call",
    lastTouchedNote: "Scheduled UX review call for tomorrow 9 AM",
    nextAction: "UX review call tomorrow - prep wireframes",
    nextActionDue: new Date("2026-02-24T09:00:00"),
    touchHistory: [
      { type: "call", label: "Scheduled UX review call", date: new Date("2026-02-22T15:00:00") },
      { type: "file", label: "Sent revised wireframes", date: new Date("2026-02-20T10:00:00") },
      { type: "message", label: "Acknowledged revision requests", date: new Date("2026-02-19T16:00:00") },
      { type: "message", label: "Received wireframe feedback", date: new Date("2026-02-19T15:30:00") },
      { type: "milestone", label: "Submitted mobile wireframes", date: new Date("2026-02-19T11:00:00") }
    ],
    staleness: "fresh",
    retainerBurn: 61,
    openItems: 2
  },
  {
    id: 4,
    name: "Dune Collective",
    avatar: "DC",
    project: "Editorial Design System",
    contact: "Kofi Asante",
    sentiment: "at_risk",
    lastTouched: new Date("2026-02-17T14:00:00"),
    lastTouchedType: "message",
    lastTouchedNote: "Final follow-up sent before escalation",
    nextAction: "Escalate to admin - no contact for 6 days",
    nextActionDue: new Date("2026-02-23T09:00:00"),
    touchHistory: [
      { type: "message", label: "Final follow-up before escalation", date: new Date("2026-02-17T14:00:00") },
      { type: "message", label: "Second follow-up sent", date: new Date("2026-02-14T11:00:00") },
      { type: "message", label: "First follow-up sent", date: new Date("2026-02-12T09:00:00") },
      { type: "milestone", label: "Type & Grid System submitted", date: new Date("2026-02-09T10:00:00") },
      { type: "call", label: "Design review call", date: new Date("2026-02-03T14:00:00") }
    ],
    staleness: "stale",
    retainerBurn: 112,
    openItems: 4
  },
  {
    id: 5,
    name: "Okafor & Sons",
    avatar: "OS",
    project: "Annual Report 2025",
    contact: "Chidi Okafor",
    sentiment: "positive",
    lastTouched: new Date("2026-02-20T09:30:00"),
    lastTouchedType: "message",
    lastTouchedNote: "Received positive feedback on data visualisations",
    nextAction: "Begin layout & typesetting for next milestone",
    nextActionDue: new Date("2026-02-26T17:00:00"),
    touchHistory: [
      { type: "message", label: "Received positive feedback", date: new Date("2026-02-20T09:30:00") },
      { type: "milestone", label: "Data Vis approved by client", date: new Date("2026-02-19T16:45:00") },
      { type: "invoice", label: "Invoice paid 5 days early", date: new Date("2026-02-15T11:00:00") },
      { type: "file", label: "Sent data visualisation suite", date: new Date("2026-02-19T14:00:00") },
      { type: "call", label: "Progress check-in call", date: new Date("2026-02-12T10:00:00") }
    ],
    staleness: "fresh",
    retainerBurn: 34,
    openItems: 0
  }
];

const typeConfig: Record<TouchType, { icon: string; color: string }> = {
  message: { icon: "✉", color: "#a0a0b0" },
  milestone: { icon: "◎", color: "#a78bfa" },
  invoice: { icon: "₹", color: "var(--accent)" },
  call: { icon: "◌", color: "#60a5fa" },
  file: { icon: "⊡", color: "#f5c518" }
};

const stalenessConfig: Record<Staleness, { label: string; color: string; bg: string; description: string }> = {
  fresh: { label: "Fresh", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 8%, transparent)", description: "Contacted within 48 hours" },
  aging: { label: "Aging", color: "#f5c518", bg: "rgba(245,197,24,0.08)", description: "2-5 days since last touch" },
  stale: { label: "Stale", color: "#ff4444", bg: "rgba(255,68,68,0.08)", description: "6+ days - needs attention" }
};

const sentimentColors: Record<Sentiment, string> = {
  positive: "var(--accent)",
  neutral: "#a0a0b0",
  at_risk: "#ff4444"
};

function timeSince(date: Date) {
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  if (diffHours < 1) return "< 1 hour ago";
  if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
  if (diffDays < 2) return "Yesterday";
  return `${Math.floor(diffDays)} days ago`;
}

function timeUntil(date: Date) {
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  if (diffMs < 0) return "Overdue";
  if (diffHours < 1) return "< 1 hour";
  if (diffHours < 24) return `in ${Math.round(diffHours)}h`;
  const wholeDays = Math.floor(diffDays);
  return `in ${wholeDays} day${wholeDays > 1 ? "s" : ""}`;
}

export function LastTouchedPage({ isActive }: { isActive: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [sort, setSort] = useState<"staleness" | "name" | "items">("staleness");
  const [filter, setFilter] = useState<"all" | Staleness>("all");

  const sorted = useMemo(() => {
    return [...clients]
      .filter((client) => (filter === "all" ? true : client.staleness === filter))
      .sort((a, b) => {
        if (sort === "staleness") return a.lastTouched.getTime() - b.lastTouched.getTime();
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "items") return b.openItems - a.openItems;
        return 0;
      });
  }, [filter, sort]);

  const current = selected ? clients.find((client) => client.id === selected) ?? null : null;
  const staleCount = clients.filter((client) => client.staleness === "stale").length;
  const agingCount = clients.filter((client) => client.staleness === "aging").length;
  const freshCount = clients.filter((client) => client.staleness === "fresh").length;

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-last-touched">
      <style>{`
        .lt-client-row { transition: all 0.15s ease; cursor: pointer; }
        .lt-client-row:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; background: color-mix(in srgb, var(--accent) 2%, transparent) !important; }
        .lt-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .lt-sort-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .lt-sort-btn:hover { color: #a0a0b0 !important; }
        .lt-action-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .lt-action-btn:hover { opacity: 0.75; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Client Intelligence
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Last Touched
            </h1>
            <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 6 }}>Monday, Feb 23 - 9:00 AM</div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Stale", value: staleCount, color: staleCount > 0 ? "#ff4444" : "var(--muted2)" },
              { label: "Aging", value: agingCount, color: agingCount > 0 ? "#f5c518" : "var(--muted2)" },
              { label: "Fresh", value: freshCount, color: "var(--accent)" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "all", label: "All" },
              { key: "stale", label: "Stale" },
              { key: "aging", label: "Aging" },
              { key: "fresh", label: "Fresh" }
            ].map((entry) => {
              const cfg = entry.key === "all" ? null : stalenessConfig[entry.key as Staleness];
              const active = filter === entry.key;
              return (
                <button
                  key={entry.key}
                  type="button"
                  className="lt-filter-btn"
                  onClick={() => setFilter(entry.key as "all" | Staleness)}
                  style={{
                    padding: "6px 12px",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    borderRadius: 2,
                    background: active ? (entry.key !== "all" ? cfg?.bg : "rgba(255,255,255,0.08)") : "rgba(255,255,255,0.03)",
                    color: active ? (entry.key !== "all" ? cfg?.color : "var(--text)") : "var(--muted2)"
                  }}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.08em" }}>SORT</span>
          {[
            { key: "staleness", label: "Stalest first" },
            { key: "items", label: "Open items" },
            { key: "name", label: "Name" }
          ].map((entry) => (
            <button
              key={entry.key}
              type="button"
              className="lt-sort-btn"
              onClick={() => setSort(entry.key as "staleness" | "items" | "name")}
              style={{
                padding: "5px 10px",
                fontSize: 10,
                letterSpacing: "0.06em",
                background: "transparent",
                color: sort === entry.key ? "var(--text)" : "var(--muted2)",
                borderBottom: `1px solid ${sort === entry.key ? "var(--accent)" : "transparent"}`
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: current ? "1fr 380px" : "1fr", minHeight: "calc(100vh - 220px)" }}>
        <div style={{ padding: "20px 12px 8px 0", borderRight: current ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map((client) => {
              const sCfg = stalenessConfig[client.staleness];
              const tCfg = typeConfig[client.lastTouchedType];
              const isSelected = selected === client.id;
              const sinceStr = timeSince(client.lastTouched);
              const nextDueStr = timeUntil(client.nextActionDue);
              const nextOverdue = client.nextActionDue.getTime() < now.getTime();
              return (
                <div
                  key={client.id}
                  className="lt-client-row"
                  onClick={() => setSelected(isSelected ? null : client.id)}
                  style={{
                    padding: "16px 18px",
                    border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 25%, transparent)" : client.staleness === "stale" ? "rgba(255,68,68,0.15)" : "rgba(255,255,255,0.06)"}`,
                    borderLeft: `3px solid ${sCfg.color}`,
                    borderRadius: "0 4px 4px 0",
                    background: isSelected ? "color-mix(in srgb, var(--accent) 2%, transparent)" : "rgba(255,255,255,0.01)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 3, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#a0a0b0", flexShrink: 0, marginTop: 2 }}>
                      {client.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>{client.name}</span>
                        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 2, background: sCfg.bg, color: sCfg.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{sCfg.label}</span>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: sentimentColors[client.sentiment] }} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 8 }}>{client.project}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: tCfg.color }}>{tCfg.icon}</span>
                        <span style={{ fontSize: 11, color: "#a0a0b0" }}>{client.lastTouchedNote}</span>
                      </div>
                      <div style={{ fontSize: 11, color: nextOverdue ? "#ff4444" : "var(--muted2)" }}>
                        → {client.nextAction} <span style={{ color: nextOverdue ? "#ff4444" : "#333344" }}>({nextDueStr})</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: sCfg.color, marginBottom: 4 }}>{sinceStr}</div>
                      <div style={{ fontSize: 10, color: "var(--muted2)" }}>
                        {client.openItems > 0 ? `${client.openItems} open item${client.openItems > 1 ? "s" : ""}` : "No open items"}
                      </div>
                      <div style={{ fontSize: 10, color: client.retainerBurn > 90 ? "#ff4444" : "var(--muted2)", marginTop: 2 }}>{client.retainerBurn}% retainer</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {current ? (
          <div style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{current.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted2)" }}>
                {current.contact} · {current.project}
              </div>
            </div>

            <div style={{ padding: 16, border: `1px solid ${stalenessConfig[current.staleness].bg}`, borderRadius: 4, background: stalenessConfig[current.staleness].bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 9, color: stalenessConfig[current.staleness].color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Last contact</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: stalenessConfig[current.staleness].color }}>{timeSince(current.lastTouched)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Via</div>
                  <div style={{ fontSize: 14, color: typeConfig[current.lastTouchedType].color }}>
                    {typeConfig[current.lastTouchedType].icon} {current.lastTouchedType}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#a0a0b0", marginTop: 12, lineHeight: 1.5 }}>{current.lastTouchedNote}</div>
            </div>

            <div style={{ padding: 14, border: `1px solid ${current.nextActionDue.getTime() < now.getTime() ? "rgba(255,68,68,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: 3, background: current.nextActionDue.getTime() < now.getTime() ? "rgba(255,68,68,0.05)" : "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: 9, color: current.nextActionDue.getTime() < now.getTime() ? "#ff4444" : "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                Next action · {timeUntil(current.nextActionDue)}
              </div>
              <div style={{ fontSize: 12, color: current.nextActionDue.getTime() < now.getTime() ? "#ff4444" : "#a0a0b0", lineHeight: 1.5 }}>{current.nextAction}</div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Touch History</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {current.touchHistory.map((touch, index) => {
                  const tCfg = typeConfig[touch.type];
                  const isLast = index === current.touchHistory.length - 1;
                  return (
                    <div key={`${touch.label}-${index}`} style={{ display: "flex", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${tCfg.color}`, background: `${tCfg.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: tCfg.color, flexShrink: 0 }}>
                          {tCfg.icon}
                        </div>
                        {!isLast ? <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.05)", margin: "2px 0", minHeight: 14 }} /> : null}
                      </div>
                      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 12 }}>
                        <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.4 }}>{touch.label}</div>
                        <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>{timeSince(touch.date)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>Quick Actions</div>
              {[
                { label: "Log a touchpoint", color: "var(--accent)", border: "color-mix(in srgb, var(--accent) 20%, transparent)", bg: "color-mix(in srgb, var(--accent) 6%, transparent)" },
                { label: "Send client update", color: "#a0a0b0", border: "rgba(255,255,255,0.08)", bg: "transparent" },
                { label: current.staleness === "stale" ? "Escalate to admin" : "Schedule check-in", color: current.staleness === "stale" ? "#ff4444" : "#a0a0b0", border: current.staleness === "stale" ? "rgba(255,68,68,0.2)" : "rgba(255,255,255,0.08)", bg: current.staleness === "stale" ? "rgba(255,68,68,0.05)" : "transparent" }
              ].map((action) => (
                <button key={action.label} type="button" className="lt-action-btn" style={{ padding: "10px 14px", border: `1px solid ${action.border}`, borderRadius: 3, background: action.bg, color: action.color, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "left" }}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
