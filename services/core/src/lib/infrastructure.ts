// ════════════════════════════════════════════════════════════════════════════
// infrastructure.ts — Shared singletons: Redis cache, NATS event bus
// Service : core
// Exports : cache, eventBus, CacheKeys, withCache()
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import { NatsEventBus, RedisCache } from "@maphari/platform";

// ── Singleton instances ───────────────────────────────────────────────────────
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const natsUrl  = process.env.NATS_URL  ?? "nats://localhost:4222";

export const cache    = new RedisCache(redisUrl, console);
export const eventBus = new NatsEventBus(natsUrl, console);

// ── Cache key registry ────────────────────────────────────────────────────────
// All keys follow the pattern  core:<domain>:<scope>
// Keep every key in one place so invalidation is easy to track.
export const CacheKeys = {
  // ── Existing domains ──────────────────────────────────────────────────────
  clients:  (id?: string) => `core:clients:${id ?? "all"}`,
  projects: (id?: string) => `core:projects:${id ?? "all"}`,
  leads:    (id?: string) => `core:leads:${id ?? "all"}`,

  // ── Batch 2 — Project layer ───────────────────────────────────────────────
  deliverables: (projectId: string)           => `core:deliverables:${projectId}`,
  risks:        (projectId: string)           => `core:risks:${projectId}`,
  decisions:    (projectId: string)           => `core:decisions:${projectId}`,
  sprints:      (projectId: string)           => `core:sprints:${projectId}`,
  sprintTasks:  (sprintId: string)            => `core:sprint-tasks:${sprintId}`,
  signOffs:     (projectId: string)           => `core:sign-offs:${projectId}`,
  phases:       (projectId: string)           => `core:phases:${projectId}`,
  brief:        (projectId: string)           => `core:brief:${projectId}`,

  // ── Batch 3 — Client CX ──────────────────────────────────────────────────
  healthScore:      (clientId: string)        => `core:health:${clientId}`,
  healthSignals:    (clientId: string)        => `core:health-signals:${clientId}`,
  interventions:    (clientId: string)        => `core:interventions:${clientId}`,
  surveys:          (clientId: string)        => `core:surveys:${clientId}`,
  surveyResponses:  (surveyId: string)        => `core:survey-responses:${surveyId}`,
  clientOnboarding: (clientId: string)        => `core:client-onboarding:${clientId}`,
  offboarding:      (clientId: string)        => `core:offboarding:${clientId}`,
  commLogs:         (clientId: string)        => `core:comms:${clientId}`,
  slaRecords:       (clientId: string)        => `core:sla:${clientId}`,
  slaAll:           ()                        => `core:sla:all`,
  appointments:     (scope: string)           => `core:appointments:${scope}`,
  referrals:        ()                        => `core:referrals:all`,
  referralsByClient: (clientId: string)       => `core:referrals:${clientId}`,
  supportTickets:   (scope: string)           => `core:support:${scope}`,

  // ── Batch 4 — Staff & HR ─────────────────────────────────────────────────
  staffList:        ()                        => `core:staff:all`,
  staffProfile:     (staffId: string)         => `core:staff:${staffId}`,
  payslips:         (staffId: string)         => `core:payslips:${staffId}`,
  leaveRequests:    (scope: string)           => `core:leave:${scope}`,
  staffOnboarding:  (staffId: string)         => `core:staff-onboarding:${staffId}`,
  jobPostings:      ()                        => `core:job-postings:all`,
  jobApplications:  (postingId: string)       => `core:job-apps:${postingId}`,
  training:         (scope: string)           => `core:training:${scope}`,
  standup:          (date: string)            => `core:standup:${date}`,
  standupFeed:      ()                        => `core:standup:feed`,
  peerReviews:      (scope: string)           => `core:peer-reviews:${scope}`,

  // ── Recurring Tasks ───────────────────────────────────────────────────────
  recurringTasks:      (staffId: string)      => `core:recurring-tasks:${staffId}`,
  recurringTaskAll:    ()                     => `core:recurring-tasks:all`,

  // ── Batch 6 — Governance & Ops ───────────────────────────────────────────
  announcements:       (target: string)       => `core:announcements:${target}`,
  contentSubmissions:  (scope: string)        => `core:content:${scope}`,
  designReviews:       (scope: string)        => `core:design-reviews:${scope}`,
  meetings:            (clientId: string)     => `core:meetings:${clientId}`,
  knowledge:           (scope: string)        => `core:knowledge:${scope}`,
  knowledgeArticle:    (id: string)           => `core:knowledge-article:${id}`,
  decisionRecords:     (scope: string)        => `core:decisions-records:${scope}`,
  handovers:           (scope: string)        => `core:handovers:${scope}`,
  marketIntel:         ()                     => `core:market-intel:all`,
  contracts:           (clientId: string)     => `core:contracts:${clientId}`,
  closeoutReports:     (scope: string)        => `core:closeout-reports:${scope}`,
  crises:              ()                     => `core:crises:all`,
  compliance:          ()                     => `core:compliance:all`,
  dataRetention:       ()                     => `core:data-retention:all`,
};

// ── withCache — Generic read-through cache helper ─────────────────────────────
// Usage:
//   const data = await withCache(CacheKeys.projects(clientId), 60, () =>
//     prisma.project.findMany({ where: { clientId } })
//   );
//
// On writes: await cache.delete(CacheKeys.projects(clientId));
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await cache.getJson<T>(key);
  if (cached !== null) return cached;

  const result = await fn();
  await cache.setJson(key, result, ttlSeconds);
  return result;
}
