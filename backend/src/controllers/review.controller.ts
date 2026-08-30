import logger from "../lib/logger";
import { Request, Response } from "express";
import {
  getReviewsForProduct,
  getReviewStats,
  createReview,
  deleteReview,
  getUserReviewForProduct,
} from "../services/review.service";

// GET /api/reviews/:productId — public
export const getProductReviewsCtrl = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const reviews = await getReviewsForProduct(productId);
    res.json(reviews);
  } catch (error: any) {
    logger.error({ err: error }, "Error fetching reviews");
    res.status(500).json({ message: error.message || "Failed to fetch reviews" });
  }
};

// GET /api/reviews/:productId/stats — public
export const getReviewStatsCtrl = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const stats = await getReviewStats(productId);
    res.json(stats);
  } catch (error: any) {
    logger.error({ err: error }, "Error fetching review stats");
    res.status(500).json({ message: error.message || "Failed to fetch review stats" });
  }
};

// GET /api/reviews/:productId/mine — requireAuth
export const getMyReviewCtrl = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const review = await getUserReviewForProduct(req.user!.id, productId);
    res.json(review);
  } catch (error: any) {
    logger.error({ err: error }, "Error fetching user review");
    res.status(500).json({ message: error.message || "Failed to fetch your review" });
  }
};

// POST /api/reviews/:productId — requireAuth, validate(createReviewSchema)
export const createReviewCtrl = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const { rating, title, body } = req.body;
    const review = await createReview(req.user!.id, productId, {
      rating,
      title: title ?? undefined,
      body: body ?? undefined,
    });
    res.status(201).json(review);
  } catch (error: any) {
    logger.error({ err: error }, "Error creating review");
    const statusCode = error.message.includes("already reviewed") ? 409 : 500;
    res.status(statusCode).json({ message: error.message || "Failed to create review" });
  }
};

// DELETE /api/reviews/:reviewId — requireAuth
export const deleteReviewCtrl = async (req: Request, res: Response) => {
  try {
    const reviewId = Number(req.params.reviewId);
    if (!reviewId || reviewId <= 0) {
      return res.status(400).json({ message: "Invalid review ID" });
    }
    const result = await deleteReview(reviewId, req.user!.id);
    res.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error deleting review");
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("own review") ? 403 : 500;
    res.status(statusCode).json({ message: error.message || "Failed to delete review" });
  }
};
