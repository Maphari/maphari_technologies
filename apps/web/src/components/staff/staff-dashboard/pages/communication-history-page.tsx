"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { StaffEmptyState, EmptyIcons } from "../empty-state";
import type { AuthSession } from "../../../../lib/auth/session";
import { getStaffAllComms } from "../../../../lib/api/staff/clients";

// ─── Type icons (SVG) ────────────────────────────────────────────────────────

function IcoMessage() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"
        stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function IcoMilestone() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 2v12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M3 3h8l-2 3.5L11 10H3" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function IcoInvoice() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IcoCall() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5.5 2H3.5A1 1 0 0 0 2.5 3c0 6.075 4.925 11 11 11a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1l-2.5-.5a1 1 0 0 0-1 .4l-.8 1C7.9 9.6 6.4 8.1 5.6 6.8l1-.8a1 1 0 0 0 .4-1L6.5 3a1 1 0 0 0-1-1Z"
        stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function IcoFile() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 1Z"
        stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M9 1v5h5" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  message:   <IcoMessage />,
  milestone: <IcoMilestone />,
  invoice:   <IcoInvoice />,
  call:      <IcoCall />,
  file:      <IcoFile />,
};

type EventType = "message" | "milestone" | "invoice" | "call" | "file";
type Direction = "outbound" | "inbound" | "both";

type ClientRow = {
  id: string;
  name: string;
  avatar: string;
};

type TimelineEvent = {
  id: string;
  clientId: string;
  clientName: string;
  type: EventType;
  direction: Direction;
  title: string;
  excerpt: string;
  date: string;
  time: string;
};

const typeConfig: Record<EventType, { icon: string; label: string; iconClass: string; badgeClass: string }> = {
  message: { icon: "✉", label: "Message", iconClass: "commsTypeMessage", badgeClass: "commsTypeBadgeMessage" },
  milestone: { icon: "◎", label: "Milestone", iconClass: "commsTypeMilestone", badgeClass: "commsTypeBadgeMilestone" },
  invoice: { icon: "₹", label: "Invoice", iconClass: "commsTypeInvoice", badgeClass: "commsTypeBadgeInvoice" },
  call: { icon: "◌", label: "Call", iconClass: "commsTypeCall", badgeClass: "commsTypeBadgeCall" },
  file: { icon: "⊡", label: "File", iconClass: "commsTypeFile", badgeClass: "commsTypeBadgeFile" }
};

const directionConfig: Record<Direction, { label: string; toneClass: string }> = {
  outbound: { label: "Sent", toneClass: "commsDirectionOutbound" },
  inbound: { label: "Received", toneClass: "commsDirectionInbound" },
  both: { label: "Joint", toneClass: "commsDirectionBoth" }
};

