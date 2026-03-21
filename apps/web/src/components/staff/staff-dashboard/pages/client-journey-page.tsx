"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "@/lib/auth/session";
import { saveSession } from "@/lib/auth/session";
import { getStaffClients, type StaffClient } from "@/lib/api/staff/clients";
import { getStaffProjects, type StaffProject } from "@/lib/api/staff/projects";

type JourneyEntry = {
  client: string; avatar: string; stage: string; since: string;
  projects: number; totalRevenue: string; nps: number; milestones: string[];
};

const STAGE_ORDER: Record<string, number> = { "At Risk": 0, "Offboarding": 1, "Growing": 2, "Active": 3 };

function buildInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
}

function deriveStage(status: string): string {
  const s = status.toUpperCase();
  if (s === "AT_RISK" || s === "ATRISK") return "At Risk";
  if (s === "OFFBOARDING" || s === "INACTIVE") return "Offboarding";
  if (s === "GROWING" || s === "SCALING") return "Growing";
  return "Active";
}

function deriveMilestones(status: string): string[] {
  const stage = deriveStage(status);
  if (stage === "Offboarding") return ["Onboarded", "Active", "Offboarding"];
  if (stage === "At Risk") return ["Onboarded", "Active", "At Risk"];
  if (stage === "Growing") return ["Onboarded", "Active", "Growing"];
  return ["Onboarded", "Active"];
}

function buildJourneys(clients: StaffClient[], projects: StaffProject[]): JourneyEntry[] {
  const projectsByClient = new Map<string, StaffProject[]>();
  for (const p of projects) {
    const list = projectsByClient.get(p.clientId) ?? [];
    list.push(p);
    projectsByClient.set(p.clientId, list);
  }
  return clients.map((c) => {
    const clientProjects = projectsByClient.get(c.id) ?? [];
    const totalCents = clientProjects.reduce((s, p) => s + (p.budgetCents ?? 0), 0);
    const totalRand = Math.round(totalCents / 100);
    return {
      client: c.name,
      avatar: buildInitials(c.name),
      stage: deriveStage(c.status),
      since: new Date(c.createdAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }),
      projects: clientProjects.length,
      totalRevenue: totalRand >= 1_000_000 ? `R${(totalRand / 1_000_000).toFixed(1)}M`
        : totalRand >= 1_000 ? `R${Math.round(totalRand / 1_000)}K`
        : `R${totalRand}`,
      nps: 0,
      milestones: deriveMilestones(c.status),
    };
  });
}

function parseValue(val: string): number {
  return parseInt(val.replace(/[^0-9]/g, ""), 10);
}

function formatTotal(n: number): string {
  if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `R${Math.round(n / 1_000)}K`;
  return `R${n}`;
}

function npsColorCls(nps: number): string {
  if (nps >= 9) return "colorGreen";
  if (nps >= 7) return "colorAmber";
  return "colorRed";
}

function stageBadgeCls(stage: string): string {
  if (stage === "Active")      return "cjStageActive";
  if (stage === "Growing")     return "cjStageGrowing";
  if (stage === "At Risk")     return "cjStageAtRisk";
  if (stage === "Offboarding") return "cjStageOffboarding";
  return "";
}

function stageStripCls(stage: string): string {
  if (stage === "Active")      return "cjCardActive";
  if (stage === "Growing")     return "cjCardGrowing";
  if (stage === "At Risk")     return "cjCardAtRisk";
  if (stage === "Offboarding") return "cjCardOffboarding";
  return "";
}

function avatarCls(avatar: string): string {
  const map: Record<string, string> = {
    VS: "cjAvatarAccent",
    KC: "cjAvatarBlue",
    MH: "cjAvatarGreen",
    DC: "cjAvatarAmber",
    OS: "cjAvatarPurple",
  };
  return map[avatar] ?? "cjAvatarAccent";
}

