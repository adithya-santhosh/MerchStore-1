"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
// ── Admin routes FIRST (specific paths must come before generic /:id) ─────────
router.get("/admin/all", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, order_controller_1.adminListOrders);
router.get("/admin/:id", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, order_controller_1.adminGetOrder);
router.patch("/admin/:id/status", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, order_controller_1.adminUpdateStatus);
// ── Customer routes ───────────────────────────────────────────────────────────
router.post("/", auth_middleware_1.requireAuth, (0, validation_middleware_1.validate)(validation_middleware_1.placeOrderSchema), order_controller_1.placeOrder);
router.get("/", auth_middleware_1.requireAuth, order_controller_1.listOrders);
router.get("/:id", auth_middleware_1.requireAuth, order_controller_1.getOrder);
exports.default = router;
//# sourceMappingURL=order.routes.js.map