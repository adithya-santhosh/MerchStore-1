import { Router } from "express";
import {
  placeOrder,
  listOrders,
  getOrder,
  adminListOrders,
  adminGetOrder,
  adminUpdateStatus,
} from "../controllers/order.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate, placeOrderSchema } from "../middleware/validation.middleware";

const router = Router();

// ── Admin routes FIRST (specific paths must come before generic /:id) ─────────
router.get("/admin/all",          requireAuth, requireAdmin, adminListOrders);
router.get("/admin/:id",          requireAuth, requireAdmin, adminGetOrder);
router.patch("/admin/:id/status", requireAuth, requireAdmin, adminUpdateStatus);

// ── Customer routes ───────────────────────────────────────────────────────────
router.post("/",   requireAuth, validate(placeOrderSchema), placeOrder);
router.get("/",    requireAuth, listOrders);
router.get("/:id", requireAuth, getOrder);

export default router;
