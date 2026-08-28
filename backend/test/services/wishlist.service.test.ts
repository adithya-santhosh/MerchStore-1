import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    wishlistItem: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    product: { findUnique: vi.fn() },
  },
}));

import prisma from "../../src/lib/prisma";
import {
  getWishlist,
  getWishlistIds,
  addToWishlist,
  removeFromWishlist,
} from "../../src/services/wishlist.service";

const mockedPrisma = vi.mocked(prisma, true);

const wishlistRow = (over: Record<string, any> = {}) => ({
  id: 1,
  addedAt: new Date("2026-02-01"),
  product: {
    id: 10,
    name: "Recovery Strap",
    description: "20,000 lb rated",
    price: "2499.00",
    compareAtPrice: "2999.00",
    images: [],
    category: { name: "Recovery Gear", parent: null },
    brand: { name: "ARB" },
    isActive: true,
    stockQty: 4,
  },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getWishlist", () => {
  it("shows the most recently saved item first", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([] as any);

    await getWishlist(7);

    expect(mockedPrisma.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { addedAt: "desc" } })
    );
  });

  it("scopes the query to the requesting user", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([] as any);

    await getWishlist(7);

    expect(mockedPrisma.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7 } })
    );
  });

  it("converts Decimal prices to numbers", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([wishlistRow()] as any);

    const [item] = await getWishlist(7);

    expect(item.product.price).toBe(2499);
    expect(item.product.compareAtPrice).toBe(2999);
  });

  it("reports a price of 0 rather than null when the product has none", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([
      wishlistRow({ product: { ...wishlistRow().product, price: null } }),
    ] as any);

    const [item] = await getWishlist(7);

    expect(item.product.price).toBe(0);
  });

  it("prefers the primary image", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([
      wishlistRow({
        product: {
          ...wishlistRow().product,
          images: [
            { imageUrl: "/alt.jpg", isPrimary: false },
            { imageUrl: "/hero.jpg", isPrimary: true },
          ],
        },
      }),
    ] as any);

    const [item] = await getWishlist(7);

    expect(item.product.ImageURL).toBe("/hero.jpg");
  });

  it("names the parent category for a sub-categorised product", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([
      wishlistRow({
        product: {
          ...wishlistRow().product,
          category: { name: "Winches", parent: { name: "Recovery Gear" } },
        },
      }),
    ] as any);

    const [item] = await getWishlist(7);

    // The card shows the top-level department, not the leaf.
    expect(item.product.category).toBe("Recovery Gear");
  });

  it("uses the category's own name when it has no parent", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([wishlistRow()] as any);

    const [item] = await getWishlist(7);

    expect(item.product.category).toBe("Recovery Gear");
  });

  it("returns a null brand rather than crashing when the product has none", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([
      wishlistRow({ product: { ...wishlistRow().product, brand: null } }),
    ] as any);

    const [item] = await getWishlist(7);

    expect(item.product.brand).toBeNull();
  });

  it("keeps stock and active flags so the UI can grey out unavailable saves", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([
      wishlistRow({ product: { ...wishlistRow().product, isActive: false, stockQty: 0 } }),
    ] as any);

    const [item] = await getWishlist(7);

    expect(item.product.isActive).toBe(false);
    expect(item.product.stockQty).toBe(0);
  });
});

describe("getWishlistIds", () => {
  it("returns a bare array of product ids for the heart-icon state", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([
      { productId: 10 },
      { productId: 12 },
    ] as any);

    const ids = await getWishlistIds(7);

    expect(ids).toEqual([10, 12]);
  });

  it("selects only the id column, not the whole product graph", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([] as any);

    await getWishlistIds(7);

    expect(mockedPrisma.wishlistItem.findMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      select: { productId: true },
    });
  });

  it("returns an empty array for a user who has saved nothing", async () => {
    mockedPrisma.wishlistItem.findMany.mockResolvedValue([] as any);

    expect(await getWishlistIds(7)).toEqual([]);
  });
});

describe("addToWishlist", () => {
  it("refuses to save a product that does not exist", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(null as any);

    await expect(addToWishlist(7, 999)).rejects.toThrow("Product not found");
    expect(mockedPrisma.wishlistItem.upsert).not.toHaveBeenCalled();
  });

  it("is idempotent — saving twice does not create a duplicate row", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue({ id: 10 } as any);
    mockedPrisma.wishlistItem.upsert.mockResolvedValue({
      id: 1,
      productId: 10,
      addedAt: new Date("2026-02-01"),
    } as any);

    await addToWishlist(7, 10);

    const call = mockedPrisma.wishlistItem.upsert.mock.calls[0]?.[0] as any;
    expect(call.where).toEqual({ userId_productId: { userId: 7, productId: 10 } });
    expect(call.update).toEqual({}); // second save is a no-op
  });

  it("returns the saved item without leaking the whole product record", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue({ id: 10 } as any);
    const addedAt = new Date("2026-02-01");
    mockedPrisma.wishlistItem.upsert.mockResolvedValue({ id: 1, productId: 10, addedAt } as any);

    const result = await addToWishlist(7, 10);

    expect(result).toEqual({ id: 1, productId: 10, addedAt });
  });
});

describe("removeFromWishlist", () => {
  it("removes the save for that user and product only", async () => {
    mockedPrisma.wishlistItem.deleteMany.mockResolvedValue({ count: 1 } as any);

    await removeFromWishlist(7, 10);

    expect(mockedPrisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: 7, productId: 10 },
    });
  });

  it("succeeds quietly when the item was already removed", async () => {
    mockedPrisma.wishlistItem.deleteMany.mockResolvedValue({ count: 0 } as any);

    // deleteMany, not delete — a double-click must not surface as an error.
    await expect(removeFromWishlist(7, 10)).resolves.toEqual({
      message: "Removed from wishlist",
    });
  });
});
