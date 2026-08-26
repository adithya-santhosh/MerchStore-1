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
import type { Metadata } from "next";
import { buildMetadata, formatPrice } from "@/lib/seo";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return { title: "Product Not Found" };

  try {
    const product = await getProductById(id);

    // Prefer the curated short description; otherwise trim the long one to a
    // length search engines will actually display (~160 chars).
    const raw = product.shortDescription?.trim() || product.description?.trim() || "";
    const summary = raw.length > 155 ? `${raw.slice(0, 152).trimEnd()}…` : raw;

    return buildMetadata({
      title: product.name,
      description:
        summary ||
        `${product.name} — available at ${formatPrice(product.price)} with free delivery across India.`,
      path: `/products/${product.id}`,
      image: getProductImageSrc(product.ImageURL),
    });
  } catch {
    // A metadata failure must never take down the page itself.
    return { title: "Product" };
  }
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          
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
                  <p className="text-[11px] text-muted-foreground mt-0.5">On every order, no minimum</p>
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

        {/* Product Reviews Section */}
        <ProductReviews productId={product.id} />

        {/* Related Products Section */}
        <RelatedProducts currentProductId={product.id} category={product.category} />
      </main>

      <Footer />
    </div>
  );
}
