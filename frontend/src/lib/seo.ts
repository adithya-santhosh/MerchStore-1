import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/lib/site-config";

/**
 * Builds page metadata with sensible Open Graph / Twitter defaults.
 *
 * Why this matters beyond Google: WhatsApp, Instagram and X all read Open Graph
 * tags to render link previews. Without them a shared product link shows as a
 * bare URL with no image, which badly hurts click-through on the channels most
 * small stores actually rely on.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  noIndex = false,
}: {
  title: string;
  description: string;
  /** Route path, e.g. "/products/12". Used for the canonical URL. */
  path?: string;
  /** Absolute or root-relative image URL for the link preview. */
  image?: string | null;
  /** Set for pages that should stay out of search results. */
  noIndex?: boolean;
}): Metadata {
  const url = `${siteUrl}${path === "/" ? "" : path}`;
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : `${siteUrl}${image}`
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.brandName,
      type: "website",
      locale: "en_IN",
      ...(ogImage ? { images: [{ url: ogImage, alt: title }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/** Formats a price for use in meta descriptions. */
export function formatPrice(value: number): string {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}
