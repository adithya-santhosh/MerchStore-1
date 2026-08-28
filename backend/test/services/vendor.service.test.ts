import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    vendor: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    order: { findMany: vi.fn(), update: vi.fn() },
    orderItem: { findFirst: vi.fn() },
    shipment: { upsert: vi.fn() },
    user: { create: vi.fn() },
    product: { update: vi.fn() },
  },
}));

import prisma from "../../src/lib/prisma";
import {
  getVendorByUserId,
  getVendorOrders,
  submitVendorShipment,
  createVendor,
  getAllVendors,
  assignProductToVendor,
} from "../../src/services/vendor.service";

const mockedPrisma = vi.mocked(prisma, true);

const vendorRow = (productIds: number[] = [10, 11]) => ({
  id: 3,
  userId: 7,
  companyName: "Overland Supply Co",
  products: productIds.map((id) => ({ id })),
});

const orderRow = (over: Record<string, any> = {}) => ({
  id: 1,
  orderNumber: "ORD-2026-00001",
  status: "CONFIRMED",
  createdAt: new Date("2026-05-01"),
  user: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  shippingAddress: { city: "Bengaluru" },
  items: [
    {
      productId: 10,
      productName: "Roof Rack",
      quantity: 2,
      unitPrice: "1499.00",
      product: { id: 10, name: "Roof Rack", images: [{ imageUrl: "/hero.jpg" }] },
    },
  ],
  shipment: null,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getVendorByUserId", () => {
  it("looks the vendor profile up by the signed-in user's id", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);

    await getVendorByUserId(7);

    expect(mockedPrisma.vendor.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7 } })
    );
  });

  it("returns null for a user with no vendor profile", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(null as any);

    expect(await getVendorByUserId(99)).toBeNull();
  });
});

describe("getVendorOrders", () => {
  it("returns nothing for a vendor that does not exist", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(null as any);

    expect(await getVendorOrders(999)).toEqual([]);
    expect(mockedPrisma.order.findMany).not.toHaveBeenCalled();
  });

  it("returns nothing — without querying orders — for a vendor with no products", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow([]) as any);

    expect(await getVendorOrders(3)).toEqual([]);
    expect(mockedPrisma.order.findMany).not.toHaveBeenCalled();
  });

  it("finds only orders containing at least one of the vendor's products", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    await getVendorOrders(3);

    const call = mockedPrisma.order.findMany.mock.calls[0]?.[0] as any;
    expect(call.where).toEqual({ items: { some: { productId: { in: [10, 11] } } } });
  });

  it("narrows the line items to the vendor's own products", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    await getVendorOrders(3);

    const call = mockedPrisma.order.findMany.mock.calls[0]?.[0] as any;
    // Without this a vendor would see every other vendor's lines on a shared order.
    expect(call.include.items.where).toEqual({ productId: { in: [10, 11] } });
  });

  it("exposes the customer's name and email for fulfilment, and nothing more", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.order.findMany.mockResolvedValue([orderRow()] as any);

    const [order] = await getVendorOrders(3);

    expect(order!.customer).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
    });
  });

  it("converts line prices to numbers and pulls the primary image", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.order.findMany.mockResolvedValue([orderRow()] as any);

    const [order] = await getVendorOrders(3);

    expect(order!.items[0]!.unitPrice).toBe(1499);
    expect(order!.items[0]!.imageUrl).toBe("/hero.jpg");
  });

  it("reports a null image when the product has no picture on file", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.order.findMany.mockResolvedValue([
      orderRow({
        items: [{ ...orderRow().items[0], product: { id: 10, name: "Roof Rack", images: [] } }],
      }),
    ] as any);

    const [order] = await getVendorOrders(3);

    expect(order!.items[0]!.imageUrl).toBeNull();
  });

  it("reports a null shipment before the order has been dispatched", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.order.findMany.mockResolvedValue([orderRow()] as any);

    const [order] = await getVendorOrders(3);

    expect(order!.shipment).toBeNull();
  });

  it("surfaces the tracking details once a shipment exists", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.order.findMany.mockResolvedValue([
      orderRow({
        shipment: {
          carrier: "Delhivery",
          trackingNumber: "DL123",
          status: "SHIPPED",
          shippedAt: new Date("2026-05-02"),
          deliveredAt: null,
        },
      }),
    ] as any);

    const [order] = await getVendorOrders(3);

    expect(order!.shipment).toMatchObject({ carrier: "Delhivery", trackingNumber: "DL123" });
  });

  it("lists the newest orders first", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    await getVendorOrders(3);

    const call = mockedPrisma.order.findMany.mock.calls[0]?.[0] as any;
    expect(call.orderBy).toEqual({ createdAt: "desc" });
  });
});

