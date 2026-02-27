/**
 * Text and status formatting utilities shared across all dashboards.
 */

/** Convert an UPPER_SNAKE_CASE status to Title Case — e.g. "IN_PROGRESS" → "In Progress" */
export function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Uppercase the first letter of a string */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Extract up to two initials from a name — e.g. "John Doe" → "JD" */
export function getInitials(value: string, fallback = "M"): string {
  return (
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join("") || fallback
  );
}
