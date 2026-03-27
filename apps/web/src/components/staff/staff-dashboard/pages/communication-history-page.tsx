"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { StaffEmptyState, EmptyIcons } from "../empty-state";
import type { AuthSession } from "../../../../lib/auth/session";
import { getStaffAllComms } from "../../../../lib/api/staff/clients";

function IcoMessage() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
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
      <path d="M5.5 2H3.5A1 1 0 0 0 2.5 3c0 6.075 4.925 11 11 11a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1l-2.5-.5a1 1 0 0 0-1 .4l-.8 1C7.9 9.6 6.4 8.1 5.6 6.8l1-.8a1 1 0 0 0 .4-1L6.5 3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function IcoFile() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M9 1v5h5" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}

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
  occurredAt: string;
  dateLabel: string;
  timeLabel: string;
};

const TYPE_ICONS: Record<EventType, React.ReactNode> = {
  message: <IcoMessage />,
  milestone: <IcoMilestone />,
  invoice: <IcoInvoice />,
  call: <IcoCall />,
  file: <IcoFile />
};

const typeConfig: Record<EventType, { label: string; iconClass: string }> = {
  message: { label: "Message", iconClass: "commsTypeMessage" },
  milestone: { label: "Milestone", iconClass: "commsTypeMilestone" },
  invoice: { label: "Invoice", iconClass: "commsTypeInvoice" },
  call: { label: "Call", iconClass: "commsTypeCall" },
  file: { label: "File", iconClass: "commsTypeFile" }
};

const directionConfig: Record<Direction, { label: string; toneClass: string }> = {
  outbound: { label: "Sent", toneClass: "commsDirectionOutbound" },
  inbound: { label: "Received", toneClass: "commsDirectionInbound" },
  both: { label: "Joint", toneClass: "commsDirectionBoth" }
};

function normalizeType(value: string): EventType {
  if (value === "message" || value === "milestone" || value === "invoice" || value === "call" || value === "file") return value;
  return "message";
}

function normalizeDirection(value: string): Direction {
  if (value === "inbound" || value === "outbound" || value === "both") return value;
  return "outbound";
}

