import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Avoid legacy `/products/foo.jpg` paths colliding with `/products/[id]`. */
export function getProductImageSrc(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  if (url.startsWith("/products/")) {
    return url.replace("/products/", "/images/products/")
  }
  return url
}

/**
 * Narrow a `callbackUrl` query param down to a path on this site before it is
 * handed to `router.push()`, which would happily follow an off-site or
 * `javascript:` URL. Anything that isn't a plain in-site path falls back.
 */
export function safeCallbackUrl(
  raw: string | null | undefined,
  fallback: string = "/"
): string {
  if (!raw) return fallback
  // Must be "/" or "/" followed by something that is neither "/" nor "\" —
  // that rules out "//evil.com" and "/\evil.com" (both protocol-relative once
  // the browser normalises them), as well as "https://…" and "javascript:…".
  if (!/^\/($|[^/\\])/.test(raw)) return fallback
  return raw
}

// frontend/src/utils/upload.ts

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "diz4hpigr"; // Replace with your Cloud Name
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "merch_store_preset";       // Replace with your Unsigned Preset Name

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload image to Cloudinary");
    }

    const data = await response.json();
    return data.secure_url; // Returns the public HTTPS link (e.g., https://res.cloudinary.com/...)
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
