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
        .filter(
          (event) =>
            !search
            || event.title.toLowerCase().includes(search.toLowerCase())
            || event.excerpt.toLowerCase().includes(search.toLowerCase())
        )
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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-communication-history">
      <div className={cx("pageHeaderBar", "borderB", "commsHeaderBar")}>
        <div className={cx("flexBetween", "mb20", "commsHeaderTop")}>
          <div>
            <div className={cx("pageEyebrow", "mb8")}>Staff Dashboard / Client Intelligence</div>
            <h1 className={cx("pageTitle")}>Communication History</h1>
          </div>
          <div className={cx("flexRow", "gap24", "commsTopStats")}>
            {[
              { label: "Total events", value: allEvents.length, toneClass: "commsToneSoft" },
              { label: "Unread inbound", value: unreadCount, toneClass: unreadCount > 0 ? "commsToneRed" : "commsToneAccent" },
              { label: "Clients", value: clients.length, toneClass: "commsToneSoft" }
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight")}>
                <div className={cx("pageEyebrow", "mb4", "commsStatLabel")}>{stat.label}</div>
                <div className={cx("fontDisplay", "fw800", "commsStatValue", stat.toneClass)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("filterRow", "mb14", "commsClientRow")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter by client"
            value={selectedClient === "all" ? "all" : String(selectedClient)}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedClient(value === "all" ? "all" : Number.parseInt(value, 10));
            }}
          >
            <option value="all">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={String(client.id)}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div className={cx("flexRow", "gap10", "flexWrap", "commsFilterRow")}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search events..."
            className={cx("commsSearchInput")}
          />
          <select
            className={cx("filterSelect")}
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
            className={cx("filterSelect")}
            aria-label="Filter by direction"
            value={filterDir}
            onChange={(event) => setFilterDir(event.target.value as "all" | "inbound" | "outbound")}
          >
            <option value="all">Both directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
          <div className={cx("text11", "colorMuted2", "commsEventCount")}>{events.length} events</div>
        </div>
      </div>

      <div className={cx("commsContent")}> 
        {Object.entries(groupedByDate).length === 0 ? (
          <div className={cx("textCenter", "text12", "commsEmptyState")}>No events match your filters.</div>
        ) : null}

        {Object.entries(groupedByDate).map(([date, dateEvents]) => (
          <div key={date} className={cx("mb28")}>
            <div className={cx("flexRow", "gap12", "mb14")}>
              <span className={cx("text10", "colorMuted2", "uppercase", "commsDateLabel")}>{date}</span>
              <div className={cx("flex1", "commsDateLine")} />
            </div>

            <div className={cx("flexCol")}>
              {dateEvents.map((event, index) => {
                const tCfg = typeConfig[event.type];
                const dCfg = directionConfig[event.direction];
                const clientName = clients.find((row) => row.id === event.clientId)?.name;
                const isExpanded = expanded === event.id;
                const isLast = index === dateEvents.length - 1;
                return (
                  <div key={event.id} className={cx("flexRow", "commsTimelineEntry")}>
                    <div className={cx("flexCol", "noShrink", "commsTimelineCol")}>
                      <div
                        className={cx(
                          "flexCenter",
                          "noShrink",
                          "commsTimelineIcon",
                          tCfg.iconClass,
                          !event.read && event.direction === "inbound" && "commsTimelineIconUnread"
                        )}
                      >
                        {tCfg.icon}
                      </div>
                      {!isLast ? <div className={cx("commsTimelineRail")} /> : null}
                    </div>

                    <div
                      className={cx(
                        "commsEventRow",
                        "flex1",
                        isExpanded ? "commsEventRowExpanded" : (!event.read && event.direction === "inbound" ? "commsEventRowUnread" : "commsEventRowIdle"),
                        isLast ? "commsEventRowLast" : "commsEventRowGap"
                      )}
                      onClick={() => setExpanded(isExpanded ? null : event.id)}
                    >
                      <div className={cx("flexRow", "gap10", isExpanded ? "commsEventHeadExpanded" : "commsEventHead")}> 
                        <span className={cx("text11", "colorText", "flex1", isExpanded ? "commsTitleExpanded" : "commsTitle")}>{event.title}</span>
                        <div className={cx("flexRow", "gap8", "noShrink")}>
                          {selectedClient === "all" ? <span className={cx("textXs", "colorMuted2", "commsClientTag")}>{clientName}</span> : null}
                          <span className={cx("textXs", "uppercase", "commsDirectionLabel", dCfg.toneClass)}>{dCfg.label}</span>
                          {!event.read && event.direction === "inbound" ? <div className={cx("commsUnreadPing")} /> : null}
                          <span className={cx("text10", "colorMuted2")}>{event.time}</span>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className={cx("overflowHidden")}>
                          <div className={cx("text12", "colorMuted", "commsExcerpt")}>{event.excerpt}</div>
                          <div className={cx("flexRow", "gap8", "mt8")}>
                            <span className={cx("textXs", "uppercase", "commsTypeBadge", tCfg.badgeClass)}>{tCfg.label}</span>
                            <span className={cx("textXs", "colorMuted2", "commsDateBadge")}>{date} - {event.time}</span>
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
