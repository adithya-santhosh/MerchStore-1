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
