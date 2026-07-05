"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponValidateSchema = exports.placeOrderSchema = exports.createProductSchema = exports.loginSchema = exports.registerSchema = exports.validate = void 0;
const zod_1 = require("zod");
/**
 * Factory middleware that validates req.body against a Zod schema.
 * Returns 422 with field-level error messages on failure.
 */
const validate = (schema) => (req, res, next) => {
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
exports.validate = validate;
// ─── Auth Schemas ─────────────────────────────────────────────────────────────
exports.registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required").max(50).trim(),
    lastName: zod_1.z.string().min(1, "Last name is required").max(50).trim(),
    email: zod_1.z.string().email("Invalid email address").toLowerCase().trim(),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters"),
    phone: zod_1.z.string().max(15).optional(),
    isMember: zod_1.z.boolean().optional().default(false),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address").toLowerCase().trim(),
    password: zod_1.z.string().min(1, "Password is required"),
    sessionToken: zod_1.z.string().optional(),
});
// ─── Product Schemas ──────────────────────────────────────────────────────────
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(255),
    description: zod_1.z.string().min(1, "Description is required"),
    shortDescription: zod_1.z.string().max(500).optional(),
    slug: zod_1.z.string().min(1, "Slug is required").max(255),
    price: zod_1.z.number().positive("Price must be positive"),
    compareAtPrice: zod_1.z.number().positive().optional(),
    costPrice: zod_1.z.number().positive().optional(),
    sku: zod_1.z.string().max(100).optional(),
    stockQty: zod_1.z.number().int().min(0).default(0),
    weight: zod_1.z.number().positive().optional(),
    productType: zod_1.z.enum(["part", "merch"]).default("part"),
    isActive: zod_1.z.boolean().optional().default(true),
    isFeatured: zod_1.z.boolean().optional().default(false),
    categoryId: zod_1.z.number().int().positive("Category is required"),
    brandId: zod_1.z.number().int().positive().optional(),
});
// ─── Order Schemas ────────────────────────────────────────────────────────────
const addressSchema = zod_1.z.object({
    label: zod_1.z.string().max(50).optional(),
    addressLine1: zod_1.z.string().min(1, "Address line 1 is required").max(255),
    addressLine2: zod_1.z.string().max(255).optional(),
    city: zod_1.z.string().min(1, "City is required").max(100),
    state: zod_1.z.string().min(1, "State is required").max(100),
    postalCode: zod_1.z
        .string()
        .regex(/^\d{6}$/, "Postal code must be 6 digits"),
    country: zod_1.z.string().max(2).default("IN"),
});
exports.placeOrderSchema = zod_1.z.object({
    address: addressSchema,
    couponCode: zod_1.z.string().max(50).optional(),
    paymentMethod: zod_1.z.enum(["cod", "razorpay"]),
    sessionToken: zod_1.z.string().optional(),
    taxRate: zod_1.z.number().min(0).max(1).optional(),
    shippingCost: zod_1.z.number().min(0).optional(),
});
exports.couponValidateSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Coupon code is required").max(50).toUpperCase(),
    orderAmount: zod_1.z.number().positive("Order amount must be positive"),
});
//# sourceMappingURL=validation.middleware.js.map