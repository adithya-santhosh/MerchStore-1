import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { getProductBySubCategory } from "@/lib/api";
import { Product } from "@/types/products";
import ProductCard from "@/components/ProductCard";

export default async function LightingElectricalPage() {
  const products = await getProductBySubCategory("Lighting & Electrical");

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
            Illumination & Energy
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Lighting & Electrical
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Uncompromised night visibility and off-grid power solutions. High-intensity LED light bars, driving spot pods, dual battery isolator networks, and programmable cabin solid-state switch control panels.
          </p>
        </div>

        {/* Products Grid using ProductCards */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((prod: Product) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-border/60 rounded-3xl bg-card/20 max-w-md mx-auto">
            <Sparkles className="size-8 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-foreground">No Products Found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Active drops in this category are coming shortly. Join our waitlist!
            </p>
          </div>
        )}

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
