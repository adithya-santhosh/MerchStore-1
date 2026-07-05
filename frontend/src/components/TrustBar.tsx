"use client";

import { useState, useCallback } from "react";
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

interface TiltState {
  rotateX: number;
  rotateY: number;
}

function TrustCard({
  item,
  index,
}: {
  item: (typeof trustItems)[0];
  index: number;
}) {
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;
      setTilt({ rotateX, rotateY });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  return (
    <ScrollReveal delay={index * 120} direction="up" scale>
      <div
        className="perspective-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="glass-card rounded-2xl p-5 sm:p-6 flex items-start gap-4 cursor-default group hover:border-primary/20 transition-colors duration-300"
          style={{
            transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transition:
              "transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)",
          }}
        >
          <div className="relative shrink-0">
            {/* Pulse ring behind icon */}
            <div className="absolute inset-0 rounded-xl bg-primary/20 animate-pulse-ring" />
            <div className="relative size-11 sm:size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <item.icon className="size-5 sm:size-6 transition-transform duration-500 group-hover:scale-110" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              {item.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              {item.subtitle}
            </p>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}

export default function TrustBar() {
  return (
    <section className="w-full border-y border-border/30 bg-card/10 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {trustItems.map((item, index) => (
            <TrustCard key={item.title} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