export function CommunicationHistoryPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedClient, setSelectedClient] = useState<"all" | string>("all");
  const [filterType, setFilterType] = useState<"all" | EventType>("all");
  const [filterDir, setFilterDir] = useState<"all" | Direction>("all");
  const [range, setRange] = useState<"all" | "7d" | "30d">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadComms = useCallback(async (background: boolean) => {
    if (!session) {
      setLoading(false);
      return;
    }
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const r = await getStaffAllComms(session);
      if (r.error) {
        setError(r.error.message ?? "Failed to load communication history.");
        setAllEvents([]);
        return;
      }
      const mapped = (r.data ?? []).map((log): TimelineEvent => {
        const type = normalizeType(log.type);
        const direction = normalizeDirection(log.direction);
        const occurredAt = new Date(log.occurredAt);
        const title = (log.subject ?? "").trim() || `${typeConfig[type].label} event`;
        const excerpt = (log.actionLabel ?? "").trim() || `${directionConfig[direction].label} ${typeConfig[type].label.toLowerCase()}${log.fromName ? ` from ${log.fromName}` : ""}`;
        return {
          id: log.id,
          clientId: log.clientId,
          clientName: log.clientName,
          type,
          direction,
          title,
          excerpt,
          occurredAt: occurredAt.toISOString(),
          dateLabel: occurredAt.toLocaleDateString(undefined, { year: "numeric", day: "numeric", month: "short" }),
          timeLabel: occurredAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
        };
      });
      setAllEvents(mapped);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load communication history.");
      setAllEvents([]);
    } finally {
      if (background) setRefreshing(false);
      else setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!isActive) return;
    void loadComms(false);
  }, [isActive, loadComms]);

  const clients = useMemo((): ClientRow[] => {
    const seen = new Map<string, ClientRow>();
    allEvents.forEach((event) => {
      if (seen.has(event.clientId)) return;
      const initials = event.clientName.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
      seen.set(event.clientId, { id: event.clientId, name: event.clientName, avatar: initials });
    });
    return Array.from(seen.values());
  }, [allEvents]);

  const events = useMemo(() => {
    return allEvents
      .filter((event) => selectedClient === "all" || event.clientId === selectedClient)
      .filter((event) => filterType === "all" || event.type === filterType)
      .filter((event) => filterDir === "all" || event.direction === filterDir)
      .filter((event) => {
        if (range === "all") return true;
        const ageDays = (Date.now() - new Date(event.occurredAt).getTime()) / (1000 * 60 * 60 * 24);
        return range === "7d" ? ageDays <= 7 : ageDays <= 30;
      })
      .filter((event) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          event.title.toLowerCase().includes(q)
          || event.excerpt.toLowerCase().includes(q)
          || event.clientName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const delta = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
        return sortBy === "newest" ? -delta : delta;
      });
  }, [allEvents, selectedClient, filterType, filterDir, range, search, sortBy]);

  const groupedByDate = useMemo(() => {
    return events.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
      if (!acc[event.dateLabel]) acc[event.dateLabel] = [];
      acc[event.dateLabel].push(event);
      return acc;
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
          <StaffEmptyState icon={EmptyIcons.notes} title="Loading…" sub="Fetching communication history." />
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
        <p className={cx("pageSubtitleText", "mb16")}>Interaction timeline across all clients</p>

        <div className={cx("staffKpiStrip", "mb16")}>
          <div className={cx("staffKpiCell")}>
            <div className={cx("staffKpiLabel")}>Total events</div>
            <div className={cx("staffKpiValue")}>{allEvents.length}</div>
          </div>
          <div className={cx("staffKpiCell")}>
            <div className={cx("staffKpiLabel")}>Clients</div>
            <div className={cx("staffKpiValue")}>{clients.length}</div>
          </div>
          <div className={cx("staffKpiCell")}>
            <div className={cx("staffKpiLabel")}>Visible</div>
            <div className={cx("staffKpiValue")}>{events.length}</div>
          </div>
        </div>

        <div className={cx("staffSectionHdFilter", "commsFiltersWrap")}>
          <select className={cx("staffFilterInput")} aria-label="Filter by client" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value === "all" ? "all" : e.target.value)}>
            <option value="all">All clients</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>

          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events…" className={cx("staffFilterInput")} />

          <select className={cx("staffFilterInput")} aria-label="Filter by type" value={filterType} onChange={(e) => setFilterType(e.target.value as "all" | EventType)}>
            <option value="all">All types</option>
            <option value="message">Message</option>
            <option value="milestone">Milestone</option>
            <option value="invoice">Invoice</option>
            <option value="call">Call</option>
            <option value="file">File</option>
          </select>

          <select className={cx("staffFilterInput")} aria-label="Filter by direction" value={filterDir} onChange={(e) => setFilterDir(e.target.value as "all" | Direction)}>
            <option value="all">All directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
            <option value="both">Joint</option>
          </select>

          <select className={cx("staffFilterInput")} aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value as "all" | "7d" | "30d")}>
            <option value="all">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <select className={cx("staffFilterInput")} aria-label="Sort order" value={sortBy} onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          <button
            type="button"
            className={cx("commsGhostBtn")}
            onClick={() => {
              setSelectedClient("all");
              setFilterType("all");
              setFilterDir("all");
              setRange("all");
              setSortBy("newest");
              setSearch("");
            }}
          >
            Clear
          </button>
          <button type="button" className={cx("commsGhostBtn")} onClick={() => void loadComms(true)} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <span className={cx("staffRoleLabel")}>{events.length} events</span>
        </div>
      </div>

      <div className={cx("commsContent")}>
        {Object.entries(groupedByDate).length === 0 ? (
          <StaffEmptyState icon={EmptyIcons.notes} title="No events found" sub="No communication events match your filters." />
        ) : null}

        {Object.entries(groupedByDate).map(([date, dateEvents]) => (
          <div key={date} className={cx("mb20")}>
            <div className={cx("staffCommsDateHd")}>
              <span className={cx("staffCommsDateLabel")}>{date}</span>
              <div className={cx("staffCommsDateLine")} />
            </div>

            <div className={cx("staffCard")}>
              {dateEvents.map((event, index) => {
                const tCfg = typeConfig[event.type];
                const dCfg = directionConfig[event.direction];
                const isExpanded = expanded === event.id;
                const isLast = index === dateEvents.length - 1;
                const chipCls = event.type === "message" ? "staffChipAccent" : event.type === "milestone" ? "staffChipGreen" : event.type === "invoice" ? "staffChipAmber" : event.type === "call" ? "staffChipPurple" : "staffChip";
                const directionChipCls = dCfg.toneClass === "commsDirectionInbound" ? "staffChipGreen" : dCfg.toneClass === "commsDirectionBoth" ? "staffChipPurple" : "";

                return (
                  <div
                    key={event.id}
                    className={cx("staffListRow", isLast && "staffCommsRowLast")}
                    style={{ cursor: "pointer", borderBottom: isLast ? "none" : "1px solid var(--border)", flexDirection: "column", alignItems: "stretch", gap: 0 }}
                    onClick={() => setExpanded(isExpanded ? null : event.id)}
                  >
                    <div className={cx("commsEventHeadRow")}>
                      <div className={cx("commsTimelineIcon", tCfg.iconClass)}>{TYPE_ICONS[event.type]}</div>
                      <span className={cx("staffCommsTitle", "flex1")}>{event.title}</span>
                      <div className={cx("commsEventMeta")}>
                        {selectedClient === "all" ? (
                          <button
                            type="button"
                            className={cx("commsClientFilterBtn")}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(event.clientId);
                            }}
                          >
                            {event.clientName}
                          </button>
                        ) : null}
                        <span className={cx("staffChip", chipCls)}>{tCfg.label}</span>
                        <span className={cx("staffChip", directionChipCls)}>{dCfg.label}</span>
                        <span className={cx("staffCommsTimeCol")}>{event.timeLabel}</span>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className={cx("commsExpandedBody")}>
                        <div className={cx("staffCommsExcerpt")}>{event.excerpt}</div>
                        <div className={cx("commsExpandedMeta")}>
                          <span className={cx("staffChip", chipCls)}>{tCfg.label}</span>
                          <span className={cx("staffRoleLabel")}>{date} · {event.timeLabel}</span>
                          <button
                            type="button"
                            className={cx("commsGhostBtn")}
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await navigator.clipboard.writeText(`[${event.clientName}] ${event.title} · ${event.excerpt}`);
                              } catch {
                                // noop
                              }
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    ) : null}
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
