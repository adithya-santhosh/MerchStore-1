export declare const getDashboardStats: (days?: number) => Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    pendingOrders: number;
    averageOrderValue: number;
}>;
export declare const getRevenueChart: (days?: number) => Promise<{
    date: string;
    revenue: number;
    orderCount: number;
}[]>;
export declare const getTopProducts: (limit?: number, days?: number) => Promise<{
    productId: number;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    imageUrl: string | null;
}[]>;
export declare const getRecentOrders: (limit?: number) => Promise<{
    id: number;
    orderNumber: string;
    status: import("../generated/prisma").$Enums.OrderStatus;
    totalAmount: number;
    createdAt: Date;
    customer: {
        id: number;
        name: string;
        email: string;
    };
    payment: {
        gateway: string;
        status: import("../generated/prisma").$Enums.PaymentStatus;
    } | null;
}[]>;
export declare const getOrderStatusBreakdown: (days?: number) => Promise<Record<string, number>>;
//# sourceMappingURL=analytics.service.d.ts.map