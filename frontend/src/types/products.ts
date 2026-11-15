export interface ProductImage {
    id: number;
    imageUrl: string;
    altText?: string | null;
    isPrimary: boolean;
    sortOrder: number;
}

/** A gallery row being edited in the admin. `id` is absent until persisted. */
export interface ProductImageDraft {
    id?: number;
    imageUrl: string;
    altText?: string | null;
    isPrimary: boolean;
    sortOrder: number;
}

export interface Brand {
    id: number;
    name: string;
    slug: string;
    logoUrl?: string | null;
    description?: string | null;
    isActive?: boolean;
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
    // The backend always includes this as the full Prisma relation (`brand: true`
    // on every product query), never a bare string — see product.service.ts.
    brand?: Brand | null;
    images?: ProductImage[];
    attributes?: ProductAttribute[];
    compatibleWith?: VehicleFitment[];
    createdAt: string;
    updatedAt: string;
    vendorId?: number | null;
}

/**
 * What the admin forms POST/PUT. It differs from `Product` in that gallery rows
 * may not be persisted yet, so they carry no `id` — and brand is a plain name
 * string here, not the relation object `Product` reads back: the backend looks
 * up or creates a `Brand` row from that string server-side (see
 * product.service.ts), it doesn't accept the relation shape on write.
 */
export type ProductWritePayload = Omit<
    Product,
    "id" | "createdAt" | "updatedAt" | "images" | "brand"
> & {
    images?: ProductImageDraft[];
    brand?: string;
};
