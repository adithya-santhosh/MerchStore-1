"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoupon = exports.deleteCoupon = exports.updateCoupon = exports.createCoupon = exports.getAllCoupons = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getAllCoupons = async () => {
    const coupons = await prisma_1.default.coupon.findMany({
        orderBy: { code: "asc" }
    });
    return coupons.map((c) => ({
        ...c,
        value: Number(c.value),
        minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null
    }));
};
exports.getAllCoupons = getAllCoupons;
const createCoupon = async (data) => {
    const coupon = await prisma_1.default.coupon.create({
        data: {
            code: data.code.toUpperCase().trim(),
            type: data.type, // "percent" or "fixed"
            value: Number(data.value),
            minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : null,
            maxUses: data.maxUses ? Number(data.maxUses) : null,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
        }
    });
    return {
        ...coupon,
        value: Number(coupon.value),
        minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null
    };
};
exports.createCoupon = createCoupon;
const updateCoupon = async (id, data) => {
    const updateData = {};
    if (data.code !== undefined)
        updateData.code = data.code.toUpperCase().trim();
    if (data.type !== undefined)
        updateData.type = data.type;
    if (data.value !== undefined)
        updateData.value = Number(data.value);
    if (data.minOrderAmount !== undefined)
        updateData.minOrderAmount = data.minOrderAmount ? Number(data.minOrderAmount) : null;
    if (data.maxUses !== undefined)
        updateData.maxUses = data.maxUses ? Number(data.maxUses) : null;
    if (data.expiresAt !== undefined)
        updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (data.isActive !== undefined)
        updateData.isActive = Boolean(data.isActive);
    const coupon = await prisma_1.default.coupon.update({
        where: { id },
        data: updateData
    });
    return {
        ...coupon,
        value: Number(coupon.value),
        minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null
    };
};
exports.updateCoupon = updateCoupon;
const deleteCoupon = async (id) => {
    return await prisma_1.default.coupon.delete({
        where: { id }
    });
};
exports.deleteCoupon = deleteCoupon;
const validateCoupon = async (code, orderAmount) => {
    const coupon = await prisma_1.default.coupon.findUnique({
        where: { code: code.toUpperCase().trim() }
    });
    if (!coupon) {
        throw new Error("Coupon code not found");
    }
    if (!coupon.isActive) {
        throw new Error("Coupon is inactive");
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        throw new Error("Coupon has expired");
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new Error("Coupon limit reached");
    }
    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
        throw new Error(`Minimum order amount of ₹${coupon.minOrderAmount} required`);
    }
    return {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value)
    };
};
exports.validateCoupon = validateCoupon;
//# sourceMappingURL=coupon.service.js.map