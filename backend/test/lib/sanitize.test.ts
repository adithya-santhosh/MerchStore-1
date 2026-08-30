import { describe, it, expect } from "vitest";
import { stripHtml } from "../../src/lib/sanitize";

describe("stripHtml", () => {
  it("drops a script tag and its content entirely", () => {
    expect(stripHtml("<script>alert(1)</script>Hello")).toBe("Hello");
  });

  it("drops an attribute-based injection with no visible text left behind", () => {
    expect(stripHtml('<img src=x onerror="alert(1)">')).toBe("");
  });

  it("removes tags but keeps their text content", () => {
    expect(stripHtml("Ada <b>Lovelace</b>")).toBe("Ada Lovelace");
  });

  it("leaves plain text untouched", () => {
    expect(stripHtml("Great product, fast shipping")).toBe("Great product, fast shipping");
  });

  it("trims surrounding whitespace", () => {
    expect(stripHtml("  Ada  ")).toBe("Ada");
  });

  it("does not entity-encode literal &, < or > — output is plain text, not HTML", () => {
    expect(stripHtml("Tom & Jerry")).toBe("Tom & Jerry");
    expect(stripHtml("5 < 10 and 10 > 5")).toBe("5 < 10 and 10 > 5");
  });

  it("preserves unicode", () => {
    expect(stripHtml("café Ω 日本語")).toBe("café Ω 日本語");
  });
});
