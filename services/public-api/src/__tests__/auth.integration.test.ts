import { describe, expect, it, beforeEach, vi } from "vitest";
import { createHmac } from "node:crypto";
import { createPublicApiApp } from "../app.js";

// Mock key-store, Redis for integration test (no live DB/Redis required)
vi.mock("../lib/key-store.js", () => ({
  lookupActiveKey: vi.fn(),
  touchLastUsed: vi.fn(),
  createApiKey: vi.fn(),
  revokeApiKey: vi.fn(),
  listApiKeys: vi.fn().mockResolvedValue([]),
  listProjects: vi.fn().mockResolvedValue([]),
}));

vi.mock("../lib/redis.js", () => ({
  getRedis: vi.fn(() => ({
    set: vi.fn().mockResolvedValue("OK"),
  })),
  closeRedis: vi.fn(),
}));

import { lookupActiveKey, createApiKey } from "../lib/key-store.js";
import { getRedis } from "../lib/redis.js";

const mockLookup = lookupActiveKey as ReturnType<typeof vi.fn>;

const TEST_ENC_KEY = Buffer.alloc(32).toString("base64");
const TEST_KEY_SECRET = "sk_testsecret1234567890abcdefgh";
const TEST_CLIENT_ID = "550e8400-e29b-41d4-a716-446655440551";
const TEST_KEY_ID = "pk_testkey123";

describe("public api authentication integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY_ENCRYPTION_KEY = TEST_ENC_KEY;
    (getRedis as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockResolvedValue("OK"),
    });
  });

  it("authenticates partner requests using key id + canonical signature", async () => {
    mockLookup.mockResolvedValue({ keySecret: TEST_KEY_SECRET, clientId: TEST_CLIENT_ID });
    (createApiKey as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "proj-1",
      clientId: TEST_CLIENT_ID,
      name: "External Project",
      description: "Created by partner endpoint",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const app = await createPublicApiApp();

    const partnerPayload = {
      name: "External Project",
      description: "Created by partner endpoint",
    };
    const rawBody = JSON.stringify(partnerPayload);
    const timestamp = String(Date.now());
    const nonce = "test-nonce-001";
    const signature = createHmac("sha256", TEST_KEY_SECRET)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    const createProject = await app.inject({
      method: "POST",
      url: "/public-api/projects",
      headers: {
        "x-api-key-id": TEST_KEY_ID,
        "x-timestamp": timestamp,
        "x-nonce": nonce,
        "x-api-signature": signature,
      },
      payload: partnerPayload,
    });

    expect(createProject.statusCode).toBe(200);
    await app.close();
  });

  it("rejects public api requests with invalid signature", async () => {
    mockLookup.mockResolvedValue({ keySecret: TEST_KEY_SECRET, clientId: TEST_CLIENT_ID });

    const app = await createPublicApiApp();

    const timestamp = String(Date.now());
    const response = await app.inject({
      method: "POST",
      url: "/public-api/projects",
      headers: {
        "x-api-key-id": TEST_KEY_ID,
        "x-timestamp": timestamp,
        "x-nonce": "nonce-test",
        "x-api-signature": "bad-signature",
      },
      payload: {
        name: "Unauthorized Project",
      },
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
