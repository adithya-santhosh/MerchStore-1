"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search, X, ArrowUpDown } from "lucide-react";

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
  if (currentSortBy !== field)
    return <ArrowUpDown className="size-3 text-muted-foreground/40" />;
  return (
    <span className="text-primary text-[10px] font-black">
      {currentSortOrder === "asc" ? "↑" : "↓"}
    </span>
  );
}

export default function CustomerFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");

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

  const currentSortBy = searchParams.get("sortBy") || "createdAt";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

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
      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            id="customer-search"
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-muted/20 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>
        {search && (
          <button
            onClick={() => {
              setSearch("");
              router.push(pathname);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-destructive bg-destructive/5 border border-destructive/20 rounded-xl hover:bg-destructive/10 transition-all cursor-pointer"
          >
            <X className="size-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Sortable Column Headers */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/60 bg-muted/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-1">Avatar</div>
        <div className="col-span-2">
          <button
            onClick={() => toggleSort("firstName")}
            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
          >
            Name <SortIcon field="firstName" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
          </button>
        </div>
        <div className="col-span-2">
          <button
            onClick={() => toggleSort("email")}
            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
          >
            Email <SortIcon field="email" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
          </button>
        </div>
        <div className="col-span-1">Phone</div>
        <div className="col-span-1">
          <button
            onClick={() => toggleSort("createdAt")}
            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
          >
            Joined <SortIcon field="createdAt" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
          </button>
        </div>
        <div className="col-span-1">
          <button
            onClick={() => toggleSort("totalOrders")}
            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
          >
            Orders <SortIcon field="totalOrders" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
          </button>
        </div>
        <div className="col-span-2">
          <button
            onClick={() => toggleSort("totalSpent")}
            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
          >
            Total Spent <SortIcon field="totalSpent" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
          </button>
        </div>
        <div className="col-span-2 text-right">View</div>
      </div>
    </div>
  );
}
