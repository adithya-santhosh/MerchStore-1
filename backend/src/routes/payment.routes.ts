import { Router } from "express";
import { createPaymentOrder, verifyPayment, createMembershipOrder, verifyMembership } from "../controllers/payment.controller";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware";

const router = Router();

// optionalAuth: a signed-in shopper's id is used as-is; an anonymous request
// must carry guest contact details instead (see resolveCheckoutUserId).
router.post(
    "/create-order",
    optionalAuth,
    createPaymentOrder
);

router.post(
    "/verify",
    optionalAuth,
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

