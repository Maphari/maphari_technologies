import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest } from "fastify";

vi.mock("../lib/key-store.js", () => ({
  lookupActiveKey: vi.fn(),
  touchLastUsed: vi.fn(),
}));
vi.mock("../lib/redis.js", () => ({
  getRedis: vi.fn(() => ({
    set: vi.fn(),
  })),
}));

import { lookupActiveKey, touchLastUsed } from "../lib/key-store.js";
import { getRedis } from "../lib/redis.js";
import { verifyPublicApiRequest } from "../lib/auth.js";
import { createHmac } from "node:crypto";

const mockLookup = lookupActiveKey as ReturnType<typeof vi.fn>;
const mockRedis = getRedis as ReturnType<typeof vi.fn>;

function makeRequest(overrides: Partial<{
  headers: Record<string, string>;
  rawBody: Buffer;
  body: unknown;
}>): FastifyRequest {
  const body = overrides.body ?? {};
  const rawBody = overrides.rawBody ?? Buffer.from(JSON.stringify(body), "utf8");
  return {
    headers: overrides.headers ?? {},
    rawBody,
    body,
    log: { info: vi.fn(), error: vi.fn() },
  } as unknown as FastifyRequest;
}

function makeSignature(timestamp: string, rawBody: Buffer, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest("hex");
}

describe("verifyPublicApiRequest", () => {
  const ENC_KEY = Buffer.from("a".repeat(64), "hex").toString("base64");
  const keyId = "pk_abc123";
  const keySecret = "sk_secret123";
  const clientId = "client-1";

  beforeEach(() => {
    vi.clearAllMocks();
    mockLookup.mockResolvedValue({ keySecret, clientId });
    mockRedis.mockReturnValue({
      set: vi.fn().mockResolvedValue("OK"),
    });
  });

  it("returns ok=true with valid signature and timestamp", async () => {
    const timestamp = String(Date.now());
    const nonce = "550e8400-e29b-41d4-a716-446655440000";
    const rawBody = Buffer.from(JSON.stringify({ foo: "bar" }), "utf8");
    const sig = makeSignature(timestamp, rawBody, keySecret);

    const req = makeRequest({
      headers: {
        "x-api-key-id": keyId,
        "x-timestamp": timestamp,
        "x-nonce": nonce,
        "x-api-signature": sig,
      },
      rawBody,
    });

    const result = await verifyPublicApiRequest(req, ENC_KEY);
    expect(result.ok).toBe(true);
    expect(result.clientId).toBe(clientId);
  });

  it("rejects missing x-timestamp header", async () => {
    const req = makeRequest({
      headers: { "x-api-key-id": keyId },
    });
    const result = await verifyPublicApiRequest(req, ENC_KEY);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("UNAUTHORIZED");
  });

  it("rejects timestamp outside 5-minute window", async () => {
    const staleTimestamp = String(Date.now() - 6 * 60 * 1000);
    const nonce = "550e8400-e29b-41d4-a716-446655440001";
    const rawBody = Buffer.from("{}", "utf8");
    const sig = makeSignature(staleTimestamp, rawBody, keySecret);

    const req = makeRequest({
      headers: {
        "x-api-key-id": keyId,
        "x-timestamp": staleTimestamp,
        "x-nonce": nonce,
        "x-api-signature": sig,
      },
      rawBody,
    });
    const result = await verifyPublicApiRequest(req, ENC_KEY);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("TIMESTAMP_EXPIRED");
  });

  it("rejects replayed nonce", async () => {
    const timestamp = String(Date.now());
    const nonce = "550e8400-e29b-41d4-a716-446655440002";
    const rawBody = Buffer.from("{}", "utf8");
    const sig = makeSignature(timestamp, rawBody, keySecret);

    mockRedis.mockReturnValue({
      set: vi.fn().mockResolvedValue(null), // null = key already exists = replay
    });

    const req = makeRequest({
      headers: {
        "x-api-key-id": keyId,
        "x-timestamp": timestamp,
        "x-nonce": nonce,
        "x-api-signature": sig,
      },
      rawBody,
    });
    const result = await verifyPublicApiRequest(req, ENC_KEY);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("REPLAY_DETECTED");
  });

  it("rejects invalid signature", async () => {
    const timestamp = String(Date.now());
    const nonce = "550e8400-e29b-41d4-a716-446655440003";
    const rawBody = Buffer.from("{}", "utf8");

    const req = makeRequest({
      headers: {
        "x-api-key-id": keyId,
        "x-timestamp": timestamp,
        "x-nonce": nonce,
        "x-api-signature": "wrong-signature",
      },
      rawBody,
    });
    const result = await verifyPublicApiRequest(req, ENC_KEY);
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("UNAUTHORIZED");
  });
});
