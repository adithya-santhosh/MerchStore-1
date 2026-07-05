"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/api";
import { Product } from "@/types/products";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export default function NewLaunch() {
  const [products, setProducts] = useState<Product[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // 6 Premium mock fallback products
  const fallbackProducts: Product[] = [
    {
      id: 101,
      name: "Premium Hard-Shell Rooftop Tent",
      description:
        "Hydraulic opening shelter system with integrated high-density foam mattress, fits 3 people.",
      price: 145000,
      category: "Camping & Overland",
      ImageURL: "/images/categories/camping_overland.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 102,
      name: "Dual-Row 40-Inch LED Light Bar",
      description:
        "Combo beam output system producing 20,000 raw lumens, fitted with heavy aluminum housing.",
      price: 28000,
      category: "Lighting & Electrical",
      ImageURL: "/images/categories/lighting_electrical.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 103,
      name: "Heavy-Duty Steel Bull Bar Bumper",
      description:
        "Winch-ready front bumper styled in textured black powder coat with shackle mounts.",
      price: 68000,
      category: "Armor & Protection",
      ImageURL: "/images/categories/armor_protection.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 104,
      name: "Modular Low-Profile Roof Rack",
      description:
        "Laser-cut steel brackets with lightweight T-slot extruded aluminum crossbars.",
      price: 45000,
      category: "Storage & Racks",
      ImageURL: "/images/categories/storage_racks.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 105,
      name: "Synthetic Snatch Rope Shackles Kit",
      description:
        "High-strength kinetic rigging links built for off-road extraction, comes as a pack of 2.",
      price: 8500,
      category: "Recovery Gear",
      ImageURL: "/images/categories/recovery_gear.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 106,
      name: "Stage 2 Performance Lift Kit",
      description:
        "Includes high-travel coils, Control arms, and reservoir shocks for maximum ground clearance.",
      price: 115000,
      category: "Suspension & Wheels",
      ImageURL: "/images/categories/suspension_wheels.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    async function loadProducts() {
      try {
        const fetched = await getProducts();
        if (fetched && fetched.length > 0) {
          const merged = [...fetched, ...fallbackProducts].slice(0, 6);
          setProducts(merged);
        } else {
          setProducts(fallbackProducts);
        }
      } catch (error) {
        setProducts(fallbackProducts);
      }
    }
    loadProducts();
  }, []);

  // Track scroll progress
  const updateProgress = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    setScrollProgress(el.scrollLeft / maxScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateProgress, { passive: true });
    return () => el.removeEventListener("scroll", updateProgress);
  }, [updateProgress]);

  // Auto-scroll
  useEffect(() => {
    if (isAutoScrollPaused || products.length === 0) return;

    autoScrollRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const cardWidth =
          window.innerWidth >= 768
            ? el.clientWidth / 3
            : window.innerWidth >= 640
            ? el.clientWidth / 2
            : el.clientWidth;
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 4000);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [isAutoScrollPaused, products]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const cardWidth =
        window.innerWidth >= 768
          ? clientWidth / 3
          : window.innerWidth >= 640
          ? clientWidth / 2
          : clientWidth;
      const offset = direction === "left" ? -cardWidth : cardWidth;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full bg-background pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12 sm:mb-16">
            <div className="space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
                <Sparkles className="size-3.5" />
                LATEST DROPS
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                New Launches
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Configure your off-road rig or upgrade your lifestyle with
                our newly released limited-run custom gear.
              </p>
            </div>

            {/* Carousel Control Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleScroll("left")}
                className="size-10 rounded-full border border-border bg-card/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => handleScroll("right")}
                className="size-10 rounded-full border border-border bg-card/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer shadow-sm"
                aria-label="Scroll right"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Horizontal Scroll Carousel */}
        <ScrollReveal direction="up" delay={200}>
          <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-6 lg:gap-8 pb-6 snap-x snap-mandatory scroll-smooth no-scrollbar"
            onMouseEnter={() => setIsAutoScrollPaused(true)}
            onMouseLeave={() => setIsAutoScrollPaused(false)}
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

          {/* Progress Bar */}
          <div className="mt-6 max-w-xs mx-auto">
            <div className="h-1 rounded-full bg-border/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 transition-all duration-300"
                style={{ width: `${Math.max(scrollProgress * 100, 5)}%` }}
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
