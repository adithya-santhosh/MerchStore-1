"use client";

import { useState } from "react";
import QuantitySelector from "./QuantitySelector";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";

interface ProductActionsProps {
  productId: number;
}

export default function ProductActions({ productId }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const router = useRouter();

  const handleAddToCart = async () => {
    await addToCart(productId, quantity);
  };

  const handleBuyNow = async () => {
    await addToCart(productId, quantity);
    router.push("/cart");
  };

  return (
    <div className="space-y-6">
      {/* Interactive Quantity Selector */}
      <div className="pt-2">
        <QuantitySelector value={quantity} onChange={setQuantity} />
      </div>

      {/* Dynamic Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={handleAddToCart}
          size="lg"
          className="flex-1 shadow-lg shadow-primary/10 py-6 text-base font-semibold cursor-pointer"
        >
          Add to Cart
        </Button>
        <Button
          onClick={handleBuyNow}
          size="lg"
          variant="secondary"
          className="flex-grow sm:flex-1 py-6 text-base font-semibold cursor-pointer"
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
