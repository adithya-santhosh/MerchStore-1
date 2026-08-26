import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Automotive Merchandise",
  description:
    "Limited-run apparel, collectibles and wall art for automotive enthusiasts. Free delivery across India.",
  path: "/products/merchandise",
});

import { getProducts } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/products";
import { Sparkles, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function MerchandisePage() {
  let products: Product[] = [];

  // Fallback premium mock merchandise items if database has no merchandise
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
    // Filter to list ONLY items belonging to 'Merchandise' category
    const filtered = fetched.filter(
      (p: Product) => p.category.toLowerCase().includes("merch")
    );
    products = filtered.length > 0 ? filtered : fallbackMerch;
  } catch (error) {
    products = fallbackMerch;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
        {/* Decorative background glow */}
        <div className="absolute top-10 left-1/4 -z-10 size-80 rounded-full bg-primary/3 opacity-20 blur-3xl" />

        {/* Back Link */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary mb-8 group cursor-pointer"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          Back to Categories
        </Link>

        {/* Category Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
            <Sparkles className="size-3.5" />
            Limited Drops
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Merchandise
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Premium custom apparel, heavyweight hoodies, graphic tee collection drops, and styling accessory gear engineered for car culture purists.
          </p>
        </div>

        {/* Products Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-12 rounded-2xl border border-border/60 bg-muted/20 p-5 flex gap-3.5 items-start max-w-2xl">
          <AlertCircle className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Seasonal drop details</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every item in this collection is a limited drop. Once standard stock quantities sell out, reprint and restocking actions are locked.
            </p>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
