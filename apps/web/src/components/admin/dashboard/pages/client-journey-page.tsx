"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { queueAutomationJobWithRefresh } from "../../../../lib/api/admin/automation";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type JourneyTab = "journey map" | "handoff health" | "stage aging" | "moments";
type JourneyStage = "Acquisition" | "Onboarding" | "Adoption" | "Value" | "Renewal" | "Advocacy";

function daysFromNow(value?: string | null): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.ceil((ms - Date.now()) / 86400000);
}

function daysSince(value?: string | null): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.floor((Date.now() - ms) / 86400000));
}

function stageColor(stage: JourneyStage): string {
  if (stage === "Acquisition") return "var(--blue)";
  if (stage === "Onboarding") return "var(--amber)";
  if (stage === "Adoption") return "var(--blue)";
  if (stage === "Value") return "var(--accent)";
  if (stage === "Renewal") return "var(--amber)";
  return "var(--accent)";
}

function riskColor(level: "Low" | "Medium" | "High"): string {
  if (level === "High") return "var(--red)";
  if (level === "Medium") return "var(--amber)";
  return "var(--accent)";
}

function money(amountCents: number, currency?: string): string {
  const code = currency && currency !== "AUTO" ? currency : undefined;
  return formatMoneyCents(amountCents, { currency: code, maximumFractionDigits: 0 });
}

function stageForClient(input: {
  status: string;
  wonLeads: number;
  projectsCount: number;
  activeProjects: number;
  avgProgress: number;
  overdueInvoices: number;
  renewalDays: number | null;
}): JourneyStage {
  if (input.wonLeads === 0) return "Acquisition";
  if (input.status === "ONBOARDING") return "Onboarding";
  if (input.projectsCount === 0) return "Acquisition";
  if (input.activeProjects > 0 && input.avgProgress < 60) return "Adoption";
  if (input.activeProjects > 0 && input.avgProgress >= 60) return "Value";
  if (input.renewalDays !== null && input.renewalDays <= 60) return "Renewal";
  if (input.overdueInvoices === 0) return "Advocacy";
  return "Value";
}

