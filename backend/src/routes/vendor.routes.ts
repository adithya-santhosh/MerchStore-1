import { Router } from "express";
import { requireAuth, requireVendor, requireAdmin } from "../middleware/auth.middleware";
import {
  getMyOrders,
  shipOrder,
  createVendorAccount,
  listVendors,
  assignVendor
} from "../controllers/vendor.controller";

const router = Router();

// ─── Vendor routes (VENDOR or ADMIN) ─────────────────────────────────────────
router.get("/orders", requireAuth, requireVendor, getMyOrders);
router.patch("/orders/:orderId/ship", requireAuth, requireVendor, shipOrder);

// ─── Admin vendor management routes ──────────────────────────────────────────
router.get("/", requireAuth, requireAdmin, listVendors);
router.post("/", requireAuth, requireAdmin, createVendorAccount);
router.patch("/products/:productId/assign", requireAuth, requireAdmin, assignVendor);

export default router;
