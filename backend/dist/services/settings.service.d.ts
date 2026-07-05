export declare const getSettings: () => Promise<{
    tax_rate: number;
    shipping_limit: number;
    shipping_cost: number;
    membership_fee: number;
}>;
export declare const updateSettings: (data: Record<string, any>) => Promise<{
    tax_rate: number;
    shipping_limit: number;
    shipping_cost: number;
    membership_fee: number;
}>;
//# sourceMappingURL=settings.service.d.ts.map