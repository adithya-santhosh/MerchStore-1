"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

interface ShowcaseCard {
  label: string;
  description: string;
  href: string;
  imageSrc: string;
  alt: string;
}

interface TiltState {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
}

function CategoryCard({
  cat,
  index,
}: {
  cat: ShowcaseCard;
  index: number;
}) {
  const [tilt, setTilt] = useState<TiltState>({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
  });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      setTilt({ rotateX, rotateY, glareX, glareY });
    },
    []
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  }, []);

  return (
    <ScrollReveal delay={index * 150} direction="up" scale>
      <div className="perspective-container">
        <Link
          href={cat.href}
          className="perspective-card group relative block aspect-[4/5] w-full rounded-[2rem] overflow-hidden cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          }}
        >
          {/* Animated gradient border */}
          <div
            className="absolute inset-0 rounded-[2rem] p-[1px] transition-opacity duration-500"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `conic-gradient(from ${Date.now() / 20}deg, oklch(0.63 0.25 24), oklch(0.5 0.2 30), oklch(0.63 0.25 24), transparent, oklch(0.63 0.25 24))`,
            }}
          />

          {/* Inner card */}
          <div className="absolute inset-[1px] rounded-[2rem] overflow-hidden bg-card">
            {/* Badge (Top Left) */}
            <div className="absolute top-6 left-6 z-20 bg-[#fa1320] text-white font-black text-xs sm:text-sm px-4.5 py-2 rounded-lg tracking-wider shadow-lg select-none transition-transform duration-300 group-hover:scale-105">
              {cat.label}
            </div>

            {/* Full-bleed background image with Parallax Zoom */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <img
                src={cat.imageSrc}
                alt={cat.alt}
                className="w-full h-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-110"
                loading="lazy"
              />
            </div>

            {/* Glare/light reflection on hover */}
            <div
              className="absolute inset-0 z-10 transition-opacity duration-300 pointer-events-none"
              style={{
                opacity: isHovered ? 0.08 : 0,
                background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.6) 0%, transparent 60%)`,
              }}
            />

            {/* Bottom Gradient Overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300" />

            {/* Bottom Text Overlay — slides up on hover */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 space-y-2">
              <p
                className="text-sm text-white/80 font-medium leading-snug transition-all duration-500"
                style={{
                  transform: isHovered
                    ? "translateY(0)"
                    : "translateY(8px)",
                  opacity: isHovered ? 1 : 0.7,
                }}
              >
                {cat.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 group-hover:text-primary transition-colors duration-300">
                Explore
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </ScrollReveal>
  );
}

export default function CategoryShowcase() {
  const categories: ShowcaseCard[] = [
    {
      label: "CAMPING",
      description: "Overland tents, awnings & basecamp gear",
      href: "/products/car-accessories/camping-overland",
      imageSrc: "/images/categories/camping_lifestyle.png",
      alt: "Rooftop tent camping setup under the stars",
    },
    {
      label: "LIGHTING",
      description: "LED bars, pods & electrical systems",
      href: "/products/car-accessories/lighting-electrical",
      imageSrc: "/images/categories/lighting_night.png",
      alt: "LED light bar illuminating a forest trail at night",
    },
    {
      label: "ARMOR",
      description: "Bumpers, skid plates & body armor",
      href: "/products/car-accessories/armor-protection",
      imageSrc: "/images/categories/armor_action.png",
      alt: "Bull bar bumper on SUV splashing through river",
    },
  ];

  return (
    <section className="w-full bg-background py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12 sm:mb-16">
            <div className="space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
                <Layers className="size-3.5" />
                EXPLORE
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                Shop by Category
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Engineered gear across every discipline — from overland
                camping rigs to heavy-duty armor protection.
              </p>
            </div>
            <Link
              href="/products"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 link-underline"
            >
              View All Categories
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((cat, index) => (
            <CategoryCard key={cat.label} cat={cat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
