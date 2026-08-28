import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    category: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    brand: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    vehicle: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    productVehicle: { upsert: vi.fn(), deleteMany: vi.fn() },
    productAttribute: { deleteMany: vi.fn() },
    productImage: { deleteMany: vi.fn() },
    cartItem: { deleteMany: vi.fn() },
    wishlistItem: { deleteMany: vi.fn() },
  },
}));

import prisma from "../../src/lib/prisma";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  subCategories,
  getNavigationMetadata,
  searchProducts,
  getProductsAdmin,
  getProductStats,
  bulkUpdateProducts,
} from "../../src/services/product.service";

const mockedPrisma = vi.mocked(prisma, true);

const productRow = (over: Record<string, any> = {}) => ({
  id: 10,
  name: "Roof Rack",
  slug: "roof-rack",
  price: "14999.00",
  compareAtPrice: "17999.00",
  costPrice: "9000.00",
  stockQty: 7,
  isActive: true,
  productType: "part",
  category: { id: 2, name: "Storage & Racks", parent: null },
  brand: { id: 1, name: "ARB" },
  images: [],
  attributes: [],
  compatibleWith: [],
  ...over,
});

/** Stubs the three aggregate reads searchProducts fires for the filter sidebar. */
const stubSearchAggregates = () => {
  mockedPrisma.brand.findMany.mockResolvedValue([] as any);
  mockedPrisma.category.findMany.mockResolvedValue([] as any);
  mockedPrisma.product.aggregate.mockResolvedValue({
    _min: { price: "500" },
    _max: { price: "50000" },
  } as any);
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getAllProducts ───────────────────────────────────────────────────────────

describe("getAllProducts", () => {
  it("returns every product when no filter is applied", async () => {
    mockedPrisma.product.findMany.mockResolvedValue([productRow()] as any);

    const products = await getAllProducts();

    expect(products).toHaveLength(1);
    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where).toEqual({});
  });

  it("returns nothing for a category that does not exist, rather than everything", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue(null as any);

    const products = await getAllProducts("no-such-category");

    // Falling through to an unfiltered query would show the whole catalogue on
    // a mistyped category URL.
    expect(products).toEqual([]);
    expect(mockedPrisma.product.findMany).not.toHaveBeenCalled();
  });

  it("returns nothing for a sub-category that does not exist", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue(null as any);

    expect(await getAllProducts(undefined, "no-such-subcategory")).toEqual([]);
    expect(mockedPrisma.product.findMany).not.toHaveBeenCalled();
  });

  it("includes the children of a parent category so the department page isn't empty", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue({
      id: 1,
      children: [{ id: 2 }, { id: 3 }],
    } as any);
    mockedPrisma.product.findMany.mockResolvedValue([] as any);

    await getAllProducts("car-accessories");

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.categoryId).toEqual({ in: [1, 2, 3] });
  });

  it("narrows to the single category when a sub-category is named", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue({ id: 5 } as any);
    mockedPrisma.product.findMany.mockResolvedValue([] as any);

    await getAllProducts("car-accessories", "storage-racks");

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.categoryId).toBe(5);
  });

  it("matches a brand by slug or name, case-insensitively", async () => {
    mockedPrisma.product.findMany.mockResolvedValue([] as any);

    await getAllProducts(undefined, undefined, undefined, "arb");

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.brand.OR).toEqual([
      { slug: { equals: "arb", mode: "insensitive" } },
      { name: { equals: "arb", mode: "insensitive" } },
    ]);
  });

  it("matches a vehicle by make or model through the compatibility table", async () => {
    mockedPrisma.product.findMany.mockResolvedValue([] as any);

    await getAllProducts(undefined, undefined, "Thar");

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.compatibleWith.some.vehicle.OR).toEqual([
      { model: { equals: "Thar", mode: "insensitive" } },
      { make: { equals: "Thar", mode: "insensitive" } },
    ]);
  });

  it("combines brand and vehicle filters instead of letting one replace the other", async () => {
    mockedPrisma.product.findMany.mockResolvedValue([] as any);

    await getAllProducts(undefined, undefined, "Thar", "arb");

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.brand).toBeDefined();
    expect(where.compatibleWith).toBeDefined();
  });
});

