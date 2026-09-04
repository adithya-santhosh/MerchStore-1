import { Router } from "express";
import {
  placeOrder,
  listOrders,
  getOrder,
  cancelMyOrder,
  adminListOrders,
  adminGetOrder,
  adminUpdateStatus,
  adminListRefundsOwed,
  adminRecordRefund,
} from "../controllers/order.controller";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth.middleware";
import { validate, placeOrderSchema } from "../middleware/validation.middleware";

const router = Router();

// ── Admin routes FIRST (specific paths must come before generic /:id) ─────────
router.get("/admin/all",          requireAuth, requireAdmin, adminListOrders);
// Before /admin/:id so "refunds-owed" isn't captured as an order id.
router.get("/admin/refunds-owed", requireAuth, requireAdmin, adminListRefundsOwed);
router.patch("/admin/:id/refund", requireAuth, requireAdmin, adminRecordRefund);
router.get("/admin/:id",          requireAuth, requireAdmin, adminGetOrder);
router.patch("/admin/:id/status", requireAuth, requireAdmin, adminUpdateStatus);

// ── Customer routes ───────────────────────────────────────────────────────────
// optionalAuth: a signed-in shopper's id is used as-is; an anonymous request
// must carry guest contact details instead (see resolveCheckoutUserId).
router.post("/",   optionalAuth, validate(placeOrderSchema), placeOrder);
router.get("/",    requireAuth, listOrders);
// Registered before the generic /:id so "cancel" isn't swallowed as an id.
router.patch("/:id/cancel", requireAuth, cancelMyOrder);
router.get("/:id", requireAuth, getOrder);

export default router;
