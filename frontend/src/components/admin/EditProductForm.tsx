"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateProduct, deleteProduct, getSubCategories } from "@/lib/api";
import { Product } from "@/types/products";
import { Save, Trash2, Image, Sparkles, AlertTriangle } from "lucide-react";

interface EditProductFormProps {
  product: Product;
}

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.price.toString());
  const [category, setCategory] = useState(product.category);
  const [subCategory, setSubCategory] = useState(product.subCategory || "");
  const [customSubCategory, setCustomSubCategory] = useState("");
  const [imageURL, setImageURL] = useState(product.ImageURL || "");

  const [isCustom, setIsCustom] = useState(false);
  const [dbSubCategories, setDbSubCategories] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch subcategories from database on category change
  useEffect(() => {
    if (!category) {
      setDbSubCategories([]);
      setSubCategory("");
      setIsCustom(false);
      return;
    }

    const fetchSubs = async () => {
      try {
        const subs = await getSubCategories(category);
        const filtered = subs.filter((s): s is string => !!s);
        setDbSubCategories(filtered);
      } catch (err) {
        console.error("Failed to load subcategories:", err);
        setDbSubCategories([]);
      }
    };

    fetchSubs();

    // If changing category away from original, reset subcategory selection
    if (category !== product.category) {
      setSubCategory("");
      setCustomSubCategory("");
      setIsCustom(false);
    } else {
      setSubCategory(product.subCategory || "");
      setIsCustom(false);
    }
  }, [category, product.category, product.subCategory]);

  const getSubCategoryOptions = () => {
    const defaults = category === "Car Accessories"
      ? ["Recovery Gear", "Lighting & Electrical", "Armor & Protection", "Camping & Overland", "Storage & Racks", "Suspension & Wheels"]
      : ["Apparel", "Headwear", "Lifestyle", "Streetwear"];

    const initialSub = product.subCategory ? [product.subCategory] : [];

    return Array.from(new Set([...defaults, ...dbSubCategories, ...initialSub]));
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setIsCustom(true);
      setSubCategory("");
    } else {
      setIsCustom(false);
      setSubCategory(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    try {
      await updateProduct(product.id, {
        name,
        description,
        price: Number(price),
        category,
        subCategory: isCustom ? customSubCategory : subCategory,
        ImageURL: imageURL || null,
      });
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Failed to update product.");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    router.push("/admin/products");
    router.refresh();
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      await deleteProduct(product.id);
      setShowDeleteConfirm(false);
      alert("Product deleted successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to delete product.");
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const currentSub = isCustom ? customSubCategory : subCategory;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
            className="cursor-pointer"
          >
            <Trash2 className="size-4 mr-2" />
            Delete Product
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-3xl p-8 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Product Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                placeholder="e.g. Formula V1 Hoodie"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="price" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground select-none">
                  ₹
                </span>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background/50 pl-8 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  placeholder="e.g. 1200"
                  required
                />
              </div>
            </div>
          </div>

          {/* Primary and Sub-Category Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Primary Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground cursor-pointer"
                required
              >
                <option value="">Select Primary Category</option>
                <option value="Car Accessories">Car Accessories</option>
                <option value="Merchandise">Merchandise</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="subCategory" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sub-Category
              </label>
              <select
                id="subCategory"
                value={isCustom ? "CUSTOM" : subCategory}
                onChange={handleSubCategoryChange}
                disabled={!category}
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="">Select Sub-Category</option>
                {category && getSubCategoryOptions().map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                {category && <option value="CUSTOM">+ Add Custom Sub-Category</option>}
              </select>
            </div>
          </div>

          {/* Custom Sub-Category Input Box */}
          {isCustom && category && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <label htmlFor="customSub" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Custom Sub-Category Name
              </label>
              <input
                type="text"
                id="customSub"
                value={customSubCategory}
                onChange={(e) => setCustomSubCategory(e.target.value)}
                placeholder="e.g. Stickers, Recovery Hooks..."
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="imageURL" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Image className="size-3.5 text-muted-foreground" />
              Image URL
            </label>
            <input
              type="text"
              id="imageURL"
              value={imageURL}
              onChange={(e) => setImageURL(e.target.value)}
              placeholder="e.g. https://cloudinary.com/your-product-image.png"
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product Description
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground resize-none"
              placeholder="Provide a detailed description of the product and materials used..."
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="shadow-lg cursor-pointer">
              <Save className="size-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold text-foreground">Confirm Product Changes</h2>
              <p className="text-xs text-muted-foreground font-medium">Are you sure the updated details are correct before saving?</p>
            </div>

            {/* Preview Card */}
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
              <div className="relative aspect-video w-full rounded-xl border border-border/40 overflow-hidden bg-muted flex items-center justify-center p-2">
                {imageURL ? (
                  <img src={imageURL} alt={name} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex flex-col items-center gap-2">
                    <Sparkles className="size-5 text-primary/40" />
                    No Image URL
                  </div>
                )}
              </div>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  <span>{category || "Uncategorized"}</span>
                  {currentSub && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{currentSub}</span>
                    </>
                  )}
                </div>
                <h3 className="text-sm font-bold text-foreground truncate">{name || "Untitled Product"}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{description || "No description provided."}</p>
                <div className="text-sm font-extrabold text-foreground pt-1">Price: ₹{Number(price).toLocaleString("en-IN")}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={() => setShowConfirm(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="button" className="flex-1 shadow-lg cursor-pointer" onClick={handleConfirmSave} disabled={loading}>
                {loading ? "Saving..." : "Confirm & Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="size-6" />
              </div>
              <h2 className="text-xl font-extrabold text-foreground font-black">Changes Saved!</h2>
              <p className="text-xs text-muted-foreground font-medium">The product catalog item has been successfully updated.</p>
            </div>

            {/* Preview Card */}
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
              <div className="relative aspect-video w-full rounded-xl border border-border/40 overflow-hidden bg-muted flex items-center justify-center p-2">
                {imageURL ? (
                  <img src={imageURL} alt={name} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex flex-col items-center gap-2">
                    <Sparkles className="size-5 text-primary/40" />
                    No Image
                  </div>
                )}
              </div>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  <span>{category}</span>
                  {currentSub && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{currentSub}</span>
                    </>
                  )}
                </div>
                <h3 className="text-sm font-bold text-foreground truncate">{name}</h3>
                <div className="text-sm font-extrabold text-foreground pt-1">Price: ₹{Number(price).toLocaleString("en-IN")}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex pt-2">
              <Button type="button" className="w-full shadow-lg cursor-pointer" onClick={handleCloseSuccess}>
                Close & Return
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{product.category}</span>
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
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 shadow-lg cursor-pointer"
                onClick={handleConfirmDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
