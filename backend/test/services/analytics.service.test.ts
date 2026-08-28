import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    order: { aggregate: vi.fn(), count: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
    orderItem: { groupBy: vi.fn() },
    user: { count: vi.fn() },
    product: { count: vi.fn(), findMany: vi.fn() },
  },
}));

import prisma from "../../src/lib/prisma";
import {
  getDashboardStats,
  getRevenueChart,
  getTopProducts,
  getRecentOrders,
  getOrderStatusBreakdown,
} from "../../src/services/analytics.service";

const mockedPrisma = vi.mocked(prisma, true);

/** Sets up the five parallel reads getDashboardStats makes, plus its follow-up count. */
const stubDashboard = (opts: { revenue: number; orders: number; nonCancelled: number }) => {
  mockedPrisma.order.aggregate.mockResolvedValue({
    _sum: { totalAmount: opts.revenue },
  } as any);
  mockedPrisma.order.count
    .mockResolvedValueOnce(opts.orders as any)      // totalOrders
    .mockResolvedValueOnce(0 as any)                // pendingOrders
    .mockResolvedValueOnce(opts.nonCancelled as any); // non-cancelled, for the average
  mockedPrisma.user.count.mockResolvedValue(0 as any);
  mockedPrisma.product.count.mockResolvedValue(0 as any);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDashboardStats", () => {
  it("excludes cancelled orders from revenue", async () => {
    stubDashboard({ revenue: 5000, orders: 10, nonCancelled: 8 });

    await getDashboardStats();

    const where = (mockedPrisma.order.aggregate.mock.calls[0]?.[0] as any).where;
    expect(where.status).toEqual({ not: "CANCELLED" });
  });

  it("divides revenue by non-cancelled orders for the average order value", async () => {
    stubDashboard({ revenue: 5000, orders: 10, nonCancelled: 8 });

    const stats = await getDashboardStats();

    // 5000 / 8 = 625 — dividing by all 10 orders would understate it.
    expect(stats.averageOrderValue).toBe(625);
  });

  it("reports an average of 0 instead of dividing by zero on a quiet day", async () => {
    stubDashboard({ revenue: 0, orders: 0, nonCancelled: 0 });

    const stats = await getDashboardStats();

    expect(stats.averageOrderValue).toBe(0);
    expect(Number.isNaN(stats.averageOrderValue)).toBe(false);
  });

  it("rounds the average to a whole rupee", async () => {
    stubDashboard({ revenue: 1000, orders: 3, nonCancelled: 3 });

    const stats = await getDashboardStats();

    expect(stats.averageOrderValue).toBe(333);
  });

  it("treats a null revenue sum as zero", async () => {
    mockedPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: null } } as any);
    mockedPrisma.order.count.mockResolvedValue(0 as any);
    mockedPrisma.user.count.mockResolvedValue(0 as any);
    mockedPrisma.product.count.mockResolvedValue(0 as any);

    const stats = await getDashboardStats();

    expect(stats.totalRevenue).toBe(0);
  });

  it("applies no date filter when no window is requested", async () => {
    stubDashboard({ revenue: 100, orders: 1, nonCancelled: 1 });

    await getDashboardStats();

    const where = (mockedPrisma.order.aggregate.mock.calls[0]?.[0] as any).where;
    expect(where.createdAt).toBeUndefined();
  });

  it("limits every figure to the requested window", async () => {
    stubDashboard({ revenue: 100, orders: 1, nonCancelled: 1 });

    await getDashboardStats(7);

    const where = (mockedPrisma.order.aggregate.mock.calls[0]?.[0] as any).where;
    const since = where.createdAt.gte as Date;
    const daysAgo = (Date.now() - since.getTime()) / 86_400_000;
    expect(daysAgo).toBeGreaterThan(6.9);
    expect(daysAgo).toBeLessThan(7.1);
  });

  it("counts customers by role rather than counting every account", async () => {
    stubDashboard({ revenue: 100, orders: 1, nonCancelled: 1 });

    await getDashboardStats();

    expect(mockedPrisma.user.count).toHaveBeenCalledWith({ where: { role: "CUSTOMER" } });
  });
});

