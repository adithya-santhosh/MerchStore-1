"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
// Public — with input validation
router.post("/register", (0, validation_middleware_1.validate)(validation_middleware_1.registerSchema), auth_controller_1.register);
router.post("/login", (0, validation_middleware_1.validate)(validation_middleware_1.loginSchema), auth_controller_1.login);
// Protected
router.get("/me", auth_middleware_1.requireAuth, auth_controller_1.me);
router.put("/profile", auth_middleware_1.requireAuth, auth_controller_1.updateProfile);
router.post("/become-member", auth_middleware_1.requireAuth, auth_controller_1.becomeMember);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map