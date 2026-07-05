import prisma from "../lib/prisma";
import { OrderStatus, UserRole } from "@prisma/client";

// ─── List all customers with computed metrics ────────────────────────────────

export const getAllCustomers = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 15));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.search?.trim()) {
    const q = params.search.trim();
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  // Sorting — basic fields handled by Prisma orderBy
  const validSortFields = ["firstName", "email", "createdAt"];
  let orderBy: any = { createdAt: "desc" };
  if (params.sortBy && validSortFields.includes(params.sortBy)) {
    orderBy = { [params.sortBy]: params.sortOrder === "asc" ? "asc" : "desc" };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true, reviews: true, wishlist: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Compute totalSpent for each user
  const userIds = users.map((u) => u.id);
  const spentData = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      status: { not: OrderStatus.CANCELLED },
    },
    _sum: { totalAmount: true },
  });

  const spentMap = new Map(
    spentData.map((s) => [s.userId, Number(s._sum.totalAmount || 0)])
  );

  const customers = users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt,
    totalOrders: u._count.orders,
    totalReviews: u._count.reviews,
    totalWishlist: u._count.wishlist,
    totalSpent: spentMap.get(u.id) || 0,
  }));

  // Post-sort for computed fields
  if (params.sortBy === "totalOrders") {
    const dir = params.sortOrder === "asc" ? 1 : -1;
    customers.sort((a, b) => (a.totalOrders - b.totalOrders) * dir);
  }
  if (params.sortBy === "totalSpent") {
    const dir = params.sortOrder === "asc" ? 1 : -1;
    customers.sort((a, b) => (a.totalSpent - b.totalSpent) * dir);
  }

  return { customers, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─── Get single customer detail ──────────────────────────────────────────────

export const getCustomerById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      addresses: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          payment: true,
          items: true,
        },
      },
      _count: { select: { orders: true, reviews: true, wishlist: true } },
    },
  });

  if (!user) return null;

  // Compute total spent
  const spentResult = await prisma.order.aggregate({
    where: { userId: id, status: { not: OrderStatus.CANCELLED } },
    _sum: { totalAmount: true },
  });

  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    totalOrders: user._count.orders,
    totalReviews: user._count.reviews,
    totalWishlist: user._count.wishlist,
    totalSpent: Number(spentResult._sum.totalAmount || 0),
    addresses: user.addresses,
    recentOrders: user.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt,
      itemCount: o.items.length,
      payment: o.payment
        ? { gateway: o.payment.gateway, status: o.payment.status }
        : null,
    })),
  };
};

// ─── Customer stats ──────────────────────────────────────────────────────────

export const getCustomerStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalCustomers, newThisMonth, totalAdmins, customersWithOrders] =
    await Promise.all([
      prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      prisma.user.count({
        where: { role: UserRole.CUSTOMER, createdAt: { gte: startOfMonth } },
      }),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
      prisma.user.count({
        where: { role: UserRole.CUSTOMER, orders: { some: {} } },
      }),
    ]);

  return { totalCustomers, newThisMonth, totalAdmins, customersWithOrders };
};
