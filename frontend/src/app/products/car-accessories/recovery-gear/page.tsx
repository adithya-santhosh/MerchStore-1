import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Recovery Gear",
  description:
    "Winches, tow ropes, shackles and traction boards for getting unstuck. Free delivery across India.",
  path: "/products/car-accessories/recovery-gear",
});

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { getProductBySubCategory } from "@/lib/api";
import { Product } from "@/types/products";

export default async function RecoveryGearPage() {
  const products = await getProductBySubCategory("Recovery Gear");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        
        {/* Back Link */}
        <Link
          href="/products/car-accessories"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary mb-8 group cursor-pointer"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          Back to Categories
        </Link>

        {/* Category Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
            <Sparkles className="size-3.5" />
            Rig Equipment
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Recovery Gear
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Essential mechanical off-road tools designed for safe extraction. Winches, recovery tracks, kinetic snatch straps, and high-strength shackles engineered for heavy rig recoveries.
          </p>
        </div>

        {/* Products Grid using Reusable ProductCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {products.map((prod: Product) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-12 rounded-2xl border border-border/60 bg-muted/20 p-5 flex gap-3.5 items-start max-w-2xl">
          <AlertCircle className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Inventory Integration in Progress</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We are connecting this section to our Cloudinary catalog and Express inventory database. Limited drops are launching shortly!
            </p>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