describe("submitVendorShipment", () => {
  const shipmentInput = { carrier: "Delhivery", trackingNumber: "DL123" };

  it("rejects a vendor id that does not resolve", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(null as any);

    await expect(submitVendorShipment(999, 1, shipmentInput)).rejects.toThrow("Vendor not found");
  });

  it("refuses to ship an order containing none of the vendor's products", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.orderItem.findFirst.mockResolvedValue(null as any);

    await expect(submitVendorShipment(3, 1, shipmentInput)).rejects.toThrow(
      /does not belong to this vendor/i
    );
    expect(mockedPrisma.shipment.upsert).not.toHaveBeenCalled();
    expect(mockedPrisma.order.update).not.toHaveBeenCalled();
  });

  it("checks ownership against the vendor's product ids", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.orderItem.findFirst.mockResolvedValue({ id: 1 } as any);
    mockedPrisma.shipment.upsert.mockResolvedValue({} as any);
    mockedPrisma.order.update.mockResolvedValue({} as any);

    await submitVendorShipment(3, 1, shipmentInput);

    expect(mockedPrisma.orderItem.findFirst).toHaveBeenCalledWith({
      where: { orderId: 1, productId: { in: [10, 11] } },
    });
  });

  it("records the tracking details and stamps the dispatch time", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.orderItem.findFirst.mockResolvedValue({ id: 1 } as any);
    mockedPrisma.shipment.upsert.mockResolvedValue({ id: 5 } as any);
    mockedPrisma.order.update.mockResolvedValue({} as any);

    await submitVendorShipment(3, 1, shipmentInput);

    const call = mockedPrisma.shipment.upsert.mock.calls[0]?.[0] as any;
    expect(call.where).toEqual({ orderId: 1 });
    expect(call.create).toMatchObject({ carrier: "Delhivery", trackingNumber: "DL123", status: "SHIPPED" });
    expect(call.create.shippedAt).toBeInstanceOf(Date);
  });

  it("upserts, so a corrected tracking number overwrites the old one", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.orderItem.findFirst.mockResolvedValue({ id: 1 } as any);
    mockedPrisma.shipment.upsert.mockResolvedValue({ id: 5 } as any);
    mockedPrisma.order.update.mockResolvedValue({} as any);

    await submitVendorShipment(3, 1, { carrier: "BlueDart", trackingNumber: "BD999" });

    const call = mockedPrisma.shipment.upsert.mock.calls[0]?.[0] as any;
    expect(call.update).toMatchObject({ carrier: "BlueDart", trackingNumber: "BD999" });
  });

  it("moves the order to SHIPPED so the customer sees it dispatched", async () => {
    mockedPrisma.vendor.findUnique.mockResolvedValue(vendorRow() as any);
    mockedPrisma.orderItem.findFirst.mockResolvedValue({ id: 1 } as any);
    mockedPrisma.shipment.upsert.mockResolvedValue({ id: 5 } as any);
    mockedPrisma.order.update.mockResolvedValue({} as any);

    await submitVendorShipment(3, 1, shipmentInput);

    expect(mockedPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: "SHIPPED" },
    });
  });
});

