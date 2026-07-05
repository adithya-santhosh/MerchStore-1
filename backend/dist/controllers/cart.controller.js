"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromCart = exports.updateQuantity = exports.addToCart = exports.getCart = void 0;
const cart_service_1 = require("../services/cart.service");
// Helper to extract session token from headers or query params
const getSessionToken = (req) => {
    const token = req.headers["x-session-token"] || req.query.sessionToken;
    return typeof token === "string" ? token : undefined;
};
const getCart = async (req, res) => {
    try {
        const sessionToken = getSessionToken(req);
        const cart = await (0, cart_service_1.getOrCreateCart)(sessionToken, req.user?.id);
        res.json(cart);
    }
    catch (error) {
        console.error("Error in getCart controller:", error);
        res.status(500).json({ message: error.message || "Failed to retrieve cart" });
    }
};
exports.getCart = getCart;
const addToCart = async (req, res) => {
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
        const cart = await (0, cart_service_1.addItemToCart)(sessionToken, userId, prodId, qty, true);
        res.json(cart);
    }
    catch (error) {
        console.error("Error in addToCart controller:", error);
        res.status(500).json({ message: error.message || "Failed to add item to cart" });
    }
};
exports.addToCart = addToCart;
const updateQuantity = async (req, res) => {
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
        const cart = await (0, cart_service_1.addItemToCart)(sessionToken, userId, prodId, qty, false);
        res.json(cart);
    }
    catch (error) {
        console.error("Error in updateQuantity controller:", error);
        res.status(500).json({ message: error.message || "Failed to update item quantity" });
    }
};
exports.updateQuantity = updateQuantity;
const removeFromCart = async (req, res) => {
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
        const cart = await (0, cart_service_1.removeItemFromCart)(sessionToken, userId, productId);
        res.json(cart);
    }
    catch (error) {
        console.error("Error in removeFromCart controller:", error);
        res.status(500).json({ message: error.message || "Failed to remove item from cart" });
    }
};
exports.removeFromCart = removeFromCart;
//# sourceMappingURL=cart.controller.js.map