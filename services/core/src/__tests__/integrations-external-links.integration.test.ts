import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCoreApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { eventBus } from "../lib/infrastructure.js";

const taskId = "550e8400-e29b-41d4-a716-446655440911";
const projectId = "550e8400-e29b-41d4-a716-446655440912";
const clientId = "550e8400-e29b-41d4-a716-446655440913";

function mockTaskWithProject(externalLinks: unknown = null) {
  return {
    id: taskId,
    projectId,
    title: "Implement billing webhook",
    assigneeName: "Ops User",
    externalLinks,
    status: "IN_PROGRESS",
    dueAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    blockedAt: null,
    estimateMinutes: null,
    priority: "MEDIUM",
    progressPercent: 0,
    sprintId: null,
    storyPoints: null,
    project: { id: projectId, clientId, name: "Platform Revamp" }
  } as any;
}

function mockConnectedConnection(providerKey: "jira" | "asana" | "clickup", metadata: Record<string, unknown>) {
  return {
    id: "550e8400-e29b-41d4-a716-446655440921",
    clientId,
    providerId: "550e8400-e29b-41d4-a716-446655440922",
    providerKey,
    status: "CONNECTED",
    connectionType: "assisted",
    connectedByUserId: null,
    connectedByContactEmail: null,
    assignedOwnerUserId: null,
    connectedAt: new Date(),
    disconnectedAt: null,
    lastCheckedAt: null,
    lastSyncedAt: null,
    lastSuccessfulSyncAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    healthStatus: "HEALTHY",
    configurationSummary: null,
    externalAccountId: null,
    externalAccountLabel: null,
    metadata,
    createdAt: new Date(),
    updatedAt: new Date()
  } as any;
}

