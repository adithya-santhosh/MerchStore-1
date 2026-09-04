"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const ITEMS = [
  { label: "Water Crossing", image: "/images/rally/trail-water-crossing.jpg" },
  { label: "Mud Run", image: "/images/rally/trail-mud-run.jpg" },
  { label: "Summit Climb", image: "/images/rally/trail-summit-climb.jpg" },
  { label: "Recovery Line", image: "/images/rally/trail-recovery-line.jpg" },
  { label: "Deep Woods", image: "/images/rally/trail-deep-woods.jpg" },
  { label: "The Crew", image: "/images/rally/trail-crew.jpg" },
];

/**
 * Vertical scroll drives a horizontally-scrolling strip while the section
 * stays pinned — the row's actual overflow is measured so the strip lands
 * exactly on its last card regardless of viewport width.
 */
export default function HorizontalGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    function measure() {
      if (!trackRef.current) return;
      const overflow = trackRef.current.scrollWidth - trackRef.current.clientWidth;
      setScrollDistance(overflow > 0 ? overflow : 0);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, (progress) => -progress * scrollDistance);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-background"
      style={{ height: "300dvh" }}
    >
      <div className="sticky top-0 flex h-dvh flex-col justify-center overflow-hidden">
        <div className="mx-auto mb-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary-bright">
            From The Trail
          </span>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-5xl">
            Real rigs. Real mud. Real miles.
          </h2>
        </div>

        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex gap-6 pl-4 sm:pl-6 lg:pl-8"
        >
          {ITEMS.map((item) => (
            <div
              key={item.label}
              className="relative h-[50vh] w-[70vw] shrink-0 overflow-hidden rounded-[2rem] border border-border/40 sm:w-[38vw] lg:w-[26vw]"
            >
              <img
                src={item.image}
                alt={item.label}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-6 left-6 text-lg font-black uppercase tracking-wide text-white">
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
