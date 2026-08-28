import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    user: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    order: { groupBy: vi.fn(), aggregate: vi.fn() },
  },
}));

import prisma from "../../src/lib/prisma";
import { getAllCustomers, getCustomerById, getCustomerStats } from "../../src/services/customer.service";

const mockedPrisma = vi.mocked(prisma, true);

const userRow = (over: Record<string, any> = {}) => ({
  id: 7,
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Lovelace",
  phone: "+91 90000 00000",
  role: "CUSTOMER",
  createdAt: new Date("2026-01-15"),
  _count: { orders: 3, reviews: 1, wishlist: 2 },
  ...over,
});

/** Wires up the two reads getAllCustomers makes. */
const stubList = (users: any[], total = users.length, spent: any[] = []) => {
  mockedPrisma.user.findMany.mockResolvedValue(users as any);
  mockedPrisma.user.count.mockResolvedValue(total as any);
  mockedPrisma.order.groupBy.mockResolvedValue(spent as any);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAllCustomers — paging", () => {
  it("defaults to page 1 with 15 per page", async () => {
    stubList([]);

    const result = await getAllCustomers({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(15);
    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 15 })
    );
  });

  it("caps the page size at 100 so one request cannot pull the whole table", async () => {
    stubList([]);

    const result = await getAllCustomers({ limit: 5000 });

    expect(result.limit).toBe(100);
  });

  it("treats a page below 1 as page 1", async () => {
    stubList([]);

    const result = await getAllCustomers({ page: -3 });

    expect(result.page).toBe(1);
    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 })
    );
  });

  it("treats a limit below 1 as 1 rather than returning nothing", async () => {
    stubList([]);

    const result = await getAllCustomers({ limit: 0 });

    expect(result.limit).toBe(15); // 0 is falsy, so the default applies
  });

  it("offsets correctly for a later page", async () => {
    stubList([]);

    await getAllCustomers({ page: 3, limit: 20 });

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 })
    );
  });

  it("reports the page count from the unpaged total", async () => {
    stubList([], 47);

    const result = await getAllCustomers({ limit: 15 });

    expect(result.total).toBe(47);
    expect(result.totalPages).toBe(4);
  });
});

describe("getAllCustomers — search and sort", () => {
  it("searches across name, email and phone", async () => {
    stubList([]);

    await getAllCustomers({ search: " ada " });

    const where = (mockedPrisma.user.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.OR.map((c: any) => Object.keys(c)[0])).toEqual([
      "firstName",
      "lastName",
      "email",
      "phone",
    ]);
    expect(where.OR[0].firstName.contains).toBe("ada"); // trimmed
    expect(where.OR[0].firstName.mode).toBe("insensitive");
  });

  it("applies no filter for a whitespace-only search", async () => {
    stubList([]);

    await getAllCustomers({ search: "   " });

    const where = (mockedPrisma.user.findMany.mock.calls[0]?.[0] as any).where;
    expect(where).toEqual({});
  });

  it("defaults to newest customers first", async () => {
    stubList([]);

    await getAllCustomers({});

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    );
  });

  it("ignores a sort field that isn't whitelisted", async () => {
    stubList([]);

    // Passing an arbitrary column through to Prisma would let a caller sort by
    // passwordHash and probe the data.
    await getAllCustomers({ sortBy: "passwordHash", sortOrder: "asc" });

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    );
  });

  it("sorts by a whitelisted column in the requested direction", async () => {
    stubList([]);

    await getAllCustomers({ sortBy: "email", sortOrder: "asc" });

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { email: "asc" } })
    );
  });

  it("sorts by order count in memory, since it is a computed field", async () => {
    stubList([
      userRow({ id: 1, _count: { orders: 1, reviews: 0, wishlist: 0 } }),
      userRow({ id: 2, _count: { orders: 9, reviews: 0, wishlist: 0 } }),
    ]);

    const result = await getAllCustomers({ sortBy: "totalOrders", sortOrder: "desc" });

    expect(result.customers.map((c) => c.id)).toEqual([2, 1]);
  });

  it("sorts by lifetime spend ascending when asked", async () => {
    stubList(
      [userRow({ id: 1 }), userRow({ id: 2 })],
      2,
      [
        { userId: 1, _sum: { totalAmount: 5000 } },
        { userId: 2, _sum: { totalAmount: 100 } },
      ]
    );

    const result = await getAllCustomers({ sortBy: "totalSpent", sortOrder: "asc" });

    expect(result.customers.map((c) => c.id)).toEqual([2, 1]);
  });
});

