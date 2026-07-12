"use client";

import { useState } from "react";
import { submitVendorShipment } from "@/lib/api";
import { Package, Truck, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface VendorOrderCardProps {
  order: {
    id: number;
    orderNumber: string;
    status: string;
    createdAt: string;
    customer: { firstName: string; lastName: string; email: string };
    shippingAddress: {
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      state: string;
      postalCode: string;
    };
    items: { productId: number; productName: string; quantity: number; unitPrice: number; imageUrl: string | null }[];
    shipment: { carrier: string | null; trackingNumber: string | null; status: string; shippedAt: string | null } | null;
  };
  onShipped: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  CONFIRMED: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  PROCESSING: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  SHIPPED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  DELIVERED: "bg-green-500/10 text-green-700 border-green-500/30",
  CANCELLED: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

export default function VendorOrderCard({ order, onShipped }: VendorOrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [carrier, setCarrier] = useState(order.shipment?.carrier || "");
  const [trackingNumber, setTrackingNumber] = useState(order.shipment?.trackingNumber || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!order.shipment?.trackingNumber);

  const isShipped = order.status === "SHIPPED" || order.status === "DELIVERED";

  const handleShip = async () => {
    if (!carrier.trim() || !trackingNumber.trim()) return;
    setSubmitting(true);
    try {
      await submitVendorShipment(order.id, { carrier: carrier.trim(), trackingNumber: trackingNumber.trim() });
      setSubmitted(true);
      onShipped();
    } catch (err) {
      console.error(err);
      alert("Failed to save shipment details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Package className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.items.length} item{order.items.length > 1 ? "s" : ""} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${STATUS_COLORS[order.status] || "bg-muted/30 text-muted-foreground"}`}>
            {order.status}
          </span>
          {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border/50 p-5 space-y-5">
          {/* Items */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Your Items in This Order</h4>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 bg-muted/20 rounded-xl p-3">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.productName} className="size-12 rounded-lg object-cover border border-border/50" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} · ₹{item.unitPrice.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ship To</h4>
            <div className="bg-muted/20 rounded-xl p-3 text-sm text-foreground space-y-0.5">
              <p className="font-semibold">{order.customer.firstName} {order.customer.lastName}</p>
              <p className="text-muted-foreground">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p className="text-muted-foreground">{order.shippingAddress.addressLine2}</p>}
              <p className="text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.postalCode}</p>
            </div>
          </div>

          {/* Shipment Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Truck className="size-3.5" />
              Shipment Details
            </h4>

            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-700">Shipment Recorded</p>
                  <p className="text-xs text-emerald-600 mt-1">Carrier: <strong>{carrier}</strong> · Tracking: <strong>{trackingNumber}</strong></p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-emerald-700 underline mt-1 hover:no-underline"
                  >
                    Update details
                  </button>
                </div>
              </div>
            ) : isShipped && !submitted ? (
              <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                Already marked as shipped.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Carrier</label>
                    <input
                      type="text"
                      placeholder="e.g. Blue Dart"
                      value={carrier}
                      onChange={e => setCarrier(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tracking Number</label>
                    <input
                      type="text"
                      placeholder="e.g. BD123456789IN"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>
                </div>
                <button
                  onClick={handleShip}
                  disabled={submitting || !carrier.trim() || !trackingNumber.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Truck className="size-4" />
                  {submitting ? "Saving..." : "Mark as Shipped"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
