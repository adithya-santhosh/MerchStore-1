import { Router } from "express";
import { getCoupons, createNewCoupon, editCoupon, removeCoupon, validatePromoCode } from "../controllers/coupon.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, requireAdmin, getCoupons);
router.post("/", requireAuth, requireAdmin, createNewCoupon);
router.put("/:id", requireAuth, requireAdmin, editCoupon);
router.delete("/:id", requireAuth, requireAdmin, removeCoupon);
router.post("/validate", validatePromoCode);

export default router;

