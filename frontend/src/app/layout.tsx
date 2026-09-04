import type { Metadata } from "next";
import { Inter, Oswald, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import { WishlistProvider } from "@/hooks/useWishlist";
import { siteConfig, siteUrl } from "@/lib/site-config";
import SmoothScroll from "@/components/SmoothScroll";

// Clean grotesk body copy...
const bodySans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// ...paired with a bold condensed display face for headlines, matching
// the rugged/industrial "Rust & Steel" direction.
const headingFont = Oswald({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Lets every page express canonical/OG URLs as plain paths.
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.brandName} — Off-Road Parts & Automotive Merchandise`,
    // Pages set just their own title; the brand is appended automatically.
    template: `%s | ${siteConfig.brandName}`,
  },
  description:
    "Armor, lighting, recovery and overland gear engineered for real terrain — plus limited-run automotive merchandise. Free delivery across India.",
  applicationName: siteConfig.brandName,
  openGraph: {
    type: "website",
    siteName: siteConfig.brandName,
    locale: "en_IN",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodySans.variable} ${headingFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SmoothScroll>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SmoothScroll>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}