describe("getRevenueChart", () => {
  it("returns one bucket per day in the window, even with no sales", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    const chart = await getRevenueChart(7);

    expect(chart).toHaveLength(7);
    expect(chart.every((d) => d.revenue === 0 && d.orderCount === 0)).toBe(true);
  });

  it("labels every bucket with a YYYY-MM-DD date", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    const chart = await getRevenueChart(3);

    for (const point of chart) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("keeps the buckets in chronological order", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    const chart = await getRevenueChart(5);
    const dates = chart.map((p) => p.date);

    expect([...dates].sort()).toEqual(dates);
  });

  /** Mid-window and mid-day UTC, so it lands in a bucket under any timezone. */
  const midWindow = () => {
    const d = new Date(Date.now() - 3 * 86_400_000);
    d.setUTCHours(12, 0, 0, 0);
    return d;
  };

  it("adds each order's total into a bucket", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([
      { totalAmount: 1000, createdAt: midWindow() },
      { totalAmount: 500, createdAt: midWindow() },
    ] as any);

    const chart = await getRevenueChart(7);

    expect(chart.reduce((sum, p) => sum + p.revenue, 0)).toBe(1500);
    expect(chart.reduce((sum, p) => sum + p.orderCount, 0)).toBe(2);
  });

  it("groups same-day orders into a single bucket", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([
      { totalAmount: 1000, createdAt: midWindow() },
      { totalAmount: 500, createdAt: midWindow() },
    ] as any);

    const chart = await getRevenueChart(7);

    expect(chart.filter((p) => p.orderCount > 0)).toHaveLength(1);
  });

  // ── Regression cover for the dropped-days bug ───────────────────────────────
  //
  // The window used to be built as [today - days, today - 1] — the loop started
  // `days` days back and ran `days` times, stopping one short of today. Bucket
  // keys also came from toISOString() on a *local* midnight, which labels them
  // as the previous day in any UTC+ zone. Together, today's takings never
  // reached the chart at all.

  /** The server-calendar day, matching how the service keys its buckets. */
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  it("counts an order placed today", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([
      { totalAmount: 5000, createdAt: new Date() },
    ] as any);

    const chart = await getRevenueChart(7);

    expect(chart.reduce((sum, p) => sum + p.revenue, 0)).toBe(5000);
  });

  it("puts today's order in today's bucket", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([
      { totalAmount: 5000, createdAt: new Date() },
    ] as any);

    const chart = await getRevenueChart(7);

    expect(chart.find((p) => p.date === todayKey())?.revenue).toBe(5000);
  });

  it("ends the window on today rather than yesterday", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    const chart = await getRevenueChart(7);

    expect(chart[chart.length - 1]!.date).toBe(todayKey());
  });

  it("labels buckets by the same calendar day it buckets orders into", async () => {
    // A late-evening order is the case the old UTC-vs-local mismatch broke: in
    // IST it was filed under tomorrow's label, or dropped off the end entirely.
    const lateToday = new Date();
    lateToday.setHours(23, 30, 0, 0);
    mockedPrisma.order.findMany.mockResolvedValue([
      { totalAmount: 1200, createdAt: lateToday },
    ] as any);

    const chart = await getRevenueChart(7);

    expect(chart.find((p) => p.date === todayKey())?.revenue).toBe(1200);
  });

  it("counts an order placed just after midnight today", async () => {
    const earlyToday = new Date();
    earlyToday.setHours(0, 15, 0, 0);
    mockedPrisma.order.findMany.mockResolvedValue([
      { totalAmount: 800, createdAt: earlyToday },
    ] as any);

    const chart = await getRevenueChart(7);

    expect(chart.find((p) => p.date === todayKey())?.revenue).toBe(800);
  });

  it("queries from the first day of the window, so no bucket is starved", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    const chart = await getRevenueChart(7);
    const since = (mockedPrisma.order.findMany.mock.calls[0]?.[0] as any).where.createdAt
      .gte as Date;

    const sinceKey = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(since.getDate()).padStart(2, "0")}`;
    expect(chart[0]!.date).toBe(sinceKey);
  });

  it("ignores an order that falls outside the charted window", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([
      { totalAmount: 9999, createdAt: new Date("2001-01-01") },
    ] as any);

    const chart = await getRevenueChart(7);

    expect(chart.reduce((sum, p) => sum + p.revenue, 0)).toBe(0);
  });

  it("leaves cancelled orders out of the chart", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    await getRevenueChart(30);

    const where = (mockedPrisma.order.findMany.mock.calls[0]?.[0] as any).where;
    expect(where.status).toEqual({ not: "CANCELLED" });
  });

  it("starts the window at midnight so the first day is a whole day", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    await getRevenueChart(30);

    const since = (mockedPrisma.order.findMany.mock.calls[0]?.[0] as any).where.createdAt.gte as Date;
    expect(since.getHours()).toBe(0);
    expect(since.getMinutes()).toBe(0);
    expect(since.getSeconds()).toBe(0);
  });

  it("defaults to a 30-day window", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    const chart = await getRevenueChart();

    expect(chart).toHaveLength(30);
  });

  it("rounds each day's revenue to whole rupees", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([
      { totalAmount: 100.4, createdAt: midWindow() },
      { totalAmount: 100.4, createdAt: midWindow() },
    ] as any);

    const chart = await getRevenueChart(7);

    // 100.4 + 100.4 = 200.8, rounded once per bucket rather than per order.
    expect(chart.reduce((sum, p) => sum + p.revenue, 0)).toBe(201);
  });
});

describe("getTopProducts", () => {
  it("ranks by units sold and honours the requested limit", async () => {
    mockedPrisma.orderItem.groupBy.mockResolvedValue([] as any);
    mockedPrisma.product.findMany.mockResolvedValue([] as any);

    await getTopProducts(3);

    const call = mockedPrisma.orderItem.groupBy.mock.calls[0]?.[0] as any;
    expect(call.take).toBe(3);
    expect(call.orderBy).toEqual({ _sum: { quantity: "desc" } });
  });

  it("excludes cancelled orders when no window is given", async () => {
    mockedPrisma.orderItem.groupBy.mockResolvedValue([] as any);
    mockedPrisma.product.findMany.mockResolvedValue([] as any);

    await getTopProducts(5);

    const where = (mockedPrisma.orderItem.groupBy.mock.calls[0]?.[0] as any).where;
    expect(where.order).toEqual({ status: { not: "CANCELLED" } });
  });

  it("adds a date bound when a window is given", async () => {
    mockedPrisma.orderItem.groupBy.mockResolvedValue([] as any);
    mockedPrisma.product.findMany.mockResolvedValue([] as any);

    await getTopProducts(5, 30);

    const where = (mockedPrisma.orderItem.groupBy.mock.calls[0]?.[0] as any).where;
    expect(where.order.createdAt.gte).toBeInstanceOf(Date);
    expect(where.order.status).toEqual({ not: "CANCELLED" });
  });

  it("attaches each product's primary image", async () => {
    mockedPrisma.orderItem.groupBy.mockResolvedValue([
      { productId: 10, productName: "Roof Rack", _sum: { quantity: 12, totalPrice: 18000 } },
    ] as any);
    mockedPrisma.product.findMany.mockResolvedValue([
      {
        id: 10,
        images: [
          { imageUrl: "/alt.jpg", isPrimary: false },
          { imageUrl: "/hero.jpg", isPrimary: true },
        ],
      },
    ] as any);

    const [top] = await getTopProducts(5);

    expect(top.imageUrl).toBe("/hero.jpg");
    expect(top.totalQuantity).toBe(12);
    expect(top.totalRevenue).toBe(18000);
  });

  it("reports a null image for a product with no pictures", async () => {
    mockedPrisma.orderItem.groupBy.mockResolvedValue([
      { productId: 10, productName: "Roof Rack", _sum: { quantity: 1, totalPrice: 100 } },
    ] as any);
    mockedPrisma.product.findMany.mockResolvedValue([{ id: 10, images: [] }] as any);

    const [top] = await getTopProducts(5);

    expect(top.imageUrl).toBeNull();
  });

  it("still lists a product whose record has since been deleted", async () => {
    mockedPrisma.orderItem.groupBy.mockResolvedValue([
      { productId: 99, productName: "Discontinued Bar", _sum: { quantity: 4, totalPrice: 900 } },
    ] as any);
    mockedPrisma.product.findMany.mockResolvedValue([] as any);

    const [top] = await getTopProducts(5);

    // The order line keeps its own name snapshot, so history stays readable.
    expect(top.productName).toBe("Discontinued Bar");
    expect(top.imageUrl).toBeNull();
  });

  it("treats a missing quantity sum as zero", async () => {
    mockedPrisma.orderItem.groupBy.mockResolvedValue([
      { productId: 10, productName: "Roof Rack", _sum: { quantity: null, totalPrice: null } },
    ] as any);
    mockedPrisma.product.findMany.mockResolvedValue([] as any);

    const [top] = await getTopProducts(5);

    expect(top.totalQuantity).toBe(0);
    expect(top.totalRevenue).toBe(0);
  });
});

describe("getRecentOrders", () => {
  const orderRow = (over: Record<string, any> = {}) => ({
    id: 1,
    orderNumber: "ORD-2026-00001",
    status: "PENDING",
    totalAmount: "1999.00",
    createdAt: new Date("2026-04-01"),
    user: { id: 7, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
    payment: { gateway: "razorpay", status: "PAID" },
    ...over,
  });

  it("takes the newest orders first, up to the limit", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([] as any);

    await getRecentOrders(5);

    expect(mockedPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, orderBy: { createdAt: "desc" } })
    );
  });

  it("joins the customer's first and last name for display", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([orderRow()] as any);

    const [order] = await getRecentOrders(5);

    expect(order.customer.name).toBe("Ada Lovelace");
  });

  it("converts the order total to a number", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([orderRow()] as any);

    const [order] = await getRecentOrders(5);

    expect(order.totalAmount).toBe(1999);
  });

  it("reports a null payment for an order that has none", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([orderRow({ payment: null })] as any);

    const [order] = await getRecentOrders(5);

    expect(order.payment).toBeNull();
  });

  it("trims the name when the customer has no surname", async () => {
    mockedPrisma.order.findMany.mockResolvedValue([
      orderRow({ user: { id: 7, firstName: "Ada", lastName: "", email: "a@b.com" } }),
    ] as any);

    const [order] = await getRecentOrders(5);

    expect(order.customer.name).toBe("Ada");
  });
});

describe("getOrderStatusBreakdown", () => {
  it("initialises every status to zero so the chart has no gaps", async () => {
    mockedPrisma.order.groupBy.mockResolvedValue([] as any);

    const breakdown = await getOrderStatusBreakdown();

    expect(breakdown).toEqual({
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    });
  });

  it("fills in the counts it does have, lower-cased", async () => {
    mockedPrisma.order.groupBy.mockResolvedValue([
      { status: "DELIVERED", _count: 12 },
      { status: "CANCELLED", _count: 2 },
    ] as any);

    const breakdown = await getOrderStatusBreakdown();

    expect(breakdown.delivered).toBe(12);
    expect(breakdown.cancelled).toBe(2);
    expect(breakdown.pending).toBe(0);
  });

  it("bounds the breakdown by date when a window is requested", async () => {
    mockedPrisma.order.groupBy.mockResolvedValue([] as any);

    await getOrderStatusBreakdown(30);

    const where = (mockedPrisma.order.groupBy.mock.calls[0]?.[0] as any).where;
    expect(where.createdAt.gte).toBeInstanceOf(Date);
  });

  it("counts every order when no window is requested", async () => {
    mockedPrisma.order.groupBy.mockResolvedValue([] as any);

    await getOrderStatusBreakdown();

    const where = (mockedPrisma.order.groupBy.mock.calls[0]?.[0] as any).where;
    expect(where).toEqual({});
  });
});
