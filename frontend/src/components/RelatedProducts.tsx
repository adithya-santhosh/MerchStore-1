"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types/products";
import { getProductByCategory } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Sparkles, Loader2 } from "lucide-react";

interface RelatedProductsProps {
  currentProductId: number;
  category: string;
}

export default function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getProductByCategory(category)
      .then((data) => {
        if (isMounted) {
          // Filter out the current product and limit to 4 items
          const related = data
            .filter((p) => p.id !== currentProductId)
            .slice(0, 4);
          setProducts(related);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch related products:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [category, currentProductId]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="size-8 animate-spin text-primary/40" />
      </div>
    );
  }

  if (products.length === 0) {
    return null; // Don't show the section if no related products
  }

  return (
    <div className="py-12 border-t border-border/50">
      <div className="flex items-center gap-3 mb-8">
        <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Sparkles className="size-5" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">You Might Also Like</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
