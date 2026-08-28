"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  LayoutGrid,
  Sparkles,
  Tag,
  Car,
  Layers,
} from "lucide-react";
import { searchProducts, SearchProductsParams, SearchAggregations } from "@/lib/api";
import { Product } from "@/types/products";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden min-h-[380px] animate-pulse">
      <div className="p-5 space-y-4">
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-muted rounded-full" />
          <div className="h-3 w-3 bg-muted rounded-full" />
        </div>
        <div className="w-full h-40 rounded-xl bg-muted/40" />
        <div className="h-5 w-3/4 bg-muted rounded-lg" />
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-muted/60 rounded" />
          <div className="h-3 w-2/3 bg-muted/60 rounded" />
        </div>
      </div>
      <div className="px-5 pb-5 pt-2">
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <div className="space-y-1.5">
            <div className="h-3 w-10 bg-muted rounded" />
            <div className="h-6 w-16 bg-muted rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="size-9 rounded-full bg-muted" />
            <div className="size-9 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sort Options ──────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "name-asc", label: "Name: A → Z" },
  { value: "name-desc", label: "Name: Z → A" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface ProductsExplorerProps {
  initialSearch?: string;
  initialCategory?: string;
  initialBrand?: string;
  initialVehicle?: string;
}

export default function ProductsExplorer({
  initialSearch,
  initialCategory,
  initialBrand,
  initialVehicle,
}: ProductsExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Filter State ──
  const [searchQuery, setSearchQuery] = useState(initialSearch || "");
  const [activeCategory, setActiveCategory] = useState(initialCategory || "");
  const [activeBrand, setActiveBrand] = useState(initialBrand || "");
  const [activeVehicle, setActiveVehicle] = useState(initialVehicle || "");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [gridCols, setGridCols] = useState<3 | 4>(4);

  // ── Data State ──
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [aggregations, setAggregations] = useState<SearchAggregations | null>(null);
  const [loading, setLoading] = useState(true);

  // ── UI State ──
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const LIMIT = 12;

  // ── Fetch Products ──
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: SearchProductsParams = {
        page,
        limit: LIMIT,
        sortBy,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeCategory) params.category = activeCategory;
      if (activeBrand) params.brand = activeBrand;
      if (activeVehicle) params.vehicle = activeVehicle;
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);

      const data = await searchProducts(params);
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setAggregations(data.aggregations);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory, activeBrand, activeVehicle, minPrice, maxPrice, sortBy, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Sync URL params ──
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (activeCategory) params.set("category", activeCategory);
    if (activeBrand) params.set("brand", activeBrand);
    if (activeVehicle) params.set("vehicle", activeVehicle);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sortBy !== "newest") params.set("sortBy", sortBy);
    if (page > 1) params.set("page", String(page));

    const queryString = params.toString();
    const newUrl = queryString ? `/products?${queryString}` : "/products";
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, activeCategory, activeBrand, activeVehicle, minPrice, maxPrice, sortBy, page, router]);

  // ── Active filter chips ──
  const activeFilters: { label: string; onClear: () => void }[] = [];
  if (searchQuery.trim()) {
    activeFilters.push({
      label: `Search: "${searchQuery}"`,
      onClear: () => { setSearchQuery(""); setPage(1); },
    });
  }
  if (activeCategory) {
    activeFilters.push({
      label: `Category: ${activeCategory}`,
      onClear: () => { setActiveCategory(""); setPage(1); },
    });
  }
  if (activeBrand) {
    activeFilters.push({
      label: `Brand: ${activeBrand}`,
      onClear: () => { setActiveBrand(""); setPage(1); },
    });
  }
  if (activeVehicle) {
    activeFilters.push({
      label: `Vehicle: ${activeVehicle}`,
      onClear: () => { setActiveVehicle(""); setPage(1); },
    });
  }
  if (minPrice || maxPrice) {
    activeFilters.push({
      label: `Price: ${minPrice ? `₹${minPrice}` : "₹0"} – ${maxPrice ? `₹${maxPrice}` : "Any"}`,
      onClear: () => { setMinPrice(""); setMaxPrice(""); setPage(1); },
    });
  }

  const clearAllFilters = () => {
    setSearchQuery("");
    setActiveCategory("");
    setActiveBrand("");
    setActiveVehicle("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  // ── Group categories by parent ──
  const groupedCategories = aggregations?.categories.reduce(
    (acc, cat) => {
      const group = cat.parentName || "Other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(cat);
      return acc;
    },
    {} as Record<string, typeof aggregations.categories>
  ) || {};

  return (
    <div className="space-y-6">

      {/* ── Top Controls Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        {/* Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full sm:max-w-sm"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            id="explorer-search"
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="w-full pl-11 pr-10 py-3 text-sm font-medium bg-muted/20 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>

        {/* Right Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Filter Toggle (mobile) */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-border rounded-xl bg-muted/20 hover:bg-muted hover:border-primary/40 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black">
                {activeFilters.length}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-border rounded-xl bg-muted/20 hover:bg-muted hover:border-primary/40 transition-all cursor-pointer"
            >
              <ArrowUpDown className="size-3.5" />
              <span className="hidden sm:inline">
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort"}
              </span>
              <span className="sm:hidden">Sort</span>
              <ChevronDown
                className={`size-3 transition-transform ${isSortOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-popover p-1 shadow-xl backdrop-blur-md z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setPage(1);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      sortBy === opt.value
                        ? "bg-primary/10 text-primary-bright"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid Toggle (desktop) */}
          <div className="hidden lg:flex items-center border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setGridCols(3)}
              className={`p-2.5 transition-colors cursor-pointer ${
                gridCols === 3
                  ? "bg-primary/10 text-primary-bright"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              aria-label="3 columns"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setGridCols(4)}
              className={`p-2.5 transition-colors cursor-pointer ${
                gridCols === 4
                  ? "bg-primary/10 text-primary-bright"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              aria-label="4 columns"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="4" height="4" />
                <rect x="10" y="3" width="4" height="4" />
                <rect x="17" y="3" width="4" height="4" />
                <rect x="3" y="10" width="4" height="4" />
                <rect x="10" y="10" width="4" height="4" />
                <rect x="17" y="10" width="4" height="4" />
                <rect x="3" y="17" width="4" height="4" />
                <rect x="10" y="17" width="4" height="4" />
                <rect x="17" y="17" width="4" height="4" />
              </svg>
            </button>
          </div>

          {/* Results Count */}
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline whitespace-nowrap ml-2">
            {loading ? "Loading..." : `${total} product${total !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* ── Active Filter Chips ──────────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary-bright"
            >
              {filter.label}
              <button
                onClick={filter.onClear}
                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-[10px] font-bold text-muted-foreground hover:text-destructive uppercase tracking-wider transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* ── Main Layout: Sidebar + Grid ──────────────────────────────── */}
      <div className="flex gap-8 items-start">

        {/* ── Filter Sidebar ────────────────────────────────────── */}
        <aside
          className={`shrink-0 w-64 space-y-6 ${
            isFilterOpen
              ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-xl p-6 overflow-y-auto lg:static lg:bg-transparent lg:backdrop-blur-none lg:p-0 lg:z-auto"
              : "hidden lg:block"
          }`}
        >
          {/* Mobile close button */}
          {isFilterOpen && (
            <div className="flex justify-between items-center lg:hidden mb-4">
              <h3 className="text-base font-bold text-foreground">Filters</h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
          )}

          {/* Price Range */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="size-3.5 text-primary" />
              Price Range
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={`₹${aggregations?.priceRange.min ?? 0}`}
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 text-xs font-medium bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
              />
              <span className="text-xs text-muted-foreground font-bold">–</span>
              <input
                type="number"
                placeholder={`₹${aggregations?.priceRange.max ?? 100000}`}
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 text-xs font-medium bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
              />
            </div>
            {aggregations && (
              <p className="text-[10px] text-muted-foreground">
                Range: ₹{aggregations.priceRange.min.toLocaleString("en-IN")} – ₹{aggregations.priceRange.max.toLocaleString("en-IN")}
              </p>
            )}
          </div>

          {/* Category Filter */}
          {aggregations && aggregations.categories.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                Categories
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => { setActiveCategory(""); setPage(1); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    !activeCategory
                      ? "bg-primary/10 text-primary-bright"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  All Categories
                </button>
                {Object.entries(groupedCategories).map(([group, cats]) => (
                  <div key={group}>
                    {Object.keys(groupedCategories).length > 1 && (
                      <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider px-3 pt-2 pb-1">
                        {group}
                      </p>
                    )}
                    {cats.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(
                            activeCategory === cat.slug ? "" : cat.slug
                          );
                          setPage(1);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          activeCategory === cat.slug
                            ? "bg-primary/10 text-primary-bright"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand Filter */}
          {aggregations && aggregations.brands.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="size-3.5 text-primary" />
                Brands
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => { setActiveBrand(""); setPage(1); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    !activeBrand
                      ? "bg-primary/10 text-primary-bright"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  All Brands
                </button>
                {aggregations.brands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => {
                      setActiveBrand(
                        activeBrand === brand.slug ? "" : brand.slug
                      );
                      setPage(1);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeBrand === brand.slug
                        ? "bg-primary/10 text-primary-bright"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle Filter */}
          {activeVehicle && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Car className="size-3.5 text-primary" />
                Vehicle
              </h4>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5">
                <span className="text-xs font-semibold text-primary-bright flex-grow">
                  {activeVehicle}
                </span>
                <button
                  onClick={() => { setActiveVehicle(""); setPage(1); }}
                  className="p-0.5 rounded hover:bg-primary/20 text-primary cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
          )}

          {/* Apply Filters Button (mobile) */}
          {isFilterOpen && (
            <div className="lg:hidden pt-4 space-y-3">
              <Button
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-5 text-sm font-bold rounded-xl cursor-pointer"
              >
                Show {total} Results
              </Button>
              {activeFilters.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors cursor-pointer py-2"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </aside>

        {/* ── Product Grid ──────────────────────────────────────── */}
        <div className="flex-grow min-w-0 space-y-8">
          {loading ? (
            <div
              className={`grid gap-6 sm:gap-8 ${
                gridCols === 3
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              }`}
            >
              {Array.from({ length: LIMIT }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div
              className={`grid gap-6 sm:gap-8 ${
                gridCols === 3
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              }`}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 border border-border/60 rounded-3xl bg-card/20 max-w-md mx-auto">
              <Sparkles className="size-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-base font-bold text-foreground mb-1">
                No Products Found
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6 leading-relaxed">
                We couldn&apos;t find any products matching your current filters.
                Try adjusting your search or clearing some filters.
              </p>
              {activeFilters.length > 0 && (
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}

          {/* ── Pagination ──────────────────────────────────────── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2.5 rounded-xl border border-border hover:bg-muted hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>

              {/* Page Numbers */}
              {(() => {
                const pages: (number | "...")[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push("...");
                  for (
                    let i = Math.max(2, page - 1);
                    i <= Math.min(totalPages - 1, page + 1);
                    i++
                  ) {
                    pages.push(i);
                  }
                  if (page < totalPages - 2) pages.push("...");
                  pages.push(totalPages);
                }

                return pages.map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-xs text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`min-w-[36px] h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        page === p
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "border border-border hover:bg-muted hover:border-primary/40"
                      }`}
                    >
                      {p}
                    </button>
                  )
                );
              })()}

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-2.5 rounded-xl border border-border hover:bg-muted hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Close sort dropdown on click outside */}
      {isSortOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setIsSortOpen(false)}
        />
      )}
    </div>
  );
}
