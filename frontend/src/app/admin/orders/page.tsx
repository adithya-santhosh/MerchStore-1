"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllOrders, AdminOrderRow, updateAdminOrderStatus } from "@/lib/api";
import {
  ShoppingBag,
  ChevronRight,
  Search,
  RefreshCw,
  Package,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [filtered, setFiltered] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleQuickStatusUpdate = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Filter + search
  useEffect(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [orders, search, statusFilter]);

  // Stats
  const stats = {
    total:     orders.length,
    pending:   orders.filter((o) => o.status === "pending").length,
    shipped:   orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.totalAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Orders Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track, manage, and update all customer orders.
          </p>
        </div>
        <Button
          id="refresh-orders"
          variant="outline"
          size="sm"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders",   value: stats.total,                            color: "text-foreground",      bg: "bg-muted/20" },
          { label: "Pending",        value: stats.pending,                          color: "text-amber-500",       bg: "bg-amber-500/5" },
          { label: "Shipped",        value: stats.shipped,                          color: "text-cyan-500",        bg: "bg-cyan-500/5" },
          { label: "Total Revenue",  value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "text-primary",   bg: "bg-primary/5" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border border-border/70 p-4 ${stat.bg} space-y-1`}
          >
            <p className="text-xs text-muted-foreground font-semibold">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            id="orders-search"
            type="text"
            placeholder="Search by order number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-muted/20 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>
        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-xs font-semibold bg-muted/20 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="bg-card/40 border border-border/80 rounded-3xl overflow-hidden shadow-sm">

          {/* Header Row */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/60 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-3">Order Number</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-1 text-right">View</div>
          </div>

          {/* Data Rows */}
          <div className="divide-y divide-border/60">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/10 transition-colors duration-150"
              >
                {/* Order Number */}
                <div className="col-span-3 flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="size-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{order.orderNumber}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">#{order.id}</p>
                  </div>
                </div>

                {/* Customer */}
                <div className="col-span-2">
                  <p className="text-sm font-bold text-foreground truncate">{order.customer.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{order.customer.email}</p>
                </div>

                {/* Total */}
                <div className="col-span-2">
                  <span className="text-sm font-black text-foreground">
                    ₹{order.totalAmount.toLocaleString("en-IN")}
                  </span>
                  {order.payment && (
                    <p className="text-[10px] text-muted-foreground capitalize">{order.payment.gateway.toUpperCase()}</p>
                  )}
                </div>

                {/* Status — inline quick-update */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleQuickStatusUpdate(order.id, e.target.value)}
                      className="text-[10px] font-bold bg-background border border-border/60 rounded-lg px-2 py-1 text-foreground focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                    {updatingId === order.id && (
                      <div className="size-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="col-span-1">
                  <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </p>
                </div>

                {/* View Link */}
                <div className="col-span-1 flex justify-end">
                  <Link href={`/admin/orders/${order.id}`}>
                    <button className="p-2 rounded-xl border border-border hover:bg-muted hover:border-primary/40 text-muted-foreground hover:text-primary transition-all cursor-pointer">
                      <ChevronRight className="size-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-border/80 rounded-3xl bg-card/20 max-w-md mx-auto space-y-4">
          <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/40 mx-auto">
            <Package className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">No Orders Found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              {search || statusFilter !== "all"
                ? "No orders match your current filters. Try adjusting your search."
                : "No orders have been placed yet. They will appear here once customers start buying."}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
