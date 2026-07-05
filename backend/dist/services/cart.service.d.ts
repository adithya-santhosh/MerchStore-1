export declare const getOrCreateCart: (sessionToken?: string, userId?: number) => Promise<{
    id: any;
    sessionToken: any;
    userId: any;
    createdAt: any;
    updatedAt: any;
    items: any;
} | null>;
export declare const addItemToCart: (sessionToken: string | undefined, userId: number | undefined, productId: number, quantity: number, relative?: boolean) => Promise<{
    id: any;
    sessionToken: any;
    userId: any;
    createdAt: any;
    updatedAt: any;
    items: any;
} | null>;
export declare const removeItemFromCart: (sessionToken: string | undefined, userId: number | undefined, productId: number) => Promise<{
    id: any;
    sessionToken: any;
    userId: any;
    createdAt: any;
    updatedAt: any;
    items: any;
} | null>;
//# sourceMappingURL=cart.service.d.ts.map