import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";

export default function CampingOverlandPage() {
  const products = [
    { name: "Premium Hard-Shell Rooftop Tent", specs: "Hydraulic opening system, high-density foam mattress, 3-person", price: "$1,450.00" },
    { name: "Sleek 270-Degree Awning System", specs: "Self-supporting frame, heavy-duty waterproof canvas, brackets included", price: "$420.00" },
    { name: "Dual-Zone Portable Fridge Freezer", specs: "45L capacity, low-amp compressor, dynamic battery protector", price: "$550.00" },
    { name: "Slide-Out Camp Kitchen Module", specs: "Premium stainless steel design, dual burner gas stoves, wash sink", price: "$720.00" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        
        {/* Back Link */}
        <Link
          href="/products/car-accessories"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary mb-8 group cursor-pointer"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          Back to Categories
        </Link>

        {/* Category Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
            <Sparkles className="size-3.5" />
            Adventure Basecamp
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Camping & Overland
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Unrivaled off-road basecamp living solutions. High-grade rugged hard-shell rooftop tents, structural multi-angle awnings, low-draw portable smart fridges, and slide-out modular gas stoves.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {products.map((prod) => (
            <div
              key={prod.name}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/10 transition-all duration-200"
            >
              <div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {prod.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-normal">
                  {prod.specs}
                </p>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
                <span className="text-sm font-bold text-foreground">{prod.price}</span>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                  Coming Soon
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-12 rounded-2xl border border-border/60 bg-muted/20 p-5 flex gap-3.5 items-start max-w-2xl">
          <AlertCircle className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Inventory Integration in Progress</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We are connecting this section to our Cloudinary catalog and Express inventory database. Limited drops are launching shortly!
            </p>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
