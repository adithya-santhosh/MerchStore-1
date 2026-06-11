"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createProduct } from "@/lib/api";
import { PlusCircle, Image, Sparkles } from "lucide-react";


export default function ProductForm() {
    const [name, setName] = useState("");
    const [description, setDescription] =
    useState("");

    const [price, setPrice] =
    useState("");

    const [category, setCategory] =
    useState("");

    const [ImageURL, setImageURL] =
    useState("");

  // Prevent default submit behavior
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await createProduct({
            name, description, price :Number(price), category, ImageURL
        });
        alert ("Product Created");
    }
    catch (error){
        console.error(error);
    }
    
  };

  return (
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
            onChange={(e)=>setName(e.target.value)}
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
              onChange={(e)=>setPrice(e.target.value)}
              placeholder="e.g. 1200"
              className="w-full rounded-xl border border-input bg-background/50 pl-8 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              required
            />
          </div>
        </div>

      </div>

      {/* Category Selection Dropdown */}
      <div className="space-y-2">
        <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Category
        </label>
        <select
          id="category"
          className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground cursor-pointer"
          required
        >
          <option value="">Select Category</option>

            <option value="Recovery Gear">
            Recovery Gear
            </option>

            <option value="Lighting & Electrical">
            Lighting & Electrical
            </option>

            <option value="Armor & Protection">
            Armor & Protection
            </option>

            <option value="Merchandise">
            Merchandise
            </option>

            <option value="Apparel">
            Apparel
            </option>
        </select>
      </div>

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
          onChange={(e)=>setImageURL(e.target.value)}
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
          onChange={(e)=>setDescription(e.target.value)}
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
  );
}