describe("integrations external task links", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(eventBus, "publish").mockResolvedValue(undefined);
    process.env.TEST_JIRA_TOKEN = "jira-test-token";
  });

  it("blocks create-external-link for client role", async () => {
    const app = await createCoreApp();
    const response = await app.inject({
      method: "POST",
      url: `/admin/integrations/tasks/${taskId}/create-external-link`,
      headers: { "x-user-role": "CLIENT", "x-client-id": clientId },
      payload: { providerKey: "jira" }
    });
    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("creates a jira external task link and appends it to task", async () => {
    vi.spyOn(prisma.projectTask, "findUnique").mockResolvedValue(mockTaskWithProject());
    vi.spyOn(prisma.clientIntegrationConnection, "findFirst").mockResolvedValue(
      mockConnectedConnection("jira", {
        baseUrl: "https://jira.example.com",
        email: "ops@example.com",
        apiTokenRef: "TEST_JIRA_TOKEN",
        projectKey: "PLAT"
      })
    );
    vi.spyOn(prisma.integrationSyncEvent, "findFirst").mockResolvedValue(null);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ key: "PLAT-123" }),
      { status: 201, headers: { "content-type": "application/json" } }
    ) as unknown as Response);
    const updateSpy = vi.spyOn(prisma.projectTask, "update").mockResolvedValue({
      id: taskId,
      projectId,
      title: "Implement billing webhook",
      assigneeName: "Ops User",
      externalLinks: [{ id: "x", providerKey: "jira", externalId: "PLAT-123", externalUrl: "https://jira.example.com/browse/PLAT-123" }],
      status: "IN_PROGRESS",
      dueAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      blockedAt: null,
      estimateMinutes: null,
      priority: "MEDIUM",
      progressPercent: 0,
      sprintId: null,
      storyPoints: null
    } as any);
    const syncCreateSpy = vi.spyOn(prisma.integrationSyncEvent, "create").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440923",
      connectionId: "550e8400-e29b-41d4-a716-446655440921",
      clientId,
      taskId,
      providerKey: "jira",
      idempotencyKey: "a",
      status: "SUCCESS",
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 120,
      summary: "ok",
      errorCode: null,
      errorMessage: null,
      details: null,
      createdAt: new Date()
    } as any);

    const app = await createCoreApp();
    const response = await app.inject({
      method: "POST",
      url: `/admin/integrations/tasks/${taskId}/create-external-link`,
      headers: { "x-user-role": "STAFF", "x-user-id": "550e8400-e29b-41d4-a716-446655440900" },
      payload: { providerKey: "jira", idempotencyKey: "create-ext:jira:1" }
    });
    expect(response.statusCode).toBe(200);
    const payload = response.json() as { success: boolean; data?: { createdLink?: { externalId?: string } } };
    expect(payload.success).toBe(true);
    expect(payload.data?.createdLink?.externalId).toBe("PLAT-123");
    expect(updateSpy).toHaveBeenCalled();
    expect(syncCreateSpy).toHaveBeenCalled();
    await app.close();
  });

  it.each([
    {
      providerKey: "asana",
      metadata: { workspaceId: "120000", projectId: "120001", accessTokenRef: "TEST_ASANA_TOKEN" },
      envKey: "TEST_ASANA_TOKEN",
      response: { data: { gid: "120002", permalink_url: "https://app.asana.com/0/120001/120002" } },
      expectedExternalId: "120002",
    },
    {
      providerKey: "clickup",
      metadata: { listId: "9001", apiTokenRef: "TEST_CLICKUP_TOKEN" },
      envKey: "TEST_CLICKUP_TOKEN",
      response: { id: "cu_7788", url: "https://app.clickup.com/t/cu_7788" },
      expectedExternalId: "cu_7788",
    }
  ] as const)("creates and appends external link for $providerKey", async ({ providerKey, metadata, envKey, response, expectedExternalId }) => {
    process.env[envKey] = `${providerKey}-token`;
    vi.spyOn(prisma.projectTask, "findUnique").mockResolvedValue(mockTaskWithProject());
    vi.spyOn(prisma.clientIntegrationConnection, "findFirst").mockResolvedValue(
      mockConnectedConnection(providerKey, metadata)
    );
    vi.spyOn(prisma.integrationSyncEvent, "findFirst").mockResolvedValue(null);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify(response),
      { status: 201, headers: { "content-type": "application/json" } }
    ) as unknown as Response);
    const updateSpy = vi.spyOn(prisma.projectTask, "update").mockResolvedValue({
      ...mockTaskWithProject([{
        id: "x",
        providerKey,
        externalId: expectedExternalId,
        externalUrl: providerKey === "asana" ? "https://app.asana.com/0/120001/120002" : "https://app.clickup.com/t/cu_7788"
      }]),
      project: undefined
    } as any);
    vi.spyOn(prisma.integrationSyncEvent, "create").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440923",
      connectionId: "550e8400-e29b-41d4-a716-446655440921",
      clientId,
      taskId,
      providerKey,
      idempotencyKey: "provider-idempotency",
      status: "SUCCESS",
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 120,
      summary: "ok",
      errorCode: null,
      errorMessage: null,
      details: null,
      createdAt: new Date()
    } as any);

    const app = await createCoreApp();
    const res = await app.inject({
      method: "POST",
      url: `/admin/integrations/tasks/${taskId}/create-external-link`,
      headers: { "x-user-role": "STAFF", "x-user-id": "550e8400-e29b-41d4-a716-446655440900" },
      payload: { providerKey, idempotencyKey: "provider-idempotency" }
    });
    expect(res.statusCode).toBe(200);
    const payload = res.json() as { success: boolean; data?: { createdLink?: { externalId?: string } } };
    expect(payload.success).toBe(true);
    expect(payload.data?.createdLink?.externalId).toBe(expectedExternalId);
    expect(updateSpy).toHaveBeenCalled();
    await app.close();
  });

  it("returns idempotent replay without calling provider", async () => {
    vi.spyOn(prisma.projectTask, "findUnique").mockResolvedValue(
      mockTaskWithProject([{ id: "existing", providerKey: "jira", externalId: "PLAT-888", externalUrl: "https://jira.example.com/browse/PLAT-888" }])
    );
    vi.spyOn(prisma.clientIntegrationConnection, "findFirst").mockResolvedValue(
      mockConnectedConnection("jira", { baseUrl: "https://jira.example.com", email: "ops@example.com", apiTokenRef: "TEST_JIRA_TOKEN", projectKey: "PLAT" })
    );
    vi.spyOn(prisma.integrationSyncEvent, "findFirst").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440930",
      connectionId: "550e8400-e29b-41d4-a716-446655440921",
      clientId,
      taskId,
      providerKey: "jira",
      idempotencyKey: "same-key",
      status: "SUCCESS",
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 100,
      summary: "already",
      errorCode: null,
      errorMessage: null,
      details: { externalId: "PLAT-888", externalUrl: "https://jira.example.com/browse/PLAT-888" },
      createdAt: new Date()
    } as any);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const app = await createCoreApp();
    const response = await app.inject({
      method: "POST",
      url: `/admin/integrations/tasks/${taskId}/create-external-link`,
      headers: { "x-user-role": "STAFF", "x-user-id": "550e8400-e29b-41d4-a716-446655440900" },
      payload: { providerKey: "jira", idempotencyKey: "same-key" }
    });
    expect(response.statusCode).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
    await app.close();
  });

  it("returns 409 when idempotency key already has a failed attempt", async () => {
    vi.spyOn(prisma.projectTask, "findUnique").mockResolvedValue(mockTaskWithProject());
    vi.spyOn(prisma.clientIntegrationConnection, "findFirst").mockResolvedValue(
      mockConnectedConnection("jira", { baseUrl: "https://jira.example.com", email: "ops@example.com", apiTokenRef: "TEST_JIRA_TOKEN", projectKey: "PLAT" })
    );
    vi.spyOn(prisma.integrationSyncEvent, "findFirst").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440930",
      connectionId: "550e8400-e29b-41d4-a716-446655440921",
      clientId,
      taskId,
      providerKey: "jira",
      idempotencyKey: "same-key",
      status: "FAILED",
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 100,
      summary: null,
      errorCode: "JIRA_429",
      errorMessage: "rate limited",
      details: null,
      createdAt: new Date()
    } as any);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const app = await createCoreApp();
    const response = await app.inject({
      method: "POST",
      url: `/admin/integrations/tasks/${taskId}/create-external-link`,
      headers: { "x-user-role": "STAFF", "x-user-id": "550e8400-e29b-41d4-a716-446655440900" },
      payload: { providerKey: "jira", idempotencyKey: "same-key" }
    });
    expect(response.statusCode).toBe(409);
    expect(fetchSpy).not.toHaveBeenCalled();
    await app.close();
  });

  it("returns 502 and logs failed sync event when provider rejects create", async () => {
    vi.spyOn(prisma.projectTask, "findUnique").mockResolvedValue(mockTaskWithProject());
    vi.spyOn(prisma.clientIntegrationConnection, "findFirst").mockResolvedValue(
      mockConnectedConnection("jira", { baseUrl: "https://jira.example.com", email: "ops@example.com", apiTokenRef: "TEST_JIRA_TOKEN", projectKey: "PLAT" })
    );
    vi.spyOn(prisma.integrationSyncEvent, "findFirst").mockResolvedValue(null);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ errorMessages: ["rate limited"] }),
      { status: 429, headers: { "retry-after": "0", "content-type": "application/json" } }
    ) as unknown as Response);
    const syncCreateSpy = vi.spyOn(prisma.integrationSyncEvent, "create").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440940",
      connectionId: "550e8400-e29b-41d4-a716-446655440921",
      clientId,
      taskId,
      providerKey: "jira",
      idempotencyKey: null,
      status: "FAILED",
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 200,
      summary: null,
      errorCode: "JIRA_429",
      errorMessage: "rate limited",
      details: null,
      createdAt: new Date()
    } as any);
    const app = await createCoreApp();
    const response = await app.inject({
      method: "POST",
      url: `/admin/integrations/tasks/${taskId}/create-external-link`,
      headers: { "x-user-role": "STAFF", "x-user-id": "550e8400-e29b-41d4-a716-446655440900" },
      payload: { providerKey: "jira" }
    });
    expect(response.statusCode).toBe(502);
    expect(syncCreateSpy).toHaveBeenCalled();
    await app.close();
  });

  it.each([
    { providerKey: "asana", metadata: { workspaceId: "120000", projectId: "120001", accessTokenRef: "TEST_ASANA_TOKEN" }, envKey: "TEST_ASANA_TOKEN", errorCode: "ASANA_429" },
    { providerKey: "clickup", metadata: { listId: "9001", apiTokenRef: "TEST_CLICKUP_TOKEN" }, envKey: "TEST_CLICKUP_TOKEN", errorCode: "CLICKUP_429" }
  ] as const)("returns 502 and logs failed sync event for $providerKey provider failures", async ({ providerKey, metadata, envKey, errorCode }) => {
    process.env[envKey] = `${providerKey}-token`;
    vi.spyOn(prisma.projectTask, "findUnique").mockResolvedValue(mockTaskWithProject());
    vi.spyOn(prisma.clientIntegrationConnection, "findFirst").mockResolvedValue(
      mockConnectedConnection(providerKey, metadata)
    );
    vi.spyOn(prisma.integrationSyncEvent, "findFirst").mockResolvedValue(null);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ error: "rate limited" }),
      { status: 429, headers: { "retry-after": "0", "content-type": "application/json" } }
    ) as unknown as Response);
    const syncCreateSpy = vi.spyOn(prisma.integrationSyncEvent, "create").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440940",
      connectionId: "550e8400-e29b-41d4-a716-446655440921",
      clientId,
      taskId,
      providerKey,
      idempotencyKey: null,
      status: "FAILED",
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 200,
      summary: null,
      errorCode,
      errorMessage: "rate limited",
      details: null,
      createdAt: new Date()
    } as any);
    const app = await createCoreApp();
    const response = await app.inject({
      method: "POST",
      url: `/admin/integrations/tasks/${taskId}/create-external-link`,
      headers: { "x-user-role": "STAFF", "x-user-id": "550e8400-e29b-41d4-a716-446655440900" },
      payload: { providerKey }
    });
    expect(response.statusCode).toBe(502);
    expect(syncCreateSpy).toHaveBeenCalled();
    await app.close();
  });

  it("returns task integration sync logs and blocks client role", async () => {
    vi.spyOn(prisma.projectTask, "findUnique").mockResolvedValue({
      id: taskId,
      projectId,
      title: "Implement billing webhook",
      assigneeName: "Ops User",
      externalLinks: null,
      status: "IN_PROGRESS",
      dueAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      blockedAt: null,
      estimateMinutes: null,
      priority: "MEDIUM",
      progressPercent: 0,
      sprintId: null,
      storyPoints: null,
      project: { clientId }
    } as any);
    vi.spyOn(prisma.integrationSyncEvent, "findMany").mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440950",
        connectionId: "550e8400-e29b-41d4-a716-446655440921",
        clientId,
        taskId,
        providerKey: "jira",
        idempotencyKey: "a",
        status: "SUCCESS",
        startedAt: new Date(),
        finishedAt: new Date(),
        durationMs: 111,
        summary: "Created",
        errorCode: null,
        errorMessage: null,
        details: null,
        createdAt: new Date()
      }
    ] as any);
    const app = await createCoreApp();
    const ok = await app.inject({
      method: "GET",
      url: `/admin/tasks/${taskId}/integration-sync-events`,
      headers: { "x-user-role": "STAFF", "x-user-id": "550e8400-e29b-41d4-a716-446655440900" }
    });
    expect(ok.statusCode).toBe(200);
    const blocked = await app.inject({
      method: "GET",
      url: `/admin/tasks/${taskId}/integration-sync-events`,
      headers: { "x-user-role": "CLIENT", "x-client-id": clientId }
    });
    expect(blocked.statusCode).toBe(403);
    await app.close();
  });
});
