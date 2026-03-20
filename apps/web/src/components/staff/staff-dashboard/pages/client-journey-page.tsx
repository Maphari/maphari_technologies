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
      <div className={cx("cjStatGrid")}>

        <div className={cx("cjStatCard")}>
          <div className={cx("cjStatCardTop")}>
            <div className={cx("cjStatLabel")}>Clients</div>
            <div className={cx("cjStatValue", "colorAccent")}>{totalClients}</div>
          </div>
          <div className={cx("cjStatCardDivider")} />
          <div className={cx("cjStatCardBottom")}>
            <span className={cx("cjStatDot", "dotBgAccent")} />
            <span className={cx("cjStatMeta")}>total managed</span>
          </div>
        </div>

        <div className={cx("cjStatCard")}>
          <div className={cx("cjStatCardTop")}>
            <div className={cx("cjStatLabel")}>Healthy</div>
            <div className={cx("cjStatValue", "colorGreen")}>{healthyCount}</div>
          </div>
          <div className={cx("cjStatCardDivider")} />
          <div className={cx("cjStatCardBottom")}>
            <span className={cx("cjStatDot", "dotBgGreen")} />
            <span className={cx("cjStatMeta")}>active or growing</span>
          </div>
        </div>

        <div className={cx("cjStatCard")}>
          <div className={cx("cjStatCardTop")}>
            <div className={cx("cjStatLabel")}>At Risk</div>
            <div className={cx("cjStatValue", atRiskCount > 0 ? "colorRed" : "colorGreen")}>{atRiskCount}</div>
          </div>
          <div className={cx("cjStatCardDivider")} />
          <div className={cx("cjStatCardBottom")}>
            <span className={cx("cjStatDot", "dynBgColor")} style={{ "--bg-color": atRiskCount > 0 ? "var(--red)" : "var(--green)" } as React.CSSProperties} />
            <span className={cx("cjStatMeta")}>{atRiskCount > 0 ? "needs attention" : "none flagged"}</span>
          </div>
        </div>

        <div className={cx("cjStatCard")}>
          <div className={cx("cjStatCardTop")}>
            <div className={cx("cjStatLabel")}>Total Revenue</div>
            <div className={cx("cjStatValue", "colorAccent")}>{formatTotal(totalRevenue)}</div>
          </div>
          <div className={cx("cjStatCardDivider")} />
          <div className={cx("cjStatCardBottom")}>
            <span className={cx("cjStatDot", "dotBgAccent")} />
            <span className={cx("cjStatMeta")}>lifetime billed</span>
          </div>
        </div>

      </div>

      {/* ── Journey cards ─────────────────────────────────────────────────── */}
      <div className={cx("cjSection")}>

        <div className={cx("cjSectionHeader")}>
          <div className={cx("cjSectionTitle")}>Client Lifecycles</div>
          <span className={cx("cjSectionMeta")}>{journeys.length} CLIENTS</span>
        </div>

        {loading ? (
          <div className={cx("cjList")}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={cx("cjCard", "opacity45")}>
                <div className={cx("cjCardHead")}>
                  <div className={cx("cjAvatar", "cjAvatarAccent", "bgS3")}>&nbsp;</div>
                  <div className={cx("cjHeadBody")}>
                    <div className={cx("skeleBlock12x50p")} />
                    <div className={cx("skeleBlock10x30p")} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className={cx("cjList")}>
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className={cx("emptyStateTitle")}>No client journeys found</div>
              <div className={cx("emptyStateSub")}>Journey data will appear once clients have active projects with milestones.</div>
            </div>
          </div>
        ) : (
          <div className={cx("cjList")}>
            {sorted.map((j, idx) => (
              <div
                key={j.client}
                className={cx(
                  "cjCard",
                  stageStripCls(j.stage),
                  idx === sorted.length - 1 && "cjCardLast",
                )}
              >

                {/* Head: avatar + name + stage badge */}
                <div className={cx("cjCardHead")}>
                  <div className={cx("cjAvatar", avatarCls(j.avatar))}>{j.avatar}</div>
                  <div className={cx("cjHeadBody")}>
                    <div className={cx("cjClientName")}>{j.client}</div>
                    <div className={cx("cjClientSince")}>Since {j.since}</div>
                  </div>
                  <span className={cx("cjStageBadge", stageBadgeCls(j.stage))}>{j.stage}</span>
                </div>

                {/* Metrics strip: projects · revenue · NPS */}
                <div className={cx("cjMetricsRow")}>
                  <div className={cx("cjMetricCell")}>
                    <span className={cx("cjMetricLabel")}>Projects</span>
                    <span className={cx("cjMetricValue")}>{j.projects}</span>
                  </div>
                  <div className={cx("cjMetricSep")} />
                  <div className={cx("cjMetricCell")}>
                    <span className={cx("cjMetricLabel")}>Revenue</span>
                    <span className={cx("cjMetricValue", "colorAccent")}>{j.totalRevenue}</span>
                  </div>
                  <div className={cx("cjMetricSep")} />
                  <div className={cx("cjMetricCell")}>
                    <span className={cx("cjMetricLabel")}>NPS</span>
                    <span className={cx("cjMetricValue", npsColorCls(j.nps))}>
                      {j.nps}<span className={cx("cjMetricSuffix")}>/10</span>
                    </span>
                  </div>
                </div>

                {/* Milestone track */}
                <div className={cx("cjMilestoneTrack")}>
                  {j.milestones.map((m, i) => (
                    <div key={m} className={cx("cjMilestoneItem")}>
                      <div className={cx("cjMilestoneDot", i === j.milestones.length - 1 && "cjMilestoneDotActive")} />
                      <span className={cx("cjMilestoneLabel", i === j.milestones.length - 1 && "cjMilestoneLabelActive")}>{m}</span>
                      {i < j.milestones.length - 1 && <span className={cx("cjMilestoneArrow")}>›</span>}
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
