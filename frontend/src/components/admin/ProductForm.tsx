"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createProduct, getSubCategories, getNavigationMetadata, NavMetadata, getAllVendors } from "@/lib/api";
import { PlusCircle, Image, Sparkles, Trash2, Car, X, Plus } from "lucide-react";
import { uploadToCloudinary } from "@/lib/utils";
import type { VehicleFitment } from "@/types/products";

export default function ProductForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sku, setSku] = useState("");
  const [stockQty, setStockQty] = useState("0");
  const [weight, setWeight] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [customSubCategory, setCustomSubCategory] = useState("");
  const [ImageURL, setImageURL] = useState("");

  const [isCustom, setIsCustom] = useState(false);
  const [dbSubCategories, setDbSubCategories] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manualSlug, setManualSlug] = useState(false);

  // Metadata states for dynamic dropdowns
  const [metadata, setMetadata] = useState<NavMetadata | null>(null);
  const [dbBrands, setDbBrands] = useState<string[]>([]);
  const [dbMakes, setDbMakes] = useState<string[]>([]);

  // Brand states
  const [brand, setBrand] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [isCustomBrand, setIsCustomBrand] = useState(false);

  // Vehicle compatibility states
  const [compatibleWith, setCompatibleWith] = useState<VehicleFitment[]>([]);

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
  const [attributes, setAttributes] = useState<{attrKey: string; attrValue: string}[]>([]);
  const [attrKeyInput, setAttrKeyInput] = useState("");
  const [attrValueInput, setAttrValueInput] = useState("");

  // Vendor state
  const [vendors, setVendors] = useState<{id: number; companyName: string}[]>([]);
  const [vendorId, setVendorId] = useState<number | null>(null);

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
      } catch (e) {
        console.error("Failed to load metadata", e);
      }
    };
    const loadVendors = async () => {
      try {
        const data = await getAllVendors();
        setVendors(data.vendors);
      } catch (e) {
        console.error("Failed to load vendors", e);
      }
    };
    loadMetadata();
    loadVendors();
  }, []);

  // Auto-generate slug from name unless manually edited
  useEffect(() => {
    if (!manualSlug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
    }
  }, [name, manualSlug]);

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
      ? ["Recovery Gear", "Lighting & Electrical", "Armor & Protection", "Camping & Overland", "Storage & Racks", "Suspension & Wheels"]
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setImageURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to upload image to Cloudinary. Please ensure your preset is set to unsigned.");
    } finally {
      setUploading(false);
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
        slug,
        description,
        shortDescription: shortDescription || null,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        costPrice: costPrice ? Number(costPrice) : null,
        sku: sku || null,
        stockQty: Number(stockQty) || 0,
        weight: weight ? Number(weight) : null,
        productType: category === "Car Accessories" ? "part" : "merch",
        isActive,
        isFeatured,
        category,
        subCategory: isCustom ? customSubCategory : subCategory,
        ImageURL: ImageURL || null,
        brand: isCustomBrand ? customBrand : brand,
        compatibleWith: compatibleWith,
        attributes: attributes.length > 0 ? attributes : undefined,
        vendorId: vendorId ?? undefined
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
    setShortDescription("");
    setSlug("");
    setPrice("");
    setCompareAtPrice("");
    setCostPrice("");
    setSku("");
    setStockQty("0");
    setWeight("");
    setIsFeatured(false);
    setIsActive(true);
    setManualSlug(false);
    setCategory("");
    setSubCategory("");
    setCustomSubCategory("");
    setIsCustom(false);
    setImageURL("");
    setBrand("");
    setCustomBrand("");
    setIsCustomBrand(false);
    setCompatibleWith([]);
    setAttributes([]);
    setVendorId(null);
    setShowSuccess(false);
  };

  const currentSub = isCustom ? customSubCategory : subCategory;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 bg-card/40 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        
        {/* Name and Slug Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product Name <span className="text-destructive font-bold">*</span>
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

          {/* Slug Input */}
          <div className="space-y-2">
            <label htmlFor="slug" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              SEO URL Slug <span className="text-destructive font-bold">*</span>
            </label>
            <input
              type="text"
              id="slug"
              value={slug}
              onChange={(e) => {
                setManualSlug(true);
                setSlug(e.target.value);
              }}
              placeholder="e.g. formula-v1-hoodie"
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              required
            />
          </div>
        </div>

        {/* Short Description and SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Short Description */}
          <div className="space-y-2">
            <label htmlFor="shortDescription" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Short Description
            </label>
            <input
              type="text"
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief tagline or summary..."
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
            />
          </div>

          {/* SKU Input */}
          <div className="space-y-2">
            <label htmlFor="sku" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              SKU (Stock Keeping Unit)
            </label>
            <input
              type="text"
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. TS-MERCH-001"
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
            />
          </div>
        </div>

        {/* Pricing Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Price Input */}
          <div className="space-y-2">
            <label htmlFor="price" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Price (₹) <span className="text-destructive font-bold">*</span>
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

          {/* Compare At Price Input */}
          <div className="space-y-2">
            <label htmlFor="compareAtPrice" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Compare At Price (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground select-none">
                ₹
              </span>
              <input
                type="number"
                id="compareAtPrice"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="Original price e.g. 1800"
                className="w-full rounded-xl border border-input bg-background/50 pl-8 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              />
            </div>
          </div>

          {/* Cost Price Input */}
          <div className="space-y-2">
            <label htmlFor="costPrice" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cost Price (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground select-none">
                ₹
              </span>
              <input
                type="number"
                id="costPrice"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="Your buying cost e.g. 600"
                className="w-full rounded-xl border border-input bg-background/50 pl-8 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Inventory & Shipping Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Stock Qty */}
          <div className="space-y-2">
            <label htmlFor="stockQty" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stock Quantity
            </label>
            <input
              type="number"
              id="stockQty"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
            />
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <label htmlFor="weight" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Weight (in kg)
            </label>
            <input
              type="number"
              step="any"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 0.5"
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
            />
          </div>
        </div>

        {/* Primary and Sub-Category Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Primary Category <span className="text-destructive font-bold">*</span>
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
              Sub-Category <span className="text-destructive font-bold">*</span>
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
              Custom Sub-Category Name <span className="text-destructive font-bold">*</span>
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

        {/* Image URL / Upload Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Image className="size-3.5 text-muted-foreground" />
            Product Image
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                id="imageURL"
                value={ImageURL}
                onChange={(e) => setImageURL(e.target.value)}
                placeholder="Paste an image URL or upload a file..."
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              />
            </div>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                id="image-file"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="image-file"
                className={`flex h-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-background/50 px-4 py-2 text-sm font-semibold cursor-pointer hover:border-primary transition-all text-muted-foreground hover:text-primary ${
                  uploading ? "opacity-50 cursor-wait" : ""
                }`}
              >
                {uploading ? "Uploading..." : "Upload File"}
              </label>
            </div>
          </div>
        </div>

        {/* Description Textarea */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Product Description <span className="text-destructive font-bold">*</span>
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

        {/* Active & Featured Toggles */}
        <div className="flex gap-8 items-center bg-background/30 p-4 border border-input/60 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-foreground cursor-pointer select-none">
              Publish (Active)
            </label>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="size-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
            />
            <label htmlFor="isFeatured" className="text-sm font-semibold text-foreground cursor-pointer select-none">
              Feature Product
            </label>
          </div>
        </div>

        {/* Vendor Assignment */}
        {vendors.length > 0 && (
          <div className="space-y-2 bg-background/30 border border-input/60 rounded-2xl p-4">
            <label htmlFor="vendorId" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assign to Vendor / Supplier <span className="text-muted-foreground font-normal normal-case">(optional)</span>
            </label>
            <select
              id="vendorId"
              value={vendorId ?? ""}
              onChange={(e) => setVendorId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
            >
              <option value="">— No vendor (in-house fulfillment) —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.companyName}</option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">The selected vendor will see this product&apos;s orders in their portal.</p>
          </div>
        )}

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
                {shortDescription && <p className="text-xs font-semibold text-foreground/80 line-clamp-1">{shortDescription}</p>}
                <p className="text-xs text-muted-foreground line-clamp-2">{description || "No description provided."}</p>
                <div className="flex gap-2 items-baseline pt-1">
                  <span className="text-sm font-extrabold text-foreground">₹{Number(price).toLocaleString("en-IN")}</span>
                  {compareAtPrice && Number(compareAtPrice) > Number(price) && (
                    <span className="text-xs text-muted-foreground line-through font-normal">₹{Number(compareAtPrice).toLocaleString("en-IN")}</span>
                  )}
                </div>
                {sku && <div className="text-[10px] font-mono text-muted-foreground">SKU: {sku}</div>}
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
                <div className="flex gap-2 items-baseline pt-1">
                  <span className="text-sm font-extrabold text-foreground">₹{Number(price).toLocaleString("en-IN")}</span>
                  {compareAtPrice && Number(compareAtPrice) > Number(price) && (
                    <span className="text-xs text-muted-foreground line-through font-normal">₹{Number(compareAtPrice).toLocaleString("en-IN")}</span>
                  )}
                </div>
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