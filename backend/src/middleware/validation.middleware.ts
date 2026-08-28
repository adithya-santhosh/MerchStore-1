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

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().max(500).optional(),
  slug: z.string().min(1, "Slug is required").max(255),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  sku: z.string().max(100).optional(),
  stockQty: z.number().int().min(0).default(0),
  weight: z.number().positive().optional(),
  productType: z.enum(["part", "merch"]).default("part"),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  categoryId: z.number().int().positive("Category is required"),
  brandId: z.number().int().positive().optional(),
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
