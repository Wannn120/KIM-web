"use client";

import { useCallback, useEffect, useState } from "react";

export function useCarousel(count: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % count), 3000);
    return () => window.clearInterval(timer);
  }, [count]);

  const previous = useCallback(() => {
    setActiveIndex((current) => (current - 1 + count) % count);
  }, [count]);

  const next = useCallback(() => {
    setActiveIndex((current) => (current + 1) % count);
  }, [count]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        next();
      }
      if (event.key === "ArrowLeft") {
        previous();
      }
    },
    [next, previous]
  );

  return { activeIndex, setActiveIndex, previous, next, handleKeyDown };
}
