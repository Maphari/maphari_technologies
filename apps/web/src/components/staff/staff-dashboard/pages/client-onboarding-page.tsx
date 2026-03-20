"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { PageId } from "../types";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffClients,
  type StaffClient
} from "../../../../lib/api/staff/clients";
import {
  loadClientOnboardingWithRefresh,
  patchClientOnboardingRecordWithRefresh,
  type ClientOnboardingRecord
} from "../../../../lib/api/admin/onboarding";

type OnboardingStatus = "complete" | "in_progress" | "stuck";
type StepCategory = "Staff" | "Client" | "Both";

type OnboardingStep = {
  id: string;
  label: string;
  category: StepCategory;
  done: boolean;
  doneAt: string | null;
  scheduledFor?: string;
  blocked?: boolean;
  overdue?: boolean;
  overdueDays?: number;
};

type OnboardingClient = {
  id: number;
  client: string;
  avatar: string;
  contact: string;
  project: string;
  startDate: string;
  status: OnboardingStatus;
  completedAt: string | null;
  daysToComplete: number | null;
  steps: OnboardingStep[];
  notes: string;
  health: number;
};

// ── Helpers: map API records to local shape ───────────────────────────────────

function inferCategory(rec: ClientOnboardingRecord): StepCategory {
  const cat = (rec.category ?? "").toLowerCase();
  if (cat === "staff") return "Staff";
  if (cat === "client") return "Client";
  if (cat === "both" || cat === "joint") return "Both";
  // owner-based fallback
  const owner = (rec.owner ?? "").toLowerCase();
  if (owner.includes("client")) return "Client";
  return "Staff";
}

function inferOverdue(rec: ClientOnboardingRecord): { overdue: boolean; overdueDays: number } {
  if (rec.status === "complete" || !rec.estimatedAt) return { overdue: false, overdueDays: 0 };
  const est = new Date(rec.estimatedAt).getTime();
  const now = Date.now();
  if (est < now) {
    const days = Math.ceil((now - est) / 86_400_000);
    return { overdue: true, overdueDays: days };
  }
  return { overdue: false, overdueDays: 0 };
}

