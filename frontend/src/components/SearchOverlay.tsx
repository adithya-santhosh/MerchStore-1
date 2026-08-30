"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, ArrowRight, Clock, Sparkles, Command } from "lucide-react";
import { searchProducts } from "@/lib/api";
import { Product } from "@/types/products";
import { getProductImageSrc } from "@/lib/utils";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = "merchstore_recent_searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  const recent = getRecentSearches().filter(
    (s) => s.toLowerCase() !== query.toLowerCase()
  );
  recent.unshift(query.trim());
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
}

function clearRecentSearches() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches when opened
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
      // Auto-focus with slight delay for animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await searchProducts({ search: searchQuery, limit: 6 });
      setResults(data.products);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  // Global keyboard shortcut (Ctrl+K / Cmd+K) — handled externally
  // But we handle Escape and navigation within the overlay
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + (query.trim() ? 1 : 0); // +1 for "View all"

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        // Navigate to product
        const product = results[selectedIndex];
        addRecentSearch(query);
        onClose();
        router.push(`/products/${product.id}`);
      } else if (query.trim()) {
        // "View all results" or default enter
        handleViewAll();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleViewAll = () => {
    if (!query.trim()) return;
    addRecentSearch(query);
    onClose();
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const handleRecentClick = (search: string) => {
    setQuery(search);
    performSearch(search);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-xl animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Search Panel */}
      <div
        className="relative w-full max-w-2xl mx-4 animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-300"
        onKeyDown={handleKeyDown}
      >
        <div className="rounded-3xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl shadow-black/30 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border/60">
            <Search className="size-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="flex-grow bg-transparent text-lg font-medium text-foreground placeholder:text-muted-foreground outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[10px] font-bold text-muted-foreground bg-muted/60 border border-border rounded-lg px-2 py-1 hover:bg-muted transition-colors cursor-pointer"
            >
              ESC
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-[50vh] overflow-y-auto">
            {/* Loading State */}
            {loading && query.trim() && (
              <div className="px-6 py-8 flex items-center justify-center gap-3">
                <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground font-medium">
                  Searching...
                </span>
              </div>
            )}

            {/* Results List */}
            {!loading && results.length > 0 && (
              <div className="py-2">
                <div className="px-6 py-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Products
                  </span>
                </div>
                {results.map((product, idx) => {
                  const imageSrc = getProductImageSrc(product.ImageURL);
                  const isSelected = selectedIndex === idx;
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      onClick={() => {
                        addRecentSearch(query);
                        onClose();
                      }}
                      className={`flex items-center gap-4 px-6 py-3 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-l-2 border-primary"
                          : "hover:bg-muted/50 border-l-2 border-transparent"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="size-12 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={product.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Sparkles className="size-4 text-primary/30" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {product.name}
                        </p>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {product.category}
                          {product.subCategory
                            ? ` · ${product.subCategory}`
                            : ""}
                        </p>
                      </div>

                      {/* Price */}
                      <span className="text-sm font-black text-primary-bright shrink-0">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                    </Link>
                  );
                })}

                {/* View All Results */}
                <button
                  onClick={handleViewAll}
                  className={`w-full flex items-center justify-between px-6 py-3 transition-colors cursor-pointer ${
                    selectedIndex === results.length
                      ? "bg-primary/10 border-l-2 border-primary"
                      : "hover:bg-muted/50 border-l-2 border-transparent"
                  }`}
                >
                  <span className="text-sm font-semibold text-primary-bright flex items-center gap-2">
                    <Search className="size-4" />
                    View all results for &ldquo;{query}&rdquo;
                  </span>
                  <ArrowRight className="size-4 text-primary" />
                </button>
              </div>
            )}

            {/* No Results */}
            {!loading && query.trim() && results.length === 0 && (
              <div className="px-6 py-10 text-center space-y-2">
                <Sparkles className="size-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  No products found
                </p>
                <p className="text-xs text-muted-foreground">
                  Try adjusting your search terms or browse our categories.
                </p>
              </div>
            )}

            {/* Recent Searches (shown when no query) */}
            {!query.trim() && recentSearches.length > 0 && (
              <div className="py-2">
                <div className="px-6 py-2 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Recent Searches
                  </span>
                  <button
                    onClick={handleClearRecent}
                    className="text-[10px] font-semibold text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentClick(search)}
                    className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer text-left"
                  >
                    <Clock className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {search}
                    </span>
                    <ArrowRight className="size-3.5 text-muted-foreground ml-auto shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Empty state with shortcuts */}
            {!query.trim() && recentSearches.length === 0 && (
              <div className="px-6 py-10 text-center space-y-3">
                <Search className="size-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">
                  Start typing to search products
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/70">
                  <span className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono font-bold">
                    ↑
                  </span>
                  <span className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono font-bold">
                    ↓
                  </span>
                  <span>to navigate</span>
                  <span className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono font-bold ml-2">
                    ↵
                  </span>
                  <span>to select</span>
                  <span className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono font-bold ml-2">
                    esc
                  </span>
                  <span>to close</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/60 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium">
              <Command className="size-3" />
              <span>Powered by MerchStore Search</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/40 font-mono font-bold text-muted-foreground">
                ⌘
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/40 font-mono font-bold text-muted-foreground">
                K
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
