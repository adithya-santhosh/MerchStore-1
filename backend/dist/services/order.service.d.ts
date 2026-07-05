import { PaymentStatus, Prisma } from "../generated/prisma/client";
export interface AddressInput {
    label?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
}
export interface CreateOrderInput {
    userId: number;
    address: AddressInput;
    couponCode?: string;
    paymentMethod: "cod" | "razorpay";
    sessionToken?: string;
    taxRate: number;
    shippingCost: number;
}
export type PreparedCheckout = {
    cart: Prisma.CartGetPayload<{
        include: {
            items: {
                include: {
                    product: true;
                };
            };
        };
    }>;
    subtotal: number;
    discountAmount: number;
    resolvedCouponCode?: string | undefined;
    taxAmount: number;
    shippingCost: number;
    totalAmount: number;
};
export declare const prepareCheckout: (input: CreateOrderInput) => Promise<{
    cart: {
        items: ({
            product: {
                id: number;
                name: string;
                description: string;
                shortDescription: string | null;
                slug: string;
                price: Prisma.Decimal;
                compareAtPrice: Prisma.Decimal | null;
                costPrice: Prisma.Decimal | null;
                sku: string | null;
                stockQty: number;
                weight: number | null;
                productType: string;
                isActive: boolean;
                isFeatured: boolean;
                categoryId: number;
                brandId: number | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: number;
            productId: number;
            cartId: number;
            quantity: number;
            unitPrice: Prisma.Decimal;
        })[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number | null;
        sessionToken: string | null;
    };
    subtotal: number;
    discountAmount: number;
    resolvedCouponCode: string | undefined;
    taxAmount: number;
    shippingCost: number;
    totalAmount: number;
}>;
export interface PaymentDetails {
    status?: PaymentStatus;
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    gatewaySignature?: string;
}
export declare const finalizeOrder: (checkout: PreparedCheckout, input: CreateOrderInput, paymentDetails?: PaymentDetails) => Promise<{
    id: any;
    orderNumber: any;
    status: any;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    taxAmount: number;
    totalAmount: number;
    couponCode: any;
    createdAt: any;
    updatedAt: any;
    shippingAddress: any;
    payment: {
        gateway: any;
        amount: number;
        status: any;
        paidAt: any;
    } | null;
    items: any;
}>;
export declare const createOrder: (input: CreateOrderInput) => Promise<{
    id: any;
    orderNumber: any;
    status: any;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    taxAmount: number;
    totalAmount: number;
    couponCode: any;
    createdAt: any;
    updatedAt: any;
    shippingAddress: any;
    payment: {
        gateway: any;
        amount: number;
        status: any;
        paidAt: any;
    } | null;
    items: any;
}>;
export declare const getOrdersByUser: (userId: number) => Promise<{
    id: any;
    orderNumber: any;
    status: any;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    taxAmount: number;
    totalAmount: number;
    couponCode: any;
    createdAt: any;
    updatedAt: any;
    shippingAddress: any;
    payment: {
        gateway: any;
        amount: number;
        status: any;
        paidAt: any;
    } | null;
    items: any;
}[]>;
export declare const getOrderById: (orderId: number, userId: number) => Promise<{
    items: any;
    id: any;
    orderNumber: any;
    status: any;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    taxAmount: number;
    totalAmount: number;
    couponCode: any;
    createdAt: any;
    updatedAt: any;
    shippingAddress: any;
    payment: {
        gateway: any;
        amount: number;
        status: any;
        paidAt: any;
    } | null;
}>;
export declare const getAllOrdersAdmin: () => Promise<{
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
export declare const getOrderByIdAdmin: (orderId: number) => Promise<{
    id: number;
    orderNumber: string;
    status: import("../generated/prisma").$Enums.OrderStatus;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    taxAmount: number;
    totalAmount: number;
    couponCode: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    customer: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
    };
    shippingAddress: {
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
    };
    payment: {
        gateway: string;
        amount: number;
        status: import("../generated/prisma").$Enums.PaymentStatus;
        paidAt: Date | null;
    } | null;
    shipment: {
        id: number;
        status: import("../generated/prisma").$Enums.OrderStatus;
        orderId: number;
        carrier: string | null;
        trackingNumber: string | null;
        shippedAt: Date | null;
        deliveredAt: Date | null;
    } | null;
    items: {
        id: number;
        productId: number;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        imageUrl: string | null;
    }[];
}>;
export declare const updateOrderStatus: (orderId: number, status: string) => Promise<{
    user: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
    };
    items: {
        id: number;
        productId: number;
        quantity: number;
        unitPrice: Prisma.Decimal;
        productName: string;
        totalPrice: Prisma.Decimal;
        orderId: number;
    }[];
    payment: {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import("../generated/prisma").$Enums.PaymentStatus;
        gateway: string;
        gatewayOrderId: string | null;
        gatewayPaymentId: string | null;
        gatewaySignature: string | null;
        gatewayTxnId: string | null;
        amount: Prisma.Decimal;
        currency: string;
        paidAt: Date | null;
        orderId: number;
    } | null;
    shippingAddress: {
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
    };
} & {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    notes: string | null;
    status: import("../generated/prisma").$Enums.OrderStatus;
    userId: number;
    couponCode: string | null;
    shippingCost: Prisma.Decimal;
    orderNumber: string;
    subtotal: Prisma.Decimal;
    discountAmount: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    shippingAddressId: number;
}>;
//# sourceMappingURL=order.service.d.ts.map