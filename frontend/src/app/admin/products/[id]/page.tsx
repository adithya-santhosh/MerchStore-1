import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Save, Trash2 } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProductEditPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back link */}
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary mb-8 group cursor-pointer"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          Back to Admin Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/80 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase mb-2">
              <Sparkles className="size-3.5" />
              Console Portal
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Edit Product #{id}
            </h1>
          </div>
          <Button variant="destructive" size="sm" className="cursor-pointer">
            <Trash2 className="size-4 mr-2" />
            Delete Product
          </Button>
        </div>

        {/* Placeholder Form */}
        <form className="space-y-6 bg-card border border-border rounded-3xl p-8 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                Product Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                placeholder="e.g. Formula V1 Hoodie"
                required
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-foreground mb-2">
                Price (₹)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                placeholder="₹6500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-foreground mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground cursor-pointer"
              required
            >
              <option value="Car Accessories">Car Accessories</option>
              <option value="Merchandise">Merchandise</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-foreground mb-2">
              Product Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground resize-none"
              placeholder="Provide a detailed description of the product and materials used..."
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" className="shadow-lg cursor-pointer">
              <Save className="size-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>

      </main>

      <Footer />
    </div>
  );
}