// ─── mapProduct, exercised through getProductById ─────────────────────────────

describe("product mapping", () => {
  it("returns null for a product that does not exist", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(null as any);

    expect(await getProductById(999)).toBeNull();
  });

  it("reports a top-level category with no sub-category", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(productRow() as any);

    const product = await getProductById(10);

    expect(product.category).toBe("Storage & Racks");
    expect(product.subCategory).toBeNull();
  });

  it("splits a child category into department plus sub-category", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(
      productRow({
        category: { id: 3, name: "Roof Racks", parent: { id: 2, name: "Storage & Racks" } },
      }) as any
    );

    const product = await getProductById(10);

    expect(product.category).toBe("Storage & Racks");
    expect(product.subCategory).toBe("Roof Racks");
  });

  it("falls back to an empty category name when the product has none", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(productRow({ category: null }) as any);

    const product = await getProductById(10);

    expect(product.category).toBe("");
  });

  it("converts every money column to a number", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(productRow() as any);

    const product = await getProductById(10);

    expect(product.price).toBe(14999);
    expect(product.compareAtPrice).toBe(17999);
    expect(product.costPrice).toBe(9000);
  });

  it("reports a price of 0 rather than null when none is set", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(productRow({ price: null }) as any);

    const product = await getProductById(10);

    expect(product.price).toBe(0);
  });

  it("keeps an absent compareAtPrice as null so no fake discount is shown", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(
      productRow({ compareAtPrice: null }) as any
    );

    const product = await getProductById(10);

    expect(product.compareAtPrice).toBeNull();
  });

  it("prefers the primary image", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(
      productRow({
        images: [
          { imageUrl: "/alt.jpg", isPrimary: false },
          { imageUrl: "/hero.jpg", isPrimary: true },
        ],
      }) as any
    );

    const product = await getProductById(10);

    expect(product.ImageURL).toBe("/hero.jpg");
  });

  it("falls back to the first image when none is primary", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(
      productRow({ images: [{ imageUrl: "/only.jpg", isPrimary: false }] }) as any
    );

    expect((await getProductById(10)).ImageURL).toBe("/only.jpg");
  });

  it("flattens vehicle compatibility into a plain list", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(
      productRow({
        compatibleWith: [
          {
            notes: "Requires crossbars",
            vehicle: {
              id: 1,
              make: "Mahindra",
              model: "Thar",
              yearFrom: 2020,
              yearTo: null,
              bodyType: "SUV",
              engineType: "Diesel",
            },
          },
        ],
      }) as any
    );

    const product = await getProductById(10);

    expect(product.compatibleWith).toEqual([
      {
        id: 1,
        make: "Mahindra",
        model: "Thar",
        yearFrom: 2020,
        yearTo: null,
        bodyType: "SUV",
        engineType: "Diesel",
        notes: "Requires crossbars",
      },
    ]);
  });

  it("returns an empty compatibility list rather than undefined", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(
      productRow({ compatibleWith: undefined }) as any
    );

    expect((await getProductById(10)).compatibleWith).toEqual([]);
  });
});

// ─── createProduct ────────────────────────────────────────────────────────────

