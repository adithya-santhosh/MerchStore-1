import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/services/product.service", () => ({
  getAllProducts: vi.fn(),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  deleteProduct: vi.fn(),
  updateProduct: vi.fn(),
  subCategories: vi.fn(),
  getNavigationMetadata: vi.fn(),
  getProductsAdmin: vi.fn(),
  getProductStats: vi.fn(),
  bulkUpdateProducts: vi.fn(),
  searchProducts: vi.fn(),
}));

// requireAuth checks tokenVersion against the DB on every request.
vi.mock("../../src/lib/prisma", () => ({
  default: { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 0 }) } },
}));

import app from "../../src/app";
import * as productService from "../../src/services/product.service";

const svc = vi.mocked(productService);
const JWT_SECRET = process.env.JWT_SECRET!;

const tokenWithRole = (role: string) =>
  jwt.sign(
    { id: 7, email: "u@example.com", role, firstName: "U", lastName: "R" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

const adminAuth = `Bearer ${tokenWithRole("ADMIN")}`;
const customerAuth = `Bearer ${tokenWithRole("CUSTOMER")}`;

const validProduct = {
  name: "Roof Rack",
  description: "Heavy duty roof rack",
  slug: "roof-rack",
  price: 14999,
  categoryId: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/products", () => {
  it("is public — no token required", async () => {
    svc.getAllProducts.mockResolvedValue([] as any);

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
  });

  it("passes the four catalogue filters through in order", async () => {
    svc.getAllProducts.mockResolvedValue([] as any);

    await request(app).get(
      "/api/products?category=storage&subCategory=roof-racks&vehicle=Thar&brand=arb"
    );

    expect(svc.getAllProducts).toHaveBeenCalledWith("storage", "roof-racks", "Thar", "arb");
  });

  it("answers 500 when the catalogue query fails", async () => {
    svc.getAllProducts.mockRejectedValue(new Error("db down"));

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(500);
  });
});

describe("GET /api/products/:id", () => {
  it("returns the product for a valid id", async () => {
    svc.getProductById.mockResolvedValue({ id: 10, name: "Roof Rack" } as any);

    const res = await request(app).get("/api/products/10");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(10);
  });

  it("answers 404 for a product that does not exist", async () => {
    svc.getProductById.mockResolvedValue(null as any);

    const res = await request(app).get("/api/products/999");

    expect(res.status).toBe(404);
  });

  it("rejects a non-numeric id with 400", async () => {
    const res = await request(app).get("/api/products/not-a-number");

    expect(res.status).toBe(400);
    expect(svc.getProductById).not.toHaveBeenCalled();
  });

  it("rejects a fractional id with 400", async () => {
    const res = await request(app).get("/api/products/1.5");

    expect(res.status).toBe(400);
  });

  it("rejects a negative id with 400", async () => {
    const res = await request(app).get("/api/products/-1");

    expect(res.status).toBe(400);
  });
});

describe("GET /api/products/search", () => {
  const searchResult = {
    products: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
    aggregations: { brands: [], categories: [], priceRange: { min: 0, max: 100000 } },
  };

  it("is public", async () => {
    svc.searchProducts.mockResolvedValue(searchResult as any);

    const res = await request(app).get("/api/products/search");

    expect(res.status).toBe(200);
  });

  it("is matched before the generic /:id route", async () => {
    svc.searchProducts.mockResolvedValue(searchResult as any);

    await request(app).get("/api/products/search?search=rack");

    // If /:id won, "search" would be parsed as a product id and 400.
    expect(svc.searchProducts).toHaveBeenCalled();
    expect(svc.getProductById).not.toHaveBeenCalled();
  });

  it("defaults page and limit when they are absent", async () => {
    svc.searchProducts.mockResolvedValue(searchResult as any);

    await request(app).get("/api/products/search");

    expect(svc.searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 12 })
    );
  });

  it("falls back to page 1 for a non-numeric page", async () => {
    svc.searchProducts.mockResolvedValue(searchResult as any);

    await request(app).get("/api/products/search?page=abc");

    expect(svc.searchProducts).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  });

  it("forwards numeric price bounds as numbers", async () => {
    svc.searchProducts.mockResolvedValue(searchResult as any);

    await request(app).get("/api/products/search?minPrice=500&maxPrice=5000");

    expect(svc.searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ minPrice: 500, maxPrice: 5000 })
    );
  });

  it("omits price bounds entirely when they are not supplied", async () => {
    svc.searchProducts.mockResolvedValue(searchResult as any);

    await request(app).get("/api/products/search?search=rack");

    const params = svc.searchProducts.mock.calls[0]?.[0] as any;
    expect(params).not.toHaveProperty("minPrice");
    expect(params).not.toHaveProperty("maxPrice");
  });
});

