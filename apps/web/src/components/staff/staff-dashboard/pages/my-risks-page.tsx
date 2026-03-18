// ════════════════════════════════════════════════════════════════════════════
// my-risks-page.tsx — Staff: risk register for assigned projects
// Data     : getStaffProjects + getStaffRisks per project
// Mapping  : severity HIGH/MEDIUM/LOW, status OPEN/MITIGATED/CLOSED
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffProjects,
  getStaffRisks,
  type StaffRisk,
} from "../../../../lib/api/staff/projects";
import { cx } from "../style";

// ── Types ─────────────────────────────────────────────────────────────────────

type PageProps = {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
};

type RiskItem = StaffRisk & { projectName: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

type RiskStatus = "Open" | "Mitigating" | "Closed";
type RiskImpact = "Critical" | "High" | "Medium" | "Low";

function mapStatus(raw: string): RiskStatus {
  const s = raw.toUpperCase();
  if (s === "OPEN") return "Open";
  if (s === "MITIGATED" || s === "IN_PROGRESS" || s === "MITIGATING") return "Mitigating";
  return "Closed";
}

function mapSeverity(raw: string): RiskImpact {
  const s = raw.toUpperCase();
  if (s === "CRITICAL") return "Critical";
  if (s === "HIGH") return "High";
  if (s === "LOW") return "Low";
  return "Medium";
}

function statusBadgeCls(s: RiskStatus): string {
  if (s === "Open") return "rskStatusOpen";
  if (s === "Mitigating") return "rskStatusMitigating";
  return "rskStatusMitigating";
}

function impactStripCls(i: RiskImpact): string {
  if (i === "Critical") return "rskCardCritical";
  if (i === "High") return "rskCardHigh";
  return "";
}

function impactBadgeCls(i: RiskImpact): string {
  if (i === "Critical") return "rskImpactCritical";
  if (i === "High") return "rskImpactHigh";
  return "rskImpactMedium";
}

function severityBadgeCls(s: RiskImpact): string {
  if (s === "Critical" || s === "High") return "rskProbHigh";
  if (s === "Medium") return "rskProbMedium";
  return "rskProbLow";
}

const IMPACT_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};
const STATUS_ORDER: Record<string, number> = {
  Open: 0,
  Mitigating: 1,
  Closed: 2,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MyRisksPage({ isActive, session, onNotify }: PageProps) {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) return;
    if (!session) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      const projectsResult = await getStaffProjects(session);
      if (cancelled) return;

      if (projectsResult.nextSession) saveSession(projectsResult.nextSession);

      if (projectsResult.error) {
        setError(projectsResult.error.message);
        onNotify?.("error", "Unable to load projects.");
        setLoading(false);
        return;
      }

      const projects = projectsResult.data ?? [];

      const riskResults = await Promise.all(
        projects.map((p) => getStaffRisks(session, p.id).then((r) => ({ ...r, projectName: p.name })))
      );

      if (cancelled) return;

      const allRisks: RiskItem[] = [];
      for (const result of riskResults) {
        if (result.nextSession) saveSession(result.nextSession);
        for (const risk of result.data ?? []) {
          allRisks.push({ ...risk, projectName: result.projectName });
        }
      }

      setRisks(allRisks);
      setLoading(false);
    };

    void load();
    return () => { cancelled = true; };
  }, [isActive, session]);

  const totalRisks = risks.length;
  const openCount = risks.filter((r) => mapStatus(r.status) === "Open").length;
  const mitigating = risks.filter((r) => mapStatus(r.status) === "Mitigating").length;
  const criticalCount = risks.filter((r) => mapSeverity(r.severity) === "Critical").length;

  const sorted = [...risks].sort((a, b) => {
    const ia = IMPACT_ORDER[mapSeverity(a.severity)] ?? 99;
    const ib = IMPACT_ORDER[mapSeverity(b.severity)] ?? 99;
    if (ia !== ib) return ia - ib;
    return (
      (STATUS_ORDER[mapStatus(a.status)] ?? 99) -
      (STATUS_ORDER[mapStatus(b.status)] ?? 99)
    );
  });

  if (!isActive) return null;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-risks">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Governance</div>
        <h1 className={cx("pageTitleText")}>My Risks</h1>
        <p className={cx("pageSubtitleText", "mb20")}>
          Risk entries for your assigned projects
        </p>
      </div>

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {loading && (
        <div className={cx("rskSection")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateText")}>Loading risk data…</div>
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className={cx("rskSection")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateTitle")}>Failed to load risks.</div>
            <div className={cx("emptyStateSub")}>{error}</div>
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className={cx("rskStatGrid")}>

          <div className={cx("rskStatCard")}>
            <div className={cx("rskStatCardTop")}>
              <div className={cx("rskStatLabel")}>Total Risks</div>
              <div className={cx("rskStatValue", "colorAccent")}>{totalRisks}</div>
            </div>
            <div className={cx("rskStatCardDivider")} />
            <div className={cx("rskStatCardBottom")}>
              <span className={cx("rskStatDot", "dotBgAccent")} />
              <span className={cx("rskStatMeta")}>being tracked</span>
            </div>
          </div>

          <div className={cx("rskStatCard")}>
            <div className={cx("rskStatCardTop")}>
              <div className={cx("rskStatLabel")}>Open</div>
              <div
                className={cx("rskStatValue", openCount > 0 ? "colorRed" : "colorGreen")}
              >
                {openCount}
              </div>
            </div>
            <div className={cx("rskStatCardDivider")} />
            <div className={cx("rskStatCardBottom")}>
              <span
                className={cx("rskStatDot", "dynBgColor")} style={{ "--bg-color": openCount > 0 ? "var(--red)" : "var(--green)" } as React.CSSProperties}
              />
              <span className={cx("rskStatMeta")}>
                {openCount > 0 ? "needs action" : "none open"}
              </span>
            </div>
          </div>

          <div className={cx("rskStatCard")}>
            <div className={cx("rskStatCardTop")}>
              <div className={cx("rskStatLabel")}>Mitigating</div>
              <div
                className={cx("rskStatValue", mitigating > 0 ? "colorAmber" : "colorMuted2")}
              >
                {mitigating}
              </div>
            </div>
            <div className={cx("rskStatCardDivider")} />
            <div className={cx("rskStatCardBottom")}>
              <span
                className={cx("rskStatDot", "dynBgColor")}
                style={{ "--bg-color": mitigating > 0 ? "var(--amber)" : "var(--muted2)" } as React.CSSProperties}
              />
              <span className={cx("rskStatMeta")}>in progress</span>
            </div>
          </div>

          <div className={cx("rskStatCard")}>
            <div className={cx("rskStatCardTop")}>
              <div className={cx("rskStatLabel")}>Critical</div>
              <div
                className={cx(
                  "rskStatValue",
                  criticalCount > 0 ? "colorRed" : "colorGreen"
                )}
              >
                {criticalCount}
              </div>
            </div>
            <div className={cx("rskStatCardDivider")} />
            <div className={cx("rskStatCardBottom")}>
              <span
                className={cx("rskStatDot", "dynBgColor")}
                style={{ "--bg-color": criticalCount > 0 ? "var(--red)" : "var(--green)" } as React.CSSProperties}
              />
              <span className={cx("rskStatMeta")}>
                {criticalCount > 0 ? "highest priority" : "none critical"}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ── Risk list ─────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className={cx("rskSection")}>
          <div className={cx("rskSectionHeader")}>
            <div className={cx("rskSectionTitle")}>All Risks</div>
            <span className={cx("rskSectionMeta")}>{risks.length} RISKS</span>
          </div>

          {risks.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className={cx("emptyStateTitle")}>No risks logged</div>
              <div className={cx("emptyStateSub")}>
                No risks have been recorded for your assigned projects yet.
              </div>
            </div>
          ) : (
            <div className={cx("rskList")}>
              {sorted.map((r, idx) => {
                const impact = mapSeverity(r.severity);
                const status = mapStatus(r.status);
                return (
                  <div
                    key={r.id}
                    className={cx(
                      "rskCard",
                      impactStripCls(impact),
                      idx === sorted.length - 1 && "rskCardLast"
                    )}
                  >
                    {/* Head */}
                    <div className={cx("rskCardHead")}>
                      <span className={cx("rskRiskId")}>
                        {r.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={cx("rskStatusBadge", statusBadgeCls(status))}>
                        {status}
                      </span>
                    </div>

                    {/* Title */}
                    <div className={cx("rskTitle")}>{r.title}</div>

                    {/* Meta row */}
                    <div className={cx("rskMetaRow")}>
                      <span className={cx("rskProjectTag")}>{r.projectName}</span>
                      <span className={cx("rskProbBadge", severityBadgeCls(impact))}>
                        {impact}
                      </span>
                      <span className={cx("rskImpactBadge", impactBadgeCls(impact))}>
                        {r.severity}
                      </span>
                    </div>

                    {/* Mitigation */}
                    {r.mitigationPlan && (
                      <div className={cx("rskMitigationWrap")}>
                        <span className={cx("rskMitigationLabel")}>Mitigation</span>
                        <span className={cx("rskMitigationText")}>{r.mitigationPlan}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
