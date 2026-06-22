export interface Product {
    id: number;
    name: string;
    description: string;
    shortDescription?: string | null;
    slug?: string;
    price: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
    sku?: string | null;
    stockQty?: number;
    weight?: number | null;
    productType?: "part" | "merch";
    isActive?: boolean;
    isFeatured?: boolean;
    category: string;
    subCategory?: string | null;
    ImageURL?: string | null;
    brand?: string | null;
    compatibleWith?: Array<{
        id?: number;
        make: string;
        model: string;
        yearFrom: number;
        yearTo?: number | null;
        bodyType?: string | null;
        engineType?: string | null;
        notes?: string | null;
    }>;
    createdAt: string;
    updatedAt: string;
}