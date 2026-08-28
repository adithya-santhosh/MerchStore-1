import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    cart: { findFirst: vi.fn() },
    coupon: { findFirst: vi.fn(), update: vi.fn() },
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    payment: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

// Resolved promises, not bare vi.fn() — the service attaches .catch() to these
// to fire them in the background, which would throw on an undefined return.
vi.mock("../../src/services/email.service", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendOrderStatusEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/services/settings.service", () => ({
  getSettings: vi.fn(),
}));

import prisma from "../../src/lib/prisma";
import { getSettings } from "../../src/services/settings.service";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "../../src/services/email.service";
import {
  prepareCheckout,
  finalizeOrder,
  cancelOrder,
  isCancellable,
  markPaymentRefunded,
  getOrdersByUser,
  getOrderById,
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  getRefundsOwed,
  updateOrderStatus,
  triggerOrderConfirmationEmail,
  CANCELLABLE_STATUSES,
  CreateOrderInput,
  PreparedCheckout,
} from "../../src/services/order.service";

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

// ─── Cancellation ─────────────────────────────────────────────────────────────

/** Minimal `tx` covering everything cancelOrder touches. */
const makeCancelTx = (order: any) => {
  const updatedOrder = { ...order, status: "CANCELLED", user: { email: "c@d.com" } };
  return {
    order: {
      findUnique: vi.fn().mockResolvedValue(order),
      update: vi.fn().mockResolvedValue(updatedOrder),
    },
    product: { update: vi.fn().mockResolvedValue({}) },
    coupon: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    payment: { update: vi.fn().mockResolvedValue({}) },
  };
};

const orderFixture = (over: Record<string, any> = {}) => ({
  id: 1,
  orderNumber: "ORD-2026-00001",
  userId: 7,
  status: "PENDING",
  totalAmount: 1999,
  couponCode: null,
  notes: null,
  items: [{ productId: 10, quantity: 2 }],
  payment: { id: 5, status: "PENDING", gateway: "cod", gatewayPaymentId: null },
  ...over,
});

describe("isCancellable", () => {
  it("allows cancellation only before dispatch", () => {
    expect(isCancellable("PENDING" as any)).toBe(true);
    expect(isCancellable("CONFIRMED" as any)).toBe(true);
    expect(isCancellable("PROCESSING" as any)).toBe(true);
    expect(isCancellable("SHIPPED" as any)).toBe(false);
    expect(isCancellable("DELIVERED" as any)).toBe(false);
    expect(isCancellable("CANCELLED" as any)).toBe(false);
  });
});