function riskForClient(input: {
  overdueInvoices: number;
  blockedProjects: number;
  paused: boolean;
  renewalDays: number | null;
  staleDays: number;
}): "Low" | "Medium" | "High" {
  let score = 0;
  score += input.overdueInvoices * 2;
  score += input.blockedProjects * 2;
  if (input.paused) score += 2;
  if (input.renewalDays !== null && input.renewalDays <= 30) score += 1;
  if (input.staleDays >= 14) score += 1;
  if (score >= 5) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

// ── New helpers for redesign ──────────────────────────────────────

function riskStripCls(risk: "Low" | "Medium" | "High"): string {
  if (risk === "High")   return styles.cjStripRed;
  if (risk === "Medium") return styles.cjStripAmber;
  return styles.cjStripAccent;
}

function stageFillCls(color: string): string {
  if (color === "var(--blue)")  return styles.cjFillBlue;
  if (color === "var(--amber)") return styles.cjFillAmber;
  return styles.cjFillAccent;
}

function ageBarTone(days: number): string {
  if (days >= 45) return "toneRed";
  if (days >= 21) return "toneAmber";
  return "toneMuted";
}

function ageBarFillCls(days: number): string {
  if (days >= 45) return styles.cjFillRed;
  if (days >= 21) return styles.cjFillAmber;
  return styles.cjFillMuted;
}

export function ClientJourneyPage({
  snapshot,
  session,
  onNotify,
  currency
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  onNotify: (tone: "success" | "error", message: string) => void;
  currency: string;
}) {
  const [activeTab, setActiveTab] = useState<JourneyTab>("journey map");
  const [stageFilter, setStageFilter] = useState<"ALL" | JourneyStage>("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "Low" | "Medium" | "High">("ALL");
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL");

  const rows = useMemo(() => {
    return snapshot.clients.map((client) => {
      const leads = snapshot.leads.filter((lead) => lead.clientId === client.id);
      const projects = snapshot.projects.filter((project) => project.clientId === client.id);
      const invoices = snapshot.invoices.filter((invoice) => invoice.clientId === client.id);

      const wonLeads = leads.filter((lead) => lead.status === "WON").length;
      const activeProjects = projects.filter((project) => ["IN_PROGRESS", "PLANNING", "REVIEW"].includes(project.status)).length;
      const blockedProjects = projects.filter((project) => ["BLOCKED", "DELAYED", "ON_HOLD"].includes(project.status)).length;
      const avgProgress = projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.progressPercent, 0) / projects.length) : 0;
      const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
      const renewalDays = daysFromNow(client.contractRenewalAt);
      const staleDays = daysSince(client.updatedAt);
      const owner = projects[0]?.ownerName ?? client.ownerName ?? "Unassigned";
      const stage = stageForClient({
        status: client.status,
        wonLeads,
        projectsCount: projects.length,
        activeProjects,
        avgProgress,
        overdueInvoices,
        renewalDays
      });
      const risk = riskForClient({
        overdueInvoices,
        blockedProjects,
        paused: client.status === "PAUSED",
        renewalDays,
        staleDays
      });

      const journeyAgeDays = (() => {
        if (stage === "Acquisition") {
          const latestLead = leads.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];
          return daysSince(latestLead?.updatedAt ?? client.createdAt);
        }
        if (stage === "Onboarding") return daysSince(client.createdAt);
        const latestProject = projects.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];
        return daysSince(latestProject?.updatedAt ?? client.updatedAt);
      })();

      const handoffGapDays = wonLeads > 0 && projects.length === 0
        ? daysSince(leads.find((lead) => lead.status === "WON")?.updatedAt ?? client.createdAt)
        : 0;

      const nextMilestone =
        stage === "Acquisition"
          ? "Lead to kickoff handoff"
          : stage === "Onboarding"
            ? "First value checkpoint"
            : stage === "Adoption"
              ? "Usage depth target"
              : stage === "Value"
                ? "Expansion trigger"
                : stage === "Renewal"
                  ? "Renewal close plan"
                  : "Advocacy motion";

      return {
        ...client,
        owner,
        stage,
        risk,
        staleDays,
        journeyAgeDays,
        handoffGapDays,
        wonLeads,
        projectsCount: projects.length,
        activeProjects,
        blockedProjects,
        avgProgress,
        overdueInvoices,
        renewalDays,
        outstandingCents: invoices
          .filter((invoice) => invoice.status !== "PAID" && invoice.status !== "VOID")
          .reduce((sum, invoice) => sum + invoice.amountCents, 0),
        nextMilestone
      };
    });
  }, [snapshot.clients, snapshot.invoices, snapshot.leads, snapshot.projects]);

  const owners = useMemo(
    () => ["ALL", ...Array.from(new Set(rows.map((row) => row.owner)))],
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (stageFilter !== "ALL" && row.stage !== stageFilter) return false;
      if (riskFilter !== "ALL" && row.risk !== riskFilter) return false;
      if (ownerFilter !== "ALL" && row.owner !== ownerFilter) return false;
      return true;
    });
  }, [rows, stageFilter, riskFilter, ownerFilter]);

  const handoffGaps = filtered.filter((row) => row.handoffGapDays > 0);
  const riskHigh = filtered.filter((row) => row.risk === "High").length;
  const renewalWindow = filtered.filter((row) => row.renewalDays !== null && row.renewalDays <= 60).length;
  const advocacyReady = filtered.filter((row) => row.stage === "Advocacy" && row.risk === "Low").length;

  const moments = useMemo(() => {
    const rowsFromRenewals = filtered
      .filter((row) => row.renewalDays !== null && row.renewalDays >= 0 && row.renewalDays <= 45)
      .map((row) => ({
        client: row.name,
        owner: row.owner,
        label: "Renewal window",
        when: row.renewalDays ?? 0,
        severity: row.risk === "High" ? "high" : "medium"
      }));

    const rowsFromHandoffs = filtered
      .filter((row) => row.handoffGapDays >= 3)
      .map((row) => ({
        client: row.name,
        owner: row.owner,
        label: "Lead-to-project handoff lag",
        when: row.handoffGapDays,
        severity: row.handoffGapDays >= 10 ? "high" : "medium"
      }));

    return [...rowsFromRenewals, ...rowsFromHandoffs]
      .sort((a, b) => a.when - b.when)
      .slice(0, 8);
  }, [filtered]);

  const canAct = session?.user.role === "ADMIN" || session?.user.role === "STAFF";

  const handleQueueIntervention = useCallback(async (clientId?: string) => {
    if (!session) return;
    const result = await queueAutomationJobWithRefresh(session, { type: "INTERVENTION_DIGEST", ...(clientId && { clientId }) });
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error) {
      onNotify("success", "Intervention digest queued.");
    } else {
      onNotify("error", result.error.message ?? "Failed to queue job.");
    }
  }, [session, onNotify]);

  // Stage distribution (unfiltered counts)
  const total = rows.length || 1;
  const allStages: Array<{ label: JourneyStage; strip: string }> = [
    { label: "Acquisition", strip: styles.cjStripBlue   },
    { label: "Onboarding",  strip: styles.cjStripAmber  },
    { label: "Adoption",    strip: styles.cjStripBlue   },
    { label: "Value",       strip: styles.cjStripAccent },
    { label: "Renewal",     strip: styles.cjStripAmber  },
    { label: "Advocacy",    strip: styles.cjStripAccent },
  ];

  const lifecycleChecks = [
    {
      label: "Project to Billing",
      value: filtered.filter((row) => row.activeProjects === 0 && row.outstandingCents > 0).length,
      note: "Completed delivery with unresolved billing"
    },
    {
      label: "Billing to Retention",
      value: filtered.filter((row) => row.renewalDays !== null && row.renewalDays <= 60 && row.overdueInvoices > 0).length,
      note: "Renewal soon while invoice risk remains"
    },
    {
      label: "Onboarding to Adoption",
      value: filtered.filter((row) => row.stage === "Onboarding" && row.journeyAgeDays > 21).length,
      note: "Onboarding beyond 21 days"
    }
  ];

  return (
    <div className={styles.pageBody}>

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>EXPERIENCE / CLIENT JOURNEY</div>
          <h1 className={styles.pageTitle}>Client Journey</h1>
          <div className={styles.pageSub}>Lifecycle orchestration &middot; Stage flow &middot; Handoff reliability</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Journey</button>
        </div>
      </div>

      {/* ── 4 KPI cards ── */}
      <div className={styles.cjKpiGrid}>
        {([
          { label: "Tracked Accounts",    value: filtered.length.toString(),   sub: `${riskHigh} high risk`,           color: "var(--accent)" },
          { label: "Handoff Gaps",         value: handoffGaps.length.toString(), sub: "Won leads without project",       color: handoffGaps.length > 0 ? "var(--red)" : "var(--accent)" },
          { label: "Renewal Window (60d)", value: renewalWindow.toString(),      sub: "Needs retention plan",            color: renewalWindow > 0 ? "var(--amber)" : "var(--accent)" },
          { label: "Advocacy Ready",       value: advocacyReady.toString(),      sub: "Low risk + post-value",           color: "var(--blue)" },
        ] as const).map((kpi) => (
          <div key={kpi.label} className={cx(styles.cjKpiCard, toneClass(kpi.color))}>
            <div className={styles.cjKpiLabel}>{kpi.label}</div>
            <div className={cx(styles.cjKpiValue, toneClass(kpi.color))}>{kpi.value}</div>
            <div className={styles.cjKpiMeta}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Stage distribution rail ── */}
      <div className={styles.cjStageRail}>
        {allStages.map((s) => {
          const count = rows.filter((r) => r.stage === s.label).length;
          return (
            <div key={s.label} className={`${styles.cjStageTile} ${s.strip}`}>
              <div className={styles.cjStageTileLabel}>{s.label}</div>
              <div className={styles.cjStageTileCount}>{count}</div>
              <div className={styles.cjStageTilePct}>{Math.round((count / total) * 100)}% of accounts</div>
            </div>
          );
        })}
      </div>

      {/* ── Filter bar ── */}
      <div className={styles.cjFilters}>
        <select title="Filter by stage" value={stageFilter} onChange={(e) => setStageFilter(e.target.value as typeof stageFilter)} className={styles.filterSelect}>
          <option value="ALL">All stages</option>
          {(["Acquisition", "Onboarding", "Adoption", "Value", "Renewal", "Advocacy"] as JourneyStage[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select title="Filter by risk" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)} className={styles.filterSelect}>
          <option value="ALL">All risk</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select title="Filter by owner" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className={styles.filterSelect}>
          {owners.map((owner) => (
            <option key={owner} value={owner}>{owner === "ALL" ? "All owners" : owner}</option>
          ))}
        </select>
        <select title="Select tab" value={activeTab} onChange={(e) => setActiveTab(e.target.value as JourneyTab)} className={cx(styles.filterSelect, "mlAuto")}>
          <option value="journey map">Journey Map</option>
          <option value="handoff health">Handoff Health</option>
          <option value="stage aging">Stage Aging</option>
          <option value="moments">Moments</option>
        </select>
      </div>

      {/* ══════════════════════════════════════════════════════════
          JOURNEY MAP TAB
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "journey map" && (
        <div className={styles.cjSection}>
          <div className={styles.cjSectionHeader}>
            <span className={styles.cjSectionTitle}>Journey Map</span>
            <span className={styles.cjSectionMeta}>{filtered.length} ACCOUNTS</span>
          </div>
          <div className={styles.cjMapHead}>
            <span>Client</span>
            <span>Stage</span>
            <span>Risk</span>
            <span>Journey Age</span>
            <span>Renewal</span>
            <span>Outstanding</span>
            <span>Next Milestone</span>
          </div>
          {filtered.map((row) => (
            <div key={row.id} className={`${styles.cjMapRow} ${riskStripCls(row.risk)}`}>
              <div>
                <div className={styles.cjClientName}>{row.name}</div>
                <div className={styles.cjClientSub}>{row.owner}</div>
              </div>
              <span className={cx("journeyStageTag", toneClass(stageColor(row.stage)))}>{row.stage}</span>
              <span className={cx("fontMono", "text11", "journeyToneText", toneClass(riskColor(row.risk)))}>{row.risk}</span>
              <div className={styles.cjAgeCell}>
                <span className={cx("fontMono", "text11", "journeyToneText", ageBarTone(row.journeyAgeDays))}>{row.journeyAgeDays}d</span>
                <div className={styles.cjAgeTrack}>
                  <div
                    className={`${styles.cjAgeFill} ${ageBarFillCls(row.journeyAgeDays)}`}
                    style={{ "--pct": `${Math.min(100, (row.journeyAgeDays / 90) * 100)}%` } as CSSProperties}
                  />
                </div>
              </div>
              <span className={cx("fontMono", "text11", "journeyToneText", row.renewalDays !== null && row.renewalDays <= 30 ? "toneAmber" : "toneMuted")}>
                {row.renewalDays === null ? "Not set" : `${row.renewalDays}d`}
              </span>
              <span className={cx("fontMono", "text11", "journeyToneText", row.outstandingCents > 0 ? "toneRed" : "toneMuted")}>
                {money(row.outstandingCents, currency)}
              </span>
              <span className={cx("text11", "colorMuted")}>{row.nextMilestone}</span>
            </div>
          ))}
          {filtered.length === 0 && <div className={styles.cjEmptyState}>No accounts match your filters.</div>}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          HANDOFF HEALTH TAB
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "handoff health" && (
        <div className={cx("grid2", "gap16")}>

          {/* Lead to Delivery Handoffs */}
          <div className={cx("card", "p0", "overflowHidden")}>
            <div className={styles.cjCardHead}>
              <span className={styles.cjCardTitle}>Lead to Delivery Handoffs</span>
              <span className={cx("fontMono", "fw700", "text13", "journeyToneText", handoffGaps.length > 0 ? "toneRed" : "toneAccent")}>
                {handoffGaps.length}
              </span>
            </div>
            <div className={styles.cjCardBody}>
              {handoffGaps.length > 0 ? handoffGaps.map((row) => (
                <div key={row.id} className={styles.cjHandoffRow}>
                  <div>
                    <div className={styles.cjHandoffClient}>{row.name}</div>
                    <div className={cx("text11", "colorMuted")}>Won lead but no project kickoff yet.</div>
                  </div>
                  <div className={styles.cjHandoffLag}>
                    <span className={cx("fontMono", "fw700", "journeyToneText", row.handoffGapDays >= 10 ? "toneRed" : "toneAmber")}>
                      {row.handoffGapDays}d
                    </span>
                    <span className={cx("text10", "colorMuted")}>lag</span>
                  </div>
                </div>
              )) : (
                <div className={styles.cjEmptyState}>No active lead-to-project handoff gaps.</div>
              )}
            </div>
          </div>

          {/* Lifecycle Handoff Checks */}
          <div className={cx("card", "p0", "overflowHidden")}>
            <div className={styles.cjCardHead}>
              <span className={styles.cjCardTitle}>Lifecycle Handoff Checks</span>
            </div>
            <div className={styles.cjCardBody}>
              {lifecycleChecks.map((item) => (
                <div key={item.label} className={styles.cjCheckRow}>
                  <div>
                    <div className={styles.cjCheckLabel}>{item.label}</div>
                    <div className={cx("text11", "colorMuted")}>{item.note}</div>
                  </div>
                  <div className={cx(styles.cjCheckBadge, item.value > 0 ? "toneRed" : "toneAccent")}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STAGE AGING TAB
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "stage aging" && (
        <div className={styles.cjSection}>
          <div className={styles.cjSectionHeader}>
            <span className={styles.cjSectionTitle}>Stage Aging</span>
            <span className={styles.cjSectionMeta}>SORTED BY AGE</span>
          </div>
          <div className={styles.cjAgingHead}>
            <span>Client</span>
            <span>Stage</span>
            <span>Age in Stage</span>
            <span>Risk</span>
            <span>Primary Friction</span>
          </div>
          {[...filtered].sort((a, b) => b.journeyAgeDays - a.journeyAgeDays).map((row) => (
            <div key={row.id} className={`${styles.cjAgingRow} ${riskStripCls(row.risk)}`}>
              <span className={cx("text12", "fw600")}>{row.name}</span>
              <span className={cx("journeyStageTag", toneClass(stageColor(row.stage)))}>{row.stage}</span>
              <div className={styles.cjAgeCell}>
                <span className={cx("fontMono", "text11", "journeyToneText", ageBarTone(row.journeyAgeDays))}>
                  {row.journeyAgeDays}d
                </span>
                <div className={styles.cjAgeTrack}>
                  <div
                    className={`${styles.cjAgeFill} ${ageBarFillCls(row.journeyAgeDays)}`}
                    style={{ "--pct": `${Math.min(100, (row.journeyAgeDays / 90) * 100)}%` } as CSSProperties}
                  />
                </div>
              </div>
              <span className={cx("fontMono", "text11", "journeyToneText", toneClass(riskColor(row.risk)))}>{row.risk}</span>
              <span className={cx("text11", "colorMuted")}>
                {row.handoffGapDays > 0
                  ? "Lead handoff lag"
                  : row.overdueInvoices > 0
                    ? "Unresolved billing"
                    : row.blockedProjects > 0
                      ? "Blocked delivery work"
                      : row.renewalDays !== null && row.renewalDays <= 45
                        ? "Renewal prep"
                        : "Execution cadence"}
              </span>
            </div>
          ))}
          {filtered.length === 0 && <div className={styles.cjEmptyState}>No accounts available.</div>}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MOMENTS TAB
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "moments" && (
        <div className={styles.cjMomentsSplit}>

          {/* Upcoming Journey Moments */}
          <div className={cx("card", "p0", "overflowHidden")}>
            <div className={styles.cjCardHead}>
              <span className={styles.cjCardTitle}>Upcoming Journey Moments</span>
            </div>
            <div className={styles.cjCardBody}>
              {moments.length > 0 ? moments.map((moment, i) => (
                <div
                  key={`${moment.client}-${i}`}
                  className={`${styles.cjMomentRow}${moment.severity === "high" ? ` ${styles.cjMomentHigh}` : ""}`}
                >
                  <div>
                    <div className={styles.cjMomentClient}>{moment.client}</div>
                    <div className={cx("text11", "colorMuted")}>{moment.label} &middot; Owner: {moment.owner}</div>
                  </div>
                  <div className={cx(styles.cjMomentWhen, moment.severity === "high" ? "toneRed" : "toneAmber")}>
                    <span className={cx("fontMono", "fw800")}>{moment.when}d</span>
                    <span className={cx("text10", "colorMuted")}>away</span>
                  </div>
                </div>
              )) : (
                <div className={styles.cjEmptyState}>No lifecycle moments in the current window.</div>
              )}
            </div>
          </div>

          {/* Lifecycle Actions */}
          <div className={cx("card", "p0", "overflowHidden")}>
            <div className={styles.cjCardHead}>
              <span className={styles.cjCardTitle}>Lifecycle Actions</span>
            </div>
            <div className={cx(styles.cjCardBody, "p20")}>
              <div className={cx("text11", "colorMuted", "mb16", "lineH6")}>
                This page tracks transition quality across lifecycle stages. Onboarding task detail, offboarding processes, satisfaction surveys, and communication logs stay in their dedicated pages.
              </div>
              <button
                type="button"
                onClick={() => void handleQueueIntervention()}
                disabled={!canAct}
                className={cx("btnSm", "btnAccent", "wFull", "mb8", !canAct && "opacity50")}
              >
                Queue Intervention Digest
              </button>
              <button
                type="button"
                onClick={() => onNotify("success", "Lifecycle handoff summary generated.")}
                disabled={!canAct}
                className={cx("btnSm", "btnGhost", "wFull", !canAct && "opacity50")}
              >
                Generate Handoff Summary
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
