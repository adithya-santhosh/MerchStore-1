"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Animation direction */
  direction?: "up" | "down" | "left" | "right";
  /** Delay in ms before animation starts */
  delay?: number;
  /** Intersection threshold (0-1) */
  threshold?: number;
  /** Duration of the animation in ms */
  duration?: number;
  /** Include a subtle scale effect on reveal */
  scale?: boolean;
  /** Speed preset — overrides duration */
  speed?: "slow" | "normal" | "fast";
  /** Whether to re-trigger animation when scrolling back */
  once?: boolean;
}

const speedMap = { slow: 1000, normal: 700, fast: 400 };

export default function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  threshold = 0.15,
  duration,
  scale = false,
  speed = "normal",
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const resolvedDuration = duration ?? speedMap[speed];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const translateMap = {
    up: "translateY(40px)",
    down: "translateY(-40px)",
    left: "translateX(40px)",
    right: "translateX(-40px)",
  };

  const scaleTransform = scale ? " scale(0.95)" : "";

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translate(0, 0) scale(1)"
          : `${translateMap[direction]}${scaleTransform}`,
        transition: `opacity ${resolvedDuration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${resolvedDuration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
