import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Us",
  description:
    "Who we are and how we build. Off-road parts engineered in-house for real terrain, tested well past the warranty.",
  path: "/about",
});

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            About MerchStore
          </h1>
          <div className="prose dark:prose-invert text-muted-foreground space-y-6">
            <p className="text-lg leading-relaxed">
              Welcome to MerchStore, the ultimate destination for premium car styling accessories and lifestyle merchandise. 
              We are passionate about design, quality, and car culture.
            </p>
            <p className="leading-relaxed">
              Every single product in our catalog is custom-designed, rigorously tested, and made to last. From high-grade vinyl decals 
              to premium streetwear-style apparel, we aim to bridge the gap between quality engineering and modern aesthetic style.
            </p>
            <div className="border-l-4 border-primary pl-6 my-8 italic text-foreground">
              "We don't just sell merch; we build accessories that tell your story."
            </div>
            <p className="leading-relaxed">
              Thank you for being part of our journey. Stay tuned for our seasonal limited drops!
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
