import { Router } from "express";
import { createPaymentOrder, verifyPayment, createMembershipOrder, verifyMembership } from "../controllers/payment.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/create-order",
    requireAuth,
    createPaymentOrder
);

router.post(
    "/verify",
    requireAuth,
    verifyPayment
);

router.post(
    "/create-membership-order",
    requireAuth,
    createMembershipOrder
);

router.post(
    "/verify-membership",
    requireAuth,
    verifyMembership
);

export default router;