export function CommunicationHistoryPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClient, setSelectedClient] = useState<"all" | string>("all");
  const [filterType, setFilterType] = useState<"all" | EventType>("all");
  const [filterDir, setFilterDir] = useState<"all" | "inbound" | "outbound">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    void getStaffAllComms(session).then((r) => {
      if (r.data) {
        setAllEvents(r.data.map((log): TimelineEvent => {
          const d = new Date(log.occurredAt);
          return {
            id: log.id,
            clientId: log.clientId,
            clientName: log.clientName,
            type: (["message", "milestone", "invoice", "call", "file"].includes(log.type) ? log.type : "message") as EventType,
            direction: (log.direction === "inbound" || log.direction === "outbound" ? log.direction : "outbound") as Direction,
            title: log.subject,
            excerpt: log.actionLabel ?? "",
            date: d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
            time: d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
          };
        }));
      }
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load");
    }).finally(() => setLoading(false));
  }, [session]);

  const clients = useMemo((): ClientRow[] => {
    const seen = new Map<string, ClientRow>();
    for (const ev of allEvents) {
      if (!seen.has(ev.clientId)) {
        const initials = ev.clientName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        seen.set(ev.clientId, { id: ev.clientId, name: ev.clientName, avatar: initials });
      }
    }
    return Array.from(seen.values());
  }, [allEvents]);

  const events = useMemo(
    () =>
      allEvents
        .filter((event) => (selectedClient === "all" ? true : event.clientId === selectedClient))
        .filter((event) => (filterType === "all" ? true : event.type === filterType))
        .filter((event) => (filterDir === "all" ? true : event.direction === filterDir))
        .filter(
          (event) =>
            !search
            || event.title.toLowerCase().includes(search.toLowerCase())
            || event.excerpt.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => b.id.localeCompare(a.id)),
    [allEvents, filterDir, filterType, search, selectedClient]
  );

  const groupedByDate = useMemo(() => {
    return events.reduce<Record<string, TimelineEvent[]>>((accumulator, event) => {
      if (!accumulator[event.date]) accumulator[event.date] = [];
      accumulator[event.date].push(event);
      return accumulator;
    }, {});
  }, [events]);

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-communication-history">
        <div className={cx("pageHeaderBar", "borderB", "commsHeaderBar")}>
          <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
          <h1 className={cx("pageTitleText")}>Communication History</h1>
        </div>
        <div className={cx("commsContent")}>
          <StaffEmptyState icon={EmptyIcons.notes} title="Loading..." sub="Fetching communication history." />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-communication-history">
        <div className={cx("pageHeaderBar", "borderB", "commsHeaderBar")}>
          <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
          <h1 className={cx("pageTitleText")}>Communication History</h1>
        </div>
        <div className={cx("commsContent")}>
          <StaffEmptyState icon={EmptyIcons.notes} title="Failed to load" sub={error} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-communication-history">
      <div className={cx("pageHeaderBar", "borderB", "commsHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
        <h1 className={cx("pageTitleText")}>Communication History</h1>
        <p className={cx("pageSubtitleText", "mb16")}>Full interaction timeline across all clients</p>

        {/* Stats strip */}
        <div className={cx("staffKpiStrip", "mb16")}>
          {[
            { label: "Total events", value: allEvents.length, cls: "" },
            { label: "Clients",      value: clients.length,   cls: "" },
            { label: "Types",        value: new Set(allEvents.map(e => e.type)).size, cls: "" },
          ].map((stat) => (
            <div key={stat.label} className={cx("staffKpiCell")}>
              <div className={cx("staffKpiLabel")}>{stat.label}</div>
              <div className={cx("staffKpiValue", stat.cls)}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filter row */}
        <div className={cx("staffSectionHdFilter")}>
          <select
            className={cx("staffFilterInput")}
            aria-label="Filter by client"
            value={selectedClient === "all" ? "all" : selectedClient}
            onChange={(e) => setSelectedClient(e.target.value === "all" ? "all" : e.target.value)}
          >
            <option value="all">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search events…"
            className={cx("staffFilterInput")}
          />

          <select
            className={cx("staffFilterInput")}
            aria-label="Filter by event type"
            value={filterType}
            onChange={(event) => setFilterType(event.target.value as "all" | EventType)}
          >
            <option value="all">All types</option>
            <option value="message">Message</option>
            <option value="milestone">Milestone</option>
            <option value="invoice">Invoice</option>
            <option value="call">Call</option>
            <option value="file">File</option>
          </select>

          <select
            className={cx("staffFilterInput")}
            aria-label="Filter by direction"
            value={filterDir}
            onChange={(event) => setFilterDir(event.target.value as "all" | "inbound" | "outbound")}
          >
            <option value="all">Both directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>

          <span className={cx("staffRoleLabel")}>{events.length} events</span>
        </div>
      </div>

      <div className={cx("commsContent")}>
        {Object.entries(groupedByDate).length === 0 ? (
          <StaffEmptyState icon={EmptyIcons.notes} title="No events found" sub="No communication events match your filters." />
        ) : null}

        {Object.entries(groupedByDate).map(([date, dateEvents]) => (
          <div key={date} className={cx("mb20")}>
            {/* Date header */}
            <div className={cx("staffCommsDateHd")}>
              <span className={cx("staffCommsDateLabel")}>{date}</span>
              <div className={cx("staffCommsDateLine")} />
            </div>

            {/* Event rows */}
            <div className={cx("staffCard")}>
              {dateEvents.map((event, index) => {
                const tCfg = typeConfig[event.type];
                const dCfg = directionConfig[event.direction];
                const isExpanded = expanded === event.id;
                const isLast = index === dateEvents.length - 1;

                // map type to staffChip variant
                const chipCls =
                  event.type === "message" ? "staffChipAccent"
                  : event.type === "milestone" ? "staffChipGreen"
                  : event.type === "invoice" ? "staffChipAmber"
                  : event.type === "call" ? "staffChipPurple"
                  : "staffChip";

                return (
                  <div
                    key={event.id}
                    className={cx(
                      "staffListRow",
                      isLast && "staffCommsRowLast"
                    )}
                    style={{ cursor: "pointer", borderBottom: isLast ? "none" : "1px solid var(--border)", flexDirection: "column", alignItems: "stretch", gap: 0 }}
                    onClick={() => setExpanded(isExpanded ? null : event.id)}
                  >
                    {/* Head */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
                      <div
                        className={cx(
                          "commsTimelineIcon",
                          tCfg.iconClass
                        )}
                      >
                        {TYPE_ICONS[event.type]}
                      </div>
                      <span className={cx("staffCommsTitle", "flex1")}>{event.title}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {selectedClient === "all" && (
                          <span className={cx("staffRoleLabel")}>{event.clientName}</span>
                        )}
                        <span className={cx("staffChip", chipCls)}>{tCfg.label}</span>
                        <span className={cx("staffChip", dCfg.toneClass === "commsDirectionOutbound" ? "" : dCfg.toneClass === "commsDirectionInbound" ? "staffChipGreen" : "staffChipPurple")}>{dCfg.label}</span>
                        <span className={cx("staffCommsTimeCol")}>{event.time}</span>
                      </div>
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div style={{ padding: "0 14px 10px 14px" }}>
                        <div className={cx("staffCommsExcerpt")}>{event.excerpt}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <span className={cx("staffChip", chipCls)}>{tCfg.label}</span>
                          <span className={cx("staffRoleLabel")}>{date} · {event.time}</span>
                        </div>
                      </div>
                    )}
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