export function ClientJourneyPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [journeys, setJourneys] = useState<JourneyEntry[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void Promise.all([
      getStaffClients(session),
      getStaffProjects(session),
    ]).then(([clientsRes, projectsRes]) => {
      if (cancelled) return;
      if (clientsRes.nextSession) saveSession(clientsRes.nextSession);
      if (projectsRes.nextSession) saveSession(projectsRes.nextSession);
      if (!clientsRes.error && clientsRes.data && !projectsRes.error && projectsRes.data) {
        setJourneys(buildJourneys(clientsRes.data, projectsRes.data));
      }
    }).catch(() => {
      // keep previous state on error
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const totalClients = journeys.length;
  const healthyCount = journeys.filter((j) => j.stage === "Active" || j.stage === "Growing").length;
  const atRiskCount  = journeys.filter((j) => j.stage === "At Risk").length;
  const totalRevenue = journeys.reduce((s, j) => s + parseValue(j.totalRevenue), 0);

  const sorted = [...journeys].sort((a, b) =>
    (STAGE_ORDER[a.stage] ?? 99) - (STAGE_ORDER[b.stage] ?? 99)
  );

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-journey">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-journey">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Client Journey</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Lifecycle stage visualization per client</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("staffKpiStrip", "staffKpiStripFour")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Clients</div>
          <div className={cx("staffKpiValue", "colorAccent")}>{totalClients}</div>
          <div className={cx("staffKpiSub")}>total managed</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Healthy</div>
          <div className={cx("staffKpiValue", "colorGreen")}>{healthyCount}</div>
          <div className={cx("staffKpiSub")}>active or growing</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>At Risk</div>
          <div className={cx("staffKpiValue", atRiskCount > 0 ? "colorRed" : "colorGreen")}>{atRiskCount}</div>
          <div className={cx("staffKpiSub")}>{atRiskCount > 0 ? "needs attention" : "none flagged"}</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Total Revenue</div>
          <div className={cx("staffKpiValue", "colorAccent")}>{formatTotal(totalRevenue)}</div>
          <div className={cx("staffKpiSub")}>lifetime billed</div>
        </div>
      </div>

      {/* ── Journey cards ─────────────────────────────────────────────────── */}
      <div className={cx("cjSection")}>

        <div className={cx("staffSectionHd")}>
          <div className={cx("staffSectionTitle")}>Client Lifecycles</div>
          <span className={cx("staffChip")}>{journeys.length} CLIENTS</span>
        </div>

        {loading ? (
          <div className={cx("flexCol", "gap8")}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={cx("staffCard", "opacity45")}>
                <div className={cx("staffListRow")}>
                  <div className={cx("staffClientAvatar", "bgS3")}>&nbsp;</div>
                  <div className={cx("flex1")}>
                    <div className={cx("skeleBlock12x50p")} />
                    <div className={cx("skeleBlock10x30p")} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className={cx("staffEmpty")}>
            <div className={cx("staffEmptyIcon")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={cx("staffEmptyTitle")}>No client journeys found</div>
            <div className={cx("staffEmptyNote")}>Journey data will appear once clients have active projects with milestones.</div>
          </div>
        ) : (
          <div className={cx("flexCol", "gap8")}>
            {sorted.map((j) => (
              <div
                key={j.client}
                className={cx(
                  "staffCard",
                  "staffClientCard",
                  j.stage === "At Risk" ? "staffClientToneRed"
                    : j.stage === "Offboarding" ? "staffClientToneAmber"
                    : j.stage === "Growing" ? "staffClientToneAccent"
                    : "staffClientToneGreen"
                )}
              >
                {/* Head: avatar + name + stage badge */}
                <div className={cx("staffListRow")}>
                  <div className={cx("staffClientAvatar", avatarCls(j.avatar))}>{j.avatar}</div>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("cjClientName")}>{j.client}</div>
                    <div className={cx("cjClientSince")}>Since {j.since}</div>
                  </div>
                  <span className={cx(
                    "staffChip",
                    j.stage === "Active" ? "staffChipGreen"
                      : j.stage === "Growing" ? "staffChipAccent"
                      : j.stage === "At Risk" ? "staffChipRed"
                      : "staffChipAmber"
                  )}>{j.stage}</span>
                </div>

                {/* Metrics strip */}
                <div className={cx("staffCardMetricGrid")}>
                  <div className={cx("staffCardMetricCell")}>
                    <div className={cx("staffCardMetricLabel")}>Projects</div>
                    <div className={cx("staffCardMetricValue")}>{j.projects}</div>
                  </div>
                  <div className={cx("staffCardMetricCell")}>
                    <div className={cx("staffCardMetricLabel")}>Revenue</div>
                    <div className={cx("staffCardMetricValue", "colorAccent")}>{j.totalRevenue}</div>
                  </div>
                  <div className={cx("staffCardMetricCell")}>
                    <div className={cx("staffCardMetricLabel")}>NPS</div>
                    <div className={cx("staffCardMetricValue", npsColorCls(j.nps))}>
                      {j.nps}<span className={cx("staffKpiSub")}>/10</span>
                    </div>
                  </div>
                  <div className={cx("staffCardMetricCell")}>
                    <div className={cx("staffCardMetricLabel")}>Stage</div>
                    <div className={cx("staffCardMetricValue")}>{j.stage}</div>
                  </div>
                </div>

                {/* Milestone track */}
                <div className={cx("staffMilestoneTrack")}>
                  {j.milestones.map((m, i) => (
                    <div key={m} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div className={cx("staffMilestoneDot", i === j.milestones.length - 1 && "staffMilestoneDotActive")} />
                      <span className={cx("staffMilestoneLabel", i === j.milestones.length - 1 && "staffMilestoneLabelActive")}>{m}</span>
                      {i < j.milestones.length - 1 && <span className={cx("staffMilestoneArrow")}>›</span>}
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </section>
  );
}
