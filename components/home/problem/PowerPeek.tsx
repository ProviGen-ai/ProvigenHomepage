'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMotion } from '@/components/motion/MotionProvider';
import { useStage } from './ProblemScroll';

/*
 * The arithmetic behind "3^10 = 59,049", as a hover card (founder, 3 Oct 2026:
 * a blinking arrow on the line; hovering opens a card, as on LessWrong, that
 * sits clear of everything else). It plays the line's own arithmetic as
 * exponential growth (4 Oct 2026): the whole grid stands from the start, ten
 * columns (the settings) of three dots (the values), every link between them
 * faint. One protocol, in teal, walks through it a column per step; at the
 * newest column its two other ways on show dashed, so each step reads as a
 * choice of three (the "×3" under it) and the count runs 3, 9, 27 … 59,049.
 * The founder preferred this dot-and-path figure to a bare growth curve, and
 * one path over a fixed grid to a growing lattice of sample paths. After a
 * hold on 3^10 the run fades out and comes back at 1 on a clear grid
 * (founder, 4 Oct 2026: base pace slower, and no fast loop out of nowhere).
 *
 * Open on hover (with a short intent delay, and it stays open while the
 * pointer is on the card), on keyboard focus, or on tap; a mouse click keeps
 * it open. Escape or leaving closes it, and so does its line going away (the
 * page scrolled past it, or the notes cleared for the solution). It is placed
 * beside the notes (right, then left) or else below or above them, never on
 * them; where neither has room it takes the roomier side and scrolls within.
 * It follows the trigger while the page scrolls, in viewport coordinates.
 * Reduced motion, or the stage's Pause, shows k = 10 (the line on the page)
 * without stepping.
 */
const SETTINGS = 10;
/** Values per setting, as on the line: three. */
const BASE = 3;
const KS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
/** The line on the page: ten settings. */
const OURS = SETTINGS;
/* 4 Oct 2026, the founder: base pace slower. 1.5× the first cut (800 / 1900 / 520 ms, draw-in 460 ms). */
const STEP_MS = 1200;
const HOLD_MS = 2900;
const COUNT_MS = 780;
/** The newest step drawing in; set inline over Problem.css's 460 ms so it keeps pace with STEP_MS. */
const DRAW_MS = 700;
/** The run fading out after the hold, and in again at 1. */
const FADE_MS = 600;
const CARD_W = 304;
/** Beside the notes the card may narrow to this before it moves elsewhere. */
const CARD_MIN = 216;
/** Until the card has rendered and can be measured. */
const CARD_H = 318;
const GAP = 20;
/** The one protocol traced through the grid: its value (0 top … 2 bottom) at each setting. Fixed, so the path only ever grows. */
const ROUTE = [1, 2, 0, 1, 1, 2, 0, 2, 1, 0] as const;

const fmt = (n: number) => n.toLocaleString('en-US');
/** Protocols with n settings of three values each. */
const pow = (n: number) => BASE ** n;

/** Where the card goes, in viewport px; `max` caps its height where no side has room for all of it. */
type Spot = { x: number; y: number; w: number; max?: number };

