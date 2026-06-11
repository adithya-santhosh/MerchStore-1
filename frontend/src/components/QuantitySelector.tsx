"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export default function QuantitySelector() {
  const [quantity, setQuantity] = useState(1);

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = () => {
    setQuantity(quantity + 1);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Quantity
      </span>
      <div className="flex items-center border border-border rounded-xl bg-card overflow-hidden h-11 w-32 shadow-sm">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={quantity <= 1}
          className="flex items-center justify-center w-10 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          aria-label="Decrease quantity"
        >
          <Minus className="size-4" />
        </button>
        <span className="flex-1 text-center text-sm font-semibold select-none text-foreground">
          {quantity}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          className="flex items-center justify-center w-10 h-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
