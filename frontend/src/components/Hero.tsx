"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Cinematic fullscreen video hero.
 * Drop your video into `public/hero/tharherovideo.mp4`.
 * The first hero image is used as the poster/fallback while the video loads.
 */

const HERO_VIDEO = "/hero/tharherovideo.mp4";
const HERO_POSTER = "/hero/Thar-profender-2-suspension-3-rotated.webp";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= 3) {
      setIsLoaded(true);
      return;
    }

    const handleLoaded = () => setIsLoaded(true);
    video.addEventListener("loadeddata", handleLoaded);
    return () => video.removeEventListener("loadeddata", handleLoaded);
  }, []);

  const toggleMute = () => {
    if (!videoRef.current) return;
    // Both lines previously assigned the *current* value of isMuted, so the
    // button re-applied the existing state and never actually unmuted.
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight - 80,
      behavior: "smooth",
    });
  };

  return (
    <section
      className="relative w-full h-[85vh] sm:h-[92vh] min-h-[500px] max-h-[900px] overflow-hidden bg-background"
      aria-label="Hero"
    >
      {/* Poster still — this is the Largest Contentful Paint element.
          It must be a real <img> in the initial HTML, not a CSS
          background-image: the browser's preload scanner reads markup before
          stylesheets are applied, so a background URL isn't discovered until
          CSS parses, and it can't carry fetchPriority. Rendered unconditionally
          (rather than only while !isLoaded) so it's present in the very first
          HTML response, with the video fading in over it once ready. */}
      <img
        src={HERO_POSTER}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Background Video.
          preload="metadata" rather than "auto": autoPlay already fetches what
          it needs to begin, so this avoids committing a mobile visitor to
          downloading the entire file before playback starts. */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster={HERO_POSTER}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        preload="metadata"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>

      {/* Gradient overlays. Hardcoded black rather than tokens: the video
          is a deliberately dark cinematic "window" regardless of whether
          the surrounding page theme is light or dark — blending it toward
          a light --background would just fog it out. */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />

      {/* Content overlay */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-6">
            {/* Eyebrow tag */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-bright/40 bg-black/30 backdrop-blur-sm text-xs font-bold tracking-widest text-primary-bright uppercase animate-in fade-in slide-in-from-bottom-2 duration-700"
            >
              <span className="size-1.5 rounded-full bg-primary-bright animate-pulse" />
              Premium Off-Road Gear
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: "150ms" }}
            >
              Built For{" "}
              <span className="text-primary-bright">The Wild</span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-base sm:text-lg lg:text-xl text-white/75 leading-relaxed max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: "300ms" }}
            >
              Engineered accessories and limited-edition merch for the
              off-road lifestyle. Armor up. Stand out.
            </p>

            {/* CTA buttons */}
            <div
              className="flex flex-wrap gap-4 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: "450ms" }}
            >
              <Button
                size="lg"
                className="h-13 px-8 text-base shadow-xl shadow-black/30 group cursor-pointer"
                asChild
              >
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2"
                >
                  Shop Now
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-8 text-base border-white/30 bg-black/20 text-white backdrop-blur-sm hover:bg-black/40 hover:text-white cursor-pointer"
                asChild
              >
                <Link href="/products/car-accessories">
                  Explore Accessories
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mute/Unmute toggle */}
      <button
        onClick={toggleMute}
        className="absolute bottom-6 right-6 z-30 size-10 rounded-full border border-white/30 bg-black/40 backdrop-blur-md text-white/80 hover:bg-black/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        aria-label={isMuted ? "Unmute video" : "Mute video"}
      >
        {isMuted ? (
          <VolumeX className="size-4" />
        ) : (
          <Volume2 className="size-4" />
        )}
      </button>

      {/* Scroll indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer group"
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

