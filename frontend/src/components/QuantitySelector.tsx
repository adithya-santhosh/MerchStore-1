"use client";

import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  value?: number;
  onChange?: (val: number) => void;
  max?: number;
  showLabel?: boolean;
}

export default function QuantitySelector({
  value,
  onChange,
  max,
  showLabel = true,
}: QuantitySelectorProps) {
  const [localQty, setLocalQty] = useState(1);

  const quantity = value !== undefined ? value : localQty;
  const [tempInput, setTempInput] = useState<string>(String(quantity));

  // Sync state if value changes from parent
  useEffect(() => {
    setTempInput(String(quantity));
  }, [quantity]);

  const updateQuantity = (val: number) => {
    if (val < 1) return;
    if (max !== undefined && val > max) return;
    
    if (onChange) {
      onChange(val);
    } else {
      setLocalQty(val);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    // Allow empty string so user can clear the field to type
    setTempInput(valStr);

    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      if (max === undefined || parsed <= max) {
        if (onChange) {
          onChange(parsed);
        } else {
          setLocalQty(parsed);
        }
      }
    }
  };

  const handleInputBlur = () => {
    const parsed = parseInt(tempInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      setTempInput(String(quantity));
    } else if (max !== undefined && parsed > max) {
      setTempInput(String(max));
      updateQuantity(max);
    } else {
      setTempInput(String(parsed));
      updateQuantity(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {showLabel && (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Quantity
        </span>
      )}
      <div className="flex items-center border border-border rounded-xl bg-card overflow-hidden h-11 w-32 shadow-sm">
        <button
          type="button"
          onClick={() => updateQuantity(quantity - 1)}
          disabled={quantity <= 1}
          className="flex items-center justify-center w-10 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          aria-label="Decrease quantity"
        >
          <Minus className="size-4" />
        </button>
        
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={tempInput}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-12 h-full text-center text-sm font-semibold bg-transparent text-foreground border-none focus:outline-none focus:ring-0 p-0"
        />

        <button
          type="button"
          onClick={() => updateQuantity(quantity + 1)}
          disabled={max !== undefined && quantity >= max}
          className="flex items-center justify-center w-10 h-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
