/**
 * Time-tracking and duration utilities.
 *
 * Currently used by the staff dashboard for work session tracking,
 * extracted here for cross-dashboard reuse.
 */

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Estimate work minutes between two ISO timestamps, clamped to 30–480 */
export function estimateMinutes(createdAt: string, updatedAt: string): number {
  const created = new Date(createdAt);
  const updated = new Date(updatedAt);
  if (Number.isNaN(created.getTime()) || Number.isNaN(updated.getTime())) return 30;
  const diffMinutes = Math.max(15, Math.round((updated.getTime() - created.getTime()) / 60000));
  return clamp(diffMinutes, 30, 480);
}

/** Format minutes as a human-readable duration — e.g. 150 → "2h 30m" */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

/** Format total seconds as a timer display — e.g. 5025 → "01:23:45" */
export function formatTimer(totalSeconds: number): string {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
