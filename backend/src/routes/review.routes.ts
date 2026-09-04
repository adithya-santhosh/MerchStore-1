import { Router } from "express";
import {
  getProductReviewsCtrl,
  getReviewStatsCtrl,
  getMyReviewCtrl,
  createReviewCtrl,
  deleteReviewCtrl,
  getPendingReviewsCtrl,
  approveReviewCtrl,
  adminDeleteReviewCtrl,
} from "../controllers/review.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate, createReviewSchema } from "../middleware/validation.middleware";

const router = Router();

// ── Admin moderation routes FIRST (specific paths before generic /:productId) ─
router.get("/admin/pending", requireAuth, requireAdmin, getPendingReviewsCtrl);
router.patch("/admin/:reviewId/approve", requireAuth, requireAdmin, approveReviewCtrl);
router.delete("/admin/:reviewId", requireAuth, requireAdmin, adminDeleteReviewCtrl);

// Public routes
router.get("/:productId", getProductReviewsCtrl);
router.get("/:productId/stats", getReviewStatsCtrl);

// Authenticated routes
router.get("/:productId/mine", requireAuth, getMyReviewCtrl);
router.post("/:productId", requireAuth, validate(createReviewSchema), createReviewCtrl);
router.delete("/:reviewId", requireAuth, deleteReviewCtrl);

export default router;
