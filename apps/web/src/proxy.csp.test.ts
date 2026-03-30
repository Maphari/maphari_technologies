import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

let buildCsp: (nonce: string) => string;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("./proxy.js");
  buildCsp = (mod as unknown as { buildCsp: typeof buildCsp }).buildCsp;
});

describe("buildCsp — production mode", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  it("includes nonce in script-src", () => {
    const csp = buildCsp("test-nonce-abc");
    expect(csp).toContain("'nonce-test-nonce-abc'");
  });

  it("does NOT include unsafe-eval in production", () => {
    const csp = buildCsp("nonce123");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("does NOT include unsafe-inline in script-src production", () => {
    const csp = buildCsp("nonce123");
    const scriptSrcLine = csp.split(";").find((d) => d.trim().startsWith("script-src"));
    expect(scriptSrcLine).toBeDefined();
    expect(scriptSrcLine).not.toContain("unsafe-inline");
  });

  it("does NOT include localhost in connect-src in production", () => {
    const csp = buildCsp("nonce123");
    const connectSrcLine = csp.split(";").find((d) => d.trim().startsWith("connect-src"));
    expect(connectSrcLine).toBeDefined();
    expect(connectSrcLine).not.toContain("localhost");
  });

  it("includes strict-dynamic in script-src", () => {
    const csp = buildCsp("nonce123");
    expect(csp).toContain("'strict-dynamic'");
  });
});

describe("buildCsp — development mode", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  it("includes unsafe-eval in development", () => {
    const csp = buildCsp("nonce123");
    expect(csp).toContain("unsafe-eval");
  });

  it("includes localhost in connect-src in development", () => {
    const csp = buildCsp("nonce123");
    expect(csp).toContain("localhost");
  });
});