describe("createProduct", () => {
  const stubCreate = () => {
    mockedPrisma.product.create.mockResolvedValue({ id: 10 } as any);
    mockedPrisma.product.findUnique.mockResolvedValue(productRow() as any);
  };

  it("reuses an existing brand rather than creating a duplicate", async () => {
    stubCreate();
    mockedPrisma.brand.findUnique.mockResolvedValue({ id: 4 } as any);

    await createProduct({ name: "Roof Rack", brand: " ARB " });

    expect(mockedPrisma.brand.create).not.toHaveBeenCalled();
    const data = (mockedPrisma.product.create.mock.calls[0]?.[0] as any).data;
    expect(data.brandId).toBe(4);
  });

  it("creates an unknown brand with a slugified name", async () => {
    stubCreate();
    mockedPrisma.brand.findUnique.mockResolvedValue(null as any);
    mockedPrisma.brand.create.mockResolvedValue({ id: 9 } as any);

    await createProduct({ name: "Roof Rack", brand: "Rhino Rack!" });

    expect(mockedPrisma.brand.create).toHaveBeenCalledWith({
      data: { name: "Rhino Rack!", slug: "rhino-rack-" },
    });
  });

  it("never passes the raw brand string through to the product row", async () => {
    stubCreate();
    mockedPrisma.brand.findUnique.mockResolvedValue({ id: 4 } as any);

    await createProduct({ name: "Roof Rack", brand: "ARB" });

    const data = (mockedPrisma.product.create.mock.calls[0]?.[0] as any).data;
    expect(data).not.toHaveProperty("brand");
  });

  it("skips the brand lookup when a brandId is supplied", async () => {
    stubCreate();

    await createProduct({ name: "Roof Rack", brandId: 4, brand: "Ignored" });

    expect(mockedPrisma.brand.findUnique).not.toHaveBeenCalled();
  });

  it("turns a legacy ImageURL into a primary image row", async () => {
    stubCreate();

    await createProduct({ name: "Roof Rack", ImageURL: "/hero.jpg" });

    const data = (mockedPrisma.product.create.mock.calls[0]?.[0] as any).data;
    expect(data.images.create).toEqual([{ imageUrl: "/hero.jpg", isPrimary: true }]);
    expect(data).not.toHaveProperty("ImageURL");
  });

  it("accepts an images array of bare URL strings", async () => {
    stubCreate();

    await createProduct({ name: "Roof Rack", images: ["/a.jpg", "/b.jpg"] });

    const data = (mockedPrisma.product.create.mock.calls[0]?.[0] as any).data;
    expect(data.images.create).toEqual([{ imageUrl: "/a.jpg" }, { imageUrl: "/b.jpg" }]);
  });

  it("defaults an image object's flags rather than storing undefined", async () => {
    stubCreate();

    await createProduct({ name: "Roof Rack", images: [{ imageUrl: "/a.jpg" }] });

    const data = (mockedPrisma.product.create.mock.calls[0]?.[0] as any).data;
    expect(data.images.create[0]).toMatchObject({ isPrimary: false, sortOrder: 0 });
  });

  it("creates a missing category on the fly from its name", async () => {
    stubCreate();
    mockedPrisma.category.findFirst.mockResolvedValue(null as any);
    mockedPrisma.category.create.mockResolvedValue({ id: 12 } as any);

    await createProduct({ name: "Roof Rack", category: "Camping & Overland" });

    expect(mockedPrisma.category.create).toHaveBeenCalledWith({
      data: { name: "Camping & Overland", slug: "camping-overland" },
    });
    const data = (mockedPrisma.product.create.mock.calls[0]?.[0] as any).data;
    expect(data.categoryId).toBe(12);
  });

  it("files a sub-category under its parent and points the product at the child", async () => {
    stubCreate();
    mockedPrisma.category.findFirst
      .mockResolvedValueOnce({ id: 2 } as any) // parent found
      .mockResolvedValueOnce(null as any);      // child missing
    mockedPrisma.category.create.mockResolvedValue({ id: 33 } as any);

    await createProduct({ name: "Roof Rack", category: "Storage", subCategory: "Roof Racks" });

    expect(mockedPrisma.category.create).toHaveBeenCalledWith({
      data: { name: "Roof Racks", slug: "roof-racks", parentId: 2 },
    });
    const data = (mockedPrisma.product.create.mock.calls[0]?.[0] as any).data;
    expect(data.categoryId).toBe(33);
  });

  it("stores technical specifications as attribute rows", async () => {
    stubCreate();

    await createProduct({
      name: "Roof Rack",
      attributes: [{ attrKey: "Load", attrValue: "75 kg" }],
    });

    const data = (mockedPrisma.product.create.mock.calls[0]?.[0] as any).data;
    expect(data.attributes.create).toEqual([{ attrKey: "Load", attrValue: "75 kg" }]);
  });

  it("reuses a matching vehicle instead of duplicating it", async () => {
    stubCreate();
    mockedPrisma.vehicle.findFirst.mockResolvedValue({ id: 5 } as any);

    await createProduct({
      name: "Roof Rack",
      compatibleWith: [{ make: " Mahindra ", model: " Thar ", yearFrom: "2020" }],
    });

    expect(mockedPrisma.vehicle.create).not.toHaveBeenCalled();
    expect(mockedPrisma.productVehicle.upsert).toHaveBeenCalledOnce();
  });

  it("creates an unseen vehicle with trimmed, numeric fields", async () => {
    stubCreate();
    mockedPrisma.vehicle.findFirst.mockResolvedValue(null as any);
    mockedPrisma.vehicle.create.mockResolvedValue({ id: 6 } as any);

    await createProduct({
      name: "Roof Rack",
      compatibleWith: [{ make: " Mahindra ", model: " Thar ", yearFrom: "2020", yearTo: "" }],
    });

    expect(mockedPrisma.vehicle.create).toHaveBeenCalledWith({
      data: {
        make: "Mahindra",
        model: "Thar",
        yearFrom: 2020,
        yearTo: null,
        bodyType: null,
        engineType: null,
      },
    });
  });

  it("skips a compatibility entry missing its make or model", async () => {
    stubCreate();

    await createProduct({
      name: "Roof Rack",
      compatibleWith: [{ model: "Thar", yearFrom: 2020 }, { make: "Mahindra" }],
    });

    expect(mockedPrisma.vehicle.findFirst).not.toHaveBeenCalled();
    expect(mockedPrisma.productVehicle.upsert).not.toHaveBeenCalled();
  });

  it("keeps the compatibility list off the product row itself", async () => {
    stubCreate();
    mockedPrisma.vehicle.findFirst.mockResolvedValue({ id: 5 } as any);

    await createProduct({
      name: "Roof Rack",
      compatibleWith: [{ make: "Mahindra", model: "Thar", yearFrom: 2020 }],
    });

    const data = (mockedPrisma.product.create.mock.calls[0]?.[0] as any).data;
    expect(data).not.toHaveProperty("compatibleWith");
  });
});

