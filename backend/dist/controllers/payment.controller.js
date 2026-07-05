"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.createPaymentOrder = void 0;
const payment_service_1 = require("../services/payment.service");
const createPaymentOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { address, couponCode, sessionToken, taxRate, shippingCost, } = req.body;
        const payment = await (0, payment_service_1.createRazorpayOrder)({
            userId,
            address,
            couponCode,
            paymentMethod: "razorpay",
            sessionToken,
            taxRate: typeof taxRate === "number"
                ? taxRate
                : 0.18,
            shippingCost: typeof shippingCost === "number"
                ? shippingCost
                : 0,
        });
        res.status(200).json(payment);
    }
    catch (error) {
        console.error("Payment Error:", error);
        res.status(400).json({
            message: error.message,
            stack: process.env.NODE_ENV === "development"
                ? error.stack
                : undefined,
        });
    }
};
exports.createPaymentOrder = createPaymentOrder;
const verifyPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, address, couponCode, sessionToken, taxRate, shippingCost, } = req.body;
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: "Missing Razorpay payment parameters." });
        }
        const order = await (0, payment_service_1.verifyRazorpayPayment)({
            userId,
            address,
            couponCode,
            paymentMethod: "razorpay",
            sessionToken,
            taxRate: typeof taxRate === "number"
                ? taxRate
                : 0.18,
            shippingCost: typeof shippingCost === "number"
                ? shippingCost
                : 0,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        });
        res.status(200).json(order);
    }
    catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(400).json({
            message: error.message,
            stack: process.env.NODE_ENV === "development"
                ? error.stack
                : undefined,
        });
    }
};
exports.verifyPayment = verifyPayment;
//# sourceMappingURL=payment.controller.js.map