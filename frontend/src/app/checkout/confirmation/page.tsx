"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getOrderById, Order } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ShoppingBag,
  MapPin,
  CreditCard,
  Truck,
  Package,
  ChevronRight,
  Sparkles,
  Banknote,
  Clock,
} from "lucide-react";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending:    { label: "Pending",    color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
    confirmed:  { label: "Confirmed",  color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
    processing: { label: "Processing", color: "text-purple-500 bg-purple-500/10 border-purple-500/30" },
    shipped:    { label: "Shipped",    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30" },
    delivered:  { label: "Delivered",  color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
    cancelled:  { label: "Cancelled",  color: "text-destructive bg-destructive/10 border-destructive/30" },
  };
  const cfg = map[status] || { label: status, color: "text-muted-foreground bg-muted/20 border-border" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Payment Gateway Label ────────────────────────────────────────────────────

function GatewayLabel({ gateway }: { gateway: string }) {
  if (gateway === "cod") return (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
      <Banknote className="size-4 text-amber-500" /> Cash on Delivery
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
      <CreditCard className="size-4 text-blue-500" /> Online Payment
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ConfirmationPageContent() {
  const searchParams = useSearchParams();
  const orderId = Number(searchParams.get("orderId"));

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId || isNaN(orderId)) {
      setError("No order ID provided.");
      setLoading(false);
      return;
    }
    getOrderById(orderId)
      .then(setOrder)
      .catch((e) => setError(e.message || "Failed to load order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading your order...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error || !order) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="max-w-md mx-auto text-center py-16 px-6 border border-border/80 rounded-3xl bg-card/25">
            <Package className="size-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">Order Not Found</h2>
            <p className="text-xs text-muted-foreground mb-6">{error || "We couldn't find your order."}</p>
            <Link href="/products">
              <Button className="text-xs font-semibold px-6 rounded-xl">Continue Shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────

  const addr = order.shippingAddress;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
        {/* Ambient glows */}
        <div className="absolute top-10 left-1/3 -z-10 size-96 rounded-full bg-emerald-500/5 blur-3xl opacity-50" />
        <div className="absolute bottom-10 right-1/3 -z-10 size-80 rounded-full bg-primary/5 blur-3xl opacity-40" />

        {/* ── Hero Success Block ──────────────────────────────────────────── */}
        <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
          {/* Animated check */}
          <div className="relative mx-auto size-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping opacity-50" />
            <div className="relative size-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <CheckCircle2 className="size-10 text-emerald-500" />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs font-semibold tracking-wide text-emerald-500 uppercase mb-3">
              <Sparkles className="size-3.5" />
              Order Confirmed!
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Thank you for your order!
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your order has been placed successfully and is being prepared.
            You'll receive updates as it ships.
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-border bg-card/40">
            <Package className="size-4 text-primary" />
            <span className="text-xs text-muted-foreground">Order Number:</span>
            <span className="text-sm font-black text-foreground">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">

          {/* ── Left: Items + Payment ─────────────────────────────────────── */}
          <div className="md:col-span-7 space-y-5">

            {/* Items List */}
            <div className="rounded-[2rem] border border-border bg-card/30 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="size-4 text-primary" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Items Ordered</h2>
              </div>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-muted/10"
                  >
                    <div className="size-12 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain" />
                      ) : (
                        <Sparkles className="size-4 text-primary/30" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × ₹{item.unitPrice.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="text-sm font-black text-foreground shrink-0">
                      ₹{item.totalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div className="rounded-[2rem] border border-border bg-card/30 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="size-4 text-primary" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Payment</h2>
              </div>

              {order.payment && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Method</span>
                    <GatewayLabel gateway={order.payment.gateway} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Status</span>
                    <StatusBadge status={order.payment.status} />
                  </div>
                  {order.payment.gateway === "cod" && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5 mt-2">
                      <Clock className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-500 font-semibold">
                        Payment will be collected upon delivery. Please keep exact change ready.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Address + Total ──────────────────────────────────────── */}
          <div className="md:col-span-5 space-y-5">

            {/* Shipping Address */}
            <div className="rounded-[2rem] border border-border bg-card/30 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="size-4 text-primary" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Delivery Address</h2>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed space-y-0.5">
                <p className="font-bold text-foreground text-sm">{addr.label || "Shipping"}</p>
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>{addr.city}, {addr.state} – {addr.postalCode}</p>
                <p>{addr.country || "India"}</p>
              </div>

              {/* Delivery Status Tracker */}
              <div className="pt-2 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="size-3.5" /> Shipment Status
                </p>
                <div className="flex items-center gap-2">
                  {["Order Placed", "Processing", "Shipped", "Delivered"].map((s, i) => {
                    const stepDone = i === 0; // Only first step done after order placement
                    return (
                      <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={`size-2.5 rounded-full shrink-0 ${stepDone ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                        {i < 3 && <div className={`flex-1 h-px ${stepDone ? "bg-emerald-500/40" : "bg-border"}`} />}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between">
                  {["Placed", "Processing", "Shipped", "Delivered"].map((s, i) => (
                    <span key={s} className={`text-[9px] font-semibold ${i === 0 ? "text-emerald-500" : "text-muted-foreground/50"}`}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="rounded-[2rem] border border-border bg-card/30 p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-foreground">Price Breakdown</h2>
              <div className="space-y-2 text-xs border-b border-border/60 pb-3">
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Subtotal</span>
                  <span className="text-foreground">₹{order.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Shipping</span>
                  {order.shippingCost === 0 ? (
                    <span className="text-emerald-500 font-bold uppercase">Free</span>
                  ) : (
                    <span className="text-foreground">₹{order.shippingCost.toLocaleString("en-IN")}</span>
                  )}
                </div>
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>GST</span>
                  <span className="text-foreground">₹{Math.round(order.taxAmount).toLocaleString("en-IN")}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-bold">
                    <span>Discount{order.couponCode && ` (${order.couponCode})`}</span>
                    <span>−₹{Math.round(order.discountAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-foreground">Total Paid</span>
                <span className="text-2xl font-black text-primary">
                  ₹{Math.round(order.totalAmount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2">
              <Link href="/products" className="block">
                <Button
                  id="continue-shopping"
                  className="w-full py-5 text-sm font-bold rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
                >
                  Continue Shopping
                  <ChevronRight className="size-4.5 ml-1" />
                </Button>
              </Link>
              <Link href="/" className="block text-center">
                <span className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer block py-1.5">
                  Back to Home
                </span>
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading your order...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <ConfirmationPageContent />
    </Suspense>
  );
}
