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
  { icon: Star, endValue: 4.8, suffix: "★", label: "Average Rating", prefix: "" },
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

      setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isVisible, endValue, duration]);

  const displayValue = endValue % 1 !== 0 ? count.toFixed(1) : count.toLocaleString("en-IN");

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
      className="w-full bg-gradient-to-b from-background via-card/30 to-background py-16 sm:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <ScrollReveal key={stat.label} delay={index * 120} direction="up">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
                  <stat.icon className="size-6" />
                </div>
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
                  <AnimatedCounter
                    endValue={stat.endValue}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                    isVisible={isVisible}
                  />
                </span>
                <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
