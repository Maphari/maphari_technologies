"use client";

import { styles } from "./style";

// ─── Re-exports so existing consumers keep working ───
export { AdminSidebar } from "./sidebar";
export { AdminTopbar } from "./topbar";

export function AdminTourCard({
  open,
  step,
  steps,
  onBack,
  onNext,
  onSkip,
}: {
  open: boolean;
  step: number;
  steps: ReadonlyArray<{ title: string; detail: string }>;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  if (!open) return null;

  return (
    <article className={`${styles.card} ${styles.cardBottom14}`}>
      <div className={styles.cardHd}>
        <span className={styles.cardHdTitle}>Admin Onboarding Tour</span>
        <span className={styles.metaMono}>
          Step {step + 1} / {steps.length}
        </span>
      </div>
      <div className={styles.cardInner}>
        <div className={styles.emptyTitle}>{steps[step]?.title}</div>
        <div className={`${styles.emptySub} ${styles.emptySubTop8}`}>
          {steps[step]?.detail}
        </div>
        <div className={`${styles.toolbarRow} ${styles.toolbarRowTop12}`}>
          <button
            type="button"
            className={`${styles.btnSm} ${styles.btnGhost}`}
            onClick={onBack}
            disabled={step === 0}
          >
            Back
          </button>
          <button
            type="button"
            className={`${styles.btnSm} ${styles.btnAccent}`}
            onClick={onNext}
          >
            {step < steps.length - 1 ? "Next" : "Finish"}
          </button>
          <button
            type="button"
            className={`${styles.btnSm} ${styles.btnGhost}`}
            onClick={onSkip}
          >
            Skip
          </button>
        </div>
      </div>
    </article>
  );
}
