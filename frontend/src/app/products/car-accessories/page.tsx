import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Car Accessories & Off-Road Parts",
  description:
    "Armor, lighting, recovery gear, suspension, storage and overland systems for your build. Free delivery across India.",
  path: "/products/car-accessories",
});

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Sparkles } from "lucide-react";

interface Category {
  title: string;
  href: string;
  imageSrc: string;
  items: string[];
  description: string;
}

export default function CarAccessoriesPage() {
  const categories: Category[] = [
    {
      title: "Recovery Gear",
      href: "/products/car-accessories/recovery-gear",
      imageSrc: "/images/categories/recovery_gear.png",
      description: "Heavy-duty gear engineered to get you out of tight spots on the trail.",
      items: ["Winches", "Recovery Tracks", "Snatch Straps", "Shackles"],
    },
    {
      title: "Lighting & Electrical",
      href: "/products/car-accessories/lighting-electrical",
      imageSrc: "/images/categories/lighting_electrical.png",
      description: "Advanced illumination and battery systems built for night expeditions.",
      items: ["LED Light Bars", "Driving Lights", "Dual Battery Systems", "Switch Panels"],
    },
    {
      title: "Armor & Protection",
      href: "/products/car-accessories/armor-protection",
      imageSrc: "/images/categories/armor_protection.png",
      description: "Rigid steel plates and structural bars designed to guard critical components.",
      items: ["Bull Bars", "Rock Sliders", "Bash Plates", "Rear Bumpers"],
    },
    {
      title: "Camping & Overland",
      href: "/products/car-accessories/camping-overland",
      imageSrc: "/images/categories/camping_overland.png",
      description: "Premium fold-out shelters and portable galley equipment for basecamp comfort.",
      items: ["Rooftop Tents", "Awnings", "Portable Fridges", "Camp Kitchen Gear"],
    },
    {
      title: "Suspension & Wheels",
      href: "/products/car-accessories/suspension-wheels",
      imageSrc: "/images/categories/suspension_wheels.png",
      description: "Upgraded geometry, long-travel shocks, and durable off-road wheel sets.",
      items: ["Lift Kits", "Heavy-Duty Shocks", "All-Terrain Tyres", "Alloy Wheels"],
    },
    {
      title: "Storage & Racks",
      href: "/products/car-accessories/storage-racks",
      imageSrc: "/images/categories/storage_racks.png",
      description: "Modular platform networks and trunk compartments built to organize supplies.",
      items: ["Roof Racks", "Platform Systems", "Drawer Modules", "Cargo Bags"],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* Main Section */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
        {/* Subtle Decorative Mesh Glows */}
        <div className="absolute top-10 left-1/3 -z-10 size-72 rounded-full bg-primary/3 opacity-20 blur-3xl" />
        
        {/* Header Content */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
            <Sparkles className="size-3.5" />
            Performance Equipped
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Car Accessories
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Configure your off-road rig with custom vehicle armor, recovery kits, electrical light modules, suspension lifts, and modular cargo systems built to withstand the elements.
          </p>
        </div>

        {/* 6 Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="group flex flex-col justify-between rounded-3xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-primary hover:shadow-primary/10 transition-all duration-300 overflow-hidden min-h-[460px] cursor-pointer"
            >
              
              {/* Card Contents */}
              <div className="p-6 space-y-5 flex flex-col justify-start">
                
                {/* 1. Category Title (Top Center) */}
                <h2 className="text-xl font-bold uppercase tracking-wider text-center text-foreground group-hover:text-primary transition-colors border-b border-border/50 pb-3">
                  {cat.title}
                </h2>

                {/* 2. Custom AI Image (Center) */}
                <div className="relative w-full h-44 rounded-2xl border border-border/40 overflow-hidden bg-muted/40">
                  <img
                    src={cat.imageSrc}
                    alt={cat.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Card Description */}
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {cat.description}
                </p>

              </div>

              {/* Bottom: Checklists / Product Listings & Arrow Button */}
              <div className="px-6 pb-6 pt-2 space-y-4">
                
                {/* Product listing tags capsules */}
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((item) => (
                    <span
                      key={item}
                      className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border border-border bg-muted/30 text-muted-foreground tracking-wide uppercase transition-colors group-hover:border-primary/10 group-hover:bg-primary/2"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {/* Action Footer Indicator */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-muted-foreground pt-4 border-t border-border/40 group-hover:text-primary transition-colors">
                  <span>Explore Gear</span>
                  <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all duration-300 group-hover:translate-x-1">
                    <ArrowRight className="size-4" />
                  </div>
                </div>

              </div>

            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
