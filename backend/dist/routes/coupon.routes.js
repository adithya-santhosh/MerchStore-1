"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coupon_controller_1 = require("../controllers/coupon.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, coupon_controller_1.getCoupons);
router.post("/", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, coupon_controller_1.createNewCoupon);
router.put("/:id", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, coupon_controller_1.editCoupon);
router.delete("/:id", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, coupon_controller_1.removeCoupon);
router.post("/validate", coupon_controller_1.validatePromoCode);
exports.default = router;
//# sourceMappingURL=coupon.routes.js.map