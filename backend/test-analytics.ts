import {
  getDashboardStats,
  getRevenueChart,
  getTopProducts,
  getRecentOrders,
  getOrderStatusBreakdown,
} from "./src/services/analytics.service";

async function test() {
  try {
    console.log("Testing stats...");
    await getDashboardStats(30);
    console.log("Testing chart...");
    await getRevenueChart(30);
    console.log("Testing top products...");
    await getTopProducts(5, 30);
    console.log("Testing recent orders...");
    await getRecentOrders(5);
    console.log("Testing breakdown...");
    await getOrderStatusBreakdown(30);
    console.log("All passed!");
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
