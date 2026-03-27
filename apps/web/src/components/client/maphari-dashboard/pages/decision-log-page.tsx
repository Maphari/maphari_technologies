"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalDecisionsWithRefresh,
  type PortalDecision,
} from "../../../../lib/api/portal";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";

type DecisionTab = "All" | "Named" | "Undated";

type DecisionRecord = {
  id: string;
  title: string;
  summary: string;
  decidedByName: string | null;
  decidedByRole: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  dateLabel: string;
  updatedLabel: string;
  ownerLabel: string;
};

function formatDateLabel(value: string | null): string {
  if (!value) return "Pending date";
  return new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function toDecisionRecord(decision: PortalDecision): DecisionRecord {
  const decidedByName = decision.decidedByName?.trim() || null;
  const decidedByRole = decision.decidedByRole?.trim() || null;
  const ownerLabel = decidedByName
    ? decidedByRole
      ? decidedByName + " · " + decidedByRole
      : decidedByName
    : decidedByRole
      ? decidedByRole
      : "Not recorded";

  return {
    id: decision.id,
    title: decision.title,
    summary: decision.context?.trim() || "No decision context has been recorded yet.",
    decidedByName,
    decidedByRole,
    decidedAt: decision.decidedAt,
    createdAt: decision.createdAt,
    updatedAt: decision.updatedAt,
    dateLabel: formatDateLabel(decision.decidedAt ?? decision.createdAt),
    updatedLabel: formatDateLabel(decision.updatedAt),
    ownerLabel,
  };
}

function buildDecisionLogCsv(records: DecisionRecord[]): string {
  const rows = [
    ["Decision ID", "Title", "Decision Date", "Recorded By", "Role", "Context", "Created", "Updated"],
    ...records.map((record) => [
      record.id,
      record.title,
      record.decidedAt ? formatDateLabel(record.decidedAt) : "Pending date",
      record.decidedByName ?? "Not recorded",
      record.decidedByRole ?? "Not recorded",
      record.summary,
      formatDateLabel(record.createdAt),
      formatDateLabel(record.updatedAt),
    ]),
  ];

  return rows
    .map((row) => row.map((value) => '"' + String(value ?? "").replace(/"/g, '""') + '"').join(","))
    .join("\n");
}

export function DecisionLogPage() {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();

  const [records, setRecords] = useState<DecisionRecord[]>([]);
  const [tab, setTab] = useState<DecisionTab>("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchDecisions(showRefreshToast = false) {
    if (!session || !projectId) {
      setRecords([]);
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
      const result = await loadPortalDecisionsWithRefresh(session, projectId);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message ?? "Unable to load decisions.");
        return;
      }
      const nextRecords = (result.data ?? []).map(toDecisionRecord);
      setRecords(nextRecords);
      if (showRefreshToast) {
        notify("success", "Decision log refreshed", "Latest project decisions loaded.");
      }
    } catch (err) {
      setError((err as Error)?.message ?? "Unable to load decisions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void fetchDecisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, projectId]);

  const filtered = useMemo(() => {
    let list = records;
    if (tab === "Named") list = list.filter((record) => Boolean(record.decidedByName || record.decidedByRole));
    if (tab === "Undated") list = list.filter((record) => !record.decidedAt);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((record) =>
        record.title.toLowerCase().includes(q) ||
        record.id.toLowerCase().includes(q) ||
        record.summary.toLowerCase().includes(q) ||
        record.ownerLabel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, records, tab]);

  const namedOwners = records.filter((record) => Boolean(record.decidedByName || record.decidedByRole)).length;
  const pendingDates = records.filter((record) => !record.decidedAt).length;
  const recentMonth = records.filter((record) => {
    const created = new Date(record.createdAt).getTime();
    return Date.now() - created <= 1000 * 60 * 60 * 24 * 30;
  }).length;
  const recentRecords = records.slice(0, 5);

  function handleExportCsv() {
    if (filtered.length === 0) {
      notify("info", "Nothing to export", "There are no decisions in the current view.");
      return;
    }
    const csv = buildDecisionLogCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "decision-log.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("success", "Downloading", "Decision log CSV is downloading.");
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

  if (!session || !projectId) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="file" sz={18} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Select a project to review decisions</div>
          <div className={cx("emptyStateText")}>Decision records appear once a specific client project is active.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Unable to load decision log</div>
          <div className={cx("errorStateSub")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnGhost", "mt12")} onClick={() => void fetchDecisions()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Decisions</div>
          <h1 className={cx("pageTitle")}>Decision Log</h1>
          <p className={cx("pageSub")}>A client-facing record of the project decisions that have actually been documented by the delivery team.</p>
        </div>
        <div className={cx("pageActions", "flexRow", "gap8")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost", "flexRow", "gap6")}
            onClick={() => void fetchDecisions(true)}
            disabled={refreshing}
          >
            <Ic n="refresh" sz={13} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")} onClick={handleExportCsv}>
            <Ic n="download" sz={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Decisions", value: records.length, color: "statCard", icon: "file", ic: "var(--muted2)" },
          { label: "Named Owners", value: namedOwners, color: "statCardGreen", icon: "users", ic: "var(--lime)" },
          { label: "Pending Date", value: pendingDates, color: "statCardAmber", icon: "clock", ic: "var(--amber)" },
          { label: "Logged This Month", value: recentMonth, color: "statCardBlue", icon: "activity", ic: "var(--cyan)" },
        ].map((stat) => (
          <div key={stat.label} className={cx("statCard", stat.color)}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("statLabel")}>{stat.label}</div>
              <Ic n={stat.icon} sz={14} c={stat.ic} />
            </div>
            <div className={cx("statValue")}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("grid2", "mb16")}>
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Decision Coverage</span>
            <span className={cx("fontMono", "text10", "colorMuted2")}>{records.length} entries</span>
          </div>
          <div className={cx("flexCol", "gap10")}>
            {[
              { label: "Named decision owner", count: namedOwners, color: "var(--lime)" },
              { label: "Decision date recorded", count: records.length - pendingDates, color: "var(--cyan)" },
              { label: "Date still pending", count: pendingDates, color: "var(--amber)" },
            ].map((item) => {
              const pct = records.length > 0 ? Math.round((item.count / records.length) * 100) : 0;
              return (
                <div key={item.label} className={cx("flexRow", "gap10")}>
                  <div className={cx("wh10", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": item.color } as React.CSSProperties} />
                  <span className={cx("text11", "w140")}>{item.label}</span>
                  <div className={cx("progressTrack", "flex1")}>
                    <div className={cx("pctFillR99", "dynBgColor")} style={{ "--pct": pct, "--bg-color": item.color } as React.CSSProperties} />
                  </div>
                  <span className={cx("fontMono", "fw700", "text11", "dynColor", "w24", "textRight")} style={{ "--color": item.color } as React.CSSProperties}>
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Recent Entries</span>
            <span className={cx("text11", "colorMuted")}>Most recently recorded decisions</span>
          </div>
          {recentRecords.length === 0 ? (
            <div className={cx("flexCol", "flexCenter", "gap6", "py16")}>
              <Ic n="file" sz={16} c="var(--muted2)" />
              <span className={cx("text11", "colorMuted2")}>No decisions recorded yet</span>
            </div>
          ) : (
            <div className={cx("flexCol", "gap8")}>
              {recentRecords.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className={cx("infoChipSm", "textLeft")}
                  onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                >
                  <div className={cx("fw600", "text11", "mb4", "truncate")}>{record.title}</div>
                  <div className={cx("flexRow", "gap6", "flexWrap")}>
                    <span className={cx("fontMono", "text10", "colorAccent")}>{record.id}</span>
                    <span className={cx("fontMono", "text10", "colorMuted2")}>{record.dateLabel}</span>
                    <span className={cx("fontMono", "text10", "colorMuted2")}>{record.ownerLabel}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={cx("flexRow", "flexCenter", "gap10", "mb10")}>
        <div className={cx("flexRow", "gap6", "flex1", "minW0", "overflowXAuto")}>
          {(["All", "Named", "Undated"] as const).map((item) => (
            <button key={item} type="button" className={cx("pillTab", tab === item ? "pillTabActive" : "")} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </div>
        <input
          type="text"
          className={cx("input", "w260", "h36", "noShrink")}
          placeholder="Search title, ID, owner, or context"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className={cx("card", "overflowHidden")}>
        {filtered.length > 0 && (
          <div className={cx("dlColHd")}>
            {["", "Decision", "Owner", "Decision Date", "Updated", ""].map((heading, index) => (
              <span key={index} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{heading}</span>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className={cx("emptyPad48x24", "textCenter")}>
            <Ic n="filter" sz={28} c="var(--muted2)" />
            <div className={cx("fw800", "text13", "mt12", "mb4")}>No decisions found</div>
            <div className={cx("text12", "colorMuted")}>
              {query ? 'No results for "' + query + '"' : "No decisions match this view."}
            </div>
            {query && (
              <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => setQuery("")}>
                Clear search
              </button>
            )}
          </div>
        )}

        {filtered.map((record, index) => {
          const isOpen = expanded === record.id;
          return (
            <div
              key={record.id}
              className={cx("dynBorderLeft3", index < filtered.length - 1 && "borderB")}
              style={{ "--color": record.decidedAt ? "var(--cyan)" : "var(--amber)" } as React.CSSProperties}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                className={cx("gridRowBtn6colV3")}
                onClick={() => setExpanded(isOpen ? null : record.id)}
              >
                <div className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": record.decidedAt ? "color-mix(in oklab, var(--cyan) 12%, var(--s2))" : "color-mix(in oklab, var(--amber) 12%, var(--s2))" } as React.CSSProperties}>
                  <Ic n="file" sz={15} c={record.decidedAt ? "var(--cyan)" : "var(--amber)"} />
                </div>

                <div className={cx("minW0")}>
                  <div className={cx("fw600", "text12", "truncate")}>{record.title}</div>
                  <div className={cx("flexRow", "flexCenter", "gap6", "mt2", "flexWrap")}>
                    <span className={cx("fontMono", "text10", "colorAccent")}>{record.id}</span>
                    {!record.decidedAt && <span className={cx("badge", "badgeAmber", "fs06")}>Pending date</span>}
                  </div>
                </div>

                <span className={cx("text11", "colorMuted2", "truncate")}>{record.ownerLabel}</span>
                <span className={cx("fontMono", "text10", "colorMuted2")}>{record.dateLabel}</span>
                <span className={cx("fontMono", "text10", "colorMuted2")}>{record.updatedLabel}</span>

                <span className={cx("chevronIcon", "dynTransform", "flexRow", "justifyCenter")} style={{ "--transform": isOpen ? "rotate(90deg)" : "none" } as React.CSSProperties}>
                  <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                </span>
              </button>

              {isOpen && (
                <div className={cx("borderT", "dynBgColor", "p14x20x16x17")} style={{ "--bg-color": "color-mix(in oklab, var(--s2) 100%, transparent)" } as React.CSSProperties}>
                  <div className={cx("grid2Cols252")}>
                    <div className={cx("panelL")}>
                      <div className={cx("cardS1", "p12x14", "mb12")}>
                        <div className={cx("flexRow", "flexCenter", "gap6", "mb8")}>
                          <div className={cx("dlSectionIconBox", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, var(--cyan) 12%, var(--s2))" } as React.CSSProperties}>
                            <Ic n="file" sz={10} c="var(--cyan)" />
                          </div>
                          <span className={cx("fontMono", "fw700", "text10", "uppercase", "ls01", "colorAccent")}>Decision Context</span>
                        </div>
                        <div className={cx("text11", "colorMuted", "lineH165")}>{record.summary}</div>
                      </div>
                    </div>

                    <div className={cx("sectionPanelL")}>
                      <div className={cx("grid2Cols", "gap8")}>
                        {[
                          { label: "Decision Date", value: record.decidedAt ? formatDateLabel(record.decidedAt) : "Pending date" },
                          { label: "Recorded By", value: record.decidedByName ?? "Not recorded" },
                          { label: "Role", value: record.decidedByRole ?? "Not recorded" },
                          { label: "Updated", value: record.updatedLabel },
                        ].map((item) => (
                          <div key={item.label} className={cx("infoChipSm")}>
                            <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls008", "mb2", "fs058")}>{item.label}</div>
                            <div className={cx("fw600", "text11")}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
