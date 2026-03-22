// ════════════════════════════════════════════════════════════════════════════
// weekly-digest.job.ts — Weekly AI digest job
// Service : automation
// Runs    : Every Monday at 06:00 UTC (managed by index.ts setInterval)
// Flow    : 1. Fetch opt-in subscribers from core /internal/digest-subscribers
//           2. For each, request an AI summary via POST /ai/generate
//           3. Call onDigestReady callback (publishes NATS event in index.ts)
// ════════════════════════════════════════════════════════════════════════════

interface DigestSubscriber {
  userId: string;
  clientId: string;
}

interface ProjectListItem {
  id: string;
  name?: string;
  status?: string;
}

interface AiGenerateResponse {
  success: boolean;
  data?: { text: string };
}

export interface WeeklyDigestJobOptions {
  coreServiceUrl: string;
  aiServiceUrl: string;
  log: {
    info: (msg: string) => void;
    error: (obj: unknown, msg: string) => void;
  };
  onDigestReady?: (clientId: string, text: string) => Promise<void>;
}

export async function runWeeklyDigestJob(options: WeeklyDigestJobOptions): Promise<void> {
  const { coreServiceUrl, aiServiceUrl, log, onDigestReady } = options;

  // ── 1. Fetch digest subscribers ──────────────────────────────────────────
  let subscribers: DigestSubscriber[] = [];
  try {
    const res = await fetch(`${coreServiceUrl}/internal/digest-subscribers`);
    if (!res.ok) {
      log.error({ status: res.status }, "Weekly digest: failed to fetch subscribers");
      return;
    }
    const json = (await res.json()) as { success: boolean; data?: DigestSubscriber[] };
    subscribers = json.data ?? [];
  } catch (error) {
    log.error({ error: String(error) }, "Weekly digest: error fetching subscribers");
    return;
  }

  log.info(`Weekly digest: processing ${subscribers.length} subscriber(s)`);

  let successCount = 0;
  let failCount = 0;

  // ── 2. For each subscriber, generate AI summary and deliver ──────────────
  for (const subscriber of subscribers) {
    const { clientId } = subscriber;

    try {
      // Fetch the client's most recent project via internal endpoint (best-effort — no project is fine)
      let projectId: string | null = null;
      try {
        const projRes = await fetch(
          `${coreServiceUrl}/internal/projects/latest?clientId=${encodeURIComponent(clientId)}`
        );
        if (projRes.ok) {
          const projJson = (await projRes.json()) as { success: boolean; data?: ProjectListItem | null };
          projectId = projJson.data?.id ?? null;
        }
      } catch {
        // Non-fatal — proceed without projectId
      }

      // Request AI summary
      const aiRes = await fetch(`${aiServiceUrl}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "summary",
          clientId,
          projectId,
          prompt:
            "Generate a concise weekly digest for this client covering project progress, upcoming milestones, and any risks. Keep it under 200 words.",
        }),
      });

      if (!aiRes.ok) {
        log.error({ status: aiRes.status, clientId }, "Weekly digest: AI generate request failed");
        failCount += 1;
        continue;
      }

      const aiJson = (await aiRes.json()) as AiGenerateResponse;
      const text = aiJson.data?.text;
      if (!text) {
        log.error({ clientId, aiResponse: aiJson }, "Weekly digest: AI returned no text");
        failCount += 1;
        continue;
      }

      // ── 3. Deliver via callback (NATS publish in index.ts) ───────────────
      if (onDigestReady) {
        await onDigestReady(clientId, text);
      }

      successCount += 1;
    } catch (error) {
      log.error({ error: String(error), clientId }, "Weekly digest: unhandled error for subscriber");
      failCount += 1;
    }
  }

  log.info(
    `Weekly digest: completed — ${successCount} sent, ${failCount} failed out of ${subscribers.length} subscriber(s)`
  );
}
