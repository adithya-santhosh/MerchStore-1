"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getSettings = async () => {
    const settings = await prisma_1.default.systemSetting.findMany();
    // Default fallback configurations
    const config = {
        tax_rate: "0.18", // 18% default GST
        shipping_limit: "499", // Free shipping threshold
        shipping_cost: "99", // Shipping charge
        membership_fee: "999" // Default membership joining fee
    };
    for (const s of settings) {
        config[s.key] = s.value;
    }
    return {
        tax_rate: Number(config.tax_rate),
        shipping_limit: Number(config.shipping_limit),
        shipping_cost: Number(config.shipping_cost),
        membership_fee: Number(config.membership_fee)
    };
};
exports.getSettings = getSettings;
const updateSettings = async (data) => {
    for (const [key, value] of Object.entries(data)) {
        await prisma_1.default.systemSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
        });
    }
    return (0, exports.getSettings)();
};
exports.updateSettings = updateSettings;
//# sourceMappingURL=settings.service.js.map