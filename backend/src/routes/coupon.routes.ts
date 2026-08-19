import { Router } from "express";
import { getCoupons, createNewCoupon, editCoupon, removeCoupon, validatePromoCode } from "../controllers/coupon.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate, createCouponSchema, updateCouponSchema, couponValidateSchema } from "../middleware/validation.middleware";
import rateLimit from "express-rate-limit";

const router = Router();

// Tighter rate limit for the public coupon validate endpoint
const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many coupon attempts. Please try again later." },
});

router.get("/", requireAuth, requireAdmin, getCoupons);
router.post("/", requireAuth, requireAdmin, validate(createCouponSchema), createNewCoupon);
router.put("/:id", requireAuth, requireAdmin, validate(updateCouponSchema), editCoupon);
router.delete("/:id", requireAuth, requireAdmin, removeCoupon);
router.post("/validate", requireAuth, couponLimiter, validate(couponValidateSchema), validatePromoCode);

export default router;

