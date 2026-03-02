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

const typeConfig: Record<TouchType, { icon: string; colorClass: string; timelineClass: string }> = {
  message: { icon: "✉", colorClass: "ltTypeMessage", timelineClass: "ltTimelineTypeMessage" },
  milestone: { icon: "◎", colorClass: "ltTypeMilestone", timelineClass: "ltTimelineTypeMilestone" },
  invoice: { icon: "₹", colorClass: "ltTypeInvoice", timelineClass: "ltTimelineTypeInvoice" },
  call: { icon: "◌", colorClass: "ltTypeCall", timelineClass: "ltTimelineTypeCall" },
  file: { icon: "⊡", colorClass: "ltTypeFile", timelineClass: "ltTimelineTypeFile" }
};

const stalenessConfig: Record<
  Staleness,
  {
    label: string;
    description: string;
    rowClass: string;
    badgeClass: string;
    toneClass: string;
    cardClass: string;
    filterActiveClass: string;
  }
> = {
  fresh: {
    label: "Fresh",
    description: "Contacted within 48 hours",
    rowClass: "ltClientRowFresh",
    badgeClass: "ltStalenessBadgeFresh",
    toneClass: "ltToneFresh",
    cardClass: "ltStalenessCardFresh",
    filterActiveClass: "ltFilterBtnActiveFresh"
  },
  aging: {
    label: "Aging",
    description: "2-5 days since last touch",
    rowClass: "ltClientRowAging",
    badgeClass: "ltStalenessBadgeAging",
    toneClass: "ltToneAging",
    cardClass: "ltStalenessCardAging",
    filterActiveClass: "ltFilterBtnActiveAging"
  },
  stale: {
    label: "Stale",
    description: "6+ days - needs attention",
    rowClass: "ltClientRowStale",
    badgeClass: "ltStalenessBadgeStale",
    toneClass: "ltToneStale",
    cardClass: "ltStalenessCardStale",
    filterActiveClass: "ltFilterBtnActiveStale"
  }
};

