"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayPayment = exports.createRazorpayOrder = void 0;
const razorpay_1 = require("../lib/razorpay");
const order_service_1 = require("./order.service");
const client_1 = require("../generated/prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const createRazorpayOrder = async (input) => {
    const checkout = await (0, order_service_1.prepareCheckout)(input);
    const razorpayOrder = await razorpay_1.razorpay.orders.create({
        amount: Math.round(checkout.totalAmount * 100),
        currency: "INR",
        receipt: `CHK-${input.userId}-receipt-${Date.now()}`
    });
    return {
        key: process.env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
    };
};
exports.createRazorpayOrder = createRazorpayOrder;
const verifyRazorpayPayment = async (input) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, ...createOrderInput } = input;
    // Verify the signature
    const hmac = crypto_1.default.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest("hex");
    if (generatedSignature !== razorpaySignature) {
        throw new Error("Payment signature verification failed. The transaction might be invalid.");
    }
    // Prepare checkout and finalize order
    const checkout = await (0, order_service_1.prepareCheckout)(createOrderInput);
    const order = await (0, order_service_1.finalizeOrder)(checkout, createOrderInput, {
        status: client_1.PaymentStatus.PAID,
        gatewayOrderId: razorpayOrderId,
        gatewayPaymentId: razorpayPaymentId,
        gatewaySignature: razorpaySignature
    });
    return order;
};
exports.verifyRazorpayPayment = verifyRazorpayPayment;
//# sourceMappingURL=payment.service.js.map