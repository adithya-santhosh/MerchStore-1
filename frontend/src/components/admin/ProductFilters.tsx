"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, X, ArrowUpDown } from "lucide-react";
import { NavCategory, getNavigationMetadata } from "@/lib/api";

/**
 * Hoisted out of the component: defining it inline made React treat it as a new
 * component type on every render, remounting it each time rather than updating.
 */
function SortIcon({
  field,
  currentSortBy,
  currentSortOrder,
}: {
  field: string;
  currentSortBy: string;
  currentSortOrder: string;
}) {
  if (currentSortBy !== field) return <ArrowUpDown className="size-3 text-muted-foreground/40" />;
  return (
    <span className="text-primary text-[10px] font-black">
      {currentSortOrder === "asc" ? "↑" : "↓"}
    </span>
  );
}

export default function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categories, setCategories] = useState<NavCategory[]>([]);

  // Load categories for dropdown
  useEffect(() => {
    getNavigationMetadata()
      .then((data) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  // Declared before the effect that calls it — previously the effect referenced
  // this `const` from above its own declaration, which only worked because
  // effects run after render.
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filtering
      if (key !== "page") params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParam("search", search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, updateParam]);

  const clearAll = () => {
    setSearch("");
    router.push(pathname);
  };

  const currentCategory = searchParams.get("category") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentStock = searchParams.get("stock") || "";
  const currentSortBy = searchParams.get("sortBy") || "createdAt";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";
  const hasFilters = search || currentCategory || currentStatus || currentStock;

  const toggleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSortBy === field) {
      params.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", field);
      params.set("sortOrder", "asc");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            id="product-search"
            type="text"
            placeholder="Search by name, SKU, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-muted/20 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <select
            id="category-filter"
            value={currentCategory}
            onChange={(e) => updateParam("category", e.target.value)}
            className="pl-9 pr-8 py-2.5 text-xs font-semibold bg-muted/20 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <select
          id="status-filter"
          value={currentStatus}
          onChange={(e) => updateParam("status", e.target.value)}
          className="px-4 py-2.5 text-xs font-semibold bg-muted/20 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Stock filter */}
        <select
          id="stock-filter"
          value={currentStock}
          onChange={(e) => updateParam("stock", e.target.value)}
          className="px-4 py-2.5 text-xs font-semibold bg-muted/20 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
        >
          <option value="">All Stock</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-destructive bg-destructive/5 border border-destructive/20 rounded-xl hover:bg-destructive/10 transition-all cursor-pointer"
          >
            <X className="size-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Sortable Column Headers */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/60 bg-muted/20 rounded-t-2xl text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-1">
          <span className="cursor-default">ID</span>
        </div>
        <div className="col-span-1">Image</div>
        <div className="col-span-3">
          <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
            Product <SortIcon field="name" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
          </button>
        </div>
        <div className="col-span-2">Category</div>
        <div className="col-span-1">
          <button onClick={() => toggleSort("price")} className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
            Price <SortIcon field="price" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
          </button>
        </div>
        <div className="col-span-1">
          <button onClick={() => toggleSort("stockQty")} className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
            Stock <SortIcon field="stockQty" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
          </button>
        </div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>
    </div>
  );
}
