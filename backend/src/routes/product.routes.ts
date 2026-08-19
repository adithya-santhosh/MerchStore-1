import { Router } from "express";
import { getProducts, getProduct, createNewProduct, removeProduct, editProduct, getSubCategories, getNavMetadata, getProductsAdminCtrl, getProductStatsCtrl, bulkUpdateProductsCtrl, searchProductsCtrl } from "../controllers/product.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate, createProductSchema } from "../middleware/validation.middleware";

const router = Router();

// ── Admin routes FIRST (specific paths must come before generic /:id) ────────
router.get("/admin/stats", requireAuth, requireAdmin, getProductStatsCtrl);
router.get("/admin", requireAuth, requireAdmin, getProductsAdminCtrl);
router.patch("/admin/bulk", requireAuth, requireAdmin, bulkUpdateProductsCtrl);

// ── Public routes ────────────────────────────────────────────────────────────
router.get("/", getProducts);
router.get("/search", searchProductsCtrl);
router.get("/navigation/metadata", getNavMetadata);
router.get("/:id", getProduct);
router.post('/', requireAuth, requireAdmin, validate(createProductSchema), createNewProduct);
router.delete('/:id', requireAuth, requireAdmin, removeProduct);
router.put('/:id', requireAuth, requireAdmin, editProduct);

router.get("/subcategories/:category", getSubCategories);

export default router;