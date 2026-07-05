"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdateStatus = exports.adminGetOrder = exports.adminListOrders = exports.getOrder = exports.listOrders = exports.placeOrder = void 0;
const order_service_1 = require("../services/order.service");
// ─── Customer Endpoints ───────────────────────────────────────────────────────
// POST /api/orders — place a new order (auth required)
const placeOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { address, couponCode, paymentMethod, sessionToken, taxRate, shippingCost } = req.body;
        if (!address || !address.addressLine1 || !address.city || !address.state || !address.postalCode) {
            return res.status(400).json({ message: "Shipping address is incomplete." });
        }
        if (!paymentMethod || !["cod", "razorpay"].includes(paymentMethod)) {
            return res.status(400).json({ message: "Invalid payment method. Use 'cod' or 'razorpay'." });
        }
        const order = await (0, order_service_1.createOrder)({
            userId,
            address,
            couponCode,
            paymentMethod,
            sessionToken,
            taxRate: typeof taxRate === "number" ? taxRate : 0.18,
            shippingCost: typeof shippingCost === "number" ? shippingCost : 0,
        });
        res.status(201).json(order);
    }
    catch (error) {
        console.error("Error in placeOrder controller:", error);
        res.status(400).json({ message: error.message || "Failed to place order." });
    }
};
exports.placeOrder = placeOrder;
// GET /api/orders — list the current user's own orders
const listOrders = async (req, res) => {
    try {
        const orders = await (0, order_service_1.getOrdersByUser)(req.user.id);
        res.json(orders);
    }
    catch (error) {
        console.error("Error in listOrders controller:", error);
        res.status(500).json({ message: error.message || "Failed to fetch orders." });
    }
};
exports.listOrders = listOrders;
// GET /api/orders/:id — fetch a specific order (scoped to the current user)
const getOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = Number(req.params.id);
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({ message: "Invalid order ID." });
        }
        const order = await (0, order_service_1.getOrderById)(orderId, userId);
        res.json(order);
    }
    catch (error) {
        console.error("Error in getOrder controller:", error);
        const status = error.message === "Order not found" ? 404 : 500;
        res.status(status).json({ message: error.message || "Failed to fetch order." });
    }
};
exports.getOrder = getOrder;
// ─── Admin Endpoints ──────────────────────────────────────────────────────────
// GET /api/orders/admin/all — list every order (admin only)
const adminListOrders = async (req, res) => {
    try {
        const orders = await (0, order_service_1.getAllOrdersAdmin)();
        res.json(orders);
    }
    catch (error) {
        console.error("Error in adminListOrders controller:", error);
        res.status(500).json({ message: error.message || "Failed to fetch orders." });
    }
};
exports.adminListOrders = adminListOrders;
// GET /api/orders/admin/:id — full order detail (admin only)
const adminGetOrder = async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({ message: "Invalid order ID." });
        }
        const order = await (0, order_service_1.getOrderByIdAdmin)(orderId);
        res.json(order);
    }
    catch (error) {
        console.error("Error in adminGetOrder controller:", error);
        const status = error.message === "Order not found" ? 404 : 500;
        res.status(status).json({ message: error.message || "Failed to fetch order." });
    }
};
exports.adminGetOrder = adminGetOrder;
// PATCH /api/orders/admin/:id/status — update order status (admin only)
const adminUpdateStatus = async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({ message: "Invalid order ID." });
        }
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: "Status field is required." });
        }
        const updated = await (0, order_service_1.updateOrderStatus)(orderId, status);
        res.json(updated);
    }
    catch (error) {
        console.error("Error in adminUpdateStatus controller:", error);
        res.status(400).json({ message: error.message || "Failed to update status." });
    }
};
exports.adminUpdateStatus = adminUpdateStatus;
//# sourceMappingURL=order.controller.js.map