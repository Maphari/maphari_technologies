"use client";

// ════════════════════════════════════════════════════════════════════════════
// ai-insights-page.tsx — Client Portal AI Intelligence Hub
// Data     : props (projects + invoices from snapshot)
//            Per-card: POST /ai/generate with rich project context
//            On mount: loadPortalRisksWithRefresh + loadPortalDeliverablesWithRefresh
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { cx } from "../style";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import { callPortalAiGenerateWithRefresh } from "../../../../lib/api/portal/ai";
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

const INITIAL_STATE: InsightMap = {
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

// ── Sub-components ────────────────────────────────────────────────────────────

interface InsightCardProps {
  id:           InsightId;
  icon:         string;
  title:        string;
  state:        InsightState;
  onGenerate:   (id: InsightId) => void;
  tokens?:      number;
}

function InsightCard({ id, icon, title, state, onGenerate, tokens }: InsightCardProps) {
  return (
    <div className={cx("card", "p20")}>
      {/* Header */}
      <div className={cx("flexRow", "flexCenter", "spaceBetween", "mb12")}>
        <div className={cx("flexRow", "flexCenter", "gap8")}>
          <span className={cx("text16")}>{icon}</span>
          <span className={cx("fw600", "text13")}>{title}</span>
        </div>
        {state.generatedAt && (
          <span className={cx("text10", "colorMuted")}>
            Last generated: {formatMinutesAgo(state.generatedAt)}
          </span>
        )}
      </div>

      {/* Generate button */}
      <button
        type="button"
        className={cx("btnSm", state.content ? "btnGhost" : "btnAccent", "mb12")}
        onClick={() => onGenerate(id)}
        disabled={state.loading}
      >
        {state.loading ? "Generating…" : state.content ? "Refresh" : "Generate"}
      </button>

      {/* Content area */}
      <div style={{ minHeight: "120px" }}>
        {state.loading ? (
          <div className={cx("flexCol", "gap8")}>
            <div className={cx("skeletonBlock", "skeleBarW85")} style={{ height: "12px", borderRadius: "6px" }} />
            <div className={cx("skeletonBlock", "skeleBarW68")} style={{ height: "12px", borderRadius: "6px" }} />
            <div className={cx("skeletonBlock", "skeleBarW55")} style={{ height: "12px", borderRadius: "6px" }} />
          </div>
        ) : state.error ? (
          <p className={cx("text12", "colorMuted")} style={{ color: "var(--red)" }}>
            {state.error}
          </p>
        ) : state.content ? (
          <p className={cx("text12", "colorMuted", "lineH18")}>
            {state.content}
          </p>
        ) : (
          <p className={cx("text12", "colorMuted")}>
            Click Generate to get AI insights.
          </p>
        )}
      </div>

      {/* Footer token count */}
      {tokens !== undefined && tokens > 0 && (
        <div className={cx("mt8")}>
          <span className={cx("text10", "colorMuted")}>{formatTokens(tokens)}</span>
        </div>
      )}
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        className={cx("card", "p24")}
        style={{ maxWidth: "600px", width: "100%", maxHeight: "80vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cx("flexRow", "flexCenter", "spaceBetween", "mb16")}>
          <h2 className={cx("fw600", "text14")}>Weekly AI Digest</h2>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={onClose}>Close</button>
        </div>

        {!hasContent ? (
          <p className={cx("text12", "colorMuted")}>
            Generate at least one insight to see the weekly digest.
          </p>
        ) : (
          sections
            .filter((s) => insights[s.id].content)
            .map((s) => (
              <div key={s.id} className={cx("mb16")}>
                <div className={cx("fw600", "text12", "mb4")}>{s.label}</div>
                <p className={cx("text12", "colorMuted", "lineH18")}>{insights[s.id].content}</p>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AiInsightsPage({ projects, invoices }: AiInsightsPageProps) {
  const { session } = useProjectLayer();

  // Pick first project for per-project data
  const activeProject = projects[0] ?? null;

  const [insights, setInsights] = useState<InsightMap>(INITIAL_STATE);
  const [tokens, setTokens] = useState<Partial<Record<InsightId, number>>>({});
  const [risks, setRisks] = useState<PortalRisk[]>([]);
  const [deliverables, setDeliverables] = useState<PortalDeliverable[]>([]);
  const [digestOpen, setDigestOpen] = useState(false);

  // Load risks + deliverables for active project once session is ready
  useEffect(() => {
    if (!session || !activeProject) return;

    void loadPortalRisksWithRefresh(session, activeProject.id).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setRisks(r.data);
    });

    void loadPortalDeliverablesWithRefresh(session, activeProject.id).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setDeliverables(r.data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, activeProject?.id]);

  // ── Insight prompt builders ──────────────────────────────────────────────

  function buildSummaryInput() {
    const p = activeProject;
    if (!p) return null;
    const delivsDone  = deliverables.filter((d) => d.status === "DELIVERED" || d.status === "APPROVED").length;
    const delivsTotal = deliverables.length;
    return {
      type: "summary" as const,
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
      type: "general" as const,
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
      type: "general" as const,
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
      type: "general" as const,
      prompt: `Analyze the current spending rate and forecast whether the project will come in under, on, or over budget. Provide a specific recommendation.`,
      context: `Invoice count: ${invoices.length}, Invoiced so far: ${fmtR(totalCents)}, Paid: ${fmtR(paidCents)}, Outstanding: ${fmtR(outstandingCents)}, Overdue invoices: ${invoices.filter((i) => i.status === "OVERDUE").length}`,
    };
  }

  // ── Generate a single insight ────────────────────────────────────────────

  const generateInsight = useCallback(async (id: InsightId) => {
    if (!session) return;

    type AiInput = { type: "general" | "summary"; prompt: string; context: string } | null;
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
    if (result.nextSession) saveSession(result.nextSession);

    if (result.error || !result.data) {
      setInsights((prev) => ({
        ...prev,
        [id]: { ...prev[id], loading: false, error: result.error?.message ?? "AI generation failed. Please try again." },
      }));
      return;
    }

    const { output, usage } = result.data;
    if (usage?.outputTokens) {
      setTokens((prev) => ({ ...prev, [id]: (usage.inputTokens ?? 0) + usage.outputTokens }));
    }

    setInsights((prev) => ({
      ...prev,
      [id]: { loading: false, content: output, generatedAt: new Date(), error: null },
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, activeProject, risks, deliverables, invoices]);

  // ── Generate All (sequential) ────────────────────────────────────────────

  const generateAll = useCallback(async () => {
    const ids: InsightId[] = ["summary", "riskRadar", "delivery", "budget"];
    for (const id of ids) {
      await generateInsight(id);
    }
  }, [generateInsight]);

  // ── Render ───────────────────────────────────────────────────────────────

  const CARD_DEFS: Array<{ id: InsightId; icon: string; title: string }> = [
    { id: "summary",   icon: "📊", title: "Project Status Summary" },
    { id: "riskRadar", icon: "🔭", title: "Risk Radar" },
    { id: "delivery",  icon: "🚀", title: "Delivery Prediction" },
    { id: "budget",    icon: "💰", title: "Budget Forecast" },
  ];

  const anyLoading = Object.values(insights).some((s) => s.loading);

  return (
    <div className={cx("pageBody")}>
      {/* Page header */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Reporting · AI</div>
          <h1 className={cx("pageTitle")}>AI Intelligence Hub</h1>
          <p className={cx("pageSub")}>
            AI-powered project insights generated from your live data.
            {activeProject ? ` Showing insights for ${activeProject.name}.` : ""}
          </p>
        </div>
        <div className={cx("pageActions")}>
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
        <div className={cx("grid2Cols14Gap", "mt20")}>
          {CARD_DEFS.map((def) => (
            <InsightCard
              key={def.id}
              id={def.id}
              icon={def.icon}
              title={def.title}
              state={insights[def.id]}
              onGenerate={(id) => void generateInsight(id)}
              tokens={tokens[def.id]}
            />
          ))}
        </div>
      )}

      {/* Bottom CTA — Weekly Digest */}
      {activeProject && (
        <div className={cx("card", "p20", "mt16")}>
          <div className={cx("flexRow", "flexCenter", "spaceBetween")}>
            <div>
              <div className={cx("fw600", "text13", "mb4")}>Weekly Digest</div>
              <p className={cx("text12", "colorMuted")}>
                View a combined AI summary of all four insights in one place. Generate insights first.
              </p>
            </div>
            <button
              type="button"
              className={cx("btnSm", "btnGhost")}
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
