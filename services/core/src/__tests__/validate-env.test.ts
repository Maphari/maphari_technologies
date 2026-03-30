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

  it("does not throw when all vars present and non-empty", () => {
    process.env.CORE_TEST_A = "value";
    expect(() => validateRequiredEnv(["CORE_TEST_A"])).not.toThrow();
  });

  it("throws listing all missing vars", () => {
    delete process.env.MISSING_X;
    delete process.env.MISSING_Y;
    expect(() => validateRequiredEnv(["MISSING_X", "MISSING_Y"])).toThrow(
      /\[startup\].*MISSING_X.*MISSING_Y/
    );
  });

  it("treats empty string as missing", () => {
    process.env.EMPTY_VAR = "";
    expect(() => validateRequiredEnv(["EMPTY_VAR"])).toThrow(/EMPTY_VAR/);
  });

  it("treats whitespace-only as missing", () => {
    process.env.WS_VAR = "   ";
    expect(() => validateRequiredEnv(["WS_VAR"])).toThrow(/WS_VAR/);
  });
});
