import Link from "next/link";
import { cookies } from "next/headers";
import { getDashboardData } from "@/lib/api";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import DashboardTimeRange from "./DashboardTimeRange";

interface PageProps {
  searchParams: Promise<{
    days?: string;
  }>;
}

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: "Pending",    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",     dot: "bg-amber-500" },
  confirmed:  { label: "Confirmed",  color: "text-blue-500 bg-blue-500/10 border-blue-500/30",        dot: "bg-blue-500" },
  processing: { label: "Processing", color: "text-purple-500 bg-purple-500/10 border-purple-500/30",  dot: "bg-purple-500" },
  shipped:    { label: "Shipped",    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30",        dot: "bg-cyan-500" },
  delivered:  { label: "Delivered",  color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-500" },
  cancelled:  { label: "Cancelled",  color: "text-rose-500 bg-rose-500/10 border-rose-500/30",        dot: "bg-rose-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "text-muted-foreground bg-muted/20 border-border", dot: "bg-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const days = Number(params.days) || 30;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const data = await getDashboardData(days, token);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Find max revenue for chart height calculation
  const maxRevenue = Math.max(...data.revenueChart.map((d) => d.revenue), 1000);

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Dashboard Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Store performance metrics, sales graphs, and item analysis.
          </p>
        </div>
        <DashboardTimeRange />
      </div>

      {/* ── Stats Overview cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Revenue",
            value: `₹${data.stats.totalRevenue.toLocaleString("en-IN")}`,
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-500/5",
          },
          {
            label: "Total Orders",
            value: data.stats.totalOrders,
            icon: ShoppingBag,
            color: "text-blue-500",
            bg: "bg-blue-500/5",
          },
          {
            label: "Avg Order Value",
            value: `₹${data.stats.averageOrderValue.toLocaleString("en-IN")}`,
            icon: TrendingUp,
            color: "text-purple-500",
            bg: "bg-purple-500/5",
          },
          {
            label: "Customers count",
            value: data.stats.totalCustomers,
            icon: Users,
            color: "text-amber-500",
            bg: "bg-amber-500/5",
          },
          {
            label: "Total Products",
            value: data.stats.totalProducts,
            icon: Package,
            color: "text-rose-500",
            bg: "bg-rose-500/5",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border border-border/70 p-4 ${stat.bg} space-y-1`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-semibold">
                {stat.label}
              </p>
              <stat.icon className={`size-4 ${stat.color} opacity-50`} />
            </div>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart (Pure CSS Bar Chart) ───────────────────────────── */}
      <div className="bg-card/40 border border-border/80 rounded-3xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Revenue Trend ({days} Days)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily total completed sales and order volume counts.
          </p>
        </div>

        {/* Chart Frame */}
        <div className="h-64 flex flex-col justify-end pt-4 border-b border-border/60">
          <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 h-full">
            {data.revenueChart.map((day) => {
              const heightPercent = (day.revenue / maxRevenue) * 100;
              return (
                <div
                  key={day.date}
                  className="flex-1 group flex flex-col items-center justify-end h-full relative"
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div className="bg-foreground text-background text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap text-center">
                      <p className="font-extrabold">₹{day.revenue.toLocaleString("en-IN")}</p>
                      <p className="text-[9px] opacity-75 font-medium mt-0.5">
                        {day.orderCount} order{day.orderCount === 1 ? "" : "s"} • {formatDate(day.date)}
                      </p>
                    </div>
                    <div className="w-1.5 h-1.5 bg-foreground rotate-45 -mt-1" />
                  </div>

                  {/* The bar itself */}
                  <div
                    style={{ height: `${Math.max(4, heightPercent)}%` }}
                    className={`w-full rounded-t-sm sm:rounded-t-md transition-all duration-300 cursor-pointer ${
                      day.revenue > 0
                        ? "bg-gradient-to-t from-primary to-primary/70 hover:from-primary hover:to-primary/90 shadow-sm"
                        : "bg-muted/30"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-Axis labels */}
        <div className="flex justify-between items-center px-1 text-[9px] text-muted-foreground font-bold">
          <span>{formatFullDate(data.revenueChart[0]?.date || "")}</span>
          <span>{formatFullDate(data.revenueChart[Math.floor(data.revenueChart.length / 2)]?.date || "")}</span>
          <span>{formatFullDate(data.revenueChart[data.revenueChart.length - 1]?.date || "")}</span>
        </div>
      </div>

      {/* ── Bottom Grid Layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Top Selling Products */}
        <div className="bg-card/40 border border-border/80 rounded-3xl p-6 space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-foreground">Top Selling Products</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Inventory items ranked by customer demand.</p>
            </div>
            <Sparkles className="size-4 text-primary opacity-60" />
          </div>

          {data.topProducts.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.topProducts.map((product, idx) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between py-3.5 gap-4 text-xs font-semibold"
                >
                  <div className="flex items-center gap-3.5 truncate">
                    <span className="text-muted-foreground font-extrabold w-4">{idx + 1}</span>
                    <div className="size-10 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.productName}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Package className="size-4 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-foreground truncate hover:text-primary transition-colors">
                        <Link href={`/admin/products/${product.productId}`}>
                          {product.productName}
                        </Link>
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        {product.totalQuantity} units sold
                      </p>
                    </div>
                  </div>

                  <span className="font-extrabold text-foreground text-right shrink-0">
                    ₹{product.totalRevenue.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs font-bold text-muted-foreground">
              No sales recorded for this period.
            </div>
          )}
        </div>

        {/* Right column: Status breakdown */}
        <div className="bg-card/40 border border-border/80 rounded-3xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Order Status Breakdown</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fulfillment pipeline distributions.</p>
          </div>

          <div className="space-y-3.5">
            {Object.entries(data.statusBreakdown).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status] ?? {
                label: status,
                color: "text-muted-foreground bg-muted/20 border-border",
                dot: "bg-muted-foreground",
              };
              return (
                <div
                  key={status}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 hover:bg-muted/10 transition-colors text-xs font-bold"
                >
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${cfg.dot}`} />
                    <span className="capitalize text-foreground font-bold">{cfg.label}</span>
                  </div>
                  <span className="bg-muted px-2 py-0.5 rounded-md text-foreground font-extrabold">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent Orders Section ─────────────────────────────────────────── */}
      <div className="bg-card/40 border border-border/80 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-foreground">Recent Orders</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              The latest user checkout transactions recorded on the store.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>View All Orders</span>
            <ChevronRight className="size-4" />
          </Link>
        </div>

        {data.recentOrders.length > 0 ? (
          <div className="bg-card/20 border border-border/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border/60">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 items-center hover:bg-muted/5 transition-colors text-xs font-semibold"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-bold text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </div>

                  <div className="col-span-3 text-foreground truncate">
                    {order.customer.name}
                  </div>

                  <div className="col-span-2 text-muted-foreground">
                    {formatFullDate(order.createdAt)}
                  </div>

                  <div className="col-span-2 font-extrabold text-foreground">
                    ₹{order.totalAmount.toLocaleString("en-IN")}
                  </div>

                  <div className="col-span-2 flex justify-between sm:justify-end items-center gap-2">
                    <StatusBadge status={order.status} />
                    <Link href={`/admin/orders/${order.id}`} className="text-muted-foreground hover:text-foreground">
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-xs font-bold text-muted-foreground">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
}
