"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Cinematic fullscreen hero with:
 * - Background video (primary) with image slideshow fallback
 * - Ken Burns effect on fallback images
 * - Floating particle/ember overlay (CSS-only)
 * - Split-text animated headline
 * - Magnetic CTA buttons
 * - Parallax scroll effect
 * - Inline stats ticker
 */

const HERO_VIDEO = "/hero/tharherovideo.mp4";
const HERO_POSTER = "/hero/Thar-profender-2-suspension-3-rotated.jpg";

const HERO_SLIDES = [
  "/images/hero/hero_desert.png",
  "/images/hero/hero_mountain.png",
  "/images/hero/hero_convoy.png",
];

const KEN_BURNS_CLASSES = [
  "animate-ken-burns-1",
  "animate-ken-burns-2",
  "animate-ken-burns-3",
];

const SLIDE_DURATION = 6000;

// Particle configuration — CSS-only floating embers
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 8,
  duration: Math.random() * 6 + 6,
  opacity: Math.random() * 0.4 + 0.1,
}));

// Inline stats for the hero ticker strip
const heroStats = [
  { value: "500+", label: "Products" },
  { value: "10K+", label: "Customers" },
  { value: "4.8★", label: "Rating" },
  { value: "50+", label: "Brands" },
];

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });

  // Video load detection
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= 3) {
      setVideoLoaded(true);
      return;
    }

    const handleLoaded = () => setVideoLoaded(true);
    video.addEventListener("loadeddata", handleLoaded);
    return () => video.removeEventListener("loadeddata", handleLoaded);
  }, []);

  // Image slideshow auto-advance (only when video hasn't loaded)
  useEffect(() => {
    if (videoLoaded) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [videoLoaded]);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Magnetic button effect
  const handleMagnetic = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.15;
    const deltaY = (e.clientY - centerY) * 0.15;
    setMagneticOffset({ x: deltaX, y: deltaY });
  }, []);

  const resetMagnetic = useCallback(() => {
    setMagneticOffset({ x: 0, y: 0 });
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight - 80,
      behavior: "smooth",
    });
  };

  const parallaxStyle = {
    transform: `translateY(${scrollY * 0.3}px)`,
  };

  const contentParallaxStyle = {
    transform: `translateY(${scrollY * -0.1}px)`,
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[90vh] sm:h-[95vh] min-h-[600px] max-h-[1000px] overflow-hidden bg-background"
      aria-label="Hero"
    >
      {/* ── Background Layer: Video + Image Slideshow ── */}
      <div className="absolute inset-0" style={parallaxStyle}>
        {/* Background video */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster={HERO_POSTER}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1500 ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
          preload="auto"
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>

        {/* Image slideshow fallback (visible when video hasn't loaded) */}
        {!videoLoaded &&
          HERO_SLIDES.map((src, index) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1500 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={src}
                alt=""
                className={`w-full h-full object-cover ${KEN_BURNS_CLASSES[index]}`}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}

        {/* Poster fallback for initial load */}
        {!videoLoaded && currentSlide === 0 && (
          <div
            className="absolute inset-0 bg-cover bg-center animate-ken-burns-1"
            style={{ backgroundImage: `url(${HERO_POSTER})` }}
          />
        )}
      </div>

      {/* ── Gradient Overlays — Cinematic Vignette ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
      <div className="absolute inset-0 bg-background/15 z-10" />
      {/* Vignette edges */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 150px 60px rgba(0,0,0,0.4)",
        }}
      />

      {/* ── Particle / Ember Overlay ── */}
      <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.left,
              bottom: "-10px",
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: `radial-gradient(circle, rgba(220, 50, 47, ${p.opacity}) 0%, transparent 70%)`,
              animation: `particle-drift ${p.duration}s ease-in-out ${p.delay}s infinite`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

      {/* ── Film Grain Overlay ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          animation: "grain 0.5s steps(1) infinite",
        }}
      />

      {/* ── Content Overlay ── */}
      <div
        className="absolute inset-0 z-20 flex items-center"
        style={contentParallaxStyle}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-7">
            {/* Eyebrow tag with shimmer */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-xs font-bold tracking-widest text-primary uppercase"
              style={{
                animation:
                  "slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Premium Off-Road Gear
            </div>

            {/* Split-text headline with word-by-word reveal */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.08]">
              {["Built", "For"].map((word, i) => (
                <span
                  key={word}
                  className="inline-block mr-[0.25em]"
                  style={{
                    animation: `word-reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${
                      200 + i * 120
                    }ms forwards`,
                    opacity: 0,
                  }}
                >
                  {word}
                </span>
              ))}
              <br className="sm:hidden" />
              <span
                className="inline-block"
                style={{
                  animation:
                    "word-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 450ms forwards",
                  opacity: 0,
                }}
              >
                <span
                  className="text-transparent bg-clip-text animate-gradient-shift"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, oklch(0.63 0.25 24), oklch(0.7 0.2 30), oklch(0.63 0.25 24), oklch(0.55 0.28 20))",
                    backgroundSize: "300% 100%",
                  }}
                >
                  The Wild
                </span>
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg"
              style={{
                animation:
                  "word-reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) 600ms forwards",
                opacity: 0,
              }}
            >
              Engineered accessories and limited-edition merch for the off-road
              lifestyle. Armor up. Stand out.
            </p>

            {/* CTA buttons with magnetic effect */}
            <div
              className="flex flex-wrap gap-4 pt-1"
              style={{
                animation:
                  "word-reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) 750ms forwards",
                opacity: 0,
              }}
            >
              <div
                onMouseMove={handleMagnetic}
                onMouseLeave={resetMagnetic}
                style={{
                  transform: `translate(${magneticOffset.x}px, ${magneticOffset.y}px)`,
                  transition: "transform 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)",
                }}
              >
                <Button
                  size="lg"
                  className="h-13 px-8 text-base shadow-xl shadow-primary/25 group cursor-pointer animate-pulse-glow"
                  asChild
                >
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2"
                  >
                    Shop Now
                    <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </Link>
                </Button>
              </div>
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-8 text-base border-border/60 bg-background/20 backdrop-blur-md hover:bg-background/40 cursor-pointer transition-all duration-300 hover:border-primary/40"
                asChild
              >
                <Link href="/products/car-accessories">
                  Explore Accessories
                </Link>
              </Button>
            </div>

            {/* Hero Stats Ticker */}
            <div
              className="flex flex-wrap gap-6 sm:gap-8 pt-4"
              style={{
                animation:
                  "word-reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) 900ms forwards",
                opacity: 0,
              }}
            >
              {heroStats.map((stat, i) => (
                <div key={stat.label} className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black text-foreground tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </span>
                  {i < heroStats.length - 1 && (
                    <span className="hidden sm:inline text-border/60 ml-4 select-none">
                      |
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide Indicators (when showing images) ── */}
      {!videoLoaded && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Mute/Unmute toggle ── */}
      {videoLoaded && (
        <button
          onClick={toggleMute}
          className="absolute bottom-6 right-6 z-30 size-10 rounded-full border border-border/60 bg-background/40 backdrop-blur-md text-foreground/80 hover:bg-background/60 hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
        </button>
      )}

      {/* ── Scroll indicator ── */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer group"
        aria-label="Scroll down"
      >
        <span className="text-[10px] font-bold tracking-widest uppercase">
          Scroll
        </span>
        <ChevronDown className="size-5 animate-bounce" />
      </button>
    </section>
  );
}