describe("GET /api/products/navigation/metadata", () => {
  it("is public and returns the three menu sections", async () => {
    svc.getNavigationMetadata.mockResolvedValue({
      categories: [],
      brands: [],
      vehicles: [],
    } as any);

    const res = await request(app).get("/api/products/navigation/metadata");

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(["brands", "categories", "vehicles"]);
  });

  it("answers 500 without leaking the underlying error", async () => {
    svc.getNavigationMetadata.mockRejectedValue(new Error("relation does not exist"));

    const res = await request(app).get("/api/products/navigation/metadata");

    expect(res.status).toBe(500);
    expect(res.body.message).not.toMatch(/relation/);
  });
});

describe("GET /api/products/subcategories/:category", () => {
  it("returns the child category names", async () => {
    svc.subCategories.mockResolvedValue(["Roof Racks"] as any);

    const res = await request(app).get("/api/products/subcategories/storage");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(["Roof Racks"]);
  });
});

describe("admin product routes — access control", () => {
  it.each([
    ["get", "/api/products/admin"],
    ["get", "/api/products/admin/stats"],
    ["get", "/api/products/admin/upload-signature"],
    ["patch", "/api/products/admin/bulk"],
  ])("rejects an anonymous %s %s with 401", async (method, path) => {
    const res = await (request(app) as any)[method](path);

    expect(res.status).toBe(401);
  });

  it.each([
    ["get", "/api/products/admin"],
    ["get", "/api/products/admin/stats"],
    ["get", "/api/products/admin/upload-signature"],
    ["patch", "/api/products/admin/bulk"],
  ])("rejects a signed-in customer's %s %s with 403", async (method, path) => {
    const res = await (request(app) as any)[method](path).set("Authorization", customerAuth);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admins only/i);
  });

  it("blocks a customer from creating a product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", customerAuth)
      .send(validProduct);

    expect(res.status).toBe(403);
    expect(svc.createProduct).not.toHaveBeenCalled();
  });

  it("blocks a customer from deleting a product", async () => {
    const res = await request(app).delete("/api/products/10").set("Authorization", customerAuth);

    expect(res.status).toBe(403);
    expect(svc.deleteProduct).not.toHaveBeenCalled();
  });

  it("blocks a customer from editing a product", async () => {
    const res = await request(app)
      .put("/api/products/10")
      .set("Authorization", customerAuth)
      .send({ price: 1 });

    expect(res.status).toBe(403);
    expect(svc.updateProduct).not.toHaveBeenCalled();
  });

  it("rejects a role claim forged with the wrong secret", async () => {
    const forged = jwt.sign({ id: 7, role: "ADMIN" }, "attacker-secret", { expiresIn: "1h" });

    const res = await request(app)
      .get("/api/products/admin/stats")
      .set("Authorization", `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });
});

describe("GET /api/products/admin/upload-signature", () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("hands an admin a signed, format-restricted upload payload", async () => {
    process.env.CLOUDINARY_NAME = "demo";
    process.env.CLOUDINARY_API_KEY = "key123";
    process.env.CLOUDINARY_API_SECRET = "shh-its-a-secret";

    const res = await request(app)
      .get("/api/products/admin/upload-signature")
      .set("Authorization", adminAuth);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ cloudName: "demo", apiKey: "key123", folder: "products" });
    expect(res.body.allowedFormats).not.toContain("svg");
    expect(res.body.signature).toBeTruthy();
    // The whole point: the secret used to produce it must never come back.
    expect(JSON.stringify(res.body)).not.toContain("shh-its-a-secret");
  });

  it("answers 503 rather than a broken payload when Cloudinary isn't configured", async () => {
    delete process.env.CLOUDINARY_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const res = await request(app)
      .get("/api/products/admin/upload-signature")
      .set("Authorization", adminAuth);

    expect(res.status).toBe(503);
  });
});

describe("POST /api/products", () => {
  it("rejects a payload missing required fields with 422", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", adminAuth)
      .send({ name: "Roof Rack" });

    expect(res.status).toBe(422);
    expect(svc.createProduct).not.toHaveBeenCalled();
  });

  it("rejects a negative price with 422", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", adminAuth)
      .send({ ...validProduct, price: -1 });

    expect(res.status).toBe(422);
    expect(res.body.errors.some((e: any) => e.field === "price")).toBe(true);
  });

  it("rejects an unknown product type with 422", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", adminAuth)
      .send({ ...validProduct, productType: "spaceship" });

    expect(res.status).toBe(422);
  });

  it("creates the product and returns 201 for an admin", async () => {
    svc.createProduct.mockResolvedValue({ id: 10 } as any);

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", adminAuth)
      .send(validProduct);

    expect(res.status).toBe(201);
  });

  it("strips HTML out of name and description before the service sees them", async () => {
    svc.createProduct.mockResolvedValue({ id: 10 } as any);

    await request(app)
      .post("/api/products")
      .set("Authorization", adminAuth)
      .send({
        ...validProduct,
        name: "<script>alert(1)</script>Roof Rack",
        description: "Heavy duty <b>roof rack</b>",
      });

    const data = svc.createProduct.mock.calls[0]?.[0] as any;
    expect(data.name).toBe("Roof Rack");
    expect(data.description).toBe("Heavy duty roof rack");
  });

  it("applies the schema defaults before the service sees the payload", async () => {
    svc.createProduct.mockResolvedValue({ id: 10 } as any);

    await request(app).post("/api/products").set("Authorization", adminAuth).send(validProduct);

    expect(svc.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({ stockQty: 0, productType: "part", isActive: true })
    );
  });

  // The shape ProductForm actually posts: category by NAME rather than by id,
  // and an explicit `null` for every field the admin left blank. The fixture
  // above is a hand-written five-field object that matches no real caller, so
  // this suite stayed green while every create from the admin UI failed with a
  // 422 on six fields at once.
  const adminFormPayload = {
    name: "Formula V1 Hoodie",
    slug: "formula-v1-hoodie",
    description: "Heavyweight cotton hoodie",
    shortDescription: null,
    price: 2499,
    compareAtPrice: null,
    costPrice: null,
    sku: null,
    stockQty: 5,
    weight: null,
    productType: "merch",
    isActive: true,
    isFeatured: false,
    category: "Merchandise",
    subCategory: "Hoodies",
    ImageURL: "https://res.cloudinary.com/diz4hpigr/image/upload/v1/hoodie.jpg",
    brand: "Acme",
    compatibleWith: [],
    attributes: [{ attrKey: "Colour", attrValue: "Black" }],
  };

  it("accepts the payload the admin form posts, nulls and all", async () => {
    svc.createProduct.mockResolvedValue({ id: 10 } as any);

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", adminAuth)
      .send(adminFormPayload);

    expect(res.status).toBe(201);
  });

  it("forwards the image, category, brand and attributes instead of stripping them", async () => {
    svc.createProduct.mockResolvedValue({ id: 10 } as any);

    await request(app)
      .post("/api/products")
      .set("Authorization", adminAuth)
      .send(adminFormPayload);

    expect(svc.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        ImageURL: adminFormPayload.ImageURL,
        category: "Merchandise",
        subCategory: "Hoodies",
        brand: "Acme",
        attributes: [{ attrKey: "Colour", attrValue: "Black" }],
      })
    );
  });

  it("forwards a multi-image array to the service", async () => {
    svc.createProduct.mockResolvedValue({ id: 10 } as any);

    const images = [
      { imageUrl: "https://res.cloudinary.com/x/a.jpg", isPrimary: true, sortOrder: 0 },
      { imageUrl: "https://res.cloudinary.com/x/b.jpg", isPrimary: false, sortOrder: 1 },
      { imageUrl: "https://res.cloudinary.com/x/c.jpg", isPrimary: false, sortOrder: 2 },
    ];

    await request(app)
      .post("/api/products")
      .set("Authorization", adminAuth)
      .send({ ...adminFormPayload, images });

    expect(svc.createProduct).toHaveBeenCalledWith(expect.objectContaining({ images }));
  });

  it("rejects a product with neither a categoryId nor a category name", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", adminAuth)
      .send({ ...adminFormPayload, category: undefined, subCategory: undefined });

    expect(res.status).toBe(422);
    expect(svc.createProduct).not.toHaveBeenCalled();
  });

  it("rejects an image URL that is neither http(s) nor root-relative", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", adminAuth)
      .send({ ...adminFormPayload, ImageURL: "javascript:alert(1)" });

    expect(res.status).toBe(422);
    expect(svc.createProduct).not.toHaveBeenCalled();
  });

  it("rejects more images than the per-product cap", async () => {
    const images = Array.from(
      { length: 13 },
      (_, i) => `https://res.cloudinary.com/x/${i}.jpg`
    );

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", adminAuth)
      .send({ ...adminFormPayload, images });

    expect(res.status).toBe(422);
    expect(svc.createProduct).not.toHaveBeenCalled();
  });
});

