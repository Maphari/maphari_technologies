"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type DeliverableStatus = "in-review" | "approved" | "changes-requested" | "rejected";
type Tab = "all deliverables" | "pending review" | "approved" | "revision history" | "qa metrics";
type FilterStatus = "All" | DeliverableStatus;

type Deliverable = {
  id: string;
  project: string;
  client: string;
  clientColor: string;
  name: string;
  type: string;
  assignee: string;
  reviewer: string;
  submittedDate: string;
  reviewDue: string;
  status: DeliverableStatus;
  round: number;
  revisions: Array<{ date: string; note: string; requestedBy: string }>;
  score: number | null;
  checklist: Array<{ item: string; done: boolean }>;
};

const initialDeliverables: Deliverable[] = [];

const statusConfig: Record<DeliverableStatus, { color: string; label: string; bg: string }> = {
  "in-review": { color: "var(--blue)", label: "In Review", bg: "color-mix(in srgb, var(--blue) 8%, transparent)" },
  approved: { color: "var(--accent)", label: "Approved", bg: "color-mix(in srgb, var(--accent) 8%, transparent)" },
  "changes-requested": { color: "var(--amber)", label: "Changes Requested", bg: "color-mix(in srgb, var(--amber) 8%, transparent)" },
  rejected: { color: "var(--red)", label: "Rejected", bg: "color-mix(in srgb, var(--red) 8%, transparent)" },
};

const typeColors: Record<string, string> = {
  Design: "var(--purple)",
  UX: "var(--blue)",
  Strategy: "var(--accent)",
  Copy: "var(--amber)",
  "Copy + Design": "var(--amber)",
};

const tabs: Tab[] = ["all deliverables", "pending review", "approved", "revision history", "qa metrics"];

