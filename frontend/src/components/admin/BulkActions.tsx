"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ToggleRight, ToggleLeft, CheckSquare, Square, X } from "lucide-react";
import { bulkUpdateProducts } from "@/lib/api";
import { Product } from "@/types/products";

interface BulkActionsProps {
  products: Product[];
}

export default function BulkActions({ products }: BulkActionsProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  };

  const handleBulk = async (action: "activate" | "deactivate" | "delete") => {
    if (!selected.size) return;
    if (action === "delete" && !confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;

    setLoading(true);
    try {
      await bulkUpdateProducts(Array.from(selected), action);
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      console.error("Bulk action failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const allSelected = selected.size === products.length && products.length > 0;

  return (
    <>
      {/* Inject checkbox column into each product row via data attribute */}
      <div className="contents" data-bulk-actions>
        {/* Select All checkbox in header area */}
        <div className="flex items-center gap-3 px-6 pt-4 mb-3">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {allSelected ? (
              <CheckSquare className="size-4 text-primary" />
            ) : (
              <Square className="size-4" />
            )}
            {allSelected ? "Deselect All" : `Select All (${products.length})`}
          </button>

          {selected.size > 0 && (
            <span className="text-xs font-bold text-primary-bright">
              {selected.size} selected
            </span>
          )}
        </div>

        {/* Product rows with checkboxes */}
        <div className="divide-y divide-border/60">
          {products.map((product) => {
            const isSelected = selected.has(product.id);
            const stockQty = product.stockQty ?? 0;
            const stockStatus =
              stockQty === 0 ? "out" : stockQty < 5 ? "low" : "in";

            return (
              <div
                key={product.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center transition-colors duration-150 ${
                  isSelected ? "bg-primary/5" : "hover:bg-muted/10"
                }`}
              >
                {/* Checkbox + ID */}
                <div className="col-span-1 flex items-center gap-2">
                  <button
                    onClick={() => toggleSelect(product.id)}
                    className="cursor-pointer shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="size-4 text-primary" />
                    ) : (
                      <Square className="size-4 text-muted-foreground/50" />
                    )}
                  </button>
                  <span className="text-xs font-semibold text-muted-foreground">
                    #{product.id}
                  </span>
                </div>

                {/* Thumbnail */}
                <div className="col-span-1 hidden md:flex items-center justify-center">
                  {product.ImageURL ? (
                    <img
                      src={product.ImageURL}
                      alt={product.name}
                      className="size-10 rounded-xl object-cover border border-border/60"
                    />
                  ) : (
                    <div className="size-10 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center text-[10px] text-muted-foreground">
                      N/A
                    </div>
                  )}
                </div>

                {/* Name + Description */}
                <div className="col-span-3 space-y-0.5 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {product.description || "No description"}
                  </p>
                </div>

                {/* Category */}
                <div className="col-span-2 flex items-center">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full border border-border bg-muted/40 text-[10px] font-semibold tracking-wide uppercase text-muted-foreground truncate">
                    {product.category}
                  </span>
                </div>

                {/* Price */}
                <div className="col-span-1 font-bold text-foreground text-sm">
                  ₹{product.price.toLocaleString("en-IN")}
                </div>

                {/* Stock Badge */}
                <div className="col-span-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                      stockStatus === "out"
                        ? "text-rose-500 bg-rose-500/10 border-rose-500/20"
                        : stockStatus === "low"
                        ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
                        : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        stockStatus === "out"
                          ? "bg-rose-500"
                          : stockStatus === "low"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    {stockQty}
                  </span>
                </div>

                {/* Active Status */}
                <div className="col-span-1">
                  {product.isActive !== false ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 uppercase tracking-wide">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end gap-2">
                  <a
                    href={`/admin/products/${product.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-lg border border-border hover:bg-muted hover:text-foreground text-muted-foreground transition-all cursor-pointer"
                  >
                    Edit
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 animate-in slide-in-from-bottom-4 duration-200">
          <span className="text-xs font-bold text-foreground mr-2">
            {selected.size} selected
          </span>

          <button
            onClick={() => handleBulk("activate")}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-600 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <ToggleRight className="size-3.5" />
            Activate
          </button>

          <button
            onClick={() => handleBulk("deactivate")}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-600 bg-amber-500/10 rounded-xl hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <ToggleLeft className="size-3.5" />
            Deactivate
          </button>

          <button
            onClick={() => handleBulk("delete")}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-destructive bg-destructive/10 rounded-xl hover:bg-destructive/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>

          <button
            onClick={() => setSelected(new Set())}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
