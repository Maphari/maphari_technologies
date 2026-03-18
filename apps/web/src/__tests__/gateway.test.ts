import { beforeEach, describe, expect, it, vi } from "vitest";
import { login, logout, forgotPassword } from "@/lib/api/gateway";

// ── Fetch mock helpers ─────────────────────────────────────────────────────────

function mockFetch(status: number, payload: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      status,
      json: () => Promise.resolve(payload),
    })
  );
}

function mockFetchError() {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("gateway — login()", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns success response on 200", async () => {
    const fakeSession = {
      accessToken: "tok_abc",
      refreshToken: "rft_xyz",
      expiresInSeconds: 900,
      user: { id: "u1", email: "client@example.com", role: "CLIENT", clientId: "c1" },
    };
    mockFetch(200, { success: true, data: fakeSession });

    const result = await login("client@example.com");

    expect(result.success).toBe(true);
    expect(result.data?.accessToken).toBe("tok_abc");
    expect(result.data?.user.role).toBe("CLIENT");
  });

  it("forwards role to the request body when provided", async () => {
    mockFetch(200, { success: true, data: {} });
    const fetchSpy = vi.mocked(fetch);

    await login("admin@maphari.com", { role: "ADMIN", password: "SecurePass123!" });

    const call = fetchSpy.mock.calls[0];
    const body = JSON.parse(call[1]?.body as string);
    expect(body.role).toBe("ADMIN");
    expect(body.password).toBe("SecurePass123!");
  });

  it("returns error response on 401", async () => {
    mockFetch(401, {
      success: false,
      error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." },
    });

    const result = await login("bad@example.com", { password: "wrongpass" });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns NETWORK_ERROR when fetch throws", async () => {
    mockFetchError();

    const result = await login("any@example.com");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("NETWORK_ERROR");
  });
});

describe("gateway — logout()", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns success on 200", async () => {
    mockFetch(200, { success: true, data: { loggedOut: true } });

    const result = await logout();

    expect(result.success).toBe(true);
    expect(result.data?.loggedOut).toBe(true);
  });

  it("returns NETWORK_ERROR when fetch throws", async () => {
    mockFetchError();

    const result = await logout();

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("NETWORK_ERROR");
  });
});

describe("gateway — forgotPassword()", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns success with sent:true on 200", async () => {
    mockFetch(200, { success: true, data: { sent: true } });

    const result = await forgotPassword("user@example.com");

    expect(result.success).toBe(true);
    expect(result.data?.sent).toBe(true);
  });

  it("passes email to the request body", async () => {
    mockFetch(200, { success: true, data: { sent: true } });
    const fetchSpy = vi.mocked(fetch);

    await forgotPassword("target@example.com");

    const call = fetchSpy.mock.calls[0];
    const body = JSON.parse(call[1]?.body as string);
    expect(body.email).toBe("target@example.com");
  });
});
