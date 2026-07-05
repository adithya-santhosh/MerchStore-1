import { getProducts } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/products";
import { Sparkles, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

export default async function MerchandisePage() {
  let products: Product[] = [];

  const fallbackMerch: Product[] = [
    {
      id: 201,
      name: "Formula V1 Hooded Sweatshirt",
      description: "Heavyweight 450gsm organic cotton hoodie with custom rear track silhouette embroidery.",
      price: 6500,
      category: "Merchandise",
      ImageURL: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 202,
      name: "Limited Track Trucker Cap",
      description: "Classic snapback trucker profile featuring a curved brim and a high-density rubber patch.",
      price: 1800,
      category: "Merchandise",
      ImageURL: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 203,
      name: "Aero Vinyl Decal Pack",
      description: "Pack of 5 waterproof, UV-resistant custom automotive vinyl decals in assorted sizing.",
      price: 950,
      category: "Merchandise",
      ImageURL: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 204,
      name: "Billet Aluminum Keychain",
      description: "Laser-etched high-grade aluminum tag linked to a heavy-duty gunmetal key ring.",
      price: 1200,
      category: "Merchandise",
      ImageURL: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  try {
    const fetched = await getProducts();
    const filtered = fetched.filter(
      (p: Product) => p.category.toLowerCase().includes("merch")
    );
    products = filtered.length > 0 ? filtered : fallbackMerch;
  } catch (error) {
    products = fallbackMerch;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
        {/* Decorative background glow */}
        <div className="absolute top-10 left-1/4 -z-10 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[100px] pointer-events-none animate-float" />
        <div className="absolute inset-0 -z-20 opacity-[0.015]" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "4rem 4rem" }} />

        <ScrollReveal direction="up" delay={100}>
          <Link
            href="/products"
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
              Limited Drops
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
              Merchandise
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Premium custom apparel, heavyweight hoodies, graphic tee collection drops, and styling accessory gear engineered for car culture purists.
            </p>
          </div>
        </ScrollReveal>

        {/* Products Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {products.map((product, i) => (
            <ScrollReveal key={product.id} direction="up" delay={150 + (i % 4) * 100} scale>
              <ProductCard product={product} />
            </ScrollReveal>
          ))}
        </div>

        {/* Info Banner */}
        <ScrollReveal direction="up" delay={400}>
          <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex gap-4 items-start max-w-2xl backdrop-blur-sm shadow-[0_0_20px_rgba(220,50,47,0.05)]">
            <AlertCircle className="size-6 text-primary shrink-0 animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Seasonal drop details</h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                Every item in this collection is a limited drop. Once standard stock quantities sell out, reprint and restocking actions are locked.
              </p>
            </div>
          </div>
        </ScrollReveal>

      </main>

      <Footer />
    </div>
  );
}
