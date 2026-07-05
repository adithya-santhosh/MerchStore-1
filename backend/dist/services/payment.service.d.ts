import { CreateOrderInput } from "./order.service";
type CreateRazorpayOrderInput = CreateOrderInput;
export interface VerifyRazorpayPaymentInput extends CreateOrderInput {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}
export declare const createRazorpayOrder: (input: CreateRazorpayOrderInput) => Promise<{
    key: string | undefined;
    orderId: string;
    amount: string | number;
    currency: string;
    receipt: string | undefined;
}>;
export declare const verifyRazorpayPayment: (input: VerifyRazorpayPaymentInput) => Promise<{
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
export {};
//# sourceMappingURL=payment.service.d.ts.map