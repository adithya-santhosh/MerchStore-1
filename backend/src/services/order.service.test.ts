import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/prisma", () => ({
  default: {
    cart: { findFirst: vi.fn() },
    coupon: { findFirst: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("./email.service", () => ({
  sendOrderConfirmationEmail: vi.fn(),
  sendOrderStatusEmail: vi.fn(),
}));

vi.mock("./settings.service", () => ({
  getSettings: vi.fn(),
}));

import prisma from "../lib/prisma";
import { getSettings } from "./settings.service";
import { prepareCheckout, finalizeOrder, CreateOrderInput, PreparedCheckout } from "./order.service";

const mockedPrisma = vi.mocked(prisma, true);
const mockedGetSettings = vi.mocked(getSettings);

/** Store config helper — defaults to the live setup: no GST, no shipping. */
const settingsOf = (over: Partial<{ tax_rate: number; shipping_limit: number; shipping_cost: number }> = {}) => ({
  tax_rate: 0,
  shipping_limit: 0,
  shipping_cost: 0,
  membership_fee: 999,
  ...over,
});

const baseInput: CreateOrderInput = {
  userId: 1,
  address: {
    addressLine1: "221B Baker Street",
    city: "London",
    state: "LDN",
    postalCode: "560001",
  },
  paymentMethod: "cod",
};

const cartWithOneItem = (opts: { quantity: number; unitPrice: number; stockQty: number }) => ({
  id: 1,
  items: [
    {
      id: 1,
      productId: 10,
      quantity: opts.quantity,
      unitPrice: opts.unitPrice,
      product: { id: 10, name: "Widget", isActive: true, stockQty: opts.stockQty },
    },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetSettings.mockResolvedValue(settingsOf());
});

describe("prepareCheckout", () => {
  it("throws when the cart is empty", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(null as any);

    await expect(prepareCheckout(baseInput)).rejects.toThrow(/cart is empty/i);
  });

  it("charges exactly the listed price — no GST, no shipping added", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartWithOneItem({ quantity: 2, unitPrice: 100, stockQty: 5 }) as any
    );

    const result = await prepareCheckout(baseInput);

    expect(result.subtotal).toBe(200);
    expect(result.taxAmount).toBe(0);
    expect(result.shippingCost).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.totalAmount).toBe(200); // total === subtotal
  });

  it("derives tax and shipping from store settings, not from the caller", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartWithOneItem({ quantity: 2, unitPrice: 100, stockQty: 5 }) as any
    );
    mockedGetSettings.mockResolvedValue(
      settingsOf({ tax_rate: 0.18, shipping_limit: 499, shipping_cost: 99 })
    );

    // Client-supplied tax/shipping must be ignored entirely — this is what
    // previously let the displayed total drift from the charged total.
    const result = await prepareCheckout({
      ...baseInput,
      taxRate: 0.99,
      shippingCost: 9999,
    } as CreateOrderInput);

    expect(result.taxAmount).toBeCloseTo(36); // 18% of 200, from settings
    expect(result.shippingCost).toBe(99);     // below the 499 threshold
    expect(result.totalAmount).toBeCloseTo(200 + 99 + 36);
  });

  it("waives shipping once the free-shipping threshold is met", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartWithOneItem({ quantity: 1, unitPrice: 600, stockQty: 5 }) as any
    );
    mockedGetSettings.mockResolvedValue(
      settingsOf({ shipping_limit: 499, shipping_cost: 99 })
    );

    const result = await prepareCheckout(baseInput);

    expect(result.shippingCost).toBe(0);
    expect(result.totalAmount).toBe(600);
  });

  it("rejects an item that exceeds available stock", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartWithOneItem({ quantity: 5, unitPrice: 100, stockQty: 2 }) as any
    );

    await expect(prepareCheckout(baseInput)).rejects.toThrow(/only has 2 unit/i);
  });

  it("applies a valid percent coupon", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartWithOneItem({ quantity: 1, unitPrice: 100, stockQty: 5 }) as any
    );
    mockedPrisma.coupon.findFirst.mockResolvedValue({
      code: "SAVE10",
      type: "percent",
      value: 10,
      isActive: true,
      expiresAt: null,
      maxUses: null,
      usedCount: 0,
      minOrderAmount: null,
    } as any);

    const result = await prepareCheckout({ ...baseInput, couponCode: "save10" });

    expect(result.discountAmount).toBe(10); // 10% of 100
    expect(result.resolvedCouponCode).toBe("SAVE10");
  });

  it("ignores an expired coupon", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartWithOneItem({ quantity: 1, unitPrice: 100, stockQty: 5 }) as any
    );
    mockedPrisma.coupon.findFirst.mockResolvedValue({
      code: "OLD10",
      type: "percent",
      value: 10,
      isActive: true,
      expiresAt: new Date("2000-01-01"),
      maxUses: null,
      usedCount: 0,
      minOrderAmount: null,
    } as any);

    const result = await prepareCheckout({ ...baseInput, couponCode: "old10" });

    expect(result.discountAmount).toBe(0);
    expect(result.resolvedCouponCode).toBeUndefined();
  });
});

// A fake `tx` that satisfies everything finalizeOrder touches inside
// prisma.$transaction. Individual tests override the methods they care about.
const makeTx = (overrides: Partial<Record<string, any>> = {}) => ({
  address: { create: vi.fn().mockResolvedValue({ id: 1 }) },
  order: {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 1, items: [], payment: {}, shippingAddress: {} }),
  },
  product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
  coupon: { update: vi.fn() },
  cartItem: { deleteMany: vi.fn() },
  ...overrides,
});

describe("finalizeOrder — stock race guard", () => {
  const checkout: PreparedCheckout = {
    cart: cartWithOneItem({ quantity: 1, unitPrice: 100, stockQty: 1 }) as any,
    subtotal: 100,
    discountAmount: 0,
    resolvedCouponCode: undefined,
    taxAmount: 0,
    shippingCost: 0,
    totalAmount: 100,
  };

  it("rolls back when a concurrent order already claimed the stock", async () => {
    const tx = makeTx({ product: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) } });
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    await expect(finalizeOrder(checkout, baseInput)).rejects.toThrow(/no longer has enough stock/i);

    // The decrement must be conditioned on current stock (gte), not unconditional —
    // this is the guard that prevents overselling under concurrent checkouts.
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 10, stockQty: { gte: 1 } },
      data: { stockQty: { decrement: 1 } },
    });
  });

  it("succeeds and decrements stock when enough is available", async () => {
    const tx = makeTx();
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    const order = await finalizeOrder(checkout, baseInput);

    expect(order.id).toBe(1);
    expect(tx.product.updateMany).toHaveBeenCalledTimes(1);
  });

  it("retries order number generation on collision instead of giving up after one try", async () => {
    const tx = makeTx({
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: 999 }) // first generated number already exists
          .mockResolvedValueOnce(null),         // second one is free
        create: vi.fn().mockResolvedValue({ id: 1, items: [], payment: {}, shippingAddress: {} }),
      },
    });
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    await finalizeOrder(checkout, baseInput);

    expect(tx.order.findUnique).toHaveBeenCalledTimes(2);
  });
});