describe("cancelOrder", () => {
  it("puts the reserved stock back on the shelf", async () => {
    const tx = makeCancelTx(orderFixture());
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    await cancelOrder(1, { userId: 7 });

    // The checkout decremented 2 units; cancelling must return exactly 2.
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { stockQty: { increment: 2 } },
    });
  });

  it("returns the coupon redemption when one was used", async () => {
    const tx = makeCancelTx(orderFixture({ couponCode: "SAVE10" }));
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    await cancelOrder(1, { userId: 7 });

    expect(tx.coupon.updateMany).toHaveBeenCalledWith({
      where: { code: "SAVE10", usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  });

  it("refuses to cancel someone else's order, reporting it as not found", async () => {
    const tx = makeCancelTx(orderFixture({ userId: 999 }));
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    // Must not leak that the order exists.
    await expect(cancelOrder(1, { userId: 7 })).rejects.toThrow("Order not found");
    expect(tx.product.update).not.toHaveBeenCalled();
  });

  it("refuses a customer cancellation once the order has shipped", async () => {
    const tx = makeCancelTx(orderFixture({ status: "SHIPPED" }));
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    await expect(cancelOrder(1, { userId: 7 })).rejects.toThrow(/no longer be cancelled/i);
    expect(tx.product.update).not.toHaveBeenCalled();
  });

  it("lets an admin (no userId) cancel a shipped order", async () => {
    const tx = makeCancelTx(orderFixture({ status: "SHIPPED" }));
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    await cancelOrder(1);

    expect(tx.product.update).toHaveBeenCalled();
  });

  it("rejects double cancellation so stock is never credited twice", async () => {
    const tx = makeCancelTx(orderFixture({ status: "CANCELLED" }));
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    await expect(cancelOrder(1, { userId: 7 })).rejects.toThrow(/already been cancelled/i);
    expect(tx.product.update).not.toHaveBeenCalled();
  });

  it("leaves a captured payment as PAID so the refund owed stays visible", async () => {
    const paid = orderFixture({ payment: { id: 5, status: "PAID", gateway: "razorpay", gatewayPaymentId: "pay_x" } });
    const tx = makeCancelTx(paid);
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    await cancelOrder(1, { userId: 7 });

    // Marking it REFUNDED here would record a refund that never happened.
    expect(tx.payment.update).not.toHaveBeenCalled();
  });
});

describe("markPaymentRefunded", () => {
  const paidCancelledOrder = (over: Record<string, any> = {}) => ({
    id: 1,
    orderNumber: "ORD-2026-00001",
    status: "CANCELLED",
    totalAmount: 1999,
    notes: null,
    items: [],
    payment: { id: 5, status: "PAID", gateway: "razorpay", gatewayPaymentId: "pay_x" },
    ...over,
  });

  it("marks a captured payment refunded and records the gateway reference", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(paidCancelledOrder() as any);
    mockedPrisma.$transaction.mockImplementation(async (ops: any) => [
      {},
      { ...paidCancelledOrder(), payment: { id: 5, status: "REFUNDED" }, user: { email: "c@d.com" } },
    ]);

    await markPaymentRefunded(1, "rfnd_abc123");

    // The reference must be persisted so gateway and store records reconcile.
    const orderUpdateArg = mockedPrisma.order.update.mock.calls[0]?.[0];
    expect(orderUpdateArg.data.notes).toMatch(/rfnd_abc123/);
    expect(mockedPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { status: "REFUNDED" },
    });
  });

  it("refuses to refund the same payment twice", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(
      paidCancelledOrder({ payment: { id: 5, status: "REFUNDED", gateway: "razorpay" } }) as any
    );

    await expect(markPaymentRefunded(1)).rejects.toThrow(/already marked as refunded/i);
    expect(mockedPrisma.payment.update).not.toHaveBeenCalled();
  });

  it("refuses to refund a payment that was never captured", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(
      paidCancelledOrder({ payment: { id: 5, status: "PENDING", gateway: "cod" } }) as any
    );

    await expect(markPaymentRefunded(1)).rejects.toThrow(/only a captured payment/i);
    expect(mockedPrisma.payment.update).not.toHaveBeenCalled();
  });

  it("reports a missing order rather than throwing something opaque", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(null as any);
    await expect(markPaymentRefunded(999)).rejects.toThrow("Order not found");
  });
});

// ─── Customer order queries ───────────────────────────────────────────────────

/** An order row shaped the way the customer-facing includes return it. */
const storedOrder = (over: Record<string, any> = {}) => ({
  id: 1,
  orderNumber: "ORD-2026-00001",
  status: "CONFIRMED",
  subtotal: "1000.00",
  discountAmount: "100.00",
  shippingCost: "0.00",
  taxAmount: "0.00",
  totalAmount: "900.00",
  couponCode: "SAVE10",
  notes: null,
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-02"),
  shippingAddress: { id: 1, city: "Bengaluru" },
  payment: {
    gateway: "razorpay",
    amount: "900.00",
    status: "PAID",
    paidAt: new Date("2026-06-01"),
    gatewayPaymentId: "pay_abc",
  },
  shipment: null,
  items: [
    {
      id: 1,
      productId: 10,
      productName: "Roof Rack",
      quantity: 2,
      unitPrice: "500.00",
      totalPrice: "1000.00",
    },
  ],
  ...over,
});

