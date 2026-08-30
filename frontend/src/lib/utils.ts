import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getUploadSignature } from "@/lib/api"

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

/**
 * Uploads straight from the browser to Cloudinary — the file bytes never pass
 * through our own server — but the upload itself has to be signed by our
 * backend first. There used to be no such step: any visitor could read the
 * cloud name and unsigned preset out of this bundle and POST arbitrary files
 * to it directly, with no login and no format restriction beyond whatever the
 * preset happened to allow. Getting a signature now requires an authenticated
 * admin request, and the signature itself locks in the destination folder and
 * an image-only format whitelist — Cloudinary rejects anything that doesn't
 * match, since altering either would invalidate the signature.
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const { timestamp, signature, apiKey, cloudName, folder, allowedFormats } =
    await getUploadSignature();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("allowed_formats", allowedFormats);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }

  const data = await response.json();
  return data.secure_url; // Returns the public HTTPS link (e.g., https://res.cloudinary.com/...)
};
