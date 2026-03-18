import { describe, expect, it } from "vitest";
import { createCx } from "@/lib/utils/cx";

describe("createCx", () => {
  const styles = {
    card: "Card_card__x1y2",
    cardActive: "Card_cardActive__a3b4",
    header: "Card_header__c5d6",
  };

  const cx = createCx(styles);

  it("resolves a single mapped class name", () => {
    expect(cx("card")).toBe("Card_card__x1y2");
  });

  it("resolves multiple mapped class names", () => {
    expect(cx("card", "header")).toBe("Card_card__x1y2 Card_header__c5d6");
  });

  it("falls back to raw string for unmapped names (global classes)", () => {
    expect(cx("globalClass")).toBe("globalClass");
  });

  it("mixes mapped and unmapped class names", () => {
    expect(cx("card", "mt12")).toBe("Card_card__x1y2 mt12");
  });

  it("ignores falsy values (false, null, undefined)", () => {
    expect(cx("card", false, null, undefined, "header")).toBe(
      "Card_card__x1y2 Card_header__c5d6"
    );
  });

  it("returns empty string when all values are falsy", () => {
    expect(cx(false, null, undefined)).toBe("");
  });

  it("works with conditional expression patterns", () => {
    const isActive = true;
    expect(cx("card", isActive && "cardActive")).toBe(
      "Card_card__x1y2 Card_cardActive__a3b4"
    );
  });

  it("does not include trailing space", () => {
    const result = cx("card");
    expect(result.startsWith(" ")).toBe(false);
    expect(result.endsWith(" ")).toBe(false);
  });
});
