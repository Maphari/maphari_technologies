// ════════════════════════════════════════════════════════════════════════════
// onboarding-wizard.tsx — Multi-step first-login onboarding overlay
// Shows once per client; marks `onboarding_wizard_seen = "true"` on close.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { AuthSession } from "@/lib/auth/session";
import { saveSession } from "@/lib/auth/session";
import { setPortalPreferenceWithRefresh } from "@/lib/api/portal/settings";
import { loadPortalProjectsWithRefresh } from "@/lib/api/portal/projects";
import { loadPortalTeamMembersWithRefresh, type PortalTeamMember } from "@/lib/api/portal/team";
import type { PortalProject } from "@/lib/api/portal/types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  session: AuthSession | null;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local.charAt(0).toUpperCase() + local.slice(1).replace(/[._-]/g, " ").split(" ")[0];
}

function statusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "ACTIVE" || s === "IN_PROGRESS" || s === "COMPLETED") return "badgeGreen";
  if (s === "ON_HOLD" || s === "PAUSED") return "badgeAmber";
  if (s === "CANCELLED") return "badgeRed";
  return "badgeMuted";
}

// ── Component ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

export function OnboardingWizard({ session, onClose }: OnboardingWizardProps) {
  const [step, setStep]       = useState(0);
  const [project, setProject] = useState<PortalProject | null>(null);
  const [team, setTeam]       = useState<PortalTeamMember[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch project + team once when session is available
  useEffect(() => {
    if (!session) return;
    setLoadingData(true);

    const clientId = session.user.clientId ?? "";
    const fetches: [
      Promise<{ data: PortalProject[] | null; nextSession?: AuthSession | null }>,
      Promise<{ data: PortalTeamMember[] | null; nextSession?: AuthSession | null }>,
    ] = [
      loadPortalProjectsWithRefresh(session),
      clientId ? loadPortalTeamMembersWithRefresh(session, clientId) : Promise.resolve({ data: [], nextSession: null }),
    ];

    Promise.all(fetches)
      .then(([projRes, teamRes]) => {
        if (projRes.nextSession) saveSession(projRes.nextSession);
        if (teamRes.nextSession) saveSession(teamRes.nextSession);
        setProject((projRes.data ?? [])[0] ?? null);
        setTeam(teamRes.data ?? []);
      })
      .catch(() => {
        // leave project and team in default null/[] state — empty states render correctly
      })
      .finally(() => setLoadingData(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // Keep a ref to the latest handleClose so the Escape listener never closes over a stale copy
  const handleCloseRef = useRef(handleClose);
  useEffect(() => { handleCloseRef.current = handleClose; });

  // Close on Escape — empty deps are safe because we use a ref
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleClose() {
    if (session) {
      void setPortalPreferenceWithRefresh(session, {
        key: "onboarding_wizard_seen",
        value: "true",
      }).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
      });
    }
    onClose();
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  const firstName = session ? firstNameFromEmail(session.user.email) : "";

  return (
    <div
      className={cx("wizardOverlay")}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={cx("wizardPanel")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-wizard-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header row ────────────────────────────────────────────────── */}
        <div className={cx("wizardHeader")}>
          <div className={cx("flex", "gap6", "flexCenter")}>
            <Ic n="sparkle" sz={14} c="var(--lime)" />
            <span className={cx("text13", "fw600", "textMuted")}>
              Getting started — Step {step + 1} of {TOTAL_STEPS}
            </span>
          </div>
          <button
            type="button"
            className={cx("iconBtn")}
            onClick={handleClose}
            aria-label="Close wizard"
          >
            <Ic n="x" sz={15} c="currentColor" />
          </button>
        </div>

        {/* ── Step content ──────────────────────────────────────────────── */}
        <div className={cx("wizardBody")}>
          {step === 0 && <StepWelcome firstName={firstName} />}
          {step === 1 && <StepProject project={project} loading={loadingData} />}
          {step === 2 && <StepTeam team={team} loading={loadingData} />}
          {step === 3 && <StepDone />}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className={cx("wizardFooter")}>
          {/* Back button */}
          <div>
            {step > 0 && (
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={handleBack}
              >
                ← Back
              </button>
            )}
          </div>

          {/* Progress dots */}
          <div className={cx("wizardDots")}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cx("wizardDot")}
                style={{ background: i === step ? "var(--lime)" : "var(--b2)" }}
              />
            ))}
          </div>

          {/* Next / finish button */}
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={handleNext}
          >
            {step === TOTAL_STEPS - 1 ? (
              <>Open your dashboard <Ic n="arrowRight" sz={11} c="var(--bg)" /></>
            ) : step === 0 ? (
              <>Let&apos;s get started <Ic n="arrowRight" sz={11} c="var(--bg)" /></>
            ) : (
              <>Next <Ic n="arrowRight" sz={11} c="var(--bg)" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 0: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({ firstName }: { firstName: string }) {
  return (
    <div className={cx("wizardStepCenterWrap")}>
      <div className={cx("wizardDoneCheck")}>
        <Ic n="zap" sz={22} c="var(--lime)" />
      </div>
      {/* Only one step renders at a time, so this id is never duplicated in the DOM */}
      <h2 id="onboarding-wizard-title" className={cx("wizardStepTitle")}>
        {firstName ? `Welcome, ${firstName}!` : "Welcome to your client portal"}
      </h2>
      <p className={cx("wizardStepSub", "wizardStepSubCentered")}>
        {firstName
          ? "This is your dedicated workspace for tracking your project, approving deliverables, and communicating with your team."
          : "Everything you need to manage your project is right here — milestones, deliverables, invoices, and more."}
      </p>
    </div>
  );
}

// ── Step 1: Your Project ──────────────────────────────────────────────────────

function StepProject({ project, loading }: { project: PortalProject | null; loading: boolean }) {
  return (
    <div>
      {/* Only one step renders at a time, so this id is never duplicated in the DOM */}
      <h2 id="onboarding-wizard-title" className={cx("wizardStepTitle")}>
        Your Project
      </h2>
      <p className={cx("wizardStepSub")}>
        Your project is live. You can track progress from the Projects section.
      </p>

      {loading ? (
        <div className={cx("loadingCell")}>Loading your project…</div>
      ) : project ? (
        <div className={cx("wizardProjectCard")}>
          <div className={cx("wizardProjCardHeader")}>
            <span className={cx("wizardProjName")}>{project.name}</span>
            <span className={cx(statusBadgeClass(project.status), "wizardStatusBadge")}>
              {statusLabel(project.status)}
            </span>
          </div>
          {project.description && (
            <p className={cx("wizardProjDesc")}>
              {project.description}
            </p>
          )}
          {project.progressPercent > 0 && (
            <div className={cx("mt12")}>
              <div className={cx("wizardProgressTrack")}>
                <div
                  className={cx("wizardProgressFill")}
                  style={{ width: `${project.progressPercent ?? 0}%` }}
                />
              </div>
              <span className={cx("wizardProgressLabel")}>
                {project.progressPercent}% complete
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className={cx("emptyCell")}>
          Your project will appear here once your team has set it up.
        </div>
      )}
    </div>
  );
}

// ── Step 2: Meet Your Team ────────────────────────────────────────────────────

function StepTeam({ team, loading }: { team: PortalTeamMember[]; loading: boolean }) {
  const displayed = team.slice(0, 3);

  return (
    <div>
      {/* Only one step renders at a time, so this id is never duplicated in the DOM */}
      <h2 id="onboarding-wizard-title" className={cx("wizardStepTitle")}>
        Meet Your Team
      </h2>
      <p className={cx("wizardStepSub")}>
        Your dedicated team is ready to support you throughout the project.
      </p>

      {loading ? (
        <div className={cx("loadingCell")}>Loading your team…</div>
      ) : displayed.length > 0 ? (
        <div className={cx("flexCol", "gap10")}>
          {displayed.map((member) => (
            <div key={member.id} className={cx("wizardTeamRow")}>
              {/* Avatar circle */}
              <div className={cx("wizardTeamAvatar")}>
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className={cx("wizardTeamInfo")}>
                <div className={cx("wizardTeamName")}>{member.name}</div>
                <div className={cx("wizardTeamRole")}>{member.role}</div>
              </div>
              <span className={cx("badgeMuted", "wizardStatusBadge")}>
                {member.status === "ACTIVE" ? "Active" : member.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={cx("emptyCell")}>
          Your team will be assigned shortly.
        </div>
      )}
    </div>
  );
}

// ── Step 3: All Set ───────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { icon: "briefcase", label: "Projects",       sub: "Track progress and deliverables" },
  { icon: "message",   label: "Messages",        sub: "Communicate with your team"     },
  { icon: "zap",       label: "Onboarding Hub",  sub: "Complete your setup checklist"  },
] as const;

function StepDone() {
  return (
    <div className={cx("textCenter")}>
      <div className={cx("wizardDoneCheck")}>
        <Ic n="check" sz={24} c="var(--lime)" />
      </div>

      {/* Only one step renders at a time, so this id is never duplicated in the DOM */}
      <h2 id="onboarding-wizard-title" className={cx("wizardStepTitle")}>
        You&apos;re ready to go!
      </h2>
      <p className={cx("wizardStepSub")}>Here are a few places to explore first.</p>

      <div className={cx("wizardDoneLinksRow")}>
        {QUICK_LINKS.map((link) => (
          <div key={link.label} className={cx("wizardDoneLinkCard")}>
            <div className={cx("wizardDoneLinkIcon")}>
              <Ic n={link.icon} sz={14} c="var(--lime)" />
            </div>
            <div className={cx("wizardDoneLinkLabel")}>
              {link.label}
            </div>
            <div className={cx("wizardDoneLinkSub")}>
              {link.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
