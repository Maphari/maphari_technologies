import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCoreApp } from "../app.js";
import { cache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";

const userId   = "550e8400-e29b-41d4-a716-446655440001";
const clientId = "550e8400-e29b-41d4-a716-446655440002";
const projectId1 = "550e8400-e29b-41d4-a716-446655440003";
const projectId2 = "550e8400-e29b-41d4-a716-446655440004";

describe("GET /staff/me/portfolio", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(cache, "getJson").mockResolvedValue(null);
    vi.spyOn(cache, "setJson").mockResolvedValue(undefined);
  });

  it("returns 401 when x-user-id header is missing", async () => {
    const app = await createCoreApp();
    const response = await app.inject({
      method: "GET",
      url: "/staff/me/portfolio",
      headers: { "x-user-role": "STAFF" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("returns portfolio with salary-derived spend and correct health", async () => {
    // grossSalaryCents = 4_160_000 → hourly = 4_160_000 / (52*40) = 2000 cents/h
    vi.spyOn(prisma.staffProfile, "findUnique").mockResolvedValue({
      grossSalaryCents: 4_160_000,
    } as any);

    // project1: 120 min logged → 2h × 2000c = 4000c spent; budget 3000c → exceeded
    // project2: 60 min logged  → 1h × 2000c = 2000c spent; budget 10000c, status AT_RISK → critical
    vi.spyOn(prisma.projectTimeEntry, "findMany").mockResolvedValue([
      { projectId: projectId1, minutes: 120 },
      { projectId: projectId2, minutes: 60 },
    ] as any);

    vi.spyOn(prisma.project, "findMany").mockResolvedValue([
      {
        id: projectId1,
        name: "Project Alpha",
        status: "ON_TRACK",
        priority: "HIGH",
        progressPercent: 40,
        dueAt: new Date("2026-06-01"),
        budgetCents: 3_000,
        client: { id: clientId, name: "Acme Corp" },
        tasks: [
          { id: "t1", status: "DONE" },
          { id: "t2", status: "IN_PROGRESS" },
          { id: "t3", status: "TODO" },
        ],
      },
      {
        id: projectId2,
        name: "Project Beta",
        status: "AT_RISK",
        priority: "MEDIUM",
        progressPercent: 20,
        dueAt: null,
        budgetCents: 10_000,
        client: { id: clientId, name: "Acme Corp" },
        tasks: [{ id: "t4", status: "TODO" }],
      },
    ] as any);

    const app = await createCoreApp();
    const response = await app.inject({
      method: "GET",
      url: "/staff/me/portfolio",
      headers: { "x-user-id": userId, "x-user-role": "STAFF" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);

    const alpha = body.data.find((p: any) => p.id === projectId1);
    expect(alpha.health).toBe("exceeded");      // spent 4000 > budget 3000
    expect(alpha.spentCents).toBe(4000);
    expect(alpha.budgetCents).toBe(3000);
    expect(alpha.clientName).toBe("Acme Corp");
    expect(alpha.tasks.total).toBe(3);
    expect(alpha.tasks.done).toBe(1);
    expect(alpha.tasks.inProgress).toBe(1);

    const beta = body.data.find((p: any) => p.id === projectId2);
    expect(beta.health).toBe("critical");       // AT_RISK status
    expect(beta.spentCents).toBe(2000);
    expect(beta.dueAt).toBeNull();
  });

  it("returns empty array when user has no time entries", async () => {
    vi.spyOn(prisma.staffProfile, "findUnique").mockResolvedValue({
      grossSalaryCents: 4_160_000,
    } as any);
    vi.spyOn(prisma.projectTimeEntry, "findMany").mockResolvedValue([] as any);
    vi.spyOn(prisma.project, "findMany").mockResolvedValue([] as any);

    const app = await createCoreApp();
    const response = await app.inject({
      method: "GET",
      url: "/staff/me/portfolio",
      headers: { "x-user-id": userId, "x-user-role": "STAFF" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });
});
