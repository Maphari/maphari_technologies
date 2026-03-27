"use client";

// ════════════════════════════════════════════════════════════════════════════
// ai-insights-page.tsx — Client Portal AI Intelligence Hub
// Data     : props (projects + invoices from snapshot)
//            Per-card: POST /ai/generate with rich project context
//            On mount: loadPortalRisksWithRefresh + loadPortalDeliverablesWithRefresh
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import { callPortalAiGenerateWithRefresh, type AiInsightType } from "../../../../lib/api/portal/ai";
import {
  loadPortalRisksWithRefresh,
  loadPortalDeliverablesWithRefresh,
  type PortalRisk,
  type PortalDeliverable,
} from "../../../../lib/api/portal/project-layer";
import type { PortalInvoice } from "../../../../lib/api/portal/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AiInsightsPageProps {
  projects: Array<{
    id: string;
    name: string;
    progress: number;
    riskLevel: string;
    status: string;
  }>;
  invoices: PortalInvoice[];
}

type InsightId = "summary" | "riskRadar" | "delivery" | "budget";

interface InsightState {
  loading: boolean;
  content: string | null;
  generatedAt: Date | null;
  error: string | null;
}

type InsightMap = Record<InsightId, InsightState>;

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_INSIGHTS: InsightMap = {
  summary:   { loading: false, content: null, generatedAt: null, error: null },
  riskRadar: { loading: false, content: null, generatedAt: null, error: null },
  delivery:  { loading: false, content: null, generatedAt: null, error: null },
  budget:    { loading: false, content: null, generatedAt: null, error: null },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMinutesAgo(date: Date): string {
  const diffMs  = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffH = Math.floor(diffMin / 60);
  return diffH === 1 ? "1 hour ago" : `${diffH} hours ago`;
}

function formatTokens(n: number): string {
  if (n < 1000) return `${n} tokens`;
  return `${(n / 1000).toFixed(1)}k tokens`;
}

function fmtR(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function exportAiInsightsCsv(
  activeProjectName: string | null,
  insights: InsightMap
): void {
  const header = ["Project", "Insight", "Generated", "Content"];
  const rows: string[][] = [
    ["Project Status Summary", insights.summary.content ?? "", insights.summary.generatedAt ? insights.summary.generatedAt.toISOString() : ""],
    ["Risk Radar", insights.riskRadar.content ?? "", insights.riskRadar.generatedAt ? insights.riskRadar.generatedAt.toISOString() : ""],
    ["Delivery Prediction", insights.delivery.content ?? "", insights.delivery.generatedAt ? insights.delivery.generatedAt.toISOString() : ""],
    ["Budget Forecast", insights.budget.content ?? "", insights.budget.generatedAt ? insights.budget.generatedAt.toISOString() : ""],
  ].map((row) => [activeProjectName ?? "", row[0], row[2], row[1]]);
  const escape = (value: string) => "\"" + value.replace(/"/g, "\"\"") + "\"";
  const csv = [header, ...rows].map((row) => row.map((cell) => escape(cell)).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ai-intelligence-hub.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface InsightCardProps {
  id:           InsightId;
  icon:         string;
  title:        string;
  subtitle:     string;
  state:        InsightState;
  onGenerate:   (id: InsightId) => void;
  tokens?:      number;
}

function InsightCard({ id, icon, title, subtitle, state, onGenerate, tokens }: InsightCardProps) {
  return (
    <div className={cx("cardS1v2", "p16", "flexCol", "gap14")}>
      <div className={cx("flexRow", "spaceBetween", "gap12", "flexAlignStart")}>
        <div className={cx("flexRow", "gap12", "flexAlignStart", "minW0", "flex1")}>
          <div className={cx("iconSquare36", "noShrink")}>
            <Ic n={icon} sz={16} c="var(--accent)" />
          </div>
          <div className={cx("flex1", "minW0")}>
            <div className={cx("fw700", "text13", "mb4")}>{title}</div>
            <div className={cx("text11", "colorMuted", "lineH15")}>{subtitle}</div>
          </div>
        </div>
        <span className={cx("badge", state.content ? "badgeGreen" : "badgeMuted", "noShrink")}>
          {state.loading ? "Running" : state.content ? "Ready" : "Idle"}
        </span>
      </div>

      <div className={cx("flexRow", "gap8", "flexWrap")}>
        {state.generatedAt && (
          <span className={cx("badge", "badgeMuted")}>
            Updated {formatMinutesAgo(state.generatedAt)}
          </span>
        )}
        {tokens !== undefined && tokens > 0 && (
          <span className={cx("badge", "badgeMuted")}>{formatTokens(tokens)}</span>
        )}
      </div>

      <div className={cx("card", "p14", "aiCardContent")}>
        {state.loading ? (
          <div className={cx("flexCol", "gap8")}>
            <div className={cx("skeletonBlock", "skeleBarW85", "skeleBarSm")} />
            <div className={cx("skeletonBlock", "skeleBarW68", "skeleBarSm")} />
            <div className={cx("skeletonBlock", "skeleBarW55", "skeleBarSm")} />
          </div>
        ) : state.error ? (
          <p className={cx("text12", "colorRed")}>
            {state.error}
          </p>
        ) : state.content ? (
          <>
            {state.content.split("\n\n").filter(Boolean).map((para, i) => (
              <p key={i} className={cx("text12", "colorMuted", "lineH18", i > 0 && "mt8")}>{para}</p>
            ))}
          </>
        ) : (
          <p className={cx("text12", "colorMuted")}>
            Generate this insight when you want a fresh summary from the current project snapshot.
          </p>
        )}
      </div>

      <div className={cx("flexRow", "gap8", "flexWrap")}>
        <button
          type="button"
          className={cx("btnSm", state.content ? "btnGhost" : "btnAccent")}
          onClick={() => onGenerate(id)}
          disabled={state.loading}
        >
          {state.loading ? "Generating…" : state.content ? "Refresh insight" : "Generate insight"}
        </button>
      </div>
    </div>
  );
}

// ── Weekly Digest Modal ───────────────────────────────────────────────────────

interface DigestModalProps {
  insights: InsightMap;
  onClose: () => void;
}

function DigestModal({ insights, onClose }: DigestModalProps) {
  const sections: Array<{ id: InsightId; label: string }> = [
    { id: "summary",   label: "Project Status Summary" },
    { id: "riskRadar", label: "Risk Radar" },
    { id: "delivery",  label: "Delivery Prediction" },
    { id: "budget",    label: "Budget Forecast" },
  ];

  const hasContent = sections.some((s) => insights[s.id].content);

  return (
    <div className={cx("modalOverlay")} onClick={onClose}>
      <div
        className={cx("pmModalInner", "maxW720")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cx("pmModalHd")}>
          <div className={cx("pmTitle")}>Weekly AI Digest</div>
          <button type="button" className={cx("iconBtn40x34")} title="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap16", "maxH70vh", "overflowYAuto")}>
          {!hasContent ? (
            <p className={cx("text12", "colorMuted")}>
              Generate at least one insight to see the weekly digest.
            </p>
          ) : (
            sections
              .filter((s) => insights[s.id].content)
              .map((s) => (
                <div key={s.id}>
                  <div className={cx("fw600", "text12", "mb4")}>{s.label}</div>
                  {insights[s.id].content!.split("\n\n").filter(Boolean).map((para, i) => (
                    <p key={i} className={cx("text12", "colorMuted", "lineH18")}>{para}</p>
                  ))}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AiInsightsPage({ projects, invoices }: AiInsightsPageProps) {
  const { session } = useProjectLayer();

  // Pick first project for per-project data
  const activeProject = projects[0] ?? null;

  const [insights, setInsights] = useState<InsightMap>(INITIAL_INSIGHTS);
  const [tokens, setTokens] = useState<Partial<Record<InsightId, number>>>({});
  const [risks, setRisks] = useState<PortalRisk[]>([]);
  const [deliverables, setDeliverables] = useState<PortalDeliverable[]>([]);
  const [digestOpen, setDigestOpen] = useState(false);

  // Mounted ref — prevents setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Guard ref for generateAll — prevents concurrent re-trigger
  const generatingAllRef = useRef(false);

  const resetInsights = useCallback(() => {
    setInsights(INITIAL_INSIGHTS);
    setTokens({});
    setDigestOpen(false);
  }, []);

  // Load risks + deliverables for active project once session is ready
  useEffect(() => {
    if (!session || !activeProject) return;

    void loadPortalRisksWithRefresh(session, activeProject.id).then((r) => {
      if (!mountedRef.current) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setRisks(r.data);
    });

    void loadPortalDeliverablesWithRefresh(session, activeProject.id).then((r) => {
      if (!mountedRef.current) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setDeliverables(r.data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, activeProject?.id]);

  // Clear insights (and close digest) when the active project changes
  useEffect(() => {
    queueMicrotask(() => {
      resetInsights();
    });
  }, [activeProject?.id, resetInsights]);

  // ── Insight prompt builders ──────────────────────────────────────────────

  function buildSummaryInput() {
    const p = activeProject;
    if (!p) return null;
    const delivsDone  = deliverables.filter((d) => d.status === "DELIVERED" || d.status === "APPROVED").length;
    const delivsTotal = deliverables.length;
    return {
      type: "project-status-summary" as const,
      prompt: `Write a concise 2-3 paragraph project status update for ${p.name}. Current progress: ${p.progress}%, status: ${p.status}, risk level: ${p.riskLevel}. Focus on what's going well and what needs attention.`,
      context: `Project: ${p.name}, Progress: ${p.progress}%, Status: ${p.status}, Risk: ${p.riskLevel}, Open deliverables: ${delivsTotal - delivsDone} of ${delivsTotal} remaining`,
    };
  }

  function buildRiskRadarInput() {
    const p = activeProject;
    if (!p) return null;
    const openRisks    = risks.filter((r) => r.status === "OPEN");
    const blockerCount = openRisks.filter((r) => r.likelihood === "HIGH" || r.likelihood === "CRITICAL").length;
    return {
      type: "risk-radar" as const,
      prompt: `Analyze the top risks for project ${p.name} and provide 3 concrete risk items with severity and recommended mitigation actions.`,
      context: `Open risks: ${openRisks.map((r) => `${r.name} (${r.likelihood}/${r.impact})`).join(", ") || "None"}, High-priority blockers: ${blockerCount}, Project risk level: ${p.riskLevel}`,
    };
  }

  function buildDeliveryInput() {
    const p = activeProject;
    if (!p) return null;
    const delivsDone  = deliverables.filter((d) => d.status === "DELIVERED" || d.status === "APPROVED").length;
    const delivsTotal = deliverables.length;
    return {
      type: "delivery-prediction" as const,
      prompt: `Based on the project data, predict the likely delivery outcome and confidence level. Be specific about what's on track and what might slip.`,
      context: `Progress: ${p.progress}%, Deliverables done: ${delivsDone}/${delivsTotal}, Sprint velocity: derived from deliverables completion rate (${delivsTotal > 0 ? Math.round((delivsDone / delivsTotal) * 100) : 0}% complete), Risk: ${p.riskLevel}`,
    };
  }

  function buildBudgetInput() {
    const p = activeProject;
    if (!p) return null;
    const totalCents       = invoices.reduce((s, i) => s + (i.amountCents ?? 0), 0);
    const paidCents        = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + (i.amountCents ?? 0), 0);
    const outstandingCents = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").reduce((s, i) => s + (i.amountCents ?? 0), 0);
    return {
      type: "budget-forecast" as const,
      prompt: `Analyze the current spending rate and forecast whether the project will come in under, on, or over budget. Provide a specific recommendation.`,
      context: `Invoice count: ${invoices.length}, Invoiced so far: ${fmtR(totalCents)}, Paid: ${fmtR(paidCents)}, Outstanding: ${fmtR(outstandingCents)}, Overdue invoices: ${invoices.filter((i) => i.status === "OVERDUE").length}`,
    };
  }

  // ── Generate a single insight ────────────────────────────────────────────

  const generateInsight = useCallback(async (id: InsightId) => {
    if (!session) return;

    // If already generating this insight, skip (prevents duplicate calls from
    // "Generate All" + individual card button firing simultaneously)
    if (insights[id].loading) return;

    type AiInput = { type: AiInsightType; prompt: string; context: string } | null;
    const inputBuilders: Record<InsightId, () => AiInput> = {
      summary:   buildSummaryInput,
      riskRadar: buildRiskRadarInput,
      delivery:  buildDeliveryInput,
      budget:    buildBudgetInput,
    };

    const input = inputBuilders[id]();
    if (!input) return;

    setInsights((prev) => ({
      ...prev,
      [id]: { ...prev[id], loading: true, error: null },
    }));

    const result = await callPortalAiGenerateWithRefresh(session, input);

    if (!mountedRef.current) return;
    if (result.nextSession) saveSession(result.nextSession);

    if (result.error || !result.data) {
      if (!mountedRef.current) return;
      setInsights((prev) => ({
        ...prev,
        [id]: { ...prev[id], loading: false, error: result.error?.message ?? "AI generation failed. Please try again." },
      }));
      return;
    }

    const { output, usage } = result.data;
    if (usage?.outputTokens) {
      if (!mountedRef.current) return;
      setTokens((prev) => ({ ...prev, [id]: (usage.inputTokens ?? 0) + usage.outputTokens }));
    }

    if (!mountedRef.current) return;
    setInsights((prev) => ({
      ...prev,
      [id]: { loading: false, content: output, generatedAt: new Date(), error: null },
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, activeProject?.id]);

  // ── Generate All (sequential) ────────────────────────────────────────────

  const generateAll = useCallback(async () => {
    if (generatingAllRef.current) return;
    generatingAllRef.current = true;
    try {
      const ids: InsightId[] = ["summary", "riskRadar", "delivery", "budget"];
      for (const id of ids) {
        await generateInsight(id);
      }
    } finally {
      generatingAllRef.current = false;
    }
  }, [generateInsight]);

  // ── Render ───────────────────────────────────────────────────────────────

  const CARD_DEFS: Array<{ id: InsightId; icon: string; title: string }> = [
    { id: "summary",   icon: "chart", title: "Project Status Summary", subtitle: "Executive readout of progress, current momentum, and immediate watchpoints." },
    { id: "riskRadar", icon: "shield", title: "Risk Radar", subtitle: "Top live risks, likely blockers, and mitigation actions from the current register." },
    { id: "delivery",  icon: "flag", title: "Delivery Prediction", subtitle: "Likelihood of hitting the current delivery path based on progress and open work." },
    { id: "budget",    icon: "invoiceDoc", title: "Budget Forecast", subtitle: "Invoice-based forecast of spend position, paid value, and financial pressure points." },
  ];

  const anyLoading = Object.values(insights).some((s) => s.loading);
  const openRiskCount = risks.filter((risk) => risk.status === "OPEN").length;
  const completedDeliverables = deliverables.filter((deliverable) => deliverable.status === "DELIVERED" || deliverable.status === "APPROVED").length;
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
  const readyInsightCount = Object.values(insights).filter((state) => Boolean(state.content)).length;

  return (
    <div className={cx("pageBody")}>
      {/* Page header */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Reporting · AI</div>
          <h1 className={cx("pageTitle")}>AI Intelligence Hub</h1>
          <p className={cx("pageSub")}>
            Generated analysis based on your live project, risk, deliverable, and invoice data.
            {activeProject ? ` Showing insights for ${activeProject.name}.` : ""}
          </p>
        </div>
        <div className={cx("pageActions")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={resetInsights}
            disabled={anyLoading}
          >
            Reset
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => exportAiInsightsCsv(activeProject?.name ?? null, insights)}
            disabled={Object.values(insights).every((state) => !state.content)}
          >
            Export CSV
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => setDigestOpen(true)}
          >
            Weekly Digest
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={() => void generateAll()}
            disabled={anyLoading || !activeProject}
          >
            {anyLoading ? "Generating…" : "Generate All"}
          </button>
        </div>
      </div>

      {/* No project fallback */}
      {!activeProject && (
        <div className={cx("emptyState", "mt24")}>
          <div className={cx("emptyStateIcon")}>🤖</div>
          <div className={cx("emptyStateTitle")}>No projects found</div>
          <div className={cx("emptyStateSub")}>AI insights require at least one active project.</div>
        </div>
      )}

      {/* Insight cards — 2-column grid */}
      {activeProject && (
        <>
          <div className={cx("card", "borderLeftAccent", "p20", "mt20", "mb16")}>
            <div className={cx("flexRow", "spaceBetween", "gap16", "flexWrap")}>
              <div className={cx("flex1", "minW220")}>
                <div className={cx("text10", "uppercase", "ls01", "colorMuted2", "mb6")}>Live intelligence workspace</div>
                <div className={cx("fw800", "text16", "mb6")}>{activeProject.name}</div>
                <div className={cx("text12", "colorMuted", "lineH16")}>
                  Generated analysis based on the current project snapshot, active risks, deliverable progress, and invoice history already available in the portal.
                </div>
              </div>
              <div className={cx("flexRow", "gap12", "flexWrap")}>
                <div className={cx("cardS1v2", "p12x14", "flexCol", "gap4", "minW120")}>
                  <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Project status</div>
                  <div className={cx("text13", "fw700")}>{activeProject.status}</div>
                  <div className={cx("text10", "colorMuted")}>{activeProject.progress}% complete</div>
                </div>
                <div className={cx("cardS1v2", "p12x14", "flexCol", "gap4", "minW120")}>
                  <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Open risks</div>
                  <div className={cx("text13", "fw700")}>{String(openRiskCount)}</div>
                  <div className={cx("text10", "colorMuted")}>{activeProject.riskLevel} project signal</div>
                </div>
                <div className={cx("cardS1v2", "p12x14", "flexCol", "gap4", "minW120")}>
                  <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Deliverables</div>
                  <div className={cx("text13", "fw700")}>{String(completedDeliverables) + "/" + String(deliverables.length || 0)}</div>
                  <div className={cx("text10", "colorMuted")}>completed</div>
                </div>
                <div className={cx("cardS1v2", "p12x14", "flexCol", "gap4", "minW120")}>
                  <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Insight pack</div>
                  <div className={cx("text13", "fw700")}>{String(readyInsightCount) + "/4"}</div>
                  <div className={cx("text10", "colorMuted")}>{String(overdueInvoices)} overdue invoices</div>
                </div>
              </div>
            </div>
          </div>
          <div className={cx("grid2Cols14Gap")}>
          {CARD_DEFS.map((def) => (
            <InsightCard
              key={def.id}
              id={def.id}
              icon={def.icon}
              title={def.title}
              subtitle={def.subtitle}
              state={insights[def.id]}
              onGenerate={(id) => void generateInsight(id)}
              tokens={tokens[def.id]}
            />
          ))}
          </div>
        </>
      )}

      {/* Bottom CTA — Weekly Digest */}
      {activeProject && (
        <div className={cx("cardS1v2", "p16", "mt16")}>
          <div className={cx("flexRow", "spaceBetween", "gap16", "flexWrap", "flexAlignCenter")}>
            <div className={cx("flex1", "minW220")}>
              <div className={cx("fw700", "text13", "mb4")}>Weekly Digest</div>
              <p className={cx("text12", "colorMuted", "lineH16")}>
                Pull the generated insight cards into one executive digest for circulation or review. Generate the cards you need first, then open the digest.
              </p>
            </div>
            <button
              type="button"
              className={cx("btnSm", "btnGhost", "noShrink")}
              onClick={() => setDigestOpen(true)}
            >
              Open Digest
            </button>
          </div>
        </div>
      )}

      {/* Weekly Digest Modal */}
      {digestOpen && (
        <DigestModal insights={insights} onClose={() => setDigestOpen(false)} />
      )}
    </div>
  );
}
