import { Request, Response } from "express";
import {createRazorpayOrder} from "../services/payment.service";

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
            taxRate,
            shippingCost,
        } = req.body;

        const payment = await createRazorpayOrder({
            userId,
            address,
            couponCode,
            paymentMethod: "razorpay",
            sessionToken,
            taxRate:
                typeof taxRate === "number"
                    ? taxRate
                    : 0.18,
            shippingCost:
                typeof shippingCost === "number"
                    ? shippingCost
                    : 0,
        });

        res.status(200).json(payment);

    } catch (error: any) {

        console.error(error);

        res.status(400).json({
            message:
                error.message ||
                "Unable to create payment."
        });

    }
};
export const verifyPayment = async (
    req: Request,
    res: Response
) => {

};
