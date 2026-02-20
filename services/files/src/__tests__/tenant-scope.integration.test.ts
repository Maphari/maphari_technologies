import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFilesApp } from "../app.js";
import { prisma } from "../lib/prisma.js";

describe("files tenant scope integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("scopes CLIENT /files requests by x-client-id", async () => {
    const findManySpy = vi.spyOn(prisma.fileRecord, "findMany").mockResolvedValue([]);
    const app = await createFilesApp();

    const response = await app.inject({
      method: "GET",
      url: "/files",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440111"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: "550e8400-e29b-41d4-a716-446655440111" }
      })
    );

    await app.close();
  });

  it("forces CLIENT /files create to scoped tenant", async () => {
    const createSpy = vi.spyOn(prisma.fileRecord, "create").mockResolvedValue({
      id: "file-1",
      clientId: "550e8400-e29b-41d4-a716-446655440111",
      fileName: "scope-test.pdf",
      storageKey: "uploads/scope-test.pdf",
      mimeType: "application/pdf",
      sizeBytes: BigInt(1024),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const app = await createFilesApp();

    const response = await app.inject({
      method: "POST",
      url: "/files",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440111"
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440999",
        fileName: "scope-test.pdf",
        storageKey: "uploads/scope-test.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024
      }
    });

    expect(response.statusCode).toBe(200);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: "550e8400-e29b-41d4-a716-446655440111"
        })
      })
    );

    await app.close();
  });
});
