import { describe, it, expect } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";

describe("validateRequiredEnv (notifications service)", () => {
  it("throws when NOTIFICATION_CALLBACK_SECRET is missing", () => {
    const saved = process.env.NOTIFICATION_CALLBACK_SECRET;
    delete process.env.NOTIFICATION_CALLBACK_SECRET;
    expect(() => validateRequiredEnv(["NOTIFICATION_CALLBACK_SECRET"])).toThrow(
      /NOTIFICATION_CALLBACK_SECRET/
    );
    if (saved !== undefined) process.env.NOTIFICATION_CALLBACK_SECRET = saved;
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
