import { Request, Response } from "express";
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } from "../services/coupon.service";

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await getAllCoupons();
    res.json(coupons);
  } catch (error: any) {
    console.error("Error in getCoupons controller:", error);
    res.status(500).json({ message: error.message || "Failed to load coupons" });
  }
};

export const createNewCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await createCoupon(req.body);
    res.status(201).json(coupon);
  } catch (error: any) {
    console.error("Error in createNewCoupon controller:", error);
    res.status(500).json({ message: error.message || "Failed to create coupon" });
  }
};

export const editCoupon = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }
    const coupon = await updateCoupon(id, req.body);
    res.json(coupon);
  } catch (error: any) {
    console.error("Error in editCoupon controller:", error);
    res.status(500).json({ message: error.message || "Failed to update coupon" });
  }
};

export const removeCoupon = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }
    await deleteCoupon(id);
    res.json({ message: "Coupon deleted successfully" });
  } catch (error: any) {
    console.error("Error in removeCoupon controller:", error);
    res.status(500).json({ message: error.message || "Failed to delete coupon" });
  }
};

export const validatePromoCode = async (req: Request, res: Response) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Coupon code is required" });
    }
    const amount = Number(orderAmount);
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({ message: "Valid order amount is required" });
    }

    const validated = await validateCoupon(code, amount);
    res.json(validated);
  } catch (error: any) {
    console.error("Error in validatePromoCode controller:", error);
    res.status(400).json({ message: error.message || "Failed to validate coupon" });
  }
};
