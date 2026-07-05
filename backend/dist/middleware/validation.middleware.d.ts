import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
/**
 * Factory middleware that validates req.body against a Zod schema.
 * Returns 422 with field-level error messages on failure.
 */
export declare const validate: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const registerSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    isMember: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    sessionToken: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    shortDescription: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    price: z.ZodNumber;
    compareAtPrice: z.ZodOptional<z.ZodNumber>;
    costPrice: z.ZodOptional<z.ZodNumber>;
    sku: z.ZodOptional<z.ZodString>;
    stockQty: z.ZodDefault<z.ZodNumber>;
    weight: z.ZodOptional<z.ZodNumber>;
    productType: z.ZodDefault<z.ZodEnum<{
        part: "part";
        merch: "merch";
    }>>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isFeatured: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    categoryId: z.ZodNumber;
    brandId: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const placeOrderSchema: z.ZodObject<{
    address: z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        addressLine1: z.ZodString;
        addressLine2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    couponCode: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodEnum<{
        cod: "cod";
        razorpay: "razorpay";
    }>;
    sessionToken: z.ZodOptional<z.ZodString>;
    taxRate: z.ZodOptional<z.ZodNumber>;
    shippingCost: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const couponValidateSchema: z.ZodObject<{
    code: z.ZodString;
    orderAmount: z.ZodNumber;
}, z.core.$strip>;
//# sourceMappingURL=validation.middleware.d.ts.map