const sentimentClasses: Record<Sentiment, string> = {
  positive: "ltSentimentPositive",
  neutral: "ltSentimentNeutral",
  at_risk: "ltSentimentAtRisk"
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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-last-touched">
      <div className={cx("pageHeaderBar", "borderB", "ltHeader")}> 
        <div className={cx("flexBetween", "mb20", "ltHeaderTop")}>
          <div>
            <div className={cx("pageEyebrow", "mb8")}>Staff Dashboard / Client Intelligence</div>
            <h1 className={cx("pageTitle")}>Last Touched</h1>
            <div className={cx("text12", "colorMuted2", "mt6")}>Monday, Feb 23 - 9:00 AM</div>
          </div>
          <div className={cx("flexRow", "gap24", "ltTopStats")}>
            {[
              { label: "Stale", value: staleCount, colorClass: staleCount > 0 ? "ltToneStale" : "ltToneMuted" },
              { label: "Aging", value: agingCount, colorClass: agingCount > 0 ? "ltToneAging" : "ltToneMuted" },
              { label: "Fresh", value: freshCount, colorClass: "ltToneFresh" }
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight", "ltTopStatCard")}>
                <div className={cx("pageEyebrow", "mb4", "ltStatLabel")}>{stat.label}</div>
                <div className={cx("fontDisplay", "fw800", "ltStatValue", stat.colorClass)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("filterRow", "ltToolbar")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter staleness"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | Staleness)}
          >
            <option value="all">All</option>
            <option value="stale">Stale</option>
            <option value="aging">Aging</option>
            <option value="fresh">Fresh</option>
          </select>
          <select
            className={cx("filterSelect")}
            aria-label="Sort clients"
            value={sort}
            onChange={(event) => setSort(event.target.value as "staleness" | "items" | "name")}
          >
            <option value="staleness">Sort: stalest first</option>
            <option value="items">Sort: open items</option>
            <option value="name">Sort: name</option>
          </select>
        </div>
      </div>

      <div className={cx(current ? "ltLayoutWithPanel" : "ltLayout")}> 
        <div className={cx("ltListPane", current && "ltListPaneWithPanel")}>
          <div className={cx("flexCol", "gap10")}>
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
                  className={cx("ltClientRow", sCfg.rowClass, isSelected && "ltClientRowSelected")}
                  onClick={() => setSelected(isSelected ? null : client.id)}
                >
                  <div className={cx("flexRow", "gap14", "ltClientRowInner")}>
                    <div className={cx("flexCenter", "noShrink", "ltClientAvatar")}>{client.avatar}</div>
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("flexRow", "gap10", "mb4", "ltClientHead")}>
                        <span className={cx("fontDisplay", "fw700", "colorText", "ltClientName")}>{client.name}</span>
                        <span className={cx("textXs", "uppercase", "ltStalenessBadge", sCfg.badgeClass)}>{sCfg.label}</span>
                        <div className={cx("ltSentimentDot", sentimentClasses[client.sentiment])} />
                      </div>
                      <div className={cx("text11", "colorMuted2", "mb8")}>{client.project}</div>
                      <div className={cx("flexRow", "gap8", "mb6", "ltTouchSummary")}>
                        <span className={cx("text12", tCfg.colorClass)}>{tCfg.icon}</span>
                        <span className={cx("text11", "colorMuted")}>{client.lastTouchedNote}</span>
                      </div>
                      <div className={cx("text11", nextOverdue ? "ltTextDanger" : "colorMuted2")}>
                        → {client.nextAction} <span className={cx(nextOverdue ? "ltTextDanger" : "colorMuted2")}>({nextDueStr})</span>
                      </div>
                    </div>
                    <div className={cx("textRight", "noShrink")}>
                      <div className={cx("fontDisplay", "fw800", "mb4", "ltSinceValue", sCfg.toneClass)}>{sinceStr}</div>
                      <div className={cx("text10", "colorMuted2")}>
                        {client.openItems > 0 ? `${client.openItems} open item${client.openItems > 1 ? "s" : ""}` : "No open items"}
                      </div>
                      <div className={cx("text10", client.retainerBurn > 90 ? "ltTextDanger" : "colorMuted2", "ltRetainerStat")}>
                        {client.retainerBurn}% retainer
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {current ? (
          <div className={cx("flexCol", "ltDetailPane")}>
            <div>
              <div className={cx("fontDisplay", "fw800", "colorText", "mb4", "ltDetailName")}>{current.name}</div>
              <div className={cx("text11", "colorMuted2")}>
                {current.contact} · {current.project}
              </div>
            </div>

            <div className={cx("p16", "ltStalenessCard", stalenessConfig[current.staleness].cardClass)}>
              <div className={cx("flexBetween", "ltAlignStart")}>
                <div>
                  <div className={cx("textXs", "uppercase", "mb4", "ltTrackingWide", stalenessConfig[current.staleness].toneClass)}>
                    Last contact
                  </div>
                  <div className={cx("fontDisplay", "fw800", "ltDetailSince", stalenessConfig[current.staleness].toneClass)}>
                    {timeSince(current.lastTouched)}
                  </div>
                </div>
                <div className={cx("textRight")}>
                  <div className={cx("textXs", "colorMuted2", "uppercase", "mb4", "ltStatLabel")}>Via</div>
                  <div className={cx("text14", typeConfig[current.lastTouchedType].colorClass)}>
                    {typeConfig[current.lastTouchedType].icon} {current.lastTouchedType}
                  </div>
                </div>
              </div>
              <div className={cx("text12", "colorMuted", "mt12", "ltCopyBlock")}>{current.lastTouchedNote}</div>
            </div>

            <div className={cx("p16", "ltNextActionCard", current.nextActionDue.getTime() < now.getTime() ? "ltNextActionOverdue" : "ltNextActionOnTrack")}>
              <div className={cx("textXs", "uppercase", "mb6", "ltTrackingWide", current.nextActionDue.getTime() < now.getTime() ? "ltTextDanger" : "colorMuted2")}>
                Next action · {timeUntil(current.nextActionDue)}
              </div>
              <div className={cx("text12", current.nextActionDue.getTime() < now.getTime() ? "ltTextDanger" : "colorMuted", "ltCopyBlock")}>{current.nextAction}</div>
            </div>

            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb14", "ltTrackingWide")}>Touch History</div>
              <div className={cx("flexCol")}>
                {current.touchHistory.map((touch, index) => {
                  const tCfg = typeConfig[touch.type];
                  const isLast = index === current.touchHistory.length - 1;
                  return (
                    <div key={`${touch.label}-${index}`} className={cx("flexRow", "gap12")}>
                      <div className={cx("flexCol", "noShrink", "ltTimelineCol")}>
                        <div className={cx("flexCenter", "noShrink", "ltTimelineIcon", tCfg.timelineClass)}>{tCfg.icon}</div>
                        {!isLast ? <div className={cx("ltTimelineRail")} /> : null}
                      </div>
                      <div className={cx("flex1", isLast ? "ltTimelineItemLast" : "ltTimelineItem")}> 
                        <div className={cx("text12", "colorMuted", "ltTimelineLabel")}>{touch.label}</div>
                        <div className={cx("text10", "colorMuted2", "ltTimelineTime")}>{timeSince(touch.date)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cx("flexCol", "gap8")}>
              <div className={cx("text10", "colorMuted2", "uppercase", "ltTrackingWide", "ltQuickActionLabel")}>Quick Actions</div>
              {[
                { label: "Log a touchpoint", className: "ltActionPrimary" },
                { label: "Send client update", className: "ltActionNeutral" },
                {
                  label: current.staleness === "stale" ? "Escalate to admin" : "Schedule check-in",
                  className: current.staleness === "stale" ? "ltActionDanger" : "ltActionNeutral"
                }
              ].map((action) => (
                <button key={action.label} type="button" className={cx("ltActionBtn", "uppercase", action.className)}>
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
