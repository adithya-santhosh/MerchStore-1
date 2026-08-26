import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or transactional areas: no SEO value, and we don't want
        // crawlers wandering into account or checkout flows.
        disallow: [
          "/admin",
          "/vendor",
          "/dashboard",
          "/checkout",
          "/cart",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
