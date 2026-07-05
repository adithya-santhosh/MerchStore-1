import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { getProductBySubCategory } from "@/lib/api";
import { Product } from "@/types/products";
import ProductCard from "@/components/ProductCard";
import ScrollReveal from "@/components/ScrollReveal";

export default async function SuspensionWheelsPage() {
  const products = await getProductBySubCategory("Suspension & Wheels");

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
        
        {/* Decorative background glow */}
        <div className="absolute top-10 left-1/4 -z-10 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[100px] pointer-events-none animate-float" />
        <div className="absolute inset-0 -z-20 opacity-[0.015]" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "4rem 4rem" }} />

        {/* Back Link */}
        <ScrollReveal direction="up" delay={100}>
          <Link
            href="/products/car-accessories"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary mb-8 group cursor-pointer bg-card/30 backdrop-blur-md px-4 py-2.5 rounded-full border border-border/40 w-fit transition-colors"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Back to Categories
          </Link>
        </ScrollReveal>

        {/* Category Header */}
        <ScrollReveal direction="up" delay={200}>
          <div className="max-w-3xl mb-12 sm:mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-xs font-bold tracking-widest text-primary uppercase shadow-[0_0_15px_rgba(220,50,47,0.15)]">
              <Sparkles className="size-3.5" />
              Terrain Control
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
              Suspension & Wheels
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Upgraded geometry, long-travel shocks, and durable off-road wheel sets built to tame the harshest corrugated trails.
            </p>
          </div>
        </ScrollReveal>

        {/* Products Grid using ProductCards */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((prod: Product, i) => (
              <ScrollReveal key={prod.id} direction="up" delay={150 + (i % 4) * 100} scale>
                <ProductCard product={prod} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal direction="up" delay={300} scale>
            <div className="text-center py-16 border border-primary/20 rounded-[2rem] bg-card/20 backdrop-blur-md max-w-md mx-auto shadow-[0_0_30px_rgba(220,50,47,0.05)]">
              <Sparkles className="size-10 text-primary/40 mx-auto mb-4 animate-pulse" />
              <h3 className="text-base font-black text-foreground">No Products Found</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Active drops in this category are coming shortly. Join our waitlist!
              </p>
            </div>
          </ScrollReveal>
        )}

        {/* Info Banner */}
        <ScrollReveal direction="up" delay={400}>
          <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex gap-4 items-start max-w-2xl backdrop-blur-sm shadow-[0_0_20px_rgba(220,50,47,0.05)]">
            <AlertCircle className="size-6 text-primary shrink-0 animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Inventory Integration in Progress</h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                We are connecting this section to our Cloudinary catalog and Express inventory database. Limited drops are launching shortly!
              </p>
            </div>
          </div>
        </ScrollReveal>

      </main>

      <Footer />
    </div>
  );
}
