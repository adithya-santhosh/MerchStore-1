"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Crosshair,
  Gauge,
  Shield,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/api";
import { Product } from "@/types/products";
import { getProductImageSrc } from "@/lib/utils";
import ScrollReveal from "@/components/ScrollReveal";

const fallbackProduct: Product = {
  id: 101,
  name: "Premium Hard-Shell Rooftop Tent",
  description:
    "Hydraulic opening shelter system with integrated high-density foam mattress, fits 3 people. Engineered for extreme weather conditions with a reinforced ABS shell and marine-grade zippers.",
  price: 145000,
  category: "Camping & Overland",
  ImageURL: "/images/categories/camping_overland.png",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const specs = [
  {
    icon: Gauge,
    label: "Military-Grade Construction",
    detail: "Built to withstand extreme conditions",
  },
  {
    icon: Shield,
    label: "1-Year Warranty",
    detail: "Full coverage, no questions asked",
  },
  {
    icon: Wrench,
    label: "Easy Installation",
    detail: "Bolt-on fitment, no drilling required",
  },
  {
    icon: Zap,
    label: "Quick Deploy",
    detail: "Setup in under 60 seconds",
  },
];

export default function FeaturedSpotlight() {
  const [product, setProduct] = useState<Product>(fallbackProduct);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const products = await getProducts();
        // Pick the first featured product, or the first one
        const featured =
          products.find((p) => p.isFeatured) || products[0];
        if (featured) setProduct(featured);
      } catch {
        // Fallback gracefully
      }
    }
    loadFeatured();
  }, []);

  const imageSrc = getProductImageSrc(product.ImageURL) || "/images/categories/camping_overland.png";

  return (
    <section className="w-full bg-card/10 overflow-hidden border-b border-border/40">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Product Image */}
          <ScrollReveal direction="left">
            <div className="relative corner-brackets">
              <div className="relative aspect-square max-w-lg mx-auto border border-border/40 bg-background blueprint-grid-fine overflow-hidden p-6 sm:p-10">
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="w-full h-full object-contain drop-shadow-2xl"
                  loading="lazy"
                />
                <Crosshair className="absolute top-3 right-3 size-4 text-primary/50" />
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Product Details */}
          <ScrollReveal direction="right" delay={150}>
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-primary/20 bg-primary/5 text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                <span className="size-1.5 bg-primary animate-pulse" />
                Featured Build
              </div>

              {/* Title */}
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight">
                {product.name}
              </h2>

              {/* Description */}
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
                {product.description}
              </p>

              {/* Spec list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/40 border border-border/40 pt-2">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-start gap-3 p-3 bg-background hover:bg-card/40 transition-all duration-300"
                  >
                    <div className="shrink-0 size-9 flex items-center justify-center text-primary border border-primary/20 bg-primary/5">
                      <spec.icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {spec.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {spec.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price + CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                    Starting at
                  </span>
                  <p className="font-heading text-3xl sm:text-4xl font-bold text-primary">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="shadow-lg group cursor-pointer clip-corner"
                    asChild
                  >
                    <Link
                      href={`/products/${product.id}`}
                      className="inline-flex items-center gap-2"
                    >
                      View Details
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="cursor-pointer clip-corner"
                    asChild
                  >
                    <Link href="/products">Browse All</Link>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
