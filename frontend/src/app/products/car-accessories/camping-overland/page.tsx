import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Camping & Overland",
  description:
    "Rooftop tents, awnings and basecamp systems for long-range overland travel. Free delivery across India.",
  path: "/products/car-accessories/camping-overland",
});

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Sparkles } from "lucide-react";
import ComingSoonBlock from "@/components/ComingSoonBlock";

export default async function CampingOverlandPage() {

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        
        {/* Back Link */}
        <Link
          href="/products/car-accessories"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary-bright mb-8 group cursor-pointer"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          Back to Categories
        </Link>

        {/* Category Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary-bright uppercase">
            <Sparkles className="size-3.5" />
            Adventure Basecamp
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Camping & Overland
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Unrivaled off-road basecamp living solutions. High-grade rugged hard-shell rooftop tents, structural multi-angle awnings, low-draw portable smart fridges, and slide-out modular gas stoves.
          </p>
        </div>

        <ComingSoonBlock section="Camping & Overland" />

      </main>

      <Footer />
    </div>
  );
}
