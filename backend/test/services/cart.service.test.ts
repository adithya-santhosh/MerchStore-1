import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    cart: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    cartItem: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    product: { findUnique: vi.fn() },
  },
}));

import prisma from "../../src/lib/prisma";
import { getOrCreateCart, addItemToCart, removeItemFromCart } from "../../src/services/cart.service";

const mockedPrisma = vi.mocked(prisma, true);

/** A cart row shaped the way `cartInclude` returns it. */
const cartRow = (over: Record<string, any> = {}) => ({
  id: 1,
  sessionToken: null,
  userId: 7,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  items: [],
  ...over,
});

const itemRow = (over: Record<string, any> = {}) => ({
  id: 100,
  productId: 10,
  quantity: 2,
  unitPrice: "1499.00", // Prisma hands Decimals back as strings/objects, never numbers
  product: {
    id: 10,
    name: "Roof Rack",
    slug: "roof-rack",
    price: "1499.00",
    compareAtPrice: "1999.00",
    images: [],
    category: { name: "Storage & Racks" },
  },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getOrCreateCart — signed-in customer", () => {
  it("returns the cart already attached to the user", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow() as any);

    const cart = await getOrCreateCart(undefined, 7);

    expect(cart?.id).toBe(1);
    expect(mockedPrisma.cart.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7 } })
    );
    expect(mockedPrisma.cart.create).not.toHaveBeenCalled();
  });

  it("adopts the guest cart when the user has none, so a pre-login basket survives sign-in", async () => {
    mockedPrisma.cart.findFirst
      .mockResolvedValueOnce(null as any) // no user cart
      .mockResolvedValueOnce(cartRow({ userId: null, sessionToken: "guest-tok" }) as any);
    mockedPrisma.cart.update.mockResolvedValue(cartRow() as any);

    await getOrCreateCart("guest-tok", 7);

    // Claiming it must also clear the session token, or the guest cookie keeps
    // pointing at a cart that now belongs to an account.
    expect(mockedPrisma.cart.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: 7, sessionToken: null } })
    );
  });

  it("creates a fresh cart when the user has neither a cart nor a guest token", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(null as any);
    mockedPrisma.cart.create.mockResolvedValue(cartRow() as any);

    await getOrCreateCart(undefined, 7);

    expect(mockedPrisma.cart.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: 7 } })
    );
  });

  it("creates a user cart when the guest token matches nothing", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(null as any); // both lookups miss
    mockedPrisma.cart.create.mockResolvedValue(cartRow() as any);

    await getOrCreateCart("stale-token", 7);

    expect(mockedPrisma.cart.update).not.toHaveBeenCalled();
    expect(mockedPrisma.cart.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: 7 } })
    );
  });
});

describe("getOrCreateCart — guest", () => {
  it("mints a session token when the visitor arrives without one", async () => {
    mockedPrisma.cart.create.mockResolvedValue(
      cartRow({ userId: null, sessionToken: "generated" }) as any
    );

    const cart = await getOrCreateCart();

    const createArg = mockedPrisma.cart.create.mock.calls[0]?.[0] as any;
    expect(createArg.data.sessionToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(cart?.sessionToken).toBe("generated");
  });

  it("reuses the cart the session token points at", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartRow({ userId: null, sessionToken: "guest-tok" }) as any
    );

    await getOrCreateCart("guest-tok");

    expect(mockedPrisma.cart.create).not.toHaveBeenCalled();
  });

  it("creates a cart under the supplied token when none exists yet", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(null as any);
    mockedPrisma.cart.create.mockResolvedValue(
      cartRow({ userId: null, sessionToken: "guest-tok" }) as any
    );

    await getOrCreateCart("guest-tok");

    expect(mockedPrisma.cart.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { sessionToken: "guest-tok" } })
    );
  });
});

