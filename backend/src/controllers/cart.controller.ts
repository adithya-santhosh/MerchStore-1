import logger from "../lib/logger";
import { Request, Response } from "express";
import { getOrCreateCart, addItemToCart, removeItemFromCart } from "../services/cart.service";

// Helper to extract session token from headers or query params
const getSessionToken = (req: Request): string | undefined => {
  const token = req.headers["x-session-token"] || req.query.sessionToken;
  return typeof token === "string" ? token : undefined;
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const sessionToken = getSessionToken(req);
    const cart = await getOrCreateCart(sessionToken, req.user?.id);
    res.json(cart);
  } catch (error: any) {
    logger.error({ err: error }, "Error in getCart controller");
    res.status(500).json({ message: error.message || "Failed to retrieve cart" });
  }
};

export const addToCart = async (req: Request, res: Response) => {
  try {
    const sessionToken = getSessionToken(req);
    const userId = req.user?.id;
    if (!sessionToken && !userId) {
      return res.status(400).json({ message: "Session token or user authentication is required" });
    }

    const { productId, quantity } = req.body;
    const prodId = Number(productId);
    const qty = Number(quantity);

    if (isNaN(prodId) || prodId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive integer" });
    }

    const cart = await addItemToCart(sessionToken, userId, prodId, qty, true);
    res.json(cart);
  } catch (error: any) {
    logger.error({ err: error }, "Error in addToCart controller");
    res.status(500).json({ message: error.message || "Failed to add item to cart" });
  }
};

export const updateQuantity = async (req: Request, res: Response) => {
  try {
    const sessionToken = getSessionToken(req);
    const userId = req.user?.id;
    if (!sessionToken && !userId) {
      return res.status(400).json({ message: "Session token or user authentication is required" });
    }

    const { productId, quantity } = req.body;
    const prodId = Number(productId);
    const qty = Number(quantity);

    if (isNaN(prodId) || prodId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: "Quantity must be a non-negative integer" });
    }

    const cart = await addItemToCart(sessionToken, userId, prodId, qty, false);
    res.json(cart);
  } catch (error: any) {
    logger.error({ err: error }, "Error in updateQuantity controller");
    res.status(500).json({ message: error.message || "Failed to update item quantity" });
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const sessionToken = getSessionToken(req);
    const userId = req.user?.id;
    if (!sessionToken && !userId) {
      return res.status(400).json({ message: "Session token or user authentication is required" });
    }

    const productId = Number(req.params.productId);
    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const cart = await removeItemFromCart(sessionToken, userId, productId);
    res.json(cart);
  } catch (error: any) {
    logger.error({ err: error }, "Error in removeFromCart controller");
    res.status(500).json({ message: error.message || "Failed to remove item from cart" });
  }
};
