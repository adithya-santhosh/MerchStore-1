"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateProduct, deleteProduct, getSubCategories, getNavigationMetadata, NavMetadata } from "@/lib/api";
import { Product } from "@/types/products";
import { Save, Trash2, Image, Sparkles, AlertTriangle, Car, X, Plus } from "lucide-react";

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

  // Metadata states for dynamic dropdowns
  const [metadata, setMetadata] = useState<NavMetadata | null>(null);
  const [dbBrands, setDbBrands] = useState<string[]>([]);
  const [dbMakes, setDbMakes] = useState<string[]>([]);

  // Brand states
  const [brand, setBrand] = useState(product.brand || "");
  const [customBrand, setCustomBrand] = useState("");
  const [isCustomBrand, setIsCustomBrand] = useState(false);

  // Vehicle compatibility states
  const [compatibleWith, setCompatibleWith] = useState<any[]>(product.compatibleWith || []);

  const [compMake, setCompMake] = useState("");
  const [customCompMake, setCustomCompMake] = useState("");
  const [isCustomCompMake, setIsCustomCompMake] = useState(false);

  const [compModel, setCompModel] = useState("");
  const [customCompModel, setCustomCompModel] = useState("");
  const [isCustomCompModel, setIsCustomCompModel] = useState(false);

  const [compYearFrom, setCompYearFrom] = useState("");
  const [compYearTo, setCompYearTo] = useState("");
  const [compBodyType, setCompBodyType] = useState("");
  const [compEngineType, setCompEngineType] = useState("");
  const [compNotes, setCompNotes] = useState("");

  // Product attributes states
  const [attributes, setAttributes] = useState<{attrKey: string; attrValue: string}[]>(
    product.attributes ? product.attributes.map(a => ({ attrKey: a.attrKey, attrValue: a.attrValue })) : []
  );
  const [attrKeyInput, setAttrKeyInput] = useState("");
  const [attrValueInput, setAttrValueInput] = useState("");

  // Load metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const data = await getNavigationMetadata();
        setMetadata(data);
        const uniqueBrands = Array.from(new Set(data.brands.map(b => b.name)));
        setDbBrands(uniqueBrands);
        const uniqueMakes = Array.from(new Set(data.vehicles.map(v => v.make)));
        setDbMakes(uniqueMakes);
      } catch (err) {
        console.error("Failed to load metadata:", err);
      }
    };
    loadMetadata();
  }, []);

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

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setIsCustomBrand(true);
      setBrand("");
    } else {
      setIsCustomBrand(false);
      setBrand(val);
    }
  };

  // Helper to filter models by selected make
  const getModelsForMake = () => {
    if (!metadata || !compMake || isCustomCompMake) return [];
    return Array.from(
      new Set(
        metadata.vehicles
          .filter(v => v.make.toLowerCase() === compMake.toLowerCase())
          .map(v => v.model)
      )
    );
  };

  const handleMakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setIsCustomCompMake(true);
      setCompMake("");
      setIsCustomCompModel(true);
      setCompModel("");
    } else {
      setIsCustomCompMake(false);
      setCompMake(val);
      setIsCustomCompModel(false);
      setCompModel("");
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setIsCustomCompModel(true);
      setCompModel("");
    } else {
      setIsCustomCompModel(false);
      setCompModel(val);
    }
  };

  const handleAddCompatibility = () => {
    const make = isCustomCompMake ? customCompMake.trim() : compMake;
    const model = isCustomCompModel ? customCompModel.trim() : compModel;

    if (!make || !model || !compYearFrom) {
      alert("Please specify Make, Model, and Year From to add compatibility.");
      return;
    }

    const newComp = {
      make,
      model,
      yearFrom: Number(compYearFrom),
      yearTo: compYearTo ? Number(compYearTo) : null,
      bodyType: compBodyType.trim() || null,
      engineType: compEngineType.trim() || null,
      notes: compNotes.trim() || null
    };

    setCompatibleWith([...compatibleWith, newComp]);

    // Reset building inputs
    setCompMake("");
    setCustomCompMake("");
    setIsCustomCompMake(false);
    setCompModel("");
    setCustomCompModel("");
    setIsCustomCompModel(false);
    setCompYearFrom("");
    setCompYearTo("");
    setCompBodyType("");
    setCompEngineType("");
    setCompNotes("");
  };

  const handleRemoveCompatibility = (index: number) => {
    setCompatibleWith(compatibleWith.filter((_, idx) => idx !== index));
  };

  const handleAddAttribute = () => {
    if (!attrKeyInput.trim() || !attrValueInput.trim()) return;
    setAttributes([...attributes, { attrKey: attrKeyInput.trim(), attrValue: attrValueInput.trim() }]);
    setAttrKeyInput("");
    setAttrValueInput("");
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, idx) => idx !== index));
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
        brand: isCustomBrand ? customBrand : brand,
        compatibleWith: compatibleWith,
        attributes: attributes.length > 0 ? attributes : undefined
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

          {/* Brand Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="brand" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Brand
              </label>
              <select
                id="brand"
                value={isCustomBrand ? "CUSTOM" : brand}
                onChange={handleBrandChange}
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground cursor-pointer"
              >
                <option value="">Select Brand</option>
                {dbBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="CUSTOM">+ Add Custom Brand</option>
              </select>
            </div>

            {isCustomBrand && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <label htmlFor="customBrand" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Custom Brand Name <span className="text-destructive font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="customBrand"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="e.g. Isuzu, GMC, Tata..."
                  className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  required
                />
              </div>
            )}
          </div>

          {/* Specifications / Attributes Builder */}
          <div className="border border-border/80 rounded-2xl p-6 bg-muted/10 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-4.5 text-primary" />
              Product Specifications
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Add key-value pairs for technical specs (e.g. Material: Canvas, Weight: 2kg).
            </p>

            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Specification Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dimensions"
                  value={attrKeyInput}
                  onChange={(e) => setAttrKeyInput(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Value</label>
                <input
                  type="text"
                  placeholder="e.g. 10x10 inches"
                  value={attrValueInput}
                  onChange={(e) => setAttrValueInput(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAttribute();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddAttribute}
                className="gap-1 border-primary/20 text-primary hover:bg-primary/10 h-[34px] px-3"
              >
                <Plus className="size-3.5" />
                Add
              </Button>
            </div>

            {attributes.length > 0 && (
              <div className="mt-4 border border-border/50 rounded-xl overflow-hidden bg-background">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Name</th>
                      <th className="px-3 py-2 text-left font-semibold">Value</th>
                      <th className="px-3 py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {attributes.map((attr, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{attr.attrKey}</td>
                        <td className="px-3 py-2">{attr.attrValue}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveAttribute(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Vehicle Compatibility Builder */}
          <div className="border border-border/80 rounded-2xl p-6 bg-muted/10 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Car className="size-4.5 text-primary" />
              Vehicle Compatibility Mappings
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Link this product to one or more compatible car models.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Make Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Make</label>
                <select
                  value={isCustomCompMake ? "CUSTOM" : compMake}
                  onChange={handleMakeChange}
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="">Select Make</option>
                  {dbMakes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Add Custom Make</option>
                </select>
              </div>

              {/* Custom Make input */}
              {isCustomCompMake && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Custom Make</label>
                  <input
                    type="text"
                    value={customCompMake}
                    onChange={(e) => setCustomCompMake(e.target.value)}
                    placeholder="e.g. Isuzu"
                    className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              )}

              {/* Model Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Model</label>
                <select
                  value={isCustomCompModel ? "CUSTOM" : compModel}
                  onChange={handleModelChange}
                  disabled={!isCustomCompMake && !compMake}
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                >
                  <option value="">Select Model</option>
                  {getModelsForMake().map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Add Custom Model</option>
                </select>
              </div>

              {/* Custom Model input */}
              {isCustomCompModel && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Custom Model</label>
                  <input
                    type="text"
                    value={customCompModel}
                    onChange={(e) => setCustomCompModel(e.target.value)}
                    placeholder="e.g. V-Cross"
                    className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              )}

              {/* Year From */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Year From</label>
                <input
                  type="number"
                  value={compYearFrom}
                  onChange={(e) => setCompYearFrom(e.target.value)}
                  placeholder="e.g. 2018"
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Year To */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Year To (Optional)</label>
                <input
                  type="number"
                  value={compYearTo}
                  onChange={(e) => setCompYearTo(e.target.value)}
                  placeholder="e.g. 2024"
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Body Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Body Type (Optional)</label>
                <input
                  type="text"
                  value={compBodyType}
                  onChange={(e) => setCompBodyType(e.target.value)}
                  placeholder="e.g. SUV, Pickup"
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Engine Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Engine Type (Optional)</label>
                <input
                  type="text"
                  value={compEngineType}
                  onChange={(e) => setCompEngineType(e.target.value)}
                  placeholder="e.g. 2.5L Diesel"
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
            </div>

            {/* Compatibility Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes (Optional)</label>
              <input
                type="text"
                value={compNotes}
                onChange={(e) => setCompNotes(e.target.value)}
                placeholder="e.g. Only fits manual transmission models"
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddCompatibility}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg border border-primary/20 transition-all cursor-pointer"
              >
                <Plus className="size-3.5" />
                Add Compatibility tag
              </button>
            </div>

            {/* Display Tags */}
            {compatibleWith.length > 0 && (
              <div className="pt-3 border-t border-border/60">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Active Compatibility Tags</label>
                <div className="flex flex-wrap gap-2">
                  {compatibleWith.map((c, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1.5 bg-background border border-border rounded-lg pl-3 pr-2 py-1 text-xs font-semibold shadow-sm text-foreground"
                    >
                      <span>{c.make} {c.model} ({c.yearFrom}{c.yearTo ? `-${c.yearTo}` : "+"})</span>
                      {c.notes && <span className="text-[10px] text-muted-foreground italic">({c.notes})</span>}
                      <button
                        type="button"
                        onClick={() => handleRemoveCompatibility(index)}
                        className="text-muted-foreground hover:text-destructive p-0.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
