// ════════════════════════════════════════════════════════════════════════════
// project-briefing-page.tsx — Admin Project Briefing
// Data : loadProjectDirectoryWithRefresh → GET /projects/directory
//        loadClientDirectoryWithRefresh  → GET /clients/directory
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { formatMoneyCents } from "@/lib/i18n/currency";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadProjectDirectoryWithRefresh } from "../../../../lib/api/admin/projects";
import { loadClientDirectoryWithRefresh } from "../../../../lib/api/admin/clients";
import type { AdminProject } from "../../../../lib/api/admin/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhase(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatBudget(cents: number): string {
  return formatMoneyCents(cents, { maximumFractionDigits: 0 });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "2-digit" });
  } catch { return "—"; }
}

function riskLabel(level: string): string {
  if (level === "HIGH")   return "High — escalation needed";
  if (level === "MEDIUM") return "Moderate risk";
  return "Low risk";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectBriefingPage({ session }: { session: AuthSession | null }) {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void Promise.all([
      loadProjectDirectoryWithRefresh(session, { pageSize: 50 }),
      loadClientDirectoryWithRefresh(session, { pageSize: 100 }),
    ]).then(([projRes, clientRes]) => {
      if (cancelled) return;
      if (projRes.nextSession) saveSession(projRes.nextSession);
      if (clientRes.nextSession) saveSession(clientRes.nextSession);
      if (projRes.error) { setError(projRes.error.message ?? "Failed to load."); return; }
      if (projRes.data?.items) setProjects(projRes.data.items);
      if (!clientRes.error && clientRes.data?.items) {
        const map: Record<string, string> = {};
        for (const c of clientRes.data.items) map[c.id] = c.name;
        setClientNames(map);
      }
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

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

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / PROJECT BRIEFING</div>
          <h1 className={styles.pageTitle}>Project Briefing</h1>
          <div className={styles.pageSub}>One-page context view per project for quick executive review</div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className={cx("colorMuted2", "text13", "mt16")}>No active projects found.</div>
      ) : (
        <div className={cx("flexCol", "gap16")}>
          {projects.map((p) => (
            <article key={p.id} className={styles.card}>
              <div className={styles.cardHd}>
                <span className={styles.cardHdTitle}>
                  {p.name}{" "}
                  <span className={cx("text11", "colorMuted", "fw400")}>
                    · {clientNames[p.clientId] ?? "Unknown client"}
                  </span>
                </span>
                <span className={cx(
                  "fontMono", "fw700",
                  p.progressPercent >= 70 ? "colorGreen" : p.progressPercent >= 50 ? "colorAmber" : "colorRed"
                )}>
                  {p.progressPercent}%
                </span>
              </div>
              <div className={styles.cardInner}>
                <div className={cx("grid3", "gap16", "mb12")}>
                  <div>
                    <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Phase</div>
                    <div className={cx("text12")}>{formatPhase(p.status)}</div>
                  </div>
                  <div>
                    <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>PM</div>
                    <div className={cx("text12")}>{p.ownerName ?? "Unassigned"}</div>
                  </div>
                  <div>
                    <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Budget</div>
                    <div className={cx("text12", "fontMono")}>{formatBudget(p.budgetCents)}</div>
                  </div>
                </div>
                <div className={cx("grid3", "gap16")}>
                  <div>
                    <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Priority</div>
                    <div className={cx("text12")}>{p.priority.charAt(0) + p.priority.slice(1).toLowerCase()}</div>
                  </div>
                  <div>
                    <div className={cx("text10", "uppercase", "tracking", "colorRed", "fw700", "mb4")}>Key Risk</div>
                    <div className={cx("text12")}>{riskLabel(p.riskLevel)}</div>
                  </div>
                  <div>
                    <div className={cx("text10", "uppercase", "tracking", "colorAccent", "fw700", "mb4")}>Due Date</div>
                    <div className={cx("text12")}>{formatDate(p.dueAt)}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
