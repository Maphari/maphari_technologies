import { describe, expect, it } from "vitest";
import { ChainedSecretProvider, EnvSecretProvider } from "@maphari/platform";

describe("secret provider strategy", () => {
  it("falls back to secondary provider when primary misses", async () => {
    const fallback = {
      getSecret: async (name: string) => (name === "PAYMENT_SIGNING_SECRET" ? "fallback-secret" : undefined)
    };
    const provider = new ChainedSecretProvider(new EnvSecretProvider(), fallback);

    const secret = await provider.getSecret("PAYMENT_SIGNING_SECRET");
    expect(secret).toBe("fallback-secret");
  });
});
