'use client';

import { useEffect, useRef, useState } from 'react';

/** The element's width in CSS pixels, so a figure can draw at its real size (1 px lines and text stay crisp). */
export function useWidth<T extends HTMLElement>(fallback: number, min = 240) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(min, Math.round(entry.contentRect.width))));
    ro.observe(node);
    return () => ro.disconnect();
  }, [min]);
  return { ref, w };
}
