// ════════════════════════════════════════════════════════════════════════════
// last-touched-page.tsx — Staff Last Touched
// Data : getStaffClients + getStaffAllComms + getStaffRetainerBurn
//        → derives staleness from communication log timestamps
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffClients,
  getStaffAllComms,
  getStaffRetainerBurn,
  type StaffClient,
  type StaffCommLog,
  type StaffRetainerBurnEntry,
} from "../../../../lib/api/staff/clients";
import {
  getMyTasks,
  type StaffTask,
} from "../../../../lib/api/staff/tasks";

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

// ── Derivation helpers ────────────────────────────────────────────────────

function commTypeToTouchType(type: string): TouchType {
  const lower = type.toLowerCase();
  if (lower.includes("call") || lower.includes("phone") || lower.includes("video")) return "call";
  if (lower.includes("invoice") || lower.includes("payment")) return "invoice";
  if (lower.includes("milestone") || lower.includes("signoff")) return "milestone";
  if (lower.includes("file") || lower.includes("upload") || lower.includes("document")) return "file";
  return "message";
}

function computeStaleness(lastTouched: Date, now: Date): Staleness {
  const diffMs = now.getTime() - lastTouched.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 2) return "fresh";
  if (diffDays <= 5) return "aging";
  return "stale";
}

function deriveClients(
  apiClients: StaffClient[],
  comms: StaffCommLog[],
  retainerEntries: StaffRetainerBurnEntry[],
  tasks: StaffTask[],
  now: Date
): LastTouchedClient[] {
  const retainerMap = new Map(retainerEntries.map((e) => [e.clientId, e.retainerBurnPct]));

  return apiClients.map((client, idx) => {
    // Comms for this client, sorted newest first
    const clientComms = comms
      .filter((c) => c.clientId === client.id)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    const latestComm = clientComms[0] ?? null;
    const lastTouchedDate = latestComm ? new Date(latestComm.occurredAt) : new Date(client.updatedAt);
    const lastTouchedType = latestComm ? commTypeToTouchType(latestComm.type) : "message";
    const lastTouchedNote = latestComm?.subject ?? "No recent communication";

    // Open tasks for this client (tasks are project-scoped, but we match by checking all)
    const clientTasks = tasks.filter(
      (t) => t.status !== "DONE"
    );
    // Since tasks don't have clientId, use openItems as total open tasks (best effort)
    // A more precise mapping would require project→client mapping

    // Touch history from comms (up to 5)
    const touchHistory: TouchHistoryItem[] = clientComms.slice(0, 5).map((c) => ({
      type: commTypeToTouchType(c.type),
      label: c.subject,
      date: new Date(c.occurredAt),
    }));

    // Next action: first upcoming task due date, or fallback
    const nextTask = tasks
      .filter((t) => t.status !== "DONE" && t.dueAt)
      .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())[0];
    const nextAction = nextTask?.title ?? "Schedule follow-up";
    const nextActionDue = nextTask?.dueAt ? new Date(nextTask.dueAt) : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const retainerBurn = retainerMap.get(client.id) ?? 0;
    const staleness = computeStaleness(lastTouchedDate, now);

    return {
      id: idx + 1,
      name: client.name,
      avatar: client.name.charAt(0).toUpperCase(),
      project: client.industry ?? "General",
      contact: client.contactEmail ?? "—",
      sentiment: staleness === "stale" ? "at_risk" : staleness === "aging" ? "neutral" : "positive",
      lastTouched: lastTouchedDate,
      lastTouchedType,
      lastTouchedNote,
      nextAction,
      nextActionDue,
      touchHistory,
      staleness,
      retainerBurn: Math.round(retainerBurn),
      openItems: clientComms.length > 0 ? Math.min(clientComms.length, 5) : 0,
    };
  });
}

// ── Time display helpers ─────────────────────────────────────────────────

function timeSince(date: Date, now: Date) {
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  if (diffHours < 1) return "< 1 hour ago";
  if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
  if (diffDays < 2) return "Yesterday";
  return `${Math.floor(diffDays)} days ago`;
}

function timeUntil(date: Date, now: Date) {
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  if (diffMs < 0) return "Overdue";
  if (diffHours < 1) return "< 1 hour";
  if (diffHours < 24) return `in ${Math.round(diffHours)}h`;
  const wholeDays = Math.floor(diffDays);
  return `in ${wholeDays} day${wholeDays > 1 ? "s" : ""}`;
}

// ── Component ────────────────────────────────────────────────────────────

