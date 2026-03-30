import { describe, it, expect, afterEach } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";

describe("validateRequiredEnv (notifications service)", () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL)) delete process.env[key];
    }
    Object.assign(process.env, ORIGINAL);
  });

  it("throws when NOTIFICATION_CALLBACK_SECRET is missing", () => {
    delete process.env.NOTIFICATION_CALLBACK_SECRET;
    expect(() => validateRequiredEnv(["NOTIFICATION_CALLBACK_SECRET"])).toThrow(
      /NOTIFICATION_CALLBACK_SECRET/
    );
  });
});

describe("notifications.ts — no hardcoded secret fallback", () => {
  it("does not contain the dev-notification-callback-secret string", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync(
      new URL("../routes/notifications.ts", import.meta.url),
      "utf8"
    );
    expect(src).not.toContain("dev-notification-callback-secret");
  });
});
