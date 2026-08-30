import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

/**
 * Factory middleware that validates req.body against a Zod schema.
 * Returns 422 with field-level error messages on failure.
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(422).json({ message: "Validation failed", errors });
    }
    req.body = result.data; // use the sanitized/coerced data
    next();
  };

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  phone: z.string().max(15).optional(),
  isMember: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
  sessionToken: z.string().optional().nullable(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

// ─── Product Schemas ──────────────────────────────────────────────────────────

// Cloudinary hands back an absolute https URL, but legacy rows (and the seed)
// still carry root-relative paths like `/products/foo.jpg`, which
// `getProductImageSrc` rewrites on the storefront. Accept both; reject anything
// else so a `javascript:` or `data:` URL can never reach an <img src>.
const imageUrlSchema = z
  .string()
  .min(1, "Image URL is required")
  .max(2048)
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/"), {
    message: "Image URL must be an absolute http(s) URL or a root-relative path",
  });

// An image arrives either as a bare URL (bulk/legacy callers) or as a full row.
const productImageSchema = z.union([
  imageUrlSchema,
  z.object({
    imageUrl: imageUrlSchema,
    altText: z.string().max(255).nullish(),
    isPrimary: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
]);

const productAttributeSchema = z.object({
  attrKey: z.string().min(1, "Attribute name is required").max(100),
  attrValue: z.string().min(1, "Attribute value is required").max(255),
});

const vehicleFitmentSchema = z.object({
  make: z.string().min(1, "Vehicle make is required").max(100),
  model: z.string().min(1, "Vehicle model is required").max(100),
  yearFrom: z.coerce.number().int().min(1900).max(2200),
  yearTo: z.coerce.number().int().min(1900).max(2200).nullish(),
  bodyType: z.string().max(50).nullish(),
  engineType: z.string().max(50).nullish(),
  notes: z.string().max(500).nullish(),
});

// Two rules govern these fields, and breaking either one fails silently:
//
//  1. Zod strips unknown keys, so ANY field the service consumes must be listed
//     here or it never reaches the service. `images`, `category`, `brand`,
//     `attributes` and `compatibleWith` were all absent, which meant the admin
//     form's Cloudinary URL was discarded on every create.
//
//  2. The admin form sends `null` (not `undefined`) for optional fields the
//     user left blank, so optional scalars are `.nullish()`. Plain `.optional()`
//     rejected a blank SKU or weight and failed the whole request with a 422.
//
// Category and brand may arrive as a NAME — what the admin form posts, resolved
// or created by the service — or as an id, which API clients post.
//
// This stays a plain object rather than folding the create-only `.refine()` in
// directly, because `.refine()` returns a ZodEffects, which has no `.partial()`
// for the update schema below to build on.
const productFieldsSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().max(500).nullish(),
  slug: z.string().min(1, "Slug is required").max(255),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().nullish(),
  costPrice: z.number().positive().nullish(),
  sku: z.string().max(100).nullish(),
  stockQty: z.number().int().min(0).default(0),
  weight: z.number().positive().nullish(),
  productType: z.enum(["part", "merch"]).default("part"),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),

  categoryId: z.number().int().positive().optional(),
  category: z.string().max(255).nullish(),
  subCategory: z.string().max(255).nullish(),

  brandId: z.number().int().positive().optional(),
  brand: z.string().max(255).nullish(),

  vendorId: z.number().int().positive().nullish(),

  /** Legacy single-image field. `images` wins when both are sent. */
  ImageURL: imageUrlSchema.nullish(),
  images: z
    .array(productImageSchema)
    .max(12, "A product can have at most 12 images")
    .optional(),

  attributes: z.array(productAttributeSchema).optional(),
  compatibleWith: z.array(vehicleFitmentSchema).optional(),
});

export const createProductSchema = productFieldsSchema.refine(
  (d) =>
    d.categoryId !== undefined ||
    (typeof d.category === "string" && d.category.trim() !== ""),
  { message: "Category is required", path: ["categoryId"] }
);

// Every field is optional on update: the edit form posts only the subset it
// manages — it never sends a slug, for one — so a create-shaped schema would
// reject an ordinary edit outright.
//
// The four overrides below are load-bearing, and repeat the lesson already
// recorded on `updateCouponSchema`: `.partial()` makes a key optional but does
// NOT drop its `.default()`, and `updateProduct` passes every key that isn't
// `undefined` to Prisma. Without these, editing nothing but a product's price
// would ALSO reset its stock to 0, flip a "merch" item to "part", reactivate a
// deactivated product and clear its featured flag — silently, on every save.
//
// No category refinement here: leaving the category alone is a normal edit.
export const updateProductSchema = productFieldsSchema.partial().extend({
  stockQty: z.number().int().min(0).optional(),
  productType: z.enum(["part", "merch"]).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

// ─── Order Schemas ────────────────────────────────────────────────────────────

const addressSchema = z.object({
  label: z.string().max(50).optional(),
  addressLine1: z.string().min(1, "Address line 1 is required").max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, "Postal code must be 6 digits"),
  country: z.string().max(2).default("IN"),
});

// taxRate/shippingCost are intentionally absent — they are derived server-side
// from system settings, so any values a client sends are ignored (Zod strips
// unknown keys) rather than trusted.
export const placeOrderSchema = z.object({
  address: addressSchema,
  couponCode: z.string().max(50).optional(),
  paymentMethod: z.enum(["cod", "razorpay"]),
  sessionToken: z.string().optional(),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(50).toUpperCase(),
  orderAmount: z.number().positive("Order amount must be positive"),
});

// ─── Coupon CRUD Schemas ──────────────────────────────────────────────────────

export const createCouponSchema = z.object({
  code: z.string().min(1, "Code is required").max(50).toUpperCase().trim(),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive("Discount value must be positive"),
  minOrderAmount: z.number().nonnegative().optional(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

// `.partial()` makes every field optional but does NOT drop their defaults, so
// isActive's `.default(true)` was still injected into every partial update —
// and updateCoupon writes any key that isn't `undefined`. An admin editing a
// coupon's value silently switched a deactivated coupon back on. Overriding it
// with a plain optional boolean restores "not sent" meaning "leave unchanged".
export const updateCouponSchema = createCouponSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

// ─── Profile Update Schema ────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
  phone: z
    .string()
    .regex(/^[+]?[\d\s\-().]{7,15}$/, "Invalid phone number format")
    .optional()
    .nullable(),
});
