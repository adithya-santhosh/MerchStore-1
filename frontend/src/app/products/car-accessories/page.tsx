import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Sparkles } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

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
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
        {/* Futuristic Background Gradients & Grids */}
        <div className="absolute top-20 left-1/4 -z-10 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
        <div className="absolute inset-0 -z-20 opacity-[0.015]" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "4rem 4rem" }} />
        
        {/* Header Content */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-xs font-bold tracking-widest text-primary uppercase shadow-[0_0_15px_rgba(220,50,47,0.15)]">
              <Sparkles className="size-3.5" />
              Performance Equipped
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.05]">
              Car Accessories
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Configure your off-road rig with custom vehicle armor, recovery kits, electrical light modules, suspension lifts, and modular cargo systems built to withstand the elements.
            </p>
          </div>
        </ScrollReveal>

        {/* 6 Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-container">
          {categories.map((cat, i) => (
            <ScrollReveal key={cat.title} direction="up" delay={150 + (i % 3) * 100} scale>
              <Link
                href={cat.href}
                className="perspective-card group flex flex-col justify-between rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-[0_0_30px_rgba(220,50,47,0.1)] hover:border-primary/40 transition-all duration-500 overflow-hidden min-h-[460px] cursor-pointer block h-full relative"
              >
                
                {/* Animated Gradient border equivalent inside inner div */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Card Contents */}
                <div className="p-6 space-y-5 flex flex-col justify-start relative z-10">
                  
                  {/* Category Title */}
                  <div className="flex items-center justify-center gap-2 border-b border-border/50 pb-4">
                    <h2 className="text-xl font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors duration-300">
                      {cat.title}
                    </h2>
                  </div>

                  {/* Custom AI Image */}
                  <div className="relative w-full h-48 rounded-2xl border border-border/40 overflow-hidden bg-background/50">
                    <img
                      src={cat.imageSrc}
                      alt={cat.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Card Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>

                </div>

                {/* Bottom: Checklists & Action */}
                <div className="px-6 pb-6 space-y-5 relative z-10">
                  
                  {/* Product listing tags capsules */}
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((item) => (
                      <span
                        key={item}
                        className="text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-border/60 bg-muted/40 text-muted-foreground tracking-widest uppercase transition-all duration-300 group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Action Footer Indicator */}
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-muted-foreground pt-5 border-t border-border/40 group-hover:text-primary transition-colors uppercase tracking-widest">
                    <span>Explore Gear</span>
                    <div className="size-9 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all duration-500 group-hover:translate-x-1.5 shadow-lg shadow-primary/0 group-hover:shadow-primary/30">
                      <ArrowRight className="size-4" />
                    </div>
                  </div>

                </div>

              </Link>
            </ScrollReveal>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
