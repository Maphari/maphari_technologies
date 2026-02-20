import { describe, expect, it } from "vitest";
import { signWebhookPayload, verifyWebhookSignature } from "@maphari/platform";

describe("webhook signature utility", () => {
  it("verifies valid signatures", () => {
    const body = JSON.stringify({ invoiceId: "inv-1", amountCents: 12000 });
    const secret = "webhook-secret";
    const signature = signWebhookPayload(body, secret);

    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects tampered payloads", () => {
    const body = JSON.stringify({ invoiceId: "inv-1", amountCents: 12000 });
    const tamperedBody = JSON.stringify({ invoiceId: "inv-1", amountCents: 99999 });
    const secret = "webhook-secret";
    const signature = signWebhookPayload(body, secret);

    expect(verifyWebhookSignature(tamperedBody, signature, secret)).toBe(false);
  });
});
