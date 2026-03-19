// ════════════════════════════════════════════════════════════════════════════
// contract-viewer-page.tsx — Staff: read-only contract viewer
// Data     : getStaffClients + getStaffProjects (no staff contract API)
// Note     : Contracts are admin-managed. Staff see client/project context.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffClients, type StaffClient } from "../../../../lib/api/staff/clients";
import { getStaffProjects, type StaffProject } from "../../../../lib/api/staff/projects";
import { cx } from "../style";

// ── Types ─────────────────────────────────────────────────────────────────────

type PageProps = {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function projectStatusCls(status: string): string {
  const s = status.toUpperCase();
  if (s === "IN_PROGRESS" || s === "ACTIVE") return "ctrStatusActive";
  if (s === "COMPLETED" || s === "DONE") return "ctrStatusDone";
  return "ctrStatusExpired";
}

function tierBadgeCls(tier: string | null): string {
  if (!tier) return "";
  const t = tier.toUpperCase();
  if (t === "ENTERPRISE") return "ctrTypeRetainer";
  if (t === "STANDARD") return "ctrTypeProject";
  return "ctrTypeProject";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContractViewerPage({ isActive, session, onNotify }: PageProps) {
  const [clients, setClients] = useState<StaffClient[]>([]);
  const [projects, setProjects] = useState<StaffProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) return;
    if (!session) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    void Promise.all([
      getStaffClients(session),
      getStaffProjects(session),
    ]).then(([clientsResult, projectsResult]) => {
      if (cancelled) return;

      if (clientsResult.nextSession) saveSession(clientsResult.nextSession);
      if (projectsResult.nextSession) saveSession(projectsResult.nextSession);

      if (clientsResult.error) {
        setError(clientsResult.error.message);
        onNotify?.("error", "Unable to load client data.");
      } else {
        setClients(clientsResult.data ?? []);
        setProjects(projectsResult.data ?? []);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [isActive, session?.accessToken]);

  const activeClients = clients.filter(
    (c) => c.status === "ACTIVE" || c.status === "active"
  );
  const activeProjects = projects.filter(
    (p) => p.status === "IN_PROGRESS" || p.status === "ACTIVE"
  );

  if (!isActive) return null;

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
    <section
      className={cx("page", "pageBody", isActive && "pageActive")}
      id="page-contract-viewer"
    >
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Knowledge</div>
        <h1 className={cx("pageTitleText")}>Contract Viewer</h1>
        <p className={cx("pageSubtitleText", "mb20")}>
          Read-only client contracts for your assigned projects
        </p>
      </div>

      {/* ── Summary stats ─────────────────────────────────────────────── */}
      {!error && (
        <div className={cx("ctrStatGrid")}>

          <div className={cx("ctrStatCard")}>
            <div className={cx("ctrStatCardTop")}>
              <div className={cx("ctrStatLabel")}>Clients</div>
              <div className={cx("ctrStatValue", "colorGreen")}>{activeClients.length}</div>
            </div>
            <div className={cx("ctrStatCardDivider")} />
            <div className={cx("ctrStatCardBottom")}>
              <span className={cx("ctrStatDot", "dotBgGreen")} />
              <span className={cx("ctrStatMeta")}>active accounts</span>
            </div>
          </div>

          <div className={cx("ctrStatCard")}>
            <div className={cx("ctrStatCardTop")}>
              <div className={cx("ctrStatLabel")}>Projects</div>
              <div className={cx("ctrStatValue", "colorAccent")}>{activeProjects.length}</div>
            </div>
            <div className={cx("ctrStatCardDivider")} />
            <div className={cx("ctrStatCardBottom")}>
              <span className={cx("ctrStatDot", "dotBgAccent")} />
              <span className={cx("ctrStatMeta")}>in progress</span>
            </div>
          </div>

          <div className={cx("ctrStatCard")}>
            <div className={cx("ctrStatCardTop")}>
              <div className={cx("ctrStatLabel")}>Total Clients</div>
              <div className={cx("ctrStatValue", "colorMuted2")}>{clients.length}</div>
            </div>
            <div className={cx("ctrStatCardDivider")} />
            <div className={cx("ctrStatCardBottom")}>
              <span className={cx("ctrStatDot", "dotBgMuted2")} />
              <span className={cx("ctrStatMeta")}>assigned to you</span>
            </div>
          </div>

          <div className={cx("ctrStatCard")}>
            <div className={cx("ctrStatCardTop")}>
              <div className={cx("ctrStatLabel")}>Total Projects</div>
              <div className={cx("ctrStatValue", "colorMuted2")}>{projects.length}</div>
            </div>
            <div className={cx("ctrStatCardDivider")} />
            <div className={cx("ctrStatCardBottom")}>
              <span className={cx("ctrStatDot", "dotBgMuted2")} />
              <span className={cx("ctrStatMeta")}>all statuses</span>
            </div>
          </div>

        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className={cx("ctrSection")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateTitle")}>Failed to load data.</div>
            <div className={cx("emptyStateSub")}>{error}</div>
          </div>
        </div>
      )}

      {/* ── Admin notice ──────────────────────────────────────────────── */}
      {!error && (
        <div className={cx("ctrSection")}>
          <div className={cx("ctrSectionHeader")}>
            <div className={cx("ctrSectionTitle")}>Contract Access</div>
          </div>

          <div className={cx("emptyState")}>
            <div className={cx("emptyStateTitle")}>Contracts are managed by the admin team</div>
            <div className={cx("emptyStateSub")}>
              Contract documents are created, signed, and stored by administrators.
              Contact your admin for contract details. Your assigned clients and projects
              are shown below for reference.
            </div>
          </div>
        </div>
      )}

      {/* ── Client + project list ─────────────────────────────────────── */}
      {!error && clients.length > 0 && (
        <div className={cx("ctrSection")}>
          <div className={cx("ctrSectionHeader")}>
            <div className={cx("ctrSectionTitle")}>Your Clients &amp; Projects</div>
            <span className={cx("ctrSectionMeta")}>{clients.length} CLIENTS</span>
          </div>

          <div className={cx("ctrList")}>
            {clients.map((client, idx) => {
              const clientProjects = projects.filter((p) => p.clientId === client.id);
              const isLast = idx === clients.length - 1;
              const hasActiveProject = clientProjects.some(
                (p) => p.status === "IN_PROGRESS" || p.status === "ACTIVE"
              );

              return (
                <div
                  key={client.id}
                  className={cx(
                    "ctrCard",
                    hasActiveProject && "ctrCardActive",
                    isLast && "ctrCardLast"
                  )}
                >
                  {/* Head */}
                  <div className={cx("ctrCardHead")}>
                    <span className={cx("ctrContractId")}>
                      {client.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={cx(
                        "ctrStatusBadge",
                        client.status === "ACTIVE" || client.status === "active"
                          ? "ctrStatusActive"
                          : "ctrStatusExpired"
                      )}
                    >
                      {client.status}
                    </span>
                  </div>

                  {/* Client name */}
                  <div className={cx("ctrClientName")}>{client.name}</div>

                  {/* Tier + industry */}
                  <div className={cx("ctrMetaRow")}>
                    {client.tier && (
                      <span className={cx("ctrTypeBadge", tierBadgeCls(client.tier))}>
                        {client.tier}
                      </span>
                    )}
                    {client.industry && (
                      <span className={cx("ctrRenewalChip", "ctrRenewalNa")}>
                        {client.industry}
                      </span>
                    )}
                  </div>

                  {/* Projects */}
                  {clientProjects.length > 0 && (
                    <div className={cx("ctrCardFooter")}>
                      <span className={cx("ctrValueLabel")}>
                        {clientProjects.length} project{clientProjects.length !== 1 ? "s" : ""}
                      </span>
                      <div className={cx("flexCol", "gap4", "flexAlignEnd")}>
                        {clientProjects.slice(0, 3).map((p) => (
                          <span key={p.id} className={cx("ctrStatusBadge", projectStatusCls(p.status))}>
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!error && clients.length === 0 && (
        <div className={cx("ctrSection")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div className={cx("emptyStateTitle")}>No clients assigned</div>
            <div className={cx("emptyStateSub")}>
              No clients are currently assigned to your account.
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
