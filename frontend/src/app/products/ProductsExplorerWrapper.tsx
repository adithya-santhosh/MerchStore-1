"use client";

import dynamic from "next/dynamic";

const ProductsExplorer = dynamic(
  () => import("@/components/ProductsExplorer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

interface Props {
  search?: string;
  category?: string;
  /**
   * A leaf category. The search API resolves parent and leaf categories through
   * the same `category` filter (by slug or name), so this collapses into
   * `initialCategory` — it just wins when both are present, being the more
   * specific of the two. Without this the prop was accepted by the page and
   * silently dropped here, so `?subCategory=Caps` rendered the "Caps" heading
   * over the entire unfiltered catalogue.
   */
  subCategory?: string;
  brand?: string;
  vehicle?: string;
}

export default function ProductsExplorerWrapper({
  search,
  category,
  subCategory,
  brand,
  vehicle,
}: Props) {
  return (
    <ProductsExplorer
      initialSearch={search}
      initialCategory={subCategory || category}
      initialBrand={brand}
      initialVehicle={vehicle}
    />
  );
}