function buildOnboardingClient(
  client: StaffClient,
  records: ClientOnboardingRecord[],
  idx: number
): OnboardingClient {
  const sorted = [...records].sort((a, b) => a.sortOrder - b.sortOrder);
  const steps: OnboardingStep[] = sorted.map((rec) => {
    const { overdue, overdueDays } = inferOverdue(rec);
    return {
      id: rec.id,
      label: rec.task,
      category: inferCategory(rec),
      done: rec.status === "complete",
      doneAt: rec.completedAt ? new Date(rec.completedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) : null,
      scheduledFor: rec.estimatedAt ? new Date(rec.estimatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) : undefined,
      blocked: rec.status === "blocked",
      overdue,
      overdueDays
    };
  });

  const allDone = steps.length > 0 && steps.every((s) => s.done);
  const hasBlocked = steps.some((s) => s.blocked);
  const status: OnboardingStatus = allDone ? "complete" : hasBlocked ? "stuck" : "in_progress";

  const firstStep = sorted[0];
  const startDate = firstStep
    ? new Date(firstStep.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
    : "";

  const completedRec = sorted.filter((r) => r.status === "complete").sort((a, b) =>
    new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime()
  )[0];
  const completedAt = allDone && completedRec?.completedAt
    ? new Date(completedRec.completedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
    : null;

  let daysToComplete: number | null = null;
  if (allDone && firstStep && completedRec?.completedAt) {
    daysToComplete = Math.max(1, Math.ceil(
      (new Date(completedRec.completedAt).getTime() - new Date(firstStep.createdAt).getTime()) / 86_400_000
    ));
  }

  const notesArr = sorted.map((r) => r.notes).filter(Boolean);
  const notes = notesArr.length > 0 ? notesArr.join(" | ") : (hasBlocked ? "One or more steps are blocked." : "No notes.");

  const initials = client.name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();

  return {
    id: idx + 1,
    client: client.name,
    avatar: initials,
    contact: client.contactEmail ?? client.name,
    project: `Project for ${client.name}`,
    startDate,
    status,
    completedAt,
    daysToComplete,
    steps,
    notes,
    health: allDone ? 100 : Math.round((steps.filter((s) => s.done).length / Math.max(steps.length, 1)) * 100)
  };
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function statusToneClass(status: OnboardingStatus) {
  if (status === "complete") return "coStatusComplete";
  if (status === "in_progress") return "coStatusProgress";
  return "coStatusStuck";
}

function statusMeterClass(status: OnboardingStatus) {
  if (status === "complete") return "coMeterComplete";
  if (status === "in_progress") return "coMeterProgress";
  return "coMeterStuck";
}

function statusLabel(status: OnboardingStatus) {
  if (status === "complete") return "Complete";
  if (status === "in_progress") return "In Progress";
  return "Stuck";
}

function statusColor(status: OnboardingStatus) {
  if (status === "complete") return "var(--accent)";
  if (status === "in_progress") return "var(--blue)";
  return "var(--red)";
}

function categoryToneClass(category: StepCategory) {
  if (category === "Staff") return "coCatStaff";
  if (category === "Client") return "coCatClient";
  return "coCatBoth";
}

function categoryLabel(category: StepCategory) {
  if (category === "Staff") return "Staff action";
  if (category === "Client") return "Client action";
  return "Joint";
}

function ProgressRing({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cx("coRing")}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className={cx("coRingTrack")} strokeWidth="4" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        className={cx("coRingArc")}
        strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={color} className={cx("coRingPct")}>
        {pct}%
      </text>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientOnboardingPage({ isActive, session, onNavigate }: { isActive: boolean; session: AuthSession | null; onNavigate?: (page: PageId) => void }) {
  const [onboardingClients, setOnboardingClients] = useState<OnboardingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | "">("");
  const [filter, setFilter] = useState<"all" | OnboardingStatus>("all");

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    try {
      const clientsResult = await getStaffClients(session);
      if (clientsResult.nextSession) saveSession(clientsResult.nextSession);
      const staffClients = clientsResult.data ?? [];

      // Fetch onboarding records for each client that is onboarding/active
      const onboardingResults = await Promise.all(
        staffClients.map((c) => loadClientOnboardingWithRefresh(session, c.id))
      );

      const mapped: OnboardingClient[] = [];
      staffClients.forEach((client, idx) => {
        const result = onboardingResults[idx];
        if (result) {
          if (result.nextSession) saveSession(result.nextSession);
          const records = result.data ?? [];
          if (records.length > 0) {
            mapped.push(buildOnboardingClient(client, records, mapped.length));
          }
        }
      });

      setOnboardingClients(mapped);
      if (mapped.length > 0 && (selected === "" || !mapped.some((c) => c.id === selected))) {
        setSelected(mapped[0]!.id);
      }
    } catch {
      // network error — keep previous state
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // ── Complete step handler ───────────────────────────────────────────────────
  const handleCompleteStep = useCallback(async (step: OnboardingStep) => {
    if (!session || !current) return;
    // Find the actual clientId from the staff clients API
    // We need to look up by the OnboardingClient record
    const clientsResult = await getStaffClients(session);
    if (clientsResult.nextSession) saveSession(clientsResult.nextSession);
    const staffClients = clientsResult.data ?? [];

    // Match by name
    const matchedClient = staffClients.find((c) => c.name === current.client);
    if (!matchedClient) return;

    setCompleting(step.id);
    try {
      const r = await patchClientOnboardingRecordWithRefresh(
        session,
        matchedClient.id,
        step.id,
        { status: "complete", completedAt: new Date().toISOString() }
      );
      if (r.nextSession) saveSession(r.nextSession);
      // Refresh data after completing
      await fetchData();
    } catch {
      // swallow
    } finally {
      setCompleting(null);
    }
  }, [session, fetchData]);

  const filtered = useMemo(
    () => onboardingClients.filter((client) => (filter === "all" ? true : client.status === filter)),
    [filter, onboardingClients]
  );
  const current = onboardingClients.find((client) => client.id === selected) ?? onboardingClients[0];

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading && onboardingClients.length === 0) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-onboarding">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  // Guard: empty state
  if (!current) {
    return (
      <section
        className={cx("page", "pageBody", isActive && "pageActive")}
        id="page-client-onboarding"
      >
        <div className={cx("p24", "colorMuted", "text12", "textCenter")}>
          No onboarding clients yet.
        </div>
      </section>
    );
  }

  const doneSteps = current.steps.filter((step) => step.done).length;
  const totalSteps = current.steps.length;
  const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const staffSteps = current.steps.filter((step) => step.category === "Staff" || step.category === "Both");
  const clientSteps = current.steps.filter((step) => step.category === "Client" || step.category === "Both");
  const staffDone = staffSteps.filter((step) => step.done).length;
  const clientDone = clientSteps.filter((step) => step.done).length;

  return (
    <section
      className={cx("page", "pageBody", isActive && "pageActive")}
      id="page-client-onboarding"
      style={isActive ? { height: "100%", display: "flex", flexDirection: "column", padding: 0 } : undefined}
    >
      <div className={cx("pageHeaderBar", "coHeaderBar", "noShrink")}>
        <div className={cx("flexBetween", "mb20", "coHeaderTop")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Management</div>
            <h1 className={cx("pageTitleText")}>Client Onboarding</h1>
          </div>
          <div className={cx("coTopStats")}>
            {[
              { label: "Active", value: onboardingClients.filter((client) => client.status === "in_progress").length, className: "colorBlue" },
              { label: "Stuck", value: onboardingClients.filter((client) => client.status === "stuck").length, className: "colorRed" },
              { label: "Complete", value: onboardingClients.filter((client) => client.status === "complete").length, className: "colorAccent" }
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight")}>
                <div className={cx("statLabelNew")}>{stat.label}</div>
                <div className={cx("statValueNew", stat.className)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("coFilterRow")}>
          {(
            [
              { value: "all",         label: "All",         activeClass: "coFilterPillActiveAll",   count: onboardingClients.length },
              { value: "in_progress", label: "In Progress", activeClass: "coFilterPillActiveBlue",  count: onboardingClients.filter((c) => c.status === "in_progress").length },
              { value: "stuck",       label: "Stuck",       activeClass: "coFilterPillActiveRed",   count: onboardingClients.filter((c) => c.status === "stuck").length },
              { value: "complete",    label: "Complete",    activeClass: "coFilterPillActiveGreen", count: onboardingClients.filter((c) => c.status === "complete").length },
            ] as const
          ).map((tab) => {
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                className={cx("coFilterBtn", "coFilterPill", active ? "coFilterPillActive" : "coFilterPillIdle", active && tab.activeClass)}
                onClick={() => setFilter(tab.value)}
              >
                {tab.label}
                <span className={cx("coFilterPillCount")}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={cx("coLayout")}>
        <div className={cx("coClientRail")}>
          {filtered.map((client) => {
            const isSelected = selected === client.id;
            const done = client.steps.filter((step) => step.done).length;
            const progress = Math.round((done / client.steps.length) * 100);
            return (
              <div
                key={client.id}
                className={cx("coClientItem", "coClientCard", isSelected && "coClientCardSelected", statusToneClass(client.status))}
                onClick={() => setSelected(client.id)}
              >
                <div className={cx("coClientTop")}>
                  <div className={cx("coAvatar")}>{client.avatar}</div>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("coClientName", isSelected ? "colorText" : "colorMuted")}>{client.client}</div>
                    <div className={cx("coClientProject")}>{client.project}</div>
                  </div>
                  <span className={cx("coStatusBadge", statusToneClass(client.status))}>{statusLabel(client.status)}</span>
                </div>
                <div className={cx("coProgressRow")}>
                  <progress className={cx("progressMeter", "coProgressBar", statusMeterClass(client.status))} max={100} value={progress} />
                  <span className={cx("text10", statusToneClass(client.status), "coPctMin")}>{progress}%</span>
                </div>
                <div className={cx("text10", "colorMuted2", "mt6")}>
                  {done}/{client.steps.length} steps - started {client.startDate.split(",")[0]}
                </div>
              </div>
            );
          })}
        </div>

        <div className={cx("coDetailPane")}>
          <div className={cx("coDetailHead")}>
            <div className={cx("coDetailIdentity")}>
              <ProgressRing pct={pct} color={statusColor(current.status)} size={64} />
              <div>
                <div className={cx("coClientTitle")}>{current.client}</div>
                <div className={cx("text11", "colorMuted2", "mb6")}>{current.contact} - {current.project}</div>
                <div className={cx("coMetaRow")}>
                  <span className={cx("coStatusBadge", statusToneClass(current.status), "coBadgePad")}>{statusLabel(current.status)}</span>
                  <span className={cx("text10", "colorMuted2")}>Started {current.startDate}</span>
                  {current.completedAt ? <span className={cx("text10", "colorAccent")}>Completed {current.completedAt} ({current.daysToComplete} days)</span> : null}
                </div>
              </div>
            </div>

            <div className={cx("coSplitStats")}>
              {[
                { label: "Staff", done: staffDone, total: staffSteps.length, className: "colorBlue" },
                { label: "Client", done: clientDone, total: clientSteps.length, className: "colorAccent" }
              ].map((group) => (
                <div key={group.label} className={cx("coStatCard")}>
                  <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{group.label}</div>
                  <div className={cx("fontDisplay", "fw800", "text20", group.className)}>{group.done}/{group.total}</div>
                  <div className={cx("text10", "colorMuted2", "mt4")}>steps done</div>
                </div>
              ))}
            </div>
          </div>

          {current.status === "stuck" ? (
            <div className={cx("coBlockedBanner", "mb20")}>
              <span className={cx("text14", "colorRed", "noShrink")}>⚠</span>
              <div>
                <div className={cx("text12", "colorRed", "mb4")}>Onboarding blocked</div>
                <div className={cx("text11", "colorMuted")}>{current.notes}</div>
              </div>
            </div>
          ) : null}

          <div className={cx("mb24")}>
            <div className={cx("sectionLabel", "mb16")}>Onboarding Checklist</div>
            <div className={cx("flexCol")}>
              {current.steps.map((step, index) => {
                const isLast = index === current.steps.length - 1;
                const isBlocked = Boolean(step.blocked);
                const isOverdue = Boolean(step.overdue);
                const isCompleting = completing === step.id;
                return (
                  <div key={step.id}>
                    <div className={cx("coStepRow", "coStepRowCard", isOverdue && "coStepRowOverdue")}>
                      <div className={cx("coStepTrail")}>
                        <div className={cx("coStepCheckbox", step.done ? "coStepDone" : isOverdue ? "coStepOverdue" : isBlocked ? "coStepBlocked" : "coStepPending")}>
                          {step.done ? "✓" : isOverdue ? "!" : ""}
                        </div>
                        {!isLast ? <div className={cx("coStepConnector", step.done ? "coStepConnectorDone" : "coStepConnectorIdle")} /> : null}
                      </div>

                      <div className={cx("flex1", "minW0")}>
                        <div className={cx("coStepTitleRow")}>
                          <span className={cx("coStepTitle", step.done ? "coStepTitleDone" : isBlocked ? "coStepTitleBlocked" : "coStepTitleOpen")}>{step.label}</span>
                          <span className={cx("coCatBadge", categoryToneClass(step.category))}>{categoryLabel(step.category)}</span>
                          {isBlocked && !isOverdue ? <span className={cx("coFlagBlocked")}>Blocked</span> : null}
                          {isOverdue ? <span className={cx("coFlagOverdue")}>Overdue {step.overdueDays} days</span> : null}
                          {!step.done && !isBlocked ? (
                            <button
                              type="button"
                              className={cx("coActionBtn", "coActionBtnBase", "coActionAccent", "mlAuto", "p2x10", "fs10")}
                              disabled={isCompleting}
                              onClick={() => void handleCompleteStep(step)}
                            >
                              {isCompleting ? "Saving..." : "Complete step"}
                            </button>
                          ) : null}
                        </div>
                        <div className={cx("text10", "colorMuted2", "mt4")}>
                          {step.done
                            ? `Completed ${step.doneAt}`
                            : step.scheduledFor
                              ? `Scheduled ${step.scheduledFor}`
                              : step.blocked
                                ? "Waiting on previous step"
                                : "Pending"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={cx("coNotesBox", "mb20")}>
            <div className={cx("coNotesLabel")}>Staff Notes</div>
            <div className={cx("coNotesText")}>{current.notes}</div>
          </div>

          {current.status !== "complete" ? (
            <div className={cx("coActionsWrap")}>
              <div className={cx("sectionLabel", "mb4", "wFull")}>Actions</div>
              <button
                type="button"
                className={cx("coActionBtn", "coActionBtnBase", "coActionGhost")}
                onClick={() => onNavigate?.("comms")}
              >
                View client portal
              </button>
            </div>
          ) : (
            <div className={cx("coCompleteBanner")}>
              <span className={cx("text20")}>✓</span>
              <div>
                <div className={cx("text13", "colorAccent")}>Onboarding complete</div>
                <div className={cx("text11", "colorMuted2", "mt2")}>Completed in {current.daysToComplete} days - project fully active.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
