import React, { useEffect, useRef, useState } from "react";

/** Renders children only once the placeholder scrolls near the viewport. */
export const LazySection: React.FC<{ children: React.ReactNode; minHeight?: number }> = ({ children, minHeight = 120 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (visible || !ref.current) return;
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setVisible(true); io.disconnect(); } }, { rootMargin: "150px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);
  return <div ref={ref} style={visible ? undefined : { minHeight }}>{visible ? children : null}</div>;
};