// ─── updateProduct ────────────────────────────────────────────────────────────

describe("updateProduct", () => {
  const stubUpdate = () => {
    mockedPrisma.product.update.mockResolvedValue({ id: 10 } as any);
    mockedPrisma.product.findUnique.mockResolvedValue(productRow() as any);
  };

  it("replaces the gallery rather than appending to it", async () => {
    stubUpdate();

    await updateProduct(10, { images: ["/new.jpg"] });

    expect(mockedPrisma.productImage.deleteMany).toHaveBeenCalledWith({
      where: { productId: 10 },
    });
    const data = (mockedPrisma.product.update.mock.calls[0]?.[0] as any).data;
    expect(data.images.create).toEqual([{ imageUrl: "/new.jpg" }]);
  });

  it("leaves the existing gallery alone when no images are supplied", async () => {
    stubUpdate();

    await updateProduct(10, { name: "Renamed" });

    expect(mockedPrisma.productImage.deleteMany).not.toHaveBeenCalled();
  });

  it("replaces the specification list when attributes are supplied", async () => {
    stubUpdate();

    await updateProduct(10, { attributes: [{ attrKey: "Load", attrValue: "90 kg" }] });

    expect(mockedPrisma.productAttribute.deleteMany).toHaveBeenCalledWith({
      where: { productId: 10 },
    });
  });

  it("clears the old compatibility list on every update", async () => {
    stubUpdate();

    await updateProduct(10, { name: "Renamed" });

    // Otherwise a part stays listed as fitting a vehicle it was just unlinked from.
    expect(mockedPrisma.productVehicle.deleteMany).toHaveBeenCalledWith({
      where: { productId: 10 },
    });
  });

  it("re-links the vehicles supplied with the update", async () => {
    stubUpdate();
    mockedPrisma.vehicle.findFirst.mockResolvedValue({ id: 5 } as any);

    await updateProduct(10, {
      compatibleWith: [{ make: "Mahindra", model: "Thar", yearFrom: 2020, notes: "Fits" }],
    });

    expect(mockedPrisma.productVehicle.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId_vehicleId: { productId: 10, vehicleId: 5 } },
      })
    );
  });

  it("resolves a renamed brand to its id", async () => {
    stubUpdate();
    mockedPrisma.brand.findUnique.mockResolvedValue({ id: 4 } as any);

    await updateProduct(10, { brand: "ARB" });

    const data = (mockedPrisma.product.update.mock.calls[0]?.[0] as any).data;
    expect(data.brandId).toBe(4);
    expect(data).not.toHaveProperty("brand");
  });
});

