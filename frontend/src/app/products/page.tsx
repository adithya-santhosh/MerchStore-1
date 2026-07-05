import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowRight, Sparkles, ArrowLeft, Filter } from "lucide-react";
import { getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/products";
import ScrollReveal from "@/components/ScrollReveal";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subCategory?: string; vehicle?: string; brand?: string }>;
}) {
  const resolvedParams = await searchParams;
  const { category, subCategory, vehicle, brand } = resolvedParams;

  const hasFilter = !!(category || subCategory || vehicle || brand);
  let products: Product[] = [];
  let filterTitle = "Products";
  let filterDesc = "Browse our premium products.";

  if (hasFilter) {
    products = await getProducts({ category, subCategory, vehicle, brand });
    if (vehicle) {
      filterTitle = `Compatible with ${vehicle}`;
      filterDesc = `Products engineered or compatible with ${vehicle}.`;
    } else if (brand) {
      filterTitle = `Brand: ${brand}`;
      filterDesc = `Premium products designed and manufactured by ${brand}.`;
    } else if (subCategory) {
      filterTitle = String(subCategory);
      filterDesc = `Explore all items under ${subCategory}.`;
    } else if (category) {
      filterTitle = String(category);
      filterDesc = `Explore all items under ${category}.`;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
        {/* Futuristic Background Gradients & Grids */}
        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 -z-20 opacity-[0.015]" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "4rem 4rem" }} />

        {hasFilter ? (
          <div className="space-y-12">
            
            <ScrollReveal direction="up" delay={100}>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer group bg-card/30 backdrop-blur-md px-4 py-2.5 rounded-full border border-border/40 w-fit"
              >
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                Back to Divisions
              </Link>
            </ScrollReveal>

            {/* Heading Section */}
            <ScrollReveal direction="up" delay={200}>
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-xs font-bold tracking-widest text-primary uppercase shadow-[0_0_15px_rgba(220,50,47,0.15)]">
                  <Filter className="size-3.5" />
                  Filtered Catalog
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                  {filterTitle}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                  {filterDesc}
                </p>
              </div>
            </ScrollReveal>

            {/* Products Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                {products.map((prod, i) => (
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
                    We don't have any items in stock matching this filter right now. Explore other categories!
                  </p>
                </div>
              </ScrollReveal>
            )}
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* Heading Section */}
            <ScrollReveal direction="up">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-xs font-bold tracking-widest text-primary uppercase shadow-[0_0_15px_rgba(220,50,47,0.15)]">
                  <Sparkles className="size-3.5" />
                  Product Catalog
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                  Our Divisions
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Select a division below to configure your off-road rig or upgrade your lifestyle with our custom-engineered gear.
                </p>
              </div>
            </ScrollReveal>

            {/* 2-Card Portal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto perspective-container">
              
              {/* Card 1: Car Accessories */}
              <ScrollReveal direction="left" delay={200} scale>
                <Link
                  href="/products/car-accessories"
                  className="perspective-card group relative flex flex-col justify-between rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-md p-10 shadow-xl hover:border-primary/50 hover:shadow-[0_0_40px_rgba(220,50,47,0.15)] transition-all duration-500 min-h-[350px] cursor-pointer overflow-hidden block"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center pb-4 border-b border-border/50">
                      <h2 className="text-3xl font-black uppercase tracking-wide text-foreground group-hover:text-primary transition-colors duration-300">
                        Car Accessories
                      </h2>
                      <Sparkles className="size-6 text-muted-foreground group-hover:text-primary transition-colors animate-pulse" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-2">
                      Configure your rig with custom vehicle armor, recovery kits, electrical LED light modules, suspension lifts, and modular platform storage systems built for the elements.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm font-bold text-muted-foreground pt-8 border-t border-border/40 group-hover:text-primary transition-colors relative z-10">
                    <span className="uppercase tracking-widest">Enter Portal</span>
                    <div className="size-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all duration-500 group-hover:translate-x-2 shadow-lg shadow-primary/0 group-hover:shadow-primary/30">
                      <ArrowRight className="size-5" />
                    </div>
                  </div>
                </Link>
              </ScrollReveal>

              {/* Card 2: Merchandise */}
              <ScrollReveal direction="right" delay={300} scale>
                <Link
                  href="/products/merchandise"
                  className="perspective-card group relative flex flex-col justify-between rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-md p-10 shadow-xl hover:border-primary/50 hover:shadow-[0_0_40px_rgba(220,50,47,0.15)] transition-all duration-500 min-h-[350px] cursor-pointer overflow-hidden block"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center pb-4 border-b border-border/50">
                      <h2 className="text-3xl font-black uppercase tracking-wide text-foreground group-hover:text-primary transition-colors duration-300">
                        Merchandise
                      </h2>
                      <Sparkles className="size-6 text-muted-foreground group-hover:text-primary transition-colors animate-pulse" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-2">
                      Explore our limited-run seasonal drops of custom streetwear, heavyweight hoodies, graphic tee apparel, caps, keychains, and street fashion gear designed for car culture enthusiasts.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm font-bold text-muted-foreground pt-8 border-t border-border/40 group-hover:text-primary transition-colors relative z-10">
                    <span className="uppercase tracking-widest">Enter Portal</span>
                    <div className="size-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all duration-500 group-hover:translate-x-2 shadow-lg shadow-primary/0 group-hover:shadow-primary/30">
                      <ArrowRight className="size-5" />
                    </div>
                  </div>
                </Link>
              </ScrollReveal>

            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}