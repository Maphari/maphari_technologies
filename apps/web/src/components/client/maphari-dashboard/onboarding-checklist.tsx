"use client";

import { useCallback, useEffect, useState } from "react";
import { cx } from "./style";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChecklistStep {
  id: string;
  label: string;
  done: boolean;
}

interface ChecklistResponse {
  success: boolean;
  data?: { steps: ChecklistStep[]; allDone: boolean; completedCount: number };
}

interface Props {
  session: { accessToken?: string } | null;
  onDismiss: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingChecklist({ session, onDismiss }: Props) {
  const [steps, setSteps] = useState<ChecklistStep[]>([]);
  const [allDone, setAllDone] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.accessToken) { setLoading(false); return; }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:4000"}/portal/onboarding/checklist`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } },
      );
      if (!res.ok) { setLoading(false); return; }
      const d = (await res.json()) as ChecklistResponse;
      if (d.success && d.data) {
        setSteps(d.data.steps);
        setAllDone(d.data.allDone);
      }
    } catch {
      /* ignore — component silently hides on error */
    }
    setLoading(false);
  }, [session?.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || allDone) return null;

  return (
    <div className={cx("onboardingOverlay")}>
      <div className={cx("onboardingModal")}>
        <div className={cx("onboardingHeader")}>
          <h2 className={cx("onboardingTitle")}>Welcome to Maphari!</h2>
          <p className={cx("onboardingSubtitle")}>
            Complete these steps to get started.
          </p>
        </div>
        <ul className={cx("onboardingList")}>
          {steps.map((step) => (
            <li
              key={step.id}
              className={cx(
                "onboardingStep",
                step.done ? "onboardingStepDone" : "",
              )}
            >
              <span className={cx("onboardingStepIcon")}>
                {step.done ? "✓" : "○"}
              </span>
              <span className={cx("onboardingStepLabel")}>{step.label}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={cx("onboardingDismiss")}
          onClick={onDismiss}
        >
          Continue to dashboard
        </button>
      </div>
    </div>
  );
}
