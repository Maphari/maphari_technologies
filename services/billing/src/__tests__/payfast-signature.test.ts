import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { generateSignature, normalizePayfastUrl, verifyItnSignature } from "../lib/payfast";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid ITN body that PayFast would POST to a merchant's notify URL. */
const BASE_BODY: Record<string, string> = {
  merchant_id: "10004002",
  merchant_key: "q1cd2rdny4a53",
  return_url: "https://example.com/return",
  cancel_url: "https://example.com/cancel",
  notify_url: "https://example.com/notify",
  name_first: "Test",
  name_last: "User",
  email_address: "test@example.com",
  m_payment_id: "order-001",
  amount: "150.00",
  item_name: "Wave 2 Retainer",
  payment_status: "COMPLETE",
  pf_payment_id: "pf-xyz-001",
};

// ---------------------------------------------------------------------------
// Tests — no passphrase
// ---------------------------------------------------------------------------

describe("verifyItnSignature — no passphrase", () => {
  beforeEach(() => {
    delete process.env.PAYFAST_PASSPHRASE;
  });

  it("returns true for a correctly signed body", () => {
    const sig = generateSignature(BASE_BODY);
    const body = { ...BASE_BODY, signature: sig };
    expect(verifyItnSignature(body)).toBe(true);
  });

  it("returns false when the signature field is missing", () => {
    // body has no `signature` key at all
    expect(verifyItnSignature({ ...BASE_BODY })).toBe(false);
  });

  it("returns false when the signature is an empty string", () => {
    expect(verifyItnSignature({ ...BASE_BODY, signature: "" })).toBe(false);
  });

  it("returns false when a body field is tampered after signing", () => {
    const sig = generateSignature(BASE_BODY);
    const tampered = { ...BASE_BODY, amount: "0.01", signature: sig };
    expect(verifyItnSignature(tampered)).toBe(false);
  });

  it("returns false when the signature itself is corrupted", () => {
    const sig = generateSignature(BASE_BODY);
    const corrupted = sig.slice(0, -4) + "0000";
    expect(verifyItnSignature({ ...BASE_BODY, signature: corrupted })).toBe(false);
  });

  it("accepts a signature provided in uppercase (case-insensitive compare)", () => {
    const sig = generateSignature(BASE_BODY).toUpperCase();
    const body = { ...BASE_BODY, signature: sig };
    // verifyItnSignature lowercases the incoming signature before comparing
    expect(verifyItnSignature(body)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests — with passphrase
// ---------------------------------------------------------------------------

describe("verifyItnSignature — with passphrase", () => {
  const PASSPHRASE = "payfast";

  beforeEach(() => {
    process.env.PAYFAST_PASSPHRASE = PASSPHRASE;
  });

  afterEach(() => {
    delete process.env.PAYFAST_PASSPHRASE;
  });

  it("returns true for a body signed with the matching passphrase", () => {
    const sig = generateSignature(BASE_BODY);
    const body = { ...BASE_BODY, signature: sig };
    expect(verifyItnSignature(body)).toBe(true);
  });

  it("returns false when the body was signed without a passphrase but one is now set", () => {
    // Sign without passphrase
    delete process.env.PAYFAST_PASSPHRASE;
    const sigNoPassphrase = generateSignature(BASE_BODY);

    // Now set passphrase for verification
    process.env.PAYFAST_PASSPHRASE = PASSPHRASE;
    expect(verifyItnSignature({ ...BASE_BODY, signature: sigNoPassphrase })).toBe(false);
  });

  it("returns false when a body field is tampered after signing (with passphrase)", () => {
    const sig = generateSignature(BASE_BODY);
    const tampered = { ...BASE_BODY, payment_status: "FAILED", signature: sig };
    expect(verifyItnSignature(tampered)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge-case / algorithm tests
// ---------------------------------------------------------------------------

describe("verifyItnSignature — edge cases", () => {
  beforeEach(() => {
    delete process.env.PAYFAST_PASSPHRASE;
  });

  it("ignores undefined and empty-string fields when computing signature", () => {
    const bodyWithExtras: Record<string, string | undefined> = {
      ...BASE_BODY,
      email_confirmation: "",   // should be stripped
    };
    // generateSignature strips these, so the produced sig should still verify
    const sig = generateSignature(bodyWithExtras as Record<string, string>);
    const body: Record<string, string> = { ...BASE_BODY, signature: sig };
    expect(verifyItnSignature(body)).toBe(true);
  });

  it("returns false for a completely fabricated signature", () => {
    const body = { ...BASE_BODY, signature: "00000000000000000000000000000000" };
    expect(verifyItnSignature(body)).toBe(false);
  });
});

describe("normalizePayfastUrl", () => {
  it("rewrites localhost to 127.0.0.1 for sandbox-friendly local redirects", () => {
    expect(normalizePayfastUrl("http://localhost:3000/client/payments?tab=all"))
      .toBe("http://127.0.0.1:3000/client/payments?tab=all");
  });

  it("leaves non-localhost URLs unchanged", () => {
    expect(normalizePayfastUrl("https://portal.maphari.com/client/payments"))
      .toBe("https://portal.maphari.com/client/payments");
  });
});
