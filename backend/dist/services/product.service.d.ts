export declare const getAllProducts: (categoryQuery?: string, subCategoryQuery?: string, vehicleQuery?: string, brandQuery?: string) => Promise<any[]>;
export declare const getProductById: (id: number) => Promise<any>;
export declare const createProduct: (data: any) => Promise<any>;
export declare const deleteProduct: (id: number) => Promise<{
    id: number;
    name: string;
    description: string;
    shortDescription: string | null;
    slug: string;
    price: import("@prisma/client-runtime-utils").Decimal;
    compareAtPrice: import("@prisma/client-runtime-utils").Decimal | null;
    costPrice: import("@prisma/client-runtime-utils").Decimal | null;
    sku: string | null;
    stockQty: number;
    weight: number | null;
    productType: string;
    isActive: boolean;
    isFeatured: boolean;
    categoryId: number;
    brandId: number | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const updateProduct: (id: number, data: any) => Promise<any>;
export declare const subCategories: (categorySlugOrName: string) => Promise<string[]>;
export declare const getNavigationMetadata: () => Promise<{
    categories: ({
        children: {
            id: number;
            name: string;
            description: string | null;
            slug: string;
            isActive: boolean;
            createdAt: Date;
            imageUrl: string | null;
            sortOrder: number;
            parentId: number | null;
        }[];
    } & {
        id: number;
        name: string;
        description: string | null;
        slug: string;
        isActive: boolean;
        createdAt: Date;
        imageUrl: string | null;
        sortOrder: number;
        parentId: number | null;
    })[];
    brands: {
        id: number;
        name: string;
        description: string | null;
        slug: string;
        isActive: boolean;
        logoUrl: string | null;
    }[];
    vehicles: {
        id: number;
        make: string;
        model: string;
        yearFrom: number;
        yearTo: number | null;
        bodyType: string | null;
        engineType: string | null;
    }[];
}>;
export declare const getProductsAdmin: (params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    stock?: string;
    sortBy?: string;
    sortOrder?: string;
}) => Promise<{
    products: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare const getProductStats: () => Promise<{
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    outOfStock: number;
    lowStock: number;
}>;
export declare const bulkUpdateProducts: (ids: number[], action: "activate" | "deactivate" | "delete") => Promise<{
    affected: number;
    action: "delete";
} | {
    affected: number;
    action: "activate" | "deactivate";
}>;
//# sourceMappingURL=product.service.d.ts.map