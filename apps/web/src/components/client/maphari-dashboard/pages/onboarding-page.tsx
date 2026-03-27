"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalAppointmentsWithRefresh,
  loadPortalContractsWithRefresh,
  loadPortalOffboardingWithRefresh,
  loadPortalOnboardingChecklistWithRefresh,
  loadPortalOnboardingWithRefresh,
  loadPortalProfileWithRefresh,
  loadPortalProjectDetailWithRefresh,
  patchPortalOffboardingTaskWithRefresh,
  patchPortalOnboardingRecordWithRefresh,
  type PortalAppointment,
  type PortalClientProfile,
  type PortalContract,
  type PortalOffboardingTask,
  type PortalOnboardingChecklist,
  type PortalOnboardingRecord,
  type PortalProjectDetail,
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

type OnboardTab = "Overview" | "Setup Checklist" | "How We Work" | "Offboarding";
type StageStatus = "done" | "active" | "pending";

function toStageStatus(status: string): StageStatus {
  if (status === "COMPLETED") return "done";
  if (status === "IN_PROGRESS") return "active";
  return "pending";
}

function fmtDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(raw: string | null | undefined): string {
  if (!raw) return "—";
  return new Date(raw).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtCurrency(cents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const bucket = key(item);
    if (!acc[bucket]) acc[bucket] = [];
    acc[bucket].push(item);
    return acc;
  }, {});
}

const TABS: OnboardTab[] = ["Overview", "Setup Checklist", "How We Work", "Offboarding"];

const HOW_WE_WORK_STEPS = [
  { title: "Discovery & Kickoff", desc: "We confirm business context, working goals, and the exact scope that needs to ship first." },
  { title: "Planning & Alignment", desc: "Milestones, owners, approvals, and operating rhythm are defined against the live project plan." },
  { title: "Build & Review", desc: "Delivery work happens in tracked stages with approvals and evidence captured in the portal." },
  { title: "QA & Sign-off", desc: "Testing, revisions, and launch-readiness checks are completed before release." },
  { title: "Launch & Handover", desc: "We transition from implementation into handover, training, and final acceptance." },
  { title: "Support Window", desc: "Post-launch support and any closeout tasks are managed with the same audit trail." },
];

const COMMS_NORMS = [
  { icon: "mail", title: "Weekly Digest", desc: "A concise update covering progress, blockers, and decisions needed from your team." },
  { icon: "message", title: "Portal Messaging", desc: "Use messages for clarifications so decisions remain tied to the account record." },
  { icon: "check", title: "Formal Approvals", desc: "Approvals, signatures, and scope decisions should happen in the portal, not in chat." },
  { icon: "calendar", title: "Scheduled Sessions", desc: "Kickoff, review, and wrap-up calls are booked against real availability and tracked here." },
];

