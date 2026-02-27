"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type EventType = "message" | "milestone" | "invoice" | "call" | "file";
type Direction = "outbound" | "inbound" | "both";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  project: string;
};

type TimelineEvent = {
  id: number;
  clientId: number;
  type: EventType;
  direction: Direction;
  title: string;
  excerpt: string;
  date: string;
  time: string;
  read: boolean;
};

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", project: "Brand Identity System" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", project: "Q1 Campaign Strategy" },
  { id: 3, name: "Mira Health", avatar: "MH", project: "Website Redesign" },
  { id: 4, name: "Dune Collective", avatar: "DC", project: "Editorial Design System" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", project: "Annual Report 2025" }
];

const allEvents: TimelineEvent[] = [
  { id: 1, clientId: 1, type: "message", direction: "outbound", title: "Sent brand direction brief", excerpt: "Hi Lena - attached is the brand direction brief covering mood board, tone, and three initial concept directions.", date: "Feb 22", time: "9:14 AM", read: true },
  { id: 2, clientId: 1, type: "message", direction: "inbound", title: "Client replied: concept feedback", excerpt: "Really love the direction on B. Can we tweak the secondary colour slightly warmer?", date: "Feb 22", time: "11:32 AM", read: true },
  { id: 3, clientId: 1, type: "milestone", direction: "outbound", title: "Milestone submitted: Logo & Visual Direction", excerpt: "Submitted for client approval - value R3,200. Includes primary logo suite, colour palette, typography, mood board.", date: "Feb 22", time: "2:00 PM", read: true },
  { id: 4, clientId: 1, type: "message", direction: "outbound", title: "Sent revised colour palette", excerpt: "Updated version attached - the amber is warmer as discussed.", date: "Feb 22", time: "2:05 PM", read: true },
  { id: 5, clientId: 1, type: "invoice", direction: "outbound", title: "Invoice #INV-0041 sent", excerpt: "R8,750 - Brand identity phase 1 - Due Mar 7", date: "Feb 18", time: "10:00 AM", read: true },
  { id: 6, clientId: 1, type: "invoice", direction: "inbound", title: "Invoice paid", excerpt: "R8,750 received - 3 days early. Payment confirmed.", date: "Feb 19", time: "3:45 PM", read: true },
  { id: 7, clientId: 1, type: "milestone", direction: "inbound", title: "Milestone approved: Colour Palette", excerpt: "Client approved with no changes. Proceeding to brand guidelines phase.", date: "Feb 18", time: "4:00 PM", read: true },
  { id: 8, clientId: 1, type: "call", direction: "both", title: "Kickoff call completed", excerpt: "45 min - Google Meet - Discussed brand direction, timeline, and asset requirements. Decision: 3 concepts minimum.", date: "Jan 9", time: "10:00 AM", read: true },
  { id: 9, clientId: 1, type: "file", direction: "inbound", title: "Client uploaded brand assets", excerpt: "12 files - Existing logos, brand photos, competitor references.", date: "Jan 10", time: "2:30 PM", read: true },
  { id: 10, clientId: 2, type: "milestone", direction: "outbound", title: "Milestone submitted: Campaign Strategy Deck", excerpt: "Submitted for approval - value R5,800. Audience segmentation, channel strategy, content calendar, KPI framework.", date: "Feb 17", time: "10:00 AM", read: false },
  { id: 11, clientId: 2, type: "message", direction: "outbound", title: "Follow-up: strategy approval", excerpt: "Following up - have you had a chance to review the deck?", date: "Feb 19", time: "9:00 AM", read: false },
  { id: 12, clientId: 2, type: "message", direction: "outbound", title: "Second follow-up", excerpt: "Hi Marcus - wanted to check in one more time before escalating to the account manager.", date: "Feb 21", time: "2:00 PM", read: false },
  { id: 13, clientId: 2, type: "invoice", direction: "outbound", title: "Invoice #INV-0038 sent", excerpt: "R21,000 - Monthly retainer - Feb 2026 - Due Feb 14", date: "Feb 1", time: "9:00 AM", read: false },
  { id: 14, clientId: 2, type: "message", direction: "inbound", title: "Client replied: AP delays", excerpt: "Sorry for the delay - AP department has been chaotic. Reviewing now.", date: "Feb 20", time: "11:00 AM", read: true },
  { id: 15, clientId: 3, type: "milestone", direction: "outbound", title: "Milestone submitted: Mobile Wireframes", excerpt: "4 screens - home, patient dashboard, booking flow, navigation. Submitted for review.", date: "Feb 19", time: "11:00 AM", read: true },
  { id: 16, clientId: 3, type: "message", direction: "inbound", title: "Client feedback: wireframes", excerpt: "Great work overall! Two things: booking step 3 is a bit confusing, and can we simplify the nav labels?", date: "Feb 19", time: "3:30 PM", read: true },
  { id: 17, clientId: 3, type: "message", direction: "outbound", title: "Acknowledged revisions", excerpt: "On it - revisions underway. Will have updates by Thursday.", date: "Feb 19", time: "4:00 PM", read: true },
  { id: 18, clientId: 3, type: "file", direction: "outbound", title: "Sent revised wireframes", excerpt: "Booking flow simplified to 4-step wizard. Navigation labels updated to patient-friendly language.", date: "Feb 20", time: "10:00 AM", read: true },
  { id: 19, clientId: 3, type: "call", direction: "both", title: "UX review call scheduled", excerpt: "60 min - Zoom - Tomorrow 9:00 AM - reviewing revised wireframes and desktop scope.", date: "Feb 22", time: "3:00 PM", read: true },
  { id: 20, clientId: 4, type: "milestone", direction: "outbound", title: "Milestone submitted: Type & Grid System", excerpt: "Full InDesign package with documentation - 12-column grid, 8pt baseline, usage guide.", date: "Feb 9", time: "10:00 AM", read: false },
  { id: 21, clientId: 4, type: "message", direction: "outbound", title: "Follow-up: approval request", excerpt: "Hi - just checking in on the approval for the grid system.", date: "Feb 12", time: "9:00 AM", read: false },
  { id: 22, clientId: 4, type: "message", direction: "outbound", title: "Second follow-up", excerpt: "Following up again. Happy to hop on a call if that would help.", date: "Feb 14", time: "11:00 AM", read: false },
  { id: 23, clientId: 4, type: "message", direction: "outbound", title: "Final follow-up before escalation", excerpt: "Last follow-up before I loop in the account manager.", date: "Feb 17", time: "2:00 PM", read: false },
  { id: 24, clientId: 5, type: "milestone", direction: "inbound", title: "Milestone approved: Data Visualisation", excerpt: "These look excellent. Approving all - please proceed to next milestone.", date: "Feb 19", time: "4:45 PM", read: true },
  { id: 25, clientId: 5, type: "invoice", direction: "inbound", title: "Invoice paid early", excerpt: "R2,900 received - 5 days early. Payment confirmed.", date: "Feb 15", time: "11:00 AM", read: true },
  { id: 26, clientId: 5, type: "message", direction: "inbound", title: "Positive feedback", excerpt: "The charts look exceptional - exactly what the board needed to see. Thank you.", date: "Feb 20", time: "9:30 AM", read: true }
];