describe("cart mapping", () => {
  it("prefers the primary image over the first one on file", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartRow({
        items: [
          itemRow({
            product: {
              ...itemRow().product,
              images: [
                { imageUrl: "/second.jpg", isPrimary: false },
                { imageUrl: "/hero.jpg", isPrimary: true },
              ],
            },
          }),
        ],
      }) as any
    );

    const cart = await getOrCreateCart(undefined, 7);

    expect(cart?.items[0]?.product.ImageURL).toBe("/hero.jpg");
  });

  it("falls back to the first image when none is flagged primary", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartRow({
        items: [
          itemRow({
            product: {
              ...itemRow().product,
              images: [{ imageUrl: "/only.jpg", isPrimary: false }],
            },
          }),
        ],
      }) as any
    );

    const cart = await getOrCreateCart(undefined, 7);

    expect(cart?.items[0]?.product.ImageURL).toBe("/only.jpg");
  });

  it("reports a null image rather than undefined when the product has none", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow({ items: [itemRow()] }) as any);

    const cart = await getOrCreateCart(undefined, 7);

    expect(cart?.items[0]?.product.ImageURL).toBeNull();
  });

  it("converts Decimal money columns to plain numbers for the client", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow({ items: [itemRow()] }) as any);

    const cart = await getOrCreateCart(undefined, 7);
    const item = cart!.items[0]!;

    // A Decimal serialises as a string over JSON, which breaks arithmetic in the
    // basket UI — so the mapper must hand back numbers.
    expect(item.unitPrice).toBe(1499);
    expect(item.product.price).toBe(1499);
    expect(item.product.compareAtPrice).toBe(1999);
  });

  it("leaves compareAtPrice null when the product isn't discounted", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartRow({
        items: [itemRow({ product: { ...itemRow().product, compareAtPrice: null } })],
      }) as any
    );

    const cart = await getOrCreateCart(undefined, 7);

    expect(cart?.items[0]?.product.compareAtPrice).toBeNull();
  });

  it("uses an empty category string when the product has no category", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartRow({ items: [itemRow({ product: { ...itemRow().product, category: null } })] }) as any
    );

    const cart = await getOrCreateCart(undefined, 7);

    expect(cart?.items[0]?.product.category).toBe("");
  });
});

