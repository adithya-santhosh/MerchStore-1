"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuantitySelector from "@/components/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { getProductImageSrc } from "@/lib/utils";
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const {
    cart,
    subtotal,
    loading,
    updateQuantity,
    removeFromCart,
    settings,
    validateCouponOnServer
  } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [couponDetails, setCouponDetails] = useState<{ code: string; type: string; value: number } | null>(null);

  // Dynamic calculations from settings context
  const shippingThreshold = settings.shipping_limit;
  const shippingCost = subtotal >= shippingThreshold || subtotal === 0 ? 0 : settings.shipping_cost;
  const taxRate = settings.tax_rate;
  const estimatedTax = subtotal * taxRate;
  
  let discount = 0;
  if (couponDetails) {
    if (couponDetails.type === "percent") {
      discount = subtotal * (couponDetails.value / 100);
    } else {
      discount = couponDetails.value;
    }
  }
  
  const finalTotal = Math.max(0, subtotal + shippingCost + estimatedTax - discount);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    try {
      const result = await validateCouponOnServer(promoCode, subtotal);
      setCouponDetails(result);
      setPromoApplied(true);
    } catch (err: any) {
      alert(err.message || "Invalid Promo Code");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading your cart...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
        {/* Glow Effects */}
        <div className="absolute top-10 left-1/4 -z-10 size-80 rounded-full bg-primary/3 opacity-20 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 -z-10 size-96 rounded-full bg-primary/2 opacity-20 blur-3xl" />

        <div className="space-y-10">
          {/* Header */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
              <ShoppingBag className="size-3.5" />
              Checkout Queue
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Shopping Cart</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review your items and complete configuration details before checkout.
            </p>
          </div>

          {cart?.items && cart.items.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* Left Side: Cart Items List */}
              <div className="lg:col-span-8 space-y-5">
                
                {/* Free Shipping Progress Bar — only meaningful when a
                    spend threshold actually exists (shipping is free below it) */}
                {shippingThreshold > 0 && (
                <div className="p-5 rounded-3xl border border-border/80 bg-card/25 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">
                      {subtotal >= shippingThreshold ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1 animate-pulse">
                          🎉 Free Shipping Unlocked!
                        </span>
                      ) : (
                        <>
                          Add <span className="text-primary font-black">₹{shippingThreshold - subtotal}</span> more for Free Shipping
                        </>
                      )}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      ₹{subtotal} / ₹{shippingThreshold}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/30">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min((subtotal / shippingThreshold) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                )}

                {/* Items List */}
                <div className="space-y-4">
                  {cart.items.map((item) => {
                    const imageSrc = getProductImageSrc(item.product.ImageURL);
                    return (
                      <div
                        key={item.id}
                        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl border border-border/80 bg-card/20 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                      >
                        {/* Product details & thumbnail */}
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="size-20 sm:size-24 rounded-2xl border border-border/40 bg-muted/20 flex items-center justify-center p-3 shrink-0 overflow-hidden relative">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={item.product.name}
                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <Sparkles className="size-6 text-primary/30" />
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                              {item.product.category}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors pr-2">
                              {item.product.name}
                            </h3>
                            <div className="text-xs font-semibold text-muted-foreground">
                              Unit Price: ₹{item.unitPrice.toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>

                        {/* Controls and Total prices */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-border/30 pt-3 sm:pt-0">
                          {/* Controlled Quantity Input */}
                          <QuantitySelector
                            showLabel={false}
                            value={item.quantity}
                            onChange={(newQty) => updateQuantity(item.productId, newQty)}
                          />

                          {/* Price Calculations */}
                          <div className="flex flex-col items-end min-w-[80px]">
                            <span className="text-xs text-muted-foreground">Total</span>
                            <span className="text-sm sm:text-base font-black text-foreground">
                              ₹{(item.quantity * item.unitPrice).toLocaleString("en-IN")}
                            </span>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/5 transition-colors cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 className="size-4.5" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Order Summary Panel */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Summary Box */}
                <div className="rounded-[2rem] border border-border bg-card/30 p-6 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-foreground">Order Summary</h2>

                  <div className="space-y-4 border-b border-border/60 pb-5 text-sm">
                    <div className="flex justify-between text-muted-foreground font-semibold">
                      <span>Subtotal</span>
                      <span className="text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="flex justify-between text-muted-foreground font-semibold">
                      <span>Estimated Shipping</span>
                      {shippingCost === 0 ? (
                        <span className="text-emerald-500 font-bold text-xs uppercase">Free</span>
                      ) : (
                        <span className="text-foreground">₹{shippingCost}</span>
                      )}
                    </div>

                    {estimatedTax > 0 && (
                      <div className="flex justify-between text-muted-foreground font-semibold">
                        <span>GST ({(taxRate * 100).toFixed(0)}%)</span>
                        <span className="text-foreground">₹{estimatedTax.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    {promoApplied && couponDetails && (
                      <div className="flex justify-between text-emerald-500 font-semibold animate-in fade-in">
                        <span>Discount ({couponDetails.code})</span>
                        <span>
                          -₹{discount.toLocaleString("en-IN")}
                          {couponDetails.type === "percent" && ` (${couponDetails.value}%)`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Promo Code Input */}
                  <form onSubmit={handleApplyPromo} className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Promo Code
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="e.g., WELCOME10"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          disabled={promoApplied}
                          className="w-full text-xs font-semibold pl-10 pr-3 py-3 border border-border rounded-xl bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={promoApplied}
                        className="px-4 text-xs font-bold shrink-0 cursor-pointer rounded-xl h-10"
                      >
                        Apply
                      </Button>
                    </div>
                    {promoApplied && couponDetails && (
                      <p className="text-[10px] text-emerald-500 font-bold">
                        Coupon code {couponDetails.code} applied successfully!
                      </p>
                    )}
                  </form>

                  {/* Order Total */}
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-sm font-bold text-foreground">Total</span>
                    <span className="text-2xl font-black text-primary">
                      ₹{Math.round(finalTotal).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Actions (Checkout & Continue Shopping) */}
                  <div className="space-y-3">
                    <Link href="/checkout" className="block">
                      <Button className="w-full py-6 text-sm font-bold shadow-lg shadow-primary/10 rounded-xl cursor-pointer">
                        Proceed to Checkout
                        <ArrowRight className="size-4.5 ml-1.5" />
                      </Button>
                    </Link>
                    
                    <Link href="/products" className="block text-center mt-1">
                      <span className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer block py-1.5">
                        Continue Shopping
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Trust Badge */}
                <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 flex items-center gap-3.5">
                  <ShieldCheck className="size-8 text-emerald-500 shrink-0" />
                  <div className="text-[11px] leading-normal text-muted-foreground">
                    <span className="font-bold text-foreground block mb-0.5">Secure Transaction</span>
                    Your connection is encrypted with RSA 256-bit certificates. All payments processed securely by Razorpay.
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* Empty Cart Screen */
            <div className="max-w-md mx-auto text-center py-16 px-6 border border-border/80 rounded-3xl bg-card/25 shadow-sm">
              <div className="size-16 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/60 mx-auto mb-5">
                <ShoppingBag className="size-8" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Your Cart is Empty</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                Before you can checkout, you must add some products to your shopping cart. You will find a lot of interesting items in our store catalog.
              </p>
              <Link href="/products" className="inline-flex mt-6">
                <Button className="shadow-md cursor-pointer text-xs font-semibold px-6 py-4.5 rounded-xl">
                  Start Shopping
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
