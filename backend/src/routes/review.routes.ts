import { Router } from "express";
import {
  getProductReviewsCtrl,
  getReviewStatsCtrl,
  getMyReviewCtrl,
  createReviewCtrl,
  deleteReviewCtrl,
} from "../controllers/review.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate, createReviewSchema } from "../middleware/validation.middleware";

const router = Router();

// Public routes
router.get("/:productId", getProductReviewsCtrl);
router.get("/:productId/stats", getReviewStatsCtrl);

// Authenticated routes
router.get("/:productId/mine", requireAuth, getMyReviewCtrl);
router.post("/:productId", requireAuth, validate(createReviewSchema), createReviewCtrl);
router.delete("/:reviewId", requireAuth, deleteReviewCtrl);

export default router;
