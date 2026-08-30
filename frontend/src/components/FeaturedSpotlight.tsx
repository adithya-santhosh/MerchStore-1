"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
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
  ImageURL: "/images/categories/camping_overland.webp",
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

  const imageSrc = getProductImageSrc(product.ImageURL) || "/images/categories/camping_overland.webp";

  return (
    <section className="w-full bg-gradient-to-br from-background via-card/40 to-background overflow-hidden">
      {/* Decorative grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Product Image */}
          <ScrollReveal direction="left">
            <div className="relative">
              {/* Glow effect behind image */}
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />
              <div className="relative aspect-square max-w-lg mx-auto rounded-3xl border border-border/40 bg-card/30 overflow-hidden p-6 sm:p-10">
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="w-full h-full object-contain drop-shadow-2xl"
                  loading="lazy"
                />
                {/* Corner accent */}
                <div className="absolute top-4 left-4 size-16 border-t-2 border-l-2 border-primary/30 rounded-tl-2xl" />
                <div className="absolute bottom-4 right-4 size-16 border-b-2 border-r-2 border-primary/30 rounded-br-2xl" />
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Product Details */}
          <ScrollReveal direction="right" delay={150}>
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary-bright uppercase">
                <Sparkles className="size-3.5" />
                FEATURED PRODUCT
              </div>

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
                {product.name}
              </h2>

              {/* Description */}
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
                {product.description}
              </p>

              {/* Spec list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-card/20 hover:border-primary/30 hover:bg-card/40 transition-all duration-300"
                  >
                    <div className="shrink-0 size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
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
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Starting at
                  </span>
                  <p className="text-3xl sm:text-4xl font-black text-primary">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="shadow-lg group cursor-pointer"
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
                    className="cursor-pointer"
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
