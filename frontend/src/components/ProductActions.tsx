"use client";

import { useState } from "react";
import QuantitySelector from "./QuantitySelector";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import { ShoppingBag, CreditCard, ArrowRight } from "lucide-react";

interface ProductActionsProps {
  productId: number;
}

export default function ProductActions({ productId }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addToCart(productId, quantity);
    setTimeout(() => setIsAdding(false), 500); // Visual feedback
  };

  const handleBuyNow = async () => {
    setIsBuying(true);
    await addToCart(productId, quantity);
    router.push("/cart");
  };

  return (
    <div className="space-y-8">
      {/* Interactive Quantity Selector */}
      <div className="pt-2">
        <QuantitySelector value={quantity} onChange={setQuantity} />
      </div>

      {/* Dynamic Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Button
          onClick={handleAddToCart}
          size="lg"
          disabled={isAdding}
          variant="outline"
          className="flex-1 h-14 text-base font-bold cursor-pointer border-primary/40 bg-primary/5 hover:bg-primary/15 hover:border-primary/80 transition-all duration-300 group shadow-lg shadow-primary/5"
        >
          <ShoppingBag className="size-5 mr-2 text-primary transition-transform group-hover:scale-110" />
          {isAdding ? "Added!" : "Add to Cart"}
        </Button>
        <Button
          onClick={handleBuyNow}
          size="lg"
          disabled={isBuying}
          className="flex-1 h-14 text-base font-bold cursor-pointer shadow-[0_0_20px_rgba(220,50,47,0.3)] hover:shadow-[0_0_30px_rgba(220,50,47,0.5)] animate-pulse-glow group"
        >
          {isBuying ? (
             <span className="flex items-center gap-2">
               <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
               Processing...
             </span>
          ) : (
            <>
              <CreditCard className="size-5 mr-2 transition-transform group-hover:scale-110" />
              Buy Now
              <ArrowRight className="size-4 ml-2 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