describe("createVendor", () => {
  const input = {
    email: "vendor@example.com",
    password: "supersecret1",
    firstName: "Vik",
    lastName: "Rao",
    companyName: "Overland Supply Co",
  };

  it("stores a bcrypt hash, never the plaintext password", async () => {
    mockedPrisma.user.create.mockResolvedValue({
      id: 8,
      ...input,
      vendor: { id: 3, companyName: input.companyName },
    } as any);

    await createVendor(input);

    const data = (mockedPrisma.user.create.mock.calls[0]?.[0] as any).data;
    expect(data.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(data.passwordHash).not.toBe(input.password);
    expect(data).not.toHaveProperty("password");
  });

  it("creates the account with the VENDOR role", async () => {
    mockedPrisma.user.create.mockResolvedValue({
      id: 8,
      ...input,
      vendor: { id: 3, companyName: input.companyName },
    } as any);

    await createVendor(input);

    const data = (mockedPrisma.user.create.mock.calls[0]?.[0] as any).data;
    expect(data.role).toBe("VENDOR");
  });

  it("marks an admin-created vendor's email as already verified", async () => {
    mockedPrisma.user.create.mockResolvedValue({
      id: 8,
      ...input,
      vendor: { id: 3, companyName: input.companyName },
    } as any);

    await createVendor(input);

    const data = (mockedPrisma.user.create.mock.calls[0]?.[0] as any).data;
    // No inbox round-trip: an admin vouched for this account at creation.
    expect(data.emailVerified).toBe(true);
  });

  it("creates the vendor profile alongside the user in one write", async () => {
    mockedPrisma.user.create.mockResolvedValue({
      id: 8,
      ...input,
      vendor: { id: 3, companyName: input.companyName },
    } as any);

    await createVendor(input);

    const data = (mockedPrisma.user.create.mock.calls[0]?.[0] as any).data;
    expect(data.vendor).toEqual({ create: { companyName: "Overland Supply Co" } });
  });

  it("returns the identifiers the admin UI needs, without the hash", async () => {
    mockedPrisma.user.create.mockResolvedValue({
      id: 8,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: "$2b$12$whatever",
      vendor: { id: 3, companyName: input.companyName },
    } as any);

    const result = await createVendor(input);

    expect(result).toEqual({
      id: 8,
      email: "vendor@example.com",
      firstName: "Vik",
      lastName: "Rao",
      companyName: "Overland Supply Co",
      vendorId: 3,
    });
  });
});

describe("getAllVendors", () => {
  const stub = (vendors: any[], total = vendors.length) => {
    mockedPrisma.vendor.findMany.mockResolvedValue(vendors as any);
    mockedPrisma.vendor.count.mockResolvedValue(total as any);
  };

  it("defaults to 100 per page", async () => {
    stub([]);

    const result = await getAllVendors();

    expect(result.limit).toBe(100);
    expect(mockedPrisma.vendor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 100 })
    );
  });

  it("caps the page size at 200", async () => {
    stub([]);

    const result = await getAllVendors({ limit: 10_000 });

    expect(result.limit).toBe(200);
  });

  it("clamps a negative page to the first one", async () => {
    stub([]);

    const result = await getAllVendors({ page: -2 });

    expect(result.page).toBe(1);
  });

  it("always reports at least one page, even with no vendors", async () => {
    stub([], 0);

    const result = await getAllVendors();

    // 0 pages would make the pager render nothing at all.
    expect(result.totalPages).toBe(1);
  });

  it("flattens the linked user and counts the assigned products", async () => {
    stub([
      {
        id: 3,
        companyName: "Overland Supply Co",
        userId: 7,
        user: { id: 7, email: "v@example.com", firstName: "Vik", lastName: "Rao" },
        products: [{ id: 10, name: "Roof Rack" }, { id: 11, name: "Ladder" }],
      },
    ]);

    const result = await getAllVendors();

    expect(result.vendors[0]).toMatchObject({
      id: 3,
      companyName: "Overland Supply Co",
      email: "v@example.com",
      productCount: 2,
    });
  });

  it("selects only safe user columns", async () => {
    stub([]);

    await getAllVendors();

    const include = (mockedPrisma.vendor.findMany.mock.calls[0]?.[0] as any).include;
    expect(include.user.select).not.toHaveProperty("passwordHash");
  });
});

describe("assignProductToVendor", () => {
  it("assigns a product to a vendor", async () => {
    mockedPrisma.product.update.mockResolvedValue({} as any);

    await assignProductToVendor(10, 3);

    expect(mockedPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { vendorId: 3 },
    });
  });

  it("unassigns when passed null", async () => {
    mockedPrisma.product.update.mockResolvedValue({} as any);

    await assignProductToVendor(10, null);

    expect(mockedPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { vendorId: null },
    });
  });
});
