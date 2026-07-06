"use client";

import { useState, useEffect, useRef } from "react";
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

function AnimatedPrice({
  price,
  isVisible,
}: {
  price: number;
  isVisible: boolean;
}) {
  const [displayPrice, setDisplayPrice] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const duration = 1500;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPrice(Math.floor(eased * price));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isVisible, price]);

  return (
    <span className="tabular-nums">
      ₹{displayPrice.toLocaleString("en-IN")}
    </span>
  );
}

export default function FeaturedSpotlight() {
  const [product, setProduct] = useState<Product>(fallbackProduct);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const products = await getProducts();
        const featured =
          products.find((p) => p.isFeatured) || products[0];
        if (featured) setProduct(featured);
      } catch {
        // Fallback gracefully
      }
    }
    loadFeatured();
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const imageSrc =
    getProductImageSrc(product.ImageURL) ||
    "/images/categories/camping_overland.png";

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
    >
      {/* Background product flat-lay image (subtle) */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "url(/images/backgrounds/featured_product.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card/40 to-background" />

      {/* Animated glow orbs */}
      <div className="absolute top-20 left-[10%] w-80 h-80 bg-primary/8 rounded-full blur-[100px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-20 right-[15%] w-64 h-64 bg-primary/5 rounded-full blur-[80px] animate-float pointer-events-none" />

      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Product Image — Floating */}
          <ScrollReveal direction="left" scale>
            <div className="relative">
              {/* Glow effect behind image */}
              <div className="absolute -inset-6 bg-primary/8 rounded-3xl blur-3xl animate-float-slow" />
              <div className="relative aspect-square max-w-lg mx-auto rounded-3xl border border-border/40 bg-card/20 backdrop-blur-sm overflow-hidden p-6 sm:p-10">
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="w-full h-full object-contain drop-shadow-2xl animate-float-slow"
                  loading="lazy"
                />
                {/* Corner accent brackets — animated */}
                <div
                  className="absolute top-4 left-4 size-16 border-t-2 border-l-2 border-primary/30 rounded-tl-2xl transition-all duration-700"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                      ? "translate(0,0)"
                      : "translate(-10px,-10px)",
                    transitionDelay: "400ms",
                  }}
                />
                <div
                  className="absolute bottom-4 right-4 size-16 border-b-2 border-r-2 border-primary/30 rounded-br-2xl transition-all duration-700"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                      ? "translate(0,0)"
                      : "translate(10px,10px)",
                    transitionDelay: "600ms",
                  }}
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Product Details */}
          <ScrollReveal direction="right" delay={150} scale>
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
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

              {/* Spec list with hover interactions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {specs.map((spec, i) => (
                  <div
                    key={spec.label}
                    className="group/spec flex items-start gap-3 p-3.5 rounded-xl glass-card hover:border-primary/30 transition-all duration-300 cursor-default"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible
                        ? "translateY(0)"
                        : "translateY(12px)",
                      transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${
                        400 + i * 100
                      }ms`,
                    }}
                  >
                    <div className="shrink-0 size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-transform duration-300 group-hover/spec:scale-110 group-hover/spec:rotate-6">
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-4">
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Starting at
                  </span>
                  <p className="text-3xl sm:text-4xl font-black text-primary">
                    <AnimatedPrice
                      price={product.price}
                      isVisible={isVisible}
                    />
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="shadow-lg shadow-primary/20 group cursor-pointer animate-pulse-glow"
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
                    className="cursor-pointer hover:border-primary/40 transition-colors"
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
