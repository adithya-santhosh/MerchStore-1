import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function NewProductPage() {
  return (
    <div className="max-w-3xl w-full mx-auto space-y-6 sm:space-y-8">
      
      {/* Back to Catalog Link */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary mb-2 group cursor-pointer"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        Back to Catalog
      </Link>

      {/* Page Header */}
      <div className="border-b border-border/80 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase mb-2">
          <Sparkles className="size-3.5" />
          Console Portal
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Create New Product
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Publish a brand new custom product drop to your live catalog database.
        </p>
      </div>

      {/* Styled Creation Form */}
      <div>
        <ProductForm />
      </div>

    </div>
  );
}