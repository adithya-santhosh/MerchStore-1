"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderStatusBreakdown = exports.getRecentOrders = exports.getTopProducts = exports.getRevenueChart = exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("../generated/prisma/client");
// ─── Dashboard stats ─────────────────────────────────────────────────────────
const getDashboardStats = async (days) => {
    const dateFilter = {};
    if (days) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        dateFilter.createdAt = { gte: since };
    }
    const orderWhere = {
        ...dateFilter,
        status: { not: client_1.OrderStatus.CANCELLED },
    };
    const [totalRevenue, totalOrders, totalCustomers, totalProducts, pendingOrders,] = await Promise.all([
        prisma_1.default.order.aggregate({
            where: orderWhere,
            _sum: { totalAmount: true },
        }),
        prisma_1.default.order.count({ where: dateFilter }),
        prisma_1.default.user.count({ where: { role: client_1.UserRole.CUSTOMER } }),
        prisma_1.default.product.count(),
        prisma_1.default.order.count({
            where: { ...dateFilter, status: client_1.OrderStatus.PENDING },
        }),
    ]);
    const revenue = Number(totalRevenue._sum.totalAmount || 0);
    const nonCancelledOrders = await prisma_1.default.order.count({ where: orderWhere });
    return {
        totalRevenue: revenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        averageOrderValue: nonCancelledOrders > 0 ? Math.round(revenue / nonCancelledOrders) : 0,
    };
};
exports.getDashboardStats = getDashboardStats;
// ─── Revenue chart data (daily buckets) ──────────────────────────────────────
const getRevenueChart = async (days = 30) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    const orders = await prisma_1.default.order.findMany({
        where: {
            createdAt: { gte: since },
            status: { not: client_1.OrderStatus.CANCELLED },
        },
        select: {
            totalAmount: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
    // Build daily buckets
    const buckets = new Map();
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const key = d.toISOString().split("T")[0] || ""; // YYYY-MM-DD
        buckets.set(key, { revenue: 0, orderCount: 0 });
    }
    // Fill with actual data
    for (const order of orders) {
        const key = order.createdAt.toISOString().split("T")[0] || "";
        const bucket = buckets.get(key);
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
exports.getRevenueChart = getRevenueChart;
// ─── Top selling products ────────────────────────────────────────────────────
const getTopProducts = async (limit = 5, days) => {
    const dateFilter = {};
    if (days) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        dateFilter.order = { createdAt: { gte: since }, status: { not: client_1.OrderStatus.CANCELLED } };
    }
    else {
        dateFilter.order = { status: { not: client_1.OrderStatus.CANCELLED } };
    }
    const topItems = await prisma_1.default.orderItem.groupBy({
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
    const products = await prisma_1.default.product.findMany({
        where: { id: { in: productIds } },
        include: { images: true },
    });
    const imageMap = new Map(products.map((p) => {
        const primaryImg = p.images.find((img) => img.isPrimary) || p.images[0];
        return [p.id, primaryImg?.imageUrl || null];
    }));
    return topItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: Number(item._sum.totalPrice || 0),
        imageUrl: imageMap.get(item.productId) || null,
    }));
};
exports.getTopProducts = getTopProducts;
// ─── Recent orders ───────────────────────────────────────────────────────────
const getRecentOrders = async (limit = 5) => {
    const orders = await prisma_1.default.order.findMany({
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
exports.getRecentOrders = getRecentOrders;
// ─── Order status breakdown ──────────────────────────────────────────────────
const getOrderStatusBreakdown = async (days) => {
    const dateFilter = {};
    if (days) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        dateFilter.createdAt = { gte: since };
    }
    const breakdown = await prisma_1.default.order.groupBy({
        by: ["status"],
        where: dateFilter,
        _count: true,
    });
    const result = {};
    for (const status of Object.values(client_1.OrderStatus)) {
        result[status.toLowerCase()] = 0;
    }
    for (const item of breakdown) {
        result[item.status.toLowerCase()] = item._count;
    }
    return result;
};
exports.getOrderStatusBreakdown = getOrderStatusBreakdown;
//# sourceMappingURL=analytics.service.js.map