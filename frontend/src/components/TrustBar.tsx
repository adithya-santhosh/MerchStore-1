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
    <section className="w-full border-b border-border/40 bg-card/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trustItems.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 100} direction="up">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="shrink-0 size-10 sm:size-11 flex items-center justify-center text-primary border border-primary/25 bg-primary/5">
                  <item.icon className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="font-mono text-[10px] sm:text-[11px] text-muted-foreground tracking-wide">
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
