import logger from "../lib/logger";
import { Request, Response } from "express";
import {
  getVendorByUserId,
  getVendorOrders,
  submitVendorShipment,
  createVendor,
  getAllVendors,
  assignProductToVendor
} from "../services/vendor.service";

// ─── Vendor: Get my orders ─────────────────────────────────────────────────────
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const vendor = await getVendorByUserId(req.user!.id);
    if (!vendor) return res.status(404).json({ message: "Vendor profile not found." });

    const orders = await getVendorOrders(vendor.id);
    res.json(orders);
  } catch (error: any) {
    logger.error({ err: error }, "getMyOrders error");
    res.status(500).json({ message: error.message || "Failed to fetch vendor orders." });
  }
};

// ─── Vendor: Submit shipment details for an order ─────────────────────────────
export const shipOrder = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ message: "Invalid order ID." });
    }

    const { carrier, trackingNumber } = req.body;
    if (!carrier || !trackingNumber) {
      return res.status(400).json({ message: "carrier and trackingNumber are required." });
    }

    const vendor = await getVendorByUserId(req.user!.id);
    if (!vendor) return res.status(404).json({ message: "Vendor profile not found." });

    const shipment = await submitVendorShipment(vendor.id, orderId, { carrier, trackingNumber });
    res.json({ message: "Shipment details saved successfully.", shipment });
  } catch (error: any) {
    logger.error({ err: error }, "shipOrder error");
    res.status(error.message.includes("belong") ? 403 : 500).json({ message: error.message });
  }
};

// ─── Admin: Create a new vendor account ──────────────────────────────────────
export const createVendorAccount = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;
    if (!email || !password || !firstName || !lastName || !companyName) {
      return res.status(400).json({ message: "All fields (email, password, firstName, lastName, companyName) are required." });
    }
    const vendor = await createVendor({ email, password, firstName, lastName, companyName });
    res.status(201).json(vendor);
  } catch (error: any) {
    logger.error({ err: error }, "createVendorAccount error");
    const status = error.message?.includes("Unique") ? 409 : 500;
    res.status(status).json({ message: error.message || "Failed to create vendor." });
  }
};

// ─── Admin: List all vendors (paginated) ──────────────────────────────────────
export const listVendors = async (req: Request, res: Response) => {
  try {
    const result = await getAllVendors({
      ...(req.query.page  ? { page: Number(req.query.page) }   : {}),
      ...(req.query.limit ? { limit: Number(req.query.limit) } : {}),
    });
    res.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "listVendors error");
    res.status(500).json({ message: error.message || "Failed to fetch vendors." });
  }
};

// ─── Admin: Assign a product to a vendor (or clear with vendorId: null) ───────
export const assignVendor = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const { vendorId } = req.body; // null to unassign
    if (!Number.isInteger(productId)) return res.status(400).json({ message: "Invalid product ID." });

    const product = await assignProductToVendor(productId, vendorId ?? null);
    res.json({ message: "Product vendor updated.", product });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to assign vendor." });
  }
};
