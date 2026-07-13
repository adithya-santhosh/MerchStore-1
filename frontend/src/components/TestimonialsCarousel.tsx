"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import ScrollReveal from "@/components/ScrollReveal";

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  quote: string;
  product: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Rahul Mehta",
    location: "Mumbai, MH",
    rating: 5,
    quote:
      "The Profender suspension kit transformed my Thar. Buttery smooth on highways and absolutely beast-mode off-road. Worth every rupee.",
    product: "Profender 2″ Suspension Kit",
  },
  {
    name: "Ananya Sharma",
    location: "Bengaluru, KA",
    rating: 5,
    quote:
      "Ordered the LED light bar for a Ladakh trip. The build quality is insane — survived 15 days of freezing temps and river crossings without a hiccup.",
    product: "Dual-Row 40″ LED Light Bar",
  },
  {
    name: "Vikram Singh",
    location: "Jaipur, RJ",
    rating: 5,
    quote:
      "Shipping was incredibly fast. The bull bar bumper fit perfectly on my Jimny — looks like it came from the factory. Amazing customer support too.",
    product: "Heavy-Duty Steel Bull Bar",
  },
  {
    name: "Priya Nair",
    location: "Kochi, KL",
    rating: 4,
    quote:
      "Got the rooftop tent for weekend camping. Setup is dead simple and the mattress is surprisingly comfortable. My kids absolutely love it.",
    product: "Hard-Shell Rooftop Tent",
  },
  {
    name: "Arjun Kapoor",
    location: "Delhi, DL",
    rating: 5,
    quote:
      "Been buying merch from here for 6 months. The quality of the caps and keychains is premium — everyone at our car meets asks where I got them.",
    product: "MerchStore Apparel Collection",
  },
  {
    name: "Deepika Reddy",
    location: "Hyderabad, TS",
    rating: 5,
    quote:
      "The modular roof rack is a game-changer. Took my family on a 2000km road trip with all our gear mounted perfectly. Sturdy and rattle-free.",
    product: "Modular Low-Profile Roof Rack",
  },
];

const AUTO_PLAY_MS = 5000;

export default function TestimonialsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const count = testimonials.length;

  const goTo = useCallback(
    (index: number, dir?: "left" | "right") => {
      setDirection(dir || (index > activeIndex ? "right" : "left"));
      setActiveIndex(((index % count) + count) % count);
    },
    [count, activeIndex]
  );

  const goNext = useCallback(
    () => goTo(activeIndex + 1, "right"),
    [activeIndex, goTo]
  );
  const goPrev = useCallback(
    () => goTo(activeIndex - 1, "left"),
    [activeIndex, goTo]
  );

  useEffect(() => {
    if (isPaused || count <= 1) return;
    const timer = setInterval(() => {
      setDirection("right");
      setActiveIndex((prev) => (prev + 1) % count);
    }, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused, count]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("");

  // Show 3 cards on desktop
  const getVisibleIndices = () => {
    const indices = [];
    for (let i = 0; i < Math.min(3, count); i++) {
      indices.push((activeIndex + i) % count);
    }
    return indices;
  };

  const visibleIndices = getVisibleIndices();

  return (
    <section
      className="w-full bg-gradient-to-b from-background to-card/20 py-20 sm:py-28 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="text-center space-y-4 mb-14 sm:mb-18">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase mx-auto">
              <Star className="size-3.5" />
              CUSTOMER REVIEWS
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
              What Our Customers Say
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              Real reviews from real enthusiasts who trust MerchStore for
              their automotive lifestyle gear.
            </p>
          </div>
        </ScrollReveal>

        {/* Cards */}
        <ScrollReveal direction="up" delay={200}>
          <div className="relative">
            {/* Desktop: 3-card view */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
              {visibleIndices.map((idx, position) => {
                const testimonial = testimonials[idx];
                return (
                  <div
                    key={`${idx}-${activeIndex}`}
                    className={cn(
                      "relative p-6 lg:p-8 rounded-2xl glass-card transition-all duration-500",
                      position === 0
                        ? "border-primary/30 shadow-lg shadow-primary/5"
                        : "hover:border-primary/20"
                    )}
                    style={{
                      animation: `slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${
                        position * 100
                      }ms forwards`,
                    }}
                  >
                    {/* Quote icon */}
                    <Quote className="size-8 text-primary/10 absolute top-4 right-4" />

                    {/* Stars with shimmer effect */}
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-4 transition-all duration-300",
                            i < testimonial.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          )}
                          style={{
                            animationDelay: `${i * 100}ms`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Quote text */}
                    <p className="text-sm text-foreground/90 leading-relaxed mb-6 line-clamp-4">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>

                    {/* Product purchased */}
                    <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-4">
                      Purchased: {testimonial.product}
                    </p>

                    {/* Author with gradient avatar ring */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                      <div className="relative">
                        {/* Animated gradient ring */}
                        <div
                          className="absolute -inset-[2px] rounded-full animate-counter-spin"
                          style={{
                            background:
                              "conic-gradient(oklch(0.63 0.25 24), oklch(0.5 0.2 40), oklch(0.63 0.25 24), transparent)",
                          }}
                        />
                        <div className="relative size-10 rounded-full bg-card flex items-center justify-center text-primary text-xs font-black">
                          {getInitials(testimonial.name)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {testimonial.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {testimonial.location}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile: Single card view */}
            <div className="md:hidden">
              {(() => {
                const testimonial = testimonials[activeIndex];
                return (
                  <div
                    key={activeIndex}
                    className="relative p-6 rounded-2xl glass-card border-primary/30 shadow-lg shadow-primary/5"
                    style={{
                      animation:
                        "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    }}
                  >
                    <Quote className="size-8 text-primary/10 absolute top-4 right-4" />
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-4",
                            i < testimonial.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed mb-6">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-4">
                      Purchased: {testimonial.product}
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                      <div className="relative">
                        <div
                          className="absolute -inset-[2px] rounded-full animate-counter-spin"
                          style={{
                            background:
                              "conic-gradient(oklch(0.63 0.25 24), oklch(0.5 0.2 40), oklch(0.63 0.25 24), transparent)",
                          }}
                        />
                        <div className="relative size-10 rounded-full bg-card flex items-center justify-center text-primary text-xs font-black">
                          {getInitials(testimonial.name)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {testimonial.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {testimonial.location}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={goPrev}
                className="size-10 rounded-full border border-border bg-card/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300 cursor-pointer shadow-sm"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="size-5" />
              </button>

              {/* Dot indicators */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goTo(index)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-500 cursor-pointer",
                      index === activeIndex
                        ? "w-8 bg-primary"
                        : "w-2 bg-foreground/15 hover:bg-foreground/30"
                    )}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={goNext}
                className="size-10 rounded-full border border-border bg-card/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300 cursor-pointer shadow-sm"
                aria-label="Next testimonial"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