const typeConfig: Record<EventType, { icon: string; label: string; color: string; bg: string }> = {
  message: { icon: "✉", label: "Message", color: "#a0a0b0", bg: "rgba(160,160,176,0.08)" },
  milestone: { icon: "◎", label: "Milestone", color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
  invoice: { icon: "₹", label: "Invoice", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 8%, transparent)" },
  call: { icon: "◌", label: "Call", color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
  file: { icon: "⊡", label: "File", color: "#f5c518", bg: "rgba(245,197,24,0.08)" }
};

const directionConfig: Record<Direction, { label: string; color: string }> = {
  outbound: { label: "Sent", color: "var(--muted2)" },
  inbound: { label: "Received", color: "var(--accent)" },
  both: { label: "Joint", color: "#60a5fa" }
};

export function CommunicationHistoryPage({ isActive }: { isActive: boolean }) {
  const [selectedClient, setSelectedClient] = useState<"all" | number>("all");
  const [filterType, setFilterType] = useState<"all" | EventType>("all");
  const [filterDir, setFilterDir] = useState<"all" | "inbound" | "outbound">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const events = useMemo(
    () =>
      allEvents
        .filter((event) => (selectedClient === "all" ? true : event.clientId === selectedClient))
        .filter((event) => (filterType === "all" ? true : event.type === filterType))
        .filter((event) => (filterDir === "all" ? true : event.direction === filterDir))
        .filter((event) => !search || event.title.toLowerCase().includes(search.toLowerCase()) || event.excerpt.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b.id - a.id),
    [filterDir, filterType, search, selectedClient]
  );

  const unreadCount = allEvents.filter((event) => !event.read && event.direction === "inbound").length;

  const groupedByDate = useMemo(() => {
    return events.reduce<Record<string, TimelineEvent[]>>((accumulator, event) => {
      if (!accumulator[event.date]) accumulator[event.date] = [];
      accumulator[event.date].push(event);
      return accumulator;
    }, {});
  }, [events]);

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-communication-history">
      <style>{`
        .comms-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .comms-filter-btn:hover { opacity: 0.8; }
        .comms-event-row { transition: all 0.15s ease; cursor: pointer; }
        .comms-event-row:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; background: color-mix(in srgb, var(--accent) 2%, transparent) !important; }
        .comms-client-pill { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; white-space: nowrap; }
        .comms-client-pill:hover { opacity: 0.8; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Client Intelligence
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Communication History
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Total events", value: allEvents.length, color: "#a0a0b0" },
              { label: "Unread inbound", value: unreadCount, color: unreadCount > 0 ? "#ff4444" : "var(--accent)" },
              { label: "Clients", value: clients.length, color: "#a0a0b0" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
          {[{ id: "all" as const, name: "All clients", avatar: "◈" }, ...clients].map((client) => {
            const isSelected = selectedClient === client.id;
            return (
              <button
                key={client.id}
                type="button"
                className="comms-client-pill"
                onClick={() => setSelectedClient(client.id)}
                style={{ padding: "6px 12px", borderRadius: 2, fontSize: 11, background: isSelected ? "var(--accent)" : "rgba(255,255,255,0.04)", color: isSelected ? "#050508" : "#a0a0b0", display: "flex", alignItems: "center", gap: 6 }}
              >
                <span style={{ fontSize: 9 }}>{client.avatar}</span>
                {client.name}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search events..."
            style={{ width: 220, padding: "7px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "var(--text)", fontSize: 11 }}
          />
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
          {(["all", "message", "milestone", "invoice", "call", "file"] as const).map((type) => (
            <button
              key={type}
              type="button"
              className="comms-filter-btn"
              onClick={() => setFilterType(type)}
              style={{ padding: "5px 12px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 2, background: filterType === type ? "rgba(255,255,255,0.08)" : "transparent", color: filterType === type ? "var(--text)" : "var(--muted2)" }}
            >
              {type === "all" ? "All types" : type}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
          {(["all", "inbound", "outbound"] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              className="comms-filter-btn"
              onClick={() => setFilterDir(direction)}
              style={{ padding: "5px 12px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 2, background: filterDir === direction ? "rgba(255,255,255,0.08)" : "transparent", color: filterDir === direction ? "var(--text)" : "var(--muted2)" }}
            >
              {direction === "all" ? "Both directions" : direction}
            </button>
          ))}
          <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted2)" }}>{events.length} events</div>
        </div>
      </div>

      <div style={{ padding: "28px 8px 8px 0", maxWidth: 860 }}>
        {Object.entries(groupedByDate).length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60, color: "#333344", fontSize: 12 }}>No events match your filters.</div>
        ) : null}

        {Object.entries(groupedByDate).map(([date, dateEvents]) => (
          <div key={date} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{date}</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {dateEvents.map((event, index) => {
                const tCfg = typeConfig[event.type];
                const dCfg = directionConfig[event.direction];
                const clientName = clients.find((row) => row.id === event.clientId)?.name;
                const isExpanded = expanded === event.id;
                const isLast = index === dateEvents.length - 1;
                return (
                  <div key={event.id} style={{ display: "flex", gap: 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${event.read || event.direction === "outbound" ? tCfg.color : "#ff4444"}`, background: tCfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: tCfg.color, zIndex: 1 }}>
                        {tCfg.icon}
                      </div>
                      {!isLast ? <div style={{ width: 1, flex: 1, minHeight: 16, background: "rgba(255,255,255,0.06)", margin: "2px 0" }} /> : null}
                    </div>

                    <div
                      className="comms-event-row"
                      onClick={() => setExpanded(isExpanded ? null : event.id)}
                      style={{ flex: 1, marginBottom: isLast ? 0 : 6, marginLeft: 12, padding: "10px 14px", border: `1px solid ${isExpanded ? "color-mix(in srgb, var(--accent) 20%, transparent)" : !event.read && event.direction === "inbound" ? "rgba(255,68,68,0.2)" : "rgba(255,255,255,0.05)"}`, borderRadius: 3, background: isExpanded ? "color-mix(in srgb, var(--accent) 2%, transparent)" : "rgba(255,255,255,0.01)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isExpanded ? 8 : 0 }}>
                        <span style={{ fontSize: 11, color: "var(--text)", flex: 1, fontWeight: isExpanded ? 500 : 400 }}>{event.title}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                          {selectedClient === "all" ? <span style={{ fontSize: 9, color: "var(--muted2)", padding: "1px 6px", background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>{clientName}</span> : null}
                          <span style={{ fontSize: 9, color: dCfg.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{dCfg.label}</span>
                          {!event.read && event.direction === "inbound" ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4444" }} /> : null}
                          <span style={{ fontSize: 10, color: "#333344" }}>{event.time}</span>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.6, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            {event.excerpt}
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 2, background: tCfg.bg, color: tCfg.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{tCfg.label}</span>
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 2, background: "rgba(255,255,255,0.04)", color: "var(--muted2)" }}>
                              {date} - {event.time}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
