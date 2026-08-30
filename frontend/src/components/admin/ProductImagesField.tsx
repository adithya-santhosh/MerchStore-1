"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import { getProductImageSrc, uploadToCloudinary } from "@/lib/utils";
import { MAX_PRODUCT_IMAGES, normaliseProductImages } from "@/lib/product-images";
import type { ProductImageDraft } from "@/types/products";

interface ProductImagesFieldProps {
  images: ProductImageDraft[];
  onChange: (images: ProductImageDraft[]) => void;
  max?: number;
}

export default function ProductImagesField({
  images,
  onChange,
  max = MAX_PRODUCT_IMAGES,
}: ProductImagesFieldProps) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");

  const remaining = max - images.length;
  const busy = progress !== null;

  const append = (urls: string[]) =>
    onChange(
      normaliseProductImages([
        ...images,
        ...urls.map((imageUrl) => ({
          imageUrl,
          altText: null,
          isPrimary: false,
          sortOrder: 0,
        })),
      ])
    );

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // Reset the input so re-picking the same file after a removal still fires.
    e.target.value = "";
    if (files.length === 0) return;

    setError(null);

    if (files.length > remaining) {
      setError(
        remaining === 0
          ? `This product already has the maximum of ${max} images.`
          : `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added, but ${files.length} were selected.`
      );
      return;
    }

    setProgress({ done: 0, total: files.length });

    // Uploaded one at a time rather than in parallel: it keeps the progress
    // count truthful, and a burst of parallel uploads against an unsigned
    // preset is what Cloudinary rate-limits first.
    const uploaded: string[] = [];
    let failed = 0;
    for (const file of files) {
      try {
        uploaded.push(await uploadToCloudinary(file));
      } catch {
        failed += 1;
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }

    setProgress(null);
    // Keep whatever succeeded rather than discarding a nine-image upload
    // because the tenth failed.
    if (uploaded.length > 0) append(uploaded);
    if (failed > 0) {
      setError(
        `${failed} of ${files.length} upload${files.length === 1 ? "" : "s"} failed. Check that the Cloudinary preset is unsigned, then retry.`
      );
    }
  };

  const addUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//.test(trimmed) && !trimmed.startsWith("/")) {
      setError("Enter an absolute http(s) URL or a root-relative path.");
      return;
    }
    if (remaining <= 0) {
      setError(`This product already has the maximum of ${max} images.`);
      return;
    }
    setError(null);
    append([trimmed]);
    setUrlDraft("");
  };

  const removeAt = (idx: number) =>
    onChange(normaliseProductImages(images.filter((_, i) => i !== idx)));

  const makePrimary = (idx: number) =>
    onChange(normaliseProductImages(images.map((img, i) => ({ ...img, isPrimary: i === idx }))));

  const move = (idx: number, delta: number) => {
    const target = idx + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(normaliseProductImages(next));
  };

  const setAlt = (idx: number, altText: string) =>
    onChange(images.map((img, i) => (i === idx ? { ...img, altText } : img)));

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ImagePlus className="size-3.5 text-muted-foreground" />
          Product Images
        </span>
        <span className="text-xs text-muted-foreground">
          {images.length} of {max}
        </span>
      </div>

      {/* Upload files, or paste a URL for an image already hosted elsewhere. */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // This field sits inside the product form, so Enter must add an
                // image rather than submit a half-filled product.
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="Paste an image URL..."
            aria-label="Image URL"
            className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={busy || !urlDraft.trim()}
            className="rounded-xl border border-input bg-background/50 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary-bright hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Add
          </button>
        </div>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            multiple
            id="product-image-files"
            onChange={handleFiles}
            className="hidden"
            disabled={busy || remaining <= 0}
          />
          <label
            htmlFor="product-image-files"
            className={`flex h-full min-h-[46px] items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-background/50 px-4 py-2 text-sm font-semibold transition-all text-muted-foreground hover:border-primary hover:text-primary-bright ${
              busy || remaining <= 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {progress ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading {progress.done + 1} of {progress.total}...
              </>
            ) : (
              <>
                <ImagePlus className="size-4" />
                Upload Files
              </>
            )}
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No images yet. The first image you add becomes the primary one shown in
          listings and search results.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={`${idx}-${img.imageUrl}`}
                className="relative rounded-2xl border border-border/80 bg-card/40 overflow-hidden"
              >
                <div className="aspect-square w-full bg-background/40 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProductImageSrc(img.imageUrl) ?? img.imageUrl}
                    alt={img.altText || `Product image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {img.isPrimary && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
                    <Star className="size-2.5 fill-current" />
                    Primary
                  </span>
                )}

                <div className="flex items-center justify-between gap-1 p-1.5 border-t border-border/60 bg-background/60">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      title="Move earlier"
                      aria-label={`Move image ${idx + 1} earlier`}
                      className="p-1 rounded-md text-muted-foreground hover:text-primary-bright hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === images.length - 1}
                      title="Move later"
                      aria-label={`Move image ${idx + 1} later`}
                      className="p-1 rounded-md text-muted-foreground hover:text-primary-bright hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => makePrimary(idx)}
                      disabled={img.isPrimary}
                      title={img.isPrimary ? "This is the primary image" : "Make primary"}
                      aria-label={`Make image ${idx + 1} the primary image`}
                      className="p-1 rounded-md text-muted-foreground hover:text-primary-bright hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Star className={`size-3.5 ${img.isPrimary ? "fill-current" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAt(idx)}
                      title="Remove image"
                      aria-label={`Remove image ${idx + 1}`}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={img.altText ?? ""}
                  onChange={(e) => setAlt(idx, e.target.value)}
                  placeholder="Alt text"
                  aria-label={`Alt text for image ${idx + 1}`}
                  className="w-full border-t border-border/60 bg-transparent px-2.5 py-2 text-xs outline-none focus:bg-background/60 transition-colors text-foreground placeholder:text-muted-foreground"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            The primary image is used in listings, the cart and order emails. The
            order here is the order shoppers scroll through on the product page.
          </p>
        </>
      )}
    </div>
  );
}
