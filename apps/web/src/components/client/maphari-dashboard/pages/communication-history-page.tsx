"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalCommLogsWithRefresh,
  type PortalCommLog
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";
import { usePageToast } from "../hooks/use-page-toast";

type CommType = "email" | "meeting" | "message" | "document" | "call" | "other";
type Direction = "Inbound" | "Outbound" | "Internal";
type CommFilter = "all" | CommType;

interface UiComm {
  id: string;
  type: CommType;
  subject: string;
  summary: string;
  dateLabel: string;
  fromLabel: string;
  direction: Direction;
  actionLabel: string | null;
  hasFile: boolean;
}

function toCommType(raw: string): CommType {
  const value = raw.toLowerCase();
  if (value === "email") return "email";
  if (value === "meeting") return "meeting";
  if (value === "message") return "message";
  if (value === "document") return "document";
  if (value === "call" || value === "phone") return "call";
  return "other";
}

function toDirection(raw: string): Direction {
  const value = raw.toUpperCase();
  if (value === "INBOUND") return "Inbound";
  if (value === "OUTBOUND") return "Outbound";
  return "Internal";
}

function formatDate(raw: string): string {
  return new Date(raw).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function mapLog(log: PortalCommLog): UiComm {
  const type = toCommType(log.type);
  return {
    id: log.id,
    type,
    subject: log.subject,
    summary: log.body?.trim() || log.actionLabel?.trim() || "No additional communication detail recorded.",
    dateLabel: formatDate(log.occurredAt),
    fromLabel: log.fromName?.trim() || "Maphari Team",
    direction: toDirection(log.direction),
    actionLabel: log.actionLabel,
    hasFile: Boolean(log.relatedFileId),
  };
}

const typeBadge: Record<CommType, string> = {
  email: "badgeAccent",
  meeting: "badgeAmber",
  call: "badgeGreen",
  document: "badgeMuted",
  message: "badgePurple",
  other: "badgeMuted",
};

const typeIcon: Record<CommType, string> = {
  email: "mail",
  meeting: "calendar",
  message: "message",
  document: "file",
  call: "video",
  other: "activity",
};

const directionBadge: Record<Direction, string> = {
  Inbound: "badgeAmber",
  Outbound: "badgeAccent",
  Internal: "badgeMuted",
};

const filters: Array<CommFilter> = ["all", "email", "meeting", "message", "document", "call"];

function buildCommCsv(items: UiComm[]): string {
  const rows = [
    ["Communication ID", "Type", "Subject", "Direction", "Date", "From", "Summary", "Action Label", "Has File"],
    ...items.map((item) => [
      item.id,
      item.type,
      item.subject,
      item.direction,
      item.dateLabel,
      item.fromLabel,
      item.summary,
      item.actionLabel ?? "—",
      item.hasFile ? "Yes" : "No",
    ]),
  ];

  return rows
    .map((row) => row.map((value) => '"' + String(value ?? "").replace(/"/g, '""') + '"').join(","))
    .join("\n");
}

export function CommunicationHistoryPage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commHistory, setCommHistory] = useState<UiComm[]>([]);
  const [filter, setFilter] = useState<CommFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function fetchCommHistory(showRefreshToast = false) {
    if (!session) {
      setCommHistory([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (loading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const result = await loadPortalCommLogsWithRefresh(session, session.user.clientId ?? "");
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message ?? "Unable to load communication history.");
        return;
      }
      setCommHistory((result.data ?? []).map(mapLog));
      if (showRefreshToast) {
        notify("success", "Communication history refreshed", "Latest communication logs loaded.");
      }
    } catch (err) {
      setError((err as Error)?.message ?? "Unable to load communication history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void fetchCommHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? commHistory : commHistory.filter((item) => item.type === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((item) =>
        item.subject.toLowerCase().includes(q) ||
        item.fromLabel.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [commHistory, filter, search]);

  const messageCount = commHistory.filter((item) => item.type === "message" || item.type === "email").length;
  const meetingsCount = commHistory.filter((item) => item.type === "meeting" || item.type === "call").length;
  const docsCount = commHistory.filter((item) => item.type === "document").length;
  const outboundCount = commHistory.filter((item) => item.direction === "Outbound").length;

  function handleExport() {
    if (filtered.length === 0) {
      notify("info", "Nothing to export", "There are no communication logs in the current view.");
      return;
    }
    const csv = buildCommCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "communication-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

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

  if (!session) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="message" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Sign in to view communication history</div>
          <div className={cx("emptyStateSub")}>Client communications appear once your account session is active.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Unable to load communication history</div>
          <div className={cx("errorStateSub")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnGhost", "mt12")} onClick={() => void fetchCommHistory()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>COMMUNICATION</div>
          <h1 className={cx("pageTitle")}>Communication History</h1>
          <div className={cx("pageSub")}>A real ledger of emails, calls, meetings, documents, and client message history.</div>
        </div>
        <div className={cx("pageActions", "flexRow", "gap8")}>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")} onClick={() => void fetchCommHistory(true)} disabled={refreshing}>
            <Ic n="refresh" sz={13} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")} onClick={handleExport}>
            <Ic n="download" sz={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Messages & Emails", value: messageCount, sub: "Logged communications", color: "statCardBlue", icon: "mail", ic: "var(--cyan)" },
          { label: "Meetings & Calls", value: meetingsCount, sub: "Recorded sessions", color: "statCardAmber", icon: "calendar", ic: "var(--amber)" },
          { label: "Documents Shared", value: docsCount, sub: "Document events", color: "statCard", icon: "file", ic: "var(--muted2)" },
          { label: "Outbound Updates", value: outboundCount, sub: "Team-to-client updates", color: "statCardGreen", icon: "send", ic: "var(--lime)" },
        ].map((item) => (
          <div key={item.label} className={cx("statCard", item.color)}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("statLabel")}>{item.label}</div>
              <Ic n={item.icon as "mail"} sz={14} c={item.ic} />
            </div>
            <div className={cx("statValue")}>{item.value}</div>
            <div className={cx("text11", "colorMuted")}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div className={cx("flexRow", "flexCenter", "gap10", "mb10")}>
        <div className={cx("flexRow", "gap6", "flex1", "minW0", "overflowXAuto")} style={{ flexWrap: "nowrap" } as React.CSSProperties}>
          {filters.map((item) => (
            <button key={item} type="button" className={cx("pillTab", filter === item ? "pillTabActive" : "")} onClick={() => setFilter(item)}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          className={cx("input", "w260", "h36", "noShrink")}
          placeholder="Search subject, sender, or detail"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className={cx("card", "overflowHidden")}>
        {filtered.length > 0 && (
          <div className={cx("cohHead")}>
            {["Type", "Subject", "Date", "Direction", "From", ""].map((heading) => (
              <span key={heading}>{heading}</span>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="message" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No communication logs</div>
            <div className={cx("emptyStateSub")}>
              {search ? 'No results for "' + search + '"' : "Emails, calls, meetings and document shares will appear here as they are recorded."}
            </div>
          </div>
        ) : (
          filtered.map((item) => {
            const isOpen = expanded === item.id;
            return (
              <div key={item.id} className={cx("borderB")}>
                <button type="button" className={cx("cohRow")} onClick={() => setExpanded(isOpen ? null : item.id)}>
                  <div className={cx("flexRow", "gap8", "alignCenter")}>
                    <span className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, var(--cyan) 10%, var(--s2))" } as React.CSSProperties}>
                      <Ic n={typeIcon[item.type] as "mail"} sz={14} c="var(--cyan)" />
                    </span>
                    <span className={cx("badge", typeBadge[item.type])}>{item.type}</span>
                  </div>
                  <span className={cx("fw600", "text13")}>{item.subject}</span>
                  <span className={cx("fontMono", "text12")}>{item.dateLabel}</span>
                  <span className={cx("badge", directionBadge[item.direction])}>{item.direction}</span>
                  <span className={cx("text12", "colorMuted")}>{item.fromLabel}</span>
                  <span className={cx("chevronIcon", "dynTransform", "flexRow", "justifyCenter")} style={{ "--transform": isOpen ? "rotate(90deg)" : "none" } as React.CSSProperties}>
                    <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                  </span>
                </button>
                {isOpen && (
                  <div className={cx("p14x20x16x17", "borderT", "cardS1")}>
                    <div className={cx("grid2Cols252")}>
                      <div className={cx("panelL")}>
                        <div className={cx("cardS1v2", "p12x14")}>
                          <div className={cx("flexRow", "flexCenter", "gap6", "mb8")}>
                            <Ic n="message" sz={12} c="var(--cyan)" />
                            <span className={cx("fontMono", "fw700", "text10", "uppercase", "ls01", "colorAccent")}>Log Detail</span>
                          </div>
                          <div className={cx("text11", "colorMuted", "lineH165")}>{item.summary}</div>
                        </div>
                      </div>
                      <div className={cx("sectionPanelL")}>
                        <div className={cx("cardS1v2", "p12x14")}>
                          <div className={cx("grid2Cols", "gap8")}>
                            {[
                              { label: "Type", value: item.type },
                              { label: "Direction", value: item.direction },
                              { label: "Sender", value: item.fromLabel },
                              { label: "Shared File", value: item.hasFile ? "Yes" : "No" },
                            ].map((meta) => (
                              <div key={meta.label} className={cx("infoChipSm")}>
                                <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls008", "mb2", "fs058")}>{meta.label}</div>
                                <div className={cx("fw600", "text11")}>{meta.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
