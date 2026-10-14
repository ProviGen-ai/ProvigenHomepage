'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';

/**
 * Progress (0..1) of a tall element scrolling through the viewport, for sticky
 * set-pieces. Also written to the element as --p so CSS can use it directly,
 * and as --q, the same measure before clamping at the start: negative while
 * the element is still rising into the viewport (down to -viewport/range when
 * its top is at the viewport's foot), so a piece can begin on the way in.
 *
 * Gated exactly like useInViewMotion: the scroll and resize listeners and the
 * rAF measure exist only while the element is in view, the tab is visible, the
 * caller says `active`, and site motion is on (no prefers-reduced-motion).
 * Outside that window nothing is registered at all, rather than registered
 * and skipped.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  active = true,
) {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const { paused: sitePaused } = useMotion();

  // Observe the element itself, plus the tab, so the scrub gate matches the
  // one every other figure on the site uses.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      // A little margin so the first measure is in before the piece is reached.
      { rootMargin: '20% 0px' },
    );
    observer.observe(node);
    const updatePage = () =>
      setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', updatePage);
    updatePage();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updatePage);
    };
  }, []);

  const running = active && visible && pageVisible && !sitePaused;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (sitePaused) {
      // Reduced motion means the set-piece shows its finished state, so pin the
      // progress readout and its rail to the end instead of a stale mid-scrub.
      // (The returned value is derived below rather than set here, so this
      // effect only ever writes to the DOM.)
      node.style.setProperty('--p', '1');
      node.style.setProperty('--q', '1');
      return;
    }
    if (!running) return;
    let frame = 0;
    let last = -1;
    const measure = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      const raw = range > 0 ? -rect.top / range : rect.top < 0 ? 1 : 0;
      const lead = range > 0 ? Math.min(1, Math.max(-window.innerHeight / range, raw)) : raw;
      if (Math.abs(lead - last) < 0.002) return;
      last = lead;
      const next = Math.min(1, Math.max(0, raw));
      node.style.setProperty('--p', next.toFixed(3));
      node.style.setProperty('--q', lead.toFixed(4));
      setProgress(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [running, sitePaused]);

  return { ref, progress: sitePaused ? 1 : progress };
}
