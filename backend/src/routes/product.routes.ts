import { Router } from "express";
import { getProducts, getProduct, createNewProduct, removeProduct, editProduct, getSubCategories, getNavMetadata } from "../controllers/product.controller";

const router = Router();

router.get("/", getProducts);
router.get("/navigation/metadata", getNavMetadata);
router.get("/:id", getProduct)
router.post('/', createNewProduct)
router.delete('/:id', removeProduct)
router.put('/:id', editProduct)

router.get("/subcategories/:category", getSubCategories);

export default router;