interface Props {
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

export function QualityAssurancePage({ onNotify }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("all deliverables");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");
  const [deliverables, setDeliverables] = useState<Deliverable[]>(initialDeliverables);
  const [actioningDeliverableId, setActioningDeliverableId] = useState<string | null>(null);
  const [requestingChangesId, setRequestingChangesId] = useState<string | null>(null);
  const [changesNote, setChangesNote] = useState("");

  const pending = deliverables.filter((d) => d.status === "in-review" || d.status === "changes-requested");
  const approved = deliverables.filter((d) => d.status === "approved");
  const avgRounds = deliverables.length > 0 ? (deliverables.reduce((s, d) => s + d.round, 0) / deliverables.length).toFixed(1) : "0.0";
  const approvalRate = deliverables.length > 0 ? Math.round((approved.length / deliverables.length) * 100) : 0;

  const filtered =
    activeTab === "pending review"
      ? pending
      : activeTab === "approved"
        ? approved
        : filterStatus === "All"
          ? deliverables
          : deliverables.filter((d) => d.status === filterStatus);

  return (
    <div className={styles.pageBody}>
      <div className={cx("flexBetween", "mb32")}>
        <div>
          <div className={cx("pageEyebrow")}>ADMIN / OPERATIONS</div>
          <h1 className={cx("pageTitle")}>Quality Assurance</h1>
          <div className={cx("pageSub")}>Deliverable review - Revision rounds - Approval gates</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent", "fontMono")}>+ Log Deliverable</button>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "Pending Review", value: pending.length.toString(), color: "var(--blue)", sub: "Awaiting QA sign-off" },
          { label: "Approval Rate", value: `${approvalRate}%`, color: approvalRate >= 60 ? "var(--accent)" : "var(--amber)", sub: "First-pass or later" },
          { label: "Avg Revision Rounds", value: avgRounds, color: parseFloat(avgRounds) <= 1.5 ? "var(--accent)" : "var(--amber)", sub: "Target: <= 1.5 rounds" },
          { label: "Rejected / Blocked", value: deliverables.filter((d) => d.status === "rejected").length.toString(), color: "var(--red)", sub: "Needs escalation" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard")}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue", styles.qaToneText, toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {activeTab === "all deliverables" ? (
          <select title="Filter by status" value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterStatus)} className={styles.filterSelect}>
            {(["All", ...Object.keys(statusConfig)] as Array<"All" | DeliverableStatus>).map(s => (
              <option key={s} value={s}>{s === "All" ? "All" : statusConfig[s].label}</option>
            ))}
          </select>
        ) : null}
      </div>

      {(activeTab === "all deliverables" || activeTab === "pending review" || activeTab === "approved") && (
        <div className={cx("flexCol", "gap12")}>
          {filtered.map((d) => {
            const sc = statusConfig[d.status];
            const checklistDone = d.checklist.filter((c) => c.done).length;
            const isExpanded = expanded === d.id;
          return (
              <div key={d.id} className={cx("card", styles.qaCardTone, d.status === "rejected" ? "toneRed" : d.status === "changes-requested" ? "toneAmber" : "toneMuted")}>
                <div
                  role="button"
                  tabIndex={0}
                  className={cx("p24", "pointerCursor")}
                  onClick={() => setExpanded(isExpanded ? null : d.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setExpanded(isExpanded ? null : d.id);
                    }
                  }}
                >
                  <div className={styles.qaDeliverableRow}>
                    <span className={cx("fontMono", "text10", "colorMuted")}>{d.id}</span>
                    <div>
                      <div className={cx("fw700", "text14", "mb3")}>{d.name}</div>
                      <div className={cx("text11", styles.qaToneText, toneClass(d.clientColor))}>
                        {d.project} - {d.client}
                      </div>
                    </div>
                    <span className={cx("text10", "fontMono", styles.qaToneTag, toneClass(typeColors[d.type] || "var(--muted)"))}>{d.type}</span>
                    <div>
                      <div className={cx("text10", "colorMuted", "mb3")}>Assignee &rarr; Reviewer</div>
                      <div className={cx("text11")}>
                        {d.assignee.split(" ")[0]} &rarr; {d.reviewer.split(" ")[0]}
                      </div>
                    </div>
                    <div>
                      <div className={cx("text10", "colorMuted", "mb3")}>Due</div>
                      <div className={cx("fontMono", "text12")}>{d.reviewDue}</div>
                    </div>
                    <div className={cx("textCenter")}>
                      <div className={cx("text10", "colorMuted", "mb3")}>Round</div>
                      <div className={cx("fontMono", "fw700", styles.qaToneText, d.round >= 3 ? "toneRed" : d.round >= 2 ? "toneAmber" : "toneAccent")}>{d.round}</div>
                    </div>
                    <span className={cx("text10", "fontMono", styles.qaStatusChip, toneClass(sc.color))}>{sc.label}</span>
                    <div className={cx("textRight")}>
                      <div className={cx("text10", "colorMuted", "mb3")}>Checklist</div>
                      <div className={cx("fontMono", "text12", styles.qaToneText, checklistDone === d.checklist.length ? "toneAccent" : "toneAmber")}>
                        {checklistDone}/{d.checklist.length}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <div className={styles.qaExpandedWrap}>
                    <div className={styles.qaExpandedGrid}>
                      <div>
                        <div className={cx("text11", "colorMuted", "uppercase", "mb12")}>QA Checklist</div>
                        {d.checklist.map((c, i) => {
                          const cTone = c.done ? "var(--muted)" : "var(--text)";
                          return (
                          <div key={i} className={cx("flexRow", "gap10", "mb8", styles.qaAlignStart)}>
                            <div
                              className={cx("flexCenter", "noShrink", styles.qaCheckBox, c.done && styles.qaCheckBoxDone)}
                            >
                              {c.done ? <span className={styles.qaCheckTick}>&#10003;</span> : null}
                            </div>
                            <span className={cx("text12", styles.qaToneText, toneClass(cTone), c.done && styles.qaLineThrough)}>{c.item}</span>
                          </div>
                        )})}
                      </div>

                      <div>
                        <div className={cx("text11", "colorMuted", "uppercase", "mb12")}>Revision History</div>
                        {d.revisions.length === 0
                          ? <div className={cx("text12", "colorAccent")}>&#10003; No revisions required</div>
                          : d.revisions.map((rev, i) => (
                              <div key={i} className={cx("bgBg", "mb8", styles.qaRevisionCard)}>
                                <div className={cx("text10", "colorMuted", "fontMono", "mb4")}>
                                  {rev.date} - {rev.requestedBy}
                                </div>
                                <div className={cx("text12")}>{rev.note}</div>
                              </div>
                            ))}
                      </div>

                      <div>
                        <div className={cx("text11", "colorMuted", "uppercase", "mb12")}>Actions</div>
                        <div className={cx("flexCol", "gap8")}>
                          {d.status !== "approved" ? (
                            <button
                              type="button"
                              className={cx("btnSm", "btnAccent", styles.qaTextLeft)}
                              disabled={actioningDeliverableId === d.id}
                              onClick={async () => {
                                setActioningDeliverableId(d.id);
                                setDeliverables((prev) =>
                                  prev.map((item) =>
                                    item.id === d.id ? { ...item, status: "approved" as DeliverableStatus } : item
                                  )
                                );
                                onNotify("success", `Deliverable "${d.name}" approved.`);
                                setActioningDeliverableId(null);
                              }}
                            >
                              &#10003; {actioningDeliverableId === d.id ? "Approving…" : "Approve Deliverable"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={cx("btnSm", "btnGhost", styles.qaTextLeft)}
                            onClick={() =>
                              setRequestingChangesId(requestingChangesId === d.id ? null : d.id)
                            }
                          >
                            &#9998; Request Changes
                          </button>
                          {requestingChangesId === d.id ? (
                            <div className={cx("flexCol", "gap8")}>
                              <textarea
                                className={cx("inputSm")}
                                rows={3}
                                placeholder="Describe the changes needed…"
                                value={changesNote}
                                onChange={(e) => setChangesNote(e.target.value)}
                              />
                              <button
                                type="button"
                                className={cx("btnSm", "btnAccent", styles.qaTextLeft)}
                                disabled={!changesNote.trim()}
                                onClick={() => {
                                  const note = changesNote.trim();
                                  if (!note) return;
                                  setDeliverables((prev) =>
                                    prev.map((item) =>
                                      item.id === d.id
                                        ? {
                                            ...item,
                                            status: "changes-requested" as DeliverableStatus,
                                            revisions: [
                                              ...item.revisions,
                                              {
                                                date: new Date().toISOString().split("T")[0],
                                                note,
                                                requestedBy: "Admin",
                                              },
                                            ],
                                          }
                                        : item
                                    )
                                  );
                                  onNotify("info", `Changes requested for "${d.name}".`);
                                  setChangesNote("");
                                  setRequestingChangesId(null);
                                }}
                              >
                                Submit Changes Request
                              </button>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            className={cx("btnSm", styles.qaRejectBtn, styles.qaTextLeft)}
                            onClick={() => {
                              setDeliverables((prev) =>
                                prev.map((item) =>
                                  item.id === d.id ? { ...item, status: "rejected" as DeliverableStatus } : item
                                )
                              );
                              onNotify("error", `Deliverable "${d.name}" rejected.`);
                            }}
                          >
                            &#10007; Reject
                          </button>
                          {d.score ? (
                            <div className={cx("bgBg", "text12", styles.qaScoreBox)}>
                              Quality Score: <span className={cx("colorAccent", "fontMono", "fw700")}>{d.score}/100</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "revision history" ? (
        <div className={cx("card", "overflowHidden")}>
          <div className={cx("qaRevisionHead", "text10", "colorMuted", "uppercase", "fontMono")}>
            {["DLV ID", "Date", "Revision Note", "Deliverable", "Requested By", "Round"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {deliverables
            .flatMap((d) => d.revisions.map((r, i) => ({ ...r, deliverable: d.name, id: d.id, client: d.client, clientColor: d.clientColor, round: i + 1 })))
            .map((r, i) => (
              <div key={i} className={styles.qaRevisionRow}>
                <span className={cx("fontMono", "text10", "colorMuted")}>{r.id}</span>
                <span className={cx("fontMono", "text11", "colorMuted")}>{r.date}</span>
                <span className={cx("text12")}>{r.note}</span>
                <span className={cx("text11", styles.qaToneText, toneClass(r.clientColor))}>{r.deliverable.substring(0, 20)}...</span>
                <span className={cx("text12")}>{r.requestedBy.split(" ")[0]}</span>
                <span className={cx("fontMono", "fw700", styles.qaToneText, r.round >= 3 ? "toneRed" : r.round >= 2 ? "toneAmber" : "toneAccent")}>R{r.round}</span>
              </div>
            ))}
        </div>
      ) : null}

      {activeTab === "qa metrics" ? (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase")}>Revision Rounds by Assignee</div>
            {[...new Set(deliverables.map((d) => d.assignee))].map((name) => {
              const theirWork = deliverables.filter((d) => d.assignee === name);
              const avg = theirWork.length > 0 ? (theirWork.reduce((s, d) => s + d.round, 0) / theirWork.length).toFixed(1) : "0.0";
              const avgNum = parseFloat(avg);
              const color = avgNum <= 1.5 ? "var(--accent)" : avgNum <= 2.5 ? "var(--amber)" : "var(--red)";
              return (
                <div key={name} className={cx("flexRow", "gap12", "mb14", styles.qaAlignCenter)}>
                  <span className={cx("text13", styles.qaFlex1)}>{name}</span>
                  <div className={cx("progressBar", styles.qaTrack100)}>
                    <progress className={cx("barFill", "uiProgress", styles.qaFillRound3, toneClass(color))} max={100} value={Math.min((avgNum / 4) * 100, 100)} />
                  </div>
                  <span className={cx("fontMono", "fw700", "textRight", styles.qaToneText, styles.qaW32, toneClass(color))}>{avg}</span>
                </div>
              );
            })}
          </div>
          <div className={cx("flexCol", "gap16")}>
            <div className={cx("card", "p24")}>
              <div className={cx("text13", "fw700", "mb16", "uppercase")}>QA Status Breakdown</div>
              {Object.entries(statusConfig).map(([status, cfg]) => {
                const count = deliverables.filter((d) => d.status === status).length;
                return (
                <div key={status} className={cx("flexRow", "gap12", "mb12", styles.qaAlignCenter)}>
                  <span className={cx("text12", styles.qaFlex1, styles.qaToneText, toneClass(cfg.color))}>{cfg.label}</span>
                  <div className={cx("progressBar", styles.qaTrack80)}>
                    <progress className={cx("barFill", "uiProgress", styles.qaFillRound3, toneClass(cfg.color))} max={100} value={deliverables.length > 0 ? (count / deliverables.length) * 100 : 0} />
                  </div>
                  <span className={cx("fontMono", "fw700", "textRight", styles.qaToneText, styles.qaW20, toneClass(cfg.color))}>{count}</span>
                </div>
              );
              })}
            </div>
            {(() => {
              const highRound = deliverables.find((d) => d.round >= 3 && d.status !== "approved");
              return (
                <div className={cx("card", "p20", styles.qaAdvisoryCard)}>
                  {highRound ? (
                    <>
                      <div className={cx("fw700", "colorAmber", "mb8")}>&#9888; QA Advisory</div>
                      <div className={cx("text12", "colorMuted", styles.qaLine17)}>
                        {highRound.client} deliverable is on round {highRound.round}. This signals a deeper scope or communication issue — recommend admin-level conversation before submitting again.
                      </div>
                    </>
                  ) : (
                    <div className={cx("text12", "colorMuted", styles.qaLine17)}>No active QA advisories at this time.</div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
