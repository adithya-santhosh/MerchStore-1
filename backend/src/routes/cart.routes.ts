import { Router } from "express";
import { getCart, addToCart, updateQuantity, removeFromCart } from "../controllers/cart.controller";

const router = Router();

router.get("/", getCart);
router.post("/items", addToCart);
router.put("/items", updateQuantity);
router.delete("/items/:productId", removeFromCart);

export default router;
