'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';

/*
 * The film (ProviGen in 66 seconds). Since 4 Oct 2026 it simply plays (the
 * founder: no frame, no play button, "spiel es immer ab"): muted, looping and
 * inline, from the moment it is in view, paused when it leaves. No captions
 * on the picture (founder, 4 Oct 2026: "remove the CC"); the transcript stays
 * on the page. Two small controls in its
 * corner: Pause (WCAG 2.2.2, it runs longer than five seconds) and Sound.
 * Nothing loads before it first plays (preload="none").
 * Under reduced motion it does not start by itself: the poster shows, with
 * the section heading set over it, and Play starts it.
 *
 * The section heading (the film's opening line) is set in HTML over the
 * poster; while the film plays, which carries the line itself, it stays in
 * the document, visually hidden.
 */

export default function FilmPlayer({
  src,
  poster,
  title,
  heading,
  labels,
}: {
  src: string;
  poster: string;
  title: string;
  /** The section's h2, laid over the poster. */
  heading?: ReactNode;
  labels: { pause: string; play: string; soundOn: string; soundOff: string };
}) {
  const { paused: still } = useMotion();
  const video = useRef<HTMLVideoElement>(null);
  /** The film is running (from the element's own play/pause events). */
  const [running, setRunning] = useState(false);
  /** The visitor paused it (or, under reduced motion, has not started it). */
  const [held, setHeld] = useState(false);
  const [muted, setMuted] = useState(true);
  const stopped = held || (still && !running);

  /* Play while a quarter of it is in view, pause out of it. */
  useEffect(() => {
    const node = video.current;
    if (!node) return;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.25 && !stopped) {
          node.muted = muted;
          node.play().catch(() => {});
        } else if (entry.intersectionRatio < 0.25) node.pause();
      },
      { threshold: [0, 0.25] },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, [stopped, muted]);

  useEffect(() => {
    const node = video.current;
    if (node) node.muted = muted;
  }, [muted]);

  const toggle = () => {
    const node = video.current;
    if (!node) return;
    if (running) {
      node.pause();
      setHeld(true);
    } else {
      setHeld(false);
      node.muted = muted;
      node.play().catch(() => {});
    }
  };

  return (
    <>
      {heading ? <div className={running ? 's-sr' : 'in-film-head'}>{heading}</div> : null}
      <video
        ref={video}
        className="in-film-video"
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={title}
        onPlay={() => setRunning(true)}
        onPause={() => setRunning(false)}
      />
      <div className="in-film-ctl">
        <button type="button" className="in-film-btn" onClick={toggle}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            {running ? <path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" /> : <path d="M5 3.5v9l7.5-4.5z" />}
          </svg>
          {running ? labels.pause : labels.play}
        </button>
        <button type="button" className="in-film-btn" aria-pressed={!muted} onClick={() => setMuted(!muted)}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 6h2.5L9 3.5v9L5.5 10H3z" />
            {muted ? (
              <path d="M11 6l3 4M14 6l-3 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
            ) : (
              <path d="M11 5.5c1 .7 1.5 1.6 1.5 2.5s-.5 1.8-1.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            )}
          </svg>
          {muted ? labels.soundOn : labels.soundOff}
        </button>
      </div>
    </>
  );
}
