// ════════════════════════════════════════════════════════════════════════════
// integration-health.ts — Compute health status from recent sync events
// ════════════════════════════════════════════════════════════════════════════

export type IntegrationHealthStatus = "HEALTHY" | "DELAYED" | "ACTION_NEEDED" | "UNKNOWN";

/**
 * Derives a health status string from the most recent sync events for a
 * connection. Examines up to the last 3 events (passed in most-recent-first
 * order) and applies the following rules:
 *
 *  - No events                          → UNKNOWN
 *  - All 3 most recent events FAILED    → ACTION_NEEDED
 *  - No SUCCESS event found at all      → DELAYED
 *  - Last success was > 24 h ago        → DELAYED
 *  - Otherwise                          → HEALTHY
 */
export function computeHealthStatus(
  recentEvents: { status: string; startedAt: Date }[]
): IntegrationHealthStatus {
  if (!recentEvents.length) return "UNKNOWN";

  const lastThree = recentEvents.slice(0, 3);
  const allFailed = lastThree.every((e) => e.status === "FAILED");
  if (allFailed) return "ACTION_NEEDED";

  const lastSuccess = recentEvents.find((e) => e.status === "SUCCESS");
  if (!lastSuccess) return "DELAYED";

  const hoursSinceSuccess =
    (Date.now() - lastSuccess.startedAt.getTime()) / (1_000 * 60 * 60);
  if (hoursSinceSuccess > 24) return "DELAYED";

  return "HEALTHY";
}
