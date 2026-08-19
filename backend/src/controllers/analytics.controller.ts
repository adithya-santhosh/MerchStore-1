import logger from "../lib/logger";
import { Request, Response } from "express";
import {
  getDashboardStats,
  getRevenueChart,
  getTopProducts,
  getRecentOrders,
  getOrderStatusBreakdown,
} from "../services/analytics.service";

// ─── Single dashboard endpoint (returns all analytics in one call) ───────────

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? Number(req.query.days) : undefined;

    const [stats, revenueChart, topProducts, recentOrders, statusBreakdown] =
      await Promise.all([
        getDashboardStats(days),
        getRevenueChart(days || 30),
        getTopProducts(5, days),
        getRecentOrders(5),
        getOrderStatusBreakdown(days),
      ]);

    res.json({
      stats,
      revenueChart,
      topProducts,
      recentOrders,
      statusBreakdown,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch dashboard data");
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};
