export declare const getAllCoupons: () => Promise<any[]>;
export declare const createCoupon: (data: any) => Promise<{
    value: number;
    minOrderAmount: number | null;
    id: number;
    isActive: boolean;
    code: string;
    type: string;
    maxUses: number | null;
    usedCount: number;
    expiresAt: Date | null;
}>;
export declare const updateCoupon: (id: number, data: any) => Promise<{
    value: number;
    minOrderAmount: number | null;
    id: number;
    isActive: boolean;
    code: string;
    type: string;
    maxUses: number | null;
    usedCount: number;
    expiresAt: Date | null;
}>;
export declare const deleteCoupon: (id: number) => Promise<{
    id: number;
    isActive: boolean;
    value: import("@prisma/client-runtime-utils").Decimal;
    code: string;
    type: string;
    minOrderAmount: import("@prisma/client-runtime-utils").Decimal | null;
    maxUses: number | null;
    usedCount: number;
    expiresAt: Date | null;
}>;
export declare const validateCoupon: (code: string, orderAmount: number) => Promise<{
    id: number;
    code: string;
    type: string;
    value: number;
}>;
//# sourceMappingURL=coupon.service.d.ts.map