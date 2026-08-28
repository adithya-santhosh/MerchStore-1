import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { getProductById } from "@/lib/api";
import EditProductForm from "@/components/admin/EditProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProductEditPage({ params }: PageProps) {
  const { id } = await params;

  let product = null;
  let errorMsg = "";
  try {
    product = await getProductById(id);
  } catch (err) {
    console.error(err);
    errorMsg = "Failed to load product. It might not exist in the database.";
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back link */}
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary-bright mb-8 group cursor-pointer"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          Back to Admin Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/80 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary-bright uppercase mb-2">
              <Sparkles className="size-3.5" />
              Console Portal
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Edit Product #{id}
            </h1>
          </div>
        </div>

        {/* Form Container */}
        {product ? (
          <EditProductForm product={product} />
        ) : (
          <div className="bg-card border border-border rounded-3xl p-8 text-center text-muted-foreground">
            {errorMsg || "Product not found."}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