export function LastTouchedPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [clients, setClients] = useState<LastTouchedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [sort, setSort] = useState<"staleness" | "name" | "items">("staleness");
  const [filter, setFilter] = useState<"all" | Staleness>("all");

  const now = useMemo(() => new Date(), []);

  // ── Fetch data from API ───
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;

    void (async () => {
      const [clientsResult, commsResult, retainerResult, tasksResult] = await Promise.all([
        getStaffClients(session),
        getStaffAllComms(session),
        getStaffRetainerBurn(session),
        getMyTasks(session),
      ]);

      if (cancelled) return;

      if (clientsResult.nextSession) saveSession(clientsResult.nextSession);
      if (commsResult.nextSession) saveSession(commsResult.nextSession);
      if (retainerResult.nextSession) saveSession(retainerResult.nextSession);
      if (tasksResult.nextSession) saveSession(tasksResult.nextSession);

      const apiClients = clientsResult.data ?? [];
      const apiComms = commsResult.data ?? [];
      const apiRetainer = retainerResult.data ?? [];
      const apiTasks = tasksResult.data ?? [];

      setClients(deriveClients(apiClients, apiComms, apiRetainer, apiTasks, now));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const sorted = useMemo(() => {
    return [...clients]
      .filter((client) => (filter === "all" ? true : client.staleness === filter))
      .sort((a, b) => {
        if (sort === "staleness") return a.lastTouched.getTime() - b.lastTouched.getTime();
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "items") return b.openItems - a.openItems;
        return 0;
      });
  }, [clients, filter, sort]);

  const current = selected ? clients.find((client) => client.id === selected) ?? null : null;
  const staleCount = clients.filter((client) => client.staleness === "stale").length;
  const agingCount = clients.filter((client) => client.staleness === "aging").length;
  const freshCount = clients.filter((client) => client.staleness === "fresh").length;

  const dateStr = now.toLocaleDateString("en-ZA", { weekday: "long", month: "short", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-ZA", { hour: "numeric", minute: "2-digit" });

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-last-touched">
      <div className={cx("pageHeaderBar", "borderB", "ltHeader")}>
        <div className={cx("flexBetween", "mb20", "ltHeaderTop")}>
          <div>
            <div className={cx("pageEyebrow", "mb8")}>Staff Dashboard / Client Intelligence</div>
            <h1 className={cx("pageTitle")}>Last Touched</h1>
            <div className={cx("text12", "colorMuted2", "mt6")}>{dateStr} - {timeStr}</div>
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
          {/* Staleness filter pills */}
          <div className={cx("ltFilterPills")}>
            {(
              [
                { value: "all",    label: "All",    activeClass: "ltFilterBtnActiveAll",   count: clients.length },
                { value: "stale",  label: "Stale",  activeClass: "ltFilterBtnActiveStale", count: staleCount },
                { value: "aging",  label: "Aging",  activeClass: "ltFilterBtnActiveAging", count: agingCount },
                { value: "fresh",  label: "Fresh",  activeClass: "ltFilterBtnActiveFresh", count: freshCount },
              ] as const
            ).map((tab) => {
              const active = filter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  className={cx("ltFilterBtn", active && tab.activeClass)}
                  onClick={() => setFilter(tab.value)}
                >
                  {tab.label}
                  <span className={cx("ltFilterPillCount")}>{tab.count}</span>
                </button>
              );
            })}
          </div>

          <div className={cx("ltToolbarDivider")} />

          {/* Sort pills */}
          <div className={cx("ltSortPills")}>
            {(
              [
                { value: "staleness", label: "Stalest first" },
                { value: "items",     label: "Open items"   },
                { value: "name",      label: "Name"         },
              ] as const
            ).map((s) => (
              <button
                key={s.value}
                type="button"
                className={cx("ltSortBtn", sort === s.value && "ltSortBtnActive")}
                onClick={() => setSort(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {clients.length === 0 ? (
        <div className={cx("textCenter", "colorMuted2", "p40")}>
          <div className={cx("mb10")}>◎</div>
          <div className={cx("text13")}>No clients found. Data will appear once clients and communication logs are available.</div>
        </div>
      ) : null}

      {clients.length > 0 ? (
        <div className={cx(current ? "ltLayoutWithPanel" : "ltLayout")}>
          <div className={cx("ltListPane", current && "ltListPaneWithPanel")}>
            <div className={cx("flexCol", "gap10")}>
              {sorted.map((client) => {
                const sCfg = stalenessConfig[client.staleness];
                const tCfg = typeConfig[client.lastTouchedType];
                const isSelected = selected === client.id;
                const sinceStr = timeSince(client.lastTouched, now);
                const nextDueStr = timeUntil(client.nextActionDue, now);
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
                      {timeSince(current.lastTouched, now)}
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
                  Next action · {timeUntil(current.nextActionDue, now)}
                </div>
                <div className={cx("text12", current.nextActionDue.getTime() < now.getTime() ? "ltTextDanger" : "colorMuted", "ltCopyBlock")}>{current.nextAction}</div>
              </div>

              <div>
                <div className={cx("text10", "colorMuted2", "uppercase", "mb14", "ltTrackingWide")}>Touch History</div>
                <div className={cx("flexCol")}>
                  {current.touchHistory.length === 0 ? (
                    <div className={cx("text11", "colorMuted2")}>No communication history yet.</div>
                  ) : null}
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
                          <div className={cx("text10", "colorMuted2", "ltTimelineTime")}>{timeSince(touch.date, now)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
