"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/", settings_controller_1.getSystemSettings);
router.put("/", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, settings_controller_1.editSystemSettings);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map