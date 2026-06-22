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

  if (dismissed) return null;

  // Duplicate messages for seamless infinite scroll
  const track = [...messages, ...messages];

  return (
    <div className="relative w-full bg-primary text-primary-foreground overflow-hidden z-[60]">
      <div className="flex items-center h-8">
        {/* Scrolling track */}
        <div
          className="flex shrink-0 items-center gap-8 animate-marquee whitespace-nowrap"
          aria-label="Announcements"
        >
          {track.map((msg, i) => (
            <span
              key={i}
              className="text-[11px] sm:text-xs font-bold tracking-wide uppercase"
            >
              {msg}
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
              className="text-[11px] sm:text-xs font-bold tracking-wide uppercase"
            >
              {msg}
            </span>
          ))}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer z-10"
        aria-label="Dismiss announcements"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
