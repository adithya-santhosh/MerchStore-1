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

import prisma from "../lib/prisma";
import { prepareCheckout, finalizeOrder, CreateOrderInput, PreparedCheckout } from "./order.service";

const mockedPrisma = vi.mocked(prisma, true);

const baseInput: CreateOrderInput = {
  userId: 1,
  address: {
    addressLine1: "221B Baker Street",
    city: "London",
    state: "LDN",
    postalCode: "560001",
  },
  paymentMethod: "cod",
  taxRate: 0.18,
  shippingCost: 50,
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
});

describe("prepareCheckout", () => {
  it("throws when the cart is empty", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(null as any);

    await expect(prepareCheckout(baseInput)).rejects.toThrow(/cart is empty/i);
  });

  it("computes subtotal, tax, and total from cart items", async () => {
    mockedPrisma.cart.findFirst.mockResolvedValue(
      cartWithOneItem({ quantity: 2, unitPrice: 100, stockQty: 5 }) as any
    );

    const result = await prepareCheckout(baseInput);

    expect(result.subtotal).toBe(200);
    expect(result.taxAmount).toBeCloseTo(36); // 18% of 200
    expect(result.totalAmount).toBeCloseTo(200 + 50 + 36); // subtotal + shipping + tax
    expect(result.discountAmount).toBe(0);
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
    taxAmount: 18,
    shippingCost: 50,
    totalAmount: 168,
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
