/**
 * Activity feed row — icon, main text with detail, and timestamp.
 *
 * Accepts a `styles` prop so each dashboard passes its own CSS module.
 * Expected class names: activityItem, activityIcon, activityMain, activityTime.
 */
import type { CssModuleStyles } from "@/lib/utils/cx";

export function ActivityRow({
  icon,
  tone,
  color,
  text,
  detail,
  time,
  styles
}: {
  /** Emoji or short character displayed in the icon circle */
  icon: string;
  /** Background color for the icon circle */
  tone: string;
  /** Foreground color for the icon */
  color: string;
  /** Bold primary text */
  text: string;
  /** Secondary text after the bold text */
  detail: string;
  /** Timestamp label */
  time: string;
  /** CSS module styles object */
  styles: CssModuleStyles;
}) {
  return (
    <div className={styles.activityItem}>
      <div className={styles.activityIcon} style={{ background: tone, color }}>{icon}</div>
      <div className={styles.activityMain}>
        <strong>{text}</strong> {detail}
        <div className={styles.activityTime}>{time}</div>
      </div>
    </div>
  );
}
