import logger from "../lib/logger";
import { Request, Response } from "express";
import {
  getWishlist,
  getWishlistIds,
  addToWishlist,
  removeFromWishlist,
} from "../services/wishlist.service";

// GET /api/wishlist — full wishlist with product data
export const getWishlistCtrl = async (req: Request, res: Response) => {
  try {
    const items = await getWishlist(req.user!.id);
    res.json(items);
  } catch (error: any) {
    logger.error({ err: error }, "Error fetching wishlist");
    res.status(500).json({ message: error.message || "Failed to fetch wishlist" });
  }
};

// GET /api/wishlist/ids — just product IDs
export const getWishlistIdsCtrl = async (req: Request, res: Response) => {
  try {
    const ids = await getWishlistIds(req.user!.id);
    res.json(ids);
  } catch (error: any) {
    logger.error({ err: error }, "Error fetching wishlist IDs");
    res.status(500).json({ message: error.message || "Failed to fetch wishlist IDs" });
  }
};

// POST /api/wishlist/:productId — add to wishlist
export const addToWishlistCtrl = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const result = await addToWishlist(req.user!.id, productId);
    res.status(201).json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error adding to wishlist");
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ message: error.message || "Failed to add to wishlist" });
  }
};

// DELETE /api/wishlist/:productId — remove from wishlist
export const removeFromWishlistCtrl = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const result = await removeFromWishlist(req.user!.id, productId);
    res.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error removing from wishlist");
    res.status(500).json({ message: error.message || "Failed to remove from wishlist" });
  }
};
