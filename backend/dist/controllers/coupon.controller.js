"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePromoCode = exports.removeCoupon = exports.editCoupon = exports.createNewCoupon = exports.getCoupons = void 0;
const coupon_service_1 = require("../services/coupon.service");
const getCoupons = async (req, res) => {
    try {
        const coupons = await (0, coupon_service_1.getAllCoupons)();
        res.json(coupons);
    }
    catch (error) {
        console.error("Error in getCoupons controller:", error);
        res.status(500).json({ message: error.message || "Failed to load coupons" });
    }
};
exports.getCoupons = getCoupons;
const createNewCoupon = async (req, res) => {
    try {
        const coupon = await (0, coupon_service_1.createCoupon)(req.body);
        res.status(201).json(coupon);
    }
    catch (error) {
        console.error("Error in createNewCoupon controller:", error);
        res.status(500).json({ message: error.message || "Failed to create coupon" });
    }
};
exports.createNewCoupon = createNewCoupon;
const editCoupon = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid coupon ID" });
        }
        const coupon = await (0, coupon_service_1.updateCoupon)(id, req.body);
        res.json(coupon);
    }
    catch (error) {
        console.error("Error in editCoupon controller:", error);
        res.status(500).json({ message: error.message || "Failed to update coupon" });
    }
};
exports.editCoupon = editCoupon;
const removeCoupon = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid coupon ID" });
        }
        await (0, coupon_service_1.deleteCoupon)(id);
        res.json({ message: "Coupon deleted successfully" });
    }
    catch (error) {
        console.error("Error in removeCoupon controller:", error);
        res.status(500).json({ message: error.message || "Failed to delete coupon" });
    }
};
exports.removeCoupon = removeCoupon;
const validatePromoCode = async (req, res) => {
    try {
        const { code, orderAmount } = req.body;
        if (!code || typeof code !== "string") {
            return res.status(400).json({ message: "Coupon code is required" });
        }
        const amount = Number(orderAmount);
        if (isNaN(amount) || amount < 0) {
            return res.status(400).json({ message: "Valid order amount is required" });
        }
        const validated = await (0, coupon_service_1.validateCoupon)(code, amount);
        res.json(validated);
    }
    catch (error) {
        console.error("Error in validatePromoCode controller:", error);
        res.status(400).json({ message: error.message || "Failed to validate coupon" });
    }
};
exports.validatePromoCode = validatePromoCode;
//# sourceMappingURL=coupon.controller.js.map