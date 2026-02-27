"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";

type ActivityType =
  | "viewed_milestone"
  | "approved_milestone"
  | "viewed_invoice"
  | "downloaded_file"
  | "uploaded_file"
  | "logged_in"
  | "sent_message";

type ActivityEvent = {
  id: number;
  clientId: number;
  client: string;
  type: ActivityType;
  label: string;
  detail: string;
  time: string;
  ts: number;
  read: boolean;
  priority: boolean;
};

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
};

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS" },
  { id: 2, name: "Kestrel Capital", avatar: "KC" },
  { id: 3, name: "Mira Health", avatar: "MH" },
  { id: 4, name: "Dune Collective", avatar: "DC" },
  { id: 5, name: "Okafor & Sons", avatar: "OS" }
];

const initialFeed: ActivityEvent[] = [
  { id: 1, clientId: 1, client: "Volta Studios", type: "viewed_milestone", label: "Viewed milestone", detail: "Logo & Visual Direction", time: "2 min ago", ts: 1, read: false, priority: true },
  { id: 2, clientId: 3, client: "Mira Health", type: "downloaded_file", label: "Downloaded file", detail: "Mobile wireframes v2.pdf", time: "14 min ago", ts: 2, read: false, priority: false },
  { id: 3, clientId: 1, client: "Volta Studios", type: "viewed_invoice", label: "Viewed invoice", detail: "INV-0041 · R8,750", time: "1h ago", ts: 3, read: true, priority: false },
  { id: 4, clientId: 2, client: "Kestrel Capital", type: "logged_in", label: "Logged in", detail: "First login in 6 days", time: "2h ago", ts: 4, read: false, priority: true },
  { id: 5, clientId: 5, client: "Okafor & Sons", type: "approved_milestone", label: "Approved milestone", detail: "Data Visualisation Suite", time: "3h ago", ts: 5, read: true, priority: false },
  { id: 6, clientId: 3, client: "Mira Health", type: "viewed_milestone", label: "Viewed milestone", detail: "Mobile Wireframes — In Revision", time: "4h ago", ts: 6, read: true, priority: false },
  { id: 7, clientId: 4, client: "Dune Collective", type: "logged_in", label: "Logged in", detail: "Last login 8 days ago", time: "Yesterday 4:55 PM", ts: 7, read: false, priority: true },
  { id: 8, clientId: 2, client: "Kestrel Capital", type: "viewed_milestone", label: "Viewed milestone", detail: "Campaign Strategy Deck", time: "Yesterday 3:30 PM", ts: 8, read: true, priority: false },
  { id: 9, clientId: 4, client: "Dune Collective", type: "viewed_milestone", label: "Viewed milestone", detail: "Type & Grid System", time: "Yesterday 4:57 PM", ts: 9, read: false, priority: false },
  { id: 10, clientId: 1, client: "Volta Studios", type: "uploaded_file", label: "Uploaded file", detail: "Brand reference — additional assets.zip", time: "Feb 21", ts: 10, read: true, priority: false },
  { id: 11, clientId: 5, client: "Okafor & Sons", type: "viewed_invoice", label: "Viewed invoice", detail: "INV-0039 · R2,900", time: "Feb 20", ts: 11, read: true, priority: false },
  { id: 12, clientId: 3, client: "Mira Health", type: "sent_message", label: "Sent message", detail: "Re: booking flow revision feedback", time: "Feb 19", ts: 12, read: true, priority: false }
];

const typeConfig: Record<
  ActivityType,
  { icon: string; color: string; bg: string; label: string }
