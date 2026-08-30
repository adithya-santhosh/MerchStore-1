/**
 * Human labels for the product payload keys the API validates, so a 422 reads
 * as "Category — Category is required" rather than naming `categoryId`, which
 * is a key the admin never sees anywhere in the form.
 */
const PRODUCT_FIELD_LABELS: Record<string, string> = {
  name: "Product Name",
  slug: "Slug",
  description: "Description",
  shortDescription: "Short Description",
  price: "Price",
  compareAtPrice: "Compare-at Price",
  costPrice: "Cost Price",
  sku: "SKU",
  stockQty: "Stock Quantity",
  weight: "Weight",
  productType: "Product Type",
  isActive: "Active",
  isFeatured: "Featured",
  categoryId: "Category",
  category: "Category",
  subCategory: "Sub-category",
  brandId: "Brand",
  brand: "Brand",
  vendorId: "Vendor",
  ImageURL: "Product Images",
  images: "Product Images",
  attributes: "Specifications",
  compatibleWith: "Vehicle Compatibility",
};

/**
 * Zod reports nested paths — `images.0.imageUrl`, `compatibleWith.1.make` — so
 * label by the root segment. An unrecognised key falls back to its raw path,
 * which is still far more use to the admin than hiding the error.
 */
export function productFieldLabel(field: string): string {
  if (!field) return "Product";
  const root = field.split(".")[0];
  return PRODUCT_FIELD_LABELS[root] ?? field;
}
