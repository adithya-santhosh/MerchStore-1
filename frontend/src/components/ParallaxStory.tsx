"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

interface StoryCard {
  image: string;
  eyebrow: string;
  headline: string;
}

const LEFT: StoryCard = {
  image: "/images/rally/story-suspension.jpg",
  eyebrow: "Built To Take It",
  headline: "Suspension tuned for the terrain that ends the trip early.",
};

const RIGHT: StoryCard[] = [
  {
    image: "/images/rally/story-recovery.jpg",
    eyebrow: "Ready For Anything",
    headline: "Waist-deep and still moving.",
  },
  {
    image: "/images/rally/story-climb.jpg",
    eyebrow: "Built To Climb",
    headline: "Every incline, every angle, every time.",
  },
];

function Card({
  card,
  imageY,
  textY,
  textOpacity,
  compact = false,
}: {
  card: StoryCard;
  imageY: MotionValue<string>;
  textY: MotionValue<string>;
  textOpacity: MotionValue<number>;
  compact?: boolean;
}) {
  return (
    <div className="relative h-[42vh] w-full overflow-hidden rounded-[2.5rem] border border-border/40 lg:h-full">
      <motion.div
        className="absolute inset-x-0 top-[-10%] h-[120%]"
        style={{ y: imageY }}
      >
        <img
          src={card.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-full w-full object-cover contrast-105 saturate-105"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className={`relative z-10 flex h-full flex-col items-end justify-end ${
          compact ? "p-6 sm:p-8" : "p-8 sm:p-12 lg:p-16"
        }`}
      >
        <span
          className={`mb-3 inline-flex items-center gap-2 rounded-full border border-primary-bright/40 bg-black/30 backdrop-blur-sm font-bold uppercase tracking-[0.3em] text-primary-bright ${
            compact ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs"
          }`}
        >
          {card.eyebrow}
        </span>
        <h2
          className={`max-w-2xl text-right font-black leading-[1.05] tracking-tight text-white [text-shadow:0_4px_24px_rgba(0,0,0,0.6)] ${
            compact
              ? "text-xl sm:text-2xl"
              : "text-3xl sm:text-5xl lg:text-6xl"
          }`}
        >
          {card.headline}
        </h2>
      </motion.div>
    </div>
  );
}

/**
 * Three-card story banner using real rally photography (Rainforest
 * Challenge India): one large card on the left, two stacked on the
 * right. All three share the same scroll-linked parallax drift and
 * text scrub so they read as one section rather than three unrelated
 * pieces.
 */
export default function ParallaxStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["32px", "-32px"]);
  const textOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    [0, 1, 1, 0]
  );

  return (
    <section ref={sectionRef} className="w-full bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:h-[75vh] lg:max-h-[820px] lg:grid-cols-2">
          <Card card={LEFT} imageY={imageY} textY={textY} textOpacity={textOpacity} />

          <div className="grid grid-rows-2 gap-6 lg:h-full">
            {RIGHT.map((card) => (
              <Card
                key={card.image}
                card={card}
                imageY={imageY}
                textY={textY}
                textOpacity={textOpacity}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
