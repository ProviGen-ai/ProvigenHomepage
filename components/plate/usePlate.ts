'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Ctx } from './kit';

/*
 * The plate runtime: one canvas, drawn every frame from a clock, sharp at any
 * size. The figure draws in a fixed logical space (its layout), which is
 * scaled uniformly to the canvas's CSS width, at the screen's own device pixel
 * ratio up to 2 (up to 3 on canvases under 600 CSS px, i.e. phones, where a 2x
 * store would be scaled up and blur), and capped so the backing store never
 * passes MAX_BACKING px wide.
 *
 * The clock only advances while `running` (in view, visible tab, motion
 * allowed, not paused by the figure's own button). It accumulates real time
 * with a 100 ms clamp, so a dropped frame never makes the drawing jump. With
 * motion off (`allowed` false) the figure is drawn once, at `stillAt`.
 *
 * The figure's draw function is read through a ref, so it can close over
 * React state without restarting the loop.
 */

export type PlateLayout = {
  /** Logical width and height the figure draws in. */
  readonly w: number;
  readonly h: number;
  /** Optional layout key the draw function can branch on ('wide', 'narrow', ...). */
  readonly key?: string;
};

export type PlateFrame = {
  /** Seconds of figure time (paused time does not count). */
  readonly t: number;
  /** Seconds since the previous drawn frame (0 on a still or forced redraw). */
  readonly dt: number;
  readonly layout: PlateLayout;
  /** CSS px per logical px. */
  readonly scale: number;
  /**
   * Backing-store px per logical px (scale times the store's DPR), for
   * snapping to whole pixels. It equals device px per logical px whenever the
   * store's DPR is the screen's (every screen up to DPR 2, phones up to 3).
   */
  readonly px: number;
  /** Motion is allowed (false under prefers-reduced-motion: draw the settled state). */
  readonly moving: boolean;
};

export type PlateDraw = (ctx: Ctx, frame: PlateFrame) => void;

const MAX_DPR = 2;
/** Phones (canvas under PHONE_W CSS px) get their full DPR up to 3: a 360 px plate at 3x is about 1080 px wide. */
const MAX_DPR_PHONE = 3;
const PHONE_W = 600;
const MAX_BACKING = 2816;

export function usePlate({
  layout,
  draw,
  running,
  allowed,
  stillAt = 0,
}: {
  /** Pick the logical layout for a CSS width (called on every resize). */
  layout: (cssWidth: number) => PlateLayout;
  draw: PlateDraw;
  /** Advance the clock (allowed, in view, page visible, not paused). */
  running: boolean;
  /** Motion allowed at all (false: draw one still frame at stillAt). */
  allowed: boolean;
  /** Figure time of the still frame shown when motion is not allowed. */
  stillAt?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  const layoutRef = useRef(layout);
  const tRef = useRef(stillAt);
  const sizeRef = useRef<{ layout: PlateLayout; scale: number; cssW: number } | null>(null);
  const [current, setCurrent] = useState<PlateLayout | null>(null);
  const allowedRef = useRef(allowed);
  const stillRef = useRef(stillAt);

  useEffect(() => {
    drawRef.current = draw;
    layoutRef.current = layout;
    allowedRef.current = allowed;
    stillRef.current = stillAt;
  });

  /** Draw one frame now at the current clock (or at stillAt with motion off). */
  const paint = useCallback((dt = 0) => {
    const cv = canvasRef.current;
    const size = sizeRef.current;
    if (!cv || !size) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const { layout: L, scale } = size;
    const d = cv.width / (L.w * scale);
    ctx.setTransform(d * scale, 0, 0, d * scale, 0, 0);
    ctx.clearRect(0, 0, L.w, L.h);
    const moving = allowedRef.current;
    drawRef.current(ctx, {
      t: moving ? tRef.current : stillRef.current,
      dt,
      layout: L,
      scale,
      px: d * scale,
      moving,
    });
  }, []);

  /* Fit the backing store to the CSS box; re-pick the layout on resize. */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const fit = () => {
      const cssW = cv.parentElement?.clientWidth || cv.clientWidth;
      if (!cssW) return;
      const L = layoutRef.current(cssW);
      const scale = cssW / L.w;
      // Whole CSS pixels: Chrome snaps a canvas box to them, so a fractional
      // height (1200×440 at 845 px is 309.8) stretched the image by a row and
      // softened every hairline below it. The drawing keeps the uniform scale;
      // at most half a pixel of the store stays unused at the foot.
      const cssH = Math.round(L.h * scale);
      let dpr = Math.min(window.devicePixelRatio || 1, cssW < PHONE_W ? MAX_DPR_PHONE : MAX_DPR);
      dpr = Math.min(dpr, MAX_BACKING / cssW);
      const bw = Math.round(cssW * dpr);
      const bh = Math.round(cssH * dpr);
      if (cv.width !== bw) cv.width = bw;
      if (cv.height !== bh) cv.height = bh;
      // the box takes the layout's shape (CSS --pl-ratio only covers the first paint)
      if (cv.parentElement) cv.parentElement.style.aspectRatio = `${cssW} / ${cssH}`;
      cv.style.width = `${cssW}px`;
      cv.style.height = `${cssH}px`;
      const prev = sizeRef.current?.layout;
      sizeRef.current = { layout: L, scale, cssW };
      if (!prev || prev.w !== L.w || prev.h !== L.h || prev.key !== L.key) setCurrent(L);
      paint();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv.parentElement ?? cv);
    // the mono face may arrive after the first frame: redraw when it does
    let alive = true;
    void document.fonts?.ready.then(() => alive && paint());
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [paint]);

  /* The clock. */
  useEffect(() => {
    if (!running || !allowed) {
      paint();
      return;
    }
    let raf = 0;
    let last = -1;
    const tick = (now: number) => {
      const dt = last < 0 ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;
      tRef.current += dt;
      paint(dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, allowed, paint]);

  /** Map a pointer position to logical coordinates. */
  const toLogical = useCallback((clientX: number, clientY: number) => {
    const cv = canvasRef.current;
    const size = sizeRef.current;
    if (!cv || !size) return null;
    const r = cv.getBoundingClientRect();
    return { x: (clientX - r.left) / size.scale, y: (clientY - r.top) / size.scale };
  }, []);

  return {
    canvasRef,
    /** The figure clock in seconds; set it to seek (then call redraw if not running). */
    timeRef: tRef,
    /** Current logical layout (null before the first fit). */
    layout: current,
    redraw: paint,
    toLogical,
  };
}
