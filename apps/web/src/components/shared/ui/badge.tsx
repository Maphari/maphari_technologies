type Tone = "green" | "red" | "amber" | "purple" | "muted" | "accent";

type BadgeProps = {
  tone: Tone;
  children: string;
  cx: (...names: Array<string | false | null | undefined>) => string;
};

const TONE_TO_CLASS: Record<Tone, string> = {
  green: "badgeGreen",
  red: "badgeRed",
  amber: "badgeAmber",
  purple: "badgePurple",
  muted: "badgeMuted",
  accent: "badgeAccent",
};

/**
 * Reusable badge component. Wraps the `cx("badge", "badgeGreen")` pattern
 * used across all dashboard pages.
 */
export function Badge({ tone, children, cx }: BadgeProps) {
  return (
    <span className={cx("badge", TONE_TO_CLASS[tone])}>
      {children}
    </span>
  );
}