describe("getOrdersByUser", () => {
  it("returns only the caller's own orders, newest first", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([storedOrder()] as any);

    await getOrdersByUser(7);

    expect(mockedPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7 }, orderBy: { createdAt: "desc" } })
    );
  });

  it("converts every money column to a number", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([storedOrder()] as any);

    const [order] = await getOrdersByUser(7);

    expect(order!.subtotal).toBe(1000);
    expect(order!.discountAmount).toBe(100);
    expect(order!.totalAmount).toBe(900);
    expect(order!.items[0]!.unitPrice).toBe(500);
  });

  it("reports a null payment and shipment before either exists", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([
      storedOrder({ payment: null, shipment: null }),
    ] as any);

    const [order] = await getOrdersByUser(7);

    expect(order!.payment).toBeNull();
    expect(order!.shipment).toBeNull();
  });

  it("surfaces tracking details once the order has shipped", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([
      storedOrder({
        shipment: {
          carrier: "Delhivery",
          trackingNumber: "DL123",
          status: "SHIPPED",
          shippedAt: new Date("2026-06-03"),
          deliveredAt: null,
        },
      }),
    ] as any);

    const [order] = await getOrdersByUser(7);

    expect(order!.shipment).toMatchObject({ carrier: "Delhivery", trackingNumber: "DL123" });
  });

  it("returns an empty list for a customer with no orders", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    expect(await getOrdersByUser(7)).toEqual([]);
  });
});

describe("getOrderById", () => {
  it("scopes the lookup to the requesting customer", async () => {
    mockedPrisma.order.findFirst.mockResolvedValue(storedOrder() as any);

    await getOrderById(1, 7);

    expect(mockedPrisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, userId: 7 } })
    );
  });

  it("reports someone else's order as simply not found", async () => {
    mockedPrisma.order.findFirst.mockResolvedValue(null as any);

    // Distinguishing "not yours" from "does not exist" would let a customer
    // enumerate which order ids are real.
    await expect(getOrderById(1, 7)).rejects.toThrow("Order not found");
  });

  it("includes a product image on each line for the order detail page", async () => {
    mockedPrisma.order.findFirst.mockResolvedValue(
      storedOrder({
        items: [
          {
            ...storedOrder().items[0],
            product: {
              images: [
                { imageUrl: "/alt.jpg", isPrimary: false },
                { imageUrl: "/hero.jpg", isPrimary: true },
              ],
            },
          },
        ],
      }) as any
    );

    const order = await getOrderById(1, 7);

    expect(order.items[0]!.imageUrl).toBe("/hero.jpg");
  });

  it("reports a null image for a line whose product has none", async () => {
    mockedPrisma.order.findFirst.mockResolvedValue(storedOrder() as any);

    const order = await getOrderById(1, 7);

    expect(order.items[0]!.imageUrl).toBeNull();
  });
});

// ─── Admin order queries ──────────────────────────────────────────────────────

describe("getAllOrdersAdmin", () => {
  const stub = (orders: any[] = [], total = orders.length) => {
    mockedPrisma.order.findMany.mockResolvedValue(orders as any);
    mockedPrisma.order.count.mockResolvedValue(total as any);
  };

  it("defaults to 100 orders a page", async () => {
    stub();

    const result = await getAllOrdersAdmin();

    expect(result.limit).toBe(100);
    expect(mockedPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 100 })
    );
  });

  it("caps the page size at 200 so one request cannot pull the whole table", async () => {
    stub();

    expect((await getAllOrdersAdmin({ limit: 100_000 })).limit).toBe(200);
  });

  it("clamps a page below 1 to the first page", async () => {
    stub();

    expect((await getAllOrdersAdmin({ page: -5 })).page).toBe(1);
  });

  it("offsets correctly for a later page", async () => {
    stub();

    await getAllOrdersAdmin({ page: 3, limit: 50 });

    expect(mockedPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 100, take: 50 })
    );
  });

  it("reports the page count from the unpaged total", async () => {
    stub([], 250);

    const result = await getAllOrdersAdmin({ limit: 100 });

    expect(result.total).toBe(250);
    expect(result.totalPages).toBe(3);
  });

  it("lists the newest orders first", async () => {
    stub();

    await getAllOrdersAdmin();

    expect(mockedPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    );
  });
});

