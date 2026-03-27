"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { loadPortalRisksWithRefresh, type PortalRisk } from "../../../../lib/api/portal/project-layer";
import { saveSession } from "../../../../lib/auth/session";

type RSeverity = "High" | "Medium" | "Low";
type RProbability = "High" | "Medium" | "Low";
type RStatus = "Open" | "Mitigated" | "Monitoring";
type RView = "matrix" | "list";

type Risk = {
  id: string;
  title: string;
  severity: RSeverity;
  probability: RProbability;
  status: RStatus;
  detail: string;
  mitigation: string;
  createdLabel: string;
  updatedLabel: string;
  createdAt: string;
  updatedAt: string;
};

const SCORE_MAP: Record<RSeverity | RProbability, number> = { High: 3, Medium: 2, Low: 1 };
const PROB_LABELS: RProbability[] = ["Low", "Medium", "High"];
const SEV_LABELS: RSeverity[] = ["High", "Medium", "Low"];

const SEV_COLOR: Record<RSeverity, string> = {
  High: "var(--red)",
  Medium: "var(--amber)",
  Low: "var(--muted2)",
};

const SEV_BADGE: Record<RSeverity, string> = {
  High: "badgeRed",
  Medium: "badgeAmber",
  Low: "badgeMuted",
};

const STATUS_BADGE: Record<RStatus, string> = {
  Open: "badgeAmber",
  Mitigated: "badgeAccent",
  Monitoring: "badgePurple",
};

const STATUS_ICON: Record<RStatus, string> = {
  Open: "alert",
  Mitigated: "check",
  Monitoring: "eye",
};

function riskScore(risk: Risk): number {
  return SCORE_MAP[risk.severity] * SCORE_MAP[risk.probability];
}

function getZone(score: number) {
  if (score >= 7) {
    return {
      label: "CRITICAL",
      color: "var(--red)",
      bg: "color-mix(in oklab, var(--red) 14%, transparent)",
      border: "color-mix(in oklab, var(--red) 35%, transparent)",
    };
  }
  if (score >= 4) {
    return {
      label: "HIGH",
      color: "var(--red)",
      bg: "color-mix(in oklab, var(--red) 7%, transparent)",
      border: "color-mix(in oklab, var(--red) 20%, transparent)",
    };
  }
  if (score >= 2) {
    return {
      label: "MEDIUM",
      color: "var(--amber)",
      bg: "color-mix(in oklab, var(--amber) 7%, transparent)",
      border: "color-mix(in oklab, var(--amber) 20%, transparent)",
    };
  }
  return {
    label: "LOW",
    color: "var(--muted2)",
    bg: "var(--s2)",
    border: "var(--b2)",
  };
}

function riskExplainText(zone: string): string {
  if (zone === "CRITICAL") return "This risk can materially affect delivery timing or budget and is being actively escalated.";
  if (zone === "HIGH") return "This risk could impact scope, quality, or delivery pace if it worsens.";
  if (zone === "MEDIUM") return "This risk is being watched and managed before it grows into a delivery issue.";
  return "This is a low-level risk with limited expected client impact right now.";
}

function toLevel(level: string): RSeverity | RProbability {
  if (level === "HIGH") return "High";
  if (level === "MEDIUM") return "Medium";
  return "Low";
}

function toStatus(status: string): RStatus {
  if (status === "MITIGATED") return "Mitigated";
  if (status === "MONITORING") return "Monitoring";
  return "Open";
}

