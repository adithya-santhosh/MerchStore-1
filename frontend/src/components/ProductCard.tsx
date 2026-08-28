"use client";

import Link from "next/link";
import { Product } from "@/types/products";
import { getProductImageSrc } from "@/lib/utils";
import { ArrowRight, Sparkles, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import WishlistButton from "./WishlistButton";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageSrc = getProductImageSrc(product.ImageURL);
  const { addToCart } = useCart();

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
          {/* Visible by default, hidden-until-hover only where hover exists.
              Tailwind gates `hover:` behind @media (hover: hover), so the old
              `opacity-0 group-hover:opacity-100` left this permanently invisible
              on a touch screen rather than merely hidden until hover. */}
          <div className="can-hover:opacity-0 can-hover:group-hover:opacity-100 can-hover:group-focus-within:opacity-100 transition-opacity duration-300">
            <WishlistButton productId={product.id} variant="icon" />
          </div>
        </div>

        {/* Product Image Visual */}
        <div className="relative w-full h-40 rounded-xl border border-border/40 overflow-hidden bg-muted/20 flex items-center justify-center p-4">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
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
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Product Title */}
        <h3 className="text-base font-bold text-foreground group-hover:text-primary-bright transition-colors leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Product Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {product.description || "Premium custom merchandise item."}
        </p>

      </div>

      {/* Bottom Section: Price & View Arrow / Cart */}
      <div className="px-5 pb-5 pt-2">
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          
          {/* Price displayed in bold red (primary color) */}
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-semibold">Price</span>
            <span className="text-lg font-black text-primary-bright transition-colors">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Add To Cart */}
            <button
              onClick={handleQuickAddToCart}
              className="size-9 rounded-full bg-muted border border-border hover:border-transparent hover:bg-primary hover:text-primary-foreground flex items-center justify-center text-muted-foreground transition-all duration-300 cursor-pointer"
              title="Add to Cart"
              aria-label="Quick Add to Cart"
            >
              <ShoppingBag className="size-4" />
            </button>

            {/* Glowing Arrow CTA */}
            <div className="size-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
              <ArrowRight className="size-4" />
            </div>
          </div>

        </div>
      </div>

    </Link>
  );
}
