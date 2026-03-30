// services/core/src/__tests__/staff-team-performance.integration.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCoreApp } from "../app.js";
import { cache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";

const staffId1 = "550e8400-e29b-41d4-a716-446655440010";
const staffId2 = "550e8400-e29b-41d4-a716-446655440011";
const userId1  = "550e8400-e29b-41d4-a716-446655440012";
const userId2  = "550e8400-e29b-41d4-a716-446655440013";

describe("GET /staff/team-performance", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(cache, "getJson").mockResolvedValue(null);
    vi.spyOn(cache, "setJson").mockResolvedValue(undefined);
  });

  it("returns 403 when called with CLIENT role", async () => {
    const app = await createCoreApp();
    const res = await app.inject({
      method: "GET",
      url: "/staff/team-performance",
      headers: { "x-user-id": userId1, "x-user-role": "CLIENT" },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it("returns real tasksCompleted, utilizationPct, peerRating, and department", async () => {
    vi.spyOn(prisma.staffProfile, "findMany").mockResolvedValue([
      { id: staffId1, name: "Alice Smith", role: "Developer", department: "Eng",    userId: userId1, avatarInitials: "AS" },
      { id: staffId2, name: "Bob Jones",   role: "Designer",  department: "Design", userId: userId2, avatarInitials: "BJ" },
    ] as any);

    // Alice: 6h logged this week
    vi.spyOn(prisma.projectTimeEntry, "findMany").mockResolvedValue([
      { staffUserId: userId1, minutes: 240 },
      { staffUserId: userId1, minutes: 120 },
    ] as any);

    // Alice: 3 completed tasks; Bob: 0
    vi.spyOn(prisma.projectTaskCollaborator, "findMany").mockResolvedValue([
      { staffUserId: userId1 },
      { staffUserId: userId1 },
      { staffUserId: userId1 },
    ] as any);

    // Alice: peer rating avg 4.8; Bob: no reviews
    vi.spyOn(prisma.peerReview, "findMany").mockResolvedValue([
      { revieweeId: staffId1, score: 4.6 },
      { revieweeId: staffId1, score: 5.0 },
    ] as any);

    const app = await createCoreApp();
    const res = await app.inject({
      method: "GET",
      url: "/staff/team-performance",
      headers: { "x-user-id": userId1, "x-user-role": "STAFF" },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { success: boolean; data: any[] };
    expect(body.success).toBe(true);

    const alice = body.data.find((m) => m.name === "Alice Smith");
    expect(alice.tasksCompleted).toBe(3);
    expect(alice.utilizationPct).toBeGreaterThan(0);
    expect(alice.peerRating).toBe(4.8);   // Math.round((4.6+5.0)/2 * 10)/10
    expect(alice.department).toBe("Eng");
    expect(alice.isSelf).toBe(true);       // userId1 matches x-user-id header

    const bob = body.data.find((m) => m.name === "Bob Jones");
    expect(bob.tasksCompleted).toBe(0);
    expect(bob.peerRating).toBeNull();     // no reviews → null, not 0
    expect(bob.department).toBe("Design");
    expect(bob.isSelf).toBe(false);

    await app.close();
  });

  it("does not include avgTaskTime or onTimeRate in the response", async () => {
    vi.spyOn(prisma.staffProfile, "findMany").mockResolvedValue([
      { id: staffId1, name: "Alice Smith", role: "Developer", department: null, userId: userId1, avatarInitials: "AS" },
    ] as any);
    vi.spyOn(prisma.projectTimeEntry,        "findMany").mockResolvedValue([] as any);
    vi.spyOn(prisma.projectTaskCollaborator, "findMany").mockResolvedValue([] as any);
    vi.spyOn(prisma.peerReview,              "findMany").mockResolvedValue([] as any);

    const app = await createCoreApp();
    const res = await app.inject({
      method: "GET",
      url: "/staff/team-performance",
      headers: { "x-user-id": userId1, "x-user-role": "STAFF" },
    });
    const body = JSON.parse(res.body);
    const member = body.data[0];
    expect(member).not.toHaveProperty("avgTaskTime");
    expect(member).not.toHaveProperty("onTimeRate");
    await app.close();
  });
});
