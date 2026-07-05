"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/", auth_middleware_1.optionalAuth, cart_controller_1.getCart);
router.post("/items", auth_middleware_1.optionalAuth, cart_controller_1.addToCart);
router.put("/items", auth_middleware_1.optionalAuth, cart_controller_1.updateQuantity);
router.delete("/items/:productId", auth_middleware_1.optionalAuth, cart_controller_1.removeFromCart);
exports.default = router;
//# sourceMappingURL=cart.routes.js.map