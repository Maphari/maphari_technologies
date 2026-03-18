/**
 * Tests that callGateway retries on transient failures (network error, 502/503/504)
 * and does NOT retry on 4xx errors.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Use the admin shared callGateway (same pattern as portal + staff)
import { callGateway } from "@/lib/api/admin/_shared";

// Make setTimeout resolve immediately so tests don't wait real delays
beforeEach(() => {
  vi.stubGlobal("setTimeout", (fn: () => void) => { fn(); return 0; });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetchSequence(...responses: Array<{ status: number; body: unknown }>) {
  let call = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const resp = responses[Math.min(call++, responses.length - 1)];
      return {
        status: resp.status,
        json: () => Promise.resolve(resp.body),
      };
    })
  );
}

function stubFetchThrowThenSucceed(failCount: number, successBody: unknown) {
  let call = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      call++;
      if (call <= failCount) throw new Error("Network failure");
      return {
        status: 200,
        json: () => Promise.resolve(successBody),
      };
    })
  );
}

const TOKEN = "test-access-token";

describe("callGateway retry behaviour", () => {
  it("returns first successful response immediately (no retry needed)", async () => {
    stubFetchSequence({ status: 200, body: { success: true, data: { ok: true } } });

    const result = await callGateway("/test", TOKEN);

    expect(result.status).toBe(200);
    expect(vi.mocked(fetch).mock.calls.length).toBe(1);
  });

  it("retries once on network error (status 0) and succeeds on second attempt", async () => {
    stubFetchThrowThenSucceed(1, { success: true, data: { retried: true } });

    const result = await callGateway("/test", TOKEN);

    expect(result.status).toBe(200);
    expect(result.payload.success).toBe(true);
    expect(vi.mocked(fetch).mock.calls.length).toBe(2);
  });

  it("retries twice on 503 and succeeds on third attempt", async () => {
    stubFetchSequence(
      { status: 503, body: { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Down" } } },
      { status: 503, body: { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Down" } } },
      { status: 200, body: { success: true, data: { recovered: true } } }
    );

    const result = await callGateway("/test", TOKEN);

    expect(result.status).toBe(200);
    expect(result.payload.success).toBe(true);
    expect(vi.mocked(fetch).mock.calls.length).toBe(3);
  });

  it("returns last transient error after exhausting all 3 attempts", async () => {
    stubFetchSequence(
      { status: 503, body: { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Still down" } } },
      { status: 503, body: { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Still down" } } },
      { status: 503, body: { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Still down" } } }
    );

    const result = await callGateway("/test", TOKEN);

    expect(result.status).toBe(503);
    expect(result.payload.error?.code).toBe("SERVICE_UNAVAILABLE");
    expect(vi.mocked(fetch).mock.calls.length).toBe(3);
  });

  it("retries on 502 bad gateway", async () => {
    stubFetchSequence(
      { status: 502, body: { success: false, error: { code: "BAD_GATEWAY", message: "Bad gateway" } } },
      { status: 200, body: { success: true, data: {} } }
    );

    const result = await callGateway("/test", TOKEN);

    expect(result.status).toBe(200);
    expect(vi.mocked(fetch).mock.calls.length).toBe(2);
  });

  it("does NOT retry on 400 bad request", async () => {
    stubFetchSequence({ status: 400, body: { success: false, error: { code: "VALIDATION_ERROR", message: "Bad" } } });

    const result = await callGateway("/test", TOKEN);

    expect(result.status).toBe(400);
    expect(vi.mocked(fetch).mock.calls.length).toBe(1);
  });

  it("does NOT retry on 401 unauthorized", async () => {
    stubFetchSequence({ status: 401, body: { success: false, error: { code: "UNAUTHORIZED", message: "No" } } });

    const result = await callGateway("/test", TOKEN);

    expect(result.status).toBe(401);
    expect(vi.mocked(fetch).mock.calls.length).toBe(1);
  });

  it("does NOT retry on 403 forbidden", async () => {
    stubFetchSequence({ status: 403, body: { success: false, error: { code: "FORBIDDEN", message: "Nope" } } });

    const result = await callGateway("/test", TOKEN);

    expect(result.status).toBe(403);
    expect(vi.mocked(fetch).mock.calls.length).toBe(1);
  });

  it("retries on pure network failure and returns NETWORK_ERROR after 3 attempts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    const result = await callGateway("/test", TOKEN);

    expect(result.status).toBe(0);
    expect(result.payload.error?.code).toBe("NETWORK_ERROR");
    expect(vi.mocked(fetch).mock.calls.length).toBe(3);
  });
});
