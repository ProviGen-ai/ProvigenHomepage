'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { useStage } from './ProblemScroll';

/*
 * One word in a swap line that cycles through a list ("your cells", "your
 * bioprocess", …). The word lifts out, the slot eases to the next word's width
 * so the rest of the line glides instead of jumping, and the next word rises
 * in. Reduced motion keeps the first word; the stage's Pause control, or the
 * word leaving the screen, holds the current one (WCAG 2.2.2). Screen readers
 * get the first word once; the cycling copy is hidden from them so nothing is
 * re-announced.
 */
const FADE_MS = 220;

export default function RotatingWord({
  words,
  interval,
}: {
  words: readonly string[];
  interval: number;
}) {
  const { paused } = useMotion();
  const { paused: stagePaused } = useStage();
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(true);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const slot = useRef<HTMLSpanElement>(null);
  const sizer = useRef<HTMLSpanElement>(null);

  const animated = !paused && words.length > 1;
  const cycling = animated && !stagePaused && inView;
  const current = animated ? index : 0;

  useEffect(() => {
    const node = root.current;
    if (!node || !animated) return;
    const watcher = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    watcher.observe(node);
    return () => watcher.disconnect();
  }, [animated]);

  useEffect(() => {
    if (!cycling) return;
    const tick = setInterval(() => {
      setShown(false);
      // Not cancelled by a pause: a word already lifting out still lands, so
      // the slot is never left empty.
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setShown(true);
      }, FADE_MS);
    }, interval);
    return () => clearInterval(tick);
  }, [cycling, words.length, interval]);

  /* Size the slot to the incoming word, measured in the same type, before paint
     (rounded up, so the last letter is never clipped); again whenever the type
     itself resizes (the notes scale with the window). A still word needs no
     explicit width. */
  useLayoutEffect(() => {
    const box = slot.current;
    const measure = sizer.current;
    if (!box || !measure) return;
    if (!animated) {
      box.style.width = '';
      return;
    }
    const fit = () => {
      box.style.width = `${Math.ceil(measure.getBoundingClientRect().width)}px`;
    };
    fit();
    const watcher = new ResizeObserver(fit);
    watcher.observe(measure);
    return () => watcher.disconnect();
  }, [current, animated]);

  const word = words[current];
  return (
    <span ref={root} className="p-rot">
      <span className="s-sr">{words[0]}</span>
      <span
        ref={slot}
        className="p-rot-slot"
        aria-hidden="true"
        data-exit={!shown || undefined}
      >
        {/* Keyed by word: each new word mounts and plays its entrance. */}
        <span key={word} className="p-rot-word">
          {word}
        </span>
      </span>
      <span ref={sizer} className="p-rot-sizer" aria-hidden="true">
        {word}
      </span>
    </span>
  );
}
