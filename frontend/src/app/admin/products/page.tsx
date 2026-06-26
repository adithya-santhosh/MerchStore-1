import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { getAdminProducts, getProductStats } from "@/lib/api";
import { PlusCircle, FolderOpen, Package, ShieldAlert, AlertTriangle, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductFilters from "@/components/admin/ProductFilters";
import ProductPagination from "@/components/admin/ProductPagination";
import BulkActions from "@/components/admin/BulkActions";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    status?: string;
    stock?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  // Parallel server-side fetch
  const [productsData, stats] = await Promise.all([
    getAdminProducts({
      page: params.page || "1",
      limit: "15",
      search: params.search,
      category: params.category,
      status: params.status,
      stock: params.stock,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    }, token),
    getProductStats(token),
  ]);

  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Products Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your store inventory, pricing, and category divisions.
          </p>
        </div>

        <Button className="shadow-lg cursor-pointer" asChild>
          <Link href="/admin/products/new" className="flex items-center gap-2">
            <PlusCircle className="size-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Products",
            value: stats.totalProducts,
            icon: FolderKanban,
            color: "text-foreground",
            bg: "bg-muted/20",
          },
          {
            label: "Active",
            value: stats.activeProducts,
            icon: Package,
            color: "text-emerald-500",
            bg: "bg-emerald-500/5",
          },
          {
            label: "Inactive",
            value: stats.inactiveProducts,
            icon: ShieldAlert,
            color: "text-muted-foreground",
            bg: "bg-muted/10",
          },
          {
            label: "Out of Stock",
            value: stats.outOfStock,
            icon: AlertTriangle,
            color: "text-rose-500",
            bg: "bg-rose-500/5",
          },
          {
            label: "Low Stock",
            value: stats.lowStock,
            icon: AlertTriangle,
            color: "text-amber-500",
            bg: "bg-amber-500/5",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border border-border/70 p-4 ${stat.bg} space-y-1`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-semibold">
                {stat.label}
              </p>
              <stat.icon className={`size-4 ${stat.color} opacity-50`} />
            </div>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters (Client Component) ───────────────────────────────────── */}
      <Suspense fallback={null}>
        <ProductFilters />
      </Suspense>

      {/* ── Product List ─────────────────────────────────────────────────── */}
      {productsData.products.length > 0 ? (
        <div className="bg-card/40 border border-border/80 rounded-3xl overflow-hidden shadow-sm">
          <BulkActions products={productsData.products} />
        </div>
      ) : (
        <div className="text-center py-20 border border-border/80 rounded-3xl bg-card/20 max-w-md mx-auto space-y-4">
          <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/40 mx-auto">
            <FolderOpen className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {params.search || params.category || params.status || params.stock
                ? "No Products Match"
                : "No Products Active"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              {params.search || params.category || params.status || params.stock
                ? "No products match your current filters. Try adjusting your search or resetting filters."
                : "Your inventory database is currently empty. Get started by adding a brand new product!"}
            </p>
          </div>
          {!params.search && !params.category && !params.status && !params.stock && (
            <Button size="sm" className="cursor-pointer" asChild>
              <Link href="/admin/products/new">Add Your First Product</Link>
            </Button>
          )}
        </div>
      )}

      {/* ── Pagination (Client Component) ────────────────────────────────── */}
      <Suspense fallback={null}>
        <ProductPagination
          total={productsData.total}
          page={productsData.page}
          limit={productsData.limit}
          totalPages={productsData.totalPages}
        />
      </Suspense>
    </div>
  );
}