import { getProductById } from "@/lib/api";
import { getProductImageSrc } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductActions from "@/components/ProductActions";
import ProductReviews from "@/components/ProductReviews";
import ProductGallery from "@/components/ProductGallery";
import ProductSpecifications from "@/components/ProductSpecifications";
import VehicleCompatibility from "@/components/VehicleCompatibility";
import RelatedProducts from "@/components/RelatedProducts";
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
          {product.subCategory && (
            <>
              <ChevronRight className="size-3.5" />
              <Link href={`/products/subcategories/${product.subCategory}`} className="hover:text-primary transition-colors cursor-pointer">
                {product.subCategory}
              </Link>
            </>
          )}
          <ChevronRight className="size-3.5" />
          <span className="text-foreground truncate max-w-[150px] sm:max-w-xs">{product.name}</span>
        </nav>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Left Column: Image Showcase */}
          <div className="lg:col-span-6">
            <ProductGallery 
              images={product.images} 
              fallbackImage={imageSrc} 
              productName={product.name} 
              category={product.category} 
            />
          </div>

          {/* Right Column: Content and Actions */}
          <div className="lg:col-span-6 space-y-8 lg:pt-8">
            
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

            <ProductSpecifications attributes={product.attributes} />

            {/* Product Actions (Client Side: Quantity, Add to Cart, Buy Now) */}
            <ProductActions productId={product.id} />

            <VehicleCompatibility compatibleWith={product.compatibleWith} />

            {/* Trust Seals and Shipping info */}
            <div className="pt-6 border-t border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Truck className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-foreground">Free Delivery</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">On orders above ₹499</p>
                </div>
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

        {/* Product Reviews Section */}
        <ProductReviews productId={product.id} />

        {/* Related Products Section */}
        <RelatedProducts currentProductId={product.id} category={product.category} />
      </main>

      <Footer />
    </div>
  );
}
