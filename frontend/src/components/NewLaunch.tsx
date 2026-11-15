"use client";

import { useState, useEffect, useRef } from "react";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/api";
import { Product } from "@/types/products";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

export default function NewLaunch() {
  const [products, setProducts] = useState<Product[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const fetched = await getProducts();
        const merchandise = (fetched ?? []).filter((product) => product.productType !== "part");
        setProducts(merchandise.slice(0, 6));
      } catch {
        setProducts([]);
      }
    }
    loadProducts();
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      // Scroll by one card offset width based on viewport columns
      const cardWidth = window.innerWidth >= 768 ? clientWidth / 3 : window.innerWidth >= 640 ? clientWidth / 2 : clientWidth;
      const offset = direction === "left" ? -cardWidth : cardWidth;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="w-full bg-background pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Top-Right Nav Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12 sm:mb-16">
          
          <div className="space-y-4 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary-bright uppercase">
              <Sparkles className="size-3.5" />
              LATEST DROPS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              New Launches
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              Configure your off-road rig or upgrade your lifestyle with our newly released limited-run custom gear.
            </p>
          </div>

          {/* Carousel Control Chevron Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleScroll("left")}
              className="size-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-primary-bright hover:border-primary transition-all duration-200 cursor-pointer shadow-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="size-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-primary-bright hover:border-primary transition-all duration-200 cursor-pointer shadow-sm"
              aria-label="Scroll right"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

        </div>

        {/* Horizontal Scroll Carousel Track */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-6 lg:gap-8 pb-6 snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[85vw] sm:w-[calc((100%-24px)/2)] md:w-[calc((100%-48px)/3)] shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
