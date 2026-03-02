"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

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

const onboardingClients: OnboardingClient[] = [
  {
    id: 1,
    client: "Volta Studios",
    avatar: "VS",
    contact: "Lena Muller",
    project: "Brand Identity System",
    startDate: "Jan 6, 2026",
    status: "complete",
    completedAt: "Jan 10, 2026",
    daysToComplete: 4,
    steps: [
      { id: "welcome", label: "Welcome email sent", category: "Staff", done: true, doneAt: "Jan 6" },
      { id: "brief", label: "Project brief shared", category: "Staff", done: true, doneAt: "Jan 6" },
      { id: "contract", label: "Contract signed", category: "Client", done: true, doneAt: "Jan 7" },
      { id: "deposit", label: "Deposit invoice paid", category: "Client", done: true, doneAt: "Jan 8" },
      { id: "portal", label: "Client portal activated", category: "Staff", done: true, doneAt: "Jan 8" },
      { id: "kickoff", label: "Kickoff call completed", category: "Both", done: true, doneAt: "Jan 9" },
      { id: "assets", label: "Brand assets received from client", category: "Client", done: true, doneAt: "Jan 10" },
      { id: "access", label: "Drive & tools access granted", category: "Staff", done: true, doneAt: "Jan 10" }
    ],
    notes: "Smooth onboarding - Lena was responsive throughout. Assets were delivered ahead of schedule.",
    health: 95
  },
  {
    id: 2,
    client: "Sunfield Ventures",
    avatar: "SV",
    contact: "Tariq Osei",
    project: "Go-to-Market Strategy",
    startDate: "Feb 17, 2026",
    status: "in_progress",
    completedAt: null,
    daysToComplete: null,
    steps: [
      { id: "welcome", label: "Welcome email sent", category: "Staff", done: true, doneAt: "Feb 17" },
      { id: "brief", label: "Project brief shared", category: "Staff", done: true, doneAt: "Feb 17" },
      { id: "contract", label: "Contract signed", category: "Client", done: true, doneAt: "Feb 18" },
      { id: "deposit", label: "Deposit invoice paid", category: "Client", done: true, doneAt: "Feb 19" },
      { id: "portal", label: "Client portal activated", category: "Staff", done: true, doneAt: "Feb 20" },
      { id: "kickoff", label: "Kickoff call completed", category: "Both", done: false, doneAt: null, scheduledFor: "Feb 24" },
      { id: "assets", label: "Brand assets received from client", category: "Client", done: false, doneAt: null },
      { id: "access", label: "Drive & tools access granted", category: "Staff", done: false, doneAt: null }
    ],
    notes: "Kickoff call scheduled for Feb 24. Assets request sent but no upload yet.",
    health: 72
  },
  {
    id: 3,
    client: "Meridian Labs",
    avatar: "ML",
    contact: "Priya Shenoy",
    project: "Product UX Design",
    startDate: "Feb 10, 2026",
    status: "stuck",
    completedAt: null,
    daysToComplete: null,
    steps: [
      { id: "welcome", label: "Welcome email sent", category: "Staff", done: true, doneAt: "Feb 10" },
      { id: "brief", label: "Project brief shared", category: "Staff", done: true, doneAt: "Feb 10" },
      { id: "contract", label: "Contract signed", category: "Client", done: true, doneAt: "Feb 11" },
      { id: "deposit", label: "Deposit invoice paid", category: "Client", done: false, doneAt: null, overdue: true, overdueDays: 5 },
      { id: "portal", label: "Client portal activated", category: "Staff", done: false, doneAt: null, blocked: true },
      { id: "kickoff", label: "Kickoff call completed", category: "Both", done: false, doneAt: null, blocked: true },
      { id: "assets", label: "Brand assets received from client", category: "Client", done: false, doneAt: null, blocked: true },
      { id: "access", label: "Drive & tools access granted", category: "Staff", done: false, doneAt: null, blocked: true }
    ],
    notes:
      "Stuck on deposit payment - 5 days overdue. Portal cannot be activated until payment clears. Follow up with Priya or escalate to account manager.",
    health: 38
  },
  {
    id: 4,
    client: "Hawthorn & Co",
    avatar: "HC",
    contact: "Sophie van der Berg",
    project: "Annual Brand Refresh",
    startDate: "Feb 20, 2026",
    status: "in_progress",
    completedAt: null,
    daysToComplete: null,
    steps: [
      { id: "welcome", label: "Welcome email sent", category: "Staff", done: true, doneAt: "Feb 20" },
      { id: "brief", label: "Project brief shared", category: "Staff", done: true, doneAt: "Feb 20" },
      { id: "contract", label: "Contract signed", category: "Client", done: false, doneAt: null, scheduledFor: "Feb 23" },
      { id: "deposit", label: "Deposit invoice paid", category: "Client", done: false, doneAt: null },
      { id: "portal", label: "Client portal activated", category: "Staff", done: false, doneAt: null },
      { id: "kickoff", label: "Kickoff call completed", category: "Both", done: false, doneAt: null },
      { id: "assets", label: "Brand assets received from client", category: "Client", done: false, doneAt: null },
      { id: "access", label: "Drive & tools access granted", category: "Staff", done: false, doneAt: null }
    ],
    notes: "Very early stage - started 3 days ago. Contract sent, awaiting signature by Feb 23.",
    health: 55
  }
];

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

export function ClientOnboardingPage({ isActive }: { isActive: boolean }) {
  const [selected, setSelected] = useState(onboardingClients[0].id);
  const [filter, setFilter] = useState<"all" | OnboardingStatus>("all");

  const filtered = useMemo(
    () => onboardingClients.filter((client) => (filter === "all" ? true : client.status === filter)),
    [filter]
  );
  const current = onboardingClients.find((client) => client.id === selected) ?? onboardingClients[0];

  const doneSteps = current.steps.filter((step) => step.done).length;
  const totalSteps = current.steps.length;
  const pct = Math.round((doneSteps / totalSteps) * 100);

  const staffSteps = current.steps.filter((step) => step.category === "Staff" || step.category === "Both");
  const clientSteps = current.steps.filter((step) => step.category === "Client" || step.category === "Both");
  const staffDone = staffSteps.filter((step) => step.done).length;
  const clientDone = clientSteps.filter((step) => step.done).length;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-onboarding">
      <div className={cx("pageHeaderBar", "coHeaderBar")}>
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

        <div className={cx("coFilterRow", "filterRow")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter onboarding clients"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | OnboardingStatus)}
          >
            <option value="all">All</option>
            <option value="in_progress">In progress</option>
            <option value="stuck">Stuck</option>
            <option value="complete">Complete</option>
          </select>
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
              {current.status === "stuck" ? (
                <button type="button" className={cx("coActionBtn", "coActionBtnBase", "coActionDanger")}>
                  Escalate to admin
                </button>
              ) : null}
              <button type="button" className={cx("coActionBtn", "coActionBtnBase", "coActionAccent")}>
                Send reminder to client
              </button>
              <button type="button" className={cx("coActionBtn", "coActionBtnBase", "coActionGhost")}>
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
