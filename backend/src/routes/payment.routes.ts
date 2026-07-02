import { Router } from "express";
import { createPaymentOrder, verifyPayment } from "../controllers/payment.controller";
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


export default router;
