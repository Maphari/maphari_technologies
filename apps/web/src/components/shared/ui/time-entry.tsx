/**
 * Time log entry row — color dot, project/task info, duration, date.
 *
 * Accepts a `styles` prop so each dashboard passes its own CSS module.
 * Expected class names: timeEntry, timeDot, timeProject, timeTask,
 * timeDuration, timeDate.
 */
import type { CssModuleStyles } from "@/lib/utils/cx";

export function TimeEntry({
  dot,
  project,
  task,
  duration,
  date,
  styles
}: {
  /** Color for the indicator dot */
  dot: string;
  /** Project name */
  project: string;
  /** Task description */
  task: string;
  /** Formatted duration string */
  duration: string;
  /** Date label */
  date: string;
  /** CSS module styles object */
  styles: CssModuleStyles;
}) {
  return (
    <div className={styles.timeEntry}>
      <div className={styles.timeDot} style={{ background: dot }} />
      <div style={{ flex: 1 }}>
        <div className={styles.timeProject}>{project}</div>
        <div className={styles.timeTask}>{task}</div>
      </div>
      <div className={styles.timeDuration}>{duration}</div>
      <div className={styles.timeDate}>{date}</div>
    </div>
  );
}