describe("deleteProduct", () => {
  it("deletes by id", async () => {
    mockedPrisma.product.delete.mockResolvedValue({} as any);

    await deleteProduct(10);

    expect(mockedPrisma.product.delete).toHaveBeenCalledWith({ where: { id: 10 } });
  });
});

// ─── Navigation helpers ───────────────────────────────────────────────────────

describe("subCategories", () => {
  it("returns an empty list for an unknown category", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue(null as any);

    expect(await subCategories("nope")).toEqual([]);
  });

  it("returns the child category names", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue({
      id: 1,
      children: [{ name: "Roof Racks" }, { name: "Cargo Boxes" }],
    } as any);

    expect(await subCategories("storage")).toEqual(["Roof Racks", "Cargo Boxes"]);
  });

  it("matches on either slug or display name", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue({ id: 1, children: [] } as any);

    await subCategories("Storage & Racks");

    const where = (mockedPrisma.category.findFirst.mock.calls[0]?.[0] as any).where;
    expect(where.OR).toEqual([{ slug: "Storage & Racks" }, { name: "Storage & Racks" }]);
  });
});

describe("getNavigationMetadata", () => {
  it("returns only active top-level categories with their active children", async () => {
    mockedPrisma.category.findMany.mockResolvedValue([] as any);
    mockedPrisma.brand.findMany.mockResolvedValue([] as any);
    mockedPrisma.vehicle.findMany.mockResolvedValue([] as any);

    await getNavigationMetadata();

    const call = mockedPrisma.category.findMany.mock.calls[0]?.[0] as any;
    expect(call.where).toEqual({ parentId: null, isActive: true });
    expect(call.include.children.where).toEqual({ isActive: true });
  });

  it("hides deactivated brands from the menu", async () => {
    mockedPrisma.category.findMany.mockResolvedValue([] as any);
    mockedPrisma.brand.findMany.mockResolvedValue([] as any);
    mockedPrisma.vehicle.findMany.mockResolvedValue([] as any);

    await getNavigationMetadata();

    const call = mockedPrisma.brand.findMany.mock.calls[0]?.[0] as any;
    expect(call.where).toEqual({ isActive: true });
  });

  it("returns the three menu sections together", async () => {
    mockedPrisma.category.findMany.mockResolvedValue([{ id: 1 }] as any);
    mockedPrisma.brand.findMany.mockResolvedValue([{ id: 2 }] as any);
    mockedPrisma.vehicle.findMany.mockResolvedValue([{ id: 3 }] as any);

    const meta = await getNavigationMetadata();

    expect(Object.keys(meta).sort()).toEqual(["brands", "categories", "vehicles"]);
  });

  it("orders categories and menu entries deterministically", async () => {
    mockedPrisma.category.findMany.mockResolvedValue([] as any);
    mockedPrisma.brand.findMany.mockResolvedValue([] as any);
    mockedPrisma.vehicle.findMany.mockResolvedValue([] as any);

    await getNavigationMetadata();

    expect((mockedPrisma.category.findMany.mock.calls[0]?.[0] as any).orderBy).toEqual({
      sortOrder: "asc",
    });
    expect((mockedPrisma.vehicle.findMany.mock.calls[0]?.[0] as any).orderBy).toEqual([
      { make: "asc" },
      { model: "asc" },
    ]);
  });
});

