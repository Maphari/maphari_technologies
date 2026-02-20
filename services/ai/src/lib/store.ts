import type { AiGenerateInput } from "@maphari/contracts";
import { randomUUID } from "node:crypto";

export interface AiJobRecord {
  id: string;
  clientId: string;
  task: "general" | "lead-qualification" | "proposal-draft" | "estimate";
  prompt: string;
  model: string;
  response: string;
  status: "COMPLETED";
  latencyMs: number;
  createdAt: string;
}

const jobs: AiJobRecord[] = [];

export function createAiJob(input: AiGenerateInput & { clientId: string }): AiJobRecord {
  return createAiWorkflowJob("general", input);
}

export function createAiWorkflowJob(
  task: AiJobRecord["task"],
  input: { clientId: string; prompt: string; model?: string }
): AiJobRecord {
  const startedAt = Date.now();
  const response = `Generated ${task} response for: ${input.prompt.slice(0, 120)}`;

  const job: AiJobRecord = {
    id: randomUUID(),
    clientId: input.clientId,
    task,
    prompt: input.prompt,
    model: input.model ?? "gpt-4.1-mini",
    response,
    status: "COMPLETED",
    latencyMs: Date.now() - startedAt,
    createdAt: new Date().toISOString()
  };

  jobs.unshift(job);
  return job;
}

export function listAiJobs(clientId?: string): AiJobRecord[] {
  return jobs.filter((job) => (clientId ? job.clientId === clientId : true));
}

export function clearAiStore(): void {
  jobs.length = 0;
}