describe("PUT /api/products/:id", () => {
  // What EditProductForm actually posts: the subset of fields it manages. There
  // is no slug, no stock and no flags, so a create-shaped schema would reject
  // an ordinary edit outright.
  const editFormPayload = {
    name: "Formula V1 Hoodie",
    description: "Heavyweight cotton hoodie",
    price: 2499,
    category: "Merchandise",
    subCategory: "Hoodies",
    brand: "Acme",
    compatibleWith: [],
    attributes: [{ attrKey: "Colour", attrValue: "Black" }],
    images: [
      { imageUrl: "https://res.cloudinary.com/x/a.jpg", isPrimary: true, sortOrder: 0 },
      { imageUrl: "https://res.cloudinary.com/x/b.jpg", isPrimary: false, sortOrder: 1 },
    ],
  };

  it("accepts the partial payload the edit form posts", async () => {
    svc.updateProduct.mockResolvedValue({ id: 10 } as any);

    const res = await request(app)
      .put("/api/products/10")
      .set("Authorization", adminAuth)
      .send(editFormPayload);

    expect(res.status).toBe(200);
  });

  it("forwards the gallery to the service", async () => {
    svc.updateProduct.mockResolvedValue({ id: 10 } as any);

    await request(app)
      .put("/api/products/10")
      .set("Authorization", adminAuth)
      .send(editFormPayload);

    expect(svc.updateProduct).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ images: editFormPayload.images })
    );
  });

  // The trap `updateCouponSchema` already documents, four fields over at once.
  // `.partial()` keeps every `.default()`, and updateProduct hands Prisma any
  // key that isn't undefined — so a field the admin never touched has to arrive
  // ABSENT rather than as its schema default. Otherwise editing just the price
  // would also zero the stock, flip "merch" to "part", reactivate a
  // deactivated product and clear its featured flag.
  it("omits fields the caller never sent rather than defaulting them", async () => {
    svc.updateProduct.mockResolvedValue({ id: 10 } as any);

    await request(app)
      .put("/api/products/10")
      .set("Authorization", adminAuth)
      .send(editFormPayload);

    const sent = svc.updateProduct.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(sent).not.toHaveProperty("stockQty");
    expect(sent).not.toHaveProperty("productType");
    expect(sent).not.toHaveProperty("isActive");
    expect(sent).not.toHaveProperty("isFeatured");
    expect(sent).not.toHaveProperty("slug");
  });

  it("still applies those fields when they are sent explicitly", async () => {
    svc.updateProduct.mockResolvedValue({ id: 10 } as any);

    await request(app)
      .put("/api/products/10")
      .set("Authorization", adminAuth)
      .send({
        ...editFormPayload,
        stockQty: 0,
        productType: "merch",
        isActive: false,
        isFeatured: true,
      });

    expect(svc.updateProduct).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        stockQty: 0,
        productType: "merch",
        isActive: false,
        isFeatured: true,
      })
    );
  });

  it("accepts a rename on its own", async () => {
    svc.updateProduct.mockResolvedValue({ id: 10 } as any);

    const res = await request(app)
      .put("/api/products/10")
      .set("Authorization", adminAuth)
      .send({ name: "Renamed" });

    expect(res.status).toBe(200);
  });

  it("accepts an empty images array so a gallery can be cleared", async () => {
    svc.updateProduct.mockResolvedValue({ id: 10 } as any);

    const res = await request(app)
      .put("/api/products/10")
      .set("Authorization", adminAuth)
      .send({ images: [] });

    expect(res.status).toBe(200);
    expect(svc.updateProduct).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ images: [] })
    );
  });

  it("rejects a negative price with 422", async () => {
    const res = await request(app)
      .put("/api/products/10")
      .set("Authorization", adminAuth)
      .send({ price: -1 });

    expect(res.status).toBe(422);
    expect(svc.updateProduct).not.toHaveBeenCalled();
  });

  it("rejects an unknown product type with 422", async () => {
    const res = await request(app)
      .put("/api/products/10")
      .set("Authorization", adminAuth)
      .send({ productType: "spaceship" });

    expect(res.status).toBe(422);
    expect(svc.updateProduct).not.toHaveBeenCalled();
  });

  it("rejects an image URL that is neither http(s) nor root-relative", async () => {
    const res = await request(app)
      .put("/api/products/10")
      .set("Authorization", adminAuth)
      .send({ images: ["javascript:alert(1)"] });

    expect(res.status).toBe(422);
    expect(svc.updateProduct).not.toHaveBeenCalled();
  });

  it("strips unknown keys instead of forwarding them to Prisma", async () => {
    svc.updateProduct.mockResolvedValue({ id: 10 } as any);

    await request(app)
      .put("/api/products/10")
      .set("Authorization", adminAuth)
      .send({ ...editFormPayload, id: 999, createdAt: "1999-01-01" });

    const sent = svc.updateProduct.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(sent).not.toHaveProperty("id");
    expect(sent).not.toHaveProperty("createdAt");
  });
});

