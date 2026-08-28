import prisma from "../lib/prisma";
import { OrderStatus, UserRole } from "@prisma/client";

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export const getDashboardStats = async (days?: number) => {
  const dateFilter: any = {};
  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    dateFilter.createdAt = { gte: since };
  }

  const orderWhere = {
    ...dateFilter,
    status: { not: OrderStatus.CANCELLED },
  };

  const [
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: orderWhere,
      _sum: { totalAmount: true },
    }),
    prisma.order.count({ where: dateFilter }),
    prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
    prisma.product.count(),
    prisma.order.count({
      where: { ...dateFilter, status: OrderStatus.PENDING },
    }),
  ]);

  const revenue = Number(totalRevenue._sum.totalAmount || 0);
  const nonCancelledOrders = await prisma.order.count({ where: orderWhere });

  return {
    totalRevenue: revenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    averageOrderValue: nonCancelledOrders > 0 ? Math.round(revenue / nonCancelledOrders) : 0,
  };
};

// ─── Revenue chart data (daily buckets) ──────────────────────────────────────

/**
 * YYYY-MM-DD for the *server's* calendar day.
 *
 * Deliberately not `toISOString().slice(0, 10)`: that reports the UTC day, so
 * calling it on a local midnight labels the bucket as the previous day in any
 * UTC+ zone. Bucket labels and order timestamps have to be derived the same
 * way or takings land in the wrong column.
 *
 * Note this follows the server's timezone (UTC on Render), not the store's. If
 * the day boundary ever needs to be IST specifically, that becomes a store
 * setting rather than an implicit dependency on where the process runs.
 */
const dayKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getRevenueChart = async (days: number = 30) => {
  // `days` buckets ending with today — so `since` is (days - 1) days back, not
  // `days`. Going back a full `days` produced a window that stopped at
  // yesterday and silently dropped everything sold today.
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: since },
      status: { not: OrderStatus.CANCELLED },
    },
    select: {
      totalAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Build daily buckets
  const buckets: Map<string, { revenue: number; orderCount: number }> = new Map();

  // Initialize all days with 0
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(dayKey(d), { revenue: 0, orderCount: 0 });
  }

  // Fill with actual data
  for (const order of orders) {
    const bucket = buckets.get(dayKey(order.createdAt));
    if (bucket) {
      bucket.revenue += Number(order.totalAmount);
      bucket.orderCount += 1;
    }
  }

  return Array.from(buckets.entries()).map(([date, data]) => ({
    date,
    revenue: Math.round(data.revenue),
    orderCount: data.orderCount,
  }));
};

// ─── Top selling products ────────────────────────────────────────────────────

export const getTopProducts = async (limit: number = 5, days?: number) => {
  const dateFilter: any = {};
  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    dateFilter.order = { createdAt: { gte: since }, status: { not: OrderStatus.CANCELLED } };
  } else {
    dateFilter.order = { status: { not: OrderStatus.CANCELLED } };
  }

  const topItems = await prisma.orderItem.groupBy({
    by: ["productId", "productName"],
    where: dateFilter,
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  // Fetch product images
  const productIds = topItems.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { images: true },
  });

  const imageMap = new Map(
    products.map((p) => {
      const primaryImg = p.images.find((img) => img.isPrimary) || p.images[0];
      return [p.id, primaryImg?.imageUrl || null];
    })
  );

  return topItems.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    totalQuantity: item._sum.quantity || 0,
    totalRevenue: Number(item._sum.totalPrice || 0),
    imageUrl: imageMap.get(item.productId) || null,
  }));
};

// ─── Recent orders ───────────────────────────────────────────────────────────

export const getRecentOrders = async (limit: number = 5) => {
  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      payment: true,
    },
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    totalAmount: Number(o.totalAmount),
    createdAt: o.createdAt,
    customer: {
      id: o.user.id,
      name: `${o.user.firstName} ${o.user.lastName}`.trim(),
      email: o.user.email,
    },
    payment: o.payment
      ? { gateway: o.payment.gateway, status: o.payment.status }
      : null,
  }));
};

// ─── Order status breakdown ──────────────────────────────────────────────────

export const getOrderStatusBreakdown = async (days?: number) => {
  const dateFilter: any = {};
  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    dateFilter.createdAt = { gte: since };
  }

  const breakdown = await prisma.order.groupBy({
    by: ["status"],
    where: dateFilter,
    _count: true,
  });

  const result: Record<string, number> = {};
  for (const status of Object.values(OrderStatus)) {
    result[status.toLowerCase()] = 0;
  }
  for (const item of breakdown) {
    result[item.status.toLowerCase()] = item._count;
  }

  return result;
};
