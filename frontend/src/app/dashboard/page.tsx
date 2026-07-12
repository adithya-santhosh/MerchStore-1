"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { getMyOrders, updateProfile, Order, OrderItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/hooks/useWishlist";
import { getWishlist, WishlistItem } from "@/lib/api";
import { 
  User, 
  ShoppingBag, 
  Settings, 
  ChevronRight, 
  ArrowLeft,
  Calendar, 
  Mail, 
  Phone, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  CreditCard,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Package,
  ArrowUpRight,
  Heart
} from "lucide-react";

// Color mappings for order statuses
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  pending:    { label: "Pending",    color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30",     dot: "bg-amber-500" },
  confirmed:  { label: "Confirmed",  color: "text-blue-500",  bg: "bg-blue-500/10 border-blue-500/30",        dot: "bg-blue-500" },
  processing: { label: "Processing", color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/30",  dot: "bg-purple-500" },
  shipped:    { label: "Shipped",    color: "text-cyan-500",   bg: "bg-cyan-500/10 border-cyan-500/30",        dot: "bg-cyan-500" },
  delivered:  { label: "Delivered",  color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-500" },
  cancelled:  { label: "Cancelled",  color: "text-rose-500",    bg: "bg-rose-500/10 border-rose-500/30",        dot: "bg-rose-500" },
};

export default function UserDashboard() {
  const { user, loading: authLoading, logout, updateProfile: updateProfileContext, becomeMember } = useAuth();
  const { wishlistCount } = useWishlist();
  
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "profile" | "wishlist">("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [membershipFee, setMembershipFee] = useState<number>(999);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipError, setMembershipError] = useState("");
  const [membershipSuccess, setMembershipSuccess] = useState("");
  
  // Profile Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Filter for orders list
  const [orderFilter, setOrderFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");

  // Wishlist state
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");

      getMyOrders()
        .then((data) => {
          setOrders(data);
          setOrdersLoading(false);
        })
        .catch((err) => {
          console.error("Error loading user orders:", err);
          setOrdersLoading(false);
        });
    }
  }, [user]);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
    fetch(`${API_URL}/api/settings`, { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (data && data.membership_fee) {
          setMembershipFee(data.membership_fee);
        }
      })
      .catch(err => console.error("Failed to load settings:", err));
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-muted-foreground animate-pulse">Loading secure area...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // Middleware handles redirection, this is a fallback
  }

  // Calculations for stats
  const successfulOrders = orders.filter(o => o.status.toLowerCase() !== "cancelled");
  const totalSpent = successfulOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const activeOrdersCount = orders.filter(o => 
    ["pending", "confirmed", "processing", "shipped"].includes(o.status.toLowerCase())
  ).length;

  useEffect(() => {
    if (activeTab === "wishlist") {
      setWishlistLoading(true);
      getWishlist()
        .then(setWishlistItems)
        .catch(err => console.error("Error loading wishlist:", err))
        .finally(() => setWishlistLoading(false));
    }
  }, [activeTab]);



  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormSubmitting(true);

    try {
      // update backend and frontend state
      await updateProfileContext(firstName, lastName, phone || null);
      setFormSuccess("Your profile has been updated successfully.");
      
      // Auto-clear success message after 4s
      setTimeout(() => setFormSuccess(""), 4000);
    } catch (err: any) {
      setFormError(err.message || "Failed to update profile details. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const cfg = STATUS_CONFIG[statusLower] ?? { 
      label: status, 
      color: "text-muted-foreground", 
      bg: "bg-muted/10 border-border", 
      dot: "bg-muted-foreground" 
    };
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
        <span className={`size-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  };

  // Filter orders logic
  const filteredOrders = orders.filter(order => {
    const status = order.status.toLowerCase();
    if (orderFilter === "active") {
      return ["pending", "confirmed", "processing", "shipped"].includes(status);
    }
    if (orderFilter === "completed") {
      return status === "delivered";
    }
    if (orderFilter === "cancelled") {
      return status === "cancelled";
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative overflow-hidden">
        
        {/* Background Ambient Mesh Glows */}
        <div className="absolute top-0 right-1/4 -z-10 size-[500px] rounded-full bg-primary/2 opacity-20 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 -z-10 size-[400px] rounded-full bg-primary/3 opacity-20 blur-3xl" />

        {/* Dashboard Title & Quick Stats */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Welcome back, {user.firstName}!
                </h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  user.isMember 
                    ? "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-600 text-yellow-950 border-yellow-400/40 font-black shadow-[0_0_20px_rgba(250,204,21,0.25)] animate-pulse" 
                    : "bg-muted/30 border-border text-muted-foreground"
                }`}>
                  {user.isMember ? "Premium Club" : "Standard Account"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}
              </p>
            </div>
            
            {/* Quick Logout Button */}
            <Button 
              variant="outline" 
              onClick={logout}
              className="md:self-center border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/30 rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              Sign Out
            </Button>
          </div>

          {/* Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Stat Card 1: Total Spent */}
            <div className="bg-card/45 border border-border/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md transition-all hover:border-primary/20">
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Spent</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-1">₹{totalSpent.toLocaleString("en-IN")}</p>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-500" />
                <span>Across {successfulOrders.length} orders</span>
              </div>
            </div>

            {/* Stat Card 2: Active Orders */}
            <div className="bg-card/45 border border-border/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md transition-all hover:border-primary/20">
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Orders</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-1">{activeOrdersCount}</p>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="size-3 text-amber-500" />
                <span>In packaging or transit</span>
              </div>
            </div>

            {/* Stat Card 3: Total Orders placed */}
            <div className="bg-card/45 border border-border/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md transition-all hover:border-primary/20">
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Orders</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-1">{orders.length}</p>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <ShoppingBag className="size-3 text-primary" />
                <span>All time order history</span>
              </div>
            </div>

            {/* Stat Card 4: Membership Status */}
            <div className="bg-card/45 border border-border/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md transition-all hover:border-primary/20 flex flex-col justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Membership Status</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    user.isMember 
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                      : "bg-muted text-muted-foreground border border-border"
                  }`}>
                    {user.isMember ? "Premium Member" : "Regular Member"}
                  </span>
                </div>
              </div>
              {!user.isMember ? (
                <button
                  onClick={() => setActiveTab("overview")}
                  className="mt-3 text-[10px] font-black text-primary hover:underline text-left flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
                >
                  Join Premium Club <ChevronRight className="size-3" />
                </button>
              ) : (
                <p className="text-[9.5px] text-muted-foreground mt-2 leading-snug font-semibold text-emerald-500">
                  ✓ Lifetime benefits active
                </p>
              )}
            </div>
          </div>

          {/* Grid Layout for sidebar navigation and active tab screen */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Controls */}
            <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-border/60 pr-0 lg:pr-6 shrink-0">
              <button
                onClick={() => { setActiveTab("overview"); setSelectedOrder(null); }}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all w-full min-w-[130px] lg:min-w-0 text-left border ${
                  activeTab === "overview" 
                    ? "bg-primary/5 text-primary border-primary/20 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/15"
                }`}
              >
                <User className="size-4 shrink-0" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => { setActiveTab("orders"); setSelectedOrder(null); }}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all w-full min-w-[130px] lg:min-w-0 text-left border ${
                  activeTab === "orders" 
                    ? "bg-primary/5 text-primary border-primary/20 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/15"
                }`}
              >
                <ShoppingBag className="size-4 shrink-0" />
                <span>Order History</span>
              </button>

              <button
                onClick={() => { setActiveTab("profile"); setSelectedOrder(null); }}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all w-full min-w-[130px] lg:min-w-0 text-left border ${
                  activeTab === "profile" 
                    ? "bg-primary/5 text-primary border-primary/20 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/15"
                }`}
              >
                <Settings className="size-4 shrink-0" />
                <span>Profile Settings</span>
              </button>

              <button
                onClick={() => { setActiveTab("wishlist"); setSelectedOrder(null); }}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all w-full min-w-[130px] lg:min-w-0 text-left border ${
                  activeTab === "wishlist" 
                    ? "bg-primary/5 text-primary border-primary/20 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/15"
                }`}
              >
                <Heart className="size-4 shrink-0" />
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="ml-auto bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[10px]">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </div>

            {/* Screen Content */}
            <div className="lg:col-span-3 min-h-[300px]">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Account overview banner */}
                  <div className="bg-gradient-to-r from-card/65 to-card/35 border border-border/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 right-0 size-24 bg-primary/10 rounded-full blur-xl -translate-y-6 translate-x-6" />
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      Account
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 max-w-lg">
                      Manage your profile information, view your order status, and edit details below. All gear is tracked and guaranteed by our certified support team.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-border/50">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</span>
                        <p className="text-sm font-semibold truncate text-foreground">{user.email}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</span>
                        <p className="text-sm font-semibold text-foreground">{user.firstName} {user.lastName}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contact Phone</span>
                        <p className="text-sm font-semibold text-foreground">{user.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Become a Member card (if not a member) */}
                  {!user.isMember && (
                    <div className="bg-gradient-to-br from-primary/10 via-background to-card border-2 border-primary/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md shadow-lg shadow-primary/5">
                      <div className="absolute top-0 right-0 size-32 bg-primary/10 rounded-full blur-2xl -translate-y-8 translate-x-8" />
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2 max-w-xl">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider">
                            <Sparkles className="size-3" /> lifetime premium access
                          </span>
                          <h3 className="text-lg font-black text-foreground">Join the MerchStore Premium Club</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                            Get an automatic 10% off storewide, priority express processing on your orders, and exclusive vip engineering consultations.
                          </p>
                          <div className="pt-2">
                            <Link 
                              href="/rewards" 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              Explore all benefits & rewards <ChevronRight className="size-3.5" />
                            </Link>
                          </div>
                        </div>

                        <div className="bg-background/40 border border-border/80 rounded-2xl p-5 text-center min-w-[200px] w-full md:w-auto space-y-4 shrink-0">
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Lifetime Membership Fee</span>
                            <span className="text-2xl font-black text-foreground">₹{membershipFee}</span>
                          </div>

                          {membershipError && (
                            <p className="text-[10px] text-destructive font-bold flex items-center justify-center gap-1">
                              <AlertCircle className="size-3" /> {membershipError}
                            </p>
                          )}

                          {membershipSuccess && (
                            <p className="text-[10px] text-emerald-500 font-bold flex items-center justify-center gap-1">
                              <CheckCircle2 className="size-3" /> {membershipSuccess}
                            </p>
                          )}

                          <button
                            onClick={async () => {
                              setMembershipError("");
                              setMembershipSuccess("");
                              setMembershipLoading(true);
                              try {
                                await becomeMember();
                                setMembershipSuccess("Welcome to the Premium Club!");
                              } catch (err: any) {
                                setMembershipError(err.message || "Failed to join membership.");
                              } finally {
                                setMembershipLoading(false);
                              }
                            }}
                            disabled={membershipLoading}
                            className="w-full py-2.5 text-xs font-black text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-md shadow-primary/10 cursor-pointer uppercase tracking-wider"
                          >
                            {membershipLoading ? "Processing..." : "Activate Membership"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Orders section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-4" /> Recent Orders
                      </h3>
                      <button 
                        onClick={() => setActiveTab("orders")}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        All Orders <ChevronRight className="size-3" />
                      </button>
                    </div>

                    {ordersLoading ? (
                      <div className="bg-card/25 border border-border/60 rounded-2xl p-8 flex justify-center">
                        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="bg-card/25 border border-border/60 rounded-2xl p-8 text-center text-xs text-muted-foreground">
                        No orders placed yet. Explore our products to start configuring your rig!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((order) => (
                          <div 
                            key={order.id}
                            className="bg-card/35 border border-border/70 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-card/55 hover:border-primary/20"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-bold text-foreground">{order.orderNumber}</span>
                                {getOrderStatusBadge(order.status)}
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                Ordered on {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                <span className="mx-2">•</span>
                                {order.items.length} {order.items.length === 1 ? "item" : "items"}
                              </p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-0 border-border/40 pt-3 sm:pt-0">
                              <div>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block sm:text-right">Total Price</span>
                                <span className="text-sm font-black text-foreground">₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
                              </div>
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="px-3.5 py-1.5 text-[11px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/10 cursor-pointer"
                              >
                                View details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ORDER HISTORY */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  {/* Filters bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
                    <h2 className="text-lg font-bold">Your Orders History</h2>
                    
                    <div className="flex items-center gap-1.5 bg-muted/20 border border-border/80 p-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                      {(["all", "active", "completed", "cancelled"] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setOrderFilter(filter)}
                          className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                            orderFilter === filter 
                              ? "bg-card text-foreground shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orders List */}
                  {ordersLoading ? (
                    <div className="py-12 flex justify-center">
                      <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="bg-card/25 border border-border/50 rounded-2xl py-12 px-4 text-center">
                      <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                        <ShoppingBag className="size-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">No orders match filter</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try modifying your order status filters or browse products to place a new order.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <div 
                          key={order.id}
                          className="bg-card/35 border border-border/70 rounded-2xl p-5 hover:border-primary/20 transition-all hover:bg-card/55"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5">
                                <span className="text-sm font-black tracking-tight text-foreground">{order.orderNumber}</span>
                                {getOrderStatusBadge(order.status)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Ordered on {new Date(order.createdAt).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Invoice</span>
                              <span className="text-base font-black text-foreground">₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
                            </div>
                          </div>

                          {/* Quick summary of items in order */}
                          <div className="py-4">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2.5">Items Ordered ({order.items.length})</span>
                            <div className="flex flex-wrap items-center gap-4">
                              {order.items.map((item, idx) => (
                                <div key={item.id || idx} className="flex items-center gap-2 bg-muted/15 border border-border/40 rounded-xl p-2 max-w-[240px] truncate">
                                  <div className="size-8 rounded-lg bg-background border border-border/60 shrink-0 flex items-center justify-center text-[10px] font-black text-primary">
                                    {item.productName[0]}
                                  </div>
                                  <div className="truncate text-[11px] font-medium text-foreground">
                                    <p className="truncate font-bold">{item.productName}</p>
                                    <p className="text-[9px] text-muted-foreground">Qty: {item.quantity} • ₹{Number(item.unitPrice).toLocaleString("en-IN")}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border/40 flex justify-between items-center">
                            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                              <CreditCard className="size-3.5 text-primary" />
                              Pay Method: <span className="text-foreground font-bold uppercase">{order.payment?.gateway || "COD"}</span>
                            </span>

                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="px-4 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/10 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            >
                              Manage Order
                              <ArrowUpRight className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PROFILE SETTINGS */}
              {activeTab === "profile" && (
                <div className="bg-card/35 border border-border/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
                  <h2 className="text-lg font-bold border-b border-border/40 pb-4">Personal Details Settings</h2>
                  
                  {formError && (
                    <div className="mt-4 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                      <AlertCircle className="size-5 shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold">{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="mt-4 p-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                      <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold">{formSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileSubmit} className="space-y-5 mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* First Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">First Name</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-3 text-sm font-semibold bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                          placeholder="Your first name"
                        />
                      </div>

                      {/* Last Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Name</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-3 text-sm font-semibold bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                          placeholder="Your last name"
                        />
                      </div>
                    </div>

                    {/* Email address - read-only */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <ShieldCheck className="size-3 text-primary" /> Locked field
                        </span>
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                          type="email"
                          disabled
                          value={user.email}
                          className="w-full pl-11 pr-4 py-3 text-sm font-semibold bg-muted/20 border border-border/80 rounded-xl text-muted-foreground cursor-not-allowed"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">For security, your primary login email address cannot be changed.</p>
                    </div>

                    {/* Contact Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 text-sm font-semibold bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                          placeholder="+91 99999 99999"
                        />
                      </div>
                    </div>

                    <div className="pt-3">
                      <Button
                        type="submit"
                        disabled={formSubmitting}
                        className="px-6 py-5 text-xs font-bold shadow-lg shadow-primary/10 rounded-xl uppercase tracking-wider cursor-pointer"
                      >
                        {formSubmitting ? "Saving Changes..." : "Save Profile Details"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: WISHLIST */}
              {activeTab === "wishlist" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div>
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <Heart className="size-5 text-primary" fill="currentColor" />
                        My Wishlist
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Products you've saved for later.
                      </p>
                    </div>
                  </div>

                  {wishlistLoading ? (
                    <div className="py-12 flex justify-center">
                      <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : wishlistItems.length === 0 ? (
                    <div className="bg-card/25 border border-border/50 rounded-2xl py-12 px-4 text-center">
                      <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                        <Heart className="size-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Your wishlist is empty</h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        Save items you like and they will appear here.
                      </p>
                      <Link href="/products">
                        <Button className="text-xs font-bold px-6">Explore Products</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {wishlistItems.map((item) => (
                        <ProductCard key={item.id} product={item.product as any} />
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* OVERLAY: ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          
          {/* Modal Container */}
          <div className="w-full max-w-xl h-full bg-card border-l border-border/80 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft className="size-4" /> Back to Dashboard
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-5">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-foreground">{selectedOrder.orderNumber}</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Invoice date: {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div>
                  {getOrderStatusBadge(selectedOrder.status)}
                </div>
              </div>
            </div>

            {/* Scrollable details info */}
            <div className="flex-1 py-6 space-y-8">
              
              {/* Order Status Timeline tracker */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tracking Timeline</h3>
                
                {selectedOrder.status.toLowerCase() === "cancelled" ? (
                  <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex items-center gap-2">
                    <AlertCircle className="size-5 text-destructive" />
                    <div>
                      <p className="text-xs font-bold text-destructive">Order Cancelled</p>
                      <p className="text-[10px] text-muted-foreground">This order was cancelled and will not be processed further.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[10px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                    {/* Step 1: Placed */}
                    <div className="relative">
                      <span className="absolute -left-6 top-0.5 size-[20px] rounded-full border-2 border-primary bg-primary flex items-center justify-center text-primary-foreground font-black text-[9px]">
                        ✓
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Order Placed</h4>
                        <p className="text-[10px] text-muted-foreground">Your order has been logged and received by our system.</p>
                      </div>
                    </div>

                    {/* Step 2: Processing */}
                    <div className="relative">
                      {["confirmed", "processing", "shipped", "delivered"].includes(selectedOrder.status.toLowerCase()) ? (
                        <span className="absolute -left-6 top-0.5 size-[20px] rounded-full border-2 border-primary bg-primary flex items-center justify-center text-primary-foreground font-black text-[9px]">
                          ✓
                        </span>
                      ) : (
                        <span className="absolute -left-6 top-0.5 size-[20px] rounded-full border-2 border-border bg-card flex items-center justify-center text-muted-foreground font-bold text-[9px]">
                          2
                        </span>
                      )}
                      <div>
                        <h4 className={`text-xs font-bold ${["confirmed", "processing", "shipped", "delivered"].includes(selectedOrder.status.toLowerCase()) ? "text-foreground" : "text-muted-foreground"}`}>
                          Processing & Packing
                        </h4>
                        <p className="text-[10px] text-muted-foreground">Rig items are verified and packed at our quality warehouse.</p>
                      </div>
                    </div>

                    {/* Step 3: Shipped */}
                    <div className="relative">
                      {["shipped", "delivered"].includes(selectedOrder.status.toLowerCase()) ? (
                        <span className="absolute -left-6 top-0.5 size-[20px] rounded-full border-2 border-primary bg-primary flex items-center justify-center text-primary-foreground font-black text-[9px]">
                          ✓
                        </span>
                      ) : (
                        <span className="absolute -left-6 top-0.5 size-[20px] rounded-full border-2 border-border bg-card flex items-center justify-center text-muted-foreground font-bold text-[9px]">
                          3
                        </span>
                      )}
                      <div>
                        <h4 className={`text-xs font-bold ${["shipped", "delivered"].includes(selectedOrder.status.toLowerCase()) ? "text-foreground" : "text-muted-foreground"}`}>
                          Shipped & In Transit
                        </h4>
                        <p className="text-[10px] text-muted-foreground">Package handed to logistics partner. Tracking active.</p>
                      </div>
                    </div>

                    {/* Step 4: Delivered */}
                    <div className="relative">
                      {selectedOrder.status.toLowerCase() === "delivered" ? (
                        <span className="absolute -left-6 top-0.5 size-[20px] rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center text-primary-foreground font-black text-[9px]">
                          ✓
                        </span>
                      ) : (
                        <span className="absolute -left-6 top-0.5 size-[20px] rounded-full border-2 border-border bg-card flex items-center justify-center text-muted-foreground font-bold text-[9px]">
                          4
                        </span>
                      )}
                      <div>
                        <h4 className={`text-xs font-bold ${selectedOrder.status.toLowerCase() === "delivered" ? "text-emerald-500" : "text-muted-foreground"}`}>
                          Delivered
                        </h4>
                        <p className="text-[10px] text-muted-foreground">Rig items delivered directly to your hands.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Items in Package</h3>
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between gap-3 bg-muted/15 border border-border/40 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-lg bg-background border border-border/60 flex items-center justify-center font-black text-xs text-primary">
                          {item.productName[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground leading-tight">{item.productName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">₹{Number(item.unitPrice).toLocaleString("en-IN")} each</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-foreground">₹{(Number(item.unitPrice) * item.quantity).toLocaleString("en-IN")}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="size-3.5 text-primary" /> Delivery Destination
                </h3>
                <div className="bg-muted/10 border border-border/60 p-4 rounded-xl text-xs space-y-1 font-semibold text-foreground/90">
                  {selectedOrder.shippingAddress && (
                    <>
                      <p>{selectedOrder.shippingAddress.addressLine1}</p>
                      {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}</p>
                      <p className="text-[10px] text-muted-foreground pt-1.5 uppercase font-bold tracking-wider">Country: {selectedOrder.shippingAddress.country || "IN"}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Totals */}
            <div className="border-t border-border/50 pt-5 space-y-3 font-semibold text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{Number(selectedOrder.subtotal).toLocaleString("en-IN")}</span>
              </div>
              
              {Number(selectedOrder.discountAmount) > 0 && (
                <div className="flex justify-between items-center text-emerald-500">
                  <span>Coupon Discount ({selectedOrder.couponCode || "applied"})</span>
                  <span>-₹{Number(selectedOrder.discountAmount).toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Shipping Cost</span>
                <span>₹{Number(selectedOrder.shippingCost).toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Tax Amount</span>
                <span>₹{Number(selectedOrder.taxAmount).toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-foreground pt-2 border-t border-border/30">
                <span className="text-sm">Grand Total (INR)</span>
                <span className="text-base text-primary">₹{Number(selectedOrder.totalAmount).toLocaleString("en-IN")}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
