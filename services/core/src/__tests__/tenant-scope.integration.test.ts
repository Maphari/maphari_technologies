import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCoreApp } from "../app.js";
import { CacheKeys, cache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";

describe("core tenant scope integration", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await Promise.all([
      cache.delete(CacheKeys.clients()),
      cache.delete(CacheKeys.clients("client-scope-123")),
      cache.delete(CacheKeys.projects()),
      cache.delete(CacheKeys.projects("550e8400-e29b-41d4-a716-446655440000"))
    ]);
  });

  it("scopes CLIENT /clients requests by x-client-id", async () => {
    const findManySpy = vi.spyOn(prisma.client, "findMany").mockResolvedValue([]);
    const app = await createCoreApp();

    const response = await app.inject({
      method: "GET",
      url: "/clients",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "client-scope-123"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "client-scope-123" }
      })
    );

    await app.close();
  });

  it("keeps ADMIN /projects requests unscoped", async () => {
    const findManySpy = vi.spyOn(prisma.project, "findMany").mockResolvedValue([]);
    const app = await createCoreApp();

    const response = await app.inject({
      method: "GET",
      url: "/projects",
      headers: {
        "x-user-role": "ADMIN"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {}
      })
    );

    await app.close();
  });

  it("forces CLIENT /projects create to scoped tenant", async () => {
    const createSpy = vi.spyOn(prisma.project, "create").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440123",
      name: "Website Revamp",
      description: null,
      status: "PLANNING",
      ownerName: null,
      priority: "MEDIUM",
      riskLevel: "LOW",
      startAt: null,
      dueAt: null,
      completedAt: null,
      budgetCents: 0,
      progressPercent: 0,
      slaDueAt: null,
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
    vi.spyOn(prisma.projectActivity, "create").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440124",
      projectId: "550e8400-e29b-41d4-a716-446655440123",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      type: "PROJECT_CREATED",
      details: "Project created with status PLANNING",
      createdAt: new Date()
    });

    const app = await createCoreApp();
    const response = await app.inject({
      method: "POST",
      url: "/projects",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440000"
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440001",
        name: "Website Revamp"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: "550e8400-e29b-41d4-a716-446655440000"
        })
      })
    );

    await app.close();
  });

  it("scopes CLIENT lead status transitions to x-client-id", async () => {
    const activitySpy = vi.spyOn(prisma.leadActivity, "create").mockResolvedValue({
      id: "activity-1",
      leadId: "lead-1",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      type: "STATUS_CHANGED",
      details: "Moved NEW → QUALIFIED",
      createdAt: new Date()
    });
    const findFirstSpy = vi.spyOn(prisma.lead, "findFirst").mockResolvedValue({
      id: "lead-1",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Site rebuild",
      source: "Referral",
      status: "NEW",
      notes: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      company: null,
      ownerName: null,
      nextFollowUpAt: null,
      lostReason: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const updateSpy = vi.spyOn(prisma.lead, "update").mockResolvedValue({
      id: "lead-1",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Site rebuild",
      source: "Referral",
      status: "QUALIFIED",
      notes: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      company: null,
      ownerName: null,
      nextFollowUpAt: null,
      lostReason: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const app = await createCoreApp();
    const response = await app.inject({
      method: "PATCH",
      url: "/leads/550e8400-e29b-41d4-a716-446655440101/status",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440000"
      },
      payload: {
        status: "QUALIFIED"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(findFirstSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "550e8400-e29b-41d4-a716-446655440101",
          clientId: "550e8400-e29b-41d4-a716-446655440000"
        }
      })
    );
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lead-1" },
        data: { status: "QUALIFIED", lostReason: null }
      })
    );
    expect(activitySpy).toHaveBeenCalled();

    await app.close();
  });

  it("updates lead details and follow-up fields", async () => {
    const findFirstSpy = vi.spyOn(prisma.lead, "findFirst").mockResolvedValue({
      id: "lead-2",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Legacy title",
      source: "Referral",
      status: "CONTACTED",
      notes: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      company: null,
      ownerName: null,
      nextFollowUpAt: null,
      lostReason: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const updateSpy = vi.spyOn(prisma.lead, "update").mockResolvedValue({
      id: "lead-2",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Updated title",
      source: "Website",
      status: "CONTACTED",
      notes: "note",
      contactName: "Jane",
      contactEmail: "jane@example.com",
      contactPhone: "1234567",
      company: "Acme",
      ownerName: "Owner",
      nextFollowUpAt: new Date(),
      lostReason: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    vi.spyOn(prisma.leadActivity, "create").mockResolvedValue({
      id: "activity-2",
      leadId: "lead-2",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      type: "UPDATED",
      details: "Lead details updated",
      createdAt: new Date()
    });

    const app = await createCoreApp();
    const response = await app.inject({
      method: "PATCH",
      url: "/leads/550e8400-e29b-41d4-a716-446655440102",
      headers: {
        "x-user-role": "ADMIN",
        "x-user-id": "user-1"
      },
      payload: {
        title: "Updated title",
        source: "Website",
        notes: "note",
        contactName: "Jane",
        contactEmail: "jane@example.com",
        contactPhone: "1234567",
        company: "Acme",
        ownerName: "Owner"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(findFirstSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
    await app.close();
  });

  it("blocks CLIENT bulk lead status updates", async () => {
    const app = await createCoreApp();
    const response = await app.inject({
      method: "POST",
      url: "/leads/bulk-status",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440000"
      },
      payload: {
        leadIds: ["550e8400-e29b-41d4-a716-446655440111"],
        status: "QUALIFIED"
      }
    });
    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("saves and fetches lead preferences by user", async () => {
    const upsertSpy = vi.spyOn(prisma.userPreference, "upsert").mockResolvedValue({
      id: "pref-1",
      userId: "user-2",
      key: "savedView",
      value: "HOT",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const getSpy = vi.spyOn(prisma.userPreference, "findUnique").mockResolvedValue({
      id: "pref-1",
      userId: "user-2",
      key: "savedView",
      value: "HOT",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const app = await createCoreApp();
    const save = await app.inject({
      method: "POST",
      url: "/leads/preferences",
      headers: { "x-user-role": "ADMIN", "x-user-id": "user-2" },
      payload: { key: "savedView", value: "HOT" }
    });
    expect(save.statusCode).toBe(200);
    const fetch = await app.inject({
      method: "GET",
      url: "/leads/preferences?key=savedView",
      headers: { "x-user-role": "ADMIN", "x-user-id": "user-2" }
    });
    expect(fetch.statusCode).toBe(200);
    expect(upsertSpy).toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
    await app.close();
  });
});
