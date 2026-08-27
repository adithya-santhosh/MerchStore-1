"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAdminOrderById, updateAdminOrderStatus, recordRefundApi, AdminOrderDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  MapPin,
  ShoppingBag,
  CreditCard,
  Truck,
  Package,
  Sparkles,
  CheckCircle2,
  Banknote,
  Calendar,
  Hash,
  ChevronDown,
  Save,
  AlertCircle,
} from "lucide-react";

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: "Pending",    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",      dot: "bg-amber-500" },
  confirmed:  { label: "Confirmed",  color: "text-blue-500 bg-blue-500/10 border-blue-500/30",         dot: "bg-blue-500" },
  processing: { label: "Processing", color: "text-purple-500 bg-purple-500/10 border-purple-500/30",   dot: "bg-purple-500" },
  shipped:    { label: "Shipped",    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30",         dot: "bg-cyan-500" },
  delivered:  { label: "Delivered",  color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",dot: "bg-emerald-500" },
  cancelled:  { label: "Cancelled",  color: "text-rose-500 bg-rose-500/10 border-rose-500/30",         dot: "bg-rose-500" },
};

const VALID_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "text-muted-foreground bg-muted/20 border-border", dot: "bg-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-border bg-card/30 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-primary" />
        </div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 text-xs">
      <span className="text-muted-foreground font-semibold shrink-0">{label}</span>
      <span className="text-foreground font-bold text-right">{value}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrderDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const orderId  = Number(params.id);

  const [order,         setOrder]         = useState<AdminOrderDetail | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [newStatus,     setNewStatus]     = useState("");
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState("");
  const [saveSuccess,   setSaveSuccess]   = useState(false);

  // ── Refund recording ────────────────────────────────────────────────────────
  const [refundReference,  setRefundReference]  = useState("");
  const [recordingRefund,  setRecordingRefund]  = useState(false);
  const [refundError,      setRefundError]      = useState("");

  // Cancelled + still-captured payment == money owed back to the customer.
  const refundOwed =
    order?.status?.toUpperCase() === "CANCELLED" &&
    order?.payment?.status?.toUpperCase() === "PAID";

  const handleRecordRefund = async () => {
    if (!order) return;
    setRecordingRefund(true);
    setRefundError("");
    try {
      const updated = await recordRefundApi(order.id, refundReference.trim() || undefined);
      setOrder((prev) => (prev ? { ...prev, ...updated } : prev));
      setRefundReference("");
    } catch (err: any) {
      setRefundError(err.message || "Could not record the refund. Please try again.");
    } finally {
      setRecordingRefund(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    getAdminOrderById(orderId)
      .then((data) => {
        setOrder(data);
        setNewStatus(data.status);
      })
      .catch((e) => setError(e.message || "Failed to load order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleSaveStatus = async () => {
    if (!order || newStatus === order.status) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      setOrder({ ...order, status: newStatus });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setSaveError(e.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto space-y-4">
        <AlertCircle className="size-10 text-destructive/60 mx-auto" />
        <h2 className="text-base font-bold">Order Not Found</h2>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button asChild variant="outline" size="sm" className="cursor-pointer">
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="space-y-8 max-w-5xl">

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link href="/admin/orders" className="flex items-center gap-1.5">
              <ArrowLeft className="size-3.5" /> Orders
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight">{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Calendar className="size-3" />
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
              &nbsp;·&nbsp;
              <Hash className="size-3" /> Order ID: {order.id}
            </p>
          </div>
        </div>

        {/* Status Update Control */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              id="status-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="pl-3 pr-8 py-2.5 text-xs font-semibold bg-muted/20 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
            >
              {VALID_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s]?.label ?? s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <Button
            id="save-status"
            size="sm"
            onClick={handleSaveStatus}
            disabled={saving || newStatus === order.status}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? (
              <div className="size-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <Save className="size-3.5" />
            )}
            {saveSuccess ? "Saved!" : "Save Status"}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive font-semibold">
          <AlertCircle className="size-4 shrink-0" /> {saveError}
        </div>
      )}

      {/* ── Grid Layout ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">

          {/* Customer */}
          <SectionCard icon={User} title="Customer">
            <div className="space-y-2.5">
              <InfoRow label="Name"  value={order.customer.name} />
              <InfoRow label="Email" value={order.customer.email} />
              {order.customer.phone && (
                <InfoRow label="Phone" value={order.customer.phone} />
              )}
              <InfoRow label="Customer ID" value={`#${order.customer.id}`} />
            </div>
          </SectionCard>

          {/* Items Ordered */}
          <SectionCard icon={ShoppingBag} title={`Items Ordered (${order.items.length})`}>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-muted/10"
                >
                  <div className="size-12 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Sparkles className="size-4 text-primary/30" />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × ₹{item.unitPrice.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">Product ID: #{item.productId}</p>
                  </div>
                  <span className="text-sm font-black text-foreground shrink-0">
                    ₹{item.totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Shipment Info (if available) */}
          {order.shipment && (
            <SectionCard icon={Truck} title="Shipment">
              <div className="space-y-2.5">
                <InfoRow label="Status"   value={order.shipment.status} />
                {order.shipment.carrier        && <InfoRow label="Carrier"         value={order.shipment.carrier} />}
                {order.shipment.trackingNumber && <InfoRow label="Tracking Number" value={order.shipment.trackingNumber} />}
                {order.shipment.shippedAt      && (
                  <InfoRow label="Shipped At" value={new Date(order.shipment.shippedAt).toLocaleDateString("en-IN")} />
                )}
                {order.shipment.deliveredAt && (
                  <InfoRow label="Delivered At" value={new Date(order.shipment.deliveredAt).toLocaleDateString("en-IN")} />
                )}
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── Right Column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-5">

          {/* Shipping Address */}
          <SectionCard icon={MapPin} title="Shipping Address">
            <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
              {addr.label && (
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{addr.label}</p>
              )}
              <p className="text-sm font-bold text-foreground">{order.customer.name}</p>
              <p>{addr.addressLine1}</p>
              {addr.addressLine2 && <p>{addr.addressLine2}</p>}
              <p>{addr.city}, {addr.state} – {addr.postalCode}</p>
              <p>{addr.country}</p>
            </div>
          </SectionCard>

          {/* Payment */}
          <SectionCard icon={CreditCard} title="Payment">
            {order.payment ? (
              <div className="space-y-2.5">
                <InfoRow
                  label="Method"
                  value={
                    <span className="flex items-center gap-1.5">
                      {order.payment.gateway === "cod" ? (
                        <><Banknote className="size-3.5 text-amber-500" /> Cash on Delivery</>
                      ) : (
                        <><CreditCard className="size-3.5 text-blue-500" /> Online Payment</>
                      )}
                    </span>
                  }
                />
                <InfoRow label="Amount" value={`₹${order.payment.amount.toLocaleString("en-IN")}`} />
                <InfoRow
                  label="Status"
                  value={<StatusBadge status={order.payment.status} />}
                />
                {order.payment.paidAt && (
                  <InfoRow
                    label="Paid At"
                    value={new Date(order.payment.paidAt).toLocaleString("en-IN")}
                  />
                )}

                {/* A cancelled order whose payment is still PAID owes the
                    customer money. Recording it here does not move funds —
                    the refund itself is issued in the payment gateway. */}
                {refundOwed && (
                  <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                    <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                      <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        This order was cancelled but the payment is still captured.
                        Issue the refund of{" "}
                        <span className="font-bold text-foreground">
                          ₹{order.payment.amount.toLocaleString("en-IN")}
                        </span>{" "}
                        in Razorpay
                        {order.payment.gatewayPaymentId && (
                          <> (payment <span className="font-mono">{order.payment.gatewayPaymentId}</span>)</>
                        )}
                        , then record it below.
                      </p>
                    </div>

                    {refundError && (
                      <p className="text-[11px] text-destructive font-semibold">{refundError}</p>
                    )}

                    <input
                      type="text"
                      value={refundReference}
                      onChange={(e) => setRefundReference(e.target.value)}
                      placeholder="Razorpay refund ID (optional)"
                      className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-mono"
                    />
                    <Button
                      onClick={handleRecordRefund}
                      disabled={recordingRefund}
                      className="w-full py-5 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {recordingRefund ? "Recording..." : "Mark refund as issued"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No payment record.</p>
            )}
          </SectionCard>

          {/* Price Breakdown */}
          <SectionCard icon={Package} title="Price Breakdown">
            <div className="space-y-2.5 border-b border-border/60 pb-3">
              <InfoRow label="Subtotal"  value={`₹${order.subtotal.toLocaleString("en-IN")}`} />
              <InfoRow
                label="Shipping"
                value={order.shippingCost === 0
                  ? <span className="text-emerald-500">Free</span>
                  : `₹${order.shippingCost.toLocaleString("en-IN")}`}
              />
              {order.taxAmount > 0 && (
                <InfoRow label="GST"     value={`₹${Math.round(order.taxAmount).toLocaleString("en-IN")}`} />
              )}
              {order.discountAmount > 0 && (
                <InfoRow
                  label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
                  value={<span className="text-emerald-500">−₹{Math.round(order.discountAmount).toLocaleString("en-IN")}</span>}
                />
              )}
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-2xl font-black text-primary">
                ₹{Math.round(order.totalAmount).toLocaleString("en-IN")}
              </span>
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
