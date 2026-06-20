import { Router } from "express";
import { getProducts, getProduct, createNewProduct, removeProduct, editProduct } from "../controllers/product.controller";
import { getSubCategories } from "../controllers/product.controller";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProduct)
router.post('/', createNewProduct)
router.delete('/:id', removeProduct)
router.put('/:id', editProduct)

router.get("/subcategories/:category", getSubCategories);

export default router;