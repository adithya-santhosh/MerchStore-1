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
  sessionToken: z.string().optional(),
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

export const placeOrderSchema = z.object({
  address: addressSchema,
  couponCode: z.string().max(50).optional(),
  paymentMethod: z.enum(["cod", "razorpay"]),
  sessionToken: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  shippingCost: z.number().min(0).optional(),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(50).toUpperCase(),
  orderAmount: z.number().positive("Order amount must be positive"),
});
