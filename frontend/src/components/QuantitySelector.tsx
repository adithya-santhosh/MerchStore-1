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
  const [isFocused, setIsFocused] = useState(false);

  const quantity = value !== undefined ? value : localQty;
  const [tempInput, setTempInput] = useState<string>(String(quantity));

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
    setIsFocused(false);
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
    <div className="flex flex-col gap-3">
      {showLabel && (
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          Select Quantity
          <div className="h-px bg-border/60 flex-grow max-w-[100px]" />
        </span>
      )}
      <div 
        className="flex items-center border rounded-xl bg-card/40 backdrop-blur-sm overflow-hidden h-12 w-[140px] shadow-sm transition-all duration-300"
        style={{
          borderColor: isFocused ? "oklch(0.63 0.25 24)" : "oklch(0.28 0.01 250)",
          boxShadow: isFocused ? "0 0 0 3px rgba(220, 50, 47, 0.15)" : "none",
        }}
      >
        <button
          type="button"
          onClick={() => updateQuantity(quantity - 1)}
          disabled={quantity <= 1}
          className="flex items-center justify-center w-12 h-full text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer active:scale-95"
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
          onFocus={() => setIsFocused(true)}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full text-center text-sm font-black bg-transparent text-foreground border-none focus:outline-none focus:ring-0 p-0"
        />

        <button
          type="button"
          onClick={() => updateQuantity(quantity + 1)}
          disabled={max !== undefined && quantity >= max}
          className="flex items-center justify-center w-12 h-full text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer active:scale-95"
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
