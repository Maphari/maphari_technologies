"use client";

import { useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

type JourneyTab = "journey map" | "handoff health" | "stage aging" | "moments";
type JourneyStage = "Acquisition" | "Onboarding" | "Adoption" | "Value" | "Renewal" | "Advocacy";

function fmtDate(value?: string | null): string {
  if (!value) return "Not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-ZA", { month: "short", day: "2-digit" }).format(d);
}

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
  if (stage === "Acquisition") return C.blue;
  if (stage === "Onboarding") return C.amber;
  if (stage === "Adoption") return C.blue;
  if (stage === "Value") return C.primary;
  if (stage === "Renewal") return C.amber;
  return C.primary;
}

function riskColor(level: "Low" | "Medium" | "High"): string {
  if (level === "High") return C.red;
  if (level === "Medium") return C.amber;
  return C.primary;
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
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Syne, sans-serif", padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Client Journey</h1>
          <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>Lifecycle orchestration · Stage flow · Handoff reliability</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, border: "none", padding: "8px 16px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Export Journey</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Tracked Accounts", value: filtered.length.toString(), sub: `${riskHigh} high risk`, color: C.primary },
          { label: "Handoff Gaps", value: handoffGaps.length.toString(), sub: "Won leads without project", color: handoffGaps.length > 0 ? C.red : C.primary },
          { label: "Renewal Window (60d)", value: renewalWindow.toString(), sub: "Needs retention plan", color: renewalWindow > 0 ? C.amber : C.primary },
          { label: "Advocacy Ready", value: advocacyReady.toString(), sub: "Low risk + post-value", color: C.blue }
        ].map((k) => (
          <div key={k.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 24, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as typeof stageFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            <option value="ALL">All stages</option>
            {(["Acquisition", "Onboarding", "Adoption", "Value", "Renewal", "Advocacy"] as JourneyStage[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            <option value="ALL">All risk</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            {owners.map((owner) => (
              <option key={owner} value={owner}>{owner === "ALL" ? "All owners" : owner}</option>
            ))}
          </select>
          <button onClick={() => { setStageFilter("ALL"); setRiskFilter("ALL"); setOwnerFilter("ALL"); }} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>
            Reset
          </button>

          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {(["journey map", "handoff health", "stage aging", "moments"] as JourneyTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab ? `2px solid ${C.primary}` : "none",
                  color: activeTab === tab ? C.primary : C.muted,
                  padding: "8px 12px",
                  fontFamily: "Syne, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  letterSpacing: "0.06em",
                  cursor: "pointer"
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "journey map" ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 110px 90px 120px 120px 120px 1fr", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {["Client", "Stage", "Risk", "Journey Age", "Renewal", "Outstanding", "Next Milestone"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {filtered.map((row, i) => (
            <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 110px 90px 120px 120px 120px 1fr", padding: "12px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{row.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{row.owner}</div>
              </div>
              <span style={{ fontSize: 10, color: stageColor(row.stage), background: `${stageColor(row.stage)}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace" }}>{row.stage}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: riskColor(row.risk) }}>{row.risk}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: row.journeyAgeDays >= 30 ? C.amber : C.muted }}>{row.journeyAgeDays}d</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: row.renewalDays !== null && row.renewalDays <= 30 ? C.amber : C.muted }}>{row.renewalDays === null ? "Not set" : `${row.renewalDays}d`}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: row.outstandingCents > 0 ? C.red : C.muted }}>{money(row.outstandingCents, currency)}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{row.nextMilestone}</span>
            </div>
          ))}
          {filtered.length === 0 ? <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>No accounts match your filters.</div> : null}
        </div>
      ) : null}

      {activeTab === "handoff health" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14 }}>Lead to Delivery Handoffs</div>
            {handoffGaps.length > 0 ? handoffGaps.map((row) => (
              <div key={row.id} style={{ padding: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{row.name}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: row.handoffGapDays >= 10 ? C.red : C.amber }}>{row.handoffGapDays}d lag</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>Won lead but no project kickoff yet.</div>
              </div>
            )) : <div style={{ color: C.muted, fontSize: 12 }}>No active lead-to-project handoff gaps.</div>}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14 }}>Lifecycle Handoff Checks</div>
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
              <div key={item.label} style={{ padding: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12 }}>{item.label}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: item.value > 0 ? C.red : C.primary, fontWeight: 700 }}>{item.value}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "stage aging" ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 110px 100px 100px 1fr", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {["Client", "Stage", "Age", "Risk", "Primary Friction"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {[...filtered].sort((a, b) => b.journeyAgeDays - a.journeyAgeDays).map((row, i, arr) => (
            <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 110px 100px 100px 1fr", padding: "12px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{row.name}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: stageColor(row.stage), fontSize: 11 }}>{row.stage}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: row.journeyAgeDays >= 45 ? C.red : row.journeyAgeDays >= 21 ? C.amber : C.muted }}>{row.journeyAgeDays}d</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: riskColor(row.risk), fontSize: 11 }}>{row.risk}</span>
              <span style={{ fontSize: 11, color: C.muted }}>
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
          {filtered.length === 0 ? <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>No accounts available.</div> : null}
        </div>
      ) : null}

      {activeTab === "moments" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14 }}>Upcoming Journey Moments</div>
            {moments.length > 0 ? moments.map((moment, i) => (
              <div key={`${moment.client}-${i}`} style={{ padding: 10, background: C.bg, border: `1px solid ${moment.severity === "high" ? `${C.red}66` : C.border}`, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{moment.client}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: moment.severity === "high" ? C.red : C.amber }}>{moment.when}d</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{moment.label} · Owner: {moment.owner}</div>
              </div>
            )) : <div style={{ color: C.muted, fontSize: 12 }}>No lifecycle moments in the current window.</div>}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14 }}>Lifecycle Actions</div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
              This page tracks transition quality across lifecycle stages. Onboarding task detail, offboarding processes, satisfaction surveys, and communication logs stay in their dedicated pages.
            </div>
            <button
              onClick={() => onNotify("success", "Journey intervention digest queued.")}
              disabled={!canAct}
              style={{ width: "100%", background: C.primary, color: C.bg, border: "none", padding: "10px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: canAct ? 1 : 0.5, marginBottom: 8 }}
            >
              Queue Intervention Digest
            </button>
            <button
              onClick={() => onNotify("success", "Lifecycle handoff summary generated.")}
              disabled={!canAct}
              style={{ width: "100%", background: C.bg, color: C.text, border: `1px solid ${C.border}`, padding: "10px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer", opacity: canAct ? 1 : 0.5 }}
            >
              Generate Handoff Summary
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
