import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFilesApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { cache } from "../lib/infrastructure.js";

describe("files upload flow integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.UPLOAD_TOKEN_SECRET = "files-upload-secret";
    process.env.UPLOAD_TOKEN_TTL_SECONDS = "900";
    process.env.UPLOAD_PUT_BASE_URL = "http://localhost:4005/uploads";
  });

  it("completes issue-url -> upload -> confirm with tenant scope", async () => {
    const markerStore = new Map<string, unknown>();
    vi.spyOn(cache, "setJson").mockImplementation(async (key, value) => {
      markerStore.set(key, value);
    });
    vi.spyOn(cache, "getJson").mockImplementation(async (key) => markerStore.get(key) as { uploaded: boolean } | null);
    vi.spyOn(cache, "delete").mockImplementation(async (key) => {
      markerStore.delete(key);
    });
    const createSpy = vi.spyOn(prisma.fileRecord, "create").mockResolvedValue({
      id: "file-200",
      clientId: "550e8400-e29b-41d4-a716-446655440111",
      fileName: "brief.pdf",
      storageKey: "550e8400-e29b-41d4-a716-446655440111-1-brief.pdf",
      mimeType: "application/pdf",
      sizeBytes: BigInt(1024),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const app = await createFilesApp();

    const issueResponse = await app.inject({
      method: "POST",
      url: "/files/upload-url",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440111"
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440999",
        fileName: "brief.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024
      }
    });

    expect(issueResponse.statusCode).toBe(200);
    const issueBody = issueResponse.json();
    expect(issueBody.success).toBe(true);
    const uploadUrl = issueBody.data.uploadUrl as string;
    const uploadToken = issueBody.data.uploadToken as string;
    const storageKey = issueBody.data.storageKey as string;

    const uploadUrlObject = new URL(uploadUrl);
    const uploadResponse = await app.inject({
      method: "PUT",
      url: `${uploadUrlObject.pathname}${uploadUrlObject.search}`,
      payload: "binary-payload",
      headers: { "content-type": "application/octet-stream" }
    });
    expect(uploadResponse.statusCode).toBe(204);

    const confirmResponse = await app.inject({
      method: "POST",
      url: "/files/confirm-upload",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440111"
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440999",
        fileName: "brief.pdf",
        storageKey,
        mimeType: "application/pdf",
        sizeBytes: 1024,
        uploadToken
      }
    });

    expect(confirmResponse.statusCode).toBe(200);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: "550e8400-e29b-41d4-a716-446655440111"
        })
      })
    );
    await app.close();
  });

  it("returns structured error when confirm is attempted before upload step", async () => {
    vi.spyOn(cache, "getJson").mockResolvedValue(null);
    const app = await createFilesApp();

    const issueResponse = await app.inject({
      method: "POST",
      url: "/files/upload-url",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440111"
      },
      payload: {
        fileName: "missing-upload.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024
      }
    });

    const issueBody = issueResponse.json();
    const confirmResponse = await app.inject({
      method: "POST",
      url: "/files/confirm-upload",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440111"
      },
      payload: {
        fileName: "missing-upload.pdf",
        storageKey: issueBody.data.storageKey,
        mimeType: "application/pdf",
        sizeBytes: 1024,
        uploadToken: issueBody.data.uploadToken
      }
    });

    expect(confirmResponse.statusCode).toBe(409);
    expect(confirmResponse.json()).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "UPLOAD_NOT_CONFIRMED"
        })
      })
    );
    await app.close();
  });
});
