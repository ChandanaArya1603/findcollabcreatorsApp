import React, { useEffect, useRef, useState } from "react";

const animated = new Set<string>();
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Animates from 0 to value once per app session (per id); background refreshes just swap the number. */
export const CountUp: React.FC<{ id: string; value: number; duration?: number; format?: (n: number) => string }> = ({
  id, value, duration = 600, format = (n) => Math.round(n).toLocaleString(),
}) => {
  const skip = animated.has(id) || prefersReducedMotion();
  const [shown, setShown] = useState(skip ? value : 0);
  const raf = useRef<number>();

  useEffect(() => {
    if (animated.has(id) || prefersReducedMotion()) { setShown(value); animated.add(id); return; }
    animated.add(id);
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [id, value, duration]);

  return <>{format(shown)}</>;
};

export const resetCountUps = () => animated.clear();
