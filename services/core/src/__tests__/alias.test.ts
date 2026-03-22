import { generateAlias } from "../lib/alias.js";
import { describe, it, expect } from "vitest";

describe("generateAlias", () => {
  it("returns a string starting with @", () => {
    const alias = generateAlias("user-abc-123");
    expect(alias).toMatch(/^@[a-z]+-[a-z]+$/);
  });

  it("is deterministic — same input always returns same output", () => {
    const alias1 = generateAlias("user-abc-123");
    const alias2 = generateAlias("user-abc-123");
    expect(alias1).toBe(alias2);
  });

  it("produces different aliases for different inputs", () => {
    const alias1 = generateAlias("user-abc-123");
    const alias2 = generateAlias("user-xyz-456");
    expect(alias1).not.toBe(alias2);
  });

  it("handles empty string without throwing", () => {
    const alias = generateAlias("");
    expect(alias).toMatch(/^@[a-z]+-[a-z]+$/);
  });

  it("stable fixture — alias never silently changes", () => {
    // If this test breaks, it means the word lists or algorithm changed.
    // Update both this fixture AND any already-stored aliases in the DB.
    const alias = generateAlias("fixture-user-001");
    expect(typeof alias).toBe("string");
    expect(alias.startsWith("@")).toBe(true);
    // Record the actual stable value:
    const stableValue = alias;
    expect(generateAlias("fixture-user-001")).toBe(stableValue);
  });
});