// ─── searchProducts ───────────────────────────────────────────────────────────

describe("searchProducts", () => {
  beforeEach(() => {
    mockedPrisma.product.findMany.mockResolvedValue([] as any);
    mockedPrisma.product.count.mockResolvedValue(0 as any);
    stubSearchAggregates();
  });

  it("only ever returns active products", async () => {
    await searchProducts({});

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.isActive).toBe(true);
  });

  it("defaults to page 1 with 12 results", async () => {
    const result = await searchProducts({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(12);
  });

  it("caps the page size at 60 so a scraper cannot pull everything at once", async () => {
    const result = await searchProducts({ limit: 1000 });

    expect(result.limit).toBe(60);
  });

  it("clamps a page below 1 to the first page", async () => {
    const result = await searchProducts({ page: 0 });

    expect(result.page).toBe(1);
    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).skip).toBe(0);
  });

  it("computes the offset from page and limit", async () => {
    await searchProducts({ page: 3, limit: 20 });

    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).skip).toBe(40);
  });

  it("searches name, description, sku and brand name together", async () => {
    await searchProducts({ search: "  rack " });

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.OR).toHaveLength(4);
    expect(where.OR[0].name.contains).toBe("rack"); // trimmed
    expect(where.OR[3].brand.name.contains).toBe("rack");
  });

  it("applies no text filter for a whitespace-only query", async () => {
    await searchProducts({ search: "   " });

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.OR).toBeUndefined();
  });

  it("includes child categories in a category filter", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue({ id: 1, children: [{ id: 2 }] } as any);

    await searchProducts({ category: "storage" });

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.categoryId).toEqual({ in: [1, 2] });
  });

  it("ignores an unknown category rather than returning nothing", async () => {
    mockedPrisma.category.findFirst.mockResolvedValue(null as any);

    await searchProducts({ category: "nope" });

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.categoryId).toBeUndefined();
  });

  it("accepts only the two known product types", async () => {
    await searchProducts({ productType: "part" });
    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where.productType).toBe("part");

    vi.clearAllMocks();
    mockedPrisma.product.findMany.mockResolvedValue([] as any);
    mockedPrisma.product.count.mockResolvedValue(0 as any);
    stubSearchAggregates();

    await searchProducts({ productType: "'; DROP TABLE products; --" });
    expect(
      (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where.productType
    ).toBeUndefined();
  });

  it("applies a lower price bound on its own", async () => {
    await searchProducts({ minPrice: 500 });

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.price).toEqual({ gte: 500 });
  });

  it("applies both price bounds together", async () => {
    await searchProducts({ minPrice: 500, maxPrice: 5000 });

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.price).toEqual({ gte: 500, lte: 5000 });
  });

  it("treats a minimum of 0 as a real bound rather than dropping it", async () => {
    await searchProducts({ minPrice: 0 });

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.price).toEqual({ gte: 0 });
  });

  it("maps each sort option to its column", async () => {
    const cases: [string, any][] = [
      ["price-asc", { price: "asc" }],
      ["price-desc", { price: "desc" }],
      ["name-asc", { name: "asc" }],
      ["name-desc", { name: "desc" }],
      ["newest", { createdAt: "desc" }],
    ];

    for (const [sortBy, expected] of cases) {
      vi.clearAllMocks();
      mockedPrisma.product.findMany.mockResolvedValue([] as any);
      mockedPrisma.product.count.mockResolvedValue(0 as any);
      stubSearchAggregates();

      await searchProducts({ sortBy });

      expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).orderBy).toEqual(expected);
    }
  });

  it("falls back to newest-first for an unrecognised sort option", async () => {
    await searchProducts({ sortBy: "cheapest-ever" });

    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).orderBy).toEqual({
      createdAt: "desc",
    });
  });

  it("reports the page count from the filtered total", async () => {
    mockedPrisma.product.count.mockResolvedValue(25 as any);

    const result = await searchProducts({ limit: 12 });

    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it("returns 0 pages for a search that matches nothing", async () => {
    mockedPrisma.product.count.mockResolvedValue(0 as any);

    expect((await searchProducts({})).totalPages).toBe(0);
  });

  it("returns the price range as numbers for the filter slider", async () => {
    const result = await searchProducts({});

    expect(result.aggregations.priceRange).toEqual({ min: 500, max: 50000 });
  });

  it("falls back to a sane price range on an empty catalogue", async () => {
    mockedPrisma.product.aggregate.mockResolvedValue({
      _min: { price: null },
      _max: { price: null },
    } as any);

    const result = await searchProducts({});

    expect(result.aggregations.priceRange).toEqual({ min: 0, max: 100000 });
  });

  it("flattens the sidebar categories with their parent name", async () => {
    mockedPrisma.category.findMany.mockResolvedValue([
      { id: 3, name: "Roof Racks", slug: "roof-racks", parent: { name: "Storage" } },
      { id: 4, name: "Lighting", slug: "lighting", parent: null },
    ] as any);

    const result = await searchProducts({});

    expect(result.aggregations.categories).toEqual([
      { id: 3, name: "Roof Racks", slug: "roof-racks", parentName: "Storage" },
      { id: 4, name: "Lighting", slug: "lighting", parentName: null },
    ]);
  });

  it("offers only brands that actually have an active product", async () => {
    await searchProducts({});

    const where = (mockedPrisma.brand.findMany.mock.calls[0]?.[0] as any).where;
    expect(where).toEqual({ isActive: true, products: { some: { isActive: true } } });
  });
});

