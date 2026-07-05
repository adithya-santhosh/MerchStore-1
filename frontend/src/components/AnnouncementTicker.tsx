"use client";

import { useState } from "react";
import { X } from "lucide-react";

const messages = [
  "🔥 FREE SHIPPING ON ORDERS ABOVE ₹5,000",
  "🆕 NEW DROP EVERY FRIDAY",
  "🎟️ USE CODE LAUNCH10 FOR 10% OFF",
  "⭐ TRUSTED BY 10,000+ ENTHUSIASTS",
];

export default function AnnouncementTicker() {
  const [dismissed, setDismissed] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissing(true);
    setTimeout(() => setDismissed(true), 400);
  };

  // Duplicate messages for seamless infinite scroll
  const track = [...messages, ...messages];

  return (
    <div
      className={`relative w-full overflow-hidden z-[60] ${
        dismissing ? "animate-slide-up-out" : ""
      }`}
      style={{
        background:
          "linear-gradient(90deg, oklch(0.55 0.25 20), oklch(0.63 0.25 24), oklch(0.55 0.25 20))",
        backgroundSize: "200% 100%",
        animation: dismissing
          ? undefined
          : "ticker-gradient 4s linear infinite",
      }}
    >
      <div className="flex items-center h-8">
        {/* Scrolling track */}
        <div
          className="flex shrink-0 items-center gap-8 animate-marquee whitespace-nowrap"
          aria-label="Announcements"
        >
          {track.map((msg, i) => (
            <span
              key={i}
              className="text-[11px] sm:text-xs font-bold tracking-wide uppercase text-white flex items-center gap-6"
            >
              {msg}
              <span className="size-1 rounded-full bg-white/40 animate-pulse" />
            </span>
          ))}
        </div>
        {/* Duplicate for seamless loop */}
        <div
          className="flex shrink-0 items-center gap-8 animate-marquee whitespace-nowrap"
          aria-hidden="true"
        >
          {track.map((msg, i) => (
            <span
              key={`dup-${i}`}
              className="text-[11px] sm:text-xs font-bold tracking-wide uppercase text-white flex items-center gap-6"
            >
              {msg}
              <span className="size-1 rounded-full bg-white/40 animate-pulse" />
            </span>
          ))}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer z-10"
        aria-label="Dismiss announcements"
      >
        <X className="size-3.5 text-white" />
      </button>
    </div>
  );
}