> = {
  viewed_milestone: { icon: "◎", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", label: "Milestone view" },
  approved_milestone: { icon: "✓", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 10%, transparent)", label: "Approved" },
  viewed_invoice: { icon: "₹", color: "#f5c518", bg: "rgba(245,197,24,0.1)", label: "Invoice view" },
  downloaded_file: { icon: "↓", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", label: "Download" },
  uploaded_file: { icon: "↑", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", label: "Upload" },
  logged_in: { icon: "◉", color: "#ff8c00", bg: "rgba(255,140,0,0.1)", label: "Login" },
  sent_message: { icon: "✉", color: "#a0a0b0", bg: "rgba(160,160,176,0.1)", label: "Message" }
};

const clientColors: Record<number, string> = {
  1: "var(--accent)",
  2: "#a78bfa",
  3: "#60a5fa",
  4: "#f5c518",
  5: "#ff8c00"
};

const portalStats: Record<
  number,
  { sessions: number; lastLogin: string; avgSessionMin: number; topAction: string; activeDays: number }
> = {
  1: { sessions: 12, lastLogin: "Today 8:52 AM", avgSessionMin: 6, topAction: "Viewed milestones", activeDays: 5 },
  2: { sessions: 3, lastLogin: "Today 2:10 AM", avgSessionMin: 2, topAction: "Viewed invoices", activeDays: 1 },
  3: { sessions: 8, lastLogin: "Yesterday", avgSessionMin: 9, topAction: "Downloaded files", activeDays: 4 },
  4: { sessions: 2, lastLogin: "Yesterday 4:55 PM", avgSessionMin: 4, topAction: "Viewed milestones", activeDays: 2 },
  5: { sessions: 11, lastLogin: "Feb 20", avgSessionMin: 5, topAction: "Approved milestones", activeDays: 6 }
};

type GroupKey = "Today" | "Yesterday" | "Earlier";

export function PortalActivityPage({ isActive }: { isActive: boolean }) {
  const [feed, setFeed] = useState(initialFeed);
  const [clientFilter, setClientFilter] = useState<"all" | number>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ActivityType>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [liveIndicator, setLiveIndicator] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => setLiveIndicator((value) => !value), 1200);
    return () => window.clearInterval(interval);
  }, []);

  const markAllRead = () => setFeed((previous) => previous.map((event) => ({ ...event, read: true })));
  const markRead = (id: number) =>
    setFeed((previous) =>
      previous.map((event) => (event.id === id ? { ...event, read: true } : event))
    );

  const filtered = useMemo(() => {
    return feed
      .filter((event) => (clientFilter === "all" ? true : event.clientId === clientFilter))
      .filter((event) => (typeFilter === "all" ? true : event.type === typeFilter))
      .filter((event) => (showUnreadOnly ? !event.read : true));
  }, [clientFilter, feed, showUnreadOnly, typeFilter]);

  const unreadCount = feed.filter((event) => !event.read).length;
  const priorityCount = feed.filter((event) => event.priority && !event.read).length;

  const groupedByTime = useMemo(() => {
    return filtered.reduce<Record<GroupKey, ActivityEvent[]>>(
      (accumulator, event) => {
        const group: GroupKey = event.time.includes("ago") || event.time.includes("h ago")
          ? "Today"
          : event.time.startsWith("Yesterday")
            ? "Yesterday"
            : "Earlier";
        accumulator[group].push(event);
        return accumulator;
      },
      { Today: [], Yesterday: [], Earlier: [] }
    );
  }, [filtered]);

  const stats = selectedClient ? portalStats[selectedClient] : null;
  const selClient = selectedClient ? clients.find((client) => client.id === selectedClient) : null;

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-portal-activity">
      <style>{`
        .pa-event-row { transition: all 0.12s ease; cursor: pointer; }
        .pa-event-row:hover { background: color-mix(in srgb, var(--accent) 2%, transparent) !important; border-color: color-mix(in srgb, var(--accent) 15%, transparent) !important; }
        .pa-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .pa-filter-btn:hover { opacity: 0.8; }
        .pa-client-pill { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .pa-client-pill:hover { opacity: 0.8; }
        .pa-mark-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .pa-mark-btn:hover { opacity: 0.7; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Client Intelligence
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                Portal Activity
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", opacity: liveIndicator ? 1 : 0.3, transition: "opacity 0.6s ease" }} />
                <span style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em" }}>LIVE</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Unread", value: unreadCount, color: unreadCount > 0 ? "#ff4444" : "var(--muted2)" },
              { label: "Priority", value: priorityCount, color: priorityCount > 0 ? "#ff8c00" : "var(--muted2)" },
              { label: "Today", value: feed.filter((event) => event.time.includes("ago") || event.time.includes("h ago")).length, color: "#a0a0b0" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          <button
            type="button"
            className="pa-client-pill"
            onClick={() => {
              setClientFilter("all");
              setSelectedClient(null);
            }}
            style={{ padding: "6px 12px", borderRadius: 2, fontSize: 11, background: clientFilter === "all" ? "var(--accent)" : "rgba(255,255,255,0.04)", color: clientFilter === "all" ? "#050508" : "#a0a0b0" }}
          >
            All clients
          </button>
          {clients.map((client) => {
            const isActive = clientFilter === client.id;
            const cColor = clientColors[client.id];
            const clientUnread = feed.filter((event) => event.clientId === client.id && !event.read).length;
            return (
              <button
                key={client.id}
                type="button"
                className="pa-client-pill"
                onClick={() => {
                  setClientFilter(isActive ? "all" : client.id);
                  setSelectedClient(isActive ? null : client.id);
                }}
                style={{ padding: "6px 12px", borderRadius: 2, fontSize: 11, background: isActive ? `${cColor}18` : "rgba(255,255,255,0.04)", color: isActive ? cColor : "#a0a0b0", display: "flex", alignItems: "center", gap: 6, outline: isActive ? `1px solid ${cColor}40` : "none" }}
              >
                {client.name}
                {clientUnread > 0 ? <span style={{ fontSize: 9, background: "#ff4444", color: "#fff", borderRadius: 10, padding: "1px 5px" }}>{clientUnread}</span> : null}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {(["all", "viewed_milestone", "approved_milestone", "viewed_invoice", "downloaded_file", "logged_in"] as const).map((type) => (
            <button
              key={type}
              type="button"
              className="pa-filter-btn"
              onClick={() => setTypeFilter(type)}
              style={{ padding: "5px 10px", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 2, background: typeFilter === type ? "rgba(255,255,255,0.08)" : "transparent", color: typeFilter === type ? "var(--text)" : "var(--muted2)" }}
            >
              {type === "all" ? "All activity" : typeConfig[type]?.label}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              className="pa-filter-btn"
              onClick={() => setShowUnreadOnly((value) => !value)}
              style={{ padding: "5px 12px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 2, background: showUnreadOnly ? "rgba(255,68,68,0.1)" : "transparent", color: showUnreadOnly ? "#ff4444" : "var(--muted2)", border: `1px solid ${showUnreadOnly ? "rgba(255,68,68,0.2)" : "transparent"}` }}
            >
              Unread only
            </button>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="pa-mark-btn"
                onClick={markAllRead}
                style={{ padding: "5px 12px", fontSize: 10, letterSpacing: "0.08em", background: "transparent", color: "var(--muted2)" }}
              >
                Mark all read
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedClient ? "1fr 300px" : "1fr", minHeight: "calc(100vh - 260px)" }}>
        <div style={{ padding: "20px 12px 8px 0", borderRight: selectedClient ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
          {filtered.length === 0 ? <div style={{ textAlign: "center", paddingTop: 60, color: "#333344", fontSize: 12 }}>No activity matches your filters.</div> : null}
          {(["Today", "Yesterday", "Earlier"] as GroupKey[]).map((group) => {
            const events = groupedByTime[group];
            if (!events?.length) return null;
            return (
              <div key={group} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{group}</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {events.map((event) => {
                    const tCfg = typeConfig[event.type];
                    const cColor = clientColors[event.clientId];
                    return (
                      <div
                        key={event.id}
                        className="pa-event-row"
                        onClick={() => markRead(event.id)}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", border: `1px solid ${!event.read ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`, borderRadius: 3, background: !event.read ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.005)", opacity: event.read ? 0.7 : 1 }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: !event.read ? (event.priority ? "#ff8c00" : "var(--accent)") : "transparent", flexShrink: 0 }} />
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: tCfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: tCfg.color, flexShrink: 0 }}>
                          {tCfg.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 11, color: cColor, fontWeight: 500 }}>{event.client}</span>
                            <span style={{ fontSize: 11, color: "var(--muted2)" }}>{event.label}</span>
                            {event.priority && !event.read ? (
                              <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 2, background: "rgba(255,140,0,0.12)", color: "#ff8c00", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                Notable
                              </span>
                            ) : null}
                          </div>
                          <div style={{ fontSize: 12, color: "#a0a0b0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.detail}</div>
                        </div>
                        <span style={{ fontSize: 10, color: "#333344", flexShrink: 0 }}>{event.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {selectedClient && stats ? (
          <div style={{ padding: "20px 20px" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: 3, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#a0a0b0" }}>
                  {selClient?.avatar}
                </div>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: "#fff" }}>{selClient?.name}</div>
                  <div style={{ fontSize: 10, color: "var(--muted2)" }}>Portal stats · last 30 days</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Sessions", value: stats.sessions, color: clientColors[selectedClient] },
                { label: "Active days", value: stats.activeDays, color: clientColors[selectedClient] },
                { label: "Avg session", value: `${stats.avgSessionMin}m`, color: "#a0a0b0" },
                { label: "Last login", value: stats.lastLogin, color: "#a0a0b0" }
              ].map((stat) => (
                <div key={stat.label} style={{ padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontSize: 14, color: stat.color, fontWeight: 500 }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)", marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Most common action</div>
              <div style={{ fontSize: 13, color: clientColors[selectedClient] }}>{stats.topAction}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Activity · last 7 days</div>
              <div style={{ display: "flex", gap: 4 }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                  const activity = [3, 0, 5, 2, 4, 0, 1][index];
                  return (
                    <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: "100%", height: 32, borderRadius: 2, background: activity > 0 ? `${clientColors[selectedClient]}` : "rgba(255,255,255,0.04)", opacity: activity > 0 ? 0.15 + (activity / 5) * 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {activity > 0 ? <span style={{ fontSize: 10, color: clientColors[selectedClient] }}>{activity}</span> : null}
                      </div>
                      <span style={{ fontSize: 8, color: "#333344" }}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Recent events</div>
              {feed
                .filter((event) => event.clientId === selectedClient)
                .slice(0, 4)
                .map((event) => {
                  const tCfg = typeConfig[event.type];
                  return (
                    <div key={event.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: 12, color: tCfg.color, flexShrink: 0 }}>{tCfg.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: "#a0a0b0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.detail}</div>
                        <div style={{ fontSize: 9, color: "var(--muted2)", marginTop: 1 }}>{event.time}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