describe("addItemToCart", () => {
  const productRow = { id: 10, price: "1499.00" };

  it("refuses to work with neither a session token nor a signed-in user", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(null as any);

    await expect(addItemToCart(undefined, undefined, 10, 1)).rejects.toThrow(
      /sessionToken or userId is required/i
    );
  });

  it("rejects an unknown product instead of creating a dangling line item", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow() as any);
    mockedPrisma.product.findUnique.mockResolvedValue(null as any);

    await expect(addItemToCart(undefined, 7, 999, 1)).rejects.toThrow("Product not found");
    expect(mockedPrisma.cartItem.create).not.toHaveBeenCalled();
  });

  it("prices a new line from the product record, never from the caller", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow() as any);
    mockedPrisma.product.findUnique.mockResolvedValue(productRow as any);
    mockedPrisma.cartItem.findFirst.mockResolvedValue(null as any);
    mockedPrisma.cart.findUnique.mockResolvedValue(cartRow() as any);

    await addItemToCart(undefined, 7, 10, 3);

    expect(mockedPrisma.cartItem.create).toHaveBeenCalledWith({
      data: { cartId: 1, productId: 10, quantity: 3, unitPrice: "1499.00" },
    });
  });

  it("adds to the existing quantity when called relatively", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow() as any);
    mockedPrisma.product.findUnique.mockResolvedValue(productRow as any);
    mockedPrisma.cartItem.findFirst.mockResolvedValue({ id: 100, quantity: 2 } as any);
    mockedPrisma.cart.findUnique.mockResolvedValue(cartRow() as any);

    await addItemToCart(undefined, 7, 10, 3, true);

    expect(mockedPrisma.cartItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ quantity: 5 }) })
    );
  });

  it("sets the quantity outright when called absolutely", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow() as any);
    mockedPrisma.product.findUnique.mockResolvedValue(productRow as any);
    mockedPrisma.cartItem.findFirst.mockResolvedValue({ id: 100, quantity: 2 } as any);
    mockedPrisma.cart.findUnique.mockResolvedValue(cartRow() as any);

    await addItemToCart(undefined, 7, 10, 3, false);

    expect(mockedPrisma.cartItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ quantity: 3 }) })
    );
  });

  it("removes the line rather than storing a zero quantity", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow() as any);
    mockedPrisma.product.findUnique.mockResolvedValue(productRow as any);
    mockedPrisma.cartItem.findFirst.mockResolvedValue({ id: 100, quantity: 2 } as any);
    mockedPrisma.cart.findUnique.mockResolvedValue(cartRow() as any);

    await addItemToCart(undefined, 7, 10, 0, false);

    expect(mockedPrisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 100 } });
    expect(mockedPrisma.cartItem.update).not.toHaveBeenCalled();
  });

  it("removes the line when a relative decrement takes it below zero", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow() as any);
    mockedPrisma.product.findUnique.mockResolvedValue(productRow as any);
    mockedPrisma.cartItem.findFirst.mockResolvedValue({ id: 100, quantity: 1 } as any);
    mockedPrisma.cart.findUnique.mockResolvedValue(cartRow() as any);

    await addItemToCart(undefined, 7, 10, -5, true);

    expect(mockedPrisma.cartItem.delete).toHaveBeenCalledOnce();
  });

  it("re-reads the live price on every update, so a price change reaches the basket", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow() as any);
    mockedPrisma.product.findUnique.mockResolvedValue({ id: 10, price: "1299.00" } as any);
    mockedPrisma.cartItem.findFirst.mockResolvedValue({ id: 100, quantity: 1 } as any);
    mockedPrisma.cart.findUnique.mockResolvedValue(cartRow() as any);

    await addItemToCart(undefined, 7, 10, 1, true);

    expect(mockedPrisma.cartItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ unitPrice: "1299.00" }) })
    );
  });

  it("ignores a non-positive quantity for a product that isn't in the cart", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow() as any);
    mockedPrisma.product.findUnique.mockResolvedValue(productRow as any);
    mockedPrisma.cartItem.findFirst.mockResolvedValue(null as any);
    mockedPrisma.cart.findUnique.mockResolvedValue(cartRow() as any);

    await addItemToCart(undefined, 7, 10, 0);

    expect(mockedPrisma.cartItem.create).not.toHaveBeenCalled();
  });

  it("creates the cart on the fly for a guest adding their first item", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(null as any);
    mockedPrisma.cart.create.mockResolvedValue({ id: 42 } as any);
    mockedPrisma.product.findUnique.mockResolvedValue(productRow as any);
    mockedPrisma.cartItem.findFirst.mockResolvedValue(null as any);
    mockedPrisma.cart.findUnique.mockResolvedValue(cartRow({ id: 42 }) as any);

    await addItemToCart("guest-tok", undefined, 10, 1);

    expect(mockedPrisma.cart.create).toHaveBeenCalledWith({ data: { sessionToken: "guest-tok" } });
    expect(mockedPrisma.cartItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ cartId: 42 }) })
    );
  });
});

describe("removeItemFromCart", () => {
  it("hands back an empty cart instead of failing when there is nothing to remove from", async () => {
    mockedPrisma.cart.findFirst
      .mockResolvedValueOnce(null as any) // the removal lookup
      .mockResolvedValueOnce(null as any); // getOrCreateCart's own lookup
    mockedPrisma.cart.create.mockResolvedValue(cartRow() as any);

    const cart = await removeItemFromCart(undefined, 7, 10);

    expect(cart).not.toBeNull();
    expect(mockedPrisma.cartItem.deleteMany).not.toHaveBeenCalled();
  });

  it("clears every row for that product in the cart", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow() as any);
    mockedPrisma.cart.findUnique.mockResolvedValue(cartRow() as any);

    await removeItemFromCart(undefined, 7, 10);

    expect(mockedPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: 1, productId: 10 },
    });
  });

  it("scopes the removal to the guest cart when signed out", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(cartRow({ id: 5 }) as any);
    mockedPrisma.cart.findUnique.mockResolvedValue(cartRow({ id: 5 }) as any);

    await removeItemFromCart("guest-tok", undefined, 10);

    expect(mockedPrisma.cart.findFirst).toHaveBeenCalledWith({
      where: { sessionToken: "guest-tok" },
    });
    expect(mockedPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: 5, productId: 10 },
    });
  });
});
