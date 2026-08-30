import { describe, it, expect } from "vitest";
import { productFieldLabel } from "@/lib/product-fields";
import { ApiValidationError, getErrorMessage, getFieldErrors } from "@/lib/errors";

describe("productFieldLabel", () => {
  it("labels a plain field", () => {
    expect(productFieldLabel("stockQty")).toBe("Stock Quantity");
  });

  // `categoryId` is the key the API validates, but no such label exists in the
  // form — the admin sees a "Category" dropdown.
  it("maps the id-shaped keys onto the control the admin actually sees", () => {
    expect(productFieldLabel("categoryId")).toBe("Category");
    expect(productFieldLabel("brandId")).toBe("Brand");
  });

  it("labels both image fields as the gallery", () => {
    expect(productFieldLabel("ImageURL")).toBe("Product Images");
    expect(productFieldLabel("images")).toBe("Product Images");
  });

  // Zod joins nested paths with dots, so a bad URL on the third image arrives
  // as `images.2.imageUrl`.
  it("labels a nested path by its root segment", () => {
    expect(productFieldLabel("images.2.imageUrl")).toBe("Product Images");
    expect(productFieldLabel("compatibleWith.1.make")).toBe("Vehicle Compatibility");
    expect(productFieldLabel("attributes.0.attrKey")).toBe("Specifications");
  });

  it("falls back to the raw path for an unrecognised key", () => {
    expect(productFieldLabel("somethingNew")).toBe("somethingNew");
    expect(productFieldLabel("somethingNew.0.bit")).toBe("somethingNew.0.bit");
  });

  it("does not blow up on an empty field name", () => {
    expect(productFieldLabel("")).toBe("Product");
  });
});

describe("ApiValidationError", () => {
  const fieldErrors = [
    { field: "price", message: "Price must be positive" },
    { field: "categoryId", message: "Category is required" },
  ];

  it("is an Error, so existing catch blocks still work", () => {
    const err = new ApiValidationError(fieldErrors, "Validation failed");

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiValidationError);
    expect(err.name).toBe("ApiValidationError");
  });

  // Callers that only render getErrorMessage() must not regress to the API's
  // bare "Validation failed" now that the field list exists.
  it("uses the first field message as its message", () => {
    const err = new ApiValidationError(fieldErrors, "Validation failed");

    expect(err.message).toBe("Price must be positive");
    expect(getErrorMessage(err, "fallback")).toBe("Price must be positive");
  });

  it("falls back to the supplied message when there are no field errors", () => {
    expect(new ApiValidationError([], "Validation failed").message).toBe("Validation failed");
  });

  it("carries every field error, not just the first", () => {
    expect(new ApiValidationError(fieldErrors, "x").fieldErrors).toEqual(fieldErrors);
  });
});

describe("getFieldErrors", () => {
  it("returns the list from a validation error", () => {
    const fieldErrors = [{ field: "sku", message: "Too long" }];

    expect(getFieldErrors(new ApiValidationError(fieldErrors, "x"))).toEqual(fieldErrors);
  });

  it("returns an empty list for an ordinary error", () => {
    expect(getFieldErrors(new Error("network down"))).toEqual([]);
  });

  it("returns an empty list for a non-error value", () => {
    expect(getFieldErrors("nope")).toEqual([]);
    expect(getFieldErrors(null)).toEqual([]);
    expect(getFieldErrors(undefined)).toEqual([]);
  });
});
