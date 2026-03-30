import { describe, it, expect, afterEach } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("validateRequiredEnv (gateway)", () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL)) delete process.env[key];
    }
    Object.assign(process.env, ORIGINAL);
  });

  it("throws when JWT_ACCESS_SECRET is missing", () => {
    delete process.env.JWT_ACCESS_SECRET;
    expect(() => validateRequiredEnv(["JWT_ACCESS_SECRET"])).toThrow(/JWT_ACCESS_SECRET/);
  });
});

describe("rbac.guard.ts — no hardcoded secret fallback", () => {
  it("does not contain dev-access-secret fallback", () => {
    const src = readFileSync(
      join(__dirname, "../auth/rbac.guard.ts"),
      "utf8"
    );
    expect(src).not.toContain("dev-access-secret");
  });
});
