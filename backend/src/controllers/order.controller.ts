import { Request, Response } from "express";
import {
  createOrder,
  getOrdersByUser,
  getOrderById,
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatus,
} from "../services/order.service";

// ─── Customer Endpoints ───────────────────────────────────────────────────────

// POST /api/orders — place a new order (auth required)
export const placeOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { address, couponCode, paymentMethod, sessionToken } = req.body;

    if (!address || !address.addressLine1 || !address.city || !address.state || !address.postalCode) {
      return res.status(400).json({ message: "Shipping address is incomplete." });
    }

    if (!paymentMethod || !["cod", "razorpay"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method. Use 'cod' or 'razorpay'." });
    }

    const order = await createOrder({
      userId,
      address,
      couponCode,
      paymentMethod,
      sessionToken,
      // Tax rate and shipping cost are always computed server-side
      taxRate: 0.18,
      shippingCost: 0,
    });

    res.status(201).json(order);
  } catch (error: any) {
    console.error("Error in placeOrder controller:", error);
    res.status(400).json({ message: error.message || "Failed to place order." });
  }
};

// GET /api/orders — list the current user's own orders
export const listOrders = async (req: Request, res: Response) => {
  try {
    const orders = await getOrdersByUser(req.user!.id);
    res.json(orders);
  } catch (error: any) {
    console.error("Error in listOrders controller:", error);
    res.status(500).json({ message: error.message || "Failed to fetch orders." });
  }
};

// GET /api/orders/:id — fetch a specific order (scoped to the current user)
export const getOrder = async (req: Request, res: Response) => {
  try {
    const userId  = req.user!.id;
    const orderId = Number(req.params.id);

    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ message: "Invalid order ID." });
    }

    const order = await getOrderById(orderId, userId);
    res.json(order);
  } catch (error: any) {
    console.error("Error in getOrder controller:", error);
    const status = error.message === "Order not found" ? 404 : 500;
    res.status(status).json({ message: error.message || "Failed to fetch order." });
  }
};

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

// GET /api/orders/admin/all — list every order (admin only)
export const adminListOrders = async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrdersAdmin();
    res.json(orders);
  } catch (error: any) {
    console.error("Error in adminListOrders controller:", error);
    res.status(500).json({ message: error.message || "Failed to fetch orders." });
  }
};

// GET /api/orders/admin/:id — full order detail (admin only)
export const adminGetOrder = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ message: "Invalid order ID." });
    }
    const order = await getOrderByIdAdmin(orderId);
    res.json(order);
  } catch (error: any) {
    console.error("Error in adminGetOrder controller:", error);
    const status = error.message === "Order not found" ? 404 : 500;
    res.status(status).json({ message: error.message || "Failed to fetch order." });
  }
};

// PATCH /api/orders/admin/:id/status — update order status (admin only)
export const adminUpdateStatus = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ message: "Invalid order ID." });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status field is required." });
    }

    const updated = await updateOrderStatus(orderId, status);
    res.json(updated);
  } catch (error: any) {
    console.error("Error in adminUpdateStatus controller:", error);
    res.status(400).json({ message: error.message || "Failed to update status." });
  }
};
