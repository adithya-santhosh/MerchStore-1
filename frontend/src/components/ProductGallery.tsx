"use client";

import { useState } from "react";
import { ProductImage } from "@/types/products";
import { getProductImageSrc } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface ProductGalleryProps {
  images: ProductImage[] | undefined;
  fallbackImage: string | null;
  productName: string;
  category: string;
}

export default function ProductGallery({ images, fallbackImage, productName, category }: ProductGalleryProps) {
  // Sort images by sortOrder, or default to fallback if no images
  const sortedImages = images && images.length > 0 
    ? [...images].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const [activeIndex, setActiveIndex] = useState(0);

  // If we have proper images, use them. Otherwise, fall back to the single legacy image URL.
  const mainImageSrc = sortedImages.length > 0 
    ? getProductImageSrc(sortedImages[activeIndex].imageUrl) 
    : fallbackImage;

  return (
    <div className="space-y-4">
      {/* Main Image View */}
      <div className="relative aspect-square w-full rounded-3xl border border-border bg-card/40 overflow-hidden flex items-center justify-center p-6 sm:p-12 shadow-sm hover:shadow-md transition-shadow duration-300">
        {mainImageSrc ? (
          <img
            src={mainImageSrc as string}
            alt={sortedImages.length > 0 ? sortedImages[activeIndex].altText || productName : productName}
            className="w-full h-full object-contain rounded-2xl max-h-[400px] transition-opacity duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-xs">
            <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Sparkles className="size-8" />
            </div>
            <div>
              <span className="text-xs font-semibold text-primary-bright uppercase tracking-widest">
                {category}
              </span>
              <h4 className="text-sm font-bold text-muted-foreground mt-1">
                No Image Available
              </h4>
            </div>
          </div>
        )}
        
        {/* Mesh background glow */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,var(--color-primary-foreground)/2,transparent_60%)] opacity-30" />
      </div>

      {/* Thumbnails Row */}
      {sortedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {sortedImages.map((image, idx) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(idx)}
              className={`relative flex-shrink-0 size-20 sm:size-24 rounded-xl border-2 overflow-hidden transition-all ${
                activeIndex === idx 
                  ? "border-primary shadow-sm scale-105" 
                  : "border-border/50 hover:border-primary/50 opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={getProductImageSrc(image.imageUrl) as string}
                alt={image.altText || `${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
