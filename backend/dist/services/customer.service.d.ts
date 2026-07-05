export declare const getAllCustomers: (params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}) => Promise<{
    customers: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        role: import("../generated/prisma").$Enums.UserRole;
        createdAt: Date;
        totalOrders: number;
        totalReviews: number;
        totalWishlist: number;
        totalSpent: number;
    }[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare const getCustomerById: (id: number) => Promise<{
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: import("../generated/prisma").$Enums.UserRole;
    emailVerified: boolean;
    createdAt: Date;
    totalOrders: number;
    totalReviews: number;
    totalWishlist: number;
    totalSpent: number;
    addresses: {
        id: number;
        userId: number;
        label: string | null;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        isDefault: boolean;
    }[];
    recentOrders: {
        id: number;
        orderNumber: string;
        status: import("../generated/prisma").$Enums.OrderStatus;
        totalAmount: number;
        createdAt: Date;
        itemCount: number;
        payment: {
            gateway: string;
            status: import("../generated/prisma").$Enums.PaymentStatus;
        } | null;
    }[];
} | null>;
export declare const getCustomerStats: () => Promise<{
    totalCustomers: number;
    newThisMonth: number;
    totalAdmins: number;
    customersWithOrders: number;
}>;
//# sourceMappingURL=customer.service.d.ts.map