"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WishlistButtonProps {
  productId: number;
  variant?: "icon" | "button";
}

export default function WishlistButton({
  productId,
  variant = "icon",
}: WishlistButtonProps) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const router = useRouter();
  const [animating, setAnimating] = useState(false);

  const wishlisted = isWishlisted(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    setAnimating(true);
    await toggleWishlist(productId);
    setTimeout(() => setAnimating(false), 300);
  };

  if (variant === "button") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border text-sm font-semibold transition-all duration-300 cursor-pointer ${
          wishlisted
            ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/15"
            : "bg-muted/20 border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/40"
        }`}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={`size-4 transition-transform duration-300 ${
            animating ? "scale-125" : "scale-100"
          }`}
          fill={wishlisted ? "currentColor" : "none"}
        />
        {wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
      </button>
    );
  }

  // Icon variant (for cards)
  return (
    <button
      onClick={handleClick}
      className={`size-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
        wishlisted
          ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
          : "text-muted-foreground bg-transparent hover:bg-muted hover:text-foreground"
      }`}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`size-4 transition-transform duration-300 ${
          animating ? "scale-125" : "scale-100"
        }`}
        fill={wishlisted ? "currentColor" : "none"}
      />
    </button>
  );
}