// ─── getProductsAdmin ─────────────────────────────────────────────────────────

describe("getProductsAdmin", () => {
  beforeEach(() => {
    mockedPrisma.product.findMany.mockResolvedValue([] as any);
    mockedPrisma.product.count.mockResolvedValue(0 as any);
  });

  it("shows inactive products too, unlike the storefront search", async () => {
    await getProductsAdmin({});

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.isActive).toBeUndefined();
  });

  it("defaults to 15 rows a page", async () => {
    const result = await getProductsAdmin({});

    expect(result.limit).toBe(15);
  });

  it("caps the page size at 100", async () => {
    expect((await getProductsAdmin({ limit: 5000 })).limit).toBe(100);
  });

  it("filters to active products on request", async () => {
    await getProductsAdmin({ status: "active" });

    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where.isActive).toBe(true);
  });

  it("filters to inactive products on request", async () => {
    await getProductsAdmin({ status: "inactive" });

    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where.isActive).toBe(false);
  });

  it("ignores an unrecognised status filter", async () => {
    await getProductsAdmin({ status: "archived" });

    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where.isActive).toBeUndefined();
  });

  it("matches the three stock bands without overlapping", async () => {
    await getProductsAdmin({ stock: "out-of-stock" });
    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where.stockQty).toBe(0);

    vi.clearAllMocks();
    mockedPrisma.product.findMany.mockResolvedValue([] as any);
    mockedPrisma.product.count.mockResolvedValue(0 as any);
    await getProductsAdmin({ stock: "low-stock" });
    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where.stockQty).toEqual({
      gt: 0,
      lt: 5,
    });

    vi.clearAllMocks();
    mockedPrisma.product.findMany.mockResolvedValue([] as any);
    mockedPrisma.product.count.mockResolvedValue(0 as any);
    await getProductsAdmin({ stock: "in-stock" });
    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where.stockQty).toEqual({
      gte: 5,
    });
  });

  it("searches name, sku and description", async () => {
    await getProductsAdmin({ search: "rack" });

    const where = (mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.OR.map((c: any) => Object.keys(c)[0])).toEqual(["name", "sku", "description"]);
  });

  it("ignores a sort column that isn't whitelisted", async () => {
    await getProductsAdmin({ sortBy: "costPrice", sortOrder: "asc" });

    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).orderBy).toEqual({
      createdAt: "asc",
    });
  });

  it("sorts by a whitelisted column in the requested direction", async () => {
    await getProductsAdmin({ sortBy: "stockQty", sortOrder: "asc" });

    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).orderBy).toEqual({
      stockQty: "asc",
    });
  });

  it("defaults to descending order", async () => {
    await getProductsAdmin({ sortBy: "name" });

    expect((mockedPrisma.product.findMany.mock.calls[0]?.[0] as any).orderBy).toEqual({
      name: "desc",
    });
  });
});

