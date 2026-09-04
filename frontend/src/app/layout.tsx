import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import { WishlistProvider } from "@/hooks/useWishlist";
import { siteConfig, siteUrl } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Rendered as JSX rather than the metadata API's icons/etc fields
          because there's no dedicated preconnect field there — Next
          hoists any <link>/<meta> rendered in a layout into <head>
          automatically, so this doesn't need its own <head> element. */}
      <link rel="preconnect" href="https://images.unsplash.com" />
      <link rel="preconnect" href="https://res.cloudinary.com" />
      <link rel="preconnect" href="https://checkout.razorpay.com" />
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}


