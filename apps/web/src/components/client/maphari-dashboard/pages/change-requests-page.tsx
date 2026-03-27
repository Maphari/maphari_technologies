"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import type { ProjectCard } from "../types";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalChangeRequestsWithRefresh,
  createPortalChangeRequestWithRefresh,
  updatePortalChangeRequestWithRefresh,
  type PortalProjectChangeRequest,
} from "../../../../lib/api/portal";

type Decision = "Approve" | "Reject" | null;

const D_COLOR: Record<Exclude<Decision, null>, string> = {
  Approve: "var(--lime)",
  Reject: "var(--red)",
};

const D_BG: Record<Exclude<Decision, null>, string> = {
  Approve: "color-mix(in oklab, var(--lime) 8%, transparent)",
  Reject: "color-mix(in oklab, var(--red) 8%, transparent)",
};

function badgeClass(status: string): string {
  if (status === "CLIENT_APPROVED" || status === "ADMIN_APPROVED") return "badgeGreen";
  if (status === "CLIENT_REJECTED" || status === "ADMIN_REJECTED") return "badgeRed";
  if (status === "SUBMITTED" || status === "ESTIMATED") return "badgeAmber";
  return "badgeMuted";
}

function statusLabel(status: string): string {
  if (status === "CLIENT_APPROVED" || status === "ADMIN_APPROVED") return "Approved";
  if (status === "CLIENT_REJECTED" || status === "ADMIN_REJECTED") return "Declined";
  if (status === "SUBMITTED") return "Submitted";
  if (status === "ESTIMATED") return "Estimated";
  if (status === "DRAFT") return "Draft";
  return status;
}

function isPendingClientAction(changeRequest: PortalProjectChangeRequest): boolean {
  return changeRequest.status === "ESTIMATED" || changeRequest.status === "ADMIN_APPROVED";
}

function isHistorical(changeRequest: PortalProjectChangeRequest): boolean {
  return (
    changeRequest.status === "CLIENT_APPROVED" ||
    changeRequest.status === "CLIENT_REJECTED" ||
    changeRequest.status === "ADMIN_REJECTED"
  );
}

function costRands(cents: number | bigint | null | undefined): number {
  if (cents === null || cents === undefined) return 0;
  return Math.round(Number(cents) / 100);
}

function formatDecisionDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ChangeRequestsPage({ projects = [] }: { projects?: ProjectCard[] }) {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();

  const baseProject = projects.find((project) => project.id === projectId) ?? projects[0] ?? null;
  const baseBudget = baseProject ? Math.round(baseProject.budgetCents / 100) : null;

  const [allCrs, setAllCrs] = useState<PortalProjectChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [impactSummary, setImpactSummary] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const loadChangeRequests = useCallback(async (mode: "initial" | "refresh" = "initial"): Promise<boolean> => {
    if (!session) {
      setAllCrs([]);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return false;
    }

    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError(null);

    try {
      const result = await loadPortalChangeRequestsWithRefresh(session, projectId ? { projectId } : {});
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message ?? "Unable to load change requests.");
        setAllCrs([]);
        return false;
      }
      setAllCrs(result.data ?? []);
      return true;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load change requests.");
      setAllCrs([]);
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, session]);

  useEffect(() => {
    void loadChangeRequests("initial");
  }, [loadChangeRequests]);

  const pendingCrs = useMemo(() => allCrs.filter((item) => isPendingClientAction(item)), [allCrs]);
  const historicalCrs = useMemo(() => allCrs.filter((item) => isHistorical(item)), [allCrs]);

  const impact = useMemo(() => {
    const approved = pendingCrs.filter((item) => decisions[item.id] === "Approve");
    return {
      cost: approved.reduce((sum, item) => sum + costRands(item.estimatedCostCents), 0),
      hours: approved.reduce((sum, item) => sum + (item.estimatedHours ?? 0), 0),
      count: approved.length,
    };
  }, [decisions, pendingCrs]);

  const approvedSelected = pendingCrs.filter((item) => decisions[item.id] === "Approve").length;
  const rejectedSelected = pendingCrs.filter((item) => decisions[item.id] === "Reject").length;
  const undecided = pendingCrs.filter((item) => !decisions[item.id]).length;
  const allDecided = pendingCrs.length > 0 && undecided === 0;

  function toggle(id: string, decision: Decision): void {
    setDecisions((prev) => ({ ...prev, [id]: prev[id] === decision ? null : decision }));
  }

  async function handleRefresh(): Promise<void> {
    const ok = await loadChangeRequests("refresh");
    if (ok) {
      notify("success", "Change requests refreshed", "Latest scope decisions and estimates have been loaded.");
    }
  }

  function handleExport(): void {
    if (allCrs.length === 0) {
      notify("info", "Nothing to export", "There are no change requests in this project yet.");
      return;
    }

    const rows = [
      ["Title", "Status", "Requested", "Requested By", "Estimated Cost", "Estimated Hours", "Impact Summary", "Client Note"],
      ...allCrs.map((item) => [
        item.title,
        statusLabel(item.status),
        formatDecisionDate(item.requestedAt),
        item.requestedByName ?? item.requestedByRole ?? "—",
        item.estimatedCostCents ? "R " + costRands(item.estimatedCostCents).toLocaleString() : "—",
        item.estimatedHours ? String(item.estimatedHours) + "h" : "—",
        item.impactSummary ?? "—",
        item.clientDecisionNote ?? "—",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, "\"\"")}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "change-requests.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("success", "Downloading", "Change requests CSV is downloading.");
  }

  async function handleSubmitNew(): Promise<void> {
    if (!session || !title.trim() || !projectId) {
      setShowNew(false);
      setTitle("");
      setDesc("");
      setImpactSummary("");
      return;
    }

    setSubmitting(true);
    const result = await createPortalChangeRequestWithRefresh(session, {
      projectId,
      title: title.trim(),
      description: desc.trim() || undefined,
      impactSummary: impactSummary.trim() || undefined,
    });
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error && result.data) {
      setAllCrs((prev) => [result.data!, ...prev]);
      notify("success", "Change request submitted", "Your request is now with the delivery team for estimation.");
    } else if (result.error) {
      notify("error", "Submission failed", result.error.message ?? "Could not submit your change request.");
    }
    setSubmitting(false);
    setShowNew(false);
    setTitle("");
    setDesc("");
    setImpactSummary("");
  }

  async function handleLockDecisions(): Promise<void> {
    if (!session) return;
    setSubmitting(true);

    const statusMap = {
      Approve: "CLIENT_APPROVED",
      Reject: "CLIENT_REJECTED",
    } as const;

    const updates = pendingCrs
      .filter((item) => decisions[item.id] !== null)
      .map((item) =>
        updatePortalChangeRequestWithRefresh(session, item.id, {
          status: statusMap[decisions[item.id] as "Approve" | "Reject"],
        })
      );

    const results = await Promise.all(updates);
    let successCount = 0;
    let failCount = 0;

    results.forEach((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (!result.error && result.data) {
        setAllCrs((prev) => prev.map((item) => (item.id === result.data!.id ? result.data! : item)));
        successCount++;
      } else {
        failCount++;
      }
    });

    setDecisions({});
    setSubmitting(false);

    if (successCount > 0 && failCount === 0) {
      notify("success", "Decisions submitted", `${successCount} change request${successCount !== 1 ? "s" : ""} processed successfully.`);
    } else if (successCount > 0 && failCount > 0) {
      notify("warning", "Partial success", `${successCount} processed, ${failCount} failed. Please retry.`);
    } else if (failCount > 0) {
      notify("error", "Decisions failed", "Could not process your change request decisions. Please try again.");
    }
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

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnGhost", "mt12")} onClick={() => void loadChangeRequests("refresh")}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>
      {showNew ? (
        <div className={cx("modalOverlay")}>
          <div className={cx("card", "w480", "p24")}>
            <div className={cx("fw700", "text13", "mb16")}>Submit Change Request</div>
            <div className={cx("flexCol", "gap12")}>
              <input className={cx("input")} placeholder="Request title" value={title} onChange={(event) => setTitle(event.target.value)} />
              <textarea className={cx("textarea", "resizeV")} rows={4} placeholder="Describe the change in detail..." value={desc} onChange={(event) => setDesc(event.target.value)} />
              <textarea className={cx("textarea", "resizeV")} rows={3} placeholder="Expected impact or reason (optional)..." value={impactSummary} onChange={(event) => setImpactSummary(event.target.value)} />
            </div>
            <div className={cx("flexRow", "gap8", "mt16")}>
              <button type="button" className={cx("btnSm", "btnAccent")} disabled={submitting || !title.trim()} onClick={() => void handleSubmitNew()}>
                {submitting ? "Submitting…" : "Submit →"}
              </button>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => { setShowNew(false); setTitle(""); setDesc(""); setImpactSummary(""); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Changes</div>
          <h1 className={cx("pageTitle")}>Decision Impact Simulator</h1>
          <p className={cx("pageSub")}>Review estimated scope changes, confirm the real budget impact, and lock in client decisions.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void handleRefresh()}>
            <Ic n="refresh" sz={13} /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={handleExport}>
            <Ic n="download" sz={13} /> Export CSV
          </button>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowNew(true)}>+ New Request</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Awaiting Decision", value: String(undecided), color: "statCardAmber" },
          { label: "Approving", value: String(approvedSelected), color: "statCardGreen" },
          { label: "Declining", value: String(rejectedSelected), color: "statCardRed" },
          { label: "Budget Impact", value: impact.cost > 0 ? "+R " + impact.cost.toLocaleString() : "—", color: "statCardBlue" },
        ].map((item) => (
          <div key={item.label} className={cx("statCard", item.color)}>
            <div className={cx("statLabel")}>{item.label}</div>
            <div className={cx("statValue")}>{item.value}</div>
          </div>
        ))}
      </div>

      {pendingCrs.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="edit" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No pending change requests</div>
          <div className={cx("emptyStateSub")}>Change requests awaiting your decision will appear here.</div>
        </div>
      ) : null}

      {undecided > 0 ? (
        <div className={cx("crDecisionBanner")}>
          <Ic n="alert" sz={14} c="var(--amber)" />
          <span>
            <strong>{undecided} change request{undecided !== 1 ? "s" : ""} waiting for your decision.</strong> Review and approve or decline below.
          </span>
        </div>
      ) : null}

      {pendingCrs.length > 0 ? (
        <div className={cx("flexCol", "gap14", "mb16")}>
          {pendingCrs.map((changeRequest) => {
            const decision = decisions[changeRequest.id];
            const cost = costRands(changeRequest.estimatedCostCents);
            return (
              <div
                key={changeRequest.id}
                className={cx("card", "dynBorderLeft3", decision && "dynBgColor")}
                style={{ "--color": decision ? D_COLOR[decision] : "var(--amber)", "--bg-color": decision ? D_BG[decision] : "transparent" } as React.CSSProperties}
              >
                <div className={cx("cardHd")}>
                  <span className={cx("badge", "badgeMuted")}>{changeRequest.id.slice(0, 8).toUpperCase()}</span>
                  <span className={cx("cardHdTitle", "ml8")}>{changeRequest.title}</span>
                  <span className={cx("badge", badgeClass(changeRequest.status), "mlAuto")}>{statusLabel(changeRequest.status)}</span>
                </div>

                <div className={cx("cardBodyPad")}>
                  <p className={cx("text12", "colorMuted", "mb16")}>{changeRequest.description ?? "No description provided."}</p>

                  <div className={cx("grid4Cols", "gap10", "mb16")}>
                    {[
                      { label: "Budget Impact", value: cost > 0 ? "+R " + cost.toLocaleString() : "TBD", color: "var(--amber)" },
                      { label: "Estimated Hours", value: changeRequest.estimatedHours ? "+" + changeRequest.estimatedHours + "h" : "TBD", color: "var(--red)" },
                      { label: "Requested By", value: changeRequest.requestedByName ?? changeRequest.requestedByRole ?? "Unknown", color: "var(--purple)" },
                      { label: "Impact Summary", value: changeRequest.impactSummary ?? "Not supplied", color: "var(--cyan)" },
                    ].map((item) => (
                      <div key={item.label} className={cx("crImpactCard")}>
                        <div className={cx("text10", "colorMuted", "mb6")}>{item.label}</div>
                        <div className={cx("fw700", "text13", "dynColor")} style={{ "--color": item.color } as React.CSSProperties}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {(changeRequest.staffAssessment || changeRequest.adminDecisionNote) ? (
                    <div className={cx("cardS1v2", "p14", "mb14")}>
                      <div className={cx("text10", "colorMuted", "fw600", "uppercase", "ls008", "mb6")}>Team Assessment</div>
                      <div className={cx("text12", "colorMuted", "lineH17")}>
                        {changeRequest.staffAssessment ?? changeRequest.adminDecisionNote}
                      </div>
                    </div>
                  ) : null}

                  <div className={cx("flexRow", "gap8", "flexWrap", "flexCenter")}>
                    <span className={cx("text11", "colorMuted")}>Your decision:</span>
                    {(["Approve", "Reject"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={cx("btnSm", decision === option ? "btnAccent" : "btnGhost", "dynColor", decision === option && "dynBorderColor")}
                        style={{ "--color": decision === option ? D_COLOR[option] : "inherit", "--border-color": decision === option ? D_COLOR[option] : "var(--b2)" } as React.CSSProperties}
                        onClick={() => toggle(changeRequest.id, option)}
                      >
                        {option === "Approve" ? "✓ Approve" : "✕ Reject"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {pendingCrs.length > 0 ? (
        <div className={cx("card", "dynBorderLeft3", "mb16")} style={{ "--color": impact.count > 0 ? "var(--lime)" : "var(--b2)" } as React.CSSProperties}>
          <div className={cx("cardHd")}>
            <span className={cx("cardHdTitle")}>Live Decision Summary</span>
            {impact.count > 0 ? <span className={cx("badge", "badgeAccent", "ml8")}>{impact.count} approval{impact.count !== 1 ? "s" : ""} selected</span> : null}
          </div>
          <div className={cx("cardBodyPad")}>
            <div className={cx("grid4Cols", "gap12", "mb16")}>
              {[
                { label: "Budget Added", value: impact.cost > 0 ? "+R " + impact.cost.toLocaleString() : "No change", changed: impact.cost > 0 },
                { label: "Hours Added", value: impact.hours > 0 ? "+" + impact.hours + "h" : "No change", changed: impact.hours > 0 },
                { label: "New Budget", value: baseBudget !== null ? "R " + (baseBudget + impact.cost).toLocaleString() : "—", changed: impact.cost > 0 },
                { label: "Declines Selected", value: rejectedSelected > 0 ? String(rejectedSelected) : "None", changed: rejectedSelected > 0 },
              ].map((item) => (
                <div key={item.label} className={cx("crCascadeCard", item.changed && "crCascadeCardChanged")}>
                  <div className={cx("text10", "colorMuted", "mb4")}>{item.label}</div>
                  <div className={cx("fw700", "text12", "dynColor")} style={{ "--color": item.changed ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>{item.value}</div>
                </div>
              ))}
            </div>

            <div className={cx("flexRow", "gap10", "flexCenter", "flexWrap")}>
              {allDecided ? (
                <>
                  <button type="button" className={cx("btnSm", "btnAccent")} disabled={submitting} onClick={() => void handleLockDecisions()}>
                    {submitting ? "Submitting…" : "Lock in all decisions →"}
                  </button>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setDecisions({})}>Reset</button>
                </>
              ) : (
                <span className={cx("text11", "colorMuted")}>
                  {undecided} decision{undecided !== 1 ? "s" : ""} remaining before you can lock in.
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Decision History</span>
          <button type="button" className={cx("btnSm", "btnGhost", "mlAuto")} onClick={() => setShowHistory((value) => !value)}>
            {showHistory ? "Hide ↑" : "Show ↓"}
          </button>
        </div>
        {showHistory ? (
          <div className={cx("listGroup")}>
            {historicalCrs.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="clock" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No historical decisions</div>
                <div className={cx("emptyStateSub")}>Change requests you&apos;ve approved or rejected will appear here.</div>
              </div>
            ) : null}

            {historicalCrs.map((changeRequest) => (
              <div key={changeRequest.id} className={cx("listRow", "flexBetween")}>
                <div className={cx("flexRow", "gap8")}>
                  <span className={cx("badge", "badgeMuted")}>{changeRequest.id.slice(0, 8).toUpperCase()}</span>
                  <div>
                    <div className={cx("fw600", "text12")}>{changeRequest.title}</div>
                    <div className={cx("text10", "colorMuted")}>
                      {formatDecisionDate(changeRequest.requestedAt)}
                      {changeRequest.estimatedCostCents ? " · +R " + costRands(changeRequest.estimatedCostCents).toLocaleString() : ""}
                      {changeRequest.estimatedHours ? " · +" + changeRequest.estimatedHours + "h" : ""}
                      {changeRequest.clientDecisionNote ? " · " + changeRequest.clientDecisionNote : ""}
                    </div>
                  </div>
                </div>
                <span className={cx("badge", badgeClass(changeRequest.status))}>{statusLabel(changeRequest.status)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
