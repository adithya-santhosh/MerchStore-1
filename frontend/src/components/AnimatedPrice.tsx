"use client";

import { useState, useEffect, useRef } from "react";

export default function AnimatedPrice({ price }: { price: number }) {
  const [displayPrice, setDisplayPrice] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const duration = 1200;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPrice(Math.floor(eased * price));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [price]);

  return <span className="tabular-nums font-black tracking-tight text-primary">₹{displayPrice.toLocaleString("en-IN")}</span>;
}
