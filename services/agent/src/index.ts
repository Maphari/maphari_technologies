// ════════════════════════════════════════════════════════════════════════════
// index.ts — @maphari/agent service entry point
//
// Two modes of operation:
//
//   1. AGENTS MODE (default): Starts a @livekit/agents worker that auto-joins
//      every LiveKit room and runs the voice AI pipeline (STT → LLM → TTS).
//      The worker connects to LiveKit Cloud and waits for room dispatch events.
//
//   2. WEBHOOK MODE (fallback / standalone): Runs a Fastify HTTP server that
//      receives LiveKit webhooks and triggers post-call note generation.
//      Useful when running the agent without the LiveKit dispatch protocol,
//      e.g. during local development without a public LiveKit endpoint.
//
//   Set MODE=webhook in .env to enable webhook mode.
//   Default (or MODE=agent) starts the @livekit/agents worker.
//
// ════════════════════════════════════════════════════════════════════════════

import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const mode = process.env.MODE ?? "agent";

// ── Validate required environment variables ────────────────────────────────

const required = ["LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "LIVEKIT_WS_URL"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `[agent] Missing required environment variables: ${missing.join(", ")}`
  );
  console.error(
    "[agent] Copy .env.example to .env and fill in the values."
  );
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "[agent] OPENAI_API_KEY not set — STT transcription and meeting notes will be disabled"
  );
}

// ── Mode: agents worker ────────────────────────────────────────────────────

if (mode === "agent") {
  console.log("[agent] Starting @livekit/agents worker...");

  const { cli, ServerOptions } = await import("@livekit/agents");

  // Resolve the agent file path relative to this file.
  // tsx resolves .js imports to .ts, so prefer .ts in dev, fall back to .js
  // (compiled output) in production.
  const ext = __filename.endsWith(".ts") ? ".ts" : ".js";
  const agentPath = path.resolve(path.dirname(__filename), `agent${ext}`);

  cli.runApp(
    new ServerOptions({
      agent: agentPath,
      wsURL: process.env.LIVEKIT_WS_URL!,
      apiKey: process.env.LIVEKIT_API_KEY,
      apiSecret: process.env.LIVEKIT_API_SECRET,
      agentName: "maphari-agent",
      logLevel: process.env.NODE_ENV === "production" ? "info" : "debug",
      production: process.env.NODE_ENV === "production",
    })
  );

// ── Mode: webhook server ────────────────────────────────────────────────────
} else {
  console.log("[agent] Starting webhook server (MODE=webhook)...");
  await startWebhookServer();
}

// ── startWebhookServer ─────────────────────────────────────────────────────

async function startWebhookServer(): Promise<void> {
  const { default: Fastify } = await import("fastify");
  const { WebhookReceiver } = await import("livekit-server-sdk");
  const { handleRoomStarted, handleRoomFinished } = await import("./webhook-handler.js");

  const port = Number(process.env.PORT ?? 4010);
  const app = Fastify({ logger: true });

  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );

  /** POST /livekit/webhook — receives LiveKit Cloud webhook events */
  app.post(
    "/livekit/webhook",
    {
      config: { rawBody: true },
    },
    async (request, reply) => {
      try {
        const body = (request as { rawBody?: Buffer }).rawBody;
        const authHeader = request.headers["authorization"] as string | undefined;

        if (!body) {
          return reply.code(400).send({ error: "Missing body" });
        }

        const event = await receiver.receive(body.toString(), authHeader);

        switch (event.event) {
          case "room_started":
            if (event.room?.name) {
              await handleRoomStarted(event.room.name);
            }
            break;

          case "room_finished":
            if (event.room?.name) {
              await handleRoomFinished(
                event.room.name,
                event.room.numParticipants ?? 0
              );
            }
            break;

          default:
            // Other events (participant_joined etc.) are informational
            break;
        }

        return reply.code(200).send({ ok: true });
      } catch (err) {
        request.log.error(err, "Webhook processing error");
        return reply.code(400).send({ error: "Invalid webhook payload" });
      }
    }
  );

  /** GET /health — liveness probe */
  app.get("/health", async () => ({ status: "ok", service: "agent" }));

  await app.listen({ port, host: "0.0.0.0" });
  console.log(`[agent] Webhook server listening on port ${port}`);
}
