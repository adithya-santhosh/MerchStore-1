"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createProduct, getSubCategories } from "@/lib/api";
import { PlusCircle, Image, Sparkles } from "lucide-react";

export default function ProductForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [customSubCategory, setCustomSubCategory] = useState("");
  const [ImageURL, setImageURL] = useState("");

  const [isCustom, setIsCustom] = useState(false);
  const [dbSubCategories, setDbSubCategories] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
    setSubCategory("");
    setCustomSubCategory("");
    setIsCustom(false);
  }, [category]);

  const getSubCategoryOptions = () => {
    const defaults = category === "Car Accessories"
      ? ["Recovery Gear", "Lighting & Electrical", "Armor & Protection", "Camping & Overland", "Storage Racks", "Suspension & Wheels"]
      : ["Apparel", "Headwear", "Lifestyle", "Streetwear"];

    return Array.from(new Set([...defaults, ...dbSubCategories]));
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
      await createProduct({
        name,
        description,
        price: Number(price),
        category,
        subCategory: isCustom ? customSubCategory : subCategory,
        ImageURL: ImageURL || null,
      });
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Failed to create product.");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setSubCategory("");
    setCustomSubCategory("");
    setIsCustom(false);
    setImageURL("");
    setShowSuccess(false);
  };

  const currentSub = isCustom ? customSubCategory : subCategory;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 bg-card/40 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        
        {/* 2-Column Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Formula V1 Hoodie"
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              required
            />
          </div>

          {/* Price Input */}
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
                placeholder="e.g. 1200"
                className="w-full rounded-xl border border-input bg-background/50 pl-8 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                required
              />
            </div>
          </div>

        </div>

        {/* Primary and Sub-Category Dropdowns */}
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

        {/* Image URL Input */}
        <div className="space-y-2">
          <label htmlFor="imageURL" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Image className="size-3.5 text-muted-foreground" />
            Image URL
          </label>
          <input
            type="text"
            id="imageURL"
            value={ImageURL}
            onChange={(e) => setImageURL(e.target.value)}
            placeholder="e.g. https://cloudinary.com/your-product-image.png"
            className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
          />
        </div>

        {/* Description Textarea */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Product Description
          </label>
          <textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write detailed specifications, fabric weights, or dimensions for this styling piece..."
            className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground resize-none"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button type="submit" className="shadow-lg shadow-primary/10 cursor-pointer">
            <PlusCircle className="size-4 mr-2 animate-pulse" />
            Create Product Card
          </Button>
        </div>

      </form>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold text-foreground">Confirm Product Details</h2>
              <p className="text-xs text-muted-foreground font-medium">Are you sure the following details are correct before creating?</p>
            </div>

            {/* Preview Card */}
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
              <div className="relative aspect-video w-full rounded-xl border border-border/40 overflow-hidden bg-muted flex items-center justify-center p-2">
                {ImageURL ? (
                  <img src={ImageURL} alt={name} className="w-full h-full object-contain" />
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
                {loading ? "Adding..." : "Confirm & Create"}
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
              <h2 className="text-xl font-extrabold text-foreground font-black">Product Created!</h2>
              <p className="text-xs text-muted-foreground font-medium">The product has been successfully added to your live catalog database.</p>
            </div>

            {/* Preview Card */}
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
              <div className="relative aspect-video w-full rounded-xl border border-border/40 overflow-hidden bg-muted flex items-center justify-center p-2">
                {ImageURL ? (
                  <img src={ImageURL} alt={name} className="w-full h-full object-contain" />
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
                Close & Clear Form
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}