"use client";

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

export default function CategoryShowcase() {
  const categories: ShowcaseCard[] = [
    {
      label: "CAMPING",
      description: "Overland tents, awnings & basecamp gear",
      href: "/products/car-accessories/camping-overland",
      imageSrc: "/images/categories/camping_overland.png",
      alt: "Premium camping tents and overland basecamp gear",
    },
    {
      label: "LIGHTING",
      description: "LED bars, pods & electrical systems",
      href: "/products/car-accessories/lighting-electrical",
      imageSrc: "/images/categories/lighting_electrical.png",
      alt: "Sleek off-road LED light bars and battery modules",
    },
    {
      label: "ARMOR",
      description: "Bumpers, skid plates & body armor",
      href: "/products/car-accessories/armor-protection",
      imageSrc: "/images/categories/armor_protection.png",
      alt: "Heavy duty steel bumpers and protective skid bash plates",
    },
  ];

  return (
    <section className="w-full bg-background py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10 sm:mb-14">
            <div className="space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
                <Layers className="size-3.5" />
                EXPLORE
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Shop by Category
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Engineered gear across every discipline — from overland camping rigs to heavy-duty armor protection.
              </p>
            </div>
            <Link
              href="/products"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
            >
              View All Categories
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>
        
        {/* Responsive Grid Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((cat, index) => (
            <ScrollReveal key={cat.label} delay={index * 120} direction="up">
              <Link
                href={cat.href}
                className="group relative block aspect-[4/5] w-full rounded-[2rem] border border-border/40 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 hover:shadow-primary/10 transition-all duration-500 cursor-pointer"
              >
                
                {/* 1. Badge (Top Left) */}
                <div className="absolute top-6 left-6 z-20 bg-[#fa1320] text-white font-black text-xs sm:text-sm px-4.5 py-2 rounded-lg tracking-wider shadow-md select-none">
                  {cat.label}
                </div>

                {/* 2. Full-bleed background image with Zoom Hover */}
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={cat.imageSrc}
                    alt={cat.alt}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* 3. Bottom Gradient Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-300" />

                {/* 4. Bottom Text Overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-6 space-y-1">
                  <p className="text-sm text-white/70 font-medium leading-snug">
                    {cat.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-white/90 group-hover:text-primary transition-colors">
                    Explore
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
                
              </Link>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
