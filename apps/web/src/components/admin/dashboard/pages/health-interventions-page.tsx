"use client";

import { useEffect, useState } from "react";
import { AdminTabs } from "./shared";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAllInterventionsWithRefresh, type AdminIntervention } from "../../../../lib/api/admin/client-ops";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";

type TriggerType = "health-drop" | "invoice-overdue" | "nps-drop" | "quality-complaint" | "silent-client";
type InterventionStatus = "open" | "resolved" | "churned";
type Tab = "all interventions" | "open" | "resolved" | "patterns";

type InterventionAction = {
  date: string;
  action: string;
  outcome: string;
  by: string;
};

type Intervention = {
  id: string;
  client: string;
  clientColor: string;
  trigger: string;
  triggerType: TriggerType;
  adminWhoActed: string;
  date: string;
  status: InterventionStatus;
  healthBefore: number;
  healthAfter: number | null;
  churnRiskBefore: number;
  churnRiskAfter: number | null;
  actions: InterventionAction[];
  nextStep: string | null;
  mrrAtRisk: number;
  notes: string;
};

const CLIENT_COLORS = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--red)", "var(--green)"];

const triggerTypeConfig: Record<TriggerType, { color: string; label: string; icon: string }> = {
  "health-drop":      { color: "var(--red)",    label: "Health Drop",       icon: "\uD83D\uDCC9" },
  "invoice-overdue":  { color: "var(--amber)",  label: "Invoice Overdue",   icon: "\uD83D\uDCB8" },
  "nps-drop":         { color: "var(--orange)", label: "NPS Drop",          icon: "\uD83D\uDCCA" },
  "quality-complaint":{ color: "var(--purple)", label: "Quality Complaint", icon: "\u26A0" },
  "silent-client":    { color: "var(--red)",    label: "Silent Client",     icon: "\uD83D\uDD07" },
};

const statusConfig: Record<InterventionStatus, { color: string; label: string }> = {
  open:     { color: "var(--red)",    label: "Open" },
  resolved: { color: "var(--accent)", label: "Resolved" },
  churned:  { color: "var(--muted)",  label: "Churned" },
};

const tabs: Tab[] = ["all interventions", "open", "resolved", "patterns"];

function mapTriggerType(type: string): TriggerType {
  const l = type.toLowerCase();
  if (l.includes("invoice") || l.includes("payment") || l.includes("billing")) return "invoice-overdue";
  if (l.includes("nps") || l.includes("satisfaction") || l.includes("survey"))  return "nps-drop";
  if (l.includes("quality") || l.includes("complaint"))                          return "quality-complaint";
  if (l.includes("silent") || l.includes("churn") || l.includes("inactive"))    return "silent-client";
  return "health-drop";
}