function formatDateLabel(value: string): string {
  return new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function mapApiRisk(risk: PortalRisk): Risk {
  return {
    id: risk.id,
    title: risk.name,
    severity: toLevel(risk.impact),
    probability: toLevel(risk.likelihood),
    status: toStatus(risk.status),
    detail: risk.detail?.trim() || risk.name,
    mitigation: risk.mitigation?.trim() || "No mitigation has been recorded yet.",
    createdLabel: formatDateLabel(risk.createdAt),
    updatedLabel: formatDateLabel(risk.updatedAt),
    createdAt: risk.createdAt,
    updatedAt: risk.updatedAt,
  };
}

function buildRiskRegisterCsv(risks: Risk[]): string {
  const rows = [
    ["Risk ID", "Title", "Severity", "Likelihood", "Status", "Created", "Updated", "Impact", "Mitigation"],
    ...risks.map((risk) => [
      risk.id,
      risk.title,
      risk.severity,
      risk.probability,
      risk.status,
      risk.createdLabel,
      risk.updatedLabel,
      risk.detail,
      risk.mitigation,
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((cell) => '"' + String(cell ?? "").replace(/"/g, '""') + '"')
        .join(",")
    )
    .join("\n");
}

export function RiskRegisterPage() {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();

  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<RView>("matrix");
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [listTab, setListTab] = useState<"All" | RSeverity>("All");

  async function fetchRisks(showRefreshToast = false) {
    if (!session || !projectId) {
      setRisks([]);
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
      const result = await loadPortalRisksWithRefresh(session, projectId);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message ?? "Unable to load risks.");
        return;
      }
      const nextRisks = (result.data ?? []).map(mapApiRisk);
      setRisks(nextRisks);
      if (showRefreshToast) {
        notify("success", "Risk register refreshed", "Latest project risk data loaded.");
      }
    } catch (err) {
      setError((err as Error)?.message ?? "Unable to load risks.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void fetchRisks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, projectId]);

  const filtered = useMemo(() => {
    let list = listTab === "All" ? risks : risks.filter((risk) => risk.severity === listTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((risk) =>
        risk.title.toLowerCase().includes(q) ||
        risk.id.toLowerCase().includes(q) ||
        risk.status.toLowerCase().includes(q) ||
        risk.mitigation.toLowerCase().includes(q)
      );
    }
    return list;
  }, [listTab, risks, search]);

  const selectedData = risks.find((risk) => risk.id === selectedRisk) ?? null;
  const watchlist = useMemo(
    () =>
      [...risks]
        .sort((left, right) => {
          const scoreDelta = riskScore(right) - riskScore(left);
          if (scoreDelta !== 0) return scoreDelta;
          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        })
        .slice(0, 5),
    [risks]
  );

  const totalOpen = risks.filter((risk) => risk.status === "Open").length;
  const totalMonitor = risks.filter((risk) => risk.status === "Monitoring").length;
  const totalMitigated = risks.filter((risk) => risk.status === "Mitigated").length;
  const totalCritical = risks.filter((risk) => riskScore(risk) >= 7).length;

  const zoneCounts: Array<[string, number, string]> = [
    ["Critical", risks.filter((risk) => riskScore(risk) >= 7).length, "var(--red)"],
    ["High", risks.filter((risk) => { const score = riskScore(risk); return score >= 4 && score < 7; }).length, "var(--red)"],
    ["Medium", risks.filter((risk) => { const score = riskScore(risk); return score >= 2 && score < 4; }).length, "var(--amber)"],
    ["Low", risks.filter((risk) => riskScore(risk) < 2).length, "var(--muted2)"],
  ];

  function handleExportCsv() {
    const csv = buildRiskRegisterCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "risk-register.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function cellRisks(probability: RProbability, severity: RSeverity) {
    return risks.filter((risk) => risk.probability === probability && risk.severity === severity);
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
          <div className={cx("emptyStateIcon")}><Ic n="alert" sz={18} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Select a project to review risks</div>
          <div className={cx("emptyStateText")}>The register appears once a project context is active in the client dashboard.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Unable to load risk register</div>
          <div className={cx("errorStateSub")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnGhost", "mt12")} onClick={() => void fetchRisks()}>
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
          <div className={cx("pageEyebrow")}>Projects · Risk</div>
          <h1 className={cx("pageTitle")}>Risk Register</h1>
          <p className={cx("pageSub")}>Track live project risks, their impact level, and the mitigations already in motion.</p>
        </div>
        <div className={cx("pageActions", "flexRow", "gap8")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost", "flexRow", "gap6")}
            onClick={() => void fetchRisks(true)}
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
          { label: "Total Risks", value: risks.length, color: "statCard", icon: "alert", ic: "var(--muted2)" },
          { label: "Critical", value: totalCritical, color: "statCardRed", icon: "zap", ic: "var(--red)" },
          { label: "Open", value: totalOpen, color: "statCardAmber", icon: "clock", ic: "var(--amber)" },
          { label: "Mitigated", value: totalMitigated, color: "statCardGreen", icon: "check", ic: "var(--lime)" },
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
            <span className={cx("cardHdTitle")}>Risk Zone Summary</span>
            <span className={cx("fontMono", "text10", "colorMuted2")}>{risks.length} total risks</span>
          </div>
          <div className={cx("flexCol", "gap10")}>
            {zoneCounts.map(([zone, count, color]) => {
              const pct = risks.length > 0 ? Math.round((count / risks.length) * 100) : 0;
              return (
                <div key={zone} className={cx("flexRow", "gap10")}>
                  <div className={cx("wh10", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": color } as React.CSSProperties} />
                  <span className={cx("text11", "w62")}>{zone}</span>
                  <div className={cx("progressTrack", "flex1")}>
                    <div className={cx("pctFillR99", "dynBgColor")} style={{ "--pct": pct, "--bg-color": color } as React.CSSProperties} />
                  </div>
                  <span className={cx("fontMono", "fw700", "text11", "dynColor", "w24", "textRight")} style={{ "--color": color } as React.CSSProperties}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          <div className={cx("borderT", "mt14", "pt12", "flexRow", "gap8", "flexWrap")}>
            {[
              { label: "Open", val: totalOpen, color: "var(--amber)" },
              { label: "Monitoring", val: totalMonitor, color: "var(--purple)" },
              { label: "Mitigated", val: totalMitigated, color: "var(--lime)" },
            ].map((stat) => (
              <span key={stat.label} className={cx("flexRow", "gap5")}>
                <span className={cx("dot7", "inlineBlock")} style={{ "--bg-color": stat.color } as React.CSSProperties} />
                <span className={cx("fontMono", "text10", "colorMuted2")}>{stat.val} {stat.label}</span>
              </span>
            ))}
          </div>
        </div>

        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Current Watchlist</span>
            <span className={cx("text11", "colorMuted")}>Highest-score risks updated most recently</span>
          </div>
          {watchlist.length === 0 ? (
            <div className={cx("flexCol", "flexCenter", "gap6", "py16")}>
              <Ic n="shieldCheck" sz={16} c="var(--muted2)" />
              <span className={cx("text11", "colorMuted2")}>No project risks logged yet</span>
            </div>
          ) : (
            <div className={cx("flexCol", "gap8")}>
              {watchlist.map((risk) => {
                const zone = getZone(riskScore(risk));
                return (
                  <button
                    key={risk.id}
                    type="button"
                    className={cx("infoChipSm", "textLeft")}
                    onClick={() => {
                      setView("list");
                      setExpanded(risk.id);
                    }}
                  >
                    <div className={cx("flexBetween", "gap10", "mb4")}>
                      <div className={cx("fw600", "text11", "minW0", "truncate")}>{risk.title}</div>
                      <span className={cx("scorePill", "dynBgColor", "dynColor", "noShrink")} style={{ "--bg-color": zone.bg, "--border-color": zone.border, "--color": zone.color } as React.CSSProperties}>
                        {zone.label} · {riskScore(risk)}
                      </span>
                    </div>
                    <div className={cx("flexRow", "gap6", "flexWrap")}>
                      <span className={cx("badge", SEV_BADGE[risk.severity])}>{risk.severity}</span>
                      <span className={cx("badge", STATUS_BADGE[risk.status])}>{risk.status}</span>
                      <span className={cx("fontMono", "text10", "colorMuted2")}>Updated {risk.updatedLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={cx("flexBetween", "mb12", "gap12", "flexWrap")}>
        <div className={cx("flexRow", "h36", "gap8")}>
          <div className={cx("pillTabs", "mb0")}>
            <button type="button" className={cx("pillTab", view === "matrix" ? "pillTabActive" : "")} onClick={() => { setView("matrix"); setSelectedRisk(null); }}>
              <span className={cx("flexRow", "gap5")}><Ic n="grid" sz={11} /> Matrix</span>
            </button>
            <button type="button" className={cx("pillTab", view === "list" ? "pillTabActive" : "")} onClick={() => setView("list")}>
              <span className={cx("flexRow", "gap5")}><Ic n="list" sz={11} /> List</span>
            </button>
          </div>
        </div>
        {view === "list" && (
          <div className={cx("flexRow", "gap10", "flexWrap")}>
            <input
              type="text"
              className={cx("input", "w220", "h36")}
              placeholder="Search risk title or status"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className={cx("pillTabs", "mb0")}>
              {(["All", "High", "Medium", "Low"] as const).map((tab) => (
                <button key={tab} type="button" className={cx("pillTab", listTab === tab ? "pillTabActive" : "")} onClick={() => setListTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {view === "matrix" && (
        <div className={cx("card", "overflowHidden")}>
          <div className={cx("cardHd", "borderB")}>
            <span className={cx("cardHdTitle")}>Impact × Probability Matrix</span>
            <span className={cx("text11", "colorMuted")}>Select a risk to review the live detail</span>
          </div>
          <div className={cx("overflowXAuto", "p16x20x12")}>
            <div className={cx("minW500")}>
              <div className={cx("rrAxisGrid")}>
                <div />
                {PROB_LABELS.map((probability) => (
                  <div key={probability} className={cx("textCenter", "pb8")}>
                    <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>{probability}</span>
                  </div>
                ))}
              </div>

              {SEV_LABELS.map((severity) => (
                <div key={severity} className={cx("rrAxisGrid", "mb6")}>
                  <div className={cx("flexRow", "flexCenter", "justifyEnd", "pr12")}>
                    <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>{severity}</span>
                  </div>
                  {PROB_LABELS.map((probability) => {
                    const matrixRisks = cellRisks(probability, severity);
                    const zone = getZone(SCORE_MAP[severity] * SCORE_MAP[probability]);
                    return (
                      <div
                        key={probability}
                        className={cx("rrMatrixCell", "dynBgColor")}
                        style={{ "--bg-color": zone.bg, "--border-color": zone.border } as React.CSSProperties}
                      >
                        <span className={cx("fontMono", "absZoneLabel", "dynColor")} style={{ "--color": zone.color } as React.CSSProperties}>
                          {zone.label}
                        </span>
                        <div className={cx("flexWrap", "gap6", "pt2", "flexRow")}>
                          {matrixRisks.map((risk) => (
                            <button
                              key={risk.id}
                              type="button"
                              title={risk.title}
                              onClick={() => setSelectedRisk(selectedRisk === risk.id ? null : risk.id)}
                              className={cx("rrRiskCircle", "dynBgColor", selectedRisk === risk.id && "rrRiskCircleSelected")}
                              style={{ "--bg-color": SEV_COLOR[risk.severity] } as React.CSSProperties}
                            >
                              {risk.id.slice(0, 4)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              <div className={cx("rrAxisGrid")}>
                <div />
                <div className={cx("rrAxisSpan", "textCenter")}>
                  <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>← Probability →</span>
                </div>
              </div>
            </div>
          </div>

          {selectedData && (() => {
            const score = riskScore(selectedData);
            const zone = getZone(score);
            return (
              <div className={cx("dynBorderLeft3", "dynBgColor", "borderT")} style={{ "--color": SEV_COLOR[selectedData.severity], "--bg-color": "color-mix(in oklab, var(--bg-elevated, var(--s2)) 100%, transparent)" } as React.CSSProperties}>
                <div className={cx("grid2Cols252")}>
                  <div className={cx("panelL")}>
                    <div className={cx("flexAlignStart", "justifyBetween", "mb10")}>
                      <div>
                        <div className={cx("flexRow", "flexCenter", "gap8", "mb4", "flexWrap")}>
                          <span className={cx("fontMono", "text10", "colorAccent")}>{selectedData.id}</span>
                          <span className={cx("badge", SEV_BADGE[selectedData.severity])}>{selectedData.severity} Severity</span>
                          <span className={cx("badge", STATUS_BADGE[selectedData.status], "flexRow", "flexCenter", "gap3")}>
                            <Ic n={STATUS_ICON[selectedData.status]} sz={9} c="currentColor" />{selectedData.status}
                          </span>
                          <span className={cx("zonePill", "dynBgColor", "dynColor", "fontMono", "fw700")} style={{ "--bg-color": zone.bg, "--border-color": zone.border, "--color": zone.color } as React.CSSProperties}>
                            {zone.label} · Score {score}
                          </span>
                        </div>
                        <div className={cx("fw700", "text13")}>{selectedData.title}</div>
                      </div>
                      <button type="button" className={cx("btnSm", "btnGhost", "noShrink", "ml12", "flexRow", "flexCenter", "gap4")} onClick={() => setSelectedRisk(null)}>
                        <Ic n="x" sz={11} c="var(--muted2)" /> Close
                      </button>
                    </div>

                    <div className={cx("rrExplainBox", "dynBgColor", "mb12")} style={{ "--bg-color": "color-mix(in oklab, var(--s2) 100%, transparent)", "--border-color": zone.border, "--color": zone.color } as React.CSSProperties}>
                      <Ic n="user" sz={11} c={zone.color} />
                      <div>
                        <span className={cx("fontMono", "text10", "fw700", "uppercase", "dynColor", "blockDisplay", "mb2")} style={{ "--color": zone.color } as React.CSSProperties}>What this means for you</span>
                        <span className={cx("text11", "colorMuted", "lineH155")}>{riskExplainText(zone.label)}</span>
                      </div>
                    </div>

                    <div className={cx("grid2Cols", "gap10")}>
                      {[
                        { icon: "alert", color: "var(--red)", label: "Impact", body: selectedData.detail },
                        { icon: "shieldCheck", color: "var(--lime)", label: "Mitigation", body: selectedData.mitigation },
                      ].map((section) => (
                        <div key={section.label} className={cx("infoChip")}>
                          <div className={cx("flexRow", "flexCenter", "gap6", "mb6")}>
                            <Ic n={section.icon} sz={11} c={section.color} />
                            <span className={cx("fontMono", "fw700", "text10", "uppercase", "ls01", "dynColor")} style={{ "--color": section.color } as React.CSSProperties}>
                              {section.label}
                            </span>
                          </div>
                          <div className={cx("text11", "colorMuted", "lineH16")}>{section.body}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cx("sectionPanelL")}>
                    <div className={cx("grid2Cols", "gap8")}>
                      {[
                        { label: "Severity", value: selectedData.severity },
                        { label: "Likelihood", value: selectedData.probability },
                        { label: "Created", value: selectedData.createdLabel },
                        { label: "Updated", value: selectedData.updatedLabel },
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
            );
          })()}
        </div>
      )}

      {view === "list" && (
        <div className={cx("card", "overflowHidden")}>
          {filtered.length > 0 && (
            <div className={cx("rrListHeader")}>
              {["", "Risk", "Severity", "Prob.", "Status", ""].map((heading, index) => (
                <span key={index} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{heading}</span>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className={cx("emptyPad48x24", "textCenter")}>
              <Ic n="alert" sz={28} c="var(--muted2)" />
              <div className={cx("fw800", "text13", "mt12", "mb4")}>No risks found</div>
              <div className={cx("text12", "colorMuted")}>
                {search ? 'No results for "' + search + '"' : "No risks match this severity filter."}
              </div>
              {search && (
                <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => setSearch("")}>
                  Clear search
                </button>
              )}
            </div>
          )}

          {filtered.map((risk, index) => {
            const isOpen = expanded === risk.id;
            const score = riskScore(risk);
            const zone = getZone(score);

            return (
              <div key={risk.id} className={cx("dynBorderLeft3", index < filtered.length - 1 && "borderB")} style={{ "--color": SEV_COLOR[risk.severity] } as React.CSSProperties}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className={cx("gridRowBtn6colV2")}
                  onClick={() => setExpanded(isOpen ? null : risk.id)}
                >
                  <div className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": zone.bg, "--color": zone.border } as React.CSSProperties}>
                    <Ic n="alert" sz={15} c={zone.color} />
                  </div>

                  <div className={cx("minW0")}>
                    <div className={cx("fw600", "text12", "truncate")}>{risk.title}</div>
                    <div className={cx("flexRow", "flexCenter", "gap6", "mt2", "flexWrap")}>
                      <span className={cx("fontMono", "text10", "colorAccent")}>{risk.id}</span>
                      <span className={cx("scorePill", "dynBgColor", "dynColor")} style={{ "--bg-color": zone.bg, "--border-color": zone.border, "--color": zone.color } as React.CSSProperties}>
                        {zone.label} · {score}
                      </span>
                      <span className={cx("fontMono", "text10", "colorMuted2")}>Updated {risk.updatedLabel}</span>
                    </div>
                  </div>

                  <div className={cx("flexRow", "gap5")}>
                    <div className={cx("wh7", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": SEV_COLOR[risk.severity] } as React.CSSProperties} />
                    <span className={cx("fontMono", "text10", "dynColor")} style={{ "--color": SEV_COLOR[risk.severity] } as React.CSSProperties}>{risk.severity}</span>
                  </div>

                  <span className={cx("fontMono", "text10", "colorMuted2")}>{risk.probability}</span>

                  <span className={cx("badge", STATUS_BADGE[risk.status], "flexRow", "gap4")}>
                    <Ic n={STATUS_ICON[risk.status]} sz={9} c="currentColor" />{risk.status}
                  </span>

                  <span className={cx("chevronIcon", "dynTransform", "flexRow", "justifyCenter")} style={{ "--transform": isOpen ? "rotate(90deg)" : "none" } as React.CSSProperties}>
                    <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                  </span>
                </button>

                {isOpen && (
                  <div className={cx("dynBgColor", "borderT")} style={{ "--bg-color": "color-mix(in oklab, var(--s2) 100%, transparent)" } as React.CSSProperties}>
                    <div className={cx("grid2Cols252")}>
                      <div className={cx("panelL")}>
                        <div className={cx("rrExplainBox", "dynBgColor", "mb12")} style={{ "--bg-color": zone.bg, "--border-color": zone.border, "--color": zone.color } as React.CSSProperties}>
                          <Ic n="user" sz={11} c={zone.color} />
                          <div>
                            <span className={cx("fontMono", "text10", "fw700", "uppercase", "dynColor", "blockDisplay", "mb2")} style={{ "--color": zone.color } as React.CSSProperties}>What this means for you</span>
                            <span className={cx("text11", "colorMuted", "lineH155")}>{riskExplainText(zone.label)}</span>
                          </div>
                        </div>

                        <div className={cx("grid2Cols", "gap10")}>
                          {[
                            { icon: "alert", color: "var(--red)", label: "Impact", body: risk.detail },
                            { icon: "shieldCheck", color: "var(--lime)", label: "Mitigation", body: risk.mitigation },
                          ].map((section) => (
                            <div key={section.label} className={cx("infoChip")}>
                              <div className={cx("flexRow", "flexCenter", "gap6", "mb6")}>
                                <Ic n={section.icon} sz={11} c={section.color} />
                                <span className={cx("fontMono", "fw700", "text10", "uppercase", "ls01", "dynColor")} style={{ "--color": section.color } as React.CSSProperties}>
                                  {section.label}
                                </span>
                              </div>
                              <div className={cx("text11", "colorMuted", "lineH16")}>{section.body}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={cx("sectionPanelL")}>
                        <div className={cx("grid2Cols", "gap8")}>
                          {[
                            { label: "Severity", value: risk.severity },
                            { label: "Likelihood", value: risk.probability },
                            { label: "Created", value: risk.createdLabel },
                            { label: "Updated", value: risk.updatedLabel },
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
      )}
    </div>
  );
}
