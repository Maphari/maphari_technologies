"use client";

import { useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
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

function resolveCurrency(input?: string): string {
  if (!input || input === "AUTO") return "ZAR";
  return input;
}

function money(amountCents: number, currency?: string): string {
  const code = resolveCurrency(currency);
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0
    }).format(amountCents / 100);
  } catch {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0
    }).format(amountCents / 100);
  }
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

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 className={styles.pageTitle}>Client Journey</h1>
          <div className={styles.pageSub}>Lifecycle orchestration · Stage flow · Handoff reliability</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Journey</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Tracked Accounts", value: filtered.length.toString(), sub: `${riskHigh} high risk`, color: "var(--accent)" },
          { label: "Handoff Gaps", value: handoffGaps.length.toString(), sub: "Won leads without project", color: handoffGaps.length > 0 ? "var(--red)" : "var(--accent)" },
          { label: "Renewal Window (60d)", value: renewalWindow.toString(), sub: "Needs retention plan", color: renewalWindow > 0 ? "var(--amber)" : "var(--accent)" },
          { label: "Advocacy Ready", value: advocacyReady.toString(), sub: "Low risk + post-value", color: "var(--blue)" }
        ].map((k) => (
          <div key={k.label} className={styles.statCard}>
            <div className={styles.statLabel}>{k.label}</div>
            <div className={cx(styles.statValue, "journeyToneText", toneClass(k.color))}>{k.value}</div>
            <div className={cx("text11", "colorMuted")}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className={cx("card", "p14", "mb12")}>
        <div className={cx("flexRow", "gap10", "flexWrap")}>
          <select title="Filter by stage" value={stageFilter} onChange={(e) => setStageFilter(e.target.value as typeof stageFilter)} className={styles.formInput}>
            <option value="ALL">All stages</option>
            {(["Acquisition", "Onboarding", "Adoption", "Value", "Renewal", "Advocacy"] as JourneyStage[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select title="Filter by risk" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)} className={styles.formInput}>
            <option value="ALL">All risk</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select title="Filter by owner" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className={styles.formInput}>
            {owners.map((owner) => (
              <option key={owner} value={owner}>{owner === "ALL" ? "All owners" : owner}</option>
            ))}
          </select>

          <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as JourneyTab)} className={cx(styles.filterSelect, "mlAuto")}>
            <option value="journey map">journey map</option>
            <option value="handoff health">handoff health</option>
            <option value="stage aging">stage aging</option>
            <option value="moments">moments</option>
          </select>
        </div>
      </div>

      {activeTab === "journey map" ? (
        <div className={cx("card", "overflowHidden")}>
          <div className={cx("journeyMapHead", "fontMono", "text10", "colorMuted", "uppercase")}>
            {["Client", "Stage", "Risk", "Journey Age", "Renewal", "Outstanding", "Next Milestone"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {filtered.map((row) => (
            <div key={row.id} className={styles.journeyMapRow}>
              <div>
                <div className={cx("text13", "fw700")}>{row.name}</div>
                <div className={cx("text11", "colorMuted")}>{row.owner}</div>
              </div>
              <span className={cx("text10", "fontMono", "journeyStageTag", toneClass(stageColor(row.stage)))}>{row.stage}</span>
              <span className={cx("fontMono", "journeyToneText", toneClass(riskColor(row.risk)))}>{row.risk}</span>
              <span className={cx("fontMono", "journeyToneText", row.journeyAgeDays >= 30 ? "toneAmber" : "toneMuted")}>{row.journeyAgeDays}d</span>
              <span className={cx("fontMono", "journeyToneText", row.renewalDays !== null && row.renewalDays <= 30 ? "toneAmber" : "toneMuted")}>{row.renewalDays === null ? "Not set" : `${row.renewalDays}d`}</span>
              <span className={cx("fontMono", "journeyToneText", row.outstandingCents > 0 ? "toneRed" : "toneMuted")}>{money(row.outstandingCents, currency)}</span>
              <span className={cx("text11", "colorMuted")}>{row.nextMilestone}</span>
            </div>
          ))}
          {filtered.length === 0 ? <div className={cx("p20", "colorMuted", "text12")}>No accounts match your filters.</div> : null}
        </div>
      ) : null}

      {activeTab === "handoff health" ? (
        <div className={cx("grid2")}>
          <div className={cx("card", "p20")}>
            <div className={cx("text12", "fw700", "mb14")}>Lead to Delivery Handoffs</div>
            {handoffGaps.length > 0 ? handoffGaps.map((row) => (
              <div key={row.id} className={cx("bgBg", "borderDefault", "p10", "mb8")}>
                <div className={cx("flexBetween", "mb4")}>
                  <span className={cx("text12", "fw600")}>{row.name}</span>
                  <span className={cx("fontMono", "journeyToneText", row.handoffGapDays >= 10 ? "toneRed" : "toneAmber")}>{row.handoffGapDays}d lag</span>
                </div>
                <div className={cx("text11", "colorMuted")}>Won lead but no project kickoff yet.</div>
              </div>
            )) : <div className={cx("colorMuted", "text12")}>No active lead-to-project handoff gaps.</div>}
          </div>

          <div className={cx("card", "p20")}>
            <div className={cx("text12", "fw700", "mb14")}>Lifecycle Handoff Checks</div>
            {[
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
            ].map((item) => (
              <div key={item.label} className={cx("bgBg", "borderDefault", "p10", "mb8")}>
                <div className={cx("flexBetween", "mb3")}>
                  <span className={cx("text12")}>{item.label}</span>
                  <span className={cx("fontMono", "fw700", "journeyToneText", item.value > 0 ? "toneRed" : "toneAccent")}>{item.value}</span>
                </div>
                <div className={cx("text11", "colorMuted")}>{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "stage aging" ? (
        <div className={cx("card", "overflowHidden")}>
          <div className={cx("journeyAgingHead", "fontMono", "text10", "colorMuted", "uppercase")}>
            {["Client", "Stage", "Age", "Risk", "Primary Friction"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {[...filtered].sort((a, b) => b.journeyAgeDays - a.journeyAgeDays).map((row) => (
            <div key={row.id} className={styles.journeyAgingRow}>
              <span className={cx("text12", "fw600")}>{row.name}</span>
              <span className={cx("fontMono", "text11", "journeyToneText", toneClass(stageColor(row.stage)))}>{row.stage}</span>
              <span className={cx("fontMono", "journeyToneText", row.journeyAgeDays >= 45 ? "toneRed" : row.journeyAgeDays >= 21 ? "toneAmber" : "toneMuted")}>{row.journeyAgeDays}d</span>
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
          {filtered.length === 0 ? <div className={cx("p20", "colorMuted", "text12")}>No accounts available.</div> : null}
        </div>
      ) : null}

      {activeTab === "moments" ? (
        <div className={styles.journeyMomentsSplit}>
          <div className={cx("card", "p20")}>
            <div className={cx("text12", "fw700", "mb14")}>Upcoming Journey Moments</div>
            {moments.length > 0 ? moments.map((moment, i) => (
              <div key={`${moment.client}-${i}`} className={cx("bgBg", "borderDefault", "p10", "mb8", moment.severity === "high" && "journeyMomentHigh")}>
                <div className={cx("flexBetween", "mb4")}>
                  <span className={cx("text12", "fw600")}>{moment.client}</span>
                  <span className={cx("fontMono", "journeyToneText", moment.severity === "high" ? "toneRed" : "toneAmber")}>{moment.when}d</span>
                </div>
                <div className={cx("text11", "colorMuted")}>{moment.label} · Owner: {moment.owner}</div>
              </div>
            )) : <div className={cx("colorMuted", "text12")}>No lifecycle moments in the current window.</div>}
          </div>

          <div className={cx("card", "p20")}>
            <div className={cx("text12", "fw700", "mb14")}>Lifecycle Actions</div>
            <div className={cx("text11", "colorMuted", "mb12", "journeyLine16")}>
              This page tracks transition quality across lifecycle stages. Onboarding task detail, offboarding processes, satisfaction surveys, and communication logs stay in their dedicated pages.
            </div>
            <button
              type="button"
              onClick={() => onNotify("success", "Journey intervention digest queued.")}
              disabled={!canAct}
              className={cx("btnSm", "btnAccent", "wFull", "mb8", "journeyActionBtn", !canAct && "opacity50")}
            >
              Queue Intervention Digest
            </button>
            <button
              type="button"
              onClick={() => onNotify("success", "Lifecycle handoff summary generated.")}
              disabled={!canAct}
              className={cx("btnSm", "btnGhost", "wFull", "journeyActionBtn", !canAct && "opacity50")}
            >
              Generate Handoff Summary
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
