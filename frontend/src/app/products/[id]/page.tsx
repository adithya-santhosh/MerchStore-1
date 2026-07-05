import { getProductById } from "@/lib/api";
import { getProductImageSrc } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductActions from "@/components/ProductActions";
import AnimatedPrice from "@/components/AnimatedPrice";
import ScrollReveal from "@/components/ScrollReveal";
import { ShieldCheck, Truck, RotateCcw, Sparkles, ChevronRight, Activity } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  const product = await getProductById(id);
  const imageSrc = getProductImageSrc(product.ImageURL);

  const isCarAccessory = product.category.toLowerCase().includes("car") || 
                          product.category.toLowerCase().includes("accessory") ||
                          product.category.toLowerCase().includes("gear");

  const categoryUrl = isCarAccessory ? "/products/car-accessories" : "/products";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 relative">
        
        {/* Futuristic Background Gradients & Grids */}
        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 -z-20 opacity-[0.015]" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "4rem 4rem" }} />

        {/* Breadcrumb Navigation */}
        <ScrollReveal direction="up" delay={100}>
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8 sm:mb-12 bg-card/30 backdrop-blur-md px-4 py-2.5 rounded-full border border-border/40 w-fit">
            <Link href="/" className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5">
              <Activity className="size-3.5 text-primary" /> Home
            </Link>
            <ChevronRight className="size-3.5 opacity-50" />
            <Link href="/products" className="hover:text-primary transition-colors cursor-pointer">
              Products
            </Link>
            <ChevronRight className="size-3.5 opacity-50" />
            <Link href={categoryUrl} className="hover:text-primary transition-colors cursor-pointer">
              {product.category}
            </Link>
          </nav>
        </ScrollReveal>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Left Column: Image Showcase */}
          <div className="lg:col-span-6 relative">
            <ScrollReveal direction="left" scale delay={200}>
              {/* Decorative floating rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[120%] border border-primary/10 rounded-full animate-counter-spin pointer-events-none" style={{ borderStyle: "dashed" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[100%] border border-primary/5 rounded-full animate-counter-spin-reverse pointer-events-none" style={{ borderStyle: "dashed" }} />

              <div className="relative aspect-square w-full rounded-3xl border border-primary/20 bg-card/20 backdrop-blur-xl overflow-hidden flex items-center justify-center p-8 sm:p-16 shadow-[0_0_50px_rgba(220,50,47,0.05)] group">
                
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={product.name}
                    className="w-full h-full object-contain rounded-2xl max-h-[500px] drop-shadow-2xl animate-float transition-transform duration-700 group-hover:scale-110 group-hover:drop-shadow-[0_0_30px_rgba(220,50,47,0.3)] relative z-10"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-xs relative z-10 animate-float">
                    <div className="size-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(220,50,47,0.2)]">
                      <Sparkles className="size-10 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                        {product.category}
                      </span>
                      <h4 className="text-base font-bold text-muted-foreground mt-2">
                        Classified Visual Data
                      </h4>
                    </div>
                  </div>
                )}
                
                {/* Mesh background glow */}
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,var(--color-primary)/0.15,transparent_60%)] opacity-60 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Corner brackets */}
                <div className="absolute top-6 left-6 size-12 border-t-2 border-l-2 border-primary/40 rounded-tl-xl opacity-50 group-hover:opacity-100 transition-all duration-500" />
                <div className="absolute bottom-6 right-6 size-12 border-b-2 border-r-2 border-primary/40 rounded-br-xl opacity-50 group-hover:opacity-100 transition-all duration-500" />
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Content and Actions */}
          <div className="lg:col-span-6 space-y-8 lg:pt-8">
            
            <ScrollReveal direction="up" delay={300}>
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-xs font-bold tracking-widest text-primary uppercase shadow-[0_0_15px_rgba(220,50,47,0.15)]">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  {product.category}
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.1]">
                  {product.name}
                </h1>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={400}>
              <div className="p-6 rounded-2xl border border-primary/10 bg-card/30 backdrop-blur-sm shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <div className="text-4xl sm:text-5xl font-black">
                  <AnimatedPrice price={product.price} />
                </div>
                <p className="text-[11px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">
                  Inclusive of all taxes. Free shipping applied.
                </p>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Activity className="size-20" />
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={500}>
              <div className="space-y-3">
                <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" /> Specifications
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed p-5 rounded-2xl bg-card/20 border border-border/40 backdrop-blur-sm">
                  {product.description || "No description provided for this premium merch item. Engineered for performance."}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={600}>
              <ProductActions productId={product.id} />
            </ScrollReveal>

            <ScrollReveal direction="up" delay={700}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/40">
                
                <div className="glass-card p-4 rounded-xl hover:border-primary/30 transition-colors group">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-lg animate-pulse-ring" />
                    <Truck className="size-5 relative z-10 transition-transform group-hover:-translate-y-1" />
                  </div>
                  <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Free Delivery</h4>
                  <p className="text-[10px] text-muted-foreground mt-1">Priority routing</p>
                </div>

                <div className="glass-card p-4 rounded-xl hover:border-primary/30 transition-colors group">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-lg animate-pulse-ring" />
                    <RotateCcw className="size-5 relative z-10 transition-transform group-hover:-rotate-90" />
                  </div>
                  <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Easy Exchange</h4>
                  <p className="text-[10px] text-muted-foreground mt-1">7-day window</p>
                </div>

                <div className="glass-card p-4 rounded-xl hover:border-emerald-500/30 transition-colors group">
                  <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3 relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-lg animate-pulse-ring" />
                    <ShieldCheck className="size-5 relative z-10 transition-transform group-hover:scale-110" />
                  </div>
                  <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Secure Auth</h4>
                  <p className="text-[10px] text-muted-foreground mt-1">Encrypted checkout</p>
                </div>

              </div>
            </ScrollReveal>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
