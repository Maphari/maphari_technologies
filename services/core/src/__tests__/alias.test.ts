import { describe, it, expect } from "vitest";
import { generateAlias } from "../lib/alias.js";

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
    // Spot-check: these two specific inputs happen to produce different aliases.
    // Collisions are possible across the full ID space (only 2,808 combinations).
    const alias1 = generateAlias("user-abc-123");
    const alias2 = generateAlias("user-xyz-456");
    expect(alias1).not.toBe(alias2);
  });

  it("handles empty string without throwing", () => {
    const alias = generateAlias("");
    expect(alias).toMatch(/^@[a-z]+-[a-z]+$/);
  });

  it("stable fixture — alias never silently changes", () => {
    // If this test breaks, the word lists or algorithm changed.
    // Update this value AND migrate any already-stored aliases in the DB.
    expect(generateAlias("fixture-user-001")).toBe("@grand-leopard");
  });
});
