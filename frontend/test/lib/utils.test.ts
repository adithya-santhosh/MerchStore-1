import { describe, it, expect } from "vitest";
import { cn, getProductImageSrc } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";

describe("cn", () => {
  it("joins several class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values from conditional classes", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });

  it("lets a later Tailwind utility win over an earlier conflicting one", () => {
    // This is the whole point of twMerge: `px-4 px-2` must collapse to `px-2`.
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("keeps non-conflicting utilities side by side", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("accepts arrays and objects the way clsx does", () => {
    expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c");
  });

  it("returns an empty string when given nothing", () => {
    expect(cn()).toBe("");
  });
});

describe("getProductImageSrc", () => {
  it("returns null for a missing URL", () => {
    expect(getProductImageSrc(null)).toBeNull();
    expect(getProductImageSrc(undefined)).toBeNull();
    expect(getProductImageSrc("")).toBeNull();
  });

  it("passes an https URL through untouched", () => {
    expect(getProductImageSrc("https://cdn.example.com/a.jpg")).toBe(
      "https://cdn.example.com/a.jpg"
    );
  });

  it("passes an http URL through untouched", () => {
    expect(getProductImageSrc("http://cdn.example.com/a.jpg")).toBe(
      "http://cdn.example.com/a.jpg"
    );
  });

  it("rewrites a legacy /products/ path out of the way of the /products/[id] route", () => {
    // Otherwise the image request is captured by the product detail route.
    expect(getProductImageSrc("/products/rack.jpg")).toBe("/images/products/rack.jpg");
  });

  it("leaves any other root-relative path alone", () => {
    expect(getProductImageSrc("/images/hero.jpg")).toBe("/images/hero.jpg");
  });

  it("does not rewrite a remote URL that merely contains /products/", () => {
    expect(getProductImageSrc("https://cdn.example.com/products/rack.jpg")).toBe(
      "https://cdn.example.com/products/rack.jpg"
    );
  });

  it("rewrites only the leading occurrence", () => {
    expect(getProductImageSrc("/products/a/products/b.jpg")).toBe(
      "/images/products/a/products/b.jpg"
    );
  });
});

describe("getErrorMessage", () => {
  it("prefers a real Error's message", () => {
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("falls back when the Error has an empty message", () => {
    expect(getErrorMessage(new Error(""), "fallback")).toBe("fallback");
  });

  it("accepts a thrown string", () => {
    expect(getErrorMessage("plain failure", "fallback")).toBe("plain failure");
  });

  it("falls back for an empty thrown string", () => {
    expect(getErrorMessage("", "fallback")).toBe("fallback");
  });

  it("reads message off a plain rejection object", () => {
    // Some libraries reject with { message } rather than an Error.
    expect(getErrorMessage({ message: "api said no" }, "fallback")).toBe("api said no");
  });

  it("falls back when the object's message is not a string", () => {
    expect(getErrorMessage({ message: 42 }, "fallback")).toBe("fallback");
  });

  it("falls back when the object's message is empty", () => {
    expect(getErrorMessage({ message: "" }, "fallback")).toBe("fallback");
  });

  it("falls back for null, undefined and numbers", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
    expect(getErrorMessage(500, "fallback")).toBe("fallback");
  });

  it("falls back for an object with no message at all", () => {
    expect(getErrorMessage({ status: 500 }, "fallback")).toBe("fallback");
  });

  it("keeps the message of an Error subclass", () => {
    class ApiError extends Error {}
    expect(getErrorMessage(new ApiError("not found"), "fallback")).toBe("not found");
  });
});
