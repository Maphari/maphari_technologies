import type { ReactNode } from "react";

type Tone = "accent" | "green" | "amber" | "red" | "purple";

type StatCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  tone?: Tone;
  onClick?: () => void;
  children?: ReactNode;
  cx: (...names: Array<string | false | null | undefined>) => string;
  styles: Record<string, string>;
};

const TONE_TO_BAR: Record<Tone, string> = {
  accent: "statBarAccent",
  green: "statBarGreen",
  amber: "statBarAmber",
  red: "statBarRed",
  purple: "statBarPurple",
};

/**
 * Reusable stat card with top color bar and staggered entrance animation.
 * Animation is handled by CSS (nth-child delays on .statCard).
 */
export function StatCard({
  label,
  value,
  detail,
  tone = "accent",
  onClick,
  children,
  cx,
  styles,
}: StatCardProps) {
  const isInteractive = !!onClick;
  return (
    <div
      className={styles.statCard}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className={cx("statBar", TONE_TO_BAR[tone])} />
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      {detail ? <div className={styles.statDelta}>{detail}</div> : null}
      {children}
    </div>
  );
}
