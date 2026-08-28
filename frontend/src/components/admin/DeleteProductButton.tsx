"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteProduct } from "@/lib/api";
import { useState } from "react";
import { Product } from "@/types/products";

interface DeleteProductButtonProps {
  product: Product;
}

export default function DeleteProductButton({ product }: DeleteProductButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
      setShowConfirm(false);
      alert("Product deleted successfully!");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to delete product.");
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="xs"
        onClick={() => setShowConfirm(true)}
        className="cursor-pointer"
      >
        <Trash2 className="size-3" />
        Delete
      </Button>

      {/* Custom Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200 text-left">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="size-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="size-6" />
              </div>
              <h2 className="text-xl font-extrabold text-foreground">Delete Catalog Product?</h2>
              <p className="text-xs text-muted-foreground font-medium">Are you absolutely sure you want to permanently delete this product? This action cannot be undone.</p>
            </div>

            {/* Product Details Preview */}
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-primary-bright uppercase tracking-wider">{product.category}</span>
                <span className="text-xs font-bold text-muted-foreground">ID: #{product.id}</span>
              </div>
              <h3 className="text-sm font-bold text-foreground truncate">{product.name}</h3>
              <div className="text-sm font-extrabold text-foreground">Price: ₹{product.price.toLocaleString("en-IN")}</div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 shadow-lg cursor-pointer"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
