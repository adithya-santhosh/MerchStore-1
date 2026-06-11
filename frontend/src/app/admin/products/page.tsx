import Link from "next/link";
import { getProducts } from "@/lib/api";
import { Product } from "@/types/products";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit2, Trash2, Sparkles, FolderOpen } from "lucide-react";

export default async function AdminProductsPage() {
  const products: Product[] = await getProducts();

  return (
    <div className="space-y-8">
      
      {/* Catalog Header */}
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

      {/* Catalog List */}
      {products.length > 0 ? (
        <div className="bg-card/40 border border-border/80 rounded-3xl overflow-hidden shadow-sm">
          
          {/* Header Row (Desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/60 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-1">ID</div>
            <div className="col-span-5">Product Details</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Data Rows */}
          <div className="divide-y divide-border/60">
            {products.map((product: Product) => (
              <div
                key={product.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-muted/10 transition-colors duration-200"
              >
                
                {/* ID Column */}
                <div className="col-span-1 text-xs font-semibold text-muted-foreground md:block flex items-center justify-between">
                  <span className="md:hidden text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">ID:</span>
                  #{product.id}
                </div>

                {/* Name & Details Column */}
                <div className="col-span-5 space-y-1">
                  <h3 className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
                    {product.description || "No description set for this catalog item."}
                  </p>
                </div>

                {/* Category Column */}
                <div className="col-span-2 flex items-center md:block">
                  <span className="md:hidden text-xs font-bold uppercase tracking-wider text-muted-foreground mr-4">Category:</span>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full border border-border bg-muted/40 text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">
                    {product.category}
                  </span>
                </div>

                {/* Price Column */}
                <div className="col-span-2 flex items-center md:block font-bold text-foreground">
                  <span className="md:hidden text-xs font-bold uppercase tracking-wider text-muted-foreground mr-4">Price:</span>
                  ₹{product.price.toLocaleString("en-IN")}
                </div>

                {/* Actions Button Column */}
                <div className="col-span-2 flex justify-end gap-2 pt-4 md:pt-0 border-t border-border/40 md:border-t-0">
                  
                  {/* Redirect Edit link to the correct dynamic route /admin/products/[id] */}
                  <Button variant="outline" size="xs" className="cursor-pointer" asChild>
                    <Link href={`/admin/products/${product.id}`} className="flex items-center gap-1">
                      <Edit2 className="size-3" />
                      Edit
                    </Link>
                  </Button>

                  <Button variant="destructive" size="xs" className="cursor-pointer">
                    <Trash2 className="size-3" />
                    Delete
                  </Button>

                </div>

              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="text-center py-20 border border-border/80 rounded-3xl bg-card/20 max-w-md mx-auto space-y-4">
          <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/40 mx-auto">
            <FolderOpen className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">No Products Active</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              Your inventory database is currently empty. Get started by adding a brand new product card drop!
            </p>
          </div>
          <Button size="sm" className="cursor-pointer" asChild>
            <Link href="/admin/products/new">
              Add Your First Product
            </Link>
          </Button>
        </div>
      )}

    </div>
  );
}