describe("getAllCustomers — computed metrics", () => {
  it("leaves cancelled orders out of lifetime spend", async () => {
    stubList([userRow()]);

    await getAllCustomers({});

    const where = (mockedPrisma.order.groupBy.mock.calls[0]?.[0] as any).where;
    expect(where.status).toEqual({ not: "CANCELLED" });
  });

  it("only totals spend for the customers on this page", async () => {
    stubList([userRow({ id: 7 }), userRow({ id: 8 })]);

    await getAllCustomers({});

    const where = (mockedPrisma.order.groupBy.mock.calls[0]?.[0] as any).where;
    expect(where.userId).toEqual({ in: [7, 8] });
  });

  it("shows 0 spent for a customer who has never ordered", async () => {
    stubList([userRow()], 1, []);

    const [customer] = (await getAllCustomers({})).customers;

    expect(customer!.totalSpent).toBe(0);
  });

  it("attaches each customer's spend from the grouped totals", async () => {
    stubList([userRow()], 1, [{ userId: 7, _sum: { totalAmount: "12500.00" } }]);

    const [customer] = (await getAllCustomers({})).customers;

    expect(customer!.totalSpent).toBe(12500);
  });

  it("joins the display name and carries the relation counts", async () => {
    stubList([userRow()]);

    const [customer] = (await getAllCustomers({})).customers;

    expect(customer!.name).toBe("Ada Lovelace");
    expect(customer!.totalOrders).toBe(3);
    expect(customer!.totalReviews).toBe(1);
    expect(customer!.totalWishlist).toBe(2);
  });

  it("never selects the password hash", async () => {
    stubList([userRow()]);

    await getAllCustomers({});

    const select = (mockedPrisma.user.findMany.mock.calls[0]?.[0] as any).select;
    expect(select).not.toHaveProperty("passwordHash");
    expect(select.email).toBe(true);
  });
});

describe("getCustomerById", () => {
  const detailRow = (over: Record<string, any> = {}) => ({
    ...userRow(),
    emailVerified: true,
    addresses: [{ id: 1, city: "Bengaluru" }],
    orders: [
      {
        id: 1,
        orderNumber: "ORD-2026-00001",
        status: "DELIVERED",
        totalAmount: "1999.00",
        createdAt: new Date("2026-02-01"),
        items: [{ id: 1 }, { id: 2 }],
        payment: { gateway: "razorpay", status: "PAID" },
      },
    ],
    ...over,
  });

  it("returns null for an id that does not exist", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);

    expect(await getCustomerById(999)).toBeNull();
  });

  it("summarises the recent orders rather than dumping every field", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(detailRow() as any);
    mockedPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: "1999.00" } } as any);

    const customer = await getCustomerById(7);

    expect(customer!.recentOrders[0]).toEqual({
      id: 1,
      orderNumber: "ORD-2026-00001",
      status: "DELIVERED",
      totalAmount: 1999,
      createdAt: new Date("2026-02-01"),
      itemCount: 2,
      payment: { gateway: "razorpay", status: "PAID" },
    });
  });

  it("reports a null payment on an order that has none", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(
      detailRow({ orders: [{ ...detailRow().orders[0], payment: null }] }) as any
    );
    mockedPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: null } } as any);

    const customer = await getCustomerById(7);

    expect(customer!.recentOrders[0]!.payment).toBeNull();
  });

  it("computes lifetime spend excluding cancellations", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(detailRow() as any);
    mockedPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: "8000.00" } } as any);

    const customer = await getCustomerById(7);

    expect(customer!.totalSpent).toBe(8000);
    const where = (mockedPrisma.order.aggregate.mock.calls[0]?.[0] as any).where;
    expect(where).toEqual({ userId: 7, status: { not: "CANCELLED" } });
  });

  it("shows 0 spent when the customer has no countable orders", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(detailRow({ orders: [] }) as any);
    mockedPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: null } } as any);

    const customer = await getCustomerById(7);

    expect(customer!.totalSpent).toBe(0);
  });

  it("limits the recent-order list to 10", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(detailRow() as any);
    mockedPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: null } } as any);

    await getCustomerById(7);

    const select = (mockedPrisma.user.findUnique.mock.calls[0]?.[0] as any).select;
    expect(select.orders.take).toBe(10);
    expect(select.orders.orderBy).toEqual({ createdAt: "desc" });
  });

  it("never selects the password hash", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(detailRow() as any);
    mockedPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: null } } as any);

    await getCustomerById(7);

    const select = (mockedPrisma.user.findUnique.mock.calls[0]?.[0] as any).select;
    expect(select).not.toHaveProperty("passwordHash");
  });
});

describe("getCustomerStats", () => {
  it("counts customers, admins and new sign-ups separately", async () => {
    mockedPrisma.user.count
      .mockResolvedValueOnce(120 as any) // total customers
      .mockResolvedValueOnce(14 as any)  // new this month
      .mockResolvedValueOnce(2 as any)   // admins
      .mockResolvedValueOnce(80 as any); // customers with at least one order

    const stats = await getCustomerStats();

    expect(stats).toEqual({
      totalCustomers: 120,
      newThisMonth: 14,
      totalAdmins: 2,
      customersWithOrders: 80,
    });
  });

  it("measures 'new this month' from the first of the current month", async () => {
    mockedPrisma.user.count.mockResolvedValue(0 as any);

    await getCustomerStats();

    const where = (mockedPrisma.user.count.mock.calls[1]?.[0] as any).where;
    const since = where.createdAt.gte as Date;
    expect(since.getDate()).toBe(1);
    expect(since.getMonth()).toBe(new Date().getMonth());
  });

  it("counts only accounts that actually have an order", async () => {
    mockedPrisma.user.count.mockResolvedValue(0 as any);

    await getCustomerStats();

    const where = (mockedPrisma.user.count.mock.calls[3]?.[0] as any).where;
    expect(where.orders).toEqual({ some: {} });
  });
});
