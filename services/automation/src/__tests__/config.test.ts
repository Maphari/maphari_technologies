import { describe, expect, it } from "vitest";
import { readAutomationConfig } from "../lib/config.js";

describe("readAutomationConfig", () => {
  it("loads defaults with noop providers", () => {
    const config = readAutomationConfig({
      NATS_URL: "nats://localhost:4222"
    });

    expect(config.port).toBe(4003);
    expect(config.maxRetries).toBe(3);
    expect(config.notifications.provider).toBe("noop");
    expect(config.crm.provider).toBe("noop");
  });

  it("fails when webhook provider is configured without URL", () => {
    expect(() =>
      readAutomationConfig({
        NATS_URL: "nats://localhost:4222",
        AUTOMATION_NOTIFICATIONS_PROVIDER: "webhook"
      })
    ).toThrow(/AUTOMATION_NOTIFICATIONS_WEBHOOK_URL/);
  });

  it("fails strict mode when webhook secret is missing", () => {
    expect(() =>
      readAutomationConfig({
        NATS_URL: "nats://localhost:4222",
        AUTOMATION_STRICT_SECRETS: "true",
        AUTOMATION_CRM_PROVIDER: "webhook",
        AUTOMATION_CRM_WEBHOOK_URL: "https://crm.example.com/webhook"
      })
    ).toThrow(/AUTOMATION_CRM_API_KEY/);
  });

  it("fails when redis is enabled with invalid REDIS_URL", () => {
    expect(() =>
      readAutomationConfig({
        NATS_URL: "nats://localhost:4222",
        AUTOMATION_REDIS_ENABLED: "true",
        REDIS_URL: "http://localhost:6379"
      })
    ).toThrow(/REDIS_URL/);
  });
});
