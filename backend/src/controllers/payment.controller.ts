import { Request, Response } from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../services/payment.service";

export const createPaymentOrder = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user!.id;

        const {
            address,
            couponCode,
            sessionToken,
        } = req.body;

        const payment = await createRazorpayOrder({
            userId,
            address,
            couponCode,
            paymentMethod: "razorpay",
            sessionToken,
            // Tax rate and shipping cost are always computed server-side
            taxRate: 0.18,
            shippingCost: 0,
        });

        res.status(200).json(payment);

    } catch (error: any) {
    console.error("Payment Error:", error);

    res.status(400).json({
        message: error.message,
        // Only expose stack trace when explicitly running in development mode
        stack: process.env.NODE_ENV === "development"
            ? error.stack
            : undefined,
    });
}
};
export const verifyPayment = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user!.id;

        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            address,
            couponCode,
            sessionToken,
        } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: "Missing Razorpay payment parameters." });
        }

        const order = await verifyRazorpayPayment({
            userId,
            address,
            couponCode,
            paymentMethod: "razorpay",
            sessionToken,
            // Tax rate and shipping cost are always computed server-side
            taxRate: 0.18,
            shippingCost: 0,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        });

        res.status(200).json(order);

    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        res.status(400).json({
            message: error.message,
            // Only expose stack trace when explicitly running in development mode
            stack: process.env.NODE_ENV === "development"
                ? error.stack
                : undefined,
        });
    }
};
