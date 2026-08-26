import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "All Products",
  description:
    "Browse the full catalogue — armor, lighting, recovery, suspension, storage and overland gear, plus automotive merchandise. Free delivery across India.",
  path: "/products",
});

import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowRight, Sparkles, Filter } from "lucide-react";
import ProductsExplorerWrapper from "./ProductsExplorerWrapper";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    subCategory?: string;
    vehicle?: string;
    brand?: string;
    search?: string;
    sortBy?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const { category, subCategory, vehicle, brand, search } = resolvedParams;

  const hasFilter = !!(category || subCategory || vehicle || brand || search);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
        {/* Subtle Decorative mesh glows */}
        <div className="absolute top-10 left-1/3 -z-10 size-80 rounded-full bg-primary/3 opacity-20 blur-3xl" />

        {hasFilter ? (
          <div className="space-y-8">
            {/* Back to Categories Link */}
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary group cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:-translate-x-1"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Back to Divisions
            </Link>

            {/* Heading Section */}
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
                <Filter className="size-3.5" />
                {search ? "Search Results" : "Filtered Catalog"}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                {search
                  ? `Results for "${search}"`
                  : vehicle
                  ? `Compatible with ${vehicle}`
                  : brand
                  ? `Brand: ${brand}`
                  : subCategory
                  ? String(subCategory)
                  : category
                  ? String(category)
                  : "Products"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {search
                  ? `Showing products matching your search query.`
                  : vehicle
                  ? `Products engineered or compatible with ${vehicle}.`
                  : brand
                  ? `Premium products designed and manufactured by ${brand}.`
                  : subCategory
                  ? `Explore all items under ${subCategory}.`
                  : category
                  ? `Explore all items under ${category}.`
                  : "Browse our premium products."}
              </p>
            </div>

            {/* ProductsExplorer */}
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20">
                  <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <ProductsExplorerWrapper
                search={search}
                category={category}
                brand={brand}
                vehicle={vehicle}
              />
            </Suspense>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Heading Section */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
                <Sparkles className="size-3.5" />
                Product Catalog
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Our Categories
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Select a division below to configure your off-road rig or
                upgrade your lifestyle with our custom-engineered gear.
              </p>
            </div>

            {/* 2-Card Portal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Card 1: Car Accessories */}
              <Link
                href="/products/car-accessories"
                className="group flex flex-col justify-between rounded-[2rem] border border-border bg-card/40 p-8 shadow-sm hover:shadow-lg hover:border-primary hover:shadow-primary/10 transition-all duration-300 min-h-[300px] cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <h2 className="text-2xl font-bold uppercase tracking-wide">
                      Car Accessories
                    </h2>
                    <Sparkles className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Configure your rig with custom vehicle armor, recovery kits,
                    electrical LED light modules, suspension lifts, and modular
                    platform storage systems built for the elements.
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground pt-6 border-t border-border/40 group-hover:text-primary transition-colors">
                  <span>View Accessories</span>
                  <div className="size-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all duration-300 group-hover:translate-x-1">
                    <ArrowRight className="size-4.5" />
                  </div>
                </div>
              </Link>

              {/* Card 2: Merchandise */}
              <Link
                href="/products/merchandise"
                className="group flex flex-col justify-between rounded-[2rem] border border-border bg-card/40 p-8 shadow-sm hover:shadow-lg hover:border-primary hover:shadow-primary/10 transition-all duration-300 min-h-[300px] cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <h2 className="text-2xl font-bold uppercase tracking-wide">
                      Merchandise
                    </h2>
                    <Sparkles className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Explore our limited-run seasonal drops of custom streetwear,
                    heavyweight hoodies, graphic tee apparel, caps, keychains,
                    and street fashion gear designed for car culture enthusiasts.
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground pt-6 border-t border-border/40 group-hover:text-primary transition-colors">
                  <span>View Merchandise</span>
                  <div className="size-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all duration-300 group-hover:translate-x-1">
                    <ArrowRight className="size-4.5" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}