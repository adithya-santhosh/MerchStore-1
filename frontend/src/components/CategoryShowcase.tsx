"use client";

import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

interface ShowcaseCard {
  index: string;
  label: string;
  description: string;
  href: string;
  imageSrc: string;
  alt: string;
}

export default function CategoryShowcase() {
  const categories: ShowcaseCard[] = [
    {
      index: "01",
      label: "Camping & Overland",
      description: "Rooftop tents, awnings & basecamp systems",
      href: "/products/car-accessories/camping-overland",
      imageSrc: "/images/categories/camping_overland_new.png",
      alt: "Matte black hard-shell rooftop tent mounted on a roof rack",
    },
    {
      index: "02",
      label: "Lighting & Electrical",
      description: "LED bars, pods & battery management",
      href: "/products/car-accessories/lighting-electrical",
      imageSrc: "/images/categories/lighting_electrical_new.png",
      alt: "Black dual-row LED light bar glowing white light",
      },
    {
      index: "03",
      label: "Armor & Protection",
      description: "Bumpers, skid plates & rock sliders",
      href: "/products/car-accessories/armor-protection",
      imageSrc: "/images/categories/armor_protection_new.jpeg",
      alt: "Heavy-duty black steel off-road front bumper with winch mount",
    },
    {
      index: "04",
      label: "Suspension & Wheels",
      description: "Lift kits, coilovers & off-road wheels",
      href: "/products/car-accessories/suspension-wheels",
      imageSrc: "/images/categories/suspension_wheels_new.png",
      alt: "Black performance coilover shock paired with an off-road alloy wheel",
    },
    {
      index: "05",
      label: "Recovery Gear",
      description: "Winches, tow ropes & traction boards",
      href: "/products/car-accessories/recovery-gear",
      imageSrc: "/images/categories/recovery_gear_new.png",
      alt: "Winch with steel cable and a coiled kinetic recovery rope",
    },
    {
      index: "06",
      label: "Storage & Racks",
      description: "Roof racks, drawers & cargo systems",
      href: "/products/car-accessories/storage-racks",
      imageSrc: "/images/categories/storage_racks_new.png",
      alt: "Black modular roof rack platform with a mounted cargo box",
    },
  ];

  return (
    <section className="w-full bg-background py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10 sm:mb-14">
            <div className="space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-primary/20 bg-primary/5 text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                <Layers className="size-3.5" />
                Catalog Index
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight text-foreground">
                Shop By Category
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Six disciplines. Every part built to a spec, not a guess.
              </p>
            </div>
            <Link
              href="/products"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
            >
              View Full Catalog
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/40 border border-border/40">
          {categories.map((cat, i) => (
            <ScrollReveal key={cat.label} delay={i * 70} direction="up">
              <Link
                href={cat.href}
                className="group relative flex flex-col justify-end h-full min-h-[340px] bg-background overflow-hidden"
              >
                {/* Photo */}
                <img
                  src={cat.imageSrc}
                  alt={cat.alt}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10 group-hover:via-background/30 transition-colors duration-500" />

                {/* Index number */}
                <span className="absolute top-4 left-4 font-mono text-xs text-foreground/70 bg-background/60 px-2 py-1 z-10">
                  {cat.index}
                </span>

                {/* Copy */}
                <div className="relative z-10 p-6 space-y-1.5">
                  <h3 className="font-heading text-xl font-semibold uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {cat.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground/70 group-hover:text-primary transition-colors pt-1">
                    Explore
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>

                <div className="absolute top-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-500 z-10" />
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
