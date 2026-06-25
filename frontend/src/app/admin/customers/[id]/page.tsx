import Link from "next/link";
import { cookies } from "next/headers";
import { getAdminCustomerById } from "@/lib/api";
import { ArrowLeft, Mail, Phone, Calendar, ShoppingBag, Receipt, Star, Heart, MapPin, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
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

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  const customer = await getAdminCustomerById(Number(id), token);

  if (!customer) {
    return (
      <div className="space-y-6 text-center py-20">
        <h2 className="text-xl font-bold text-foreground">Customer Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested customer profile could not be retrieved.</p>
        <Button asChild className="cursor-pointer">
          <Link href="/admin/customers">
            <ArrowLeft className="size-4 mr-2" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar / Back button ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/customers"
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Customers</span>
        </Link>
      </div>

      {/* ── Profile Header Block ─────────────────────────────────────────── */}
      <div className="bg-card/40 border border-border/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="size-16 sm:size-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl shadow-sm">
            {getInitials(customer.name)}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {customer.name}
              </h1>
              {customer.role === "ADMIN" && (
                <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 text-xs text-muted-foreground font-semibold">
              <div className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground/60" />
                <span>{customer.email}</span>
                {customer.emailVerified ? (
                  <span title="Verified"><CheckCircle className="size-3.5 text-emerald-500" /></span>
                ) : (
                  <span title="Unverified"><XCircle className="size-3.5 text-muted-foreground/40" /></span>
                )}
              </div>
              {customer.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground/60" />
                  <span>{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground/60" />
                <span>Joined {formatDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Metric Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Purchases",
            value: `₹${customer.totalSpent.toLocaleString("en-IN")}`,
            sub: "Delivered volume",
            icon: ShoppingBag,
            color: "text-emerald-500",
            bg: "bg-emerald-500/5",
          },
          {
            label: "Orders Placed",
            value: customer.totalOrders,
            sub: "Total order count",
            icon: Receipt,
            color: "text-blue-500",
            bg: "bg-blue-500/5",
          },
          {
            label: "Reviews Written",
            value: customer.totalReviews,
            sub: "Feedback count",
            icon: Star,
            color: "text-amber-500",
            bg: "bg-amber-500/5",
          },
          {
            label: "Wishlist Items",
            value: customer.totalWishlist,
            sub: "Items saved",
            icon: Heart,
            color: "text-rose-500",
            bg: "bg-rose-500/5",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border border-border/70 p-4 ${stat.bg} space-y-1.5`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-semibold">
                {stat.label}
              </p>
              <stat.icon className={`size-4 ${stat.color} opacity-60`} />
            </div>
            <p className="text-2xl font-black text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Two-Column Layout (Orders & Addresses) ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Receipt className="size-4 text-muted-foreground" />
              Recent Order History
            </h2>
            <span className="text-[10px] font-extrabold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Showing last 10
            </span>
          </div>

          {customer.recentOrders.length > 0 ? (
            <div className="bg-card/40 border border-border/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-border/60">
                {customer.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row justify-between sm:items-center p-4 gap-4 hover:bg-muted/5 transition-colors text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-bold text-primary hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        Placed on {formatDate(order.createdAt)} • {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <span className="font-extrabold text-foreground">
                        ₹{order.totalAmount.toLocaleString("en-IN")}
                      </span>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center"
                      >
                        Manage Order
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border border-border/85 rounded-2xl bg-card/10 space-y-3">
              <Receipt className="size-8 text-muted-foreground/35 mx-auto" />
              <div className="text-xs font-bold text-muted-foreground">No Order History</div>
              <p className="text-[10px] text-muted-foreground/80 max-w-xs mx-auto">
                This customer has not placed any orders in the store yet.
              </p>
            </div>
          )}
        </div>

        {/* Right 1 col: Addresses */}
        <div className="space-y-4">
          <div className="px-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              Addresses
            </h2>
          </div>

          {customer.addresses.length > 0 ? (
            <div className="space-y-3">
              {customer.addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-2xl p-4 space-y-2.5 relative bg-card/25 ${
                    address.isDefault ? "border-primary/40 bg-primary/5" : "border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-foreground bg-muted px-2 py-0.5 rounded-md tracking-wider">
                      {address.label || "Address"}
                    </span>
                    {address.isDefault && (
                      <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-foreground/80 leading-relaxed font-semibold">
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p>
                      {address.city}, {address.state} — {address.postalCode}
                    </p>
                    <p className="text-muted-foreground/80 text-[10px] mt-1">{address.country}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-border/85 rounded-2xl bg-card/10 space-y-3">
              <MapPin className="size-8 text-muted-foreground/35 mx-auto" />
              <div className="text-xs font-bold text-muted-foreground">No Saved Addresses</div>
              <p className="text-[10px] text-muted-foreground/80 max-w-xs mx-auto">
                No addresses saved for this customer profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
