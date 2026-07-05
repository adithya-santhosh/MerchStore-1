import { Router } from "express";
import { getCart, addToCart, updateQuantity, removeFromCart } from "../controllers/cart.controller";
import { optionalAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", optionalAuth, getCart);
router.post("/items", optionalAuth, addToCart);
router.put("/items", optionalAuth, updateQuantity);
router.delete("/items/:productId", optionalAuth, removeFromCart);

export default router;
