"use client";

import tour from "@/app/style/components/onboarding-tour.module.css";

export interface TourStep {
  eye: string;
  title: string;
  description: string;
  note?: string;
}

export interface DashboardTourProps {
  open: boolean;
  step: number;
  steps: TourStep[];
  /** true = client portal full-screen overlay; false = admin/staff fixed card */
  showOverlay?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function DashboardTour({
  open,
  step,
  steps,
  showOverlay = false,
  onBack,
  onNext,
  onSkip,
}: DashboardTourProps) {
  if (!open) return null;

  const current = steps[step];
  if (!current) return null;

  const isLast = step === steps.length - 1;

  const card = (
    <div
      className={tour.tooltip}
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tour"
      style={
        showOverlay
          ? { position: "absolute", bottom: "50%", left: "50%", transform: "translate(-50%, 50%)" }
          : { position: "fixed", bottom: 28, right: 28 }
      }
    >
      {current.note && (
        <div className={tour.mustNote}>{current.note}</div>
      )}
      <div className={tour.stepEye}>{current.eye}</div>
      <div className={tour.stepTitle}>{current.title}</div>
      <div className={tour.stepDesc}>{current.description}</div>

      <div className={tour.nav}>
        <div className={tour.dots}>
          {steps.map((_, i) => {
            let cls = tour.dot;
            if (i < step) cls = `${tour.dot} ${tour.dotDone}`;
            else if (i === step) cls = `${tour.dot} ${tour.dotActive}`;
            return <span key={i} className={cls} />;
          })}
        </div>

        <div className={tour.buttons}>
          {step > 0 && (
            <button
              type="button"
              className={tour.skip}
              onClick={onBack}
            >
              Back
            </button>
          )}
          <button
            type="button"
            className={tour.skip}
            onClick={onSkip}
          >
            Skip
          </button>
          <button
            type="button"
            className={tour.next}
            onClick={isLast ? onSkip : onNext}
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!showOverlay) return card;

  return (
    <div className={tour.overlay}>
      <div className={tour.backdrop} />
      {card}
    </div>
  );
}