describe("getOrderByIdAdmin", () => {
  const adminOrder = (over: Record<string, any> = {}) => ({
    ...storedOrder(),
    user: {
      id: 7,
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+91 90000 00000",
    },
    items: [
      {
        ...storedOrder().items[0],
        product: { images: [{ imageUrl: "/hero.jpg", isPrimary: true }] },
      },
    ],
    ...over,
  });

  it("reports a missing order rather than returning null", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(null as any);

    await expect(getOrderByIdAdmin(999)).rejects.toThrow("Order not found");
  });

  it("gives the operator the customer's contact details", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(adminOrder() as any);

    const order = await getOrderByIdAdmin(1);

    expect(order.customer).toEqual({
      id: 7,
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+91 90000 00000",
    });
  });

  it("includes the internal notes the customer view omits", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(
      adminOrder({ notes: "Refund recorded on 2026-06-05" }) as any
    );

    const order = await getOrderByIdAdmin(1);

    expect(order.notes).toContain("Refund recorded");
  });

  it("converts the payment amount to a number", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(adminOrder() as any);

    const order = await getOrderByIdAdmin(1);

    expect(order.payment).toMatchObject({ gateway: "razorpay", amount: 900, status: "PAID" });
  });

  it("reports a null shipment before dispatch", async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(adminOrder({ shipment: null }) as any);

    expect((await getOrderByIdAdmin(1)).shipment).toBeNull();
  });
});

// ─── Refund queue ─────────────────────────────────────────────────────────────

describe("getRefundsOwed", () => {
  const refundRow = (over: Record<string, any> = {}) => ({
    id: 1,
    orderNumber: "ORD-2026-00001",
    totalAmount: "1999.00",
    updatedAt: new Date("2026-06-05"),
    user: { id: 7, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
    payment: { gateway: "razorpay", amount: "1999.00", gatewayPaymentId: "pay_abc" },
    ...over,
  });

  it("selects exactly the cancelled orders whose payment was captured", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    await getRefundsOwed();

    // This pairing IS the outstanding-refund queue — no extra schema state.
    const where = (mockedPrisma.order.findMany.mock.calls[0]?.[0] as any).where;
    expect(where).toEqual({ status: "CANCELLED", payment: { status: "PAID" } });
  });

  it("shows the most recently cancelled order first", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    await getRefundsOwed();

    expect(mockedPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { updatedAt: "desc" } })
    );
  });

  it("gives the operator the gateway payment id needed to issue the refund", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([refundRow()] as any);

    const [refund] = await getRefundsOwed();

    expect(refund!.payment).toEqual({
      gateway: "razorpay",
      amount: 1999,
      gatewayPaymentId: "pay_abc",
    });
  });

  it("reports the amount owed and who is owed it", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([refundRow()] as any);

    const [refund] = await getRefundsOwed();

    expect(refund!.totalAmount).toBe(1999);
    expect(refund!.customer).toEqual({
      id: 7,
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
  });

  it("returns an empty queue when nothing is owed", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    expect(await getRefundsOwed()).toEqual([]);
  });
});

// ─── Status transitions ───────────────────────────────────────────────────────

describe("CANCELLABLE_STATUSES", () => {
  it("stops at dispatch, matching the published refund policy", () => {
    expect(CANCELLABLE_STATUSES).toEqual(["PENDING", "CONFIRMED", "PROCESSING"]);
  });
});

