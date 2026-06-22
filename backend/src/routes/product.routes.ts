import { Router } from "express";
import { getProducts, getProduct, createNewProduct, removeProduct, editProduct, getSubCategories, getNavMetadata } from "../controllers/product.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getProducts);
router.get("/navigation/metadata", getNavMetadata);
router.get("/:id", getProduct);
router.post('/', requireAuth, requireAdmin, createNewProduct);
router.delete('/:id', requireAuth, requireAdmin, removeProduct);
router.put('/:id', requireAuth, requireAdmin, editProduct);

router.get("/subcategories/:category", getSubCategories);

export default router;