import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function ProductsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Our Products
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore our curated selection of high-end car accessories and limited-edition merchandise.
          </p>
        </div>
        
        {/* Placeholder Categories Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="group relative rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <h2 className="text-2xl font-bold mb-2">Car Accessories</h2>
            <p className="text-muted-foreground mb-6">
              Custom air fresheners, premium vinyl decals, and aesthetic styling kits built for car enthusiasts.
            </p>
            <Link href="/products/car-accessories">
            <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform cursor-pointer">
            Browse Accessories &rarr;
            </span>
            </Link>
          </div>

          <div className="group relative rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <h2 className="text-2xl font-bold mb-2">Limited Merchandise</h2>
            <p className="text-muted-foreground mb-6">
              Premium t-shirts, hoodies, caps, and lifestyle gear engineered for maximum comfort and style.
            </p>
            <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform cursor-pointer">
              Browse Apparel &rarr;
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
