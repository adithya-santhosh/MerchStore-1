"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import {
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { Button } from "@/components/ui/button";

const HERO_VIDEO = "/hero/rig-turntable.mp4";

const readouts = [
  { label: "GROUND CLEARANCE", value: "+65mm" },
  { label: "LOAD RATED", value: "4.2T" },
  { label: "FIELD TESTED", value: "180K km" },
];

function ScrubbedRig({ heroRef }: { heroRef: React.RefObject<HTMLElement | null> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();

    const setStaticFrame = () => {
      if (video.duration) video.currentTime = video.duration * 0.2;
    };

    if (shouldReduceMotion) {
      if (video.readyState >= 1) setStaticFrame();
      else video.addEventListener("loadedmetadata", setStaticFrame, { once: true });
    }
  }, [shouldReduceMotion]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const video = videoRef.current;
    if (!video || shouldReduceMotion || !video.duration) return;
    video.currentTime = Math.min(latest, 1) * video.duration;
  });

  return (
    <video
      ref={videoRef}
      src={HERO_VIDEO}
      muted
      playsInline
      preload="auto"
      className="w-full h-full object-cover"
      aria-hidden="true"
    />
  );
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={heroRef}
      className="relative w-full min-h-[640px] sm:min-h-[720px] overflow-hidden bg-background blueprint-grid"
      aria-label="Hero"
    >
      {/* Radial glow */}
      <div className="absolute -top-1/3 right-0 w-[60%] aspect-square bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[40%] aspect-square bg-accent/5 rounded-full blur-3xl" />

      {/* Scanning sweep line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-scan" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-8 items-center">
          {/* Left: Copy */}
          <div className="space-y-7 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm border border-primary/30 bg-primary/10 text-[11px] font-bold tracking-[0.2em] text-primary uppercase animate-in fade-in slide-in-from-bottom-2 duration-700">
              <span className="size-1.5 bg-primary animate-pulse" />
              Engineered In-House
            </div>

            <h1
              className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-tight text-foreground leading-[0.95] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: "120ms" }}
            >
              Gear That
              <br />
              Holds The{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Line
              </span>
            </h1>

            <p
              className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: "260ms" }}
            >
              Armor, lighting, recovery and overland systems designed for
              real terrain and built to outlast the warranty. No filler
              merch — just parts that earn their mount points.
            </p>

            <div
              className="flex flex-wrap gap-4 pt-1 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: "380ms" }}
            >
              <Button size="lg" className="h-13 px-8 text-base clip-corner group cursor-pointer" asChild>
                <Link href="/products" className="inline-flex items-center gap-2">
                  Shop The Catalog
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-8 text-base clip-corner cursor-pointer"
                asChild
              >
                <Link href="/products/car-accessories">Browse Categories</Link>
              </Button>
            </div>

            {/* Technical readouts */}
            <div
              className="flex flex-wrap gap-6 pt-6 border-t border-border/50 mt-2 animate-in fade-in duration-700 fill-mode-both"
              style={{ animationDelay: "500ms" }}
            >
              {readouts.map((r) => (
                <div key={r.label} className="space-y-0.5">
                  <p className="font-mono text-[10px] tracking-widest text-muted-foreground">{r.label}</p>
                  <p className="font-heading text-xl font-semibold text-foreground">{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Scroll-scrubbed rig video */}
          <div
            className="relative corner-brackets aspect-video animate-in fade-in duration-1000 fill-mode-both"
            style={{ animationDelay: "200ms" }}
          >
            <div className="absolute inset-0 border border-border/40 bg-card/20 overflow-hidden">
              <ScrubbedRig heroRef={heroRef} />
            </div>
            <span className="absolute top-3 left-3 font-mono text-[10px] tracking-widest text-muted-foreground bg-background/70 px-2 py-1 z-10">
              SCROLL TO ROTATE
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() =>
          window.scrollTo({ top: window.innerHeight - 80, behavior: "smooth" })
        }
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer"
        aria-label="Scroll down"
      >
        <span className="font-mono text-[10px] font-bold tracking-widest uppercase">Scroll</span>
        <ChevronDown className="size-5 animate-bounce" />
      </button>
    </section>
  );
}
