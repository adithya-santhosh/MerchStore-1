"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

interface Feature {
  label: string;
  title: string;
  description: string;
  image: string;
}

const FEATURES: Feature[] = [
  {
    label: "01 — Suspension",
    title: "Absorbs the terrain, not your spine.",
    description:
      "Long-travel dampers and progressive coil setups tuned for washboard trails and rock crawls alike.",
    image: "/images/rally/pinned-suspension.jpg",
  },
  {
    label: "02 — Recovery",
    title: "Ready for the moment things go sideways.",
    description:
      "Kinetic ropes, traction boards and winch-ready mounts — packed for the day the trail wins.",
    image: "/images/rally/pinned-recovery.jpg",
  },
  {
    label: "03 — Proven",
    title: "Tested on the trail, not just in a lab.",
    description:
      "Every build here has actually crossed the mud, the ridgeline and the rain — not just a spec sheet.",
    image: "/images/rally/pinned-proven.jpg",
  },
];

// Where each feature's "active" window sits along the pin's scroll range.
function windowFor(index: number, total: number) {
  return { start: index / total, end: (index + 1) / total };
}

function ImageLayer({
  feature,
  index,
  total,
  scrollYProgress,
}: {
  feature: Feature;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const { start, end } = windowFor(index, total);
  const opacity = useTransform(
    scrollYProgress,
    [
      Math.max(0, start - 0.06),
      start + 0.06,
      end - 0.06,
      Math.min(1, end + 0.06),
    ],
    [index === 0 ? 1 : 0, 1, 1, index === total - 1 ? 1 : 0]
  );

  return (
    <motion.img
      src={feature.image}
      alt={feature.title}
      loading="lazy"
      style={{ opacity }}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function TextLayer({
  feature,
  index,
  total,
  scrollYProgress,
}: {
  feature: Feature;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const { start, end } = windowFor(index, total);
  const opacity = useTransform(
    scrollYProgress,
    [start, start + 0.12, end - 0.12, end],
    [0.25, 1, 1, 0.25]
  );

  return (
    <motion.div style={{ opacity }} className="max-w-lg">
      <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary-bright">
        {feature.label}
      </span>
      <h3 className="mt-3 text-2xl font-black leading-tight text-foreground sm:text-3xl">
        {feature.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {feature.description}
      </p>
    </motion.div>
  );
}

// A point sits exactly on the curve at these path coordinates (see the
// `d=` below) — keep in sync if the path changes.
const CURVE_POINTS_PERCENT = [10, 50, 90];

function CurveDot({
  index,
  total,
  topPercent,
  scrollYProgress,
}: {
  index: number;
  total: number;
  topPercent: number;
  scrollYProgress: MotionValue<number>;
}) {
  const { start, end } = windowFor(index, total);
  const scale = useTransform(
    scrollYProgress,
    [start, start + 0.12, end - 0.12, end],
    [0.7, 1.2, 1.2, 0.7]
  );
  const opacity = useTransform(
    scrollYProgress,
    [start, start + 0.12, end - 0.12, end],
    [0.35, 1, 1, 0.35]
  );

  return (
    <motion.div
      style={{ top: `${topPercent}%`, scale, opacity }}
      className="absolute left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-bright shadow-[0_0_10px_rgba(0,0,0,0.5)]"
    />
  );
}

/**
 * Decorative S-curve running down the gap between image and text,
 * touching each feature's point. A dim track shows the full curve up
 * front; a brighter overlay draws itself in as you scroll through the
 * pin, and each dot lights up while its feature is active.
 */
function CurvePath({
  total,
  scrollYProgress,
}: {
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const d = "M50,10 C95,10 95,45 50,50 C5,55 5,90 50,90";

  return (
    <div className="relative hidden w-16 self-stretch lg:block">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
      >
        <path
          d={d}
          stroke="var(--color-border)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        <motion.path
          d={d}
          stroke="var(--color-primary-bright)"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          style={{ pathLength }}
        />
      </svg>
      {CURVE_POINTS_PERCENT.map((topPercent, i) => (
        <CurveDot
          key={topPercent}
          index={i}
          total={total}
          topPercent={topPercent}
          scrollYProgress={scrollYProgress}
        />
      ))}
    </div>
  );
}

/**
 * Pin-and-scrub storytelling on desktop: the image stays pinned while
 * three text blocks scroll past beside it, each highlighting as it takes
 * focus. That only works with image and text side by side — stacked (as
 * they'd have to be on a narrow screen), the combined content is taller
 * than one screen, and the pinned wrapper would just clip it. So below
 * `lg:` this renders as a plain stacked flow instead of trying to force
 * the pin effect into a layout it doesn't fit.
 *
 * The sticky wrapper sits `top-20`/`h-[calc(100dvh-5rem)]` rather than
 * `top-0`/`h-dvh`: the site's own header is ALSO sticky at top-0 with a
 * higher z-index, so it visually covers whatever the pin centers into
 * the full viewport height. Centering math was already symmetric — it
 * was being centered into space the header was covering, which read as
 * "stuck to the top". Excluding the header's height (5rem, its `lg:`
 * size) from the pin's own box fixes that without touching the header.
 *
 * The `lg:h-[300dvh]` below is FEATURES.length * 100dvh, hardcoded
 * (rather than templated) because Tailwind can't statically discover a
 * class name assembled at runtime — update it if FEATURES changes size.
 */
export default function PinnedStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const n = FEATURES.length;

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-background lg:h-[300dvh]"
    >
      {/* Mobile / tablet: simple stacked flow, one feature after another. */}
      <div className="flex flex-col gap-16 px-4 py-16 sm:px-6 lg:hidden">
        {FEATURES.map((feature) => (
          <div key={feature.label} className="space-y-6">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-border/40">
              <img
                src={feature.image}
                alt={feature.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary-bright">
                {feature.label}
              </span>
              <h3 className="mt-3 text-2xl font-black leading-tight text-foreground">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: pin-and-scrub. */}
      <div className="hidden w-full items-center overflow-hidden lg:sticky lg:top-20 lg:flex lg:h-[calc(100dvh-5rem)]">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] border border-border/40">
            {FEATURES.map((feature, i) => (
              <ImageLayer
                key={feature.image}
                feature={feature}
                index={i}
                total={n}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>

          <CurvePath total={n} scrollYProgress={scrollYProgress} />

          <div className="flex flex-col gap-10">
            {FEATURES.map((feature, i) => (
              <TextLayer
                key={feature.label}
                feature={feature}
                index={i}
                total={n}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
