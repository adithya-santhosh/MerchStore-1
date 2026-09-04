"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/**
 * Global inertia scroll. `root` mode attaches Lenis to the page's own
 * scroll rather than wrapping children in a scroll container, so it adds
 * no extra DOM and every existing sticky/fixed element keeps working.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        // lerp-damping only — NOT duration+easing. Lenis auto-fills a
        // default easing whenever duration is set, and duration+easing
        // takes priority over lerp when both are present, silently
        // dropping lerp for continuous wheel scrolling. A fixed-duration
        // curve retargeted many times a second (exactly what two-finger
        // trackpad scroll does) fights itself and can look stuck; lerp
        // damping re-targets cleanly every frame regardless of how often
        // new input arrives. duration is meant for one-shot scrollTo()
        // calls, not the global scroll animation.
        lerp: 0.1,
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