function mapInterventionStatus(status: string): InterventionStatus {
  const s = status.toUpperCase();
  if (s === "RESOLVED") return "resolved";
  if (s === "CHURNED")  return "churned";
  return "open";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function mapIntervention(a: AdminIntervention, clientName: string, color: string): Intervention {
  return {
    id:              a.id,
    client:          clientName,
    clientColor:     color,
    trigger:         a.description ?? a.type,
    triggerType:     mapTriggerType(a.type),
    adminWhoActed:   a.assignedTo ?? "Admin",
    date:            fmtDate(a.createdAt),
    status:          mapInterventionStatus(a.status),
    healthBefore:    0,
    healthAfter:     a.resolvedAt !== null ? 0 : null,
    churnRiskBefore: 0,
    churnRiskAfter:  null,
    actions:         [],
    nextStep:        null,
    mrrAtRisk:       0,
    notes:           a.description ?? "",
  };
}

export function HealthInterventionsPage({ session }: { session: AuthSession | null }) {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState<Tab>("all interventions");
  const [expanded, setExpanded]           = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [intRes, snapRes] = await Promise.all([
          loadAllInterventionsWithRefresh(session),
          loadAdminSnapshotWithRefresh(session),
        ]);
        if (cancelled) return;
        if (intRes.nextSession)       saveSession(intRes.nextSession);
        else if (snapRes.nextSession) saveSession(snapRes.nextSession);
        const clients = snapRes.data?.clients ?? [];
        const colorMap = new Map<string, { name: string; color: string }>(
          clients.map((c, i) => [c.id, { name: c.name, color: CLIENT_COLORS[i % CLIENT_COLORS.length] }])
        );
        setInterventions(
          (intRes.data ?? []).map(a => {
            const info = colorMap.get(a.clientId);
            return mapIntervention(a, info?.name ?? "Client", info?.color ?? CLIENT_COLORS[0]);
          })
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const open     = interventions.filter((i) => i.status === "open");
  const resolved = interventions.filter((i) => i.status === "resolved");
  const churned  = interventions.filter((i) => i.status === "churned");
  const mrrAtRisk = open.reduce((s, i) => s + i.mrrAtRisk, 0);

  const displayList =
    activeTab === "open"     ? open
    : activeTab === "resolved" ? resolved
    : interventions;

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
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={cx(styles.pageEyebrow, "colorRed")}>EXPERIENCE / HEALTH INTERVENTIONS</div>
          <h1 className={styles.pageTitle}>Health Interventions</h1>
          <div className={styles.pageSub}>Every time admin stepped in - Why - What happened - Outcome</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", styles.healthIntvDangerBtn)}>+ Log Intervention</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Open Interventions",          value: open.length.toString(),    color: "var(--red)",    sub: "Active cases",       highlight: true },
          { label: "MRR at Risk",                 value: `R${(mrrAtRisk / 1000).toFixed(0)}k`, color: "var(--red)", sub: "Across open cases", highlight: false },
          { label: "Resolved (90d)",              value: resolved.length.toString(), color: "var(--accent)", sub: "Health recovered",    highlight: false },
          { label: "Churned Despite Intervention",value: churned.length.toString(),  color: "var(--muted)",  sub: "Couldn't save",      highlight: false },
        ].map((s) => (
          <div key={s.label} className={cx(styles.statCard, s.highlight && styles.healthIntvStatHighlight)}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor="var(--accent)"
        mutedColor="var(--muted)"
        panelColor="var(--surface)"
        borderColor="var(--border)"
      />

      {(activeTab === "all interventions" || activeTab === "open" || activeTab === "resolved") && (
        displayList.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateTitle")}>
              {activeTab === "all interventions" ? "No interventions logged" : `No ${activeTab} interventions`}
            </div>
            <p className={cx("emptyStateSub")}>
              Interventions will appear here when admin actions are recorded for client health events.
            </p>
          </div>
        ) : (
          <div className={cx("flexCol", "gap16")}>
            {displayList.map((intv) => {
              const sc   = statusConfig[intv.status];
              const tc   = triggerTypeConfig[intv.triggerType];
              const isExp = expanded === intv.id;
              return (
                <div
                  key={intv.id}
                  className={cx(
                    "bgSurface",
                    styles.healthIntvCard,
                    toneClass(intv.status === "open" ? tc.color : intv.status === "resolved" ? "var(--accent)" : "var(--border)")
                  )}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className={cx("p24", "pointerCursor")}
                    onClick={() => setExpanded(isExp ? null : intv.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setExpanded(isExp ? null : intv.id);
                      }
                    }}
                  >
                    <div className={styles.healthIntvHeadGrid}>
                      <span className={cx("fontMono", "text10", "colorMuted")}>{intv.id.slice(-8)}</span>
                      <div>
                        <div className={cx("fw700", "text14", colorClass(intv.clientColor))}>{intv.client}</div>
                        <div className={cx("text10", "colorMuted")}>by {intv.adminWhoActed} · {intv.date}</div>
                      </div>
                      <div>
                        <div className={cx("flexRow", "gap8", "mb4")}>
                          <span className={styles.healthIntvIcon14}>{tc.icon}</span>
                          <span className={cx("text10", "fontMono", "uppercase", colorClass(tc.color))}>{tc.label}</span>
                        </div>
                        <div className={cx("text13", "fw600")}>{intv.trigger}</div>
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb4")}>Health: before {"\u2192"} after</div>
                        <div className={cx("fontMono", "text13")}>
                          <span className={intv.healthBefore > 0 && intv.healthBefore < 60 ? "colorRed" : "colorMuted"}>
                            {intv.healthBefore > 0 ? intv.healthBefore : "\u2014"}
                          </span>
                          <span className={cx("colorMuted")}> {"\u2192"} </span>
                          <span className={intv.healthAfter !== null && intv.healthAfter > 0 ? (intv.healthAfter >= 70 ? "colorAccent" : "colorAmber") : "colorMuted"}>
                            {intv.healthAfter !== null && intv.healthAfter > 0 ? intv.healthAfter : "\u2014"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb2")}>MRR at Risk</div>
                        <div className={cx("fontMono", "fw700", intv.mrrAtRisk > 0 ? "colorRed" : "colorMuted")}>
                          {intv.mrrAtRisk > 0 ? `R${(intv.mrrAtRisk / 1000).toFixed(0)}k` : "\u2014"}
                        </div>
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb2")}>Actions</div>
                        <div className={cx("fontMono", "fw700", "colorBlue")}>
                          {intv.actions.length > 0 ? intv.actions.length : "\u2014"}
                        </div>
                      </div>
                      <span className={cx("text10", "fontMono", "textCenter", styles.healthIntvStatusChip, toneClass(sc.color))}>
                        {sc.label}
                      </span>
                    </div>
                  </div>

                  {isExp && (
                    <div className={styles.healthIntvExpanded}>
                      <div className={styles.healthIntvExpandedGrid}>
                        <div>
                          <div className={cx("text11", "colorMuted", "uppercase", "tracking", "mb16")}>Action Timeline</div>
                          {intv.actions.length === 0 ? (
                            <div className={cx("text12", "colorMuted")}>No action steps recorded for this intervention.</div>
                          ) : (
                            <div className={styles.healthIntvTimelineWrap}>
                              <div className={styles.healthIntvTimelineLine} />
                              <div className={cx("flexCol", "gap16")}>
                                {intv.actions.map((a, i) => (
                                  <div key={i} className={styles.healthIntvTimelineRow}>
                                    <span className={cx("fontMono", "text10", "colorMuted", "textRight", styles.healthIntvDateTop2)}>{a.date}</span>
                                    <div className={cx(styles.healthIntvTimelineDot, toneClass(tc.color))} />
                                    <div className={cx("bgBg", "p12", styles.healthIntvTimelineCard, toneClass(tc.color))}>
                                      <div className={cx("fw600", "text13", "mb4")}>{a.action}</div>
                                      <div className={cx("text11", "colorAccent", "mb4")}>{"\u2192"} {a.outcome}</div>
                                      <div className={cx("text10", "colorMuted")}>{a.by}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {intv.nextStep && (
                            <div className={cx("bgSurface", "mt16", "p14", styles.healthIntvNextStep)}>
                              <div className={cx("text10", "colorAccent", "uppercase", "tracking", "mb4")}>Next Step</div>
                              <div className={cx("text13")}>{intv.nextStep}</div>
                            </div>
                          )}
                        </div>

                        <div className={cx("flexCol", "gap12")}>
                          {intv.notes && (
                            <div className={cx("bgSurface", "p16", styles.healthIntvPrivateNote)}>
                              <div className={cx("text10", "colorBlue", "uppercase", "tracking", "mb6")}>Notes</div>
                              <div className={cx("text12", styles.healthIntvLine16)}>{intv.notes}</div>
                            </div>
                          )}
                          <div className={cx("bgBg", "p16", styles.healthIntvRounded8)}>
                            <div className={cx("text10", "colorMuted", "uppercase", "tracking", "mb12")}>Health Impact</div>
                            <div className={cx("grid2", "gap8")}>
                              {[
                                {
                                  label: "Health Before",
                                  value: intv.healthBefore > 0 ? intv.healthBefore : "\u2014",
                                  color: intv.healthBefore > 0 && intv.healthBefore < 60 ? "var(--red)" : "var(--muted)"
                                },
                                {
                                  label: "Health After",
                                  value: intv.healthAfter !== null && intv.healthAfter > 0 ? intv.healthAfter : "\u2014",
                                  color: intv.healthAfter !== null && intv.healthAfter > 0 ? (intv.healthAfter >= 70 ? "var(--accent)" : "var(--amber)") : "var(--muted)"
                                },
                                {
                                  label: "Churn Risk Before",
                                  value: intv.churnRiskBefore > 0 ? `${intv.churnRiskBefore}%` : "\u2014",
                                  color: intv.churnRiskBefore > 50 ? "var(--red)" : "var(--muted)"
                                },
                                {
                                  label: "Churn Risk After",
                                  value: intv.churnRiskAfter !== null ? `${intv.churnRiskAfter}%` : "\u2014",
                                  color: intv.churnRiskAfter !== null ? (intv.churnRiskAfter < 30 ? "var(--accent)" : "var(--amber)") : "var(--muted)"
                                },
                              ].map((m) => (
                                <div key={m.label} className={cx("bgSurface", "textCenter", "p10", styles.healthIntvRounded6)}>
                                  <div className={cx("fontMono", "fw800", styles.healthIntvMetricVal, colorClass(m.color))}>{m.value}</div>
                                  <div className={cx("textXs", "colorMuted", "mt2")}>{m.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {intv.status === "open" && (
                            <div className={cx("flexRow", "gap8")}>
                              <button type="button" className={cx("btnSm", "btnAccent", styles.healthIntvFlex1)}>Mark Resolved</button>
                              <button type="button" className={cx("btnSm", "btnGhost", styles.healthIntvFlex1)}>Log Action</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {activeTab === "patterns" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>Most Common Triggers</div>
            {(Object.entries(triggerTypeConfig) as Array<[TriggerType, { color: string; label: string; icon: string }]>).map(([key, cfg]) => {
              const count = interventions.filter((i) => i.triggerType === key).length;
              if (count === 0) return null;
              return (
                <div key={key} className={cx("flexRow", "gap12", "mb14")}>
                  <span className={styles.healthIntvIcon16}>{cfg.icon}</span>
                  <span className={cx("text12", styles.healthIntvFlex1, colorClass(cfg.color))}>{cfg.label}</span>
                  <div className={styles.healthIntvMiniTrack}>
                    <progress
                      className={cx(styles.healthIntvMiniFill, "uiProgress", toneClass(cfg.color))}
                      max={100}
                      value={interventions.length > 0 ? (count / interventions.length) * 100 : 0}
                    />
                  </div>
                  <span className={cx("fontMono", "fw700", styles.healthIntvCountW16, colorClass(cfg.color))}>{count}</span>
                </div>
              );
            })}
            {interventions.length === 0 && (
              <div className={cx("text12", "colorMuted")}>No interventions to analyse.</div>
            )}
          </div>
          <div className={cx("card", "p24")}>
            <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>Intervention Outcomes</div>
            {[
              { label: "Resolved — health recovered",     count: resolved.length, color: "var(--accent)" },
              { label: "Open — still in progress",        count: open.length,     color: "var(--amber)"  },
              { label: "Churned despite intervention",    count: churned.length,  color: "var(--red)"    },
            ].map((o) => (
              <div key={o.label} className={cx("flexRow", "gap12", "mb14")}>
                <span className={cx("text12", styles.healthIntvFlex1, colorClass(o.color))}>{o.label}</span>
                <div className={styles.healthIntvMiniTrack}>
                  <progress
                    className={cx(styles.healthIntvMiniFill, "uiProgress", toneClass(o.color))}
                    max={100}
                    value={interventions.length > 0 ? (o.count / interventions.length) * 100 : 0}
                  />
                </div>
                <span className={cx("fontMono", "fw700", styles.healthIntvCountW16, colorClass(o.color))}>{o.count}</span>
              </div>
            ))}
            <div className={cx("bgSurface", "p16", "mt20", styles.healthIntvLearnCard)}>
              <div className={cx("text11", "colorAccent", "mb4")}>Key Learning</div>
              <div className={cx("text12", "colorMuted", styles.healthIntvLine17)}>
                Interventions triggered by NPS drops have the highest recovery rate. Invoice and quality issues are harder to recover — earlier detection is critical.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
