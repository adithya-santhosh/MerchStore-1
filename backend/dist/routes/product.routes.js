"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// ── Admin routes FIRST (specific paths must come before generic /:id) ────────
router.get("/admin/stats", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, product_controller_1.getProductStatsCtrl);
router.get("/admin", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, product_controller_1.getProductsAdminCtrl);
router.patch("/admin/bulk", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, product_controller_1.bulkUpdateProductsCtrl);
// ── Public routes ────────────────────────────────────────────────────────────
router.get("/", product_controller_1.getProducts);
router.get("/navigation/metadata", product_controller_1.getNavMetadata);
router.get("/:id", product_controller_1.getProduct);
router.post('/', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, product_controller_1.createNewProduct);
router.delete('/:id', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, product_controller_1.removeProduct);
router.put('/:id', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, product_controller_1.editProduct);
router.get("/subcategories/:category", product_controller_1.getSubCategories);
exports.default = router;
//# sourceMappingURL=product.routes.js.map