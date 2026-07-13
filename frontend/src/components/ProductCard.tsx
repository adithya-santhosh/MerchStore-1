"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Product } from "@/types/products";
import { getProductImageSrc } from "@/lib/utils";
import { ArrowRight, Sparkles, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import WishlistButton from "./WishlistButton";

interface ProductCardProps {
  product: Product;
}

interface TiltState {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageSrc = getProductImageSrc(product.ImageURL);
  const { addToCart } = useCart();
  const [tilt, setTilt] = useState<TiltState>({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
  });
  const [isHovered, setIsHovered] = useState(false);

  const handleQuickAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id, 1);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col justify-between rounded-2xl border border-border bg-card/40 shadow-sm hover:shadow-lg hover:border-primary hover:shadow-primary/5 transition-all duration-300 overflow-hidden min-h-[380px] cursor-pointer"
    >
      
      {/* Top Section: Category & Image */}
      <div className="p-5 space-y-4">
        
        {/* Category Badge & Sparkle */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {product.category}
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <WishlistButton productId={product.id} variant="icon" />
          </div>
        </div>

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  }, []);

  return (
    <div className="perspective-container h-full">
      <Link
        href={`/products/${product.id}`}
        className="perspective-card group relative flex flex-col justify-between rounded-2xl min-h-[380px] cursor-pointer h-full p-[1px] overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          // Animated gradient border on hover acting as the background of the wrapper
          background: isHovered 
            ? `conic-gradient(from ${Date.now() / 20}deg, oklch(0.63 0.25 24), oklch(0.5 0.2 30), oklch(0.63 0.25 24), transparent, oklch(0.63 0.25 24))`
            : "transparent"
        }}
      >
        {/* Inner Card (Glassmorphism) - stays in flow */}
        <div className="relative flex-1 rounded-[15px] bg-card/60 backdrop-blur-md border border-border/40 group-hover:border-transparent transition-colors z-10 flex flex-col overflow-hidden">
          
          {/* Top Section: Category & Image */}
          <div className="p-5 space-y-4 flex-1">
            
            {/* Category Badge & Sparkle */}
            <div className="flex justify-between items-center relative z-20">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {product.category}
              </span>
              <span className="opacity-0 group-hover:opacity-100 text-primary transition-opacity duration-300">
                <Sparkles className="size-3.5" />
              </span>
            </div>

            {/* Product Image Visual */}
            <div className="relative w-full h-40 rounded-xl border border-border/40 overflow-hidden bg-background/50 flex items-center justify-center p-4 z-10">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(220,50,47,0.3)]"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <Sparkles className="size-6 text-primary/40" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    No Image
                  </span>
                </div>
              )}
              {/* Mesh background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary)/0.1,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Product Title */}
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2 relative z-20">
              {product.name}
            </h3>

            {/* Product Description */}
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 relative z-20">
              {product.description || "Premium custom merchandise item."}
            </p>

          </div>

          {/* Bottom Section: Price & View Arrow / Cart */}
          <div className="px-5 pb-5 pt-2 relative z-20">
            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              
              {/* Price */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-semibold">Price</span>
                <span className="text-lg font-black text-foreground group-hover:text-primary transition-colors duration-300">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Quick CTA Actions */}
              <div className="flex items-center gap-2">
                {/* Quick Add To Cart */}
                <button
                  onClick={handleQuickAddToCart}
                  className="size-9 rounded-full bg-muted/50 backdrop-blur-sm border border-border hover:border-primary/50 hover:bg-primary/20 hover:text-primary hover:shadow-[0_0_15px_rgba(220,50,47,0.4)] flex items-center justify-center text-muted-foreground transition-all duration-300 cursor-pointer"
                  title="Add to Cart"
                  aria-label="Quick Add to Cart"
                >
                  <ShoppingBag className="size-4 transition-transform group-hover:scale-110" />
                </button>

                {/* Glowing Arrow CTA */}
                <div className="size-9 rounded-full bg-muted/50 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent group-hover:shadow-[0_0_15px_rgba(220,50,47,0.5)] transition-all duration-300">
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>

            </div>
          </div>

          {/* Glare/light reflection on hover */}
          <div
            className="absolute inset-0 z-30 transition-opacity duration-300 pointer-events-none rounded-[15px]"
            style={{
              opacity: isHovered ? 0.08 : 0,
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
            }}
          />
        </div>
      </Link>
    </div>
  );
}
