import { describe, it, expect, afterEach } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";

describe("validateRequiredEnv (files service)", () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL)) delete process.env[key];
    }
    Object.assign(process.env, ORIGINAL);
  });

  it("throws when UPLOAD_TOKEN_SECRET is missing", () => {
    delete process.env.UPLOAD_TOKEN_SECRET;
    expect(() => validateRequiredEnv(["UPLOAD_TOKEN_SECRET"])).toThrow(/UPLOAD_TOKEN_SECRET/);
  });
});

describe("upload-flow.ts — no hardcoded secret fallback", () => {
  it("does not contain the maphari-upload-secret fallback string", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync(
      new URL("../routes/upload-flow.ts", import.meta.url),
      "utf8"
    );
    expect(src).not.toContain("maphari-upload-secret");
  });
});
