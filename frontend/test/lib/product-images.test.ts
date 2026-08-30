import { describe, it, expect } from "vitest";
import {
  MAX_PRODUCT_IMAGES,
  galleryFromProduct,
  normaliseProductImages,
  primaryImageUrl,
} from "@/lib/product-images";
import type { ProductImageDraft } from "@/types/products";

const img = (
  imageUrl: string,
  over: Partial<ProductImageDraft> = {}
): ProductImageDraft => ({
  imageUrl,
  altText: null,
  isPrimary: false,
  sortOrder: 0,
  ...over,
});

describe("normaliseProductImages", () => {
  it("numbers sortOrder by position so the array order is the display order", () => {
    const out = normaliseProductImages([img("/a.jpg"), img("/b.jpg"), img("/c.jpg")]);

    expect(out.map((i) => i.sortOrder)).toEqual([0, 1, 2]);
  });

  it("renumbers after a reorder rather than keeping the old positions", () => {
    const out = normaliseProductImages([
      img("/c.jpg", { sortOrder: 2 }),
      img("/a.jpg", { sortOrder: 0 }),
      img("/b.jpg", { sortOrder: 1 }),
    ]);

    expect(out.map((i) => [i.imageUrl, i.sortOrder])).toEqual([
      ["/c.jpg", 0],
      ["/a.jpg", 1],
      ["/b.jpg", 2],
    ]);
  });

  it("promotes the first image when none is marked primary", () => {
    const out = normaliseProductImages([img("/a.jpg"), img("/b.jpg")]);

    expect(out.map((i) => i.isPrimary)).toEqual([true, false]);
  });

  it("keeps exactly one primary when several are marked", () => {
    const out = normaliseProductImages([
      img("/a.jpg"),
      img("/b.jpg", { isPrimary: true }),
      img("/c.jpg", { isPrimary: true }),
    ]);

    expect(out.map((i) => i.isPrimary)).toEqual([false, true, false]);
  });

  it("respects an explicit primary that is not the first image", () => {
    const out = normaliseProductImages([img("/a.jpg"), img("/b.jpg", { isPrimary: true })]);

    expect(out.map((i) => i.isPrimary)).toEqual([false, true]);
  });

  it("lets the primary follow its image through a reorder", () => {
    const gallery = normaliseProductImages([
      img("/a.jpg"),
      img("/b.jpg", { isPrimary: true }),
    ]);
    // Swap the two, as the move-earlier button does.
    const swapped = normaliseProductImages([gallery[1], gallery[0]]);

    expect(swapped[0].imageUrl).toBe("/b.jpg");
    expect(swapped.map((i) => i.isPrimary)).toEqual([true, false]);
  });

  it("promotes the next image when the primary one is removed", () => {
    const gallery = normaliseProductImages([img("/a.jpg"), img("/b.jpg"), img("/c.jpg")]);
    const afterRemoval = normaliseProductImages(gallery.filter((i) => i.imageUrl !== "/a.jpg"));

    expect(afterRemoval.map((i) => [i.imageUrl, i.isPrimary])).toEqual([
      ["/b.jpg", true],
      ["/c.jpg", false],
    ]);
  });

  it("preserves alt text and any persisted id", () => {
    const out = normaliseProductImages([img("/a.jpg", { id: 4, altText: "Front view" })]);

    expect(out[0]).toMatchObject({ id: 4, altText: "Front view" });
  });

  it("returns an empty gallery unchanged", () => {
    expect(normaliseProductImages([])).toEqual([]);
  });
});

describe("primaryImageUrl", () => {
  it("returns the image flagged primary", () => {
    expect(primaryImageUrl([img("/a.jpg"), img("/b.jpg", { isPrimary: true })])).toBe("/b.jpg");
  });

  it("falls back to the first image when none is flagged", () => {
    expect(primaryImageUrl([img("/a.jpg"), img("/b.jpg")])).toBe("/a.jpg");
  });

  it("returns an empty string for an empty gallery rather than undefined", () => {
    expect(primaryImageUrl([])).toBe("");
  });
});

describe("galleryFromProduct", () => {
  it("orders an existing gallery by sortOrder", () => {
    const gallery = galleryFromProduct({
      images: [
        img("/c.jpg", { id: 3, sortOrder: 2 }),
        img("/a.jpg", { id: 1, sortOrder: 0, isPrimary: true }),
        img("/b.jpg", { id: 2, sortOrder: 1 }),
      ],
    });

    expect(gallery.map((i) => i.imageUrl)).toEqual(["/a.jpg", "/b.jpg", "/c.jpg"]);
    expect(gallery.map((i) => i.isPrimary)).toEqual([true, false, false]);
  });

  // Products created before galleries existed carry only the legacy field. If
  // this fell through to an empty array, opening and saving such a product
  // would submit `images: []` and delete the one image it had.
  it("falls back to the legacy single ImageURL", () => {
    const gallery = galleryFromProduct({ ImageURL: "/legacy.jpg" });

    expect(gallery).toEqual([
      { imageUrl: "/legacy.jpg", altText: null, isPrimary: true, sortOrder: 0 },
    ]);
  });

  it("prefers a real gallery over the legacy field", () => {
    const gallery = galleryFromProduct({
      images: [img("/real.jpg", { id: 1 })],
      ImageURL: "/legacy.jpg",
    });

    expect(gallery.map((i) => i.imageUrl)).toEqual(["/real.jpg"]);
  });

  it("returns an empty gallery for a product with no images at all", () => {
    expect(galleryFromProduct({})).toEqual([]);
    expect(galleryFromProduct({ images: [], ImageURL: null })).toEqual([]);
  });
});

describe("MAX_PRODUCT_IMAGES", () => {
  // The API rejects a 13th image with a 422, so the editor must cap at the
  // same number or an admin only learns about the limit on save.
  it("matches the cap enforced by createProductSchema", () => {
    expect(MAX_PRODUCT_IMAGES).toBe(12);
  });
});
