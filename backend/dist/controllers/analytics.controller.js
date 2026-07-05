"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = void 0;
const analytics_service_1 = require("../services/analytics.service");
// ─── Single dashboard endpoint (returns all analytics in one call) ───────────
const getDashboard = async (req, res) => {
    try {
        const days = req.query.days ? Number(req.query.days) : undefined;
        const [stats, revenueChart, topProducts, recentOrders, statusBreakdown] = await Promise.all([
            (0, analytics_service_1.getDashboardStats)(days),
            (0, analytics_service_1.getRevenueChart)(days || 30),
            (0, analytics_service_1.getTopProducts)(5, days),
            (0, analytics_service_1.getRecentOrders)(5),
            (0, analytics_service_1.getOrderStatusBreakdown)(days),
        ]);
        res.json({
            stats,
            revenueChart,
            topProducts,
            recentOrders,
            statusBreakdown,
        });
    }
    catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
};
exports.getDashboard = getDashboard;
//# sourceMappingURL=analytics.controller.js.map