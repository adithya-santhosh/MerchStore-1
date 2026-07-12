"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getWishlistIds, addToWishlistApi, removeFromWishlistApi } from "@/lib/api";
import { useAuth } from "./useAuth";

interface WishlistContextType {
  wishlistIds: number[];
  wishlistCount: number;
  isWishlisted: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  const fetchWishlistIds = useCallback(async () => {
    if (!user) {
      setWishlistIds([]);
      return;
    }
    try {
      const ids = await getWishlistIds();
      setWishlistIds(ids);
    } catch (err) {
      console.error("Failed to load wishlist:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  const isWishlisted = useCallback(
    (productId: number) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (productId: number) => {
      if (!user) return;

      const alreadyWishlisted = wishlistIds.includes(productId);

      // Optimistic update
      if (alreadyWishlisted) {
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
      } else {
        setWishlistIds((prev) => [...prev, productId]);
      }

      try {
        if (alreadyWishlisted) {
          await removeFromWishlistApi(productId);
        } else {
          await addToWishlistApi(productId);
        }
      } catch (err) {
        // Revert on error
        console.error("Wishlist toggle failed:", err);
        if (alreadyWishlisted) {
          setWishlistIds((prev) => [...prev, productId]);
        } else {
          setWishlistIds((prev) => prev.filter((id) => id !== productId));
        }
      }
    },
    [user, wishlistIds]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.length,
        isWishlisted,
        toggleWishlist,
        refreshWishlist: fetchWishlistIds,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
