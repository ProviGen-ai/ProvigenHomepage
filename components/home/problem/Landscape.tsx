'use client';

import { useEffect, useRef } from 'react';
import { clamp01, easeOut } from '@/components/plate/kit';
import { useStage } from './ProblemScroll';
import { createScene, drawScene, type Layout, type Scene } from './draw';
import { FLOW_STOPS, PATH_TO, lerpStops } from './timeline';

/** Seconds the mesh takes to reveal, front to back. */
const INTRO_S = 1.9;

/*
 * Canvas island for the process landscape. Pinned, the picture is scrubbed by
 * scroll progress while the surface breathes and, once the path has landed, a
 * pulse travels it; in flow the same timeline plays once when it comes into
 * view. One figure clock drives everything that moves by itself: it advances
 * only while the figure is in view, on a visible tab, with motion allowed and
 * not paused with the stage's button (WCAG 2.2.2; the pause lives in the stage
 * context, so it holds the light, grain and cycling word too). Scroll still
 * scrubs a paused figure. Motion off draws the finished figure once (per size).
 * The canvas is the box's CSS size at up to 2× DPR, so hairlines stay hairlines.
 */
export default function Landscape({
  a,
  b,
  label: _label, // the hidden control's name
  description,
}: {
  a: string;
  b: string;
  /** What the control holds, for its name ("Pause the animation"). */
  label: string;
  description: string;
}) {
  const { progress, mode, still: stageStill, paused, setPaused: _setPaused } = useStage();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ progress, mode, paused });
  const nudge = useRef<() => void>(() => {});

  useEffect(() => {
    live.current = { progress, mode, paused };
    nudge.current();
  }, [progress, mode, paused]);

  useEffect(() => {
    const box = wrap.current;
    const el = canvas.current;
    if (!box || !el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const still = stageStill;
    let scene: Scene | null = null;
    let visible = false;
    let clock = 0;
    let last = -1;
    let introAt = -1;
    let playAt = -1;
    let doneAt = -1;
    let frame = 0;

    const render = () => {
      if (!scene) return;
      const intro = still ? 1 : introAt < 0 ? 0 : clamp01((clock - introAt) / INTRO_S);
      let p = 1;
      if (!still) {
        p =
          live.current.mode === 'pin'
            ? live.current.progress
            : playAt < 0
              ? 0
              : lerpStops(clock - playAt, FLOW_STOPS);
      }
      // the pulse counts from the moment the path lands (and resets if scrolled back)
      if (p >= PATH_TO) {
        if (doneAt < 0) doneAt = clock;
      } else doneAt = -1;
      drawScene(ctx, scene, {
        p,
        t: still ? 7.5 : clock,
        intro: easeOut(intro),
        since: doneAt < 0 ? -1 : clock - doneAt,
        still,
      });
    };

    const running = () => !still && visible && !live.current.paused && document.visibilityState === 'visible';
    const loop = (now: number) => {
      frame = 0;
      // 100 ms clamp: a dropped frame never makes the drawing jump
      clock += last < 0 ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;
      render();
      if (running()) frame = requestAnimationFrame(loop);
      else last = -1;
    };
    const kick = () => {
      if (running() && !frame) frame = requestAnimationFrame(loop);
    };
    // Scroll and pause changes while the loop is idle still need a frame.
    nudge.current = () => {
      if (!frame && scene) render();
      kick();
    };

    const resize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      el.width = Math.round(rect.width * dpr);
      el.height = Math.round(rect.height * dpr);
      ctx.setTransform(el.width / rect.width, 0, 0, el.height / rect.height, 0, 0);
      // Pinned (desktop), the camera stays low and level, as in the original
      // framing, for every window short of a true portrait; the high 'tall'
      // camera is for portrait screens (phones, tablets standing up).
      const ratio = rect.width / rect.height;
      const layout: Layout =
        live.current.mode === 'pin'
          ? ratio < 0.75
            ? 'tall'
            : 'wide'
          : ratio < 1.15
            ? 'tall'
            : 'band';
      scene = createScene(rect.width, rect.height, layout, { a, b });
      render();
    };
    resize();
    const sizer = new ResizeObserver(resize);
    sizer.observe(el);
    // the mono face may arrive after the first frame: redraw the labels when it does
    let alive = true;
    void document.fonts?.ready.then(() => alive && render());

    const watcher = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && introAt < 0) introAt = clock;
        // flow: the attempts start while the mesh is still settling (60% of the reveal)
        if (entry.intersectionRatio >= 0.35 && playAt < 0) playAt = Math.max(clock, introAt + INTRO_S * 0.6);
        kick();
      },
      { threshold: [0, 0.35] },
    );
    watcher.observe(box);
    const onVisibility = () => kick();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      frame = 0;
      nudge.current = () => {};
      sizer.disconnect();
      watcher.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [stageStill, a, b]);

  return (
    <>
      <div ref={wrap} className="p-landscape">
        <canvas ref={canvas} className="p-canvas" role="img" aria-label={description} />
      </div>
      {/* The Pause/Play control is hidden (founder, 14 Oct 2026). Kept below,
        commented out, to restore it.
      {/~ Under reduced motion the figure is a still: nothing to pause, no control.
        The name swaps with the state (as Build's loop control does), so no
        aria-pressed on top of it. ~/}
      {stageStill ? null : (
        <button
          type="button"
          className="p-ctl"
          aria-label={`${paused ? 'Play' : 'Pause'} ${label}`}
          onClick={() => setPaused(!paused)}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            {paused ? (
              <path d="M5 3.5v9l7.5-4.5z" fill="currentColor" />
            ) : (
              <path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" fill="currentColor" />
            )}
          </svg>
          <span>{paused ? 'Play' : 'Pause'}</span>
        </button>
      )}
      */}
    </>
  );
}
