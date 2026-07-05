"use client";

import { useEffect, useRef, useState } from "react";
import { Package, Users, Award, Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

interface StatItem {
  icon: React.ElementType;
  endValue: number;
  suffix: string;
  label: string;
  prefix?: string;
}

const stats: StatItem[] = [
  { icon: Package, endValue: 500, suffix: "+", label: "Products Available" },
  { icon: Users, endValue: 10000, suffix: "+", label: "Happy Customers" },
  { icon: Award, endValue: 50, suffix: "+", label: "Premium Brands" },
  {
    icon: Star,
    endValue: 4.8,
    suffix: "★",
    label: "Average Rating",
    prefix: "",
  },
];

function AnimatedCounter({
  endValue,
  suffix,
  prefix = "",
  duration = 2000,
  isVisible,
}: {
  endValue: number;
  suffix: string;
  prefix?: string;
  duration?: number;
  isVisible: boolean;
}) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const isDecimal = endValue % 1 !== 0;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * endValue;

      setCount(
        isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current)
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isVisible, endValue, duration]);

  const displayValue =
    endValue % 1 !== 0 ? count.toFixed(1) : count.toLocaleString("en-IN");

  return (
    <span className="tabular-nums">
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

export default function StatsCounter() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-20 sm:py-28 overflow-hidden"
    >
      {/* Background texture image */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "url(/images/backgrounds/stats_bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/80" />

      {/* Decorative rotating rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div
          className="size-[500px] rounded-full border border-primary/5 animate-counter-spin"
          style={{ borderStyle: "dashed" }}
        />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div
          className="size-[700px] rounded-full border border-primary/[0.03] animate-counter-spin-reverse"
          style={{ borderStyle: "dashed" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Trusted by Enthusiasts
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-md mx-auto">
              Numbers that speak for our commitment to quality and community.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <ScrollReveal key={stat.label} delay={index * 150} direction="up" scale>
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Icon with pulse ring */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-primary/15 animate-pulse-ring" />
                  <div className="relative size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <stat.icon className="size-7" />
                  </div>
                </div>

                {/* Animated number */}
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight">
                  <AnimatedCounter
                    endValue={stat.endValue}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                    isVisible={isVisible}
                  />
                </span>

                {/* Label */}
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>

                {/* Gradient divider */}
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
