import { describe, it, expect, afterEach } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";

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
