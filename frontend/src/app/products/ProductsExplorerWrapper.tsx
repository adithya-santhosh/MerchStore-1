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
  brand?: string;
  vehicle?: string;
}

export default function ProductsExplorerWrapper({
  search,
  category,
  brand,
  vehicle,
}: Props) {
  return (
    <ProductsExplorer
      initialSearch={search}
      initialCategory={category}
      initialBrand={brand}
      initialVehicle={vehicle}
    />
  );
}
