import logger from "../lib/logger";
import { Request, Response } from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createMembershipRazorpayOrder,
  verifyMembershipPayment
} from "../services/payment.service";
import { resolveCheckoutUserId } from "../services/order.service";
import { signAuthToken } from "../services/auth.service";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, AUTH_COOKIE_MAX_AGE } from "../lib/auth-cookie";
import { setCsrfCookie } from "../lib/csrf";

// A newly resolved guest account gets signed into it — otherwise the
// requireAuth-gated confirmation/order-lookup routes would 401 the very
// customer who just paid. No-op for an already-authenticated request.
const issueGuestSessionIfNeeded = (res: Response, resolvedGuestUser: unknown) => {
    if (!resolvedGuestUser) return;
    const token = signAuthToken(resolvedGuestUser as Parameters<typeof signAuthToken>[0]);
    res.cookie(AUTH_COOKIE_NAME, token, { ...AUTH_COOKIE_OPTIONS, maxAge: AUTH_COOKIE_MAX_AGE });
    setCsrfCookie(res);
};

export const createPaymentOrder = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            address,
            couponCode,
            sessionToken,
            guest,
        } = req.body;

        const { userId, resolvedGuestUser } = await resolveCheckoutUserId(req.user?.id, guest, sessionToken);

        // Tax and shipping are derived server-side from system settings — see
        // prepareCheckout. Nothing money-related is accepted from the client.
        const payment = await createRazorpayOrder({
            userId,
            address,
            couponCode,
            paymentMethod: "razorpay",
            sessionToken,
        });

        issueGuestSessionIfNeeded(res, resolvedGuestUser);

        res.status(200).json(payment);

    } catch (error: any) {
    logger.error({ err: error }, "Payment Error");

    const status = /already exists with this email/.test(error.message || "") ? 409 : 400;
    res.status(status).json({
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
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            address,
            couponCode,
            sessionToken,
            guest,
        } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: "Missing Razorpay payment parameters." });
        }

        // A guest whose create-order leg already set the auth cookie above will
        // arrive here as req.user — this only re-resolves (by email lookup) if
        // that cookie somehow didn't make it back, e.g. a non-browser client.
        const { userId, resolvedGuestUser } = await resolveCheckoutUserId(req.user?.id, guest, sessionToken);

        // Tax and shipping are derived server-side from system settings — see
        // prepareCheckout. Nothing money-related is accepted from the client.
        const order = await verifyRazorpayPayment({
            userId,
            address,
            couponCode,
            paymentMethod: "razorpay",
            sessionToken,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        });

        issueGuestSessionIfNeeded(res, resolvedGuestUser);

        res.status(200).json(order);

    } catch (error: any) {
        logger.error({ err: error }, "Payment Verification Error");
        const status = /already exists with this email/.test(error.message || "") ? 409 : 400;
        res.status(status).json({
            message: error.message,
            // Only expose stack trace when explicitly running in development mode
            stack: process.env.NODE_ENV === "development"
                ? error.stack
                : undefined,
        });
    }
};

export const createMembershipOrder = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const result = await createMembershipRazorpayOrder(userId);
        res.status(200).json(result);
    } catch (error: any) {
        logger.error({ err: error }, "Create Membership Order Error");
        res.status(400).json({ message: error.message || "Failed to create membership order" });
    }
};

export const verifyMembership = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: "Missing Razorpay payment parameters." });
        }

        const user = await verifyMembershipPayment(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
        res.status(200).json(user);
    } catch (error: any) {
        logger.error({ err: error }, "Verify Membership Payment Error");
        res.status(400).json({ message: error.message || "Membership payment verification failed" });
    }
};

