"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  image: string;
  alt: string;
  title: string;
  subtitle?: string;
  buttonLabel: string;
  href: string;
}

/** Edit slides here — drop images into `public/hero/` (e.g. slide-1.jpg) and update `image` paths. */
export const heroSlides: HeroSlide[] = [
  {
    image: "/hero/Thar-profender-2-suspension-3-rotated.jpg",
    alt: "Thar Profender 2″ Suspension",
    title: "Thar Profender 2″ Suspension",
    subtitle: "Limited merchandise drop — low stock",
    buttonLabel: "View Product",
    href: "/products?category=car-accessories",
  },
  {
    image: "/hero/mahindra-thar-proman-2-lift-kit-5.jpg",
    alt: "Carbon Fiber Air Freshener V2",
    title: "Carbon Fiber Air Freshener V2",
    subtitle: "Premium car accessories",
    buttonLabel: "View Product",
    href: "/products?category=car-accessories",
  },
  {
    image: "/hero/Winch-XPD-Bumper-150x150.png",
    alt: "Decal Track Styling Kit v3",
    title: "Decal Track Styling Kit v3",
    subtitle: "Releasing soon — join the waitlist",
    buttonLabel: "View Product",
    href: "/products",
  },
];

const AUTO_PLAY_MS = 5000;

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slideCount = heroSlides.length;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % slideCount) + slideCount) % slideCount);
    },
    [slideCount]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (isPaused || slideCount <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount);
    }, AUTO_PLAY_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, slideCount]);

  const activeSlide = heroSlides[activeIndex];

  return (
    <section
      className="relative w-full bg-background"
      aria-label="Featured products"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="relative w-full overflow-hidden aspect-[16/9] sm:aspect-[21/9] max-h-[min(72vh,640px)]">
        {/* Slides */}
        {heroSlides.map((slide, index) => (
          <div
            key={slide.title}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            )}
            aria-hidden={index !== activeIndex}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
        ))}

        {/* Copy + CTA for active slide */}
        <div className="absolute inset-0 z-20 flex items-end sm:items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-0 pt-16 sm:pt-0">
            <div
              key={activeSlide.title}
              className="max-w-lg space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                {activeSlide.title}
              </h1>
              {activeSlide.subtitle && (
                <p className="text-base sm:text-lg text-muted-foreground">
                  {activeSlide.subtitle}
                </p>
              )}
              <Button size="lg" className="shadow-lg group cursor-pointer" asChild>
                <Link href={activeSlide.href} className="inline-flex items-center gap-2">
                  {activeSlide.buttonLabel}
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Prev / Next */}
        {slideCount > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 sm:left-6 top-1/2 z-30 -translate-y-1/2 size-10 rounded-full border border-border/80 bg-background/70 backdrop-blur-sm text-foreground hover:bg-background transition-colors cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="size-5 mx-auto" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 sm:right-6 top-1/2 z-30 -translate-y-1/2 size-10 rounded-full border border-border/80 bg-background/70 backdrop-blur-sm text-foreground hover:bg-background transition-colors cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="size-5 mx-auto" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {slideCount > 1 && (
          <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 flex items-center gap-2">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => goTo(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 cursor-pointer",
                  index === activeIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-foreground/30 hover:bg-foreground/50"
                )}
                aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
