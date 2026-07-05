"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/create-order", auth_middleware_1.requireAuth, payment_controller_1.createPaymentOrder);
router.post("/verify", auth_middleware_1.requireAuth, payment_controller_1.verifyPayment);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map