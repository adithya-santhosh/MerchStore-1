import type { ProductImageDraft } from "@/types/products";

/** Kept in step with the `images` cap in the API's `createProductSchema`. */
export const MAX_PRODUCT_IMAGES = 12;

/**
 * Re-derive `sortOrder` from array position and guarantee exactly one primary.
 *
 * The service applies the same rule when it writes the rows, so mirroring it in
 * the admin editor keeps the two from disagreeing until a product is saved and
 * reloaded. The rule matters because `mapProduct` and the storefront gallery
 * both resolve the hero image as `find(isPrimary) || images[0]`, where
 * `images[0]` is database return order rather than display order — so a gallery
 * with no primary shows an arbitrary hero.
 */
export const normaliseProductImages = (
  images: ProductImageDraft[]
): ProductImageDraft[] => {
  const primaryIdx = images.findIndex((img) => img.isPrimary);
  return images.map((img, idx) => ({
    ...img,
    sortOrder: idx,
    isPrimary: idx === (primaryIdx === -1 ? 0 : primaryIdx),
  }));
};

/**
 * The hero image the storefront will show for this gallery, following the same
 * `find(isPrimary) || images[0]` rule the server uses.
 */
export const primaryImageUrl = (images: ProductImageDraft[]): string =>
  images.find((img) => img.isPrimary)?.imageUrl ?? images[0]?.imageUrl ?? "";

/**
 * Build the gallery an edit form starts from. Products created before galleries
 * existed carry only the legacy single `ImageURL`; without that fallback an
 * untouched save would submit an empty `images` array and wipe the one image
 * the product had.
 */
export const galleryFromProduct = (product: {
  images?: ProductImageDraft[];
  ImageURL?: string | null;
}): ProductImageDraft[] => {
  if (product.images && product.images.length > 0) {
    return normaliseProductImages(
      [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)
    );
  }
  return product.ImageURL
    ? [{ imageUrl: product.ImageURL, altText: null, isPrimary: true, sortOrder: 0 }]
    : [];
};