describe("PATCH /api/products/admin/bulk", () => {
  it("rejects an empty id list with 400", async () => {
    const res = await request(app)
      .patch("/api/products/admin/bulk")
      .set("Authorization", adminAuth)
      .send({ ids: [], action: "activate" });

    expect(res.status).toBe(400);
    expect(svc.bulkUpdateProducts).not.toHaveBeenCalled();
  });

  it("rejects a non-array id list with 400", async () => {
    const res = await request(app)
      .patch("/api/products/admin/bulk")
      .set("Authorization", adminAuth)
      .send({ ids: "10,11", action: "activate" });

    expect(res.status).toBe(400);
  });

  it("rejects an unknown action with 400", async () => {
    const res = await request(app)
      .patch("/api/products/admin/bulk")
      .set("Authorization", adminAuth)
      .send({ ids: [10], action: "obliterate" });

    expect(res.status).toBe(400);
    expect(svc.bulkUpdateProducts).not.toHaveBeenCalled();
  });

  it("coerces the ids to numbers before dispatching", async () => {
    svc.bulkUpdateProducts.mockResolvedValue({ affected: 2, action: "delete" } as any);

    await request(app)
      .patch("/api/products/admin/bulk")
      .set("Authorization", adminAuth)
      .send({ ids: ["10", "11"], action: "delete" });

    expect(svc.bulkUpdateProducts).toHaveBeenCalledWith([10, 11], "delete");
  });

  it("accepts each of the three allowed actions", async () => {
    svc.bulkUpdateProducts.mockResolvedValue({ affected: 1, action: "activate" } as any);

    for (const action of ["activate", "deactivate", "delete"]) {
      const res = await request(app)
        .patch("/api/products/admin/bulk")
        .set("Authorization", adminAuth)
        .send({ ids: [10], action });

      expect(res.status).toBe(200);
    }
  });
});

describe("DELETE /api/products/:id", () => {
  it("rejects an invalid id with 400 for an admin too", async () => {
    const res = await request(app).delete("/api/products/abc").set("Authorization", adminAuth);

    expect(res.status).toBe(400);
    expect(svc.deleteProduct).not.toHaveBeenCalled();
  });

  it("deletes for an admin", async () => {
    svc.deleteProduct.mockResolvedValue({} as any);

    const res = await request(app).delete("/api/products/10").set("Authorization", adminAuth);

    expect(res.status).toBe(200);
    expect(svc.deleteProduct).toHaveBeenCalledWith(10);
  });
});
