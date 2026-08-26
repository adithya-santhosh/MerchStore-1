"use client";

import { Truck, ShieldCheck, RefreshCw, CreditCard } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const trustItems = [
  {
    icon: Truck,
    title: "Free Shipping",
    subtitle: "On orders above ₹5,000",
  },
  {
    icon: ShieldCheck,
    title: "1-Year Warranty",
    subtitle: "Guaranteed quality",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    subtitle: "Within 30 days",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    subtitle: "Powered by Razorpay",
  },
];

export default function TrustBar() {
  return (
    <section className="w-full border-y border-border/40 bg-card/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trustItems.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 100} direction="up">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="shrink-0 size-10 sm:size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <item.icon className="size-5 sm:size-6" />
                </div>
                <div className="space-y-0.5">
                  {/* h2, not h3: these sit directly under the hero's h1, and
                      the next section is an h2 — an h3 here skipped a level. */}
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    {item.title}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
