import { Router } from "express";
import {
  getWishlistCtrl,
  getWishlistIdsCtrl,
  addToWishlistCtrl,
  removeFromWishlistCtrl,
} from "../controllers/wishlist.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// All wishlist routes require authentication
router.get("/", requireAuth, getWishlistCtrl);
router.get("/ids", requireAuth, getWishlistIdsCtrl);
router.post("/:productId", requireAuth, addToWishlistCtrl);
router.delete("/:productId", requireAuth, removeFromWishlistCtrl);

export default router;
