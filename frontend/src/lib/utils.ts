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