// ─── Stats and bulk actions ───────────────────────────────────────────────────

describe("getProductStats", () => {
  it("derives the inactive count rather than issuing a fifth query", async () => {
    mockedPrisma.product.count
      .mockResolvedValueOnce(100 as any) // total
      .mockResolvedValueOnce(80 as any)  // active
      .mockResolvedValueOnce(5 as any)   // out of stock
      .mockResolvedValueOnce(7 as any);  // low stock

    const stats = await getProductStats();

    expect(stats).toEqual({
      totalProducts: 100,
      activeProducts: 80,
      inactiveProducts: 20,
      outOfStock: 5,
      lowStock: 7,
    });
  });

  it("counts low stock as strictly between 0 and 5", async () => {
    mockedPrisma.product.count.mockResolvedValue(0 as any);

    await getProductStats();

    const lowStockWhere = (mockedPrisma.product.count.mock.calls[3]?.[0] as any).where;
    expect(lowStockWhere.stockQty).toEqual({ gt: 0, lt: 5 });
  });
});

describe("bulkUpdateProducts", () => {
  it("refuses an empty selection", async () => {
    await expect(bulkUpdateProducts([], "activate")).rejects.toThrow(/No product IDs provided/i);
  });

  it("activates the selected products", async () => {
    mockedPrisma.product.updateMany.mockResolvedValue({ count: 2 } as any);

    const result = await bulkUpdateProducts([10, 11], "activate");

    expect(mockedPrisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [10, 11] } },
      data: { isActive: true },
    });
    expect(result).toEqual({ affected: 2, action: "activate" });
  });

  it("deactivates the selected products", async () => {
    mockedPrisma.product.updateMany.mockResolvedValue({ count: 1 } as any);

    await bulkUpdateProducts([10], "deactivate");

    expect(mockedPrisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [10] } },
      data: { isActive: false },
    });
  });

  it("clears every dependent row before deleting, so no foreign key blocks it", async () => {
    mockedPrisma.product.deleteMany.mockResolvedValue({ count: 2 } as any);

    await bulkUpdateProducts([10, 11], "delete");

    for (const table of [
      mockedPrisma.productVehicle,
      mockedPrisma.productAttribute,
      mockedPrisma.productImage,
      mockedPrisma.cartItem,
      mockedPrisma.wishlistItem,
    ]) {
      expect(table.deleteMany).toHaveBeenCalledWith({ where: { productId: { in: [10, 11] } } });
    }
    expect(mockedPrisma.product.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [10, 11] } },
    });
  });

  it("removes the products from every shopper's cart and wishlist", async () => {
    mockedPrisma.product.deleteMany.mockResolvedValue({ count: 1 } as any);

    await bulkUpdateProducts([10], "delete");

    // A deleted product left in a cart breaks checkout for that customer.
    expect(mockedPrisma.cartItem.deleteMany).toHaveBeenCalled();
    expect(mockedPrisma.wishlistItem.deleteMany).toHaveBeenCalled();
  });

  it("reports how many rows a delete actually affected", async () => {
    mockedPrisma.product.deleteMany.mockResolvedValue({ count: 3 } as any);

    expect(await bulkUpdateProducts([10, 11, 12], "delete")).toEqual({
      affected: 3,
      action: "delete",
    });
  });
});
