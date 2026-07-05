"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/admin/stats", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, customer_controller_1.getCustomerStatsCtrl);
router.get("/admin", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, customer_controller_1.listCustomers);
router.get("/admin/:id", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, customer_controller_1.getCustomer);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map