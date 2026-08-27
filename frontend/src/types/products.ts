export interface ProductImage {
    id: number;
    imageUrl: string;
    altText?: string | null;
    isPrimary: boolean;
    sortOrder: number;
}

export interface ProductAttribute {
    /** Absent until the row is persisted, so optional on create/edit forms. */
    id?: number;
    attrKey: string;
    attrValue: string;
}

/** One vehicle-fitment row. `id` is absent until persisted. */
export interface VehicleFitment {
    id?: number;
    make: string;
    model: string;
    yearFrom: number;
    yearTo?: number | null;
    bodyType?: string | null;
    engineType?: string | null;
    notes?: string | null;
}

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
    images?: ProductImage[];
    attributes?: ProductAttribute[];
    compatibleWith?: VehicleFitment[];
    createdAt: string;
    updatedAt: string;
    vendorId?: number | null;
}