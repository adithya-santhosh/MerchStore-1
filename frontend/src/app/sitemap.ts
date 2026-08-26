import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";
import { getProducts } from "@/lib/api";

/**
 * Generated at request time so newly added products appear without a redeploy.
 *
 * If the API is unreachable we still emit the static routes rather than failing
 * the whole sitemap — a partial sitemap is far better than a 500, which would
 * make Search Console drop the lot.
 */
export const revalidate = 3600; // refresh hourly

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/products", priority: 0.9, changeFrequency: "daily" },
  { path: "/products/car-accessories", priority: 0.8, changeFrequency: "weekly" },
  { path: "/products/car-accessories/armor-protection", priority: 0.7, changeFrequency: "weekly" },
  { path: "/products/car-accessories/camping-overland", priority: 0.7, changeFrequency: "weekly" },
  { path: "/products/car-accessories/lighting-electrical", priority: 0.7, changeFrequency: "weekly" },
  { path: "/products/car-accessories/recovery-gear", priority: 0.7, changeFrequency: "weekly" },
  { path: "/products/car-accessories/storage-racks", priority: 0.7, changeFrequency: "weekly" },
  { path: "/products/car-accessories/suspension-wheels", priority: 0.7, changeFrequency: "weekly" },
  { path: "/products/merchandise", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/rewards", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/shipping-policy", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path === "/" ? "" : route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productEntries = products
      .filter((p) => p.isActive !== false)
      .map((p) => ({
        url: `${siteUrl}/products/${p.id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    // API unavailable at build/request time — ship the static routes anyway.
  }

  return [...staticEntries, ...productEntries];
}
