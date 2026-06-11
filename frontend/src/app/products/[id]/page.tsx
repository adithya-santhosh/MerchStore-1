import { getProductById } from "@/lib/api";
import { getProductImageSrc } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuantitySelector from "@/components/QuantitySelector";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, RotateCcw, Sparkles, ChevronRight } from "lucide-react";
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

  // Fallback category path
  const isCarAccessory = product.category.toLowerCase().includes("car") || 
                          product.category.toLowerCase().includes("accessory") ||
                          product.category.toLowerCase().includes("gear");

  const categoryUrl = isCarAccessory ? "/products/car-accessories" : "/products";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8 sm:mb-12">
          <Link href="/" className="hover:text-primary transition-colors cursor-pointer">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/products" className="hover:text-primary transition-colors cursor-pointer">
            Products
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href={categoryUrl} className="hover:text-primary transition-colors cursor-pointer">
            {product.category}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground truncate max-w-[150px] sm:max-w-xs">{product.name}</span>
        </nav>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          
          {/* Left Column: Image Showcase */}
          <div className="lg:col-span-6">
            <div className="relative aspect-square w-full rounded-3xl border border-border bg-card/40 overflow-hidden flex items-center justify-center p-6 sm:p-12 shadow-sm hover:shadow-md transition-shadow duration-300">
              
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-2xl max-h-[400px]"
                />
              ) : (
                /* Cohesive visual placeholder if no image exists */
                <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-xs">
                  <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                    <Sparkles className="size-8" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                      {product.category}
                    </span>
                    <h4 className="text-sm font-bold text-muted-foreground mt-1">
                      No Image Available
                    </h4>
                  </div>
                </div>
              )}
              
              {/* Mesh background glow */}
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,var(--color-primary-foreground)/2,transparent_60%)] opacity-30" />
            </div>
          </div>

          {/* Right Column: Content and Actions */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            
            {/* Category Tag & Meta */}
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
                <Sparkles className="size-3.5" />
                {product.category}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price Badge */}
            <div className="border-y border-border/80 py-4 my-6">
              <span className="text-3xl sm:text-4xl font-black text-foreground">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Inclusive of all taxes. Free shipping on select tiers.
              </p>
            </div>

            {/* Product Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Product Details
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {product.description || "No description provided for this premium merch item."}
              </p>
            </div>

            {/* Interactive Quantity Selector */}
            <div className="pt-2">
              <QuantitySelector />
            </div>

            {/* Dynamic Buttons (Unassigned/Unlinked for now) */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button size="lg" className="flex-1 shadow-lg shadow-primary/10 py-6 text-base font-semibold cursor-pointer">
                Add to Cart
              </Button>
              <Button size="lg" variant="secondary" className="flex-grow sm:flex-1 py-6 text-base font-semibold cursor-pointer">
                Buy Now
              </Button>
            </div>

            {/* Trust Seals and Shipping info */}
            <div className="pt-6 border-t border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Truck className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-foreground">Free Delivery</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">On orders above ₹499</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <RotateCcw className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-foreground">Easy Exchange</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">7-day hassle-free window</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-foreground">Secure Payments</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Processed by Razorpay</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
