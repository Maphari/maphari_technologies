// ════════════════════════════════════════════════════════════════════════════
// store.ts — AI job execution + in-memory log
//
// Provider routing (dual-LLM strategy):
//   OpenAI  GPT-4o-mini          → "general" | "lead-qualification"  (fast, cheap)
//   Anthropic claude-sonnet-4-6  → "proposal-draft" | "estimate" | "auto-draft"  (deep reasoning)
//
// If the relevant API key is absent the call falls through to a labelled stub
// so the service stays functional in environments without keys configured.
// ════════════════════════════════════════════════════════════════════════════

import type { AiGenerateInput } from "@maphari/contracts";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { randomUUID } from "node:crypto";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AiJobRecord {
  id: string;
  clientId: string;
  task: "general" | "lead-qualification" | "proposal-draft" | "estimate" | "auto-draft" | "client-update" | "report";
  prompt: string;
  model: string;
  response: string;
  status: "COMPLETED" | "FAILED";
  latencyMs: number;
  createdAt: string;
}

// ── In-memory job log (capped at 500 records) ─────────────────────────────────

const jobs: AiJobRecord[] = [];
const JOB_CAP = 500;

// ── Lazy-initialised SDK clients ──────────────────────────────────────────────

let _openai: OpenAI | null = null;
let _anthropic: Anthropic | null = null;

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  _openai ??= new OpenAI({ apiKey: key });
  return _openai;
}

function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _anthropic ??= new Anthropic({ apiKey: key });
  return _anthropic;
}

// ── Provider routing ──────────────────────────────────────────────────────────

const OPENAI_TASKS = new Set<AiJobRecord["task"]>(["general", "lead-qualification"]);

async function callLLM(
  task: AiJobRecord["task"],
  prompt: string,
  modelOverride?: string
): Promise<{ response: string; model: string }> {
  // OpenAI — fast, cost-effective for structured tasks
  if (OPENAI_TASKS.has(task)) {
    const client = getOpenAI();
    if (client) {
      const model = modelOverride ?? "gpt-4o-mini";
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024
      });
      const text = completion.choices[0]?.message?.content ?? "";
      return { response: text, model };
    }
  }

  // Anthropic — deep reasoning for complex / long-form tasks
  const client = getAnthropic();
  if (client) {
    const model = modelOverride ?? "claude-sonnet-4-6";
    const message = await client.messages.create({
      model,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }]
    });
    const textBlock = message.content.find((b) => b.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text : "";
    return { response: text, model };
  }

  // Fallback — no keys configured; return stub so the service stays testable
  const stub = `[STUB — set OPENAI_API_KEY or ANTHROPIC_API_KEY] ${task}: ${prompt.slice(0, 120)}`;
  return { response: stub, model: modelOverride ?? "stub" };
}

// ── Public job creation ───────────────────────────────────────────────────────

export async function createAiJob(
  input: AiGenerateInput & { clientId: string }
): Promise<AiJobRecord> {
  return createAiWorkflowJob("general", input);
}

export async function createAiWorkflowJob(
  task: AiJobRecord["task"],
  input: { clientId: string; prompt: string; model?: string }
): Promise<AiJobRecord> {
  const startedAt = Date.now();

  let response: string;
  let model: string;
  let status: AiJobRecord["status"] = "COMPLETED";

  try {
    const result = await callLLM(task, input.prompt, input.model);
    response = result.response;
    model = result.model;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown LLM error";
    response = `[LLM ERROR] ${errMsg}`;
    model = input.model ?? "unknown";
    status = "FAILED";
  }

  const job: AiJobRecord = {
    id: randomUUID(),
    clientId: input.clientId,
    task,
    prompt: input.prompt,
    model,
    response,
    status,
    latencyMs: Date.now() - startedAt,
    createdAt: new Date().toISOString()
  };

  jobs.unshift(job);
  if (jobs.length > JOB_CAP) jobs.length = JOB_CAP;
  return job;
}

export function listAiJobs(clientId?: string): AiJobRecord[] {
  return jobs.filter((job) => (clientId ? job.clientId === clientId : true));
}

export function clearAiStore(): void {
  jobs.length = 0;
}