describe("updateOrderStatus", () => {
  const updatedRow = (status: string) => ({
    ...storedOrder({ status }),
    user: { id: 7, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", phone: null },
  });

  it("rejects a status that isn't in the enum", async () => {
    await expect(updateOrderStatus(1, "TELEPORTED")).rejects.toThrow(/Invalid status/i);
    expect(mockedPrisma.order.update).not.toHaveBeenCalled();
  });

  it("names the valid statuses in the error, so the operator can correct it", async () => {
    await expect(updateOrderStatus(1, "nope")).rejects.toThrow(/PENDING/);
  });

  it("writes a valid status and notifies the customer", async () => {
    mockedPrisma.order.update.mockResolvedValue(updatedRow("SHIPPED") as any);

    await updateOrderStatus(1, "SHIPPED");

    expect(mockedPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, data: { status: "SHIPPED" } })
    );
    expect(sendOrderStatusEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "ada@example.com", newStatus: "SHIPPED" })
    );
  });

  it("routes a cancellation through cancelOrder so stock is restored", async () => {
    const tx = makeCancelTx(orderFixture());
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    await updateOrderStatus(1, "CANCELLED");

    // A bare status write here previously lost the reserved stock forever.
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { stockQty: { increment: 2 } },
    });
    expect(mockedPrisma.order.update).not.toHaveBeenCalled();
  });

  it("lets an admin cancel from any status through this path", async () => {
    const tx = makeCancelTx(orderFixture({ status: "DELIVERED" }));
    mockedPrisma.$transaction.mockImplementation((cb: any) => cb(tx));

    await expect(updateOrderStatus(1, "CANCELLED")).resolves.toBeTruthy();
  });

  it("still updates the status when the notification email fails", async () => {
    mockedPrisma.order.update.mockResolvedValue(updatedRow("DELIVERED") as any);
    vi.mocked(sendOrderStatusEmail).mockRejectedValueOnce(new Error("SMTP down"));

    await expect(updateOrderStatus(1, "DELIVERED")).resolves.toBeTruthy();
  });

  it("skips the email when the order has no customer address on file", async () => {
    mockedPrisma.order.update.mockResolvedValue({
      ...updatedRow("DELIVERED"),
      user: { id: 7, firstName: "Ada", lastName: "L", email: null, phone: null },
    } as any);

    await updateOrderStatus(1, "DELIVERED");

    expect(sendOrderStatusEmail).not.toHaveBeenCalled();
  });
});

// ─── Confirmation email idempotency ───────────────────────────────────────────

describe("triggerOrderConfirmationEmail", () => {
  it("claims the send with a conditional update before doing anything", async () => {
    mockedPrisma.order.updateMany.mockResolvedValue({ count: 1 } as any);
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 1,
      user: { email: "ada@example.com" },
      items: [],
      shippingAddress: {},
    } as any);

    await triggerOrderConfirmationEmail(1);

    // The `confirmationEmailSentAt: null` predicate is what makes concurrent
    // callers race for a single send instead of both sending.
    expect(mockedPrisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: 1, confirmationEmailSentAt: null },
      data: { confirmationEmailSentAt: expect.any(Date) },
    });
  });

  it("sends the confirmation when it wins the claim", async () => {
    mockedPrisma.order.updateMany.mockResolvedValue({ count: 1 } as any);
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 1,
      user: { email: "ada@example.com" },
      items: [],
      shippingAddress: {},
    } as any);

    await triggerOrderConfirmationEmail(1);

    expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "ada@example.com" })
    );
  });

  it("sends nothing on a second call for the same order", async () => {
    mockedPrisma.order.updateMany.mockResolvedValue({ count: 0 } as any);

    await triggerOrderConfirmationEmail(1);

    expect(mockedPrisma.order.findUnique).not.toHaveBeenCalled();
    expect(sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });

  it("sends nothing when the order has no email address", async () => {
    mockedPrisma.order.updateMany.mockResolvedValue({ count: 1 } as any);
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 1,
      user: { email: null },
      items: [],
    } as any);

    await triggerOrderConfirmationEmail(1);

    expect(sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });

  it("swallows a database failure rather than breaking the checkout that called it", async () => {
    mockedPrisma.order.updateMany.mockRejectedValue(new Error("connection lost"));

    // Fire-and-forget from checkout: a mail bookkeeping error must not surface
    // to a customer who has already paid.
    await expect(triggerOrderConfirmationEmail(1)).resolves.toBeUndefined();
  });
});
