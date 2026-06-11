"use client";

import Link from "next/link";

interface ShowcaseCard {
  label: string;
  href: string;
  imageSrc: string;
  alt: string;
}

export default function CategoryShowcase() {
  const categories: ShowcaseCard[] = [
    {
      label: "CAMPING",
      href: "/products/car-accessories/camping-overland",
      imageSrc: "/images/categories/camping_overland.png",
      alt: "Premium camping tents and overland basecamp gear",
    },
    {
      label: "LIGHTING",
      href: "/products/car-accessories/lighting-electrical",
      imageSrc: "/images/categories/lighting_electrical.png",
      alt: "Sleek off-road LED light bars and battery modules",
    },
    {
      label: "ARMOR",
      href: "/products/car-accessories/armor-protection",
      imageSrc: "/images/categories/armor_protection.png",
      alt: "Heavy duty steel bumpers and protective skid bash plates",
    },
  ];

  return (
    <section className="w-full bg-background py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Responsive Grid Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group relative block aspect-[4/5] w-full rounded-[2rem] border border-border/40 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/20 hover:shadow-primary/5 transition-all duration-500 cursor-pointer"
            >
              
              {/* 1. Yellow Badge (Top Left) */}
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
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300" />
              
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
