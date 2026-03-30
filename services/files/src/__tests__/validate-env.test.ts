import { describe, it, expect } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";

describe("validateRequiredEnv (files service)", () => {
  it("throws when UPLOAD_TOKEN_SECRET is missing", () => {
    const saved = process.env.UPLOAD_TOKEN_SECRET;
    delete process.env.UPLOAD_TOKEN_SECRET;
    expect(() => validateRequiredEnv(["UPLOAD_TOKEN_SECRET"])).toThrow(/UPLOAD_TOKEN_SECRET/);
    if (saved !== undefined) process.env.UPLOAD_TOKEN_SECRET = saved;
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
