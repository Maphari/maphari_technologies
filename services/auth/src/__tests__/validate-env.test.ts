import { describe, it, expect, afterEach } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";
import { readAuthConfig } from "../lib/config.js";

describe("validateRequiredEnv", () => {
  const ORIGINAL = { ...process.env };

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL)) delete process.env[key];
    }
    Object.assign(process.env, ORIGINAL);
  });

  it("does not throw when all vars are present and non-empty", () => {
    process.env.FOO = "bar";
    process.env.BAZ = "qux";
    expect(() => validateRequiredEnv(["FOO", "BAZ"])).not.toThrow();
  });

  it("throws listing all missing vars in one message", () => {
    delete process.env.MISSING_A;
    delete process.env.MISSING_B;
    expect(() => validateRequiredEnv(["MISSING_A", "MISSING_B"])).toThrow(
      /\[startup\].*MISSING_A.*MISSING_B/
    );
  });

  it("treats undefined as missing", () => {
    delete process.env.UNDEF_VAR;
    expect(() => validateRequiredEnv(["UNDEF_VAR"])).toThrow(/UNDEF_VAR/);
  });

  it("treats empty string as missing", () => {
    process.env.EMPTY_VAR = "";
    expect(() => validateRequiredEnv(["EMPTY_VAR"])).toThrow(/EMPTY_VAR/);
  });

  it("treats whitespace-only string as missing", () => {
    process.env.WHITESPACE_VAR = "   ";
    expect(() => validateRequiredEnv(["WHITESPACE_VAR"])).toThrow(/WHITESPACE_VAR/);
  });

  it("does not throw for a non-empty string with surrounding whitespace", () => {
    process.env.PADDED_VAR = "  actual-secret  ";
    expect(() => validateRequiredEnv(["PADDED_VAR"])).not.toThrow();
  });
});

describe("readAuthConfig — no fallback secrets", () => {
  it("reads JWT_ACCESS_SECRET directly from env without fallback", () => {
    const saved = process.env.JWT_ACCESS_SECRET;
    process.env.JWT_ACCESS_SECRET = "my-real-secret";
    const config = readAuthConfig(process.env);
    expect(config.accessTokenSecret).toBe("my-real-secret");
    if (saved !== undefined) process.env.JWT_ACCESS_SECRET = saved;
    else delete process.env.JWT_ACCESS_SECRET;
  });

  it("returns undefined (not 'dev-access-secret') when JWT_ACCESS_SECRET is absent", () => {
    const saved = process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_ACCESS_SECRET;
    const config = readAuthConfig(process.env);
    expect(config.accessTokenSecret).toBeUndefined();
    if (saved !== undefined) process.env.JWT_ACCESS_SECRET = saved;
  });
});
