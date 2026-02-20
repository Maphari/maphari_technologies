import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChatApp } from "../app.js";
import { prisma } from "../lib/prisma.js";

describe("chat tenant scope integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("scopes CLIENT /conversations requests by x-client-id", async () => {
    const findManySpy = vi.spyOn(prisma.conversation, "findMany").mockResolvedValue([]);
    const app = await createChatApp();

    const response = await app.inject({
      method: "GET",
      url: "/conversations",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440123"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: "550e8400-e29b-41d4-a716-446655440123" }
      })
    );

    await app.close();
  });

  it("blocks CLIENT message post when conversation belongs to another client", async () => {
    vi.spyOn(prisma.conversation, "findUnique").mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440001",
      clientId: "550e8400-e29b-41d4-a716-446655440999",
      assigneeUserId: null,
      status: "OPEN",
      subject: "Scope test",
      projectId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const app = await createChatApp();

    const response = await app.inject({
      method: "POST",
      url: "/messages",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440000"
      },
      payload: {
        conversationId: "550e8400-e29b-41d4-a716-446655440001",
        content: "Hello"
      }
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });
});
