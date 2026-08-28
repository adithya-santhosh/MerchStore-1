import { describe, it, expect } from "vitest";
import type { Metadata } from "next";
import { buildMetadata, formatPrice } from "@/lib/seo";
import { siteUrl, siteConfig } from "@/lib/site-config";

const base = { title: "Roof Racks", description: "Load-rated roof racks." };

// Next's Metadata types model every accepted shape of these fields (string,
// URL, array, object…). These readers narrow to the one shape buildMetadata
// actually emits, so the assertions below stay readable.
const ogImages = (meta: Metadata) =>
  (meta.openGraph?.images ?? undefined) as { url: string; alt?: string }[] | undefined;

const twitter = (meta: Metadata) =>
  meta.twitter as { card?: string; title?: string; images?: unknown } | undefined;

const openGraph = (meta: Metadata) =>
  meta.openGraph as { siteName?: string; locale?: string; url?: string } | undefined;

describe("buildMetadata — canonical URLs", () => {
  it("uses the bare site URL for the home page rather than a trailing slash", () => {
    const meta = buildMetadata({ ...base, path: "/" });

    expect(meta.alternates?.canonical).toBe(siteUrl);
  });

  it("appends the route path for any other page", () => {
    const meta = buildMetadata({ ...base, path: "/products/12" });

    expect(meta.alternates?.canonical).toBe(`${siteUrl}/products/12`);
  });

  it("defaults to the home page when no path is given", () => {
    const meta = buildMetadata(base);

    expect(meta.alternates?.canonical).toBe(siteUrl);
  });

  it("points Open Graph at the same canonical URL", () => {
    const meta = buildMetadata({ ...base, path: "/products/12" });

    expect(meta.openGraph?.url).toBe(`${siteUrl}/products/12`);
  });
});

describe("buildMetadata — link previews", () => {
  it("carries the title and description into both Open Graph and Twitter", () => {
    const meta = buildMetadata(base);

    expect(meta.openGraph?.title).toBe("Roof Racks");
    expect(meta.openGraph?.description).toBe("Load-rated roof racks.");
    expect(twitter(meta)?.title).toBe("Roof Racks");
  });

  it("makes a root-relative image absolute, since crawlers require it", () => {
    const meta = buildMetadata({ ...base, image: "/images/rack.jpg" });

    expect(ogImages(meta)?.[0]?.url).toBe(`${siteUrl}/images/rack.jpg`);
  });

  it("leaves an already-absolute image alone", () => {
    const meta = buildMetadata({ ...base, image: "https://cdn.example.com/rack.jpg" });

    expect(ogImages(meta)?.[0]?.url).toBe("https://cdn.example.com/rack.jpg");
  });

  it("omits images entirely when none is supplied", () => {
    const meta = buildMetadata(base);

    expect(meta.openGraph?.images).toBeUndefined();
    expect(twitter(meta)?.images).toBeUndefined();
  });

  it("treats a null image the same as no image", () => {
    const meta = buildMetadata({ ...base, image: null });

    expect(meta.openGraph?.images).toBeUndefined();
  });

  it("uses the large card only when there is an image to fill it", () => {
    const withImage = buildMetadata({ ...base, image: "/images/rack.jpg" });
    const withoutImage = buildMetadata(base);

    expect(twitter(withImage)?.card).toBe("summary_large_image");
    expect(twitter(withoutImage)?.card).toBe("summary");
  });

  it("uses the title as the image alt text", () => {
    const meta = buildMetadata({ ...base, image: "/images/rack.jpg" });

    expect(ogImages(meta)?.[0]?.alt).toBe("Roof Racks");
  });

  it("names the brand and locale so previews read correctly", () => {
    const meta = buildMetadata(base);

    expect(meta.openGraph?.siteName).toBe(siteConfig.brandName);
    expect(openGraph(meta)?.locale).toBe("en_IN");
  });
});

describe("buildMetadata — indexing", () => {
  it("stays indexable by default", () => {
    const meta = buildMetadata(base);

    expect(meta.robots).toBeUndefined();
  });

  it("marks a page noindex, nofollow when asked", () => {
    const meta = buildMetadata({ ...base, noIndex: true });

    expect(meta.robots).toEqual({ index: false, follow: false });
  });
});

describe("siteUrl", () => {
  it("never emits the unreplaced placeholder domain", () => {
    // A canonical tag pointing at "[https://yourdomain.com]" is worse than none.
    expect(siteUrl).not.toContain("[");
    expect(siteUrl).not.toContain("]");
  });

  it("carries no trailing slash, so path concatenation stays clean", () => {
    expect(siteUrl.endsWith("/")).toBe(false);
  });

  it("is an absolute http(s) URL", () => {
    expect(siteUrl).toMatch(/^https?:\/\//);
  });
});

describe("formatPrice", () => {
  it("prefixes the rupee symbol", () => {
    expect(formatPrice(999)).toBe("₹999");
  });

  it("groups digits the Indian way", () => {
    // 1,50,000 — not 150,000.
    expect(formatPrice(150000)).toBe("₹1,50,000");
  });

  it("formats zero without breaking", () => {
    expect(formatPrice(0)).toBe("₹0");
  });

  it("accepts a numeric string without printing NaN", () => {
    expect(formatPrice("1499" as unknown as number)).toBe("₹1,499");
  });
});
