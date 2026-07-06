import Link from "next/link";
import { Sparkles, MessageSquare, ShieldCheck } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/30 bg-card/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
        <ScrollReveal direction="up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12">
            {/* Brand Info */}
            <div className="space-y-4 md:col-span-2">
              <Link href="/" className="flex items-center gap-2 group w-max">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Sparkles className="size-4" />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  Merch
                  <span className="text-primary font-black">Store</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Premium automotive lifestyle gear and limited merchandise
                drops. Crafted for collectors, driven by enthusiasts.
              </p>
              {/* Social Links with hover glow */}
              <div className="flex gap-3 pt-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram page"
                  className="size-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-[#E4405F] hover:border-[#E4405F]/40 hover:bg-[#E4405F]/5 hover:shadow-lg hover:shadow-[#E4405F]/10 transition-all duration-300 cursor-pointer"
                >
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line
                      x1="17.5"
                      y1="6.5"
                      x2="17.51"
                      y2="6.5"
                    ></line>
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Twitter page"
                  className="size-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-[#1DA1F2] hover:border-[#1DA1F2]/40 hover:bg-[#1DA1F2]/5 hover:shadow-lg hover:shadow-[#1DA1F2]/10 transition-all duration-300 cursor-pointer"
                >
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Discord server"
                  className="size-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-[#5865F2] hover:border-[#5865F2]/40 hover:bg-[#5865F2]/5 hover:shadow-lg hover:shadow-[#5865F2]/10 transition-all duration-300 cursor-pointer"
                >
                  <MessageSquare className="size-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-5">
                Shop
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/products/car-accessories"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer link-underline inline-block"
                  >
                    Car Accessories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products/merchandise"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer link-underline inline-block"
                  >
                    Merchandise
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer link-underline inline-block"
                  >
                    All Products
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-5">
                Support
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer link-underline inline-block"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer link-underline inline-block"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer link-underline inline-block"
                  >
                    FAQs & Delivery
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </ScrollReveal>

        {/* Footer Bottom */}
        <ScrollReveal direction="up" delay={200}>
          <div className="pt-8 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {currentYear} MerchStore. All rights reserved. Designed
              with precision.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-500" />
              Secure Razorpay Checkout
            </div>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}