export default function PowerPeek() {
  const { paused: motionPaused } = useMotion();
  const { paused: stagePaused } = useStage();
  /* The stage's Pause holds the card too (WCAG 2.2.2), as it holds the rest of the stage. */
  const still = motionPaused || stagePaused;
  const [open, setOpen] = useState(false);
  const [k, setK] = useState(1);
  const [shown, setShown] = useState(1);
  /** The run is fading out between its hold on 3^10 and the next start. */
  const [fading, setFading] = useState(false);
  const [spot, setSpot] = useState<Spot | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** The card has been placed with its measured height since it opened. */
  const measured = useRef(false);
  /** How the trigger was last pressed: a mouse click keeps the card open, a tap or a key toggles it. */
  const pressed = useRef('');
  const id = useId();
  const kNow = still ? OURS : k;

  const later = (fn: () => void, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
  const show = () => later(() => setOpen(true), 120);
  const hide = () => later(() => setOpen(false), 220);

  /* Place the card in free space, in viewport px. */
  const place = useCallback(() => {
    const t = trigger.current;
    if (!t) return;
    const notes = t.closest('.p-head');
    const head = notes?.getBoundingClientRect();
    const r = t.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // the line is gone (scrolled off, not yet written, or cleared for the solution): close
    const faint = (node: Element | null | undefined) => !!node && Number(getComputedStyle(node).opacity) < 0.15;
    if (r.bottom < 0 || r.top > vh || faint(notes) || faint(t.closest('.p-w'))) {
      setOpen(false);
      return;
    }
    // its full height once rendered (it grows when it narrows beside the notes; scrollHeight still counts what a cap hides)
    const h = card.current?.scrollHeight || CARD_H;
    const top = 92;
    // inside the stage's corner frame: the page gutter (site.css --s-gutter) plus a little air
    const m = Math.min(64, Math.max(16, vw * 0.04)) + 12;
    const w = Math.min(CARD_W, vw - 2 * m);
    const yBeside = Math.min(Math.max(r.top - 18, top), vh - h - 12);
    if (head && vw >= 600) {
      const right = vw - m - (head.right + GAP);
      if (right >= CARD_MIN) {
        setSpot({ x: head.right + GAP, y: yBeside, w: Math.min(CARD_W, right) });
        return;
      }
      const rail = document.querySelector('.p-rail')?.getBoundingClientRect();
      const left = head.left - GAP - m;
      const wl = Math.min(CARD_W, left);
      const hitsRail = rail && rail.width > 0 && yBeside + h > rail.top - 12;
      if (wl >= CARD_MIN && !hitsRail) {
        setSpot({ x: head.left - GAP - wl, y: yBeside, w: wl });
        return;
      }
    }
    // below or above the notes, never on them; with no room for all of it, the roomier side, capped
    const x = Math.min(Math.max(r.right - w, m), vw - w - m);
    const below = (head ? head.bottom : r.bottom) + 16;
    const roomBelow = vh - 12 - below;
    const roomAbove = (head ? head.top : r.top) - 16 - top;
    if (h <= roomBelow) setSpot({ x, y: below, w });
    else if (h <= roomAbove) setSpot({ x, y: top + roomAbove - h, w });
    else if (roomBelow >= roomAbove) setSpot({ x, y: below, w, max: Math.max(roomBelow, 0) });
    else setSpot({ x, y: top, w, max: roomAbove });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    let frame = 0;
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    window.addEventListener('scroll', follow, { passive: true });
    window.addEventListener('resize', follow);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', follow);
      window.removeEventListener('resize', follow);
    };
  }, [open, place]);

  /* Once the card is on screen at its width, place it again with its measured height (once per opening). */
  useLayoutEffect(() => {
    if (!open) {
      measured.current = false;
      return;
    }
    if (spot && !measured.current) {
      measured.current = true;
      place();
    }
  }, [open, spot, place]);

  /* Step k while open: 1 → 10, hold, then the run fades out and comes back at
     1 on a clear grid, resting there a beat before it walks again (4 Oct
     2026, the founder: it used to snap from 59,049 to 3 in one frame and set
     off at once, which read as a fast loop out of nowhere). The first step
     resets to 1; closing or pausing leaves it at 1, unfaded. */
  useEffect(() => {
    if (!open || still) return;
    let step: ReturnType<typeof setTimeout>;
    const go = (n: number, rest = 0) => {
      setK(n);
      setFading(false);
      step = setTimeout(n < KS.length ? () => go(n + 1) : end, (n < KS.length ? STEP_MS : HOLD_MS) + rest);
    };
    const end = () => {
      setFading(true);
      step = setTimeout(() => go(1, FADE_MS), FADE_MS);
    };
    go(1);
    return () => {
      clearTimeout(step);
      setK(1);
      setFading(false);
    };
  }, [open, still]);

  /* Count the total up to the new power. At 1, and when still, there is
     nothing to count: the total is read straight off k (`count` below), so
     the frame before this effect runs never shows the last run's 59,049. */
  useEffect(() => {
    if (!open) return;
    const to = pow(kNow);
    const from = kNow === 1 || still ? to : pow(kNow - 1);
    let frame = 0;
    const t0 = performance.now();
    const run = (now: number) => {
      const u = Math.min(1, (now - t0) / COUNT_MS);
      const e = 1 - (1 - u) ** 3;
      setShown(Math.round(from + (to - from) * e));
      if (u < 1) frame = requestAnimationFrame(run);
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [open, kNow, still]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!card.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  /* The figure: the whole grid (ten columns of three values, every link
     between neighbours) from the start; the protocol through the first kNow
     columns, its newest step drawing in, with the two other ways it could
     have gone from there dashed. */
  const W = 272;
  const H = 128;
  const top = 12;
  const bottom = 96;
  const x = (c: number) => 10 + (c * (W - 20)) / (SETTINGS - 1);
  const y = (v: number) => top + (v * (bottom - top)) / (BASE - 1);
  const cols = KS.map((n) => n - 1);
  const links = cols.slice(1).flatMap((c) =>
    Array.from({ length: BASE * BASE }, (_, k) => [c, Math.floor(k / BASE), k % BASE] as const),
  );
  /** The newest setting, and the protocol's point in the column before it. */
  const last = kNow - 1;
  const from = last > 0 ? ([x(last - 1), y(ROUTE[last - 1])] as const) : null;
  const count = kNow === 1 || still ? pow(kNow) : shown;
  const draw = { animationDuration: `${DRAW_MS}ms` };
  const trail = cols
    .slice(0, last)
    .map((c) => `${x(c).toFixed(1)},${y(ROUTE[c]).toFixed(1)}`)
    .join(' ');

  const panel =
    open && spot
      ? createPortal(
          <div
            ref={card}
            id={id}
            role="dialog"
            aria-label="How the number of protocols grows"
            className="p-peek"
            style={{ left: spot.x, top: spot.y, width: spot.w, maxHeight: spot.max }}
            data-capped={spot.max !== undefined || undefined}
            onPointerEnter={show}
            onPointerLeave={hide}
          >
            {/* the run, faded out between its hold and the next start (a plain block: margins fall as before) */}
            <div className="p-peek-run" style={{ opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease` }}>
              <p className="p-peek-head" aria-hidden="true">
                {/* as wide as "10 settings" at every step, so the head wraps the same way throughout */}
                <span className="p-peek-count">
                  <span>
                    {kNow} setting{kNow === 1 ? '' : 's'}
                  </span>
                  <span className="p-peek-count-max">{SETTINGS} settings</span>
                </span>
                <span>{BASE} values each</span>
              </p>
              <p className="p-peek-sum" data-ours={kNow === OURS || undefined} aria-hidden="true">
                <span className="p-peek-pow">
                  {BASE}
                  <sup>{kNow}</sup>
                </span>
                <span className="p-peek-eq">=</span>
                <span className="p-peek-n">{fmt(count)}</span>
              </p>
              <svg className="p-peek-fig" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
                {/* the grid: every link faint, as a group, so where links cross they do not add up */}
                <g className="p-peek-links">
                  {links.map(([c, a, b]) => (
                    <line key={`${c}-${a}-${b}`} x1={x(c - 1)} y1={y(a)} x2={x(c)} y2={y(b)} className="p-peek-link" />
                  ))}
                </g>
                {/* the newest step's two other ways on, dashed: each setting is a choice of three */}
                {from
                  ? Array.from({ length: BASE }, (_, v) =>
                      v === ROUTE[last] ? null : (
                        <line
                          key={`f-${kNow}-${v}`}
                          x1={from[0]}
                          y1={from[1]}
                          x2={x(last)}
                          y2={y(v)}
                          className="p-peek-fork"
                          style={draw}
                        />
                      ),
                    )
                  : null}
                {/* the protocol: the steps taken, then the newest one drawing in */}
                {last > 1 ? <polyline points={trail} className="p-peek-path" /> : null}
                {from ? (
                  <line
                    key={`p-${kNow}`}
                    x1={from[0]}
                    y1={from[1]}
                    x2={x(last)}
                    y2={y(ROUTE[last])}
                    pathLength={1}
                    className="p-peek-path p-peek-path--new"
                    style={draw}
                  />
                ) : null}
                {cols.map((c) =>
                  Array.from({ length: BASE }, (_, v) => {
                    const on = c <= last && ROUTE[c] === v;
                    const state = c > last ? ' p-peek-dot--off' : c === last ? ' p-peek-dot--new' : '';
                    return (
                      <circle
                        key={`${c}-${v}`}
                        cx={x(c)}
                        cy={y(v)}
                        r={on ? 2.7 : 2.2}
                        className={`p-peek-dot${state}${on ? ' p-peek-dot--on' : ''}`}
                        style={c === last ? draw : undefined}
                      />
                    );
                  }),
                )}
                {/* the arithmetic under the columns: 3 × 3 × 3 … */}
                {cols.map((c) => (
                  <text
                    key={`m-${c}`}
                    x={x(c)}
                    y={H - 8}
                    className={`p-peek-times${c === last ? ' p-peek-times--new' : c > last ? ' p-peek-times--off' : ''}`}
                  >
                    {c === 0 ? BASE : `×${BASE}`}
                  </text>
                ))}
              </svg>
              <ol className="p-peek-scale" aria-hidden="true">
                {KS.map((n) => (
                  <li key={n} data-on={n === kNow || undefined} data-ours={n === OURS || undefined}>
                    {n}
                  </li>
                ))}
              </ol>
            </div>
            <p className="p-peek-note" aria-hidden="true">
              Each column is a setting, each dot a value. The teal line is one protocol, one dot per column; each setting triples the count.
            </p>
            <table className="s-sr">
              <caption>Possible protocols, three values per setting</caption>
              <tbody>
                {KS.map((n) => (
                  <tr key={n}>
                    <th scope="row">{`${n} setting${n === 1 ? '' : 's'}`}</th>
                    <td>{fmt(pow(n))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="p-peek-trigger"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label="Show how the number of protocols grows"
        onPointerEnter={(event) => event.pointerType === 'mouse' && show()}
        onPointerLeave={(event) => event.pointerType === 'mouse' && hide()}
        onFocus={show}
        onBlur={(event) => {
          if (!card.current?.contains(event.relatedTarget as Node)) hide();
        }}
        onPointerDown={(event) => {
          pressed.current = event.pointerType;
        }}
        onClick={() => {
          clearTimeout(timer.current);
          // hover has usually opened it already: a mouse click keeps it, a tap or a key toggles
          if (pressed.current === 'mouse') setOpen(true);
          else setOpen((value) => !value);
          pressed.current = '';
        }}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>
      {panel}
    </>
  );
}
