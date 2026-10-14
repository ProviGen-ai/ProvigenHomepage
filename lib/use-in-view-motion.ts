'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';

/**
 * Motion gate for a figure: runs only while allowed (no prefers-reduced-motion),
 * in view, on a visible tab, and not paused with the figure's own Pause button.
 */
export function useInViewMotion<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.12,
) {
  const ref = useRef<T>(null);
  const { paused: sitePaused } = useMotion();
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold },
    );
    if (node) observer.observe(node);
    const updatePage = () =>
      setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', updatePage);
    updatePage();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updatePage);
    };
  }, [threshold]);

  const allowed = !sitePaused;
  return {
    ref,
    paused,
    setPaused,
    allowed,
    running: allowed && visible && pageVisible && !paused,
  };
}
