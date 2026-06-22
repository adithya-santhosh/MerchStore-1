"use client";

import { useCart } from "@/hooks/useCart";
import { getProductImageSrc } from "@/lib/utils";
import { X, Trash2, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import QuantitySelector from "./QuantitySelector";
import { Button } from "./ui/button";

export default function CartSidebar() {
  const {
    cart,
    subtotal,
    isSidebarOpen,
    setSidebarOpen,
    updateQuantity,
    removeFromCart,
    itemsCount,
    settings,
  } = useCart();

  if (!isSidebarOpen) return null;

  const shippingThreshold = settings.shipping_limit;
  const shippingCost = settings.shipping_cost;
  const shippingProgress = Math.min((subtotal / shippingThreshold) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Backdrop with fade-in and backdrop-blur */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex h-full">
        {/* Slide-over panel */}
        <div className="w-screen max-w-md h-full bg-background/95 border-l border-border/80 backdrop-blur-md shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <ShoppingBag className="size-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">Your Cart</h2>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {itemsCount} {itemsCount === 1 ? "item" : "items"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Free Shipping Progress Bar */}
            {itemsCount > 0 && (
              <div className="p-4 rounded-2xl border border-border bg-card/20 space-y-2.5 mb-2 shadow-sm">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-foreground leading-normal">
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
                  <span className="text-[10px] font-bold text-muted-foreground">
                    ₹{subtotal} / ₹{shippingThreshold}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/30">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {cart?.items && cart.items.length > 0 ? (
              cart.items.map((item) => {
                const imageSrc = getProductImageSrc(item.product.ImageURL);
                return (
                  <div
                    key={item.id}
                    className="group relative flex gap-4 p-4 rounded-2xl border border-border/50 bg-card/30 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="size-20 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-center p-2 shrink-0 overflow-hidden relative">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={item.product.name}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <Sparkles className="size-5 text-primary/30" />
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-foreground line-clamp-1 leading-snug">
                            {item.product.name}
                          </h4>
                          <span className="text-xs font-bold text-foreground whitespace-nowrap">
                            ₹{(item.quantity * item.unitPrice).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {item.product.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                        {/* Direct input Quantity Selector */}
                        <QuantitySelector
                          showLabel={false}
                          value={item.quantity}
                          onChange={(newQty) => updateQuantity(item.productId, newQty)}
                        />

                        {/* Remove button */}
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/5 transition-colors cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="size-16 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground mb-4">
                  <ShoppingBag className="size-8" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Your cart is empty</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Add items to your cart to see them here. Browse our catalog to get started.
                </p>
                <Button
                  onClick={() => setSidebarOpen(false)}
                  className="mt-6 text-xs shadow-md cursor-pointer"
                  size="sm"
                >
                  Start Shopping
                </Button>
              </div>
            )}
          </div>

          {/* Footer Summary / Actions */}
          {cart?.items && cart.items.length > 0 && (
            <div className="border-t border-border/80 bg-card/20 px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                  <span>Subtotal</span>
                  <span className="text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                  <span>Shipping</span>
                  {subtotal >= shippingThreshold ? (
                    <span className="text-emerald-500 uppercase font-bold text-[10px]">Free</span>
                  ) : (
                    <span className="text-foreground">₹{shippingCost}</span>
                  )}
                </div>
                <div className="flex justify-between text-sm font-black border-t border-border/30 pt-2.5">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">
                    ₹{(subtotal >= shippingThreshold ? subtotal : subtotal + shippingCost).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/cart"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center justify-center text-xs font-semibold px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Checkout
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-center text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors py-1.5 cursor-pointer mt-1"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
