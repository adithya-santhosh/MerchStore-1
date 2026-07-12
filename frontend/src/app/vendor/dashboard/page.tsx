"use client";

import { useState, useEffect } from "react";
import { getVendorOrders } from "@/lib/api";
import VendorOrderCard from "@/components/vendor/VendorOrderCard";
import { Package, Loader2, InboxIcon } from "lucide-react";

export default function VendorDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getVendorOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const pendingCount = orders.filter(o => !["SHIPPED", "DELIVERED", "CANCELLED"].includes(o.status)).length;
  const shippedCount = orders.filter(o => ["SHIPPED", "DELIVERED"].includes(o.status)).length;

  const filteredOrders = filter === "ALL" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">Orders containing your products that need to be fulfilled.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: orders.length, color: "text-foreground", bg: "bg-muted/20" },
          { label: "Pending Dispatch", value: pendingCount, color: "text-amber-600", bg: "bg-amber-500/5" },
          { label: "Shipped / Delivered", value: shippedCount, color: "text-emerald-600", bg: "bg-emerald-500/5" },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl border border-border/60 p-4 ${stat.bg} space-y-1`}>
            <p className="text-xs text-muted-foreground font-semibold">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              filter === status
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border/60 hover:border-primary/40"
            }`}
          >
            {status === "ALL" ? "All Orders" : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-10 animate-spin text-primary/40" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-rose-500 font-semibold">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 border border-border/50 rounded-3xl bg-card/20">
          <InboxIcon className="size-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base font-bold text-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "ALL"
              ? "You have no orders with your products yet."
              : `No orders with status "${filter}" at the moment.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <VendorOrderCard key={order.id} order={order} onShipped={fetchOrders} />
          ))}
        </div>
      )}
    </div>
  );
}