export function OnboardingPage() {
  const { session, projectId } = useProjectLayer();
  const clientId = session?.user.clientId ?? "";

  const [tab, setTab] = useState<OnboardTab>("Overview");
  const [project, setProject] = useState<PortalProjectDetail | null>(null);
  const [profile, setProfile] = useState<PortalClientProfile | null>(null);
  const [checklist, setChecklist] = useState<PortalOnboardingChecklist | null>(null);
  const [contracts, setContracts] = useState<PortalContract[]>([]);
  const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
  const [onboarding, setOnboarding] = useState<PortalOnboardingRecord[]>([]);
  const [offboarding, setOffboarding] = useState<PortalOffboardingTask[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);
  const [loadingOffboarding, setLoadingOffboarding] = useState(false);
  const [offboardingLoaded, setOffboardingLoaded] = useState(false);
  const [toast, setToast] = useState<{ title: string; sub: string } | null>(null);

  useEffect(() => {
    if (!session || !projectId) {
      setLoadingProject(false);
      return;
    }
    setLoadingProject(true);
    void loadPortalProjectDetailWithRefresh(session, projectId).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setProject(result.data);
    }).finally(() => setLoadingProject(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, projectId]);

  useEffect(() => {
    if (!session) {
      setLoadingAccount(false);
      return;
    }
    setLoadingAccount(true);
    void Promise.all([
      loadPortalOnboardingChecklistWithRefresh(session),
      loadPortalProfileWithRefresh(session),
      loadPortalContractsWithRefresh(session, projectId ?? undefined),
      loadPortalAppointmentsWithRefresh(session),
    ]).then(([checklistResult, profileResult, contractsResult, appointmentsResult]) => {
      if (checklistResult.nextSession) saveSession(checklistResult.nextSession);
      if (profileResult.nextSession) saveSession(profileResult.nextSession);
      if (contractsResult.nextSession) saveSession(contractsResult.nextSession);
      if (appointmentsResult.nextSession) saveSession(appointmentsResult.nextSession);

      setChecklist(checklistResult.data ?? { steps: [], allDone: false, completedCount: 0 });
      setProfile(profileResult.data ?? null);
      setContracts((contractsResult.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder));
      setAppointments((appointmentsResult.data ?? []).slice().sort((a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      ));
    }).finally(() => setLoadingAccount(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, projectId]);

  useEffect(() => {
    if (!session || !clientId) {
      setLoadingOnboarding(false);
      return;
    }
    setLoadingOnboarding(true);
    void loadPortalOnboardingWithRefresh(session, clientId).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setOnboarding(result.data.slice().sort((a, b) => a.sortOrder - b.sortOrder));
    }).finally(() => setLoadingOnboarding(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, clientId]);

  useEffect(() => {
    if (tab !== "Offboarding" || !session || !clientId || offboardingLoaded) return;
    setLoadingOffboarding(true);
    void loadPortalOffboardingWithRefresh(session, clientId).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setOffboarding(result.data.slice().sort((a, b) => a.sortOrder - b.sortOrder));
      setOffboardingLoaded(true);
    }).finally(() => setLoadingOffboarding(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, session?.accessToken, clientId]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function notify(title: string, sub: string) {
    setToast({ title, sub });
  }

  const checklistSteps = checklist?.steps ?? [];
  const checklistCompleted = checklist?.completedCount ?? 0;
  const checklistPercent = checklistSteps.length > 0 ? Math.round((checklistCompleted / checklistSteps.length) * 100) : 0;
  const companyName = profile?.companyName ?? profile?.name ?? "Your account";
  const approvalChannel = profile?.approvalPreferences?.preferredChannel ?? "PORTAL";
  const primaryStakeholder = (profile?.stakeholders ?? []).find((stakeholder) => stakeholder.isPrimary) ?? profile?.stakeholders?.[0] ?? null;

  const stages = useMemo(() => onboarding.map((record) => ({
    id: record.id,
    label: record.stageLabel,
    status: toStageStatus(record.status),
    date: record.status === "COMPLETED"
      ? fmtDate(record.completedAt)
      : record.estimatedAt ? `Est. ${fmtDate(record.estimatedAt)}` : undefined,
    record,
  })), [onboarding]);

  const donePct = useMemo(() => {
    if (!onboarding.length) return 0;
    return Math.round((onboarding.filter((record) => record.status === "COMPLETED").length / onboarding.length) * 100);
  }, [onboarding]);

  const completedCount = onboarding.filter((record) => record.status === "COMPLETED").length;
  const activeStage = stages.find((stage) => stage.status === "active");
  const signedContracts = contracts.filter((contract) => contract.signed || contract.status === "SIGNED").length;
  const pendingContracts = contracts.filter((contract) => !contract.signed && contract.status !== "VOID");
  const upcomingAppointment = appointments.find((appointment) =>
    new Date(appointment.scheduledAt).getTime() >= Date.now() && appointment.status !== "CANCELLED"
  ) ?? null;
  const recentAppointment = [...appointments].reverse().find(() => true) ?? null;
  const pendingChecklistSteps = checklistSteps.filter((step) => !step.done);
  const offboardGroups = useMemo(() => groupBy(offboarding, (task) => task.groupName), [offboarding]);

  async function handleToggleOnboarding(record: PortalOnboardingRecord) {
    if (!session || !clientId) return;
    const nextStatus = record.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    setOnboarding((prev) => prev.map((item) => (
      item.id === record.id
        ? { ...item, status: nextStatus, completedAt: nextStatus === "COMPLETED" ? new Date().toISOString() : null }
        : item
    )));
    const result = await patchPortalOnboardingRecordWithRefresh(session, clientId, record.id, {
      status: nextStatus,
      completedAt: nextStatus === "COMPLETED" ? new Date().toISOString() : undefined,
    });
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error) {
      setOnboarding((prev) => prev.map((item) => item.id === record.id ? record : item));
      notify("Update failed", result.error.message ?? "Could not update onboarding stage.");
    }
  }

  async function handleToggleOffboarding(task: PortalOffboardingTask) {
    if (!session || !clientId) return;
    const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    const completedAt = nextStatus === "COMPLETED" ? new Date().toISOString() : null;
    setOffboarding((prev) => prev.map((item) => (
      item.id === task.id
        ? { ...item, status: nextStatus, completedAt }
        : item
    )));
    const result = await patchPortalOffboardingTaskWithRefresh(session, clientId, task.id, {
      status: nextStatus,
      completedAt: completedAt ?? undefined,
    });
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error) {
      setOffboarding((prev) => prev.map((item) => item.id === task.id ? task : item));
      notify("Update failed", result.error.message ?? "Could not update offboarding task.");
    }
  }

  return (
    <div className={cx("pageBody", styles.onboardFlowRoot, "rdStudioPage")}>
      <section className={styles.onboardFlowMain}>
        <div className={styles.onboardFlowTopShell}>
          <div className={cx("pageHeader", "mb0", styles.onboardFlowTopHeader)}>
            <div className={styles.onboardFlowTopIntro}>
              <div className={cx("pageEyebrow")}>Account · Onboarding</div>
              <h1 className={cx("pageTitle")}>Onboarding Hub</h1>
              <p className={cx("pageSub", styles.onboardFlowTopSub)}>Track account setup, live delivery progress, and wrap-up readiness in one place.</p>
            </div>
          </div>

          {loadingOnboarding || loadingAccount ? (
            <div className={cx("flexCol", "gap12")}>
              <div className={cx("skeletonBlock", "skeleH68")} />
            </div>
          ) : (
            <div className={cx("obsKpiRow", styles.onboardFlowTopKpis)}>
              {[
                {
                  label: "Account Setup",
                  value: checklistSteps.length ? `${checklistCompleted} / ${checklistSteps.length}` : "—",
                  sub: "Client-side readiness tasks",
                },
                {
                  label: "Delivery Progress",
                  value: onboarding.length ? `${donePct}%` : "—",
                  sub: onboarding.length ? `${completedCount} of ${onboarding.length} stages complete` : "No stages configured",
                },
                {
                  label: "Profile Health",
                  value: profile?.profileCompleteness ? `${profile.profileCompleteness.score}%` : "—",
                  sub: profile?.profileCompleteness
                    ? `${profile.profileCompleteness.completedItems} of ${profile.profileCompleteness.totalItems} profile items complete`
                    : "Profile completeness unavailable",
                },
                {
                  label: "Next Session",
                  value: upcomingAppointment ? fmtDate(upcomingAppointment.scheduledAt) : "Not booked",
                  sub: upcomingAppointment ? upcomingAppointment.type : "Book kickoff or review time",
                },
              ].map((card) => (
                <div key={card.label} className={cx("obsKpiCard")}>
                  <div className={cx("obsKpiLabel")}>{card.label}</div>
                  <div className={cx("obsKpiValue")}>{card.value}</div>
                  <div className={cx("obsKpiMeta")}>{card.sub}</div>
                </div>
              ))}
            </div>
          )}

          {!loadingOnboarding && stages.length > 0 && (
            <div className={cx("card", "obsStepper", styles.onboardFlowTopStepper)}>
              <div className={cx("obsStepperTitle")}>Delivery Activation Timeline</div>
              <div className={cx("obsStages")}>
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={cx(
                      "obsStage",
                      stage.status === "done" && "obsStageDone",
                      stage.status === "active" && "obsStageActive",
                    )}
                  >
                    <div className={cx("obsStageNode")}>
                      {stage.status === "done" ? "✓" : stage.status === "active" ? `${index + 1}` : "○"}
                    </div>
                    {index < stages.length - 1 && (
                      <div className={cx("obsConnector", stage.status === "done" && "obsConnectorDone")} />
                    )}
                    <div className={cx("obsStageLabel")}>{stage.label}</div>
                    {stage.date && <div className={cx("obsStageDate")}>{stage.date}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.onboardFlowTabs}>
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                className={cx(styles.onboardFlowTab, tab === item && styles.onboardFlowTabActive)}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {tab === "Overview" && (
          <div className={styles.onboardFlowContent}>
            <div className={styles.onboardFlowWelcomeCard}>
              <div className={styles.onboardFlowWelcomeEyebrow}>Account activation</div>
              <div className={styles.onboardFlowWelcomeTitle}>
                {loadingProject
                  ? "Loading your workspace…"
                  : `${companyName} is onboarding into ${project?.name ?? "your client workspace"}.`}
              </div>
              <div className={styles.onboardFlowWelcomeBody}>
                {loadingProject ? "Please wait while project and account signals are loaded." : (
                  <>
                    This page is the operational view of onboarding. It shows what your team still needs to complete,
                    which agreements are pending, who owns communication, and what delivery stage is active.
                    {project?.startAt && <><br /><br />Project start: {fmtDate(project.startAt)}.</>}
                    {project?.dueAt && <> Target completion: {fmtDate(project.dueAt)}.</>}
                    {activeStage && <> Current delivery stage: {activeStage.label}.</>}
                  </>
                )}
              </div>

              {!loadingProject && project?.collaborators && project.collaborators.length > 0 && (
                <div className={styles.onboardFlowTeamRow}>
                  {project.collaborators.filter((member) => member.active).map((member) => (
                    <div key={member.id} className={styles.onboardFlowTeamCard}>
                      <div className={styles.onboardFlowAvatar}>{member.staffName.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div className={styles.onboardFlowTeamName}>{member.staffName}</div>
                        <div className={styles.onboardFlowTeamRole}>{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.onboardFlowGrid2}>
              <div>
                <div className={styles.onboardFlowSectionTitle}>Account Readiness</div>
                <div className={styles.onboardFlowPanel}>
                  {([
                    ["Company profile", profile?.profileCompleteness ? `${profile.profileCompleteness.score}% complete` : "Not started"],
                    ["Signed agreements", contracts.length ? `${signedContracts} / ${contracts.length}` : "No agreements loaded"],
                    ["Meetings booked", appointments.length ? `${appointments.length}` : "0"],
                    ["Approval channel", approvalChannel],
                    ["Billing email", profile?.billingEmail ?? "—"],
                    ["Timezone", profile?.timezone ?? "—"],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className={styles.onboardFlowMetaRow}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className={cx(styles.onboardFlowSectionTitle, "mt12")}>Immediate Next Actions</div>
                <div className={styles.onboardFlowPanel}>
                  {pendingChecklistSteps.slice(0, 4).map((step) => (
                    <div key={step.id} className={styles.onboardFlowQuickRow}>
                      <span className={styles.onboardFlowQuickIcon}><Ic n="clock" sz={16} /></span>
                      <div className={styles.onboardFlowGrow}>
                        <div className={styles.onboardFlowQuickTitle}>{step.label}</div>
                        <div className={styles.onboardFlowQuickDesc}>Client input still required for full account readiness.</div>
                      </div>
                      <span className={cx("badge", "badgeAmber")}>Open</span>
                    </div>
                  ))}
                  {!pendingChecklistSteps.length && (
                    <div className={styles.onboardFlowQuickRow}>
                      <span className={styles.onboardFlowQuickIcon}><Ic n="check" sz={16} /></span>
                      <div className={styles.onboardFlowGrow}>
                        <div className={styles.onboardFlowQuickTitle}>Core account setup is complete</div>
                        <div className={styles.onboardFlowQuickDesc}>Use the remaining tabs to manage delivery milestones and closeout tasks.</div>
                      </div>
                      <span className={cx("badge", "badgeGreen")}>Ready</span>
                    </div>
                  )}
                  {pendingContracts.slice(0, 1).map((contract) => (
                    <div key={contract.id} className={styles.onboardFlowQuickRow}>
                      <span className={styles.onboardFlowQuickIcon}><Ic n="file-text" sz={16} /></span>
                      <div className={styles.onboardFlowGrow}>
                        <div className={styles.onboardFlowQuickTitle}>{contract.title}</div>
                        <div className={styles.onboardFlowQuickDesc}>Agreement is still awaiting signature.</div>
                      </div>
                      <span className={cx("badge", "badgeMuted")}>{contract.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.onboardFlowGrid2}>
              <div>
                <div className={styles.onboardFlowSectionTitle}>Project at a Glance</div>
                <div className={styles.onboardFlowPanel}>
                  {([
                    ["Project", project?.name ?? "—"],
                    ["Start date", fmtDate(project?.startAt)],
                    ["Target date", fmtDate(project?.dueAt)],
                    ["Budget", project?.budgetCents != null ? fmtCurrency(project.budgetCents) : "—"],
                    ["Project lead", project?.ownerName ?? "—"],
                    ["Status", project?.status ?? "—"],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className={styles.onboardFlowMetaRow}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className={cx(styles.onboardFlowSectionTitle, "mt12")}>Account Contacts</div>
                <div className={styles.onboardFlowPanel}>
                  {([
                    ["Primary stakeholder", primaryStakeholder?.fullName ?? profile?.ownerName ?? "—"],
                    ["Role", primaryStakeholder?.jobTitle ?? primaryStakeholder?.role ?? "—"],
                    ["Email", primaryStakeholder?.email ?? profile?.billingEmail ?? "—"],
                    ["Preferred channel", primaryStakeholder?.preferredChannel ?? approvalChannel],
                    ["Last meeting", recentAppointment ? fmtDateTime(recentAppointment.scheduledAt) : "None booked"],
                    ["Upcoming meeting", upcomingAppointment ? fmtDateTime(upcomingAppointment.scheduledAt) : "Not scheduled"],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className={styles.onboardFlowMetaRow}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Setup Checklist" && (
          <div className={styles.onboardFlowContent}>
            {loadingOnboarding || loadingAccount ? (
              <div className={cx("flexCol", "gap12")}>
                <div className={cx("skeletonBlock", "skeleH68")} />
                <div className={cx("skeletonBlock", "skeleH80")} />
                <div className={cx("skeletonBlock", "skeleH68")} />
              </div>
            ) : (
              <div className={styles.onboardFlowGrid2}>
                <div>
                  <div className={cx(styles.onboardFlowHeadInline, "rdStudioSection")}>
                    <div className={styles.onboardFlowHeadLineWrap}>
                      <span className={styles.onboardFlowSectionTitlePlain}>Client Setup Checklist</span>
                      <div className={styles.onboardFlowHeadLine} />
                    </div>
                    <span className={cx("badge", checklistPercent === 100 ? "badgeGreen" : "badgeAmber")}>
                      {checklistSteps.length ? `${checklistPercent}% complete` : "No steps"}
                    </span>
                  </div>

                  <div className={cx("card", styles.onboardFlowCheckCard, "rdStudioCard")}>
                    {checklistSteps.length === 0 ? (
                      <div className={cx("emptyStateGlow", styles.onboardFlowEmptyState)}>
                        <div className={cx("emptyStateGlowIcon", styles.onboardFlowEmptyStateIcon)}>
                          <Ic n="shieldCheck" sz={20} c="var(--accent)" />
                        </div>
                        <div className={cx("emptyStateGlowTitle")}>Client setup is already in a good state</div>
                        <div className={cx("emptyStateGlowSub")}>No outstanding account-readiness tasks are blocking progress right now.</div>
                      </div>
                    ) : checklistSteps.map((step) => (
                      <div key={step.id} className={styles.onboardFlowCheckRow}>
                        <div className={cx(styles.onboardFlowCheckBox, step.done && styles.onboardFlowCheckDone)}>
                          {step.done ? "✓" : ""}
                        </div>
                        <div className={styles.onboardFlowGrow}>
                          <div className={cx(styles.onboardFlowCheckTitle, step.done && styles.onboardFlowStrike)}>
                            {step.label}
                          </div>
                          <div className={styles.onboardFlowCheckDesc}>
                            {step.done ? "Confirmed from live account data." : "Outstanding account setup task."}
                          </div>
                        </div>
                        <span className={cx("badge", step.done ? "badgeGreen" : "badgeMuted")}>
                          {step.done ? "Done" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className={cx(styles.onboardFlowHeadInline, "rdStudioSection", "mt12")}>
                    <div className={styles.onboardFlowHeadLineWrap}>
                      <span className={styles.onboardFlowSectionTitlePlain}>Delivery Stages</span>
                      <div className={styles.onboardFlowHeadLine} />
                    </div>
                    <span className={cx("badge", donePct === 100 ? "badgeGreen" : "badgeAmber")}>{donePct}% complete</span>
                  </div>

                  <div className={cx("card", styles.onboardFlowCheckCard, "rdStudioCard")}>
                    {onboarding.length === 0 ? (
                      <div className={cx("emptyStateGlow", styles.onboardFlowEmptyState)}>
                        <div className={cx("emptyStateGlowIcon", styles.onboardFlowEmptyStateIcon)}>
                          <Ic n="layers" sz={20} c="var(--accent)" />
                        </div>
                        <div className={cx("emptyStateGlowTitle")}>Delivery stages are not published yet</div>
                        <div className={cx("emptyStateGlowSub")}>Your account manager will add milestone stages here once onboarding planning is finalized.</div>
                      </div>
                    ) : onboarding.map((record) => {
                      const done = record.status === "COMPLETED";
                      return (
                        <div key={record.id} className={styles.onboardFlowCheckRow}>
                          <button
                            type="button"
                            className={cx(styles.onboardFlowCheckBox, done && styles.onboardFlowCheckDone)}
                            onClick={() => void handleToggleOnboarding(record)}
                            aria-label={done ? "Mark incomplete" : "Mark complete"}
                          >
                            {done ? "✓" : ""}
                          </button>
                          <div className={styles.onboardFlowGrow}>
                            <div className={cx(styles.onboardFlowCheckTitle, done && styles.onboardFlowStrike)}>
                              {record.stageLabel}
                            </div>
                            {record.notes && <div className={styles.onboardFlowCheckDesc}>{record.notes}</div>}
                            {done && record.completedAt && (
                              <div className={styles.onboardFlowCheckMeta}>Completed {fmtDate(record.completedAt)}</div>
                            )}
                            {!done && record.estimatedAt && (
                              <div className={styles.onboardFlowCheckMeta}>Est. {fmtDate(record.estimatedAt)}</div>
                            )}
                          </div>
                          {done
                            ? <span className={cx("badge", "badgeGreen")}>Done</span>
                            : record.status === "IN_PROGRESS"
                              ? <span className={cx("badge", "badgeAmber")}>Active</span>
                              : <span className={cx("badge", "badgeMuted")}>Pending</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "How We Work" && (
          <div className={styles.onboardFlowContent}>
            <div>
              <div className={styles.onboardFlowSectionTitle}>Delivery Model</div>
              <div className={cx("card", styles.onboardFlowStepCard, "rdStudioCard")}>
                {HOW_WE_WORK_STEPS.map((step, index) => (
                  <div key={step.title} className={styles.onboardFlowStepRow}>
                    <div className={cx(styles.onboardFlowStepNum, styles.onboardFlowStepPending)}>{index + 1}</div>
                    <div className={styles.onboardFlowGrow}>
                      <div className={styles.onboardFlowStepTitleRow}>
                        <div className={cx(styles.onboardFlowStepTitle, "rdStudioLabel")}>{step.title}</div>
                      </div>
                      <div className={styles.onboardFlowStepDesc}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className={styles.onboardFlowSectionTitle}>Communication Norms</div>
              <div className={styles.onboardFlowGrid2}>
                {COMMS_NORMS.map((item) => (
                  <div key={item.title} className={cx("card", styles.onboardFlowCommsCard)}>
                    <div className={styles.onboardFlowCommsIcon}><Ic n={item.icon} sz={18} /></div>
                    <div className={styles.onboardFlowCommsTitle}>{item.title}</div>
                    <div className={styles.onboardFlowCommsDesc}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "Offboarding" && (
          <div className={styles.onboardFlowContent}>
            {loadingOffboarding ? (
              <div className={cx("flexCol", "gap12")}>
                <div className={cx("skeletonBlock", "skeleH68")} />
                <div className={cx("skeletonBlock", "skeleH80")} />
              </div>
            ) : offboarding.length === 0 ? (
              <div className={cx("card")}>
                <div className={cx(styles.onboardFlowEmptyState, "emptyStateGlow")}>
                  <div className={cx("emptyStateGlowIcon", styles.onboardFlowEmptyStateIcon)}>
                    <Ic n="flag" sz={20} c="var(--amber)" />
                  </div>
                  <div className={cx("emptyStateGlowTitle")}>Offboarding is not active yet</div>
                  <div className={cx("emptyStateGlowSub")}>Wrap-up steps will unlock as the project moves into its final delivery phase.</div>
                </div>
              </div>
            ) : (
              Object.entries(offboardGroups).map(([group, tasks]) => (
                <div key={group}>
                  <div className={styles.onboardFlowSectionTitle}>{group}</div>
                  <div className={cx("card", styles.onboardFlowWrapCard)}>
                    {tasks.map((task) => {
                      const done = task.status === "COMPLETED";
                      return (
                        <div key={task.id} className={styles.onboardFlowWrapRow}>
                          <div className={styles.onboardFlowGrow}>
                            <div className={styles.onboardFlowWrapName}>{task.label}</div>
                            {task.actionLabel && <div className={styles.onboardFlowWrapMeta}>{task.actionLabel}</div>}
                            {done && task.completedAt && <div className={styles.onboardFlowWrapMeta}>Completed {fmtDate(task.completedAt)}</div>}
                          </div>
                          {done ? (
                            <span className={cx("badge", "badgeGreen")}>Done</span>
                          ) : (
                            <button
                              type="button"
                              className={cx("btnSm", "btnGhost")}
                              onClick={() => void handleToggleOffboarding(task)}
                            >
                              Mark done
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {toast && (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.sub}</div>
          </div>
        </div>
      )}
    </div>
  );
}
