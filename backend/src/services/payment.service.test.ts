import { describe, it, expect, vi } from "vitest";

// payment.service.ts transitively imports prisma/razorpay clients — stub them
// out so this test only exercises the pure signature-comparison logic below.
vi.mock("../lib/prisma", () => ({ default: {} }));
vi.mock("../lib/razorpay", () => ({ razorpay: null }));

import { timingSafeEqualHex } from "./payment.service";

describe("timingSafeEqualHex", () => {
  it("returns true for identical hex strings", () => {
    expect(timingSafeEqualHex("abcd1234", "abcd1234")).toBe(true);
  });

  it("returns false for different hex strings of the same length", () => {
    expect(timingSafeEqualHex("abcd1234", "abcd1235")).toBe(false);
  });

  it("returns false (rather than throwing) for different-length inputs", () => {
    expect(() => timingSafeEqualHex("ab", "abcd")).not.toThrow();
    expect(timingSafeEqualHex("ab", "abcd")).toBe(false);
  });

  it("returns false for a non-hex string instead of throwing", () => {
    expect(() => timingSafeEqualHex("not-hex!", "abcd1234")).not.toThrow();
